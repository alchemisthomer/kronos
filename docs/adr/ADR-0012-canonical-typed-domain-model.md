# ADR-0012 — Canonical typed domain model with separated objects

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-5

## Context

The v0 design used a single markdown file per engagement as the canonical representation of the entire engagement lifecycle. ChatGPT's review flagged this as a shortcut that conflates: authorization (signed once, immutable), scope (declared once), mutable execution state, immutable runs, oracle outcomes, findings (which outlive runs), score changes, and closeout. Signing a markdown file containing both immutable authorization and mutable execution content creates ambiguity about what the approver signed.

## Decision

Ten domain objects are separated, each with its own file, its own versioned schema, and its own signature envelope where signing is required:

- **Claim** — a testable proposition about the target.
- **ChallengeSpec** — a versioned specification of a challenge (from the catalog).
- **AuthorizedPlan** — a challenge spec materialized against a specific target under a specific authorization.
- **Engagement** — the durable authorization envelope for related plans.
- **Run** — an immutable record of one plan's execution.
- **Observation** — a raw signal captured during a run.
- **OracleResult** — deterministic evaluation of a run's observations against expected criteria.
- **Finding** — a durable assertion of a defense failure or plausibility violation, with its own lifecycle outliving runs.
- **EvidenceManifest** — SLSA-aligned signed manifest binding artifacts to their production.
- **ScoreSnapshot** — a point-in-time projection of the target's scorecard.

Plus **RemediationVerification** as an eleventh minor object recording the re-verification of a previously-falsified claim.

Markdown remains the human projection. Typed schemas (JSON Schema or equivalent) are the source of truth. When markdown and typed schemas disagree, the typed schemas win. Migration tooling converts v0 markdown-only engagements to v0.2 typed schemas automatically.

Nine explicit terminal states replace v0's implicit binary shipped/aborted:

`completed-no-falsification`, `completed-with-findings`, `completed-partial`, `halted-safety`, `blocked-prerequisite`, `expired-authorization`, `cancelled`, `inconclusive-review-required`, `execution-failed`.

Full specification in [`methodology/DOMAIN-MODEL.md`](../../methodology/DOMAIN-MODEL.md).

## Consequences

**Positive.** No signature ambiguity — authorization is signed once and remains valid across engagement content edits. Findings outlive runs (correct — a finding can persist across many engagements). Runs are immutable (correct — execution history is a fact). Coverage accounting is computed from typed data rather than markdown parsing. Terminal states are unambiguous. Schemas support OSCAL import/export.

**Negative.** More files per engagement. Adopters see richer directory structure. Migration effort for v0 targets.

**Neutral.** The kanban folder pattern (`00_scope/` through `07_aborted/`) is preserved as a workflow view but is no longer the state machine — terminal state lives in the typed engagement object's field.

## References

- [`methodology/DOMAIN-MODEL.md`](../../methodology/DOMAIN-MODEL.md).
- ChatGPT cross-LLM review of v0, P0-5.
