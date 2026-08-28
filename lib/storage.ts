import type { Workspace } from "@/lib/types";
import { validateWorkspace } from "@/lib/workspace-schema";

const DATABASE_NAME = "deeptrail";
const DATABASE_VERSION = 1;
const STORE_NAME = "workspace";
const CURRENT_WORKSPACE_KEY = "current";
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueueWrite(operation: () => Promise<void>): Promise<void> {
  const operationPromise = writeQueue.then(operation, operation);
  writeQueue = operationPromise.catch(() => undefined);
  return operationPromise;
}

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

function validatedWorkspace(value: unknown) {
  return validateWorkspace(value);
}

export async function loadCurrentWorkspace(): Promise<Workspace | null> {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CURRENT_WORKSPACE_KEY);

    request.onsuccess = () => {
      try {
        resolve(request.result === undefined ? null : validatedWorkspace(request.result));
      } catch (error: unknown) {
        reject(
          error instanceof Error
            ? new Error(`Stored DeepTrail workspace failed validation: ${error.message}`)
            : new Error("Stored DeepTrail workspace failed validation."),
        );
      }
    };
    request.onerror = () => reject(request.error ?? new Error("Unable to load the workspace."));
    transaction.oncomplete = () => database.close();
  });
}

export async function saveCurrentWorkspace(workspace: Workspace): Promise<void> {
  const validated = validatedWorkspace(workspace);
  return enqueueWrite(async () => {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).put(validated, CURRENT_WORKSPACE_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error("Unable to save the workspace."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error ?? new Error("Unable to save the workspace."));
      };
    });
  });
}

export async function clearCurrentWorkspace(): Promise<void> {
  return enqueueWrite(async () => {
    const database = await openDatabase();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, "readwrite");
      transaction.objectStore(STORE_NAME).delete(CURRENT_WORKSPACE_KEY);
      transaction.oncomplete = () => {
        database.close();
        resolve();
      };
      transaction.onerror = () => {
        database.close();
        reject(transaction.error ?? new Error("Unable to clear the workspace."));
      };
      transaction.onabort = () => {
        database.close();
        reject(transaction.error ?? new Error("Unable to clear the workspace."));
      };
    });
  });
}
