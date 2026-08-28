import { describe, expect, it } from "vitest";
import { createWorkspaceFixture } from "@/lib/test-fixtures";
import { assertWorkspaceIntegrity } from "@/lib/workspace-integrity";

describe("assertWorkspaceIntegrity", () => {
  it("accepts a coherent workspace", () => {
    expect(assertWorkspaceIntegrity(createWorkspaceFixture()).id).toBe("workspace-1");
  });

  it("rejects evidence that references a missing source", () => {
    const workspace = createWorkspaceFixture();
    const time = workspace.createdAt;
    workspace.claims.push({
      id: "claim-1",
      text: "Claim",
      stance: "neutral",
      confidence: 0.5,
      createdAt: time,
      updatedAt: time,
    });
    workspace.evidenceLinks.push({
      id: "link-1",
      sourceId: "missing-source",
      claimId: "claim-1",
      relationship: "supports",
      createdAt: time,
    });

    expect(() => assertWorkspaceIntegrity(workspace)).toThrow(/unknown sourceId/i);
  });

  it("rejects duplicate entity IDs", () => {
    const workspace = createWorkspaceFixture();
    workspace.questions.push({ ...workspace.questions[0] });
    expect(() => assertWorkspaceIntegrity(workspace)).toThrow(/duplicate question ID/i);
  });

  it("rejects confidence history for a missing claim", () => {
    const workspace = createWorkspaceFixture();
    workspace.confidenceHistory.push({
      id: "change-1",
      claimId: "missing-claim",
      previousConfidence: 0.5,
      newConfidence: 0.2,
      reason: "Contrary evidence",
      createdAt: workspace.createdAt,
    });

    expect(() => assertWorkspaceIntegrity(workspace)).toThrow(/unknown claimId/i);
  });

  it("rejects an unknown primary question identity", () => {
    const workspace = createWorkspaceFixture();
    workspace.primaryQuestionId = "missing-question";

    expect(() => assertWorkspaceIntegrity(workspace)).toThrow(/primary question ID/i);
  });

  it("rejects a primary question text mismatch", () => {
    const workspace = createWorkspaceFixture();
    workspace.primaryQuestion = "A different question";

    expect(() => assertWorkspaceIntegrity(workspace)).toThrow(/primary question text/i);
  });
});
