import type { Workspace } from "@/lib/types";

const DATABASE_NAME = "deeptrail";
const DATABASE_VERSION = 1;
const STORE_NAME = "workspace";
const CURRENT_WORKSPACE_KEY = "current";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open DeepTrail storage."));
  });
}

function normalizeWorkspace(value: Workspace): Workspace {
  const fallbackTimestamp = value.updatedAt || value.createdAt || new Date().toISOString();

  return {
    ...value,
    questions: (value.questions ?? []).map((question) => ({
      ...question,
      updatedAt: question.updatedAt ?? question.createdAt ?? fallbackTimestamp,
    })),
    sources: (value.sources ?? []).map((source) => ({
      ...source,
      accessedAt: source.accessedAt ?? source.createdAt ?? fallbackTimestamp,
      updatedAt: source.updatedAt ?? source.createdAt ?? fallbackTimestamp,
    })),
    claims: (value.claims ?? []).map((claim) => ({
      ...claim,
      updatedAt: claim.updatedAt ?? claim.createdAt ?? fallbackTimestamp,
    })),
    evidenceLinks: value.evidenceLinks ?? [],
    notes: value.notes ?? [],
    researchGaps: value.researchGaps ?? [],
    counterarguments: value.counterarguments ?? [],
    confidenceHistory: value.confidenceHistory ?? [],
    comparisons: value.comparisons ?? [],
    decision: value.decision,
    activity: value.activity ?? [],
  };
}

export async function loadCurrentWorkspace(): Promise<Workspace | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CURRENT_WORKSPACE_KEY);

    request.onsuccess = () => {
      const saved = request.result as Workspace | undefined;
      resolve(saved ? normalizeWorkspace(saved) : null);
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to load the workspace."));
    transaction.oncomplete = () => database.close();
  });
}

export async function saveCurrentWorkspace(workspace: Workspace): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(workspace, CURRENT_WORKSPACE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to save the workspace."));
  });
}

export async function clearCurrentWorkspace(): Promise<void> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(CURRENT_WORKSPACE_KEY);
    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Unable to clear the workspace."));
  });
}
