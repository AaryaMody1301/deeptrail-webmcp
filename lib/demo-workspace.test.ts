import { describe, expect, it } from "vitest";
import { createJudgeDemoWorkspace, JUDGE_AGENT_PROMPT } from "@/lib/demo-workspace";
import { validateWorkspace } from "@/lib/workspace-schema";

 describe("Phase 6 judge demo workspace", () => {
  it("stays valid and evidence-backed", () => {
    const workspace = createJudgeDemoWorkspace();
    expect(() => validateWorkspace(workspace)).not.toThrow();
    expect(workspace.sources.length).toBeGreaterThanOrEqual(4);
    expect(workspace.claims.length).toBeGreaterThanOrEqual(3);
    expect(workspace.evidenceLinks.length).toBeGreaterThanOrEqual(4);
    expect(workspace.counterarguments.length).toBeGreaterThanOrEqual(1);
    expect(workspace.researchGaps.some((gap) => gap.priority === "high")).toBe(true);
  });

  it("keeps the seeded decision explicitly draft", () => {
    const workspace = createJudgeDemoWorkspace();
    expect(workspace.decision?.status).toBe("draft");
    expect(workspace.decision?.confidence).toBeGreaterThan(0);
    expect(workspace.decision?.confidence).toBeLessThan(1);
  });

  it("uses an adversarial prompt instead of asking for agreement", () => {
    expect(JUDGE_AGENT_PROMPT).toContain("falsify");
    expect(JUDGE_AGENT_PROMPT).toContain("Do not manufacture disagreement");
    expect(JUDGE_AGENT_PROMPT).toContain("WebMCP");
  });
});
