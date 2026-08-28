import { describe, expect, it } from "vitest";
import { applyClaimUpdate, applyConfidenceUpdate, applyQuestionUpdate } from "@/lib/workspace-edit-invariants";
import { deriveResearchGaps } from "@/lib/reasoning";
import { createWorkspaceFixture } from "@/lib/test-fixtures";

const runtime = {
  now: () => "2026-08-28T12:00:00.000Z",
  id: (() => {
    let count = 0;
    return () => `generated-${++count}`;
  })(),
};

function workspaceWithClaim() {
  const workspace = createWorkspaceFixture();
  workspace.claims.push({
    id: "claim-1",
    text: "The evidence supports the current direction.",
    stance: "supports",
    confidence: 0.72,
    createdAt: workspace.createdAt,
    updatedAt: workspace.createdAt,
  });
  return workspace;
}

describe("workspace edit invariants", () => {
  it("synchronizes the denormalized primary question when its question is edited", () => {
    const workspace = createWorkspaceFixture();

    const updated = applyQuestionUpdate(
      workspace,
      workspace.primaryQuestionId,
      { text: "Which platform best fits a small analytics team?" },
      "human",
      runtime,
    );

    expect(updated.workspace.primaryQuestion).toBe("Which platform best fits a small analytics team?");
    expect(updated.workspace.questions[0].text).toBe(updated.workspace.primaryQuestion);
  });

  it("does not change the primary question when another question is edited", () => {
    const workspace = createWorkspaceFixture();
    workspace.questions.push({
      id: "question-2",
      text: "What is the migration cost?",
      status: "open",
      createdAt: workspace.createdAt,
      updatedAt: workspace.createdAt,
    });

    const updated = applyQuestionUpdate(workspace, "question-2", { text: "What is the total migration cost?" }, "human", runtime);

    expect(updated.workspace.primaryQuestion).toBe("Which platform best fits a two-engineer analytics team?");
    expect(updated.workspace.primaryQuestionId).toBe("question-1");
  });

  it("keeps the primary research gap high after editing the primary question", () => {
    const workspace = createWorkspaceFixture();
    const updated = applyQuestionUpdate(
      workspace,
      workspace.primaryQuestionId,
      { text: "Which platform has the lowest operational risk?" },
      "human",
      runtime,
    ).workspace;

    const primaryGap = deriveResearchGaps(updated).find(
      (gap) => gap.relatedId === updated.primaryQuestionId,
    );
    expect(primaryGap?.priority).toBe("high");
  });

  it("does not let generic claim metadata editing change confidence", () => {
    const workspace = workspaceWithClaim();
    const updated = applyClaimUpdate(
      workspace,
      "claim-1",
      { text: "Refined claim", stance: "neutral", confidence: 0.1 } as never,
      "human",
      runtime,
    );

    expect(updated.value.confidence).toBe(0.72);
    expect(updated.workspace.confidenceHistory).toHaveLength(0);
  });

  it("requires a non-empty reason for confidence updates", () => {
    const workspace = workspaceWithClaim();

    expect(() =>
      applyConfidenceUpdate(workspace, { claimId: "claim-1", confidence: 0.8, reason: "  " }, "human", runtime),
    ).toThrow(/reason is required/i);
  });

  it("rejects confidence values outside the allowed range instead of clamping", () => {
    const workspace = workspaceWithClaim();

    expect(() =>
      applyConfidenceUpdate(workspace, { claimId: "claim-1", confidence: 1.1, reason: "Out of range" }, "agent", runtime),
    ).toThrow(/between 0 and 1/i);
  });

  it("records one reasoned confidence change and actor-attributed activity", () => {
    const workspace = workspaceWithClaim();
    const updated = applyConfidenceUpdate(
      workspace,
      { claimId: "claim-1", confidence: 0.84, reason: "A stronger primary source supports the claim." },
      "agent",
      runtime,
    );

    expect(updated.workspace.confidenceHistory).toHaveLength(1);
    expect(updated.value).toMatchObject({
      claimId: "claim-1",
      previousConfidence: 0.72,
      newConfidence: 0.84,
      reason: "A stronger primary source supports the claim.",
    });
    expect(updated.workspace.activity).toHaveLength(1);
    expect(updated.workspace.activity[0]).toMatchObject({
      type: "confidence_updated",
      actor: "agent",
      entityId: "claim-1",
    });
  });

  it("rejects a no-op confidence update without adding history", () => {
    const workspace = workspaceWithClaim();

    expect(() =>
      applyConfidenceUpdate(
        workspace,
        { claimId: "claim-1", confidence: 0.72, reason: "No new evidence." },
        "human",
        runtime,
      ),
    ).toThrow("Confidence is already 72%.");
    expect(workspace.confidenceHistory).toHaveLength(0);
  });
});
