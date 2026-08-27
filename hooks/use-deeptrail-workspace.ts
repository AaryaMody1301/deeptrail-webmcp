"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clearCurrentWorkspace, loadCurrentWorkspace, saveCurrentWorkspace } from "@/lib/storage";
import type {
  AddClaimInput,
  AddSourceInput,
  Claim,
  EvidenceLink,
  LinkEvidenceInput,
  Source,
  Workspace,
} from "@/lib/types";

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function assertHttpUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Source URL must use http or https.");
  }
  return url.toString();
}

export interface DeepTrailActions {
  createInvestigation: (title: string, primaryQuestion: string) => Workspace;
  resetWorkspace: () => void;
  addSource: (input: AddSourceInput) => Source;
  addClaim: (input: AddClaimInput) => Claim;
  linkEvidence: (input: LinkEvidenceInput) => EvidenceLink;
}

export function useDeepTrailWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const workspaceRef = useRef<Workspace | null>(null);

  const commitWorkspace = useCallback((next: Workspace | null) => {
    workspaceRef.current = next;
    setWorkspace(next);
  }, []);

  useEffect(() => {
    let cancelled = false;

    loadCurrentWorkspace()
      .then((saved) => {
        if (!cancelled) {
          workspaceRef.current = saved;
          setWorkspace(saved);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setStorageError(error instanceof Error ? error.message : "Unable to load local storage.");
        }
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !workspace) return;
    saveCurrentWorkspace(workspace).catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : "Unable to persist the workspace.");
    });
  }, [hydrated, workspace]);

  const createInvestigation = useCallback(
    (title: string, primaryQuestion: string) => {
      const timestamp = now();
      const next: Workspace = {
        id: id(),
        title: title.trim(),
        primaryQuestion: primaryQuestion.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
        questions: [
          {
            id: id(),
            text: primaryQuestion.trim(),
            status: "open",
            createdAt: timestamp,
          },
        ],
        sources: [],
        claims: [],
        evidenceLinks: [],
      };
      commitWorkspace(next);
      return next;
    },
    [commitWorkspace],
  );

  const resetWorkspace = useCallback(() => {
    commitWorkspace(null);
    clearCurrentWorkspace().catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : "Unable to clear the workspace.");
    });
  }, [commitWorkspace]);

  const addSource = useCallback(
    (input: AddSourceInput) => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a source.");

      const normalizedUrl = assertHttpUrl(input.url);
      const duplicate = current.sources.find((source) => source.url === normalizedUrl);
      if (duplicate) return duplicate;

      const source: Source = {
        id: id(),
        url: normalizedUrl,
        title: input.title?.trim() || new URL(normalizedUrl).hostname,
        publisher: input.publisher?.trim() || undefined,
        summary: input.summary?.trim() || undefined,
        createdAt: now(),
      };

      commitWorkspace({
        ...current,
        sources: [source, ...current.sources],
        updatedAt: now(),
      });
      return source;
    },
    [commitWorkspace],
  );

  const addClaim = useCallback(
    (input: AddClaimInput) => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a claim.");
      if (!input.text.trim()) throw new Error("Claim text cannot be empty.");

      const claim: Claim = {
        id: id(),
        text: input.text.trim(),
        stance: input.stance ?? "neutral",
        confidence: Math.min(1, Math.max(0, input.confidence ?? 0.5)),
        createdAt: now(),
      };

      commitWorkspace({
        ...current,
        claims: [claim, ...current.claims],
        updatedAt: now(),
      });
      return claim;
    },
    [commitWorkspace],
  );

  const linkEvidence = useCallback(
    (input: LinkEvidenceInput) => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before linking evidence.");
      if (!current.sources.some((source) => source.id === input.sourceId)) {
        throw new Error(`Unknown sourceId: ${input.sourceId}`);
      }
      if (!current.claims.some((claim) => claim.id === input.claimId)) {
        throw new Error(`Unknown claimId: ${input.claimId}`);
      }

      const existing = current.evidenceLinks.find(
        (link) =>
          link.sourceId === input.sourceId &&
          link.claimId === input.claimId &&
          link.relationship === input.relationship,
      );
      if (existing) return existing;

      const link: EvidenceLink = {
        id: id(),
        sourceId: input.sourceId,
        claimId: input.claimId,
        relationship: input.relationship,
        note: input.note?.trim() || undefined,
        createdAt: now(),
      };

      commitWorkspace({
        ...current,
        evidenceLinks: [link, ...current.evidenceLinks],
        updatedAt: now(),
      });
      return link;
    },
    [commitWorkspace],
  );

  const actions = useMemo<DeepTrailActions>(
    () => ({ createInvestigation, resetWorkspace, addSource, addClaim, linkEvidence }),
    [createInvestigation, resetWorkspace, addSource, addClaim, linkEvidence],
  );

  return { workspace, hydrated, storageError, actions };
}
