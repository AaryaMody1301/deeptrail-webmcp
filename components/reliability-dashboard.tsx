"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { saveCurrentWorkspace } from "@/lib/storage";
import type { Workspace } from "@/lib/types";
import {
  assessWorkspaceContentRisk,
  exportWorkspaceBackup,
  MAX_BACKUP_BYTES,
  parseWorkspaceBackup,
  validateWorkspace,
} from "@/lib/workspace-schema";
import styles from "./reliability-dashboard.module.css";

type PersistenceStatus = "checking" | "persisted" | "best-effort" | "unsupported";

function backupFilename(workspace: Workspace) {
  const safeTitle = workspace.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "investigation";
  return `deeptrail-${safeTitle}-${new Date().toISOString().slice(0, 10)}.json`;
}

interface ReliabilityDashboardProps {
  workspace: Workspace;
}

export function ReliabilityDashboard({ workspace }: ReliabilityDashboardProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [persistenceStatus, setPersistenceStatus] = useState<PersistenceStatus>("checking");

  const warnings = useMemo(() => assessWorkspaceContentRisk(workspace), [workspace]);

  const workspaceValidation = useMemo(() => {
    try {
      validateWorkspace(workspace);
      return { valid: true, message: "Workspace schema is valid." };
    } catch (reason: unknown) {
      return {
        valid: false,
        message: reason instanceof Error ? reason.message : "Workspace validation failed.",
      };
    }
  }, [workspace]);

  useEffect(() => {
    let cancelled = false;

    if (!navigator.storage?.persisted) {
      setPersistenceStatus("unsupported");
      return;
    }

    navigator.storage
      .persisted()
      .then((persisted) => {
        if (!cancelled) setPersistenceStatus(persisted ? "persisted" : "best-effort");
      })
      .catch(() => {
        if (!cancelled) setPersistenceStatus("best-effort");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  function exportBackup() {
    try {
      setError(null);
      const payload = exportWorkspaceBackup(workspace);
      const blob = new Blob([payload], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = backupFilename(workspace);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("Validated DeepTrail backup exported.");
    } catch (reason: unknown) {
      setMessage(null);
      setError(reason instanceof Error ? reason.message : "Unable to export this workspace.");
    }
  }

  async function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    try {
      setError(null);
      setMessage(null);
      if (file.size > MAX_BACKUP_BYTES) {
        throw new Error("Backup is larger than the 2 MB DeepTrail import limit.");
      }

      const imported = parseWorkspaceBackup(await file.text());
      const confirmed = window.confirm(
        `Replace the current investigation “${workspace.title}” with validated backup “${imported.title}”?`,
      );
      if (!confirmed) {
        setMessage("Import cancelled; the current workspace was not changed.");
        return;
      }

      await saveCurrentWorkspace(imported);
      window.location.reload();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to import this backup.");
    }
  }

  async function requestPersistentStorage() {
    try {
      setError(null);
      setMessage(null);
      if (!navigator.storage?.persist) {
        setPersistenceStatus("unsupported");
        setMessage("This browser does not expose the persistent-storage request API.");
        return;
      }

      const persisted = await navigator.storage.persist();
      setPersistenceStatus(persisted ? "persisted" : "best-effort");
      setMessage(
        persisted
          ? "The browser granted persistent storage for DeepTrail."
          : "The browser kept DeepTrail on best-effort storage; export backups for important investigations.",
      );
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Persistent-storage request failed.");
    }
  }

  const persistenceLabel =
    persistenceStatus === "persisted"
      ? "Persistent"
      : persistenceStatus === "best-effort"
        ? "Best effort"
        : persistenceStatus === "unsupported"
          ? "API unavailable"
          : "Checking…";

  return (
    <section className={styles.section} aria-labelledby="reliability-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 5 reliability + security</p>
          <h2 id="reliability-heading">Make the research recoverable and distrust external text by default.</h2>
          <p>
            Backups are schema-validated before import, browser persistence is explicit, and suspicious instruction-like content is surfaced as an advisory signal instead of silently executed or deleted.
          </p>
        </div>
      </header>

      {message ? <p className={styles.message} role="status">{message}</p> : null}
      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.grid}>
        <article className={styles.card}>
          <div className={styles.cardHeading}>
            <div><span>Backup + recovery</span><h3>Validated local backup</h3></div>
            <span className={`${styles.badge} ${workspaceValidation.valid ? styles.good : styles.bad}`}>
              {workspaceValidation.valid ? "valid" : "invalid"}
            </span>
          </div>
          <p>{workspaceValidation.message}</p>
          <div className={styles.actions}>
            <button type="button" onClick={exportBackup} disabled={!workspaceValidation.valid}>Export JSON backup</button>
            <label className={styles.importButton}>
              Import backup
              <input type="file" accept="application/json,.json" onChange={importBackup} />
            </label>
          </div>
          <small>Imports are limited to 2 MB and validated before IndexedDB is overwritten.</small>
        </article>

        <article className={styles.card}>
          <div className={styles.cardHeading}>
            <div><span>Browser storage</span><h3>Persistence status</h3></div>
            <span className={`${styles.badge} ${persistenceStatus === "persisted" ? styles.good : styles.warn}`}>
              {persistenceLabel}
            </span>
          </div>
          <p>
            IndexedDB can be best-effort storage. Request stronger persistence for an important local investigation and still keep a backup for portability.
          </p>
          <button type="button" onClick={requestPersistentStorage} disabled={persistenceStatus === "persisted"}>
            {persistenceStatus === "persisted" ? "Persistent storage granted" : "Request persistent storage"}
          </button>
        </article>

        <article className={`${styles.card} ${styles.wideCard}`}>
          <div className={styles.cardHeading}>
            <div><span>Untrusted-content review</span><h3>Instruction-like content indicators</h3></div>
            <span className={`${styles.badge} ${warnings.length === 0 ? styles.good : styles.warn}`}>
              {warnings.length === 0 ? "clear" : `${warnings.length} warning${warnings.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <p>
            Web pages can contain indirect prompt injection. DeepTrail labels web-derived tool data as untrusted; this scan only highlights common instruction-like patterns for human review and is not used as a security boundary.
          </p>
          {warnings.length === 0 ? (
            <div className={styles.empty}>No common prompt-injection indicators were detected in the current stored text.</div>
          ) : (
            <ul className={styles.warningList}>
              {warnings.map((warning, index) => (
                <li key={`${warning.location}-${warning.indicator}-${index}`}>
                  <strong>{warning.location}</strong>
                  <span>{warning.indicator}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
