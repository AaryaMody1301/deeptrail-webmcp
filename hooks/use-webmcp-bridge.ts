"use client";

import { useEffect, useRef, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import type { ClaimStance, EvidenceRelationship, Workspace } from "@/lib/types";

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
            "Read the active DeepTrail investigation and the stable research IDs needed for other DeepTrail actions.",
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
              },
              counts: {
                openQuestions: current.questions.filter((question) => question.status === "open").length,
                sources: current.sources.length,
                claims: current.claims.length,
                evidenceLinks: current.evidenceLinks.length,
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
  }, [hasWorkspace]);

  return { status, error, registeredToolCount };
}
