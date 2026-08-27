# DeepTrail

**A WebMCP-native workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into an inspectable trail of questions, claims, sources, evidence, gaps, counterarguments, confidence changes, comparisons, and decisions. Instead of losing reasoning across tabs and chat threads, the human and agent work against the same visible research state.

## Why DeepTrail

Most AI research interfaces optimize for producing an answer. DeepTrail optimizes for making the path to the answer inspectable: what supports it, what contradicts it, what is still unknown, where each finding came from, what changed confidence, and why a decision was reached.

The browser agent provides intelligence and web access. DeepTrail provides structured research state and WebMCP actions. No paid LLM or search API is required.

## Current status — Phase 3

The WebMCP collaboration layer now supports the full reasoning loop:

```text
inspect workspace
      ↓
identify research gaps
      ↓
research + capture provenance
      ↓
add / refine claims
      ↓
challenge with counterarguments
      ↓
update confidence with a reason
      ↓
compare alternatives
      ↓
record a draft/final decision
```

Every step becomes a durable object in the same interface the human sees.

See [`ROADMAP.md`](./ROADMAP.md) for the six-phase hackathon plan.

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

This state-aware registration keeps irrelevant tools out of the agent context. The implementation uses `document.modelContext.registerTool()` and an `AbortController` for clean lifecycle management.

## Reasoning model

DeepTrail intentionally separates deterministic analysis from model judgment.

The local gap engine derives only things the application can prove from its own state:

- unresolved questions
- claims with no linked evidence
- no captured counterevidence
- an unusually thin source base

The agent contributes the semantic reasoning DeepTrail cannot infer mechanically:

- counterarguments
- confidence-change rationale
- option trade-offs
- recommendations
- decision rationale

That distinction prevents the UI from presenting heuristic application logic as if it were model-generated research.

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
        |
        v
IndexedDB (local-first)
```

Agent mutations are tagged as `agent`; direct user edits are tagged as `human`. Research evidence remains separate from the current decision so incomplete research cannot silently become a conclusion.

## Stack

- Next.js
- React
- TypeScript
- Native IndexedDB
- Browser-native WebMCP via `document.modelContext`
- GitHub Actions CI

## Run locally

Requirements: Node.js 20.9+ and a browser/environment with WebMCP enabled to exercise agent tools.

```bash
npm install
npm run dev
```

For local Chrome WebMCP testing, enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, and open `http://localhost:3000`.

Create an investigation, then use the reasoning prompt shown in the UI. It instructs the agent to find gaps, research, challenge its own strongest claim, revise confidence only when warranted, compare options when relevant, and avoid prematurely recording a decision.

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
- Web-derived content is treated as untrusted input
- WebMCP is core product functionality, not a demo wrapper
- Optimize every feature for the three-minute judge experience

## Web-informed implementation

DeepTrail follows the current WebMCP direction: tools have explicit schemas, are registered only when relevant to current application state, and mutate the same visible UI the user is working in. The project uses the current `document.modelContext` API rather than deprecated `navigator.modelContext`.

References:

- [WebMCP Community Group specification](https://webmachinelearning.github.io/webmcp/)
- [Chrome WebMCP overview](https://developer.chrome.com/docs/ai/webmcp)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)

## Hackathon

Built for the OpenAI WebMCP Challenge. The repository is public and licensed under MIT.
