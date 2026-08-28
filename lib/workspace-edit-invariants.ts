import type {
  ActivityActor,
  ActivityEntry,
  Claim,
  ConfidenceChange,
  ResearchQuestion,
  UpdateClaimInput,
  UpdateConfidenceInput,
  Workspace,
} from "@/lib/types";

export const MAX_ACTIVITY_ENTRIES = 120;
export const MAX_REASONING_HISTORY = 80;

export interface WorkspaceEditRuntime {
  now?: () => string;
  id?: () => string;
}

interface WorkspaceEditResult<T> {
  workspace: Workspace;
  value: T;
}

function timestamp() {
  return new Date().toISOString();
}

function identifier() {
  return crypto.randomUUID();
}

function createActivity(
  type: ActivityEntry["type"],
  actor: ActivityActor,
  message: string,
  entityId: string | undefined,
  runtime: Required<WorkspaceEditRuntime>,
): ActivityEntry {
  return {
    id: runtime.id(),
    type,
    actor,
    message,
    entityId,
    createdAt: runtime.now(),
  };
}

function withActivity(workspace: Workspace, entry: ActivityEntry): Workspace {
  return {
    ...workspace,
    updatedAt: entry.createdAt,
    activity: [entry, ...workspace.activity].slice(0, MAX_ACTIVITY_ENTRIES),
  };
}

function runtimeOptions(runtime: WorkspaceEditRuntime): Required<WorkspaceEditRuntime> {
  return {
    now: runtime.now ?? timestamp,
    id: runtime.id ?? identifier,
  };
}

export function applyQuestionUpdate(
  workspace: Workspace,
  questionId: string,
  patch: Partial<Pick<ResearchQuestion, "text" | "status">>,
  actor: ActivityActor,
  runtime: WorkspaceEditRuntime = {},
): WorkspaceEditResult<ResearchQuestion> {
  const existing = workspace.questions.find((question) => question.id === questionId);
  if (!existing) throw new Error(`Unknown questionId: ${questionId}`);

  const text = patch.text === undefined ? existing.text : patch.text.trim();
  if (!text) throw new Error("Question text cannot be empty.");
  if (patch.status !== undefined && patch.status !== "open" && patch.status !== "answered") {
    throw new Error("Question status must be open or answered.");
  }

  const options = runtimeOptions(runtime);
  const updated: ResearchQuestion = {
    ...existing,
    text,
    status: patch.status ?? existing.status,
    updatedAt: options.now(),
  };
  const next = withActivity(
    {
      ...workspace,
      primaryQuestion: questionId === workspace.primaryQuestionId ? updated.text : workspace.primaryQuestion,
      questions: workspace.questions.map((question) => (question.id === questionId ? updated : question)),
    },
    createActivity("question_updated", actor, `Updated research question: ${updated.text}`, questionId, options),
  );

  return { workspace: next, value: updated };
}

export function applyClaimUpdate(
  workspace: Workspace,
  claimId: string,
  patch: UpdateClaimInput,
  actor: ActivityActor,
  runtime: WorkspaceEditRuntime = {},
): WorkspaceEditResult<Claim> {
  const existing = workspace.claims.find((claim) => claim.id === claimId);
  if (!existing) throw new Error(`Unknown claimId: ${claimId}`);

  const text = patch.text === undefined ? existing.text : patch.text.trim();
  if (!text) throw new Error("Claim text cannot be empty.");
  if (patch.stance !== undefined && !["supports", "contradicts", "neutral"].includes(patch.stance)) {
    throw new Error("Claim stance is invalid.");
  }

  const options = runtimeOptions(runtime);
  const updated: Claim = {
    ...existing,
    text,
    stance: patch.stance ?? existing.stance,
    updatedAt: options.now(),
  };
  const next = withActivity(
    { ...workspace, claims: workspace.claims.map((claim) => (claim.id === claimId ? updated : claim)) },
    createActivity("claim_updated", actor, `Updated claim: ${updated.text}`, claimId, options),
  );

  return { workspace: next, value: updated };
}

export function applyConfidenceUpdate(
  workspace: Workspace,
  input: UpdateConfidenceInput,
  actor: ActivityActor,
  runtime: WorkspaceEditRuntime = {},
): WorkspaceEditResult<ConfidenceChange> {
  const claim = workspace.claims.find((item) => item.id === input.claimId);
  if (!claim) throw new Error(`Unknown claimId: ${input.claimId}`);
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new Error("Confidence must be between 0 and 1.");
  }

  const reason = input.reason.trim();
  if (!reason) throw new Error("A reason is required when confidence changes.");
  if (input.confidence === claim.confidence) {
    throw new Error(`Confidence is already ${Math.round(claim.confidence * 100)}%.`);
  }

  const options = runtimeOptions(runtime);
  const change: ConfidenceChange = {
    id: options.id(),
    claimId: claim.id,
    previousConfidence: claim.confidence,
    newConfidence: input.confidence,
    reason,
    createdAt: options.now(),
  };
  const updatedClaim: Claim = { ...claim, confidence: input.confidence, updatedAt: change.createdAt };
  const next = withActivity(
    {
      ...workspace,
      claims: workspace.claims.map((item) => (item.id === claim.id ? updatedClaim : item)),
      confidenceHistory: [change, ...workspace.confidenceHistory].slice(0, MAX_REASONING_HISTORY),
    },
    createActivity(
      "confidence_updated",
      actor,
      `Changed claim confidence from ${Math.round(claim.confidence * 100)}% to ${Math.round(input.confidence * 100)}%.`,
      claim.id,
      options,
    ),
  );

  return { workspace: next, value: change };
}
