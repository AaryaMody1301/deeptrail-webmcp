"use client";

import { FormEvent, useMemo, useState } from "react";
import { useDeepTrailWorkspace } from "@/hooks/use-deeptrail-workspace";
import { useWebMCPBridge } from "@/hooks/use-webmcp-bridge";

const AGENT_PROMPT = `Read the active DeepTrail investigation through its WebMCP tools. Research the primary open question on the web. Add one credible source, add one concise claim based on that source, and link the source to the claim with the correct evidence relationship. Then tell me what you added and what should be researched next.`;

function compactDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function Home() {
  const { workspace, hydrated, storageError, actions } = useDeepTrailWorkspace();
  const webmcp = useWebMCPBridge(workspace, actions);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [copied, setCopied] = useState(false);

  const evidenceByClaim = useMemo(() => {
    if (!workspace) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const link of workspace.evidenceLinks) {
      counts.set(link.claimId, (counts.get(link.claimId) ?? 0) + 1);
    }
    return counts;
  }, [workspace]);

  if (!hydrated) {
    return (
      <main className="shell center">
        <div className="loading-card">Loading your local DeepTrail workspace…</div>
      </main>
    );
  }

  function createInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !question.trim()) return;
    actions.createInvestigation(title, question);
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(AGENT_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const statusLabel =
    webmcp.status === "ready"
      ? `${webmcp.registeredToolCount} WebMCP tools ready`
      : webmcp.status === "unsupported"
        ? "WebMCP unavailable in this browser"
        : webmcp.status === "error"
          ? "WebMCP registration error"
          : "Checking WebMCP support…";

  if (!workspace) {
    return (
      <main className="shell center">
        <section className="hero-card">
          <div className="brand-row">
            <span className="brand-mark">DT</span>
            <span>DeepTrail</span>
          </div>
          <p className="eyebrow">Human + agent web research</p>
          <h1>Turn web research into an evidence trail you can inspect.</h1>
          <p className="lede">
            Create an investigation. A WebMCP-aware agent can read the same workspace, add sources and claims, and connect evidence while you stay in control of the conclusion.
          </p>

          <form className="create-form" onSubmit={createInvestigation}>
            <label>
              Investigation title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="ClickHouse vs BigQuery for our analytics stack"
                required
              />
            </label>
            <label>
              Primary research question
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Which option gives a two-engineer team the best total cost, operational simplicity, and query performance?"
                rows={4}
                required
              />
            </label>
            <button className="primary-button" type="submit">Create investigation</button>
          </form>

          <div className={`capability capability-${webmcp.status}`}>
            <span className="status-dot" />
            <span>{statusLabel}</span>
          </div>
          {storageError ? <p className="error-text">Local storage: {storageError}</p> : null}
          {webmcp.error ? <p className="error-text">{webmcp.error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="brand-row small">
            <span className="brand-mark">DT</span>
            <span>DeepTrail</span>
          </div>
          <p className="workspace-kicker">Active investigation</p>
          <h1 className="workspace-title">{workspace.title}</h1>
        </div>
        <div className="topbar-actions">
          <div className={`capability capability-${webmcp.status}`}>
            <span className="status-dot" />
            <span>{statusLabel}</span>
          </div>
          <button
            className="ghost-button"
            type="button"
            onClick={() => {
              if (window.confirm("Reset this local investigation?")) actions.resetWorkspace();
            }}
          >
            Reset
          </button>
        </div>
      </header>

      <section className="question-card">
        <p className="eyebrow">Primary question</p>
        <h2>{workspace.primaryQuestion}</h2>
        <p className="muted">Updated {compactDate(workspace.updatedAt)}</p>
      </section>

      <section className="metric-grid" aria-label="Research workspace counts">
        <article><strong>{workspace.questions.filter((item) => item.status === "open").length}</strong><span>Open questions</span></article>
        <article><strong>{workspace.sources.length}</strong><span>Sources</span></article>
        <article><strong>{workspace.claims.length}</strong><span>Claims</span></article>
        <article><strong>{workspace.evidenceLinks.length}</strong><span>Evidence links</span></article>
      </section>

      <section className="agent-card">
        <div>
          <p className="eyebrow">Phase 1 agent test</p>
          <h2>Ask an agent to research directly into this board.</h2>
          <p className="muted">The agent should read the workspace first, then add a source, claim, and evidence link through WebMCP.</p>
        </div>
        <button className="secondary-button" type="button" onClick={copyPrompt}>
          {copied ? "Copied" : "Copy test prompt"}
        </button>
        <pre>{AGENT_PROMPT}</pre>
      </section>

      <div className="workspace-grid">
        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Evidence trail</p><h2>Claims</h2></div>
            <span className="count-pill">{workspace.claims.length}</span>
          </div>
          {workspace.claims.length === 0 ? (
            <div className="empty-state">No claims yet. Run the Phase 1 agent prompt to add the first evidence-backed claim.</div>
          ) : (
            <div className="card-list">
              {workspace.claims.map((claim) => (
                <article className="research-card" key={claim.id}>
                  <div className="card-meta">
                    <span className={`stance stance-${claim.stance}`}>{claim.stance}</span>
                    <span>{Math.round(claim.confidence * 100)}% confidence</span>
                    <span>{evidenceByClaim.get(claim.id) ?? 0} evidence</span>
                  </div>
                  <p className="claim-text">{claim.text}</p>
                  <code>{claim.id}</code>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Provenance</p><h2>Sources</h2></div>
            <span className="count-pill">{workspace.sources.length}</span>
          </div>
          {workspace.sources.length === 0 ? (
            <div className="empty-state">No sources yet. Agent-added sources will appear here immediately.</div>
          ) : (
            <div className="card-list">
              {workspace.sources.map((source) => (
                <article className="research-card" key={source.id}>
                  <div className="card-meta"><span>{source.publisher ?? new URL(source.url).hostname}</span><span>{compactDate(source.createdAt)}</span></div>
                  <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                  {source.summary ? <p className="muted">{source.summary}</p> : null}
                  <code>{source.id}</code>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {workspace.evidenceLinks.length > 0 ? (
        <section className="panel evidence-panel">
          <div className="panel-heading"><div><p className="eyebrow">Connections</p><h2>Evidence links</h2></div><span className="count-pill">{workspace.evidenceLinks.length}</span></div>
          <div className="evidence-list">
            {workspace.evidenceLinks.map((link) => {
              const source = workspace.sources.find((item) => item.id === link.sourceId);
              const claim = workspace.claims.find((item) => item.id === link.claimId);
              return (
                <article key={link.id}>
                  <span className={`stance stance-${link.relationship}`}>{link.relationship}</span>
                  <p><strong>{source?.title ?? "Source"}</strong> → {claim?.text ?? "Claim"}</p>
                  {link.note ? <p className="muted">{link.note}</p> : null}
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      {storageError ? <p className="error-text footer-error">Local storage: {storageError}</p> : null}
    </main>
  );
}
