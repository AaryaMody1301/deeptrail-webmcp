# DeepTrail

**A WebMCP-native workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into a structured trail of questions, claims, sources, evidence, contradictions, confidence, notes, and decisions. Instead of losing reasoning across tabs and chat threads, the human and agent work against the same visible research state.

## Why DeepTrail

Most AI research interfaces optimize for producing an answer. DeepTrail optimizes for making the path to the answer inspectable: what supports it, what contradicts it, what is still unknown, where each finding came from, and what would change the decision.

The browser agent provides intelligence and web access. DeepTrail provides structured research state and WebMCP actions. No paid LLM or search API is required.

## Current status — Phase 2

The shared research workspace now supports:

- Multiple open/answered research questions
- Human-editable claims, source metadata, and research notes
- Source publication/access timestamps and visible provenance
- URL normalization and duplicate-source prevention
- Search/filtering across evidence
- Human-vs-agent activity history
- Accessible live announcements for dynamic workspace changes
- Local-first persistence with backward-compatible Phase 1 migration
- State-aware WebMCP registration
- Responsive keyboard-friendly UI

See [`ROADMAP.md`](./ROADMAP.md) for the six-phase hackathon plan.

## Current WebMCP tools

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_workspace_context` | Read the active investigation and stable IDs |
| `deeptrail_get_open_questions` | Read unresolved research questions |
| `deeptrail_add_source` | Add a web source with provenance metadata |
| `deeptrail_add_claim` | Add a concise research claim |
| `deeptrail_link_evidence` | Connect a source to a claim as supports / contradicts / qualifies |

`deeptrail_get_workspace_context` remains available so an agent can detect whether an investigation exists. The other four tools are registered only while an investigation is active, reducing irrelevant tool context and matching the current page state.

The implementation uses `document.modelContext.registerTool()` and an `AbortController` for clean tool lifecycle management. Read tools use `readOnlyHint`; tools that expose user- or web-derived content use `untrustedContentHint`.

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
Research actions + activity trail <----> DeepTrail UI
        |
        v
IndexedDB (local-first)
```

Every mutation updates the shared interface immediately. Agent mutations are marked as `agent`; direct user edits are marked as `human`, making collaboration visible instead of hiding it in a chat transcript.

## Stack

- Next.js
- React
- TypeScript
- Native IndexedDB
- Browser-native WebMCP via `document.modelContext`
- GitHub Actions CI

## Run locally

Requirements: Node.js 20.9+ and a browser/environment with WebMCP enabled to exercise the agent tools.

```bash
npm install
npm run dev
```

For local Chrome WebMCP testing, enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, and open `http://localhost:3000`.

Create an investigation, then ask your WebMCP-aware agent:

> Read the active DeepTrail investigation and its open questions through WebMCP. Research the most important open question on the web. Add one credible source with useful provenance metadata, add one concise claim grounded in that source, and link the source to the claim with the appropriate evidence relationship. Then summarize what changed in the shared workspace and identify the next research gap.

The UI still works in browsers without WebMCP and clearly reports that the capability is unavailable.

## Product principles

- Local-first
- No paid APIs
- No LLM API required
- Human remains in control of conclusions
- Provenance is visible in the interface, not hidden in model output
- Human and agent actions share one inspectable history
- Web-derived content is treated as untrusted input
- WebMCP is core product functionality, not a demo wrapper
- Optimize every feature for the three-minute judge experience

## Web-informed design decisions

Phase 2 follows current WebMCP guidance to keep tools single-purpose, register them only when useful in the current page state, update visible interface state after tool completion, and validate inputs in application code. It also makes source provenance visible and provides programmatic status messages for dynamic changes.

References:

- [Chrome WebMCP best practices](https://developer.chrome.com/docs/ai/webmcp/best-practices)
- [Chrome WebMCP Imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [W3C Data on the Web Best Practices — data provenance](https://www.w3.org/TR/dwbp/)
- [WCAG 2.2 — status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages)

## Hackathon

Built for the OpenAI WebMCP Challenge. The repository is public and licensed under MIT.
