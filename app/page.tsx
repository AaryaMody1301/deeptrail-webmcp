"use client";

import { FormEvent, useMemo, useState } from "react";
import { ReasoningDashboard } from "@/components/reasoning-dashboard";
import { useDeepTrailWorkspace } from "@/hooks/use-deeptrail-workspace";
import { useWebMCPBridge } from "@/hooks/use-webmcp-bridge";
import type { ClaimStance, QuestionStatus } from "@/lib/types";

const AGENT_PROMPT = `Read the active DeepTrail investigation through WebMCP. First identify the highest-priority research gaps. Research one important gap on the web, add a credible source with provenance, add or refine a concise claim, and link the evidence. Then deliberately challenge the strongest relevant claim with a counterargument. If the new evidence materially changes confidence, update that claim's confidence with a reason. If this investigation is a decision between alternatives, record a structured option comparison. Record only a draft decision when the available evidence genuinely supports one; otherwise leave the decision open and add the next research question.`;

function compactDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function dateOnly(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(parsed);
}

function formValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" ? value : "";
}

export default function Home() {
  const { workspace, hydrated, storageError, announcement, actions } = useDeepTrailWorkspace();
  const webmcp = useWebMCPBridge(workspace, actions);
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState("");
  const [stanceFilter, setStanceFilter] = useState<ClaimStance | "all">("all");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingClaimId, setEditingClaimId] = useState<string | null>(null);
  const [editingSourceId, setEditingSourceId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const evidenceByClaim = useMemo(() => {
    if (!workspace) return new Map<string, number>();
    const counts = new Map<string, number>();
    for (const link of workspace.evidenceLinks) {
      counts.set(link.claimId, (counts.get(link.claimId) ?? 0) + 1);
    }
    return counts;
  }, [workspace]);

  const normalizedFilter = filter.trim().toLowerCase();
  const filteredClaims = useMemo(() => {
    if (!workspace) return [];
    return workspace.claims.filter((claim) => {
      const matchesText = !normalizedFilter || claim.text.toLowerCase().includes(normalizedFilter);
      const matchesStance = stanceFilter === "all" || claim.stance === stanceFilter;
      return matchesText && matchesStance;
    });
  }, [workspace, normalizedFilter, stanceFilter]);

  const filteredSources = useMemo(() => {
    if (!workspace) return [];
    return workspace.sources.filter((source) => {
      if (!normalizedFilter) return true;
      return [source.title, source.publisher, source.summary, source.url]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(normalizedFilter));
    });
  }, [workspace, normalizedFilter]);

  function runAction(action: () => void) {
    try {
      setActionError(null);
      action();
      return true;
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "The workspace action could not be completed.");
      return false;
    }
  }

  if (!hydrated) {
    return (
      <main className="shell center">
        <div className="loading-card" role="status">Loading your local DeepTrail workspace…</div>
      </main>
    );
  }

  function createInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !question.trim()) return;
    runAction(() => actions.createInvestigation(title, question));
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setActionError("Clipboard access is unavailable. Select the prompt text and copy it manually.");
    }
  }

  const statusLabel =
    webmcp.status === "ready"
      ? `${webmcp.registeredToolCount} WebMCP ${webmcp.registeredToolCount === 1 ? "tool" : "tools"} ready`
      : webmcp.status === "unsupported"
        ? "WebMCP unavailable in this browser"
        : webmcp.status === "error"
          ? "WebMCP registration error"
          : "Checking WebMCP support…";

  if (!workspace) {
    return (
      <main className="shell center">
        <p className="sr-only" role="status" aria-live="polite">{announcement}</p>
        <section className="hero-card">
          <div className="brand-row">
            <span className="brand-mark">DT</span>
            <span>DeepTrail</span>
          </div>
          <p className="eyebrow">Human + agent web research</p>
          <h1>Turn web research into an evidence trail you can inspect.</h1>
          <p className="lede">
            Create an investigation. A WebMCP-aware agent can read the same workspace, add sources and claims, challenge its own conclusions, and leave every reasoning step visible to you.
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
          {actionError ? <p className="error-text" role="alert">{actionError}</p> : null}
          {storageError ? <p className="error-text" role="alert">Local storage: {storageError}</p> : null}
          {webmcp.error ? <p className="error-text" role="alert">{webmcp.error}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

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
        <div>
          <p className="eyebrow">Primary question</p>
          <h2>{workspace.primaryQuestion}</h2>
        </div>
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
          <p className="eyebrow">Phase 3 agent workflow</p>
          <h2>Research, challenge, revise, compare, decide.</h2>
          <p className="muted">The agent now has structured actions for research gaps, counterarguments, confidence changes, comparisons, and decisions—all recorded in the same workspace.</p>
        </div>
        <button className="secondary-button" type="button" onClick={copyPrompt}>
          {copied ? "Copied" : "Copy reasoning prompt"}
        </button>
        <pre>{AGENT_PROMPT}</pre>
      </section>

      {actionError ? <p className="inline-alert" role="alert">{actionError}</p> : null}
      {storageError ? <p className="inline-alert" role="alert">Local storage: {storageError}</p> : null}
      {webmcp.error ? <p className="inline-alert" role="alert">WebMCP: {webmcp.error}</p> : null}

      <section className="research-toolbar" aria-label="Research filters">
        <label className="search-field">
          <span>Filter evidence</span>
          <input
            type="search"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Search claims, publishers, source titles…"
          />
        </label>
        <label>
          <span>Claim stance</span>
          <select
            value={stanceFilter}
            onChange={(event) => setStanceFilter(event.target.value as ClaimStance | "all")}
          >
            <option value="all">All stances</option>
            <option value="supports">Supports</option>
            <option value="contradicts">Contradicts</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
        <div className="filter-result" role="status">
          {filteredClaims.length}/{workspace.claims.length} claims · {filteredSources.length}/{workspace.sources.length} sources
        </div>
      </section>

      <section className="panel questions-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">Research queue</p><h2>Questions</h2></div>
          <span className="count-pill">{workspace.questions.length}</span>
        </div>
        <form
          className="compact-composer"
          onSubmit={(event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const data = new FormData(form);
            const text = formValue(data, "question");
            if (runAction(() => actions.addQuestion(text))) form.reset();
          }}
        >
          <label className="grow-field">
            <span className="sr-only">Add research question</span>
            <input name="question" placeholder="Add a follow-up question…" required />
          </label>
          <button className="small-button" type="submit">Add question</button>
        </form>

        <div className="question-list">
          {workspace.questions.map((item) => (
            <article className="question-row" key={item.id}>
              {editingQuestionId === item.id ? (
                <form
                  className="inline-edit-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const ok = runAction(() =>
                      actions.updateQuestion(item.id, {
                        text: formValue(data, "text"),
                        status: formValue(data, "status") as QuestionStatus,
                      }),
                    );
                    if (ok) setEditingQuestionId(null);
                  }}
                >
                  <label className="grow-field">
                    <span>Question</span>
                    <input name="text" defaultValue={item.text} required />
                  </label>
                  <label>
                    <span>Status</span>
                    <select name="status" defaultValue={item.status}>
                      <option value="open">Open</option>
                      <option value="answered">Answered</option>
                    </select>
                  </label>
                  <div className="inline-actions">
                    <button className="small-button" type="submit">Save</button>
                    <button className="text-button" type="button" onClick={() => setEditingQuestionId(null)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="question-copy">
                    <span className={`question-status question-status-${item.status}`}>{item.status}</span>
                    <p>{item.text}</p>
                    <span className="tiny-meta">Updated {compactDate(item.updatedAt)}</span>
                  </div>
                  <div className="row-actions">
                    <button className="text-button" type="button" onClick={() => setEditingQuestionId(item.id)}>Edit</button>
                    <button
                      className="text-button"
                      type="button"
                      onClick={() =>
                        runAction(() => actions.updateQuestion(item.id, { status: item.status === "open" ? "answered" : "open" }))
                      }
                    >
                      {item.status === "open" ? "Mark answered" : "Reopen"}
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>

      <div className="workspace-grid">
        <section className="panel" id="claims-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Evidence trail</p><h2>Claims</h2></div>
            <span className="count-pill">{filteredClaims.length}</span>
          </div>

          <details className="composer">
            <summary>Add claim manually</summary>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                const confidence = Number(formValue(data, "confidence")) / 100;
                const ok = runAction(() =>
                  actions.addClaim({
                    text: formValue(data, "text"),
                    stance: formValue(data, "stance") as ClaimStance,
                    confidence,
                  }),
                );
                if (ok) form.reset();
              }}
            >
              <label>Claim<textarea name="text" rows={3} required placeholder="State one factual or analytical claim…" /></label>
              <div className="form-columns">
                <label>Stance<select name="stance" defaultValue="neutral"><option value="supports">Supports</option><option value="contradicts">Contradicts</option><option value="neutral">Neutral</option></select></label>
                <label>Confidence %<input name="confidence" type="number" min="0" max="100" defaultValue="50" required /></label>
              </div>
              <button className="small-button" type="submit">Add claim</button>
            </form>
          </details>

          {filteredClaims.length === 0 ? (
            <div className="empty-state">{workspace.claims.length === 0 ? "No claims yet. Ask an agent to add the first evidence-backed claim or add one manually." : "No claims match the current filter."}</div>
          ) : (
            <div className="card-list">
              {filteredClaims.map((claim) => (
                <article className="research-card" key={claim.id}>
                  {editingClaimId === claim.id ? (
                    <form
                      className="stack-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const ok = runAction(() =>
                          actions.updateClaim(claim.id, {
                            text: formValue(data, "text"),
                            stance: formValue(data, "stance") as ClaimStance,
                            confidence: Number(formValue(data, "confidence")) / 100,
                          }),
                        );
                        if (ok) setEditingClaimId(null);
                      }}
                    >
                      <label>Claim<textarea name="text" rows={4} defaultValue={claim.text} required /></label>
                      <div className="form-columns">
                        <label>Stance<select name="stance" defaultValue={claim.stance}><option value="supports">Supports</option><option value="contradicts">Contradicts</option><option value="neutral">Neutral</option></select></label>
                        <label>Confidence %<input name="confidence" type="number" min="0" max="100" defaultValue={Math.round(claim.confidence * 100)} required /></label>
                      </div>
                      <div className="inline-actions"><button className="small-button" type="submit">Save</button><button className="text-button" type="button" onClick={() => setEditingClaimId(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <div className="card-meta">
                        <span className={`stance stance-${claim.stance}`}>{claim.stance}</span>
                        <span>{Math.round(claim.confidence * 100)}% confidence</span>
                        <span>{evidenceByClaim.get(claim.id) ?? 0} evidence</span>
                      </div>
                      <p className="claim-text">{claim.text}</p>
                      <div className="card-footer"><span>Updated {compactDate(claim.updatedAt)}</span><button className="text-button" type="button" onClick={() => setEditingClaimId(claim.id)}>Edit</button></div>
                      <code>{claim.id}</code>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel" id="sources-panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Provenance</p><h2>Sources</h2></div>
            <span className="count-pill">{filteredSources.length}</span>
          </div>

          <details className="composer">
            <summary>Add source manually</summary>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                const ok = runAction(() =>
                  actions.addSource({
                    url: formValue(data, "url"),
                    title: formValue(data, "title"),
                    publisher: formValue(data, "publisher"),
                    summary: formValue(data, "summary"),
                    publishedAt: formValue(data, "publishedAt"),
                  }),
                );
                if (ok) form.reset();
              }}
            >
              <label>Source URL<input name="url" type="url" placeholder="https://…" required /></label>
              <label>Title<input name="title" placeholder="Page or document title" /></label>
              <div className="form-columns"><label>Publisher<input name="publisher" placeholder="Organization or site" /></label><label>Published<input name="publishedAt" type="date" /></label></div>
              <label>Research summary<textarea name="summary" rows={3} placeholder="Why this source matters to the investigation…" /></label>
              <button className="small-button" type="submit">Add source</button>
            </form>
          </details>

          {filteredSources.length === 0 ? (
            <div className="empty-state">{workspace.sources.length === 0 ? "No sources yet. Agent-added and human-added provenance will appear here." : "No sources match the current filter."}</div>
          ) : (
            <div className="card-list">
              {filteredSources.map((source) => (
                <article className="research-card" key={source.id}>
                  {editingSourceId === source.id ? (
                    <form
                      className="stack-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const ok = runAction(() =>
                          actions.updateSource(source.id, {
                            url: formValue(data, "url"),
                            title: formValue(data, "title"),
                            publisher: formValue(data, "publisher"),
                            publishedAt: formValue(data, "publishedAt"),
                            summary: formValue(data, "summary"),
                          }),
                        );
                        if (ok) setEditingSourceId(null);
                      }}
                    >
                      <label>Source URL<input name="url" type="url" defaultValue={source.url} required /></label>
                      <label>Title<input name="title" defaultValue={source.title} /></label>
                      <div className="form-columns"><label>Publisher<input name="publisher" defaultValue={source.publisher ?? ""} /></label><label>Published<input name="publishedAt" type="date" defaultValue={source.publishedAt?.slice(0, 10) ?? ""} /></label></div>
                      <label>Research summary<textarea name="summary" rows={3} defaultValue={source.summary ?? ""} /></label>
                      <div className="inline-actions"><button className="small-button" type="submit">Save</button><button className="text-button" type="button" onClick={() => setEditingSourceId(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <div className="card-meta">
                        <span>{source.publisher ?? new URL(source.url).hostname}</span>
                        {source.publishedAt ? <span>Published {dateOnly(source.publishedAt)}</span> : <span>Publication date unknown</span>}
                      </div>
                      <a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>
                      {source.summary ? <p className="muted">{source.summary}</p> : null}
                      <div className="provenance-line"><span>Accessed {compactDate(source.accessedAt)}</span><span>Updated {compactDate(source.updatedAt)}</span></div>
                      <div className="card-footer"><code>{source.id}</code><button className="text-button" type="button" onClick={() => setEditingSourceId(source.id)}>Edit metadata</button></div>
                    </>
                  )}
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

      <ReasoningDashboard workspace={workspace} actions={actions} />

      <div className="support-grid">
        <section className="panel">
          <div className="panel-heading"><div><p className="eyebrow">Human context</p><h2>Research notes</h2></div><span className="count-pill">{workspace.notes.length}</span></div>
          <details className="composer">
            <summary>Add research note</summary>
            <form
              className="stack-form"
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const data = new FormData(form);
                const ok = runAction(() => actions.addNote(formValue(data, "title"), formValue(data, "content")));
                if (ok) form.reset();
              }}
            >
              <label>Title<input name="title" required placeholder="Constraint, assumption, observation…" /></label>
              <label>Note<textarea name="content" rows={4} required placeholder="Capture context that should remain visible during research…" /></label>
              <button className="small-button" type="submit">Add note</button>
            </form>
          </details>
          {workspace.notes.length === 0 ? <div className="empty-state">No notes yet. Capture constraints, assumptions, or observations that should stay visible while the research evolves.</div> : (
            <div className="card-list">
              {workspace.notes.map((note) => (
                <article className="research-card note-card" key={note.id}>
                  {editingNoteId === note.id ? (
                    <form
                      className="stack-form"
                      onSubmit={(event) => {
                        event.preventDefault();
                        const data = new FormData(event.currentTarget);
                        const ok = runAction(() => actions.updateNote(note.id, { title: formValue(data, "title"), content: formValue(data, "content") }));
                        if (ok) setEditingNoteId(null);
                      }}
                    >
                      <label>Title<input name="title" defaultValue={note.title} required /></label>
                      <label>Note<textarea name="content" rows={5} defaultValue={note.content} required /></label>
                      <div className="inline-actions"><button className="small-button" type="submit">Save</button><button className="text-button" type="button" onClick={() => setEditingNoteId(null)}>Cancel</button></div>
                    </form>
                  ) : (
                    <>
                      <h3>{note.title}</h3>
                      <p>{note.content}</p>
                      <div className="card-footer"><span>Updated {compactDate(note.updatedAt)}</span><button className="text-button" type="button" onClick={() => setEditingNoteId(note.id)}>Edit</button></div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="panel activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">Shared history</p><h2>Activity trail</h2></div><span className="count-pill">{workspace.activity.length}</span></div>
          {workspace.activity.length === 0 ? <div className="empty-state">Activity starts with the next change. Older Phase 1 workspaces are migrated without inventing history.</div> : (
            <ol className="activity-list">
              {workspace.activity.slice(0, 30).map((entry) => (
                <li key={entry.id}>
                  <div className="activity-marker" aria-hidden="true" />
                  <div>
                    <div className="activity-meta"><span className={`actor actor-${entry.actor}`}>{entry.actor}</span><time dateTime={entry.createdAt}>{compactDate(entry.createdAt)}</time></div>
                    <p>{entry.message}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
