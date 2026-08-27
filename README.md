# DeepTrail

**An evidence-first WebMCP workspace where humans and browser agents investigate the web together.**

DeepTrail turns web research into shared, inspectable state: questions, sources, claims, evidence links, gaps, counterarguments, confidence changes, comparisons, falsification criteria, and decisions. Instead of losing the reasoning trail across tabs and chat history, the human and agent work against the same visible workspace.

> Most AI research products optimize for producing an answer. DeepTrail optimizes for showing **why the answer should be believed, what contradicts it, what is still unknown, and what evidence would change the conclusion.**

## Judge quick start

DeepTrail includes a dedicated **Judge mode** at `/judge`.

1. Open `/judge` in ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Confirm the production-readiness cards for secure context, WebMCP capability, origin isolation, tools permissions policy, and IndexedDB.
3. Click **Load evidence-backed judge demo**.
4. Copy the exact adversarial-research prompt from the page and give it to the browser agent.
5. Watch the agent read DeepTrail's structured state, research the live web, add provenance-backed evidence, deliberately challenge the current draft recommendation, and mutate the same visible workspace.
6. Inspect the evidence graph, counterarguments, confidence history, Research Debt, actor-attributed activity trail, and draft decision.

The seeded investigation is intentionally about **where DeepTrail itself should ship for the WebMCP Challenge**. It starts with sourced claims, a credible alternative, a confidence reduction, and unresolved production-verification gates rather than a pre-baked perfect answer.

See:

- [`docs/SUBMISSION.md`](./docs/SUBMISSION.md) — final Devpost copy + submission checklist
- [`docs/DEMO_SCRIPT.md`](./docs/DEMO_SCRIPT.md) — timed <3-minute video script
- [`docs/DEPLOY.md`](./docs/DEPLOY.md) — production deployment and WebMCP verification runbook
- [`docs/TEST_MATRIX.md`](./docs/TEST_MATRIX.md) — broader release matrix
- [`ROADMAP.md`](./ROADMAP.md) — six-phase build plan

## The core interaction

```text
human defines an investigation
          ↓
agent reads shared state through WebMCP
          ↓
identify research gaps
          ↓
search web + capture provenance
          ↓
add claims + evidence relationships
          ↓
visualize evidence graph
          ↓
define “what would change my mind?”
          ↓
ATTACK THIS CONCLUSION
          ↓
search specifically for falsifying / qualifying evidence
          ↓
record counterarguments + confidence movement
          ↓
watch deterministic Research Debt change
          ↓
compare alternatives / keep decision draft until evidence earns finality
```

Every mutation is visible in the same interface the human is using.

## Why WebMCP is essential

DeepTrail is not a chatbot with a tool bolted on. The product depends on the human and browser agent operating on the same application state.

WebMCP provides explicit contracts for the research domain model. The agent does not need to infer which button edits a claim or which DOM card represents a source. DeepTrail exposes precise operations with stable entity IDs and validates every invocation before mutating local state.

This gives the collaboration properties DeepTrail needs:

- **Discovery:** the browser agent can discover exactly which actions are valid now.
- **Structured inputs:** source URLs, claim confidence, evidence relationships, option comparisons, and stable IDs have explicit schemas.
- **Shared state:** tool calls mutate the same visible workspace the human edits.
- **State-aware capability:** irrelevant mutations are not registered until they can be used.
- **Human control:** conclusions remain visible, editable, attributable, and can remain draft.

## Critical-thinking differentiators

### Interactive evidence graph

DeepTrail renders only stored relationships:

- source → claim: `supports`
- source → claim: `contradicts`
- source → claim: `qualifies`
- counterargument → claim: `challenges`

The graph is an audit surface, not an AI-generated decoration. If a relationship is not stored in the research workspace, it is not drawn.

### Attack this conclusion

DeepTrail targets the current draft decision when one exists; otherwise it selects the strongest claim. Starting an attack stores a confidence baseline and creates an adversarial-research prompt that asks the browser agent to find the strongest credible evidence that could **falsify or materially qualify** the conclusion.

The agent is explicitly told not to manufacture disagreement. Confidence changes only when the new evidence warrants them and the reasoning workflow records the reason.

### What would change my mind?

Before adversarial searching, the human can define explicit reversal/falsification criteria. Those criteria are durable workspace state visible to the agent rather than a forgotten line in chat history.

### Deterministic Research Debt

Research Debt is not model-generated confidence theater. It is a transparent structural score based on:

- unresolved questions
- unsupported claims
- missing counterevidence
- thin provenance

A judge can therefore watch the score move as real research gaps are closed.

## WebMCP tools

### Always available

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_workspace_context` | Read compact active-workspace state and stable IDs |

### During an active investigation

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_open_questions` | Read unresolved research questions |
| `deeptrail_add_open_question` | Add a concrete follow-up question |
| `deeptrail_add_source` | Add a validated web source with provenance |
| `deeptrail_add_claim` | Add a concise research claim |
| `deeptrail_link_evidence` | Link a source to a claim as supports / contradicts / qualifies |
| `deeptrail_identify_research_gaps` | Derive and persist structural research gaps |
| `deeptrail_compare_options` | Store a structured multi-option comparison |
| `deeptrail_record_decision` | Record/update a draft or final evidence-backed decision |

### Once claims exist

| Tool | Purpose |
| --- | --- |
| `deeptrail_add_counterargument` | Deliberately challenge a claim or reasoning line |
| `deeptrail_update_confidence` | Change claim confidence with a mandatory reason/history entry |

DeepTrail intentionally reuses these single-purpose primitives for **Attack this conclusion** instead of adding an overlapping mega-tool.

## Reliability and security

DeepTrail is local-first but not loose about data integrity.

- IndexedDB workspace persistence
- versioned JSON backup/export and validate-before-overwrite import
- browser persistent-storage status + `navigator.storage.persist()` request
- strict Zod execution-time validation for every WebMCP tool
- HTTP(S)-only source URLs and canonical URL cleanup
- bounded strings/arrays and strict enums
- duplicate-ID and referential-integrity checks
- same-origin tool exposure; no cross-origin `exposedTo` opt-in
- `readOnlyHint` and `untrustedContentHint` annotations
- Web-derived text treated as untrusted content
- advisory prompt-injection indicators for human review, never used as the trust boundary
- AbortController registration lifecycle cleanup
- compact WebMCP outputs to avoid flooding model context
- `Origin-Agent-Cluster: ?1`
- `Permissions-Policy: tools=(self)` plus camera/microphone/geolocation disabled
- `X-Content-Type-Options: nosniff`
- strict-origin referrer policy

## Architecture

```text
ChatGPT / browser agent
          |
          | WebMCP
          v
document.modelContext
          |
          v
validated state-aware WebMCP bridge
          |
          v
research actions + reasoning state <------> DeepTrail human UI
          |                                      |
          |                                      +--> evidence graph
          |                                      +--> Research Debt
          |                                      +--> attack baseline
          |                                      +--> falsification criteria
          |                                      +--> recovery controls
          v
validated IndexedDB workspace
```

The browser agent supplies intelligence and web access. DeepTrail supplies the durable research model, constraints, provenance, critical-thinking workflows, and visible shared state. **No paid LLM or search API is required.**

## Stack

- Next.js 16.3.3
- React 19.2.8
- TypeScript 7.0.2
- Zod 4.4.3
- Vitest 4.1.11
- Native IndexedDB
- `@xyflow/react` 12.11.5
- browser-native WebMCP via `document.modelContext`
- GitHub Actions CI

## Run locally

Requirements: Node.js 22+.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000/judge` for the fastest product walkthrough.

For Chrome WebMCP testing:

1. use Chrome 149 or later,
2. open `chrome://flags/#enable-webmcp-testing`,
3. enable the flag,
4. relaunch Chrome,
5. open the app.

The human interface still works when WebMCP is unavailable and reports that capability clearly.

## Verification

Run the same gate as CI:

```bash
npm run test
npm run typecheck
npm run build
```

The reliability suite contains **24 regression tests across 6 files** covering workspace migration/backups, referential integrity, malformed WebMCP inputs, deterministic Research Debt, research-gap derivation, and the seeded judge workspace.

## Product principles

- WebMCP is core product functionality, not a demo wrapper.
- The human remains in control of conclusions.
- Provenance belongs in the interface, not hidden in model output.
- Human and agent actions share one attributable history.
- Reasoning artifacts become durable state rather than transient prose.
- Decisions remain separate from evidence and may stay draft.
- Falsification is a first-class workflow.
- Heuristic scores must be deterministic and explainable.
- External web text is untrusted input.
- Local-first does not mean unrecoverable: important research can be exported/imported.
- Every hackathon feature must improve the three-minute judge experience, WebMCP leverage, reliability, or the evidence-backed decision loop.

## Current challenge status

Phases 1–5 are complete. Phase 6 adds the judge launchpad, one-click evidence-backed demo, submission narrative, video script, deployment verification runbook, and final reviewer experience. Production publishing and the public YouTube upload require the submitter's hosting/YouTube account and are tracked explicitly in [`ROADMAP.md`](./ROADMAP.md).

## References

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility)

## Hackathon

Built for the **OpenAI WebMCP Challenge**. The repository is public and licensed under MIT.
