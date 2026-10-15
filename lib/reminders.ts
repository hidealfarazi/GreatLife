/**
 * lib/reminders.ts
 * "Pengingat deadline": local notifications 4 hours and 1 hour before the deadline of every
 * unfinished, non-archived task. No push server, so:
 * - Browsers with Notification Triggers (TimestampTrigger, feature-detected) get the
 *   notifications scheduled ahead of time, and they fire even when the app is closed.
 * - Everywhere else the app checks on open, when it becomes visible again, and every
 *   minute while it is open. Reminders that were missed while closed fire on the next open
 *   (once, as the most urgent one).
 * Each task + threshold + deadline is notified at most once; the log is saved via lib/repo.ts.
 */
import {
  getRemindersSent,
  getSettings,
  listAssignments,
  markRemindersSent,
  subscribeRepo,
  updateSettings,
  ensureRepoReady,
} from "./repo";
import { isIos, isStandalone } from "./pwa";
import type { Assignment } from "./types";

const HOUR = 3600000;
/** Hours before the deadline, most urgent last. */
const THRESHOLDS = [4, 1] as const;
const TAG_PREFIX = "deadline-";
const CHECK_EVERY_MS = 60000;
/** Log entries older than this are dropped. */
const KEEP_LOG_MS = 7 * 24 * HOUR;

// ---------- feature detection ----------

interface TimestampTriggerConstructor {
  new (timestamp: number): object;
}
type TriggerNotificationOptions = NotificationOptions & { showTrigger?: object };
type GetTriggeredOptions = GetNotificationOptions & { includeTriggered?: boolean };

export type ReminderPermission = NotificationPermission | "unsupported";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getReminderPermission(): ReminderPermission {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

function getTimestampTrigger(): TimestampTriggerConstructor | null {
  if (!notificationsSupported() || !("showTrigger" in Notification.prototype)) return null;
  const ctor = (globalThis as unknown as { TimestampTrigger?: TimestampTriggerConstructor }).TimestampTrigger;
  return typeof ctor === "function" ? ctor : null;
}

export function triggersSupported(): boolean {
  return getTimestampTrigger() !== null;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return (await navigator.serviceWorker.getRegistration()) ?? null;
  } catch {
    return null;
  }
}

// ---------- switching on / off ----------

export type EnableResult =
  | { ok: true }
  | { ok: false; reason: "unsupported" | "ios-install" | "denied" | "dismissed" };

/** Asks for permission (from a click) and saves the setting. */
export async function enableReminders(): Promise<EnableResult> {
  if (!notificationsSupported()) {
    // iPhone/iPad: notifications only exist in the installed app (iOS 16.4+).
    return { ok: false, reason: isIos() && !isStandalone() ? "ios-install" : "unsupported" };
  }
  let permission = Notification.permission;
  if (permission === "default") permission = await Notification.requestPermission();
  if (permission === "denied") return { ok: false, reason: "denied" };
  if (permission !== "granted") return { ok: false, reason: "dismissed" };
  updateSettings({ reminders: true });
  void syncReminders();
  return { ok: true };
}

export async function disableReminders(): Promise<void> {
  updateSettings({ reminders: false });
  await cancelScheduled(new Set());
}

// ---------- scheduling ----------

const reminderKey = (taskId: string, hours: number, dueMs: number) => `${taskId}|${hours}|${dueMs}`;

const pad = (n: number) => String(n).padStart(2, "0");

function remainingText(ms: number): string {
  const totalMin = Math.max(1, Math.round(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} menit`;
  return m === 0 ? `${h} jam` : `${h} jam ${m} menit`;
}

function notificationContent(task: Assignment, dueMs: number, remainingMs: number, key: string, hours: number) {
  const due = new Date(dueMs);
  const title = `Tenggat ${remainingText(remainingMs)} lagi`;
  const options: TriggerNotificationOptions = {
    body: `${task.subject} · ${task.title} — tenggat ${pad(due.getHours())}:${pad(due.getMinutes())}`,
    tag: `${TAG_PREFIX}${task.id}-${hours}`,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    lang: "id",
    data: { url: `/pr/${encodeURIComponent(task.id)}`, key },
  };
  return { title, options };
}

async function showNow(title: string, options: TriggerNotificationOptions): Promise<void> {
  const reg = await getRegistration();
  if (reg) {
    await reg.showNotification(title, options);
    return;
  }
  // Dev builds have no service worker: plain notification, click opens the task.
  const n = new Notification(title, options);
  const url = (options.data as { url?: string } | undefined)?.url ?? "/";
  n.onclick = () => {
    window.focus();
    window.location.href = url;
  };
}

/** Closes scheduled (not yet shown) trigger notifications whose key is not wanted anymore. */
async function cancelScheduled(wanted: Set<string>): Promise<void> {
  if (!triggersSupported()) return;
  const reg = await getRegistration();
  if (!reg) return;
  const opts: GetTriggeredOptions = { includeTriggered: true };
  const list = await reg.getNotifications(opts);
  list.forEach((n) => {
    const key = (n.data as { key?: unknown } | null)?.key;
    if (n.tag.startsWith(TAG_PREFIX) && (typeof key !== "string" || !wanted.has(key))) n.close();
  });
}

let syncing: Promise<void> | null = null;

/** Checks every active task and shows / schedules what is due. Safe to call often. */
export function syncReminders(): Promise<void> {
  if (!syncing) {
    syncing = runSync()
      .catch((err: unknown) => console.warn("[reminders] sync failed", err))
      .finally(() => {
        syncing = null;
      });
  }
  return syncing;
}

async function runSync(): Promise<void> {
  await ensureRepoReady();
  if (!getSettings().reminders || getReminderPermission() !== "granted") return;

  const now = Date.now();
  const sent = getRemindersSent();
  const Trigger = getTimestampTrigger();
  const reg = Trigger ? await getRegistration() : null;
  const wanted = new Set<string>();
  const toMark: string[] = [];

  const active = listAssignments().filter((a) => a.status !== "done" && !a.archivedAt);
  for (const task of active) {
    const dueMs = new Date(task.dueAt).getTime();
    if (!Number.isFinite(dueMs) || dueMs <= now) continue;

    const reached: number[] = THRESHOLDS.filter((h) => now >= dueMs - h * HOUR);
    if (reached.length > 0) {
      // Only the most urgent reached threshold is shown; the others count as sent too.
      const hours = Math.min(...reached);
      const key = reminderKey(task.id, hours, dueMs);
      if (!sent[key]) {
        const { title, options } = notificationContent(task, dueMs, dueMs - now, key, hours);
        await showNow(title, options);
      }
      reached.forEach((h) => toMark.push(reminderKey(task.id, h, dueMs)));
    }

    // Future thresholds: schedule them ahead where the browser supports triggers.
    if (Trigger && reg) {
      for (const h of THRESHOLDS) {
        if (reached.includes(h)) continue;
        const key = reminderKey(task.id, h, dueMs);
        wanted.add(key);
        if (sent[key]) continue;
        const fireAt = dueMs - h * HOUR;
        const { title, options } = notificationContent(task, dueMs, h * HOUR, key, h);
        const scheduled: TriggerNotificationOptions = { ...options, showTrigger: new Trigger(fireAt) };
        await reg.showNotification(title, scheduled);
        toMark.push(key);
      }
    }
  }

  if (Trigger) await cancelScheduled(wanted);
  markRemindersSent(Array.from(new Set(toMark.filter((k) => !sent[k]))), now, now - KEEP_LOG_MS);
}

// ---------- loop while the app is open ----------

/** Starts checking on open, on visibilitychange, every minute and after data changes. */
export function startReminderLoop(): () => void {
  let debounce: ReturnType<typeof setTimeout> | null = null;
  // Also runs while the tab is in the background (the browser may slow the timer down).
  const check = () => {
    void syncReminders();
  };
  const onRepoChange = () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(check, 1000);
  };
  check();
  const timer = setInterval(check, CHECK_EVERY_MS);
  document.addEventListener("visibilitychange", check);
  const unsubscribe = subscribeRepo(onRepoChange);
  return () => {
    clearInterval(timer);
    if (debounce) clearTimeout(debounce);
    document.removeEventListener("visibilitychange", check);
    unsubscribe();
  };
}
