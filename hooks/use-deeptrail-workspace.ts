"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clearCurrentWorkspace, loadCurrentWorkspace, saveCurrentWorkspace } from "@/lib/storage";
import type {
  ActivityActor,
  ActivityEntry,
  ActivityType,
  AddClaimInput,
  AddSourceInput,
  Claim,
  EvidenceLink,
  LinkEvidenceInput,
  ResearchNote,
  ResearchQuestion,
  Source,
  UpdateClaimInput,
  UpdateSourceInput,
  Workspace,
} from "@/lib/types";

const MAX_ACTIVITY_ENTRIES = 120;
const TRACKING_PARAMETERS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
];

function now() {
  return new Date().toISOString();
}

function id() {
  return crypto.randomUUID();
}

function normalizeHttpUrl(value: string) {
  const url = new URL(value.trim());
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Source URL must use http or https.");
  }

  url.hash = "";
  for (const parameter of TRACKING_PARAMETERS) {
    url.searchParams.delete(parameter);
  }
  url.searchParams.sort();
  return url.toString();
}

function activity(
  type: ActivityType,
  actor: ActivityActor,
  message: string,
  entityId?: string,
): ActivityEntry {
  return {
    id: id(),
    type,
    actor,
    message,
    entityId,
    createdAt: now(),
  };
}

function withActivity(workspace: Workspace, entry: ActivityEntry): Workspace {
  return {
    ...workspace,
    updatedAt: entry.createdAt,
    activity: [entry, ...workspace.activity].slice(0, MAX_ACTIVITY_ENTRIES),
  };
}

export interface DeepTrailActions {
  createInvestigation: (title: string, primaryQuestion: string) => Workspace;
  resetWorkspace: () => void;
  addQuestion: (text: string, actor?: ActivityActor) => ResearchQuestion;
  updateQuestion: (
    questionId: string,
    patch: Partial<Pick<ResearchQuestion, "text" | "status">>,
    actor?: ActivityActor,
  ) => ResearchQuestion;
  addSource: (input: AddSourceInput, actor?: ActivityActor) => Source;
  updateSource: (sourceId: string, patch: UpdateSourceInput, actor?: ActivityActor) => Source;
  addClaim: (input: AddClaimInput, actor?: ActivityActor) => Claim;
  updateClaim: (claimId: string, patch: UpdateClaimInput, actor?: ActivityActor) => Claim;
  linkEvidence: (input: LinkEvidenceInput, actor?: ActivityActor) => EvidenceLink;
  addNote: (title: string, content: string, actor?: ActivityActor) => ResearchNote;
  updateNote: (
    noteId: string,
    patch: Partial<Pick<ResearchNote, "title" | "content">>,
    actor?: ActivityActor,
  ) => ResearchNote;
}

export function useDeepTrailWorkspace() {
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const workspaceRef = useRef<Workspace | null>(null);

  const commitWorkspace = useCallback((next: Workspace | null, message?: string) => {
    workspaceRef.current = next;
    setWorkspace(next);
    if (message) setAnnouncement(message);
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
      const cleanTitle = title.trim();
      const cleanQuestion = primaryQuestion.trim();
      if (!cleanTitle || !cleanQuestion) throw new Error("Title and primary question are required.");

      const timestamp = now();
      const question: ResearchQuestion = {
        id: id(),
        text: cleanQuestion,
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const createdActivity = activity("investigation_created", "human", `Created investigation “${cleanTitle}”.`);
      const next: Workspace = {
        id: id(),
        title: cleanTitle,
        primaryQuestion: cleanQuestion,
        createdAt: timestamp,
        updatedAt: timestamp,
        questions: [question],
        sources: [],
        claims: [],
        evidenceLinks: [],
        notes: [],
        activity: [createdActivity],
      };
      commitWorkspace(next, "Investigation created.");
      return next;
    },
    [commitWorkspace],
  );

  const resetWorkspace = useCallback(() => {
    commitWorkspace(null, "Investigation reset.");
    clearCurrentWorkspace().catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : "Unable to clear the workspace.");
    });
  }, [commitWorkspace]);

  const addQuestion = useCallback(
    (text: string, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a question.");
      const cleanText = text.trim();
      if (!cleanText) throw new Error("Question text cannot be empty.");
      const timestamp = now();
      const question: ResearchQuestion = {
        id: id(),
        text: cleanText,
        status: "open",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const next = withActivity(
        { ...current, questions: [question, ...current.questions] },
        activity("question_added", actor, `Added research question: ${cleanText}`, question.id),
      );
      commitWorkspace(next, "Research question added.");
      return question;
    },
    [commitWorkspace],
  );

  const updateQuestion = useCallback(
    (
      questionId: string,
      patch: Partial<Pick<ResearchQuestion, "text" | "status">>,
      actor: ActivityActor = "human",
    ) => {
      const current = workspaceRef.current;
      if (!current) throw new Error("No active investigation.");
      const existing = current.questions.find((question) => question.id === questionId);
      if (!existing) throw new Error(`Unknown questionId: ${questionId}`);
      const text = patch.text === undefined ? existing.text : patch.text.trim();
      if (!text) throw new Error("Question text cannot be empty.");
      const updated: ResearchQuestion = {
        ...existing,
        text,
        status: patch.status ?? existing.status,
        updatedAt: now(),
      };
      const next = withActivity(
        { ...current, questions: current.questions.map((question) => (question.id === questionId ? updated : question)) },
        activity("question_updated", actor, `Updated research question: ${updated.text}`, questionId),
      );
      commitWorkspace(next, "Research question updated.");
      return updated;
    },
    [commitWorkspace],
  );

  const addSource = useCallback(
    (input: AddSourceInput, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a source.");

      const normalizedUrl = normalizeHttpUrl(input.url);
      const duplicate = current.sources.find((source) => source.url === normalizedUrl);
      if (duplicate) {
        setAnnouncement("That source is already in this investigation.");
        return duplicate;
      }

      const timestamp = now();
      const source: Source = {
        id: id(),
        url: normalizedUrl,
        title: input.title?.trim() || new URL(normalizedUrl).hostname,
        publisher: input.publisher?.trim() || undefined,
        summary: input.summary?.trim() || undefined,
        publishedAt: input.publishedAt?.trim() || undefined,
        accessedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      const next = withActivity(
        { ...current, sources: [source, ...current.sources] },
        activity("source_added", actor, `Added source: ${source.title}`, source.id),
      );
      commitWorkspace(next, "Source added to the evidence trail.");
      return source;
    },
    [commitWorkspace],
  );

  const updateSource = useCallback(
    (sourceId: string, patch: UpdateSourceInput, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("No active investigation.");
      const existing = current.sources.find((source) => source.id === sourceId);
      if (!existing) throw new Error(`Unknown sourceId: ${sourceId}`);

      const nextUrl = patch.url === undefined ? existing.url : normalizeHttpUrl(patch.url);
      const duplicate = current.sources.find((source) => source.id !== sourceId && source.url === nextUrl);
      if (duplicate) throw new Error("Another source already uses this URL.");

      const updated: Source = {
        ...existing,
        url: nextUrl,
        title: patch.title === undefined ? existing.title : patch.title.trim() || new URL(nextUrl).hostname,
        publisher: patch.publisher === undefined ? existing.publisher : patch.publisher.trim() || undefined,
        summary: patch.summary === undefined ? existing.summary : patch.summary.trim() || undefined,
        publishedAt: patch.publishedAt === undefined ? existing.publishedAt : patch.publishedAt.trim() || undefined,
        updatedAt: now(),
      };
      const next = withActivity(
        { ...current, sources: current.sources.map((source) => (source.id === sourceId ? updated : source)) },
        activity("source_updated", actor, `Updated source: ${updated.title}`, sourceId),
      );
      commitWorkspace(next, "Source metadata updated.");
      return updated;
    },
    [commitWorkspace],
  );

  const addClaim = useCallback(
    (input: AddClaimInput, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a claim.");
      if (!input.text.trim()) throw new Error("Claim text cannot be empty.");
      const timestamp = now();
      const claim: Claim = {
        id: id(),
        text: input.text.trim(),
        stance: input.stance ?? "neutral",
        confidence: Math.min(1, Math.max(0, input.confidence ?? 0.5)),
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const next = withActivity(
        { ...current, claims: [claim, ...current.claims] },
        activity("claim_added", actor, `Added claim: ${claim.text}`, claim.id),
      );
      commitWorkspace(next, "Claim added to the investigation.");
      return claim;
    },
    [commitWorkspace],
  );

  const updateClaim = useCallback(
    (claimId: string, patch: UpdateClaimInput, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("No active investigation.");
      const existing = current.claims.find((claim) => claim.id === claimId);
      if (!existing) throw new Error(`Unknown claimId: ${claimId}`);
      const text = patch.text === undefined ? existing.text : patch.text.trim();
      if (!text) throw new Error("Claim text cannot be empty.");
      const updated: Claim = {
        ...existing,
        text,
        stance: patch.stance ?? existing.stance,
        confidence:
          patch.confidence === undefined
            ? existing.confidence
            : Math.min(1, Math.max(0, patch.confidence)),
        updatedAt: now(),
      };
      const next = withActivity(
        { ...current, claims: current.claims.map((claim) => (claim.id === claimId ? updated : claim)) },
        activity("claim_updated", actor, `Updated claim: ${updated.text}`, claimId),
      );
      commitWorkspace(next, "Claim updated.");
      return updated;
    },
    [commitWorkspace],
  );

  const linkEvidence = useCallback(
    (input: LinkEvidenceInput, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before linking evidence.");
      const source = current.sources.find((item) => item.id === input.sourceId);
      const claim = current.claims.find((item) => item.id === input.claimId);
      if (!source) throw new Error(`Unknown sourceId: ${input.sourceId}`);
      if (!claim) throw new Error(`Unknown claimId: ${input.claimId}`);

      const existing = current.evidenceLinks.find(
        (link) =>
          link.sourceId === input.sourceId &&
          link.claimId === input.claimId &&
          link.relationship === input.relationship,
      );
      if (existing) {
        setAnnouncement("That evidence relationship already exists.");
        return existing;
      }

      const link: EvidenceLink = {
        id: id(),
        sourceId: input.sourceId,
        claimId: input.claimId,
        relationship: input.relationship,
        note: input.note?.trim() || undefined,
        createdAt: now(),
      };
      const next = withActivity(
        { ...current, evidenceLinks: [link, ...current.evidenceLinks] },
        activity(
          "evidence_linked",
          actor,
          `Linked “${source.title}” to a claim as ${input.relationship} evidence.`,
          link.id,
        ),
      );
      commitWorkspace(next, "Evidence linked to claim.");
      return link;
    },
    [commitWorkspace],
  );

  const addNote = useCallback(
    (title: string, content: string, actor: ActivityActor = "human") => {
      const current = workspaceRef.current;
      if (!current) throw new Error("Create an investigation before adding a note.");
      const cleanTitle = title.trim();
      const cleanContent = content.trim();
      if (!cleanTitle || !cleanContent) throw new Error("Note title and content are required.");
      const timestamp = now();
      const note: ResearchNote = {
        id: id(),
        title: cleanTitle,
        content: cleanContent,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      const next = withActivity(
        { ...current, notes: [note, ...current.notes] },
        activity("note_added", actor, `Added note: ${note.title}`, note.id),
      );
      commitWorkspace(next, "Research note added.");
      return note;
    },
    [commitWorkspace],
  );

  const updateNote = useCallback(
    (
      noteId: string,
      patch: Partial<Pick<ResearchNote, "title" | "content">>,
      actor: ActivityActor = "human",
    ) => {
      const current = workspaceRef.current;
      if (!current) throw new Error("No active investigation.");
      const existing = current.notes.find((note) => note.id === noteId);
      if (!existing) throw new Error(`Unknown noteId: ${noteId}`);
      const title = patch.title === undefined ? existing.title : patch.title.trim();
      const content = patch.content === undefined ? existing.content : patch.content.trim();
      if (!title || !content) throw new Error("Note title and content are required.");
      const updated: ResearchNote = { ...existing, title, content, updatedAt: now() };
      const next = withActivity(
        { ...current, notes: current.notes.map((note) => (note.id === noteId ? updated : note)) },
        activity("note_updated", actor, `Updated note: ${updated.title}`, noteId),
      );
      commitWorkspace(next, "Research note updated.");
      return updated;
    },
    [commitWorkspace],
  );

  const actions = useMemo<DeepTrailActions>(
    () => ({
      createInvestigation,
      resetWorkspace,
      addQuestion,
      updateQuestion,
      addSource,
      updateSource,
      addClaim,
      updateClaim,
      linkEvidence,
      addNote,
      updateNote,
    }),
    [
      createInvestigation,
      resetWorkspace,
      addQuestion,
      updateQuestion,
      addSource,
      updateSource,
      addClaim,
      updateClaim,
      linkEvidence,
      addNote,
      updateNote,
    ],
  );

  return { workspace, hydrated, storageError, announcement, actions };
}
