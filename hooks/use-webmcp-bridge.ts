"use client";

import { useEffect, useRef, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import type { ClaimStance, EvidenceRelationship, Workspace } from "@/lib/types";

export type WebMCPStatus = "checking" | "ready" | "unsupported" | "error";

function result(payload: unknown) {
  return JSON.stringify(payload);
}

function clip(value: string | undefined, maxLength: number) {
  if (!value) return undefined;
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

export function useWebMCPBridge(workspace: Workspace | null, actions: DeepTrailActions) {
  const [status, setStatus] = useState<WebMCPStatus>("checking");
  const [error, setError] = useState<string | null>(null);
  const workspaceRef = useRef(workspace);
  const actionsRef = useRef(actions);

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
      return;
    }

    const controller = new AbortController();

    const register = async () => {
      const tools: WebMCPToolDefinition[] = [
        {
          name: "deeptrail_get_workspace",
          title: "Get DeepTrail workspace",
          description:
            "Read the active DeepTrail investigation, compact recent research state, and stable IDs needed by other DeepTrail tools. Call this before mutating the workspace.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async () => {
            const current = workspaceRef.current;
            if (!current) return result({ activeInvestigation: false });
            return result({
              activeInvestigation: true,
              id: current.id,
              title: clip(current.title, 120),
              primaryQuestion: clip(current.primaryQuestion, 240),
              counts: {
                openQuestions: current.questions.filter((question) => question.status === "open").length,
                sources: current.sources.length,
                claims: current.claims.length,
                evidenceLinks: current.evidenceLinks.length,
              },
              recentSources: current.sources.slice(0, 5).map((source) => ({
                id: source.id,
                url: source.url,
                title: clip(source.title, 120),
              })),
              recentClaims: current.claims.slice(0, 5).map((claim) => ({
                id: claim.id,
                text: clip(claim.text, 180),
                stance: claim.stance,
                confidence: claim.confidence,
              })),
            });
          },
        },
        {
          name: "deeptrail_get_open_questions",
          title: "Get open research questions",
          description:
            "Read unresolved research questions in the active DeepTrail investigation. Use this to decide what should be researched next.",
          inputSchema: { type: "object", properties: {}, additionalProperties: false },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          execute: async () => {
            const current = workspaceRef.current;
            return result({
              workspaceId: current?.id ?? null,
              questions:
                current?.questions
                  .filter((question) => question.status === "open")
                  .slice(0, 10)
                  .map((question) => ({ id: question.id, text: clip(question.text, 220) })) ?? [],
            });
          },
        },
        {
          name: "deeptrail_add_source",
          title: "Add a research source",
          description:
            "Add one web source relevant to the active investigation. Prefer primary or high-quality sources. Reusing the same normalized URL returns the existing source.",
          inputSchema: {
            type: "object",
            properties: {
              url: { type: "string", maxLength: 1500, description: "Absolute http or https source URL." },
              title: { type: "string", maxLength: 240, description: "Page or document title." },
              publisher: { type: "string", maxLength: 120, description: "Publisher, organization, or site name." },
              summary: { type: "string", maxLength: 500, description: "Short source-specific summary relevant to this investigation." },
            },
            required: ["url"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          execute: async (input) => {
            const source = actionsRef.current.addSource(input as { url: string; title?: string; publisher?: string; summary?: string });
            return result({ ok: true, sourceId: source.id, url: source.url, title: clip(source.title, 160) });
          },
        },
        {
          name: "deeptrail_add_claim",
          title: "Add a research claim",
          description:
            "Add one concise factual or analytical claim. Do not put citations in claim text; add the source separately and connect it with deeptrail_link_evidence.",
          inputSchema: {
            type: "object",
            properties: {
              text: { type: "string", minLength: 1, maxLength: 600, description: "One concise claim." },
              stance: {
                type: "string",
                enum: ["supports", "contradicts", "neutral"],
                description: "How the claim relates to the likely conclusion.",
              },
              confidence: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Current confidence from 0 to 1; use 0.5 when uncertain.",
              },
            },
            required: ["text"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false, untrustedContentHint: true },
          execute: async (input) => {
            const typed = input as { text: string; stance?: ClaimStance; confidence?: number };
            const claim = actionsRef.current.addClaim(typed);
            return result({ ok: true, claimId: claim.id, text: clip(claim.text, 220), stance: claim.stance, confidence: claim.confidence });
          },
        },
        {
          name: "deeptrail_link_evidence",
          title: "Link a source to a claim",
          description:
            "Connect an existing DeepTrail source to an existing claim as supporting, contradicting, or qualifying evidence. Use IDs returned by DeepTrail read/add tools.",
          inputSchema: {
            type: "object",
            properties: {
              sourceId: { type: "string", maxLength: 80, description: "Existing DeepTrail source ID." },
              claimId: { type: "string", maxLength: 80, description: "Existing DeepTrail claim ID." },
              relationship: {
                type: "string",
                enum: ["supports", "contradicts", "qualifies"],
                description: "Source-to-claim evidentiary relationship.",
              },
              note: { type: "string", maxLength: 400, description: "Optional short explanation for the relationship." },
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
            const evidenceLink = actionsRef.current.linkEvidence(typed);
            return result({ ok: true, evidenceLinkId: evidenceLink.id, relationship: evidenceLink.relationship });
          },
        },
      ];

      for (const tool of tools) {
        await modelContext.registerTool(tool, { signal: controller.signal });
      }
      setStatus("ready");
    };

    register().catch((registrationError: unknown) => {
      if (controller.signal.aborted) return;
      setError(registrationError instanceof Error ? registrationError.message : "WebMCP tool registration failed.");
      setStatus("error");
    });

    return () => controller.abort();
  }, []);

  return { status, error, registeredToolCount: status === "ready" ? 5 : 0 };
}
