import type { Workspace } from "@/lib/types";

export function createWorkspaceFixture(): Workspace {
  const now = "2026-08-27T17:00:00.000Z";
  return {
    id: "workspace-1",
    title: "ClickHouse vs BigQuery",
    primaryQuestion: "Which platform best fits a two-engineer analytics team?",
    createdAt: now,
    updatedAt: now,
    questions: [
      {
        id: "question-1",
        text: "Which platform best fits a two-engineer analytics team?",
        status: "open",
        createdAt: now,
        updatedAt: now,
      },
    ],
    sources: [],
    claims: [],
    evidenceLinks: [],
    notes: [],
    researchGaps: [],
    counterarguments: [],
    confidenceHistory: [],
    comparisons: [],
    activity: [],
  };
}
