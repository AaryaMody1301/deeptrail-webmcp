"use client";

import { useEffect, useRef, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import type { Workspace } from "@/lib/types";
import {
  addClaimInputSchema,
  addCounterargumentInputSchema,
  addQuestionInputSchema,
  addSourceInputSchema,
  compareOptionsInputSchema,
  emptyInputSchema,
  identifyGapsInputSchema,
  linkEvidenceInputSchema,
  parseWebMCPInput,
  recordDecisionInputSchema,
  updateConfidenceInputSchema,
} from "@/lib/webmcp-inputs";

export type WebMCPStatus = "checking" | "ready" | "unsupported" | "error";

const TOOL_OUTPUT_BUDGET = 1400;

function compactText(value: string | undefined, max = 220) {
  if (!value) return undefined;
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function result(payload: unknown) {
  const serialized = JSON.stringify(payload);
  if (serialized.length <= TOOL_OUTPUT_BUDGET) return serialized;

  return JSON.stringify({
    truncated: true,
    message: "DeepTrail compacted this tool result to stay within the WebMCP output budget. Use a narrower read tool or returned IDs for the next action.",
    preview: serialized.slice(0, 1050),
  });
}

export function useWebMCPBridge(workspace: Workspace | null, actions: DeepTrailActions) {
  const [status, setStatus] = useState<WebMCPStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const [registeredToolCount, setRegisteredToolCount] = useState(0);
  const workspaceRef = useRef(workspace);
  const actionsRef = useRef(actions);
  const hasWorkspace = Boolean(workspace);
  const hasClaims = Boolean(workspace?.claims.length);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    actionsRef.current = actions;
  }, [actions]);

  useEffect(() => {
    const modelContext = document.modelContext;
    if (!modelContext?.registerTool) {
      setStatus("unsupported");
      setRegisteredToolCount(0);
      return;
    }

    const controller = new AbortController();
    setStatus("checking");
    setError(null);

    const register = async () => {
      const tools: WebMCPToolDefinition[] = [
        {
          name: "deeptrail_get_workspace_context",
          title: "Get DeepTrail workspace context",
          description:
            "Read compact context for the active DeepTrail investigation: open questions, recent source/claim IDs, evidence links, falsification criteria, decision, and counts.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async (input) => {
            parseWebMCPInput("deeptrail_get_workspace_context", emptyInputSchema, input);
            const current = workspaceRef.current;
            if (!current) return result({ activeInvestigation: false });

            return result({
              activeInvestigation: true,
              workspace: {
                id: current.id,
                title: compactText(current.title, 120),
                primaryQuestion: compactText(current.primaryQuestion, 240),
                openQuestions: current.questions
                  .filter((question) => question.status === "open")
                  .slice(0, 4)
                  .map((question) => ({ id: question.id, text: compactText(question.text, 180) })),
                recentSources: current.sources.slice(0, 4).map((source) => ({
                  id: source.id,
                  url: source.url,
                  title: compactText(source.title, 100),
                  publisher: compactText(source.publisher, 60),
                })),
                recentClaims: current.claims.slice(0, 4).map((claim) => ({
                  id: claim.id,
                  text: compactText(claim.text, 180),
                  stance: claim.stance,
                  confidence: claim.confidence,
                })),
                recentEvidenceLinks: current.evidenceLinks.slice(0, 6).map((link) => ({
                  sourceId: link.sourceId,
                  claimId: link.claimId,
                  relationship: link.relationship,
                })),
                falsificationCriteria: current.notes
                  .filter((note) => note.title.startsWith("What would change my mind"))
                  .slice(0, 4)
                  .map((note) => ({ id: note.id, title: note.title, content: compactText(note.content, 180) })),
                decision: current.decision
                  ? {
                      id: current.decision.id,
                      choice: compactText(current.decision.choice, 160),
                      confidence: current.decision.confidence,
                      status: current.decision.status,
                    }
                  : null,
              },
              counts: {
                openQuestions: current.questions.filter((question) => question.status === "open").length,
                sources: current.sources.length,
                claims: current.claims.length,
                evidenceLinks: current.evidenceLinks.length,
                researchGaps: current.researchGaps.length,
                counterarguments: current.counterarguments.length,
                confidenceChanges: current.confidenceHistory.length,
                comparisons: current.comparisons.length,
              },
            });
          },
        },
      ];

      if (hasWorkspace) {
        tools.push(
          {
            name: "deeptrail_get_open_questions",
            title: "Get open research questions",
            description:
              "Read unresolved research questions in the active DeepTrail investigation to choose what to investigate next.",
            inputSchema: { type: "object", properties: {}, additionalProperties: false },
            annotations: { readOnlyHint: true, untrustedContentHint: true },
            execute: async (input) => {
              parseWebMCPInput("deeptrail_get_open_questions", emptyInputSchema, input);
              const current = workspaceRef.current;
              return result({
                workspaceId: current?.id ?? null,
                questions:
                  current?.questions
                    .filter((question) => question.status === "open")
                    .slice(0, 8)
                    .map((question) => ({ id: question.id, text: compactText(question.text, 220) })) ?? [],
              });
            },
          },
          {
            name: "deeptrail_add_source",
            title: "Add a research source",
            description:
              "Add one relevant http/https web source with provenance metadata. Duplicate normalized URLs return the existing source.",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", maxLength: 2048, description: "Absolute http or https source URL." },
                title: { type: "string", maxLength: 500, description: "Page or document title." },
                publisher: { type: "string", maxLength: 300, description: "Publisher or organization." },
                summary: { type: "string", maxLength: 8000, description: "Short source-specific research summary." },
                publishedAt: { type: "string", maxLength: 64, description: "Publication date when known." },
              },
              required: ["url"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_add_source", addSourceInputSchema, input);
              const source = actionsRef.current.addSource(typed, "agent");
              return result({ ok: true, source: { id: source.id, url: source.url, title: compactText(source.title, 180) } });
            },
          },
          {
            name: "deeptrail_add_claim",
            title: "Add a research claim",
            description:
              "Add one concise claim with stance and confidence. Add provenance separately and link the source to this claim.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", maxLength: 5000, description: "One concise factual or analytical claim." },
                stance: { type: "string", enum: ["supports", "contradicts", "neutral"], description: "Current relation to the likely conclusion." },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "Confidence from 0 to 1." },
              },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_add_claim", addClaimInputSchema, input);
              const claim = actionsRef.current.addClaim(typed, "agent");
              return result({
                ok: true,
                claim: {
                  id: claim.id,
                  text: compactText(claim.text, 260),
                  stance: claim.stance,
                  confidence: claim.confidence,
                },
              });
            },
          },
          {
            name: "deeptrail_link_evidence",
            title: "Link a source to a claim",
            description:
              "Connect an existing source to an existing claim as supporting, contradicting, or qualifying evidence.",
            inputSchema: {
              type: "object",
              properties: {
                sourceId: { type: "string", maxLength: 128, description: "Existing DeepTrail source ID." },
                claimId: { type: "string", maxLength: 128, description: "Existing DeepTrail claim ID." },
                relationship: { type: "string", enum: ["supports", "contradicts", "qualifies"], description: "Evidence relationship." },
                note: { type: "string", maxLength: 4000, description: "Optional explanation for this relationship." },
              },
              required: ["sourceId", "claimId", "relationship"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_link_evidence", linkEvidenceInputSchema, input);
              const link = actionsRef.current.linkEvidence(typed, "agent");
              return result({
                ok: true,
                evidenceLink: {
                  id: link.id,
                  sourceId: link.sourceId,
                  claimId: link.claimId,
                  relationship: link.relationship,
                },
              });
            },
          },
          {
            name: "deeptrail_add_open_question",
            title: "Add an open research question",
            description:
              "Add one focused follow-up question that should be investigated before the current conclusion is trusted.",
            inputSchema: {
              type: "object",
              properties: { text: { type: "string", maxLength: 3000, description: "Focused unresolved research question." } },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_add_open_question", addQuestionInputSchema, input);
              const question = actionsRef.current.addQuestion(typed.text, "agent");
              return result({ ok: true, question: { id: question.id, text: compactText(question.text, 260), status: question.status } });
            },
          },
          {
            name: "deeptrail_identify_research_gaps",
            title: "Identify research gaps",
            description:
              "Derive and persist structural gaps: unresolved questions, unsupported claims, missing counterevidence, and thin provenance.",
            inputSchema: {
              type: "object",
              properties: { limit: { type: "integer", minimum: 1, maximum: 12, description: "Maximum gaps to keep; default 8." } },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_identify_research_gaps", identifyGapsInputSchema, input);
              const gaps = actionsRef.current.identifyResearchGaps(typed.limit ?? 8, "agent");
              return result({
                ok: true,
                count: gaps.length,
                gaps: gaps.map((gap) => ({ id: gap.id, kind: gap.kind, priority: gap.priority, title: compactText(gap.title, 120) })),
              });
            },
          },
          {
            name: "deeptrail_compare_options",
            title: "Compare decision options",
            description:
              "Record a structured comparison of two to six options with criteria, pros, cons, scores, recommendation, and rationale.",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", maxLength: 500, description: "What is being compared." },
                criteria: { type: "array", items: { type: "string", maxLength: 500 }, maxItems: 8, description: "User-relevant criteria." },
                options: {
                  type: "array",
                  minItems: 2,
                  maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", maxLength: 500 },
                      summary: { type: "string", maxLength: 5000 },
                      pros: { type: "array", items: { type: "string", maxLength: 1000 }, maxItems: 8 },
                      cons: { type: "array", items: { type: "string", maxLength: 1000 }, maxItems: 8 },
                      score: { type: "number", minimum: 0, maximum: 100 },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
                recommendation: { type: "string", maxLength: 2000, description: "Optional concise recommendation." },
                rationale: { type: "string", maxLength: 8000, description: "Evidence- and constraint-based rationale." },
              },
              required: ["title", "options"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_compare_options", compareOptionsInputSchema, input);
              const comparison = actionsRef.current.compareOptions(typed, "agent");
              return result({
                ok: true,
                comparison: {
                  id: comparison.id,
                  title: compactText(comparison.title, 180),
                  options: comparison.options.map((option) => ({ name: compactText(option.name, 100), score: option.score })),
                  recommendation: compactText(comparison.recommendation, 180),
                },
              });
            },
          },
          {
            name: "deeptrail_record_decision",
            title: "Record an evidence-backed decision",
            description:
              "Record or update the current draft/final decision with rationale and confidence. Use final only when evidence supports commitment.",
            inputSchema: {
              type: "object",
              properties: {
                choice: { type: "string", maxLength: 2000, description: "Current decision or selected option." },
                rationale: { type: "string", maxLength: 8000, description: "Rationale tied to evidence and constraints." },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "Decision confidence from 0 to 1." },
                status: { type: "string", enum: ["draft", "final"], description: "Provisional or final decision." },
              },
              required: ["choice", "rationale"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_record_decision", recordDecisionInputSchema, input);
              const decision = actionsRef.current.recordDecision(typed, "agent");
              return result({
                ok: true,
                decision: {
                  id: decision.id,
                  choice: compactText(decision.choice, 220),
                  confidence: decision.confidence,
                  status: decision.status,
                },
              });
            },
          },
        );
      }

      if (hasWorkspace && hasClaims) {
        tools.push(
          {
            name: "deeptrail_add_counterargument",
            title: "Add a counterargument",
            description:
              "Record a strong objection or alternative explanation against a claim. Link existing source IDs when evidence-backed.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", maxLength: 5000, description: "Concise counterargument or alternative explanation." },
                strength: { type: "string", enum: ["weak", "moderate", "strong"], description: "Potential to change the conclusion." },
                targetClaimId: { type: "string", maxLength: 128, description: "Claim ID being challenged." },
                sourceIds: { type: "array", items: { type: "string", maxLength: 128 }, maxItems: 8, description: "Existing supporting source IDs." },
              },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_add_counterargument", addCounterargumentInputSchema, input);
              const counterargument = actionsRef.current.addCounterargument(typed, "agent");
              return result({
                ok: true,
                counterargument: {
                  id: counterargument.id,
                  strength: counterargument.strength,
                  targetClaimId: counterargument.targetClaimId,
                  sourceIds: counterargument.sourceIds,
                },
              });
            },
          },
          {
            name: "deeptrail_update_confidence",
            title: "Update claim confidence",
            description:
              "Change an existing claim's confidence only when evidence warrants it, and persist an explicit reason in confidence history.",
            inputSchema: {
              type: "object",
              properties: {
                claimId: { type: "string", maxLength: 128, description: "Existing claim ID." },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "New confidence from 0 to 1." },
                reason: { type: "string", maxLength: 5000, description: "Why evidence justifies the change." },
              },
              required: ["claimId", "confidence", "reason"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = parseWebMCPInput("deeptrail_update_confidence", updateConfidenceInputSchema, input);
              const change = actionsRef.current.updateConfidence(typed, "agent");
              return result({
                ok: true,
                change: {
                  id: change.id,
                  claimId: change.claimId,
                  previousConfidence: change.previousConfidence,
                  newConfidence: change.newConfidence,
                  reason: compactText(change.reason, 280),
                },
              });
            },
          },
        );
      }

      for (const tool of tools) {
        await modelContext.registerTool(tool, { signal: controller.signal });
      }
      setRegisteredToolCount(tools.length);
      setStatus("ready");
    };

    register().catch((registrationError: unknown) => {
      if (controller.signal.aborted) return;
      setError(registrationError instanceof Error ? registrationError.message : "WebMCP tool registration failed.");
      setRegisteredToolCount(0);
      setStatus("error");
    });

    return () => controller.abort();
  }, [hasWorkspace, hasClaims]);

  return { status, error, registeredToolCount };
}
