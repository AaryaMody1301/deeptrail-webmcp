# DeepTrail Release Test Matrix

This matrix is the release gate for the hackathon build. The automated suite currently contains **42 tests across 8 files** and runs in GitHub Actions; browser/WebMCP checks are manual because WebMCP is experimental and designed for human-in-the-loop browser workflows.

## Supported judge paths

1. **ChatGPT in-app browser** — WebMCP supported out of the box for challenge testing; load `https://deeptrail-webmcp.netlify.app/judge`.
2. **Google Chrome 149+** — enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, then load `https://deeptrail-webmcp.netlify.app/judge`.
3. **Ordinary modern browser without WebMCP** — the human workspace must still load and clearly report WebMCP as unavailable.

The verified production host is Netlify. The headed Chrome production check observed `document.modelContext`, 1/9/11 state-aware tools, successful agent mutations, and the seeded judge workflow; both live routes returned `200 OK` with the required response headers.

The bridge prefers current `document.modelContext`. Its `navigator.modelContext` branch is a narrowly isolated Chrome 149 compatibility fallback and is not the modern API path.

## Automated CI gate

Every push to `main` must pass:

- `npm run test`
- `npm run typecheck`
- `npm run build`

The regression suite covers:

- workspace schema validation
- versioned backup export/import round trips
- Phase 1-style workspace migration
- primary-question identity and denormalized-text synchronization
- confidence-history and actor-attribution invariants
- awaited WebMCP registration and abort lifecycle
- rejection of non-http/https source URLs
- backup size limits
- oversized stored text rejection
- prompt-injection indicator surfacing
- deterministic Research Debt changes
- deterministic research-gap detection
- execution-time WebMCP input validation

## Manual clean-browser matrix

| Scenario | Expected result |
| --- | --- |
| Fresh visit | No investigation; DeepTrail renders without stored state errors |
| No active investigation | Exactly 1 tool, `deeptrail_get_context`, is registered |
| Investigation created, no claims | Exactly 9 state-relevant research tools are registered |
| Claim added | Exactly 11 tools, including claim-specific counterargument/confidence tools, are registered |
| Agent adds source | Source appears immediately; URL must be http/https |
| Duplicate tracked URL | Existing normalized source is reused rather than duplicated |
| Agent adds claim | Claim appears immediately with stance/confidence |
| Agent links unknown source/claim ID | Action fails descriptively; workspace remains intact |
| Agent sends confidence outside 0–1 | Execution-time validation rejects the call |
| Agent sends unexpected fields | Strict tool validation rejects the call |
| Agent sends oversized text | Execution-time validation rejects the call |
| Source contains instruction-like hostile text | Content remains visible as evidence, is marked untrusted for agent use, and the human warning panel surfaces an advisory indicator |
| Refresh page | IndexedDB workspace returns intact |
| Request persistent storage | UI reports browser-granted persistent or best-effort status without failing |
| Export backup | Versioned `.json` backup downloads after schema validation |
| Re-import exported backup | Validation succeeds before replacement; restored workspace reloads intact |
| Import malformed JSON | Import is rejected; current workspace is unchanged |
| Import structurally invalid JSON | Import is rejected with a field-level validation message |
| Import backup >2 MB | Import is rejected before JSON parsing |
| Evidence graph keyboard use | Nodes/edges are focusable; controls work; focus movement remains visible |
| Narrow viewport | Research, graph, reasoning, and reliability panels remain usable |
| Browser without WebMCP | Human workflow remains usable; capability status says WebMCP unavailable |

## Agent behavior checks

Use the Model Context Tool Inspector or a WebMCP-aware agent to verify:

- tool descriptions are distinguishable and single-purpose;
- the agent reads context before mutating the workspace;
- externally sourced content is not treated as trusted instructions;
- `deeptrail_find_research_gaps` is chosen for structural gaps rather than inventing a prose gap list;
- confidence changes use `deeptrail_update_confidence` only with an explicit evidence-based reason;
- **Attack this conclusion** seeks falsifying/qualifying evidence rather than manufacturing disagreement;
- tool results remain compact enough for reliable agent consumption.

## Submission freeze check

Before the Devpost deadline:

- verify `https://deeptrail-webmcp.netlify.app` and `/judge` in ChatGPT’s in-app browser;
- [x] verify `https://deeptrail-webmcp.netlify.app/judge` in Chrome 149+ with WebMCP enabled;
- run the full CI gate on the submitted `main` commit;
- export/re-import the demo investigation once;
- record the final demo video from the same deployed build;
- after the submission window closes, do not modify the submitted repo or live site during judging.
