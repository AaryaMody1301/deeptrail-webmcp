import { describe, expect, it } from "vitest";
import { calculateResearchDebt } from "@/lib/research-debt";
import { createWorkspaceFixture } from "@/lib/test-fixtures";

describe("calculateResearchDebt", () => {
  it("scores an open source-free investigation deterministically", () => {
    const workspace = createWorkspaceFixture();
    const debt = calculateResearchDebt(workspace);

    expect(debt.score).toBe(30);
    expect(debt.breakdown.openQuestions).toBe(10);
    expect(debt.breakdown.thinProvenance).toBe(20);
    expect(debt.level).toBe("moderate");
  });

  it("drops as claims gain evidence, provenance, and counterevidence", () => {
    const workspace = createWorkspaceFixture();
    const time = workspace.createdAt;
    workspace.claims.push({
      id: "claim-1",
      text: "ClickHouse has lower operational cost for this workload.",
      stance: "supports",
      confidence: 0.8,
      createdAt: time,
      updatedAt: time,
    });

    const before = calculateResearchDebt(workspace);
    expect(before.score).toBe(62);

    workspace.questions[0].status = "answered";
    workspace.sources.push(
      {
        id: "source-1",
        url: "https://example.com/primary",
        title: "Primary source",
        accessedAt: time,
        createdAt: time,
        updatedAt: time,
      },
      {
        id: "source-2",
        url: "https://example.org/counter",
        title: "Counter source",
        accessedAt: time,
        createdAt: time,
        updatedAt: time,
      },
    );
    workspace.evidenceLinks.push(
      {
        id: "link-1",
        sourceId: "source-1",
        claimId: "claim-1",
        relationship: "supports",
        createdAt: time,
      },
      {
        id: "link-2",
        sourceId: "source-2",
        claimId: "claim-1",
        relationship: "contradicts",
        createdAt: time,
      },
    );

    const after = calculateResearchDebt(workspace);
    expect(after.score).toBe(0);
    expect(after.level).toBe("low");
  });
});
