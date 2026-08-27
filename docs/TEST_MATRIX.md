# DeepTrail Phase 5 Test Matrix

This matrix is the release gate for the hackathon build. Automated tests run in GitHub Actions; browser/WebMCP checks are manual because WebMCP is experimental and primarily designed for local, human-in-the-loop browser workflows.

## Supported judge paths

1. **ChatGPT in-app browser** — WebMCP supported out of the box for challenge testing.
2. **Google Chrome 149+** — enable `chrome://flags/#enable-webmcp-testing`, relaunch Chrome, then load the deployed DeepTrail URL.
3. **Ordinary modern browser without WebMCP** — the human workspace must still load and clearly report WebMCP as unavailable.

## Automated CI gate

Every push to `main` must pass:

- `npm run test`
- `npm run typecheck`
- `npm run build`

The regression suite covers:

- workspace schema validation
- versioned backup export/import round trips
- Phase 1-style workspace migration
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
| No active investigation | Only `deeptrail_get_workspace_context` is registered |
| Investigation created, no claims | State-relevant research tools become available |
| Claim added | Claim-specific counterargument/confidence tools become available |
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
- `deeptrail_identify_research_gaps` is chosen for structural gaps rather than inventing a prose gap list;
- confidence changes use `deeptrail_update_confidence` only with an explicit evidence-based reason;
- **Attack this conclusion** seeks falsifying/qualifying evidence rather than manufacturing disagreement;
- tool results remain compact enough for reliable agent consumption.

## Submission freeze check

Before the Devpost deadline:

- verify the exact submitted live URL in ChatGPT’s in-app browser;
- verify it in Chrome 149+ with WebMCP enabled;
- run the full CI gate on the submitted `main` commit;
- export/re-import the demo investigation once;
- record the final demo video from the same deployed build;
- after the submission window closes, do not modify the submitted repo or live site during judging.
