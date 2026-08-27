# DeepTrail

**A WebMCP-native workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into a structured trail of questions, claims, sources, evidence, contradictions, confidence, and decisions. Instead of losing reasoning across tabs and chat threads, the human and agent work against the same visible research state.

## Why DeepTrail

Most AI research interfaces optimize for producing an answer. DeepTrail optimizes for making the path to the answer inspectable: what supports it, what contradicts it, what is still unknown, and what would change the decision.

The browser agent provides the intelligence and web access. DeepTrail provides the structured research state and WebMCP actions. No paid LLM or search API is required.

## Phase 1 status

The first end-to-end vertical slice is implemented:

```text
Human creates investigation
        ->
Agent reads workspace through WebMCP
        ->
Agent researches the web
        ->
Agent adds source + claim
        ->
Agent links evidence
        ->
DeepTrail UI updates immediately
```

See [`ROADMAP.md`](./ROADMAP.md) for the six-phase hackathon plan.

## Current WebMCP tools

| Tool | Purpose |
| --- | --- |
| `deeptrail_get_workspace` | Read the active investigation and stable IDs |
| `deeptrail_get_open_questions` | Read unresolved research questions |
| `deeptrail_add_source` | Add a web source with metadata |
| `deeptrail_add_claim` | Add a concise research claim |
| `deeptrail_link_evidence` | Connect a source to a claim as supports / contradicts / qualifies |

The implementation uses `document.modelContext.registerTool()` and an `AbortController` for clean tool lifecycle management. Read tools use `readOnlyHint`, and any tool returning human or web-derived content uses `untrustedContentHint`.

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
Research store <----> DeepTrail UI
        |
        v
IndexedDB (local-first)
```

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

Open `http://localhost:3000`, create an investigation, then ask your WebMCP-aware agent:

> Read the active DeepTrail investigation through its WebMCP tools. Research the primary open question on the web. Add one credible source, add one concise claim based on that source, and link the source to the claim with the correct evidence relationship. Then tell me what you added and what should be researched next.

The UI still works in browsers without WebMCP and clearly reports that the capability is unavailable.

## MVP principles

- Local-first
- No paid APIs
- No LLM API required
- Human remains in control of conclusions
- Web-derived and user-generated content is treated as untrusted output to agents
- WebMCP is core product functionality, not a demo wrapper
- Optimize every feature for the three-minute judge experience

## Hackathon

Built for the OpenAI WebMCP Challenge. The repository is public and licensed under MIT.
