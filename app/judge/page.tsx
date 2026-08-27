"use client";

import { useEffect, useMemo, useState } from "react";
import { createJudgeDemoWorkspace, JUDGE_AGENT_PROMPT } from "@/lib/demo-workspace";
import { loadCurrentWorkspace, saveCurrentWorkspace } from "@/lib/storage";
import styles from "./judge.module.css";

type CheckStatus = "checking" | "pass" | "warn" | "fail";

interface ReadinessCheck {
  label: string;
  detail: string;
  status: CheckStatus;
}

interface BrowserReadiness {
  secureContext: boolean | null;
  webmcp: boolean | null;
  indexedDb: boolean | null;
  originAgentCluster: string | null;
  permissionsPolicy: string | null;
  headerError: string | null;
}

const initialReadiness: BrowserReadiness = {
  secureContext: null,
  webmcp: null,
  indexedDb: null,
  originAgentCluster: null,
  permissionsPolicy: null,
  headerError: null,
};

function statusLabel(status: CheckStatus) {
  if (status === "pass") return "Ready";
  if (status === "warn") return "Check";
  if (status === "fail") return "Blocked";
  return "Checking";
}

export default function JudgePage() {
  const [readiness, setReadiness] = useState<BrowserReadiness>(initialReadiness);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [launching, setLaunching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const secureContext = window.isSecureContext;
    const webmcp = Boolean(document.modelContext);
    const indexedDb = "indexedDB" in window;

    setReadiness((current) => ({
      ...current,
      secureContext,
      webmcp,
      indexedDb,
    }));

    fetch("/", { method: "HEAD", cache: "no-store" })
      .then((response) => {
        if (cancelled) return;
        setReadiness((current) => ({
          ...current,
          originAgentCluster: response.headers.get("origin-agent-cluster"),
          permissionsPolicy: response.headers.get("permissions-policy"),
          headerError: null,
        }));
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setReadiness((current) => ({
          ...current,
          headerError: reason instanceof Error ? reason.message : "Response headers could not be checked.",
        }));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const checks = useMemo<ReadinessCheck[]>(() => {
    const originReady = readiness.originAgentCluster === "?1";
    const toolsPolicyReady = readiness.permissionsPolicy?.includes("tools=(self)") ?? false;

    return [
      {
        label: "Secure context",
        detail:
          readiness.secureContext === null
            ? "Checking whether this origin is secure."
            : readiness.secureContext
              ? "The page is running in a secure context."
              : "Use the HTTPS production deployment for judging.",
        status: readiness.secureContext === null ? "checking" : readiness.secureContext ? "pass" : "fail",
      },
      {
        label: "WebMCP browser capability",
        detail:
          readiness.webmcp === null
            ? "Checking document.modelContext."
            : readiness.webmcp
              ? "document.modelContext is available in this browser."
              : "Open this page in ChatGPT's in-app browser or Chrome 149+ with chrome://flags/#enable-webmcp-testing enabled.",
        status: readiness.webmcp === null ? "checking" : readiness.webmcp ? "pass" : "warn",
      },
      {
        label: "Origin isolation header",
        detail: readiness.headerError
          ? `Header check failed: ${readiness.headerError}`
          : readiness.originAgentCluster === null
            ? "Checking Origin-Agent-Cluster."
            : originReady
              ? "Origin-Agent-Cluster: ?1 is present."
              : `Expected ?1; received ${readiness.originAgentCluster ?? "no header"}.`,
        status: readiness.headerError
          ? "warn"
          : readiness.originAgentCluster === null
            ? "checking"
            : originReady
              ? "pass"
              : "fail",
      },
      {
        label: "Tools permissions policy",
        detail: readiness.headerError
          ? "The response-header check could not complete."
          : readiness.permissionsPolicy === null
            ? "Checking Permissions-Policy."
            : toolsPolicyReady
              ? "Permissions-Policy explicitly allows WebMCP tools for self."
              : `Expected tools=(self); received ${readiness.permissionsPolicy ?? "no header"}.`,
        status: readiness.headerError
          ? "warn"
          : readiness.permissionsPolicy === null
            ? "checking"
            : toolsPolicyReady
              ? "pass"
              : "fail",
      },
      {
        label: "Local research storage",
        detail:
          readiness.indexedDb === null
            ? "Checking IndexedDB."
            : readiness.indexedDb
              ? "IndexedDB is available for the local-first workspace."
              : "This browser does not expose IndexedDB, so the demo cannot persist research state.",
        status: readiness.indexedDb === null ? "checking" : readiness.indexedDb ? "pass" : "fail",
      },
    ];
  }, [readiness]);

  const passCount = checks.filter((check) => check.status === "pass").length;

  async function loadJudgeDemo() {
    setLaunching(true);
    setMessage(null);
    setError(null);

    try {
      let existingTitle: string | null = null;
      try {
        existingTitle = (await loadCurrentWorkspace())?.title ?? null;
      } catch {
        // A validated demo import can safely replace a malformed local record.
      }

      if (
        existingTitle &&
        !window.confirm(
          `Replace the local investigation “${existingTitle}” with the DeepTrail judge demo? Export a backup first if you need the existing workspace.`,
        )
      ) {
        setMessage("Judge demo launch cancelled; the current workspace was not changed.");
        return;
      }

      await saveCurrentWorkspace(createJudgeDemoWorkspace());
      window.location.assign("/?judge=1");
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : "The judge demo could not be loaded.");
    } finally {
      setLaunching(false);
    }
  }

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(JUDGE_AGENT_PROMPT);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setError("Clipboard access is unavailable. Select the prompt below and copy it manually.");
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark}>DT</span>
          <span>DeepTrail</span>
          <span className={styles.modePill}>Judge mode</span>
        </div>
        <p className={styles.eyebrow}>OpenAI WebMCP Challenge · 60-second start</p>
        <h1>Watch a browser agent challenge a decision inside the same evidence workspace a human can inspect.</h1>
        <p className={styles.lede}>
          DeepTrail turns transient web research into shared state: questions, sources, claims, evidence links,
          counterarguments, confidence changes, research debt, and a draft decision. WebMCP is the collaboration
          layer—not a wrapper around a chatbot.
        </p>
        <div className={styles.heroActions}>
          <button className={styles.primaryButton} type="button" onClick={loadJudgeDemo} disabled={launching}>
            {launching ? "Loading demo…" : "Load evidence-backed judge demo"}
          </button>
          <button className={styles.secondaryButton} type="button" onClick={copyPrompt}>
            {copyState === "copied" ? "Prompt copied" : "Copy exact agent prompt"}
          </button>
          <a className={styles.textLink} href="/">Open workspace</a>
        </div>
        {message ? <p className={styles.message} role="status">{message}</p> : null}
        {error ? <p className={styles.error} role="alert">{error}</p> : null}
      </section>

      <section className={styles.section} aria-labelledby="readiness-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Production readiness</p>
            <h2 id="readiness-heading">Browser + WebMCP release checks</h2>
          </div>
          <span className={styles.score}>{passCount}/{checks.length} ready</span>
        </div>
        <div className={styles.checkGrid}>
          {checks.map((check) => (
            <article className={styles.checkCard} key={check.label}>
              <div className={styles.checkTopline}>
                <h3>{check.label}</h3>
                <span className={`${styles.status} ${styles[`status_${check.status}`]}`}>
                  {statusLabel(check.status)}
                </span>
              </div>
              <p>{check.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.section} aria-labelledby="demo-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>What to do</p>
            <h2 id="demo-heading">Three steps for the strongest demo</h2>
          </div>
        </div>
        <ol className={styles.steps}>
          <li>
            <span>1</span>
            <div>
              <h3>Load the seeded investigation</h3>
              <p>It starts with sourced claims, a visible counterargument, open production-verification gaps, a comparison, and a deliberately draft decision.</p>
            </div>
          </li>
          <li>
            <span>2</span>
            <div>
              <h3>Give the browser agent the prompt below</h3>
              <p>The agent reads stable IDs and structured state through WebMCP, searches the live web, and writes new evidence back through single-purpose tools.</p>
            </div>
          </li>
          <li>
            <span>3</span>
            <div>
              <h3>Watch the belief state move</h3>
              <p>Look for the evidence graph, new counterevidence, confidence history, Research Debt, actor-attributed activity, and the decision remaining draft unless the evidence earns finality.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className={`${styles.section} ${styles.promptSection}`} aria-labelledby="prompt-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Exact judge prompt</p>
            <h2 id="prompt-heading">Adversarial research, not agreeable summarization</h2>
          </div>
          <button className={styles.secondaryButton} type="button" onClick={copyPrompt}>
            {copyState === "copied" ? "Copied" : "Copy prompt"}
          </button>
        </div>
        <pre>{JUDGE_AGENT_PROMPT}</pre>
      </section>

      <section className={styles.section} aria-labelledby="criteria-heading">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>Why it fits the challenge</p>
            <h2 id="criteria-heading">Built around the four judging criteria</h2>
          </div>
        </div>
        <div className={styles.criteriaGrid}>
          <article><span>WebMCP leverage</span><h3>Shared application state</h3><p>State-aware WebMCP tools let the agent inspect and mutate the same visible research objects the human edits.</p></article>
          <article><span>Execution</span><h3>Complete local-first product</h3><p>IndexedDB persistence, provenance, recovery, strict validation, accessibility, and automated regression coverage make the demo resilient.</p></article>
          <article><span>Potential impact</span><h3>Better decisions, not more tabs</h3><p>DeepTrail targets repeated research work where people need to understand why an answer is credible and what remains uncertain.</p></article>
          <article><span>Creativity + ambition</span><h3>Attack the conclusion</h3><p>Falsification criteria, an evidence graph, confidence history, and deterministic Research Debt turn critical thinking into inspectable UI.</p></article>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>No paid LLM API · No backend · Local-first research state</span>
        <a href="https://github.com/AaryaMody1301/deeptrail-webmcp" target="_blank" rel="noreferrer">Public source</a>
      </footer>
    </main>
  );
}
