"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import { calculateResearchDebt } from "@/lib/research-debt";
import type { ResearchNote, Workspace } from "@/lib/types";
import { EvidenceGraph } from "./evidence-graph";
import styles from "./critical-thinking-dashboard.module.css";

const CRITERION_TITLE = "What would change my mind";

interface AttackSession {
  targetKind: "decision" | "claim";
  targetId: string;
  targetLabel: string;
  baselineConfidence: number;
  startedAt: string;
}

function criterionStatus(note: ResearchNote) {
  if (note.title.includes("[met]")) return "met" as const;
  if (note.title.includes("[dismissed]")) return "dismissed" as const;
  return "open" as const;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function attackStorageKey(workspaceId: string) {
  return `deeptrail:attack-session:${workspaceId}`;
}

interface CriticalThinkingDashboardProps {
  workspace: Workspace;
  actions: DeepTrailActions;
}

export function CriticalThinkingDashboard({ workspace, actions }: CriticalThinkingDashboardProps) {
  const debt = useMemo(() => calculateResearchDebt(workspace), [workspace]);
  const [error, setError] = useState<string | null>(null);
  const [attackSession, setAttackSession] = useState<AttackSession | null>(null);
  const [attackCopied, setAttackCopied] = useState(false);

  const criteria = useMemo(
    () => workspace.notes.filter((note) => note.title.startsWith(CRITERION_TITLE)),
    [workspace.notes],
  );

  const strongestTarget = useMemo(() => {
    if (workspace.decision) {
      return {
        kind: "decision" as const,
        id: workspace.decision.id,
        label: workspace.decision.choice,
        confidence: workspace.decision.confidence,
      };
    }

    const evidenceCounts = new Map<string, number>();
    for (const link of workspace.evidenceLinks) {
      evidenceCounts.set(link.claimId, (evidenceCounts.get(link.claimId) ?? 0) + 1);
    }

    const claim = workspace.claims
      .slice()
      .sort(
        (a, b) =>
          b.confidence + (evidenceCounts.get(b.id) ?? 0) * 0.06 -
          (a.confidence + (evidenceCounts.get(a.id) ?? 0) * 0.06),
      )[0];

    return claim
      ? { kind: "claim" as const, id: claim.id, label: claim.text, confidence: claim.confidence }
      : null;
  }, [workspace]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(attackStorageKey(workspace.id));
      setAttackSession(saved ? (JSON.parse(saved) as AttackSession) : null);
    } catch {
      setAttackSession(null);
    }
  }, [workspace.id]);

  const currentAttackConfidence = useMemo(() => {
    if (!attackSession) return null;
    if (attackSession.targetKind === "decision") {
      return workspace.decision?.id === attackSession.targetId ? workspace.decision.confidence : null;
    }
    return workspace.claims.find((claim) => claim.id === attackSession.targetId)?.confidence ?? null;
  }, [attackSession, workspace]);

  const attackDelta =
    attackSession && currentAttackConfidence !== null
      ? currentAttackConfidence - attackSession.baselineConfidence
      : null;

  function persistAttack(session: AttackSession | null) {
    setAttackSession(session);
    try {
      if (session) localStorage.setItem(attackStorageKey(workspace.id), JSON.stringify(session));
      else localStorage.removeItem(attackStorageKey(workspace.id));
    } catch {
      // The live attack still works even when localStorage is unavailable.
    }
  }

  function addCriterion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("criterion") ?? "").trim();
    if (!text) return;
    try {
      setError(null);
      actions.addNote(CRITERION_TITLE, text, "human");
      form.reset();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to add criterion.");
    }
  }

  function setCriterionStatus(note: ResearchNote, status: "open" | "met" | "dismissed") {
    try {
      setError(null);
      const title =
        status === "open"
          ? CRITERION_TITLE
          : `${CRITERION_TITLE} [${status}]`;
      actions.updateNote(note.id, { title }, "human");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to update criterion.");
    }
  }

  async function startAttack() {
    if (!strongestTarget) {
      setError("Add at least one claim or decision before starting an attack.");
      return;
    }

    const session: AttackSession = {
      targetKind: strongestTarget.kind,
      targetId: strongestTarget.id,
      targetLabel: strongestTarget.label,
      baselineConfidence: strongestTarget.confidence,
      startedAt: new Date().toISOString(),
    };
    persistAttack(session);

    const openCriteria = criteria
      .filter((note) => criterionStatus(note) === "open")
      .map((note, index) => `${index + 1}. ${note.content}`)
      .join("\n");

    const prompt = `Attack the current DeepTrail conclusion instead of defending it. Read the workspace through WebMCP first. Target this ${session.targetKind}: "${session.targetLabel}" (baseline confidence ${percent(session.baselineConfidence)}). Search specifically for credible evidence that would falsify, materially qualify, or overturn it. Add contrary/qualifying sources, add the relevant claim or counterargument, link evidence, and update confidence only when the new evidence warrants a change. Refresh research gaps after the attack.\n\nWhat would change my mind:\n${openCriteria || "No explicit criteria have been defined yet; focus on the strongest falsifying evidence."}\n\nDo not manufacture disagreement. Preserve confidence if the contrary evidence is weak.`;

    try {
      await navigator.clipboard.writeText(prompt);
      setAttackCopied(true);
      window.setTimeout(() => setAttackCopied(false), 1800);
      setError(null);
    } catch {
      setError("Attack session started, but clipboard access is unavailable. Use the target and criteria shown here to instruct the agent manually.");
    }
  }

  return (
    <section className={styles.section} aria-labelledby="critical-thinking-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Phase 4 critical-thinking layer</p>
          <h2 id="critical-thinking-heading">Stress-test the conclusion, not just the search.</h2>
          <p>
            The graph shows stored relationships, Research Debt exposes structural weaknesses, and the attack workflow measures whether contrary evidence actually moves belief.
          </p>
        </div>
      </header>

      {error ? <p className={styles.error} role="alert">{error}</p> : null}

      <div className={styles.topGrid}>
        <article className={styles.debtCard}>
          <div className={styles.cardHeading}>
            <div><span>Research Debt</span><h3>{debt.level} debt</h3></div>
            <strong>{debt.score}/100</strong>
          </div>
          <progress className={styles.debtProgress} max="100" value={debt.score}>{debt.score}%</progress>
          <p className={styles.explainer}>Higher means more unresolved structural risk. The score is deterministic, not model-generated.</p>
          <dl className={styles.debtBreakdown}>
            <div><dt>Open questions</dt><dd>+{debt.breakdown.openQuestions}</dd></div>
            <div><dt>Unsupported claims</dt><dd>+{debt.breakdown.unsupportedClaims}</dd></div>
            <div><dt>Missing counterevidence</dt><dd>+{debt.breakdown.missingCounterevidence}</dd></div>
            <div><dt>Thin provenance</dt><dd>+{debt.breakdown.thinProvenance}</dd></div>
          </dl>
        </article>

        <article className={styles.attackCard}>
          <div className={styles.cardHeading}>
            <div><span>Adversarial research</span><h3>Attack this conclusion</h3></div>
          </div>
          {strongestTarget ? (
            <>
              <p className={styles.attackTarget}>{strongestTarget.label}</p>
              <div className={styles.attackActions}>
                <button type="button" className={styles.attackButton} onClick={startAttack}>
                  {attackCopied ? "Attack prompt copied" : "Start attack + copy prompt"}
                </button>
                {attackSession ? <button type="button" className={styles.clearButton} onClick={() => persistAttack(null)}>Clear baseline</button> : null}
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>Add a claim or draft decision to create an attack target.</p>
          )}

          {attackSession ? (
            <div className={styles.attackMeter}>
              <div><span>Baseline</span><strong>{percent(attackSession.baselineConfidence)}</strong></div>
              <div><span>Current</span><strong>{currentAttackConfidence === null ? "—" : percent(currentAttackConfidence)}</strong></div>
              <div><span>Movement</span><strong>{attackDelta === null ? "—" : `${attackDelta >= 0 ? "+" : ""}${Math.round(attackDelta * 100)} pts`}</strong></div>
            </div>
          ) : null}
        </article>
      </div>

      <article className={styles.graphCard}>
        <div className={styles.cardHeading}>
          <div><span>Argument map</span><h3>Evidence graph</h3></div>
          <small>{workspace.sources.length} sources · {workspace.claims.length} claims · {workspace.counterarguments.length} counterarguments</small>
        </div>
        <EvidenceGraph workspace={workspace} />
      </article>

      <article className={styles.criteriaCard}>
        <div className={styles.cardHeading}>
          <div><span>Falsifiability</span><h3>What would change my mind?</h3></div>
          <small>{criteria.filter((note) => criterionStatus(note) === "open").length} open</small>
        </div>
        <p className={styles.explainer}>Define evidence that would materially change the current conclusion before searching for it. Criteria are stored as DeepTrail research notes, so the agent sees them in workspace context.</p>
        <form className={styles.criterionForm} onSubmit={addCriterion}>
          <label>
            <span className="sr-only">Change-my-mind criterion</span>
            <input name="criterion" placeholder="Example: migration effort exceeds two engineer-months" required />
          </label>
          <button type="submit">Add criterion</button>
        </form>
        {criteria.length === 0 ? (
          <div className={styles.criteriaEmpty}>No falsification criteria yet. Add one before the next attack to reduce confirmation bias.</div>
        ) : (
          <div className={styles.criteriaList}>
            {criteria.map((note) => {
              const status = criterionStatus(note);
              return (
                <div className={styles.criterion} key={note.id}>
                  <span className={`${styles.criterionStatus} ${styles[`criterion_${status}`]}`}>{status}</span>
                  <p>{note.content}</p>
                  <div>
                    {status !== "met" ? <button type="button" onClick={() => setCriterionStatus(note, "met")}>Mark met</button> : null}
                    {status !== "open" ? <button type="button" onClick={() => setCriterionStatus(note, "open")}>Reopen</button> : null}
                    {status === "open" ? <button type="button" onClick={() => setCriterionStatus(note, "dismissed")}>Dismiss</button> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
}
