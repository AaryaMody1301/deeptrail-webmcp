"use client";

import { useMemo, useState } from "react";
import type { DeepTrailActions } from "@/hooks/use-deeptrail-workspace";
import type { Workspace } from "@/lib/types";
import { CriticalThinkingDashboard } from "./critical-thinking-dashboard";
import { ReliabilityDashboard } from "./reliability-dashboard";
import styles from "./reasoning-dashboard.module.css";

function compactDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

interface ReasoningDashboardProps {
  workspace: Workspace;
  actions: DeepTrailActions;
}

export function ReasoningDashboard({ workspace, actions }: ReasoningDashboardProps) {
  const [error, setError] = useState<string | null>(null);
  const claimById = useMemo(
    () => new Map(workspace.claims.map((claim) => [claim.id, claim])),
    [workspace.claims],
  );
  const sourceById = useMemo(
    () => new Map(workspace.sources.map((source) => [source.id, source])),
    [workspace.sources],
  );
  const latestComparison = workspace.comparisons[0];

  function refreshGaps() {
    try {
      setError(null);
      actions.identifyResearchGaps(8, "human");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "Unable to refresh research gaps.");
    }
  }

  return (
    <>
      <section className={styles.section} aria-labelledby="reasoning-heading">
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Phase 3 reasoning layer</p>
            <h2 id="reasoning-heading">Make the agent&apos;s thinking inspectable.</h2>
            <p>
              Gaps, counterarguments, confidence changes, comparisons, and decisions are durable workspace objects—not hidden chat text.
            </p>
          </div>
          <button className={styles.refreshButton} type="button" onClick={refreshGaps}>
            Refresh research gaps
          </button>
        </header>

        {error ? <p className={styles.error} role="alert">{error}</p> : null}

        <div className={styles.metrics} aria-label="Reasoning artifact counts">
          <article><strong>{workspace.researchGaps.length}</strong><span>Research gaps</span></article>
          <article><strong>{workspace.counterarguments.length}</strong><span>Counterarguments</span></article>
          <article><strong>{workspace.confidenceHistory.length}</strong><span>Confidence changes</span></article>
          <article><strong>{workspace.comparisons.length}</strong><span>Comparisons</span></article>
        </div>

        <div className={styles.grid}>
          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Research debt</span><h3>What still needs investigation?</h3></div>
              <span className={styles.count}>{workspace.researchGaps.length}</span>
            </div>
            {workspace.researchGaps.length === 0 ? (
              <div className={styles.empty}>Run “Refresh research gaps” or ask the agent to call <code>deeptrail_find_research_gaps</code>.</div>
            ) : (
              <div className={styles.list}>
                {workspace.researchGaps.map((gap) => (
                  <div className={styles.gapCard} key={gap.id}>
                    <div className={styles.meta}>
                      <span className={`${styles.priority} ${styles[`priority_${gap.priority}`]}`}>{gap.priority}</span>
                      <span>{gap.kind.replaceAll("_", " ")}</span>
                    </div>
                    <strong>{gap.title}</strong>
                    <p>{gap.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Devil&apos;s advocate</span><h3>Counterarguments</h3></div>
              <span className={styles.count}>{workspace.counterarguments.length}</span>
            </div>
            {workspace.counterarguments.length === 0 ? (
              <div className={styles.empty}>No counterarguments yet. Ask the agent to challenge the strongest current claim instead of confirming it.</div>
            ) : (
              <div className={styles.list}>
                {workspace.counterarguments.map((item) => {
                  const claim = item.targetClaimId ? claimById.get(item.targetClaimId) : undefined;
                  return (
                    <div className={styles.counterCard} key={item.id}>
                      <div className={styles.meta}><span className={styles.strength}>{item.strength}</span><time dateTime={item.createdAt}>{compactDate(item.createdAt)}</time></div>
                      <p className={styles.counterText}>{item.text}</p>
                      {claim ? <p className={styles.target}>Challenges: {claim.text}</p> : null}
                      {item.sourceIds.length > 0 ? (
                        <div className={styles.sourceRefs}>
                          {item.sourceIds.map((sourceId) => {
                            const source = sourceById.get(sourceId);
                            return source ? <a key={sourceId} href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : null;
                          })}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Belief updates</span><h3>Confidence history</h3></div>
              <span className={styles.count}>{workspace.confidenceHistory.length}</span>
            </div>
            {workspace.confidenceHistory.length === 0 ? (
              <div className={styles.empty}>Confidence changes will appear only when the agent records a reason tied to new evidence or counterevidence.</div>
            ) : (
              <ol className={styles.timeline}>
                {workspace.confidenceHistory.slice(0, 12).map((change) => {
                  const claim = claimById.get(change.claimId);
                  return (
                    <li key={change.id}>
                      <div className={styles.confidenceShift}>
                        <span>{percent(change.previousConfidence)}</span>
                        <span aria-hidden="true">→</span>
                        <strong>{percent(change.newConfidence)}</strong>
                      </div>
                      <p>{change.reason}</p>
                      {claim ? <small>{claim.text}</small> : null}
                    </li>
                  );
                })}
              </ol>
            )}
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHeading}>
              <div><span>Decision support</span><h3>Latest option comparison</h3></div>
              <span className={styles.count}>{workspace.comparisons.length}</span>
            </div>
            {!latestComparison ? (
              <div className={styles.empty}>No comparison yet. The agent can compare options against explicit criteria without overwriting the underlying evidence trail.</div>
            ) : (
              <div>
                <div className={styles.comparisonHeader}>
                  <strong>{latestComparison.title}</strong>
                  {latestComparison.criteria.length > 0 ? <p>Criteria: {latestComparison.criteria.join(" · ")}</p> : null}
                </div>
                <div className={styles.optionList}>
                  {latestComparison.options
                    .slice()
                    .sort((a, b) => b.score - a.score)
                    .map((option) => (
                      <div className={styles.optionCard} key={option.id}>
                        <div className={styles.optionTop}><strong>{option.name}</strong><span>{Math.round(option.score)}/100</span></div>
                        {option.summary ? <p>{option.summary}</p> : null}
                        <div className={styles.proConGrid}>
                          <div><span>Pros</span>{option.pros.length ? <ul>{option.pros.map((item) => <li key={item}>{item}</li>)}</ul> : <small>None recorded</small>}</div>
                          <div><span>Cons</span>{option.cons.length ? <ul>{option.cons.map((item) => <li key={item}>{item}</li>)}</ul> : <small>None recorded</small>}</div>
                        </div>
                      </div>
                    ))}
                </div>
                {latestComparison.recommendation ? <p className={styles.recommendation}><strong>Recommendation:</strong> {latestComparison.recommendation}</p> : null}
                {latestComparison.rationale ? <p className={styles.rationale}>{latestComparison.rationale}</p> : null}
              </div>
            )}
          </article>
        </div>

        <article className={`${styles.panel} ${styles.decisionPanel}`}>
          <div className={styles.panelHeading}>
            <div><span>Current conclusion</span><h3>Decision record</h3></div>
            {workspace.decision ? <span className={`${styles.decisionStatus} ${styles[`decision_${workspace.decision.status}`]}`}>{workspace.decision.status}</span> : null}
          </div>
          {workspace.decision ? (
            <div className={styles.decisionBody}>
              <div className={styles.decisionScore}><span>Confidence</span><strong>{percent(workspace.decision.confidence)}</strong></div>
              <div><h4>{workspace.decision.choice}</h4><p>{workspace.decision.rationale}</p><small>Updated {compactDate(workspace.decision.updatedAt)}</small></div>
            </div>
          ) : (
            <div className={styles.empty}>No decision recorded. DeepTrail keeps “research” and “decision” separate so an agent cannot silently turn incomplete evidence into a conclusion.</div>
          )}
        </article>
      </section>

      <CriticalThinkingDashboard workspace={workspace} actions={actions} />
      <ReliabilityDashboard workspace={workspace} />
    </>
  );
}
