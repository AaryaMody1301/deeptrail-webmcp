"use client";

import { useEffect, useRef, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import type {
  ClaimStance,
  CompareOptionsInput,
  CounterargumentStrength,
  DecisionStatus,
  EvidenceRelationship,
  Workspace,
} from "@/lib/types";

export type WebMCPStatus = "checking" | "ready" | "unsupported" | "error";

function result(payload: unknown) {
  return JSON.stringify(payload, null, 2);
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
            "Read the active DeepTrail investigation, stable IDs, evidence state, and current reasoning artifacts needed for other DeepTrail actions.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async () => {
            const current = workspaceRef.current;
            if (!current) return result({ activeInvestigation: false });
            return result({
              activeInvestigation: true,
              workspace: {
                id: current.id,
                title: current.title,
                primaryQuestion: current.primaryQuestion,
                questions: current.questions,
                sources: current.sources,
                claims: current.claims,
                evidenceLinks: current.evidenceLinks,
                notes: current.notes,
                researchGaps: current.researchGaps,
                counterarguments: current.counterarguments,
                latestComparison: current.comparisons[0] ?? null,
                decision: current.decision ?? null,
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
            execute: async () => {
              const current = workspaceRef.current;
              return result({
                workspaceId: current?.id ?? null,
                questions: current?.questions.filter((question) => question.status === "open") ?? [],
              });
            },
          },
          {
            name: "deeptrail_add_source",
            title: "Add a research source",
            description:
              "Add one relevant web source to the active investigation with provenance metadata. Reusing the same normalized URL returns the existing source.",
            inputSchema: {
              type: "object",
              properties: {
                url: { type: "string", description: "Absolute http or https URL for the source." },
                title: { type: "string", description: "Human-readable page or document title." },
                publisher: { type: "string", description: "Publisher, organization, or site name when known." },
                summary: { type: "string", description: "Short source-specific summary relevant to this investigation." },
                publishedAt: { type: "string", description: "Publication date when the source provides one, preferably YYYY-MM-DD." },
              },
              required: ["url"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const source = actionsRef.current.addSource(
                input as { url: string; title?: string; publisher?: string; summary?: string; publishedAt?: string },
                "agent",
              );
              return result({ ok: true, source });
            },
          },
          {
            name: "deeptrail_add_claim",
            title: "Add a research claim",
            description:
              "Add one concise claim to the active investigation with a stance and confidence estimate. Link supporting provenance separately.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "A single concise claim." },
                stance: {
                  type: "string",
                  enum: ["supports", "contradicts", "neutral"],
                  description: "How the claim currently relates to the investigation's likely conclusion.",
                },
                confidence: {
                  type: "number",
                  minimum: 0,
                  maximum: 1,
                  description: "Current confidence from 0 to 1. Use 0.5 when uncertain.",
                },
              },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = input as { text: string; stance?: ClaimStance; confidence?: number };
              const claim = actionsRef.current.addClaim(typed, "agent");
              return result({ ok: true, claim });
            },
          },
          {
            name: "deeptrail_link_evidence",
            title: "Link a source to a claim",
            description:
              "Connect an existing DeepTrail source to an existing claim as supporting, contradicting, or qualifying evidence.",
            inputSchema: {
              type: "object",
              properties: {
                sourceId: { type: "string", description: "Existing DeepTrail source ID." },
                claimId: { type: "string", description: "Existing DeepTrail claim ID." },
                relationship: {
                  type: "string",
                  enum: ["supports", "contradicts", "qualifies"],
                  description: "The evidentiary relationship between this source and claim.",
                },
                note: { type: "string", description: "Optional short explanation of why the source has this relationship." },
              },
              required: ["sourceId", "claimId", "relationship"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const typed = input as {
                sourceId: string;
                claimId: string;
                relationship: EvidenceRelationship;
                note?: string;
              };
              const evidenceLink = actionsRef.current.linkEvidence(typed, "agent");
              return result({ ok: true, evidenceLink });
            },
          },
          {
            name: "deeptrail_add_open_question",
            title: "Add an open research question",
            description:
              "Add one concrete follow-up question that should be investigated before the current conclusion is trusted.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "A focused unresolved research question." },
              },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const question = actionsRef.current.addQuestion(String(input.text ?? ""), "agent");
              return result({ ok: true, question });
            },
          },
          {
            name: "deeptrail_identify_research_gaps",
            title: "Identify research gaps",
            description:
              "Derive and persist the highest-priority gaps from DeepTrail state: unresolved questions, unsupported claims, missing counterevidence, and thin provenance.",
            inputSchema: {
              type: "object",
              properties: {
                limit: { type: "integer", minimum: 1, maximum: 12, description: "Maximum number of gaps to keep. Default 8." },
              },
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const limit = typeof input.limit === "number" ? input.limit : 8;
              const gaps = actionsRef.current.identifyResearchGaps(limit, "agent");
              return result({ ok: true, gaps });
            },
          },
          {
            name: "deeptrail_compare_options",
            title: "Compare decision options",
            description:
              "Record a structured comparison of at least two decision options, including criteria, pros, cons, scores, recommendation, and rationale.",
            inputSchema: {
              type: "object",
              properties: {
                title: { type: "string", description: "What is being compared." },
                criteria: {
                  type: "array",
                  items: { type: "string" },
                  maxItems: 8,
                  description: "Decision criteria that matter to the user.",
                },
                options: {
                  type: "array",
                  minItems: 2,
                  maxItems: 6,
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      summary: { type: "string" },
                      pros: { type: "array", items: { type: "string" }, maxItems: 8 },
                      cons: { type: "array", items: { type: "string" }, maxItems: 8 },
                      score: { type: "number", minimum: 0, maximum: 100 },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                },
                recommendation: { type: "string", description: "Optional recommended option name or concise recommendation." },
                rationale: { type: "string", description: "Why the recommendation follows from the evidence and user constraints." },
              },
              required: ["title", "options"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const comparison = actionsRef.current.compareOptions(input as unknown as CompareOptionsInput, "agent");
              return result({ ok: true, comparison });
            },
          },
          {
            name: "deeptrail_record_decision",
            title: "Record an evidence-backed decision",
            description:
              "Record or update the current draft/final decision with rationale and confidence. Use final only when the user has enough evidence to commit.",
            inputSchema: {
              type: "object",
              properties: {
                choice: { type: "string", description: "The current decision or selected option." },
                rationale: { type: "string", description: "Concise rationale tied to the investigation's evidence and constraints." },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "Decision confidence from 0 to 1." },
                status: { type: "string", enum: ["draft", "final"], description: "Whether this is still provisional or final." },
              },
              required: ["choice", "rationale"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const decision = actionsRef.current.recordDecision(
                {
                  choice: String(input.choice ?? ""),
                  rationale: String(input.rationale ?? ""),
                  confidence: typeof input.confidence === "number" ? input.confidence : undefined,
                  status: input.status as DecisionStatus | undefined,
                },
                "agent",
              );
              return result({ ok: true, decision });
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
              "Record a strong objection or alternative explanation against an existing claim. Link source IDs when the counterargument is evidence-backed.",
            inputSchema: {
              type: "object",
              properties: {
                text: { type: "string", description: "The strongest concise counterargument or alternative explanation." },
                strength: { type: "string", enum: ["weak", "moderate", "strong"], description: "How materially this could change the conclusion." },
                targetClaimId: { type: "string", description: "Existing claim ID being challenged when applicable." },
                sourceIds: { type: "array", items: { type: "string" }, maxItems: 8, description: "Existing source IDs supporting this counterargument." },
              },
              required: ["text"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const counterargument = actionsRef.current.addCounterargument(
                {
                  text: String(input.text ?? ""),
                  strength: input.strength as CounterargumentStrength | undefined,
                  targetClaimId: typeof input.targetClaimId === "string" ? input.targetClaimId : undefined,
                  sourceIds: Array.isArray(input.sourceIds) ? input.sourceIds.map(String) : undefined,
                },
                "agent",
              );
              return result({ ok: true, counterargument });
            },
          },
          {
            name: "deeptrail_update_confidence",
            title: "Update claim confidence",
            description:
              "Change an existing claim's confidence only when new evidence or counterevidence warrants it, and record the reason in confidence history.",
            inputSchema: {
              type: "object",
              properties: {
                claimId: { type: "string", description: "Existing claim ID." },
                confidence: { type: "number", minimum: 0, maximum: 1, description: "New confidence from 0 to 1." },
                reason: { type: "string", description: "Why the evidence justifies this confidence change." },
              },
              required: ["claimId", "confidence", "reason"],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: true },
            execute: async (input) => {
              const change = actionsRef.current.updateConfidence(
                {
                  claimId: String(input.claimId ?? ""),
                  confidence: Number(input.confidence),
                  reason: String(input.reason ?? ""),
                },
                "agent",
              );
              return result({ ok: true, change });
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
