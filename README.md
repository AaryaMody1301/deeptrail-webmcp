# DeepTrail

**A WebMCP-native workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into an inspectable trail of questions, claims, sources, evidence, gaps, counterarguments, confidence changes, comparisons, decisions, and falsification tests. Instead of losing reasoning across tabs and chat threads, the human and agent work against the same visible research state.

## Why DeepTrail

Most AI research interfaces optimize for producing an answer. DeepTrail optimizes for making the path to the answer inspectable: what supports it, what contradicts it, what is still unknown, where each finding came from, what changed confidence, and what evidence would overturn the current conclusion.

The browser agent provides intelligence and web access. DeepTrail provides structured research state and WebMCP actions. No paid LLM or search API is required.

## Current status — Phase 4

DeepTrail now supports a full adversarial research loop:

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
```

Every step remains visible in the same interface the human is using.

See [`ROADMAP.md`](./ROADMAP.md) for the six-phase hackathon plan.

## Phase 4 differentiators

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

The prompt instructs the WebMCP-aware agent to:

1. read the current workspace,
2. search specifically for credible falsifying or materially qualifying evidence,
3. add contrary/qualifying sources and claims,
4. record counterarguments,
5. change confidence only when evidence warrants it,
6. refresh research gaps afterward.

The UI shows baseline confidence, current confidence, and movement in percentage points.

### What would change my mind?

The human can define explicit falsification criteria before running an attack, for example:

> Migration effort exceeds two engineer-months.

Criteria are stored in DeepTrail's shared research notes, so they are visible to the agent through workspace context. They can be tracked as open, met, or dismissed.

### Research Debt

Research Debt is deliberately deterministic. It is not an LLM-generated confidence score.

The score is built from four transparent components:

- unresolved questions: up to +30
- unsupported claims: up to +30
- missing counterevidence: +20
- thin provenance: up to +20

A higher score means more unresolved structural research risk. This allows a judge to see the score improve as the agent closes gaps, attaches evidence, and introduces counterevidence.

## WebMCP tools

### Always available

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_workspace_context` | Detect/read the active investigation and stable IDs |

### During an active investigation

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_open_questions` | Read unresolved research questions |
| `deeptrail_add_open_question` | Add a concrete follow-up question |
| `deeptrail_add_source` | Add a web source with provenance metadata |
| `deeptrail_add_claim` | Add a concise research claim |
| `deeptrail_link_evidence` | Connect a source to a claim as supports / contradicts / qualifies |
| `deeptrail_identify_research_gaps` | Derive and persist research gaps from current workspace state |
| `deeptrail_compare_options` | Record a structured multi-option comparison |
| `deeptrail_record_decision` | Record/update a draft or final evidence-backed decision |

### Once claims exist

| Tool | Purpose |
| --- | --- |
| `deeptrail_add_counterargument` | Challenge a claim or current line of reasoning |
| `deeptrail_update_confidence` | Change claim confidence with a mandatory reason and history entry |

Phase 4 intentionally reuses these existing single-purpose tools rather than adding an overlapping “attack” mutation tool. The attack workflow is a human-visible orchestration over the WebMCP primitives.

## Reasoning model

DeepTrail intentionally separates deterministic analysis from model judgment.

The local application can prove structural research weaknesses such as:

- unresolved questions
- claims with no linked evidence
- missing counterevidence
- a thin source base

The agent contributes semantic work the application cannot infer mechanically:

- counterarguments
- confidence-change rationale
- option trade-offs
- recommendations
- decision rationale
- whether new contrary evidence genuinely undermines a claim

That boundary keeps heuristics inspectable and avoids presenting application logic as AI research.

## Architecture

```text
Browser Agent / ChatGPT
        |
        | WebMCP
        v
document.modelContext
        |
        v
DeepTrail WebMCP bridge
        |
        v
Research actions + reasoning objects <----> DeepTrail UI
        |                                       |
        |                                       +--> Evidence graph
        |                                       +--> Research Debt
        |                                       +--> Attack baseline
        |                                       +--> Falsification criteria
        v
IndexedDB (local-first)
```

Agent mutations are tagged as `agent`; direct user edits are tagged as `human`. Research evidence remains separate from the current decision so incomplete research cannot silently become a conclusion.

## Stack

- Next.js
- React
- TypeScript
- Native IndexedDB
- `@xyflow/react` 12.11.5 for the evidence graph
- Browser-native WebMCP via `document.modelContext`
- GitHub Actions CI

## Run locally

Requirements: Node.js 20.9+ and a browser/environment with WebMCP enabled to exercise agent tools.

```bash
npm install
npm run dev
```

For local Chrome WebMCP testing, enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, and open `http://localhost:3000`.

Create an investigation, add some evidence, then use the reasoning prompt in the UI. Once a claim or draft decision exists, use **Attack this conclusion** to copy the adversarial research prompt and measure confidence movement after the agent updates the shared workspace.

The UI still works in browsers without WebMCP and clearly reports that the capability is unavailable.

## Product principles

- Local-first
- No paid APIs
- No LLM API required
- Human remains in control of conclusions
- Provenance is visible in the interface, not hidden in model output
- Human and agent actions share one inspectable history
- Agent reasoning becomes inspectable state rather than transient prose
- Confidence can change only with a recorded reason in the reasoning workflow
- Decisions remain separate from evidence and can stay draft
- Falsification criteria are defined before adversarial searching
- Research Debt is deterministic and explainable
- Graph edges map only to stored relationships
- Web-derived content is treated as untrusted input
- WebMCP is core product functionality, not a demo wrapper
- Optimize every feature for the three-minute judge experience

## Web-informed implementation

DeepTrail follows the current WebMCP direction: tools have explicit schemas, are registered only when relevant to current application state, and mutate the same visible UI the user is working in. The project uses the current `document.modelContext` API rather than deprecated `navigator.modelContext`.

React Flow was selected after reviewing its current accessibility support: focusable nodes/edges, keyboard operation, automatic focus panning, configurable ARIA descriptions, and accessible minimap labeling. The package is MIT-licensed and pinned to `12.11.5` for the hackathon build.

References:

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [React Flow accessibility](https://reactflow.dev/learn/advanced-use/accessibility)
- [React Flow API](https://reactflow.dev/api-reference/react-flow)

## Hackathon

Built for the OpenAI WebMCP Challenge. The repository is public and licensed under MIT.
