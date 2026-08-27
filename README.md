# DeepTrail

**A WebMCP-native workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into an inspectable trail of questions, claims, sources, evidence, gaps, counterarguments, confidence changes, comparisons, decisions, and falsification tests. Instead of losing reasoning across tabs and chat threads, the human and agent work against the same visible research state.

## Why DeepTrail

Most AI research interfaces optimize for producing an answer. DeepTrail optimizes for making the path to the answer inspectable: what supports it, what contradicts it, what is still unknown, where each finding came from, what changed confidence, and what evidence would overturn the current conclusion.

The browser agent provides intelligence and web access. DeepTrail provides structured research state and WebMCP actions. No paid LLM or search API is required.

## Current status — Phase 5

DeepTrail now supports the full research loop with a reliability/security layer around the shared state:

```text
inspect workspace
      ↓
identify research gaps
      ↓
research + capture provenance
      ↓
add / refine claims
      ↓
visualize the evidence graph
      ↓
define “what would change my mind?”
      ↓
attack the strongest conclusion
      ↓
search for falsifying / qualifying evidence
      ↓
record counterarguments + confidence changes
      ↓
watch Research Debt and belief move
      ↓
compare alternatives / record a draft decision
      ↓
validate + back up the investigation
```

Every step remains visible in the same interface the human is using. See [`ROADMAP.md`](./ROADMAP.md) for the six-phase hackathon plan and [`docs/TEST_MATRIX.md`](./docs/TEST_MATRIX.md) for the release matrix.

## Critical-thinking differentiators

### Interactive evidence graph

DeepTrail renders an interactive graph of stored research relationships using `@xyflow/react` (React Flow):

- source → claim edges for `supports`, `contradicts`, and `qualifies`
- counterargument → claim edges for explicit challenges
- keyboard-focusable nodes and edges
- automatic panning to focused nodes
- minimap and viewport controls
- graph content derived only from stored DeepTrail state

The graph is an audit surface, not decorative AI visualization. If a relationship is not stored in the workspace, it is not drawn.

### Attack this conclusion

DeepTrail chooses the current draft decision when one exists; otherwise it selects the strongest claim by confidence plus linked-evidence count. Starting an attack stores a local baseline and creates a targeted adversarial-research prompt.

The prompt asks the WebMCP-aware agent to search specifically for credible falsifying or materially qualifying evidence, capture the new provenance, record counterarguments, change confidence only when evidence warrants it, and refresh research gaps afterward. The UI then shows baseline confidence, current confidence, and movement in percentage points.

### What would change my mind?

The human can define explicit falsification criteria before running an attack. Criteria are stored in DeepTrail's shared research notes, visible to the agent through workspace context, and can be tracked as open, met, or dismissed.

### Research Debt

Research Debt is deterministic rather than model-generated. It is built from unresolved questions, unsupported claims, missing counterevidence, and thin provenance. A higher score means more unresolved structural research risk, so a judge can see it improve as the agent closes gaps and attaches evidence.

## Reliability, recovery, and security

### Validated local backups

DeepTrail exports a versioned JSON backup only after validating the workspace. Imports are limited to 2 MB and validated before IndexedDB is overwritten. Legacy Phase 1–4 workspaces are migrated forward, while malformed timestamps, invalid enums, unsafe URLs, oversized fields, duplicate IDs, and broken evidence/reasoning references are rejected.

### Browser storage persistence

The workspace is local-first in IndexedDB. The reliability panel reports whether the browser has granted persistent storage and lets the user explicitly call `navigator.storage.persist()` for an important investigation. JSON backups remain the portable recovery path.

### Untrusted web content

Externally sourced text is not treated as trusted instructions. WebMCP read/mutation tools retain `untrustedContentHint` where user/web-derived content is involved; read tools use `readOnlyHint`. DeepTrail does not opt tools into cross-origin `exposedTo` access.

The UI also highlights a small set of common instruction-like patterns in stored source/research text. This is **advisory only**: regex indicators are not a prompt-injection security boundary and do not silently delete evidence.

### Execution-time WebMCP validation

All 11 WebMCP tools validate their actual invocation inputs with strict Zod schemas before an action runs. This is separate from the JSON Schema advertised to agents and protects against clients that bypass or violate the advertised schema.

Validation rejects, among other cases:

- non-http/https source URLs
- unexpected properties
- oversized strings/arrays
- confidence outside `0..1`
- malformed option comparisons
- invalid entity IDs and broken references

WebMCP tool results are compacted to stay near Chrome's recommended output budget. Registration remains state-aware and uses an `AbortController` for lifecycle cleanup.

### Reproducible CI

Direct dependencies are pinned and `package-lock.json` is committed. GitHub Actions uses read-only repository permissions, `actions/checkout@v7`, `actions/setup-node@v7`, Node 22, npm cache keyed by the lockfile, and `npm ci`.

Every push to `main` must pass:

```bash
npm run test
npm run typecheck
npm run build
```

The Phase 5 suite currently contains **21 passing tests across 5 files**, covering backup/schema migration, referential integrity, malformed WebMCP inputs, Research Debt, and deterministic gap detection.

## WebMCP tools

### Always available

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_workspace_context` | Read compact active-investigation context and stable IDs |

### During an active investigation

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_open_questions` | Read unresolved research questions |
| `deeptrail_add_open_question` | Add a concrete follow-up question |
| `deeptrail_add_source` | Add a validated web source with provenance metadata |
| `deeptrail_add_claim` | Add a concise research claim |
| `deeptrail_link_evidence` | Connect a source to a claim as supports / contradicts / qualifies |
| `deeptrail_identify_research_gaps` | Derive and persist structural research gaps |
| `deeptrail_compare_options` | Record a structured multi-option comparison |
| `deeptrail_record_decision` | Record/update a draft or final evidence-backed decision |

### Once claims exist

| Tool | Purpose |
| --- | --- |
| `deeptrail_add_counterargument` | Challenge a claim or current line of reasoning |
| `deeptrail_update_confidence` | Change claim confidence with a mandatory reason and history entry |

The **Attack this conclusion** workflow intentionally reuses these single-purpose primitives instead of adding an overlapping attack mutation tool.

## Architecture

```text
Browser Agent / ChatGPT
        |
        | WebMCP
        v
document.modelContext
        |
        v
validated DeepTrail WebMCP bridge
        |
        v
research actions + reasoning state <----> DeepTrail UI
        |                                      |
        |                                      +--> Evidence graph
        |                                      +--> Research Debt
        |                                      +--> Attack baseline
        |                                      +--> Falsification criteria
        |                                      +--> Backup / recovery
        v
validated IndexedDB workspace
```

Agent mutations are tagged as `agent`; direct user edits are tagged as `human`. Research evidence remains separate from the current decision so incomplete research cannot silently become a conclusion.

## Stack

- Next.js 16.3.3
- React 19.2.8
- TypeScript 7.0.2
- Zod 4.4.3
- Vitest 4.1.11
- Native IndexedDB
- `@xyflow/react` 12.11.5 for the evidence graph
- Browser-native WebMCP via `document.modelContext`
- GitHub Actions CI

## Run locally

Requirements: Node.js 22+ and a browser/environment with WebMCP enabled to exercise agent tools.

```bash
npm ci
npm run dev
```

Run the same verification gate as CI with:

```bash
npm run test
npm run typecheck
npm run build
```

For local Chrome WebMCP testing, enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, and open `http://localhost:3000`.

Create an investigation, add some evidence, then use the reasoning prompt in the UI. Once a claim or draft decision exists, use **Attack this conclusion** to copy the adversarial research prompt and measure confidence movement after the agent updates the shared workspace.

The human UI continues to work in browsers without WebMCP and clearly reports that the capability is unavailable.

## Product principles

- Local-first
- No paid APIs
- No LLM API required
- Human remains in control of conclusions
- Provenance is visible in the interface, not hidden in model output
- Human and agent actions share one inspectable history
- Agent reasoning becomes inspectable state rather than transient prose
- Confidence changes require an explicit reason in the reasoning workflow
- Decisions remain separate from evidence and can stay draft
- Falsification criteria are defined before adversarial searching
- Research Debt is deterministic and explainable
- Graph edges map only to stored relationships
- Web-derived content is treated as untrusted input
- Backup/import validation protects the durable workspace
- WebMCP is core product functionality, not a demo wrapper
- Optimize every feature for the three-minute judge experience

## Web-informed implementation

DeepTrail follows current WebMCP guidance: explicit schemas, state-relevant registration, `document.modelContext`, lifecycle cleanup, compact results, least privilege, and untrusted-content annotations. React Flow was selected for its accessible keyboard/focus support. The Phase 5 threat model is defense-in-depth: external text stays untrusted, tool calls are constrained and validated, cross-origin exposure is not enabled, and advisory injection indicators never substitute for those controls.

References:

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP secure tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [MDN Storage quotas and eviction criteria](https://developer.mozilla.org/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)
- [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility)

## Hackathon

Built for the OpenAI WebMCP Challenge. The repository is public and licensed under MIT.
