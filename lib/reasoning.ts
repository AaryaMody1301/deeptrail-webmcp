import type { ResearchGap, Workspace } from "@/lib/types";

function timestamp() {
  return new Date().toISOString();
}

function stableGap(
  workspace: Workspace,
  draft: Omit<ResearchGap, "id" | "createdAt">,
): ResearchGap {
  const existing = workspace.researchGaps.find((gap) => gap.key === draft.key);
  return {
    ...draft,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? timestamp(),
  };
}

export function deriveResearchGaps(workspace: Workspace, limit = 8): ResearchGap[] {
  const gaps: ResearchGap[] = [];
  const evidenceCount = new Map<string, number>();

  for (const link of workspace.evidenceLinks) {
    evidenceCount.set(link.claimId, (evidenceCount.get(link.claimId) ?? 0) + 1);
  }

  for (const question of workspace.questions.filter((item) => item.status === "open")) {
    gaps.push(
      stableGap(workspace, {
        key: `question:${question.id}`,
        kind: "unresolved_question",
        title: "Open research question",
        detail: question.text,
        priority: question.text === workspace.primaryQuestion ? "high" : "medium",
        relatedId: question.id,
      }),
    );
  }

  for (const claim of workspace.claims) {
    if ((evidenceCount.get(claim.id) ?? 0) > 0) continue;
    gaps.push(
      stableGap(workspace, {
        key: `claim:${claim.id}`,
        kind: "unsupported_claim",
        title: "Claim lacks linked evidence",
        detail: claim.text,
        priority: claim.confidence >= 0.7 ? "high" : "medium",
        relatedId: claim.id,
      }),
    );
  }

  const hasCounterevidence =
    workspace.counterarguments.length > 0 ||
    workspace.evidenceLinks.some((link) => link.relationship === "contradicts");

  if (workspace.claims.length > 0 && !hasCounterevidence) {
    gaps.push(
      stableGap(workspace, {
        key: "workspace:counterevidence",
        kind: "missing_counterevidence",
        title: "No counterevidence captured",
        detail: "The investigation has claims but no recorded contradictory evidence or counterargument yet.",
        priority: "high",
      }),
    );
  }

  if (workspace.sources.length < 2) {
    gaps.push(
      stableGap(workspace, {
        key: "workspace:provenance",
        kind: "thin_provenance",
        title: "Source base is still thin",
        detail:
          workspace.sources.length === 0
            ? "No web sources have been captured yet."
            : "Only one distinct web source has been captured so far.",
        priority: workspace.sources.length === 0 ? "high" : "medium",
      }),
    );
  }

  const priorityRank = { high: 0, medium: 1, low: 2 } as const;
  return gaps
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, Math.min(12, Math.max(1, limit)));
}
