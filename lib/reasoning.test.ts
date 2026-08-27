import { describe, expect, it } from "vitest";
import { deriveResearchGaps } from "@/lib/reasoning";
import { createWorkspaceFixture } from "@/lib/test-fixtures";

describe("deriveResearchGaps", () => {
  it("detects unresolved questions and thin provenance", () => {
    const workspace = createWorkspaceFixture();
    const gaps = deriveResearchGaps(workspace);

    expect(gaps.some((gap) => gap.kind === "unresolved_question")).toBe(true);
    expect(gaps.some((gap) => gap.kind === "thin_provenance")).toBe(true);
  });

  it("detects unsupported claims and missing counterevidence", () => {
    const workspace = createWorkspaceFixture();
    const time = workspace.createdAt;
    workspace.claims.push({
      id: "claim-1",
      text: "A high-confidence claim with no evidence.",
      stance: "supports",
      confidence: 0.9,
      createdAt: time,
      updatedAt: time,
    });

    const gaps = deriveResearchGaps(workspace);
    const unsupported = gaps.find((gap) => gap.kind === "unsupported_claim");
    expect(unsupported?.priority).toBe("high");
    expect(gaps.some((gap) => gap.kind === "missing_counterevidence")).toBe(true);
  });

  it("preserves stable IDs when a known gap is re-derived", () => {
    const workspace = createWorkspaceFixture();
    const first = deriveResearchGaps(workspace);
    workspace.researchGaps = first;
    const second = deriveResearchGaps(workspace);

    const firstQuestionGap = first.find((gap) => gap.kind === "unresolved_question");
    const secondQuestionGap = second.find((gap) => gap.kind === "unresolved_question");
    expect(secondQuestionGap?.id).toBe(firstQuestionGap?.id);
  });
});
