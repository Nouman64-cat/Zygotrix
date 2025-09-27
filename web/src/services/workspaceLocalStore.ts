import type {
  ProjectLine,
  ProjectLinePayload,
  ProjectLineSnapshot,
} from "../types/api";

const DB_NAME = "zygotrix-workspace";
const DB_VERSION = 2;
const LINE_STORE = "workspace_lines";
const META_STORE = "workspace_meta";

export type StoredLineRecord = ProjectLine;

type ProjectMetaRecord = {
  project_id: string;
  dirty: boolean;
  snapshot_version?: number;
  updated_at?: string;
};

let dbPromise: Promise<IDBDatabase> | null = null;

const resetDatabase = async (db?: IDBDatabase): Promise<void> => {
  try {
    db?.close();
  } catch (error) {
    console.warn("Failed to close existing workspace DB", error);
  }

  dbPromise = null;

  await new Promise<void>((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);
    deleteRequest.onsuccess = () => resolve();
    deleteRequest.onerror = () =>
      reject(deleteRequest.error ?? new Error("Failed to delete workspace DB"));
    deleteRequest.onblocked = () =>
      reject(new Error("Failed to delete workspace DB: operation blocked"));
  });
};

const openDatabase = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(LINE_STORE)) {
          const lineStore = db.createObjectStore(LINE_STORE, { keyPath: "id" });
          lineStore.createIndex("project_id", "project_id", { unique: false });
          lineStore.createIndex(
            "project_updated_at",
            ["project_id", "updated_at"],
            { unique: false }
          );
        }
        if (!db.objectStoreNames.contains(META_STORE)) {
          db.createObjectStore(META_STORE, { keyPath: "project_id" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;

        const hasLineStore = db.objectStoreNames.contains(LINE_STORE);
        const hasMetaStore = db.objectStoreNames.contains(META_STORE);

        if (!hasLineStore || !hasMetaStore) {
          resetDatabase(db)
            .then(() => openDatabase().then(resolve).catch(reject))
            .catch(reject);
          return;
        }

        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
    });
  }

  return dbPromise;
};

const withStore = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  handler: (store: IDBObjectStore, tx: IDBTransaction) => void,
  attempt: number = 0
): Promise<T> => {
  const db = await openDatabase();

  try {
    return await new Promise<T>((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(storeName, mode);
      } catch (error) {
        reject(error);
        return;
      }

      const store = tx.objectStore(storeName);

      tx.oncomplete = () =>
        resolve((tx as unknown as { result?: T }).result as T);
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB transaction error"));
      tx.onabort = () =>
        reject(tx.error ?? new Error("IndexedDB transaction aborted"));

      handler(store, tx);
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      error.name === "NotFoundError" &&
      attempt < 1
    ) {
      await resetDatabase(db);
      await openDatabase();
      return withStore(storeName, mode, handler, attempt + 1);
    }
    throw error;
  }
};

const readMeta = async (projectId: string): Promise<ProjectMetaRecord | undefined> => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, "readonly");
    const store = tx.objectStore(META_STORE);
    const request = store.get(projectId);

    request.onsuccess = () => resolve(request.result as ProjectMetaRecord | undefined);
    request.onerror = () => reject(request.error ?? new Error("Failed to read metadata"));
  });
};

const writeMeta = async (
  meta: ProjectMetaRecord
): Promise<void> =>
  withStore<void>(META_STORE, "readwrite", (store) => {
    store.put(meta);
  });

export const markProjectDirty = async (projectId: string): Promise<void> => {
  const existing = await readMeta(projectId);
  await writeMeta({
    project_id: projectId,
    dirty: true,
    snapshot_version: existing?.snapshot_version,
    updated_at: new Date().toISOString(),
  });
};

export const clearProjectDirty = async (
  projectId: string,
  snapshotVersion?: number
): Promise<void> => {
  const existing = await readMeta(projectId);
  await writeMeta({
    project_id: projectId,
    dirty: false,
    snapshot_version: snapshotVersion ?? existing?.snapshot_version ?? 0,
    updated_at: new Date().toISOString(),
  });
};

export const setSnapshotVersion = async (
  projectId: string,
  snapshotVersion: number
): Promise<void> => {
  const existing = await readMeta(projectId);
  await writeMeta({
    project_id: projectId,
    dirty: existing?.dirty ?? false,
    snapshot_version: snapshotVersion,
    updated_at: new Date().toISOString(),
  });
};

export const isProjectDirty = async (projectId: string): Promise<boolean> => {
  const meta = await readMeta(projectId);
  return Boolean(meta?.dirty);
};

export const getStoredLines = async (
  projectId: string,
  options: { includeDeleted?: boolean } = {}
): Promise<StoredLineRecord[]> => {
  const includeDeleted = options.includeDeleted ?? true;
  const db = await openDatabase();

  const readLines = () =>
    new Promise<StoredLineRecord[]>((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(LINE_STORE, "readonly");
      } catch (error) {
        reject(error);
        return;
      }

      const store = tx.objectStore(LINE_STORE);
      const index = store.index("project_id");
      const request = index.openCursor(IDBKeyRange.only(projectId));
      const records: StoredLineRecord[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(records);
          return;
        }
        const value = cursor.value as StoredLineRecord;
        if (includeDeleted || !value.is_deleted) {
          records.push(value);
        }
        cursor.continue();
      };

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read lines"));
    });

  try {
    return await readLines();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      await resetDatabase(db);
      await openDatabase();
      return getStoredLines(projectId, options);
    }
    throw error;
  }
};

export const upsertStoredLine = async (line: StoredLineRecord): Promise<void> =>
  withStore<void>(LINE_STORE, "readwrite", (store) => {
    store.put(line);
  });

export const upsertManyLines = async (
  lines: StoredLineRecord[]
): Promise<void> =>
  withStore<void>(LINE_STORE, "readwrite", (store) => {
    for (const line of lines) {
      store.put(line);
    }
  });

export const replaceProjectLines = async (
  projectId: string,
  lines: StoredLineRecord[]
): Promise<void> =>
  withStore<void>(LINE_STORE, "readwrite", (store, tx) => {
    const index = store.index("project_id");
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }

      for (const line of lines) {
        store.put(line);
      }
    };

    request.onerror = () => tx.abort();
  });

export const getLinesForSave = async (
  projectId: string
): Promise<ProjectLinePayload[]> => {
  const lines = await getStoredLines(projectId, { includeDeleted: true });
  return lines.map((line) => ({
    id: line.id,
    start_point: line.start_point,
    end_point: line.end_point,
    stroke_color: line.stroke_color,
    stroke_width: line.stroke_width,
    arrow_type: line.arrow_type,
    is_deleted: line.is_deleted,
    updated_at: line.updated_at,
    version: line.version,
    origin: line.origin,
  }));
};

export const recordServerSnapshot = async (
  projectId: string,
  snapshot: ProjectLineSnapshot
): Promise<void> => {
  await replaceProjectLines(projectId, snapshot.lines);
  await setSnapshotVersion(projectId, snapshot.snapshot_version);
  await clearProjectDirty(projectId, snapshot.snapshot_version);
};

const DEVICE_ID_KEY = "zygotrix_device_id";

export const ensureDeviceId = (): string => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) {
    return existing;
  }
  const generated = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
};
