/**
 * lib/db.ts
 * Tiny promise wrapper around native IndexedDB (no dependency).
 * Database "belajar". Only lib/repo.ts should import this file.
 *
 * Schema history (bump DB_VERSION and add a step in `upgrade` for every change):
 *   v1 — object stores: assignments, checklist, checkpoints, materials (keyPath "id")
 *        and kv (free keys: settings, caches, progress flags).
 */

export const DB_NAME = "belajar";
export const DB_VERSION = 1;

export const STORES = ["assignments", "checklist", "checkpoints", "materials", "kv"] as const;
export type StoreName = (typeof STORES)[number];
export type RecordStore = Exclude<StoreName, "kv">;

export type WriteOp =
  | { store: RecordStore; type: "put"; value: { id: string } }
  | { store: RecordStore; type: "delete"; key: string }
  | { store: "kv"; type: "put"; key: string; value: unknown }
  | { store: "kv"; type: "delete"; key: string }
  | { store: StoreName; type: "clear" };

/** Runs schema upgrades step by step, so any old version can reach the newest one. */
function upgrade(db: IDBDatabase, oldVersion: number): void {
  if (oldVersion < 1) {
    db.createObjectStore("assignments", { keyPath: "id" });
    const checklist = db.createObjectStore("checklist", { keyPath: "id" });
    checklist.createIndex("parentId", "parentId", { unique: false });
    db.createObjectStore("checkpoints", { keyPath: "id" });
    db.createObjectStore("materials", { keyPath: "id" });
    db.createObjectStore("kv");
  }
  // Future: if (oldVersion < 2) { ... }
}

export function isIndexedDbAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (!isIndexedDbAvailable()) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => upgrade(req.result, event.oldVersion);
    req.onsuccess = () => {
      const db = req.result;
      // Another tab opened a newer schema: close so its upgrade can continue.
      db.onversionchange = () => {
        db.close();
        dbPromise = null;
      };
      resolve(db);
    };
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onblocked = () => reject(new Error("IndexedDB upgrade blocked by another tab"));
  });
  dbPromise.catch(() => {
    dbPromise = null;
  });
  return dbPromise;
}

function requestToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function getAll<T>(store: RecordStore): Promise<T[]> {
  const db = await openDb();
  return requestToPromise(db.transaction(store, "readonly").objectStore(store).getAll() as IDBRequest<T[]>);
}

/** Reads every kv entry as a plain object. */
export async function getAllKv(): Promise<Record<string, unknown>> {
  const db = await openDb();
  const store = db.transaction("kv", "readonly").objectStore("kv");
  const [keys, values] = await Promise.all([requestToPromise(store.getAllKeys()), requestToPromise(store.getAll())]);
  const out: Record<string, unknown> = {};
  keys.forEach((k, i) => {
    out[String(k)] = values[i];
  });
  return out;
}

/** Applies all operations in ONE transaction (all succeed or none do). */
export async function write(ops: WriteOp[]): Promise<void> {
  if (ops.length === 0) return;
  const db = await openDb();
  const names = Array.from(new Set(ops.map((o) => o.store)));
  const tx = db.transaction(names, "readwrite");
  for (const op of ops) {
    const store = tx.objectStore(op.store);
    if (op.type === "clear") store.clear();
    else if (op.type === "delete") store.delete(op.key);
    else if (op.store === "kv") store.put(op.value, op.key);
    else store.put(op.value);
  }
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted"));
  });
}
