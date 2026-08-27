# DeepTrail

**A workspace where humans and AI agents investigate the web together.**

DeepTrail turns web research into a structured trail of questions, claims, sources, evidence, contradictions, confidence, and decisions. Instead of losing reasoning across tabs and chat threads, users keep a living research workspace that browser agents can read and update through WebMCP.

## Hackathon goal

Build a compelling WebMCP-native research experience where an agent can:

1. Understand the user's current investigation.
2. See open questions and existing claims.
3. Add sources and evidence discovered on the web.
4. Challenge assumptions and contradictory claims.
5. Help the human reach an evidence-backed decision.

## Core WebMCP tools

Initial vertical slice:

- `deeptrail_get_workspace_context`
- `deeptrail_get_open_questions`
- `deeptrail_add_source`
- `deeptrail_add_claim`
- `deeptrail_link_evidence`

Planned:

- `deeptrail_add_counterargument`
- `deeptrail_identify_research_gaps`
- `deeptrail_update_confidence`
- `deeptrail_compare_options`
- `deeptrail_record_decision`

## Architecture

```text
Browser Agent / ChatGPT
        |
        | WebMCP
        v
document.modelContext
        |
        v
DeepTrail WebMCP tools
        |
        v
Research store <----> DeepTrail UI
        |
        v
Local persistence
```

DeepTrail uses the browser-native `document.modelContext.registerTool()` WebMCP API. Tool registrations are owned by an `AbortController`, allowing clean lifecycle management as the workspace changes.

## MVP principles

- Local-first
- No paid APIs
- No LLM API required
- Agent provides intelligence; DeepTrail provides structured research state and actions
- Human remains in control of conclusions
- WebMCP is core product functionality, not a demo wrapper

## Proposed stack

- Next.js
- TypeScript
- React
- Tailwind CSS
- IndexedDB for local persistence
- WebMCP via `document.modelContext`

## First milestone

```text
Create investigation
      ->
Agent reads workspace through WebMCP
      ->
Agent researches the web
      ->
Agent adds source + claim
      ->
DeepTrail UI updates
```

Once this loop works reliably, we add the research graph, contradictions, Research Debt, Devil's Advocate mode, confidence tracking, and shareable investigations.

## Status

Hackathon build in progress.
