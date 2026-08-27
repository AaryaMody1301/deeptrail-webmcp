# DeepTrail Architecture

## Product model

DeepTrail is a local-first structured research workspace. The browser UI and WebMCP tools operate on the same research state so actions performed by either the human or agent are immediately reflected for the other.

## Domain model

### Investigation

- `id`
- `title`
- `goal`
- `createdAt`
- `updatedAt`
- `status`

### Question

- `id`
- `investigationId`
- `text`
- `status`: `open | answered`

### Source

- `id`
- `investigationId`
- `url`
- `title`
- `summary`
- `addedAt`

### Claim

- `id`
- `investigationId`
- `text`
- `confidence`
- `status`: `active | challenged | rejected`

### Evidence

- `id`
- `claimId`
- `sourceId`
- `text`
- `relationship`: `supports | contradicts | neutral`
- `confidence`

### Decision

- `id`
- `investigationId`
- `text`
- `rationale`
- `confidence`
- `createdAt`

## Layers

```text
app/
  Next.js routes and UI

components/
  Investigation and evidence UI

lib/research/
  Domain model + state operations

lib/storage/
  Browser persistence

lib/webmcp/
  WebMCP declarations, schemas and handlers
```

## WebMCP boundary

WebMCP handlers must call the same domain operations used by the human-facing UI. Do not duplicate research mutation logic inside tool handlers.

```text
Human UI -----------+
                    |
                    v
             Research actions ----> Store ----> Persistence
                    ^
                    |
WebMCP handlers ----+
```

This gives us a visible human-agent collaboration loop and keeps WebMCP behavior testable.

## MVP sequence

1. Create/edit one investigation.
2. Store open questions.
3. Register read-only workspace tools.
4. Register `add_source` and `add_claim` mutations.
5. Ensure agent mutations trigger immediate UI updates.
6. Persist state locally.
7. Add evidence linking.
8. Add contradiction/research-gap workflows.
