import { z } from "zod";

const id = z.string().min(1).max(128);
const text = (max: number) => z.string().min(1).max(max);
const optionalText = (max: number) => z.string().max(max).optional();
const httpUrl = z
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

export const emptyInputSchema = z.object({}).strict();

export const addSourceInputSchema = z
  .object({
    url: httpUrl,
    title: optionalText(500),
    publisher: optionalText(300),
    summary: optionalText(8000),
    publishedAt: optionalText(64),
  })
  .strict();

export const addClaimInputSchema = z
  .object({
    text: text(5000),
    stance: z.enum(["supports", "contradicts", "neutral"]).optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
  .strict();

export const linkEvidenceInputSchema = z
  .object({
    sourceId: id,
    claimId: id,
    relationship: z.enum(["supports", "contradicts", "qualifies"]),
    note: optionalText(4000),
  })
  .strict();

export const addQuestionInputSchema = z.object({ text: text(3000) }).strict();

export const identifyGapsInputSchema = z
  .object({ limit: z.number().int().min(1).max(12).optional() })
  .strict();

const compareOptionSchema = z
  .object({
    name: text(500),
    summary: optionalText(5000),
    pros: z.array(z.string().max(1000)).max(8).optional(),
    cons: z.array(z.string().max(1000)).max(8).optional(),
    score: z.number().min(0).max(100).optional(),
  })
  .strict();

export const compareOptionsInputSchema = z
  .object({
    title: text(500),
    criteria: z.array(z.string().max(500)).max(8).optional(),
    options: z.array(compareOptionSchema).min(2).max(6),
    recommendation: optionalText(2000),
    rationale: optionalText(8000),
  })
  .strict();

export const recordDecisionInputSchema = z
  .object({
    choice: text(2000),
    rationale: text(8000),
    confidence: z.number().min(0).max(1).optional(),
    status: z.enum(["draft", "final"]).optional(),
  })
  .strict();

export const addCounterargumentInputSchema = z
  .object({
    text: text(5000),
    strength: z.enum(["weak", "moderate", "strong"]).optional(),
    targetClaimId: id.optional(),
    sourceIds: z.array(id).max(8).optional(),
  })
  .strict();

export const updateConfidenceInputSchema = z
  .object({
    claimId: id,
    confidence: z.number().min(0).max(1),
    reason: text(5000),
  })
  .strict();

export function parseWebMCPInput<T extends z.ZodType>(toolName: string, schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const details = result.error.issues
    .slice(0, 4)
    .map((issue) => `${issue.path.join(".") || "input"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid input for ${toolName}: ${details}`);
}
