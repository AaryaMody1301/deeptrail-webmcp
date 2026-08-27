# DeepTrail Hackathon Roadmap

The roadmap is optimized for the WebMCP Challenge: prove the human-agent loop early, then add differentiated reasoning features, polish, testing, deployment, and submission assets.

## Phase 1 — Foundation and research workspace

**Goal:** Build a stable local-first web application and shared research domain model.

Deliverables:

- Next.js + TypeScript application
- Core DeepTrail visual shell
- Investigation model
- Open questions, claims, sources, and evidence models
- Shared research store used by both UI and future WebMCP handlers
- Browser-local persistence
- Seed/demo investigation
- Basic validation and empty states
- Typecheck, lint, and production build

Exit criteria:

A user can create an investigation, add questions/claims/sources, refresh the page, and continue from persisted state.

## Phase 2 — WebMCP vertical slice

**Goal:** Make the workspace genuinely agent-native.

Implement and test:

- `deeptrail_get_workspace_context`
- `deeptrail_get_open_questions`
- `deeptrail_add_source`
- `deeptrail_add_claim`
- `deeptrail_link_evidence`
- WebMCP lifecycle cleanup with AbortController
- Tool annotations and explicit JSON Schemas
- Visible agent-originated mutations in the UI

Exit criteria:

An agent can inspect an investigation, research externally, add a source and claim, link evidence, and the user sees those changes immediately.

## Phase 3 — Research graph and evidence UX

**Goal:** Turn structured state into a memorable research interface.

Deliverables:

- Interactive research/evidence graph
- Claim ↔ evidence ↔ source relationships
- Supporting vs contradicting evidence
- Confidence indicators
- Source provenance
- Research activity/history

Exit criteria:

A judge can visually understand how a conclusion was formed and trace it back to evidence.

## Phase 4 — Deep reasoning differentiators

**Goal:** Make DeepTrail substantially more useful than a generic research board.

Deliverables:

- Research Debt
- Missing evidence detection
- Unsupported assumption tracking
- Contradiction detection
- Devil's Advocate mode
- Confidence updates with rationale
- Option comparison
- Decision recording
- Additional WebMCP tools for these actions

Exit criteria:

The agent can challenge the user's current reasoning instead of merely adding information.

## Phase 5 — Human-agent collaboration polish

**Goal:** Make agent activity transparent and controllable.

Deliverables:

- Agent activity indicators
- Clear human vs agent provenance
- Undo/reject where useful
- Tool execution feedback
- Safe mutation patterns
- Strong empty/loading/error states
- Keyboard/responsive UX polish

Exit criteria:

Agent actions never feel mysterious; the user can understand what changed and why.

## Phase 6 — Testing, compatibility, and deployment

**Goal:** Produce a reliable public demo.

Deliverables:

- Domain/store tests
- WebMCP tool contract tests
- Manual agent journey checklist
- Chrome WebMCP local/origin-trial validation
- ChatGPT in-app browser validation
- Production deployment
- GitHub Actions for lint/typecheck/build

Exit criteria:

The canonical demo journey works repeatedly on the live URL.

## Phase 7 — Submission and leaderboard optimization

**Goal:** Make the value obvious within the first minute of judging.

Deliverables:

- High-quality README
- Architecture diagram
- Tool catalog
- Screenshots/GIFs
- Seeded high-impact demo investigation
- <=3 minute demo video
- Devpost description
- Clear explanation of why WebMCP is essential
- Final regression pass

Primary demo story:

1. Human opens a real decision/research problem.
2. Agent reads structured DeepTrail state.
3. Agent discovers missing evidence.
4. Agent researches the web.
5. Agent writes evidence into DeepTrail through WebMCP.
6. Research graph updates live.
7. Agent challenges an assumption.
8. Confidence/decision changes visibly.

## Scope rule

Never sacrifice a working Phase 2 vertical slice for a Phase 4+ feature. The core submission is the visible human ↔ WebMCP ↔ agent collaboration loop.