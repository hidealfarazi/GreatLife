/**
 * components/SheetSettings.tsx
 * Controls in the "Lainnya" sheet (BottomNav):
 * - SwitchRow:      a labelled Nyala/Mati switch (Atmosfer, Pengingat deadline)
 * - InstallSection: "Pasang aplikasi" (browser prompt, or iOS instructions; hidden when installed)
 * - ReminderRow:    "Pengingat deadline" switch + permission handling (lib/reminders.ts)
 * - BackupSection:  "Cadangan data" — Ekspor / Impor a JSON backup (lib/repo.ts)
 * All messages are inline (no alert()/confirm()).
 */
"use client";

import { useId, useRef, useState } from "react";
import { exportBackup, getSettings, getStorageMode, readBackupFile, restoreBackup } from "@/lib/repo";
import type { ParsedBackup } from "@/lib/backup";
import { useRepo } from "@/lib/useRepo";
import { promptInstall, useInstallState } from "@/lib/pwa";
import {
  disableReminders,
  enableReminders,
  getReminderPermission,
  triggersSupported,
  type ReminderPermission,
} from "@/lib/reminders";
import { Button } from "@/components/ui/Button";

type Tone = "muted" | "alert";

function Note({ children, tone = "muted", id }: { children: React.ReactNode; tone?: Tone; id?: string }) {
  return (
    <p id={id} className="rn-sheet-note" data-tone={tone}>
      {children}
    </p>
  );
}

// ==========================================
// Switch row
// ==========================================

export function SwitchRow({
  title,
  description,
  checked,
  onToggle,
  busy = false,
  children,
}: {
  title: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
  busy?: boolean;
  /** Extra inline content under the row (messages). */
  children?: React.ReactNode;
}) {
  const id = useId();
  return (
    <div className="rn-sheet-row" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
        <div>
          <div id={`${id}-label`} style={{ fontWeight: 600, fontSize: "1rem" }}>
            {title}
          </div>
          <div id={`${id}-desc`} className="rn-label" style={{ marginTop: "0.25rem", letterSpacing: "0.06em", textTransform: "none" }}>
            {description}
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={`${id}-label`}
          aria-describedby={`${id}-desc`}
          aria-busy={busy || undefined}
          disabled={busy}
          className="rn-switch"
          onClick={onToggle}
        >
          <span className="rn-switch-track" aria-hidden="true">
            <span className="rn-switch-thumb" />
          </span>
          <span style={{ minWidth: "2.75em", textAlign: "left" }}>{checked ? "Nyala" : "Mati"}</span>
        </button>
      </div>
      {children}
    </div>
  );
}

// ==========================================
// Pasang aplikasi
// ==========================================

export function InstallSection() {
  const state = useInstallState();
  const [message, setMessage] = useState<string | null>(null);

  // Hidden on the server render and when already running as the installed app.
  if (state === null || state === "installed") return null;

  return (
    <section className="rn-sheet-section" aria-labelledby="rn-install-title">
      <div>
        <h3 id="rn-install-title" style={{ fontWeight: 600, fontSize: "1rem" }}>
          Pasang aplikasi
        </h3>
        <p className="rn-label" style={{ marginTop: "0.25rem", letterSpacing: "0.06em", textTransform: "none" }}>
          Buka dari layar utama, tetap jalan saat offline
        </p>
      </div>
      {state === "prompt" && (
        <div>
          <Button
            variant="secondary"
            onClick={async () => {
              const accepted = await promptInstall();
              setMessage(accepted ? null : "Pemasangan dibatalkan. Kamu bisa mencobanya lagi nanti.");
            }}
          >
            Pasang aplikasi
          </Button>
        </div>
      )}
      {state === "ios" && (
        <Note>
          Di Safari, ketuk <strong style={{ color: "var(--rn-text)" }}>Bagikan</strong> →{" "}
          <strong style={{ color: "var(--rn-text)" }}>Tambahkan ke Layar Utama</strong>.
        </Note>
      )}
      {state === "manual" && (
        <Note>Buka menu browser, lalu pilih “Instal aplikasi” atau “Tambahkan ke layar utama”.</Note>
      )}
      {message && (
        <div role="status">
          <Note>{message}</Note>
        </div>
      )}
    </section>
  );
}

// ==========================================
// Pengingat deadline
// ==========================================

const DENIED_TEXT = "Izin notifikasi diblokir. Buka pengaturan situs di browser, izinkan Notifikasi, lalu nyalakan lagi.";

export function ReminderRow() {
  const enabled = useRepo(() => getSettings().reminders) ?? false;
  // The sheet only renders after a click, so reading the permission here is client-only.
  const [permission, setPermission] = useState<ReminderPermission>(() => getReminderPermission());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(null);

  const checked = enabled && permission === "granted";

  const toggle = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (checked) {
        await disableReminders();
        return;
      }
      const result = await enableReminders();
      setPermission(getReminderPermission());
      if (!result.ok) {
        const text =
          result.reason === "denied"
            ? DENIED_TEXT
            : result.reason === "dismissed"
              ? "Izin notifikasi belum diberikan. Coba nyalakan lagi."
              : result.reason === "ios-install"
                ? "Di iPhone, pasang aplikasi ke Layar Utama dulu, lalu nyalakan pengingat dari sana."
                : "Browser ini belum mendukung notifikasi.";
        setMessage({ text, tone: "alert" });
      }
    } finally {
      setBusy(false);
    }
  };

  const showDenied = !message && enabled && permission === "denied";

  return (
    <SwitchRow
      title="Pengingat deadline"
      description="4 jam dan 1 jam sebelum tenggat"
      checked={checked}
      busy={busy}
      onToggle={toggle}
    >
      <div role="status" aria-live="polite">
        {message && <Note tone={message.tone}>{message.text}</Note>}
        {showDenied && <Note tone="alert">{DENIED_TEXT}</Note>}
        {checked && !message && (
          <Note>
            {triggersSupported()
              ? "Dijadwalkan di perangkat ini, tetap muncul walau aplikasi ditutup."
              : "Muncul selama aplikasi atau browser masih berjalan. Yang terlewat muncul saat kamu membuka aplikasi lagi."}
          </Note>
        )}
      </div>
    </SwitchRow>
  );
}

// ==========================================
// Cadangan data
// ==========================================

function backupFileName(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `belajar-cadangan-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

function formatExportedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "tanggal tidak diketahui";
  return d.toLocaleString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function BackupSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLParagraphElement>(null);
  const [pending, setPending] = useState<ParsedBackup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: Tone } | null>(null);
  const memoryOnly = useRepo(() => getStorageMode() === "memory") ?? false;

  const handleExport = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const backup = await exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = backupFileName();
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ text: `Cadangan diunduh: ${backup.data.assignments.length} tugas, ${backup.data.materials.length} materi.`, tone: "muted" });
    } catch {
      setMessage({ text: "Ekspor gagal. Coba lagi.", tone: "alert" });
    } finally {
      setBusy(false);
    }
  };

  const handleFile = async (file: File | undefined) => {
    setMessage(null);
    setPending(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: "File terlalu besar untuk cadangan Belajar.", tone: "alert" });
      return;
    }
    const result = readBackupFile(await file.text());
    if (!result.ok) {
      setMessage({ text: result.error, tone: "alert" });
      return;
    }
    setPending(result.backup);
    // Move focus to the confirmation so keyboard / screen-reader users hear it.
    requestAnimationFrame(() => confirmRef.current?.focus());
  };

  const handleConfirm = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await restoreBackup(pending);
      setMessage({ text: `Data dipulihkan: ${pending.assignments.length} tugas, ${pending.materials.length} materi.`, tone: "muted" });
      setPending(null);
    } catch {
      setMessage({ text: "Impor gagal. Data lama tidak diubah.", tone: "alert" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rn-sheet-section" aria-labelledby="rn-backup-title">
      <div>
        <h3 id="rn-backup-title" style={{ fontWeight: 600, fontSize: "1rem" }}>
          Cadangan data
        </h3>
        <p className="rn-label" style={{ marginTop: "0.25rem", letterSpacing: "0.06em", textTransform: "none" }}>
          Data tersimpan di perangkat ini dan bisa hilang jika data browser dihapus
        </p>
      </div>

      {memoryOnly && (
        <Note tone="alert">Penyimpanan perangkat tidak tersedia di browser ini. Data hanya sementara, jadi rutin ekspor cadangan.</Note>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Button variant="secondary" onClick={handleExport} disabled={busy}>
          Ekspor
        </Button>
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
          Impor
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="rn-visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            void handleFile(e.target.files?.[0]);
            e.target.value = ""; // allow picking the same file again
          }}
        />
      </div>

      {pending && (
        <div role="group" aria-labelledby="rn-import-confirm" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <p id="rn-import-confirm" ref={confirmRef} tabIndex={-1} style={{ fontSize: "0.9375rem", lineHeight: 1.5, color: "var(--rn-text)", outline: "none" }}>
            Timpa semua data di perangkat ini dengan cadangan dari {formatExportedAt(pending.exportedAt)}? Isinya{" "}
            {pending.assignments.length} tugas dan {pending.materials.length} materi. Data yang sekarang akan hilang.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Button variant="primary" onClick={handleConfirm} disabled={busy}>
              {busy ? "Memulihkan…" : "Ya, timpa data"}
            </Button>
            <Button variant="secondary" onClick={() => setPending(null)} disabled={busy}>
              Batal
            </Button>
          </div>
        </div>
      )}

      <div role="status" aria-live="polite">
        {message && <Note tone={message.tone}>{message.text}</Note>}
      </div>
    </section>
  );
}
