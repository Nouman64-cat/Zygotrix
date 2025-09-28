import type {
  ProjectDrawing,
  ProjectDrawingPayload,
  ProjectDrawingSnapshot,
  ProjectLine,
  ProjectLinePayload,
  ProjectLineSnapshot,
  ProjectNote,
  ProjectNotePayload,
  ProjectNoteSnapshot,
} from "../types/api";

const DB_NAME = "zygotrix-workspace";
const DB_VERSION = 3;
const LINE_STORE = "workspace_lines";
const NOTE_STORE = "workspace_notes";
const DRAWING_STORE = "workspace_drawings";
const META_STORE = "workspace_meta";

export type StoredLineRecord = ProjectLine;
export type StoredNoteRecord = ProjectNote;
export type StoredDrawingRecord = ProjectDrawing;

type ProjectMetaRecord = {
  project_id: string;
  lines_dirty?: boolean;
  notes_dirty?: boolean;
  drawings_dirty?: boolean;
  line_snapshot_version?: number;
  note_snapshot_version?: number;
  drawing_snapshot_version?: number;
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
        if (!db.objectStoreNames.contains(NOTE_STORE)) {
          const noteStore = db.createObjectStore(NOTE_STORE, { keyPath: "id" });
          noteStore.createIndex("project_id", "project_id", { unique: false });
          noteStore.createIndex(
            "project_updated_at",
            ["project_id", "updated_at"],
            { unique: false }
          );
        }
        if (!db.objectStoreNames.contains(DRAWING_STORE)) {
          const drawingStore = db.createObjectStore(DRAWING_STORE, {
            keyPath: "id",
          });
          drawingStore.createIndex("project_id", "project_id", { unique: false });
          drawingStore.createIndex(
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
        const hasNoteStore = db.objectStoreNames.contains(NOTE_STORE);
        const hasDrawingStore = db.objectStoreNames.contains(DRAWING_STORE);
        const hasMetaStore = db.objectStoreNames.contains(META_STORE);

        if (!hasLineStore || !hasNoteStore || !hasDrawingStore || !hasMetaStore) {
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

const writeMeta = async (meta: ProjectMetaRecord): Promise<void> =>
  withStore<void>(META_STORE, "readwrite", (store) => {
    store.put(meta);
  });

const updateMeta = async (
  projectId: string,
  updater: (existing: ProjectMetaRecord | undefined) => ProjectMetaRecord
): Promise<void> => {
  const existing = await readMeta(projectId);
  const next = updater(existing);
  await writeMeta({
    project_id: projectId,
    ...existing,
    ...next,
    updated_at: new Date().toISOString(),
  });
};

export const markLinesDirty = async (projectId: string): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    lines_dirty: true,
  }));
};

export const clearLinesDirty = async (
  projectId: string,
  snapshotVersion?: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    lines_dirty: false,
    line_snapshot_version:
      snapshotVersion ?? existing?.line_snapshot_version ?? 0,
  }));
};

export const setLineSnapshotVersion = async (
  projectId: string,
  snapshotVersion: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    line_snapshot_version: snapshotVersion,
  }));
};

export const areLinesDirty = async (projectId: string): Promise<boolean> => {
  const meta = await readMeta(projectId);
  return Boolean(meta?.lines_dirty);
};

export const markNotesDirty = async (projectId: string): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    notes_dirty: true,
  }));
};

export const clearNotesDirty = async (
  projectId: string,
  snapshotVersion?: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    notes_dirty: false,
    note_snapshot_version:
      snapshotVersion ?? existing?.note_snapshot_version ?? 0,
  }));
};

export const setNoteSnapshotVersion = async (
  projectId: string,
  snapshotVersion: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    note_snapshot_version: snapshotVersion,
  }));
};

export const areNotesDirty = async (projectId: string): Promise<boolean> => {
  const meta = await readMeta(projectId);
  return Boolean(meta?.notes_dirty);
};

export const markDrawingsDirty = async (projectId: string): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    drawings_dirty: true,
  }));
};

export const clearDrawingsDirty = async (
  projectId: string,
  snapshotVersion?: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    drawings_dirty: false,
    drawing_snapshot_version:
      snapshotVersion ?? existing?.drawing_snapshot_version ?? 0,
  }));
};

export const setDrawingSnapshotVersion = async (
  projectId: string,
  snapshotVersion: number
): Promise<void> => {
  await updateMeta(projectId, (existing) => ({
    ...existing,
    drawing_snapshot_version: snapshotVersion,
  }));
};

export const areDrawingsDirty = async (projectId: string): Promise<boolean> => {
  const meta = await readMeta(projectId);
  return Boolean(meta?.drawings_dirty);
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

export const recordLineSnapshot = async (
  projectId: string,
  snapshot: ProjectLineSnapshot
): Promise<void> => {
  await replaceProjectLines(projectId, snapshot.lines);
  await setLineSnapshotVersion(projectId, snapshot.snapshot_version);
  await clearLinesDirty(projectId, snapshot.snapshot_version);
};

export const getStoredNotes = async (
  projectId: string,
  options: { includeDeleted?: boolean } = {}
): Promise<StoredNoteRecord[]> => {
  const includeDeleted = options.includeDeleted ?? true;
  const db = await openDatabase();

  const readNotes = () =>
    new Promise<StoredNoteRecord[]>((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(NOTE_STORE, "readonly");
      } catch (error) {
        reject(error);
        return;
      }

      const store = tx.objectStore(NOTE_STORE);
      const index = store.index("project_id");
      const request = index.openCursor(IDBKeyRange.only(projectId));
      const records: StoredNoteRecord[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(records);
          return;
        }
        const value = cursor.value as StoredNoteRecord;
        if (includeDeleted || !value.is_deleted) {
          records.push(value);
        }
        cursor.continue();
      };

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read notes"));
    });

  try {
    return await readNotes();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      await resetDatabase(db);
      await openDatabase();
      return getStoredNotes(projectId, options);
    }
    throw error;
  }
};

export const upsertStoredNote = async (note: StoredNoteRecord): Promise<void> =>
  withStore<void>(NOTE_STORE, "readwrite", (store) => {
    store.put(note);
  });

export const replaceProjectNotes = async (
  projectId: string,
  notes: StoredNoteRecord[]
): Promise<void> =>
  withStore<void>(NOTE_STORE, "readwrite", (store, tx) => {
    const index = store.index("project_id");
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }

      for (const note of notes) {
        store.put(note);
      }
    };

    request.onerror = () => tx.abort();
  });

export const getNotesForSave = async (
  projectId: string
): Promise<ProjectNotePayload[]> => {
  const notes = await getStoredNotes(projectId, { includeDeleted: true });
  return notes.map((note) => ({
    id: note.id,
    content: note.content,
    position: note.position,
    size: note.size,
    is_deleted: note.is_deleted,
    updated_at: note.updated_at,
    version: note.version,
    origin: note.origin,
  }));
};

export const recordNoteSnapshot = async (
  projectId: string,
  snapshot: ProjectNoteSnapshot
): Promise<void> => {
  await replaceProjectNotes(projectId, snapshot.notes);
  await setNoteSnapshotVersion(projectId, snapshot.snapshot_version);
  await clearNotesDirty(projectId, snapshot.snapshot_version);
};

export const getStoredDrawings = async (
  projectId: string,
  options: { includeDeleted?: boolean } = {}
): Promise<StoredDrawingRecord[]> => {
  const includeDeleted = options.includeDeleted ?? true;
  const db = await openDatabase();

  const readDrawings = () =>
    new Promise<StoredDrawingRecord[]>((resolve, reject) => {
      let tx: IDBTransaction;
      try {
        tx = db.transaction(DRAWING_STORE, "readonly");
      } catch (error) {
        reject(error);
        return;
      }

      const store = tx.objectStore(DRAWING_STORE);
      const index = store.index("project_id");
      const request = index.openCursor(IDBKeyRange.only(projectId));
      const records: StoredDrawingRecord[] = [];

      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) {
          resolve(records);
          return;
        }
        const value = cursor.value as StoredDrawingRecord;
        if (includeDeleted || !value.is_deleted) {
          records.push(value);
        }
        cursor.continue();
      };

      request.onerror = () =>
        reject(request.error ?? new Error("Failed to read drawings"));
    });

  try {
    return await readDrawings();
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      await resetDatabase(db);
      await openDatabase();
      return getStoredDrawings(projectId, options);
    }
    throw error;
  }
};

export const upsertStoredDrawing = async (
  drawing: StoredDrawingRecord
): Promise<void> =>
  withStore<void>(DRAWING_STORE, "readwrite", (store) => {
    store.put(drawing);
  });

export const replaceProjectDrawings = async (
  projectId: string,
  drawings: StoredDrawingRecord[]
): Promise<void> =>
  withStore<void>(DRAWING_STORE, "readwrite", (store, tx) => {
    const index = store.index("project_id");
    const request = index.openCursor(IDBKeyRange.only(projectId));

    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }

      for (const drawing of drawings) {
        store.put(drawing);
      }
    };

    request.onerror = () => tx.abort();
  });

export const getDrawingsForSave = async (
  projectId: string
): Promise<ProjectDrawingPayload[]> => {
  const drawings = await getStoredDrawings(projectId, { includeDeleted: true });
  return drawings.map((drawing) => ({
    id: drawing.id,
    points: drawing.points,
    stroke_color: drawing.stroke_color,
    stroke_width: drawing.stroke_width,
    is_deleted: drawing.is_deleted,
    updated_at: drawing.updated_at,
    version: drawing.version,
    origin: drawing.origin,
  }));
};

export const recordDrawingSnapshot = async (
  projectId: string,
  snapshot: ProjectDrawingSnapshot
): Promise<void> => {
  await replaceProjectDrawings(projectId, snapshot.drawings);
  await setDrawingSnapshotVersion(projectId, snapshot.snapshot_version);
  await clearDrawingsDirty(projectId, snapshot.snapshot_version);
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
