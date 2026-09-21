# ADR-0018 — Expanded oracle state machine with claim-oriented outcomes

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0/v0.1 three-outcome oracle model (PASS/FAIL/INCONCLUSIVE)
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-9

## Context

The v0/v0.1 oracle returned one of three verdicts: PASS, FAIL, INCONCLUSIVE. ChatGPT correctly noted this was too coarse and ambiguous. It spoke sometimes from the attacker's perspective, sometimes from the defender's. It could not distinguish "the challenge was invalid to begin with" from "the framework failed" from "the observability of the target failed" from "the target's defense failed."

## Decision

Ten claim-oriented outcomes replace the three-outcome model:

- **CLAIM_SURVIVED** — claim held, defense fired, no unauthorized side effects.
- **CLAIM_FALSIFIED** — claim did not hold. Severity derived from impact + exploitability + reachable assets + compensating controls + data/privilege impact + business consequence (not fixed by falsification alone).
- **PARTIAL_OR_DEGRADED** — defense fired but with degraded performance (outside SLO, telemetry incomplete).
- **INCONCLUSIVE** — observable signals did not permit determination in either direction.
- **OBSERVABILITY_GAP** — challenge executed but the target's observability did not produce expected signals. Generates a finding against Observability dimension distinct from any challenge finding.
- **INVALID_TEST** — the challenge itself is not a meaningful test (preconditions unmet, positive control failed, target config differs from claim's applicable config). Generates a catalog finding, not a target finding.
- **EXECUTION_ERROR** — framework itself failed (tool crashed, network partition). Framework-level finding, not target.
- **BLOCKED** — prerequisite not met (tool ceiling below engagement ceiling, network scope violation, incident-state refusal). Engagement record; no target finding.
- **HALTED_SAFETY** — impact budget exceeded or safety-boundary breach detected. Framework halted; findings preserved.
- **NOT_RUN** — planned but not executed. Preserved for coverage accounting.

**Required per-challenge scaffolding** (each diagnostic challenge MUST include, or returns INVALID_TEST):
- Baseline observation
- Positive control
- Negative control
- Unique correlation ID
- Precondition assertions
- Expected primary signal
- Expected secondary signal
- Telemetry-lag policy
- Retry policy
- Late-arriving-evidence policy
- Cleanup oracle

**Observability gap is a distinct finding class.** When the framework cannot determine whether a defense fired because target monitoring did not produce expected signals, that gap is itself a finding against Observability — target operators cannot see what the framework cannot see.

**Severity derivation** — a CLAIM_FALSIFIED outcome does not automatically become a critical finding. Severity is derived from impact factors listed above. A highly-compensated control with low exploitability and no reachable-asset impact may be low severity even when falsified.

Full specification in [`methodology/ORACLE.md`](../../methodology/ORACLE.md).

## Consequences

**Positive.** Verdicts are unambiguous. Framework errors, catalog errors, target errors, and target-observability errors are distinguishable. Observability weakness becomes visible independent of defense outcomes.

**Negative.** More outcome types = more code paths to implement and test. Adopters must learn the taxonomy.

**Neutral.** AI-assisted narrative permitted for explanation; deterministic verdict remains authoritative.

## References

- [`methodology/ORACLE.md`](../../methodology/ORACLE.md).
- ChatGPT cross-LLM review of v0, P0-9.
