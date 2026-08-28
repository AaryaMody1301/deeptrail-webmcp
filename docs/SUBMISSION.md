# DeepTrail — WebMCP Challenge Submission Package

Use this file as the source of truth for the final Devpost entry. Replace `[LIVE_URL]` only after the public deployment and production judge flow are verified. Replace `[YOUTUBE_URL]` only after a public upload is verified; never invent a video URL.

## Project name

**DeepTrail**

## One-line pitch

**An evidence-first WebMCP workspace where a human and browser agent investigate the web together, challenge conclusions, and leave every source, counterargument, confidence change, and decision inspectable.**

## Short description

Most AI research experiences optimize for producing an answer. DeepTrail optimizes for making the path to that answer inspectable.

A human opens a research workspace and a WebMCP-aware browser agent works against the same visible state. The agent can read open questions, add web sources with provenance, create claims, link evidence, identify research gaps, add counterarguments, update confidence with an explicit reason, compare alternatives, and record a draft or final decision. Every mutation appears immediately in the interface and is attributed to the human or agent.

DeepTrail adds critical-thinking surfaces that are difficult to express in ordinary chat: an evidence graph, deterministic Research Debt, **Attack this conclusion**, explicit **What would change my mind?** criteria, and confidence history. The goal is not more AI-generated prose; it is a durable research trail that shows what supports a conclusion, what weakens it, and what remains unknown.

The application is local-first, uses IndexedDB, requires no paid LLM/search API or backend, and exposes 11 state-aware tools through the current `document.modelContext` WebMCP API.

## Why this is a strong fit for WebMCP

DeepTrail needs the human and agent to operate on the same application state. DOM actuation or copy/pasting research through chat would lose stable entity IDs, provenance relationships, tool intent, and attribution.

WebMCP gives the browser agent explicit, structured actions for the research model. The website decides exactly what operations exist and validates every invocation. The agent contributes semantic research and judgment; DeepTrail contributes durable state, constraints, provenance, and a visible interface. This makes WebMCP the product's collaboration layer rather than an optional wrapper.

## Better user experience

Without DeepTrail, a research session is usually split across tabs, notes, and chat history. It becomes difficult to answer basic questions later: Which source supported this claim? What contradicted it? Why did confidence change? What evidence would reverse the decision?

DeepTrail keeps those answers in one shared workspace. Users can inspect, edit, challenge, back up, and restore the research without relying on hidden model reasoning.

## What humans and agents can do together now

1. The human defines the investigation and can set explicit falsification criteria.
2. The browser agent reads the active research state through WebMCP.
3. The agent searches the web and writes sources, claims, links, counterarguments, confidence changes, comparisons, and decisions into the same visible workspace.
4. The human sees the evidence graph and Research Debt change immediately.
5. Either side can identify the next unresolved question rather than forcing a premature conclusion.

The memorable workflow is **Attack this conclusion**: DeepTrail records a confidence baseline and creates a targeted adversarial-research prompt so the agent searches specifically for evidence that could falsify or materially qualify the current conclusion.

## WebMCP implementation

DeepTrail uses the imperative WebMCP API through `document.modelContext.registerTool()`. A narrowly isolated `navigator.modelContext` fallback is retained only for Chrome 149 compatibility; current Chrome uses the document-scoped API.

The toolset is state-aware:

- With no active investigation, only compact workspace-context discovery is registered.
- During an investigation, research/source/claim/evidence/gap/comparison/decision tools become available.
- Claim-specific counterargument and confidence-update tools appear only once claims exist.

All calls are revalidated at execution time with strict Zod schemas. The bridge uses least-privilege same-origin exposure, `readOnlyHint`, `untrustedContentHint`, AbortController lifecycle cleanup, compact outputs, bounded strings/arrays, HTTP(S)-only source URLs, and stable entity IDs.

## Judge instructions

**Live URL:** `[LIVE_URL]/judge`

1. Open `/judge` in ChatGPT's in-app browser or Chrome 149+ with `chrome://flags/#enable-webmcp-testing` enabled.
2. Confirm the judge launchpad reports the secure-context and production-header checks.
3. Click **Load evidence-backed judge demo**.
4. Copy the exact agent prompt from the judge page and send it to the browser agent.
5. Watch the agent inspect the workspace, research a production-verification gap, add evidence, deliberately challenge the current draft decision, and update the same visible research state.
6. Inspect the evidence graph, counterargument, confidence history, Research Debt, actor-attributed activity, and draft decision.

The seeded investigation is intentionally about DeepTrail's own zero-cost production hosting decision so the demo is authentic: it begins with a recommendation, a counterargument, and two unresolved production-verification gates rather than a pre-baked perfect answer.

## Links

- **Live app:** `[LIVE_URL]`
- **Judge mode:** `[LIVE_URL]/judge`
- **Public repository:** `https://github.com/AaryaMody1301/deeptrail-webmcp`
- **Demo video:** `[YOUTUBE_URL]`

## Judging-criteria mapping

### WebMCP Leverage

WebMCP exposes the actual research domain model as 11 single-purpose, state-aware tools. Agent actions mutate the same UI the human is using, with visible provenance and attribution.

### Execution

DeepTrail is a complete local-first product rather than a tool-registration demo: research workspace, evidence graph, critical-thinking workflows, deterministic Research Debt, backup/import, persistent-storage controls, accessibility, strict validation, and automated regression coverage.

### Potential Impact

DeepTrail targets a recurring problem for researchers, builders, operators, students, buyers, and teams making evidence-backed decisions: AI can find information quickly, but the reasoning trail is fragile. DeepTrail turns that trail into durable, inspectable work.

### Creativity & Ambition

Instead of asking an agent for a better answer, DeepTrail asks what would falsify the current answer. **Attack this conclusion**, explicit reversal criteria, confidence movement, and Research Debt turn adversarial thinking into visible product behavior.

## Final submission checklist

- [ ] Production URL is public and free to access through the end of judging.
- [ ] `/judge` reports secure context and required production headers.
- [ ] WebMCP is verified on the production origin in ChatGPT's in-app browser.
- [ ] WebMCP is verified in Chrome 149+ with the testing flag enabled.
- [ ] Seed demo loads in a clean browser profile.
- [ ] Exact judge prompt results in correct tool selection and visible UI mutations.
- [ ] Public GitHub repository contains MIT `LICENSE` and reproducible setup instructions.
- [ ] Public YouTube video is under 3:00, includes audio, and demonstrates WebMCP functioning.
- [ ] Devpost text uses the verified production and video URLs.
- [ ] Repository, live site, and Devpost submission are frozen after September 3, 2026 at 1:00 PM PT until judging ends.
