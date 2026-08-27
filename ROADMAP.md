# DeepTrail Hackathon Roadmap

DeepTrail is being built for the OpenAI WebMCP Challenge as a local-first workspace where a human and an AI agent investigate the web together.

Official submission deadline: **September 3, 2026 at 1:00 PM PDT (September 4 at 1:30 AM IST).**

## Phase 1 — Foundation + WebMCP vertical slice — Aug 27 ✅

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

## Phase 2 — Research workspace UX — Aug 28 ✅

**Goal:** make DeepTrail useful and understandable as a human research workspace while preserving the shared human-agent state.

- [x] Multiple research questions with open/answered status
- [x] Human editing of questions, claims, source metadata, and research notes
- [x] Source publication/access metadata and visible provenance
- [x] Canonical URL cleanup and source deduplication
- [x] Search/filter controls for claims and sources
- [x] Actor-aware research activity trail (human vs agent)
- [x] Accessible live status announcements for dynamic mutations
- [x] Strong empty/loading/error states and keyboard-visible focus
- [x] Responsive layouts for narrow screens
- [x] State-aware WebMCP registration so mutation tools only exist during an active investigation
- [x] Backward-compatible migration of Phase 1 IndexedDB workspaces

**Exit test:** a human can run a small research session, edit the captured material, track provenance and activity, and understand everything without reading raw JSON. A WebMCP agent's mutations remain visibly attributable in the same workspace.

## Phase 3 — Agent collaboration toolset — Aug 29 ✅

**Goal:** make WebMCP the product engine rather than a wrapper and turn agent reasoning into inspectable workspace state.

- [x] `deeptrail_add_open_question`
- [x] `deeptrail_identify_research_gaps`
- [x] `deeptrail_add_counterargument`
- [x] `deeptrail_update_confidence`
- [x] `deeptrail_compare_options`
- [x] `deeptrail_record_decision`
- [x] Deterministic gap engine for unresolved questions, unsupported claims, missing counterevidence, and thin provenance
- [x] Durable counterarguments with optional claim/source links
- [x] Confidence history with mandatory rationale
- [x] Structured option comparisons with criteria, pros, cons, scores, recommendation, and rationale
- [x] Draft/final decision record kept separate from research evidence
- [x] Reasoning dashboard that exposes all agent artifacts in the human UI
- [x] State-aware registration: claim-specific tools only appear once claims exist
- [x] Backward-compatible migration of Phase 1/2 IndexedDB workspaces

**Exit test:** the agent can inspect current state, identify missing research, deliberately challenge a claim, change confidence with an explicit reason, compare alternatives, and record a draft/final decision while every action remains visible and reversible in the shared workspace.

## Phase 4 — Evidence graph + critical-thinking modes — Aug 30 ✅

**Goal:** create the memorable differentiator and turn adversarial research into a visible interaction.

- [x] Interactive source / claim / counterargument evidence graph
- [x] Graph edges reflect real supports / contradicts / qualifies / challenges relationships
- [x] Keyboard-focusable graph nodes and edges with minimap, controls, and automatic focus panning
- [x] **Attack this conclusion** workflow with a stored confidence baseline
- [x] Attack prompt targets falsifying / qualifying evidence instead of generic disagreement
- [x] **What would change my mind?** criteria stored in shared research context
- [x] Deterministic Research Debt score with transparent component breakdown
- [x] Before/after confidence movement visible during an attack session
- [x] No additional paid APIs or model calls; Phase 4 coordinates the existing WebMCP reasoning tools
- [x] React Flow dependency pinned for reproducibility

**Exit test:** a judge can see the evidence relationships, define a falsification criterion, start an attack against the strongest conclusion, ask the agent to search deliberately for contrary evidence, and watch confidence/Research Debt change as the shared workspace is updated.

## Phase 5 — Reliability, security, export + test matrix — Aug 31–Sep 1 ✅

**Goal:** make the demo recoverable, constrained, reproducible, and resilient to malformed or adversarial inputs.

- [x] Strict versioned workspace schema with text, array, enum, timestamp, and URL bounds
- [x] Backward-compatible migration for Phase 1–4 IndexedDB workspaces
- [x] Referential-integrity validation for evidence, claims, sources, gaps, counterarguments, and confidence history
- [x] Versioned JSON backup export and validate-before-overwrite import
- [x] 2 MB backup import limit and malformed/corrupt backup rejection
- [x] Browser persistent-storage status and explicit `navigator.storage.persist()` request
- [x] Web-derived content remains untrusted; advisory instruction-like-content indicators are surfaced for human review
- [x] `readOnlyHint` / `untrustedContentHint` retained on WebMCP tools and no cross-origin `exposedTo` opt-in
- [x] Execution-time Zod validation for all 11 WebMCP tools instead of relying only on advertised JSON Schema
- [x] Strict rejection of unexpected properties, unsafe URLs, oversized inputs, malformed comparisons, and invalid confidence ranges
- [x] Compact WebMCP context/results kept around Chrome's recommended tool-output budget
- [x] AbortController registration lifecycle preserved; current local mutations are synchronous and require no long-running execution cancellation path
- [x] Response hardening: origin isolation, same-origin tools policy, disabled camera/microphone/geolocation, `nosniff`, strict-origin referrer policy
- [x] Automated regression tests for schema/backup migration, Research Debt, gap detection, WebMCP inputs, and workspace referential integrity
- [x] Clean-browser / WebMCP / hostile-content / backup / responsive manual matrix in `docs/TEST_MATRIX.md`
- [x] Direct dependencies pinned, `package-lock.json` committed, Vitest native ESM config, GitHub Actions v7, read-only CI permissions, and deterministic `npm ci`
- [x] Next 16 TypeScript configuration committed so production builds no longer rewrite it only inside CI

**Exit test:** the core demo survives refreshes, malformed tool inputs, structurally invalid backups, duplicate/broken references, hostile instruction-like source text, unsupported WebMCP browsers, and repeated runs; the same locked dependency graph passes tests, TypeScript, and a production build.

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
