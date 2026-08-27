import type { Workspace } from "@/lib/types";

export interface ResearchDebtBreakdown {
  openQuestions: number;
  unsupportedClaims: number;
  missingCounterevidence: number;
  thinProvenance: number;
}

export interface ResearchDebtResult {
  score: number;
  level: "low" | "moderate" | "high" | "critical";
  breakdown: ResearchDebtBreakdown;
  unsupportedClaimCount: number;
  openQuestionCount: number;
}

export function calculateResearchDebt(workspace: Workspace): ResearchDebtResult {
  const linkedClaimIds = new Set(workspace.evidenceLinks.map((link) => link.claimId));
  const unsupportedClaimCount = workspace.claims.filter((claim) => !linkedClaimIds.has(claim.id)).length;
  const openQuestionCount = workspace.questions.filter((question) => question.status === "open").length;
  const hasCounterevidence =
    workspace.counterarguments.length > 0 ||
    workspace.evidenceLinks.some((link) => link.relationship === "contradicts");

  const breakdown: ResearchDebtBreakdown = {
    openQuestions: Math.min(30, openQuestionCount * 10),
    unsupportedClaims: Math.min(30, unsupportedClaimCount * 12),
    missingCounterevidence: workspace.claims.length > 0 && !hasCounterevidence ? 20 : 0,
    thinProvenance: workspace.sources.length === 0 ? 20 : workspace.sources.length === 1 ? 10 : 0,
  };

  const score = Math.min(
    100,
    breakdown.openQuestions +
      breakdown.unsupportedClaims +
      breakdown.missingCounterevidence +
      breakdown.thinProvenance,
  );

  const level = score <= 20 ? "low" : score <= 50 ? "moderate" : score <= 75 ? "high" : "critical";

  return {
    score,
    level,
    breakdown,
    unsupportedClaimCount,
    openQuestionCount,
  };
}
