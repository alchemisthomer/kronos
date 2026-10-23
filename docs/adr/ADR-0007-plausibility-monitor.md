# ADR-0007 — Plausibility monitor and capacity model as first-class primitives

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The operator, Kronos scribe
- **Supersedes:** None
- **Superseded by:** None
- **Origin:** Claude cross-LLM design review of v0, finding P1-1

## Context

The founding incident of 2026-07-17 was diagnosed by a single reasoning move: "the observed $76.5 billion in EC2-Other charges is physically impossible given zero NAT gateways in the account." This move was central to the entire kronos concept — it is the reasoning that would have caught the incident within hours rather than five days.

The v0 design elevated this move to a design implication (DESIGN.md §3, implication #1) and named it "physical-plausibility oracle." But the term "oracle" was already claimed by the runtime primitive that evaluates per-attack success (§9), and the two objects are categorically different — one is a per-attack deterministic evaluator, the other is a continuous background monitor comparing observations against a physical-capacity model.

The Claude review flagged this in finding P1-1 as the highest-priority gap: the incident's most distinctive lesson was present in vision prose and absent from the actual primitive specifications. There was no schema, no artifact, no runtime, no home in TOOL-BINDING or the engagement kanban for the plausibility computation.

The reviewer's directive was to add a first-class capacity-model artifact peer to the attack/oracle/evidence/finding primitives, specify its schema and source, and rename the collision to disambiguate from the attack oracle.

## Decision

Kronos adds two new first-class runtime primitives, distinct from and peer to the existing attack/oracle/evidence/finding set:

1. **Capacity model** — the operator-authored (or observed-and-inferred) mapping from a target's declared infrastructure to the physical bounds each resource class can produce. Lives at `<target>/kronos/capacity.yaml`. First-class methodology artifact, versioned in git, referenced by findings.

2. **Plausibility monitor** — the runtime that continuously (or on schedule) evaluates observed values against the capacity model's physical bounds and emits findings when observations exceed bounds. Runs outside the engagement lifecycle; requires only an authorization artifact granting observation-source access and a capacity model.

The existing "oracle" primitive is renamed to **attack oracle** to disambiguate. The two primitives fill non-overlapping roles: the attack oracle answers "did this specific attack succeed?"; the plausibility monitor answers "is this observation within physical bounds?"

Both primitives feed the same finding schema. Both contribute to the same scorecard. The Cost Integrity scorecard dimension (Pillar C-7) is fed primarily by the plausibility monitor; the plausibility monitor may also contribute to Observability (Pillar B-6) and Data Integrity (Pillar B-4) dimensions.

Full specification is in [`../../methodology/PLAUSIBILITY-MONITOR.md`](../../methodology/PLAUSIBILITY-MONITOR.md).

## Consequences

### Positive

- The founding incident's central diagnostic move is now a mechanism, not rhetoric. A reader following the design from vision to spec finds the primitive that would have caught the incident.
- The scorecard's Cost Integrity dimension has a concrete data source. Prior to this ADR, the dimension was aspirational; now it is a specific runtime output.
- The distinction between attack oracle and plausibility monitor sharpens the framework's runtime vocabulary. Tool authors know which primitive their tool implements; oracle authors know which shape they are authoring.
- The plausibility monitor operates outside the engagement lifecycle, which means a target can benefit from continuous plausibility monitoring without ever running an active engagement. This lowers the barrier to first value.

### Negative

- Two new primitives increase the surface area of the methodology. Adopters have more to learn before they can operate the framework fully.
- The capacity model is opinionated — it requires the operator to declare their infrastructure and its bounds. For adopters without a clear declared-infrastructure model, this is real authoring cost. The observed-inference variant of the capacity model mitigates but does not eliminate this.
- The reference bounds library (per-resource physical limits for AWS/Azure/GCP) must be kept current. Vendor limits change; stale bounds produce false-positive findings (bound too low) or false-negative findings (bound too high).
- The rename from "oracle" to "attack oracle" is a breaking change to the SEVEN-CLAIMS document and the DESIGN.md primitives section. Downstream references must be updated.

### Neutral

- The plausibility monitor is not itself a novel property (physical-plausibility monitoring exists in various forms in observability tooling). What is potentially novel is its coupling to a versioned capacity model that a third-party observer can independently verify — this is a candidate for a distinct patent claim if the patent strategy question resolves in that direction.

## References

- [`../../methodology/PLAUSIBILITY-MONITOR.md`](../../methodology/PLAUSIBILITY-MONITOR.md) — the primitive's specification in full.
- [`../inception/00-founding-incident.md`](../inception/00-founding-incident.md) — the incident whose diagnostic move motivated this primitive.
- Claude cross-LLM review of v0, P1-1 — the review finding that surfaced the gap between vision and spec.
- ADR-0003 — scorecard as north star. The plausibility monitor is one of the primary data sources feeding the scorecard's Cost Integrity dimension.
