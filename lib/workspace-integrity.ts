import type { Workspace } from "@/lib/types";

function assertUniqueIds(label: string, items: Array<{ id: string }>) {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`Duplicate ${label} ID: ${item.id}`);
    seen.add(item.id);
  }
  return seen;
}

export function assertWorkspaceIntegrity(workspace: Workspace): Workspace {
  const questionIds = assertUniqueIds("question", workspace.questions);
  const sourceIds = assertUniqueIds("source", workspace.sources);
  const claimIds = assertUniqueIds("claim", workspace.claims);
  assertUniqueIds("evidence link", workspace.evidenceLinks);
  assertUniqueIds("note", workspace.notes);
  assertUniqueIds("research gap", workspace.researchGaps);
  assertUniqueIds("counterargument", workspace.counterarguments);
  assertUniqueIds("confidence change", workspace.confidenceHistory);
  assertUniqueIds("comparison", workspace.comparisons);

  for (const link of workspace.evidenceLinks) {
    if (!sourceIds.has(link.sourceId)) {
      throw new Error(`Evidence link ${link.id} references unknown sourceId: ${link.sourceId}`);
    }
    if (!claimIds.has(link.claimId)) {
      throw new Error(`Evidence link ${link.id} references unknown claimId: ${link.claimId}`);
    }
  }

  for (const counterargument of workspace.counterarguments) {
    if (counterargument.targetClaimId && !claimIds.has(counterargument.targetClaimId)) {
      throw new Error(
        `Counterargument ${counterargument.id} references unknown claimId: ${counterargument.targetClaimId}`,
      );
    }
    for (const sourceId of counterargument.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        throw new Error(`Counterargument ${counterargument.id} references unknown sourceId: ${sourceId}`);
      }
    }
  }

  for (const change of workspace.confidenceHistory) {
    if (!claimIds.has(change.claimId)) {
      throw new Error(`Confidence change ${change.id} references unknown claimId: ${change.claimId}`);
    }
  }

  for (const gap of workspace.researchGaps) {
    if (!gap.relatedId) continue;
    if (gap.kind === "unresolved_question" && !questionIds.has(gap.relatedId)) {
      throw new Error(`Research gap ${gap.id} references unknown questionId: ${gap.relatedId}`);
    }
    if (gap.kind === "unsupported_claim" && !claimIds.has(gap.relatedId)) {
      throw new Error(`Research gap ${gap.id} references unknown claimId: ${gap.relatedId}`);
    }
  }

  const comparisonOptionIds = new Set<string>();
  for (const comparison of workspace.comparisons) {
    for (const option of comparison.options) {
      if (comparisonOptionIds.has(option.id)) {
        throw new Error(`Duplicate decision option ID: ${option.id}`);
      }
      comparisonOptionIds.add(option.id);
    }
  }

  return workspace;
}
