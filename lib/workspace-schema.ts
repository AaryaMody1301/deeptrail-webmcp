import { z } from "zod";
import type { Workspace } from "@/lib/types";

export const DEEPTRAIL_BACKUP_FORMAT = "deeptrail-workspace" as const;
export const DEEPTRAIL_BACKUP_VERSION = 1 as const;
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024;

const idSchema = z.string().min(1).max(128);
const timestampSchema = z
  .string()
  .min(1)
  .max(64)
  .refine((value) => !Number.isNaN(Date.parse(value)), "Invalid timestamp");
const requiredText = (max: number) => z.string().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();
const httpUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use http or https");

const questionSchema = z
  .object({
    id: idSchema,
    text: requiredText(3000),
    status: z.enum(["open", "answered"]),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const sourceSchema = z
  .object({
    id: idSchema,
    url: httpUrlSchema,
    title: requiredText(500),
    publisher: optionalText(300),
    summary: optionalText(8000),
    publishedAt: optionalText(64),
    accessedAt: timestampSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const claimSchema = z
  .object({
    id: idSchema,
    text: requiredText(5000),
    stance: z.enum(["supports", "contradicts", "neutral"]),
    confidence: z.number().min(0).max(1),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const evidenceLinkSchema = z
  .object({
    id: idSchema,
    sourceId: idSchema,
    claimId: idSchema,
    relationship: z.enum(["supports", "contradicts", "qualifies"]),
    note: optionalText(4000),
    createdAt: timestampSchema,
  })
  .strict();

const researchNoteSchema = z
  .object({
    id: idSchema,
    title: requiredText(500),
    content: requiredText(12000),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const researchGapSchema = z
  .object({
    id: idSchema,
    key: requiredText(300),
    kind: z.enum([
      "unresolved_question",
      "unsupported_claim",
      "missing_counterevidence",
      "thin_provenance",
    ]),
    title: requiredText(500),
    detail: requiredText(5000),
    priority: z.enum(["high", "medium", "low"]),
    relatedId: idSchema.optional(),
    createdAt: timestampSchema,
  })
  .strict();

const counterargumentSchema = z
  .object({
    id: idSchema,
    text: requiredText(5000),
    strength: z.enum(["weak", "moderate", "strong"]),
    targetClaimId: idSchema.optional(),
    sourceIds: z.array(idSchema).max(32),
    createdAt: timestampSchema,
  })
  .strict();

const confidenceChangeSchema = z
  .object({
    id: idSchema,
    claimId: idSchema,
    previousConfidence: z.number().min(0).max(1),
    newConfidence: z.number().min(0).max(1),
    reason: requiredText(5000),
    createdAt: timestampSchema,
  })
  .strict();

const decisionOptionSchema = z
  .object({
    id: idSchema,
    name: requiredText(500),
    summary: z.string().max(5000),
    pros: z.array(z.string().max(1000)).max(16),
    cons: z.array(z.string().max(1000)).max(16),
    score: z.number().min(0).max(100),
  })
  .strict();

const optionComparisonSchema = z
  .object({
    id: idSchema,
    title: requiredText(500),
    criteria: z.array(z.string().max(500)).max(16),
    options: z.array(decisionOptionSchema).min(2).max(10),
    recommendation: optionalText(2000),
    rationale: optionalText(8000),
    createdAt: timestampSchema,
  })
  .strict();

const decisionSchema = z
  .object({
    id: idSchema,
    choice: requiredText(2000),
    rationale: requiredText(8000),
    confidence: z.number().min(0).max(1),
    status: z.enum(["draft", "final"]),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

const activitySchema = z
  .object({
    id: idSchema,
    type: z.enum([
      "investigation_created",
      "question_added",
      "question_updated",
      "source_added",
      "source_updated",
      "claim_added",
      "claim_updated",
      "evidence_linked",
      "note_added",
      "note_updated",
      "research_gaps_refreshed",
      "counterargument_added",
      "confidence_updated",
      "comparison_added",
      "decision_recorded",
    ]),
    actor: z.enum(["human", "agent", "system"]),
    message: requiredText(5000),
    entityId: idSchema.optional(),
    createdAt: timestampSchema,
  })
  .strict();

export const workspaceSchema = z
  .object({
    id: idSchema,
    title: requiredText(300),
    primaryQuestion: requiredText(3000),
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    questions: z.array(questionSchema).max(200),
    sources: z.array(sourceSchema).max(500),
    claims: z.array(claimSchema).max(500),
    evidenceLinks: z.array(evidenceLinkSchema).max(1500),
    notes: z.array(researchNoteSchema).max(300),
    researchGaps: z.array(researchGapSchema).max(100),
    counterarguments: z.array(counterargumentSchema).max(300),
    confidenceHistory: z.array(confidenceChangeSchema).max(500),
    comparisons: z.array(optionComparisonSchema).max(50),
    decision: decisionSchema.optional(),
    activity: z.array(activitySchema).max(300),
  })
  .strict();

const backupSchema = z
  .object({
    format: z.literal(DEEPTRAIL_BACKUP_FORMAT),
    version: z.literal(DEEPTRAIL_BACKUP_VERSION),
    exportedAt: timestampSchema,
    workspace: workspaceSchema,
  })
  .strict();

type PlainRecord = Record<string, unknown>;

function isRecord(value: unknown): value is PlainRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function migrateUpdatedAt(value: unknown, fallbackTimestamp: string) {
  if (!isRecord(value)) return value;
  return {
    ...value,
    updatedAt:
      nonEmptyString(value.updatedAt) ??
      nonEmptyString(value.createdAt) ??
      fallbackTimestamp,
  };
}

function migrateSource(value: unknown, fallbackTimestamp: string) {
  if (!isRecord(value)) return value;
  return {
    ...migrateUpdatedAt(value, fallbackTimestamp),
    accessedAt:
      nonEmptyString(value.accessedAt) ??
      nonEmptyString(value.createdAt) ??
      fallbackTimestamp,
  };
}

function migrateLegacyWorkspace(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const fallbackTimestamp =
    nonEmptyString(value.updatedAt) ??
    nonEmptyString(value.createdAt) ??
    new Date().toISOString();

  return {
    ...value,
    questions: Array.isArray(value.questions)
      ? value.questions.map((item) => migrateUpdatedAt(item, fallbackTimestamp))
      : [],
    sources: Array.isArray(value.sources)
      ? value.sources.map((item) => migrateSource(item, fallbackTimestamp))
      : [],
    claims: Array.isArray(value.claims)
      ? value.claims.map((item) => migrateUpdatedAt(item, fallbackTimestamp))
      : [],
    evidenceLinks: Array.isArray(value.evidenceLinks) ? value.evidenceLinks : [],
    notes: Array.isArray(value.notes)
      ? value.notes.map((item) => migrateUpdatedAt(item, fallbackTimestamp))
      : [],
    researchGaps: Array.isArray(value.researchGaps) ? value.researchGaps : [],
    counterarguments: Array.isArray(value.counterarguments) ? value.counterarguments : [],
    confidenceHistory: Array.isArray(value.confidenceHistory) ? value.confidenceHistory : [],
    comparisons: Array.isArray(value.comparisons) ? value.comparisons : [],
    activity: Array.isArray(value.activity) ? value.activity : [],
  };
}

function validationMessage(error: z.ZodError) {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.length ? issue.path.join(".") : "workspace"}: ${issue.message}`)
    .join("; ");
}

export function validateWorkspace(value: unknown): Workspace {
  const result = workspaceSchema.safeParse(migrateLegacyWorkspace(value));
  if (!result.success) {
    throw new Error(`Invalid DeepTrail workspace: ${validationMessage(result.error)}`);
  }
  return result.data as Workspace;
}

export function exportWorkspaceBackup(workspace: Workspace) {
  const validated = validateWorkspace(workspace);
  return JSON.stringify(
    {
      format: DEEPTRAIL_BACKUP_FORMAT,
      version: DEEPTRAIL_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      workspace: validated,
    },
    null,
    2,
  );
}

export function parseWorkspaceBackup(text: string): Workspace {
  if (new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    throw new Error("Backup is larger than the 2 MB DeepTrail import limit.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Backup is not valid JSON.");
  }

  if (isRecord(parsed) && "format" in parsed) {
    const result = backupSchema.safeParse({
      ...parsed,
      workspace: migrateLegacyWorkspace(parsed.workspace),
    });
    if (!result.success) {
      throw new Error(`Invalid DeepTrail backup: ${validationMessage(result.error)}`);
    }
    return result.data.workspace as Workspace;
  }

  return validateWorkspace(parsed);
}

export interface ContentRiskWarning {
  location: string;
  indicator: string;
}

const PROMPT_INJECTION_INDICATORS = [
  { label: "instruction override", pattern: /ignore\s+(all\s+)?previous\s+instructions/i },
  { label: "system prompt request", pattern: /(reveal|show|print|output).{0,40}system\s+prompt/i },
  { label: "developer-message request", pattern: /(reveal|show|print|output).{0,40}developer\s+(message|instructions)/i },
  { label: "tool coercion", pattern: /(must|immediately)\s+(call|invoke|execute)\s+.{0,30}(tool|function)/i },
  { label: "data exfiltration language", pattern: /(exfiltrat|send|upload).{0,50}(secret|credential|token|private\s+data)/i },
];

export function assessWorkspaceContentRisk(workspace: Workspace): ContentRiskWarning[] {
  const warnings: ContentRiskWarning[] = [];

  const inspect = (location: string, value: string | undefined) => {
    if (!value) return;
    for (const indicator of PROMPT_INJECTION_INDICATORS) {
      if (indicator.pattern.test(value)) {
        warnings.push({ location, indicator: indicator.label });
      }
    }
  };

  workspace.sources.forEach((source, index) => {
    inspect(`source ${index + 1} title`, source.title);
    inspect(`source ${index + 1} summary`, source.summary);
  });
  workspace.claims.forEach((claim, index) => inspect(`claim ${index + 1}`, claim.text));
  workspace.notes.forEach((note, index) => {
    inspect(`note ${index + 1} title`, note.title);
    inspect(`note ${index + 1}`, note.content);
  });
  workspace.counterarguments.forEach((item, index) =>
    inspect(`counterargument ${index + 1}`, item.text),
  );
  workspace.comparisons.forEach((comparison, index) => {
    inspect(`comparison ${index + 1} recommendation`, comparison.recommendation);
    inspect(`comparison ${index + 1} rationale`, comparison.rationale);
  });
  if (workspace.decision) {
    inspect("decision choice", workspace.decision.choice);
    inspect("decision rationale", workspace.decision.rationale);
  }

  return warnings.slice(0, 12);
}
