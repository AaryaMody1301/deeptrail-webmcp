# DeepTrail Hackathon Roadmap

DeepTrail is being built for the OpenAI WebMCP Challenge as a local-first workspace where a human and an AI agent investigate the web together.

Official submission deadline: **September 3, 2026 at 1:00 PM PDT (September 4 at 1:30 AM IST).**

## Phase 1 — Foundation + WebMCP vertical slice — Aug 27

**Goal:** prove the core loop end to end before adding breadth.

- [x] Next.js + TypeScript application scaffold
- [x] Local-first IndexedDB persistence
- [x] Investigation, question, source, claim, and evidence-link domain model
- [x] Human can create/reset an investigation
- [x] WebMCP capability detection and lifecycle management
- [x] Register the first five WebMCP tools
- [x] Agent mutations immediately appear in the UI
- [x] MIT license and CI workflow

**Exit test:** create an investigation, ask a WebMCP-aware agent to read it, add one source and one claim, link them, and see the UI update without a page reload.

## Phase 2 — Research workspace UX — Aug 28

**Goal:** make DeepTrail useful even before advanced reasoning features.

- Multiple open questions and question status
- Human editing of claims, sources, and notes
- Source metadata, timestamps, deduplication, and filtering
- Research activity trail
- Strong empty/loading/error states
- Keyboard-friendly responsive UI

**Exit test:** a human can run a small research session and understand everything captured without reading raw JSON.

## Phase 3 — Agent collaboration toolset — Aug 29

**Goal:** make WebMCP the product engine rather than a wrapper.

- `deeptrail_add_counterargument`
- `deeptrail_identify_research_gaps`
- `deeptrail_update_confidence`
- `deeptrail_add_open_question`
- `deeptrail_compare_options`
- `deeptrail_record_decision`
- Tight schemas, annotations, validation, and useful tool results

**Exit test:** the agent can inspect current state, identify what is missing, challenge existing work, and update the same workspace the human sees.

## Phase 4 — Evidence graph + critical-thinking modes — Aug 30

**Goal:** create the memorable differentiator.

- Interactive claim/source/evidence graph
- Supports / contradicts / qualifies relationships
- **Attack this conclusion** workflow
- **What would change my mind?** criteria
- Research Debt score for unresolved gaps and weakly supported claims
- Confidence history with reasons

**Exit test:** a judge can watch a conclusion change after contradictory evidence is intentionally searched for and added.

## Phase 5 — Reliability, security, export + test matrix — Aug 31–Sep 1

**Goal:** make the demo trustworthy and resilient.

- Treat web-derived content as untrusted input
- Defensive URL/schema validation and safe rendering
- Tool cancellation/lifecycle tests
- Persistence recovery and backup/export to JSON
- Import a saved investigation
- Browser/WebMCP compatibility checks
- Accessibility and mobile pass
- Automated unit/integration coverage for the research store and tools

**Exit test:** the core demo survives refreshes, malformed tool inputs, duplicate sources, unsupported browsers, and repeated agent calls.

## Phase 6 — Deployment, judge experience + submission — Sep 2–3

**Goal:** optimize for a judge seeing the value in under three minutes.

- Deploy a public live URL
- Provide one-click demo investigation and exact judge testing prompt
- Record a <3 minute demo with audio
- Final README architecture/tool documentation
- Devpost submission copy and screenshots
- Run clean-browser end-to-end rehearsal
- Freeze submitted repo and live site before the official deadline

**Exit test:** a new reviewer can open the URL, understand the problem, execute the WebMCP interaction, and see DeepTrail's differentiator without setup help.

## Scope rule

Anything that does not improve the three-minute judge experience, WebMCP leverage, reliability, or the evidence-backed decision loop is postponed until after submission.
