# DeepTrail WebMCP Contract

## Design rules

1. Tool names describe concrete actions.
2. Descriptions explain when the agent should use the tool.
3. Inputs are explicit JSON Schema objects.
4. Mutations return identifiers plus a concise result summary.
5. Tools never silently invent evidence or sources.
6. Research state remains understandable and editable by the human.
7. Tool registrations must be cleanly removable when the active investigation changes.

## MVP tools

### `deeptrail_get_workspace_context`

Use when the agent needs to understand the current investigation before researching or modifying it.

Input: none.

Returns the investigation goal, open questions, claims, source summaries, and current decision if one exists.

### `deeptrail_get_open_questions`

Use when deciding what to research next.

Input: none.

Returns unresolved questions for the active investigation.

### `deeptrail_add_source`

Use after finding a relevant web source.

Input:

- `url` string, required
- `title` string, required
- `summary` string, required

Returns the new source ID.

### `deeptrail_add_claim`

Use when research supports recording a discrete proposition that can later receive evidence or counter-evidence.

Input:

- `text` string, required
- `confidence` number from 0 to 1, required

Returns the new claim ID.

### `deeptrail_link_evidence`

Use to connect a source-backed piece of evidence to an existing claim.

Input:

- `claimId` string, required
- `sourceId` string, required
- `text` string, required
- `relationship` enum: `supports | contradicts | neutral`
- `confidence` number from 0 to 1

Returns the new evidence ID and updated claim evidence counts.

## Next tools

- `deeptrail_add_counterargument`
- `deeptrail_identify_research_gaps`
- `deeptrail_update_confidence`
- `deeptrail_compare_options`
- `deeptrail_record_decision`

## Agent journey we optimize first

```text
get_workspace_context
        |
        v
get_open_questions
        |
        v
search/research on the web
        |
        +----> add_source
        |
        +----> add_claim
        |
        `----> link_evidence
                    |
                    v
              UI updates
```

This journey is the core demo and must work before secondary features are added.
