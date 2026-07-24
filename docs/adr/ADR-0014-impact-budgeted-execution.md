# ADR-0014 — Impact-budgeted execution replaces first-signal-stop as safety envelope

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0.1's first-signal-stop safety framing
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-4

## Context

v0.1 redefined `first-signal-stop` as severity-thresholded and severity-ordered. ChatGPT's review correctly noted this bounds the number of findings discovered after detection, but does not bound impact:

- The first challenge may itself create unbounded or delayed harm.
- Side effects can continue after the request completes.
- Telemetry can lag.
- The first observed signal may arrive after several actions.
- An INCONCLUSIVE result may represent an observability failure.
- A control-plane action may have larger blast radius than its request count suggests.

`first-signal-stop` is a useful stop condition; it is not a production-safety guarantee.

## Decision

The two-mode model is replaced with three execution policies:

- **passive** — no target-state-affecting actions. Impact class ≤ I1. May run on production.
- **impact-bounded** — active challenges permitted within a declared impact budget. `first-signal-stop` is one optional stop condition within this policy.
- **campaign-complete** — matrix runs to completion. Only permitted at impact class ≥ I2 in staging/lab; only permitted at impact class ≥ I3 in dedicated ephemeral environments.

Every active plan declares an **impact budget** enforced structurally by a runtime watchdog independent of the challenge runner. Budget fields:

```
maxRequests, maxRequestsPerSecond, maxConcurrentActions
maxStateMutations (zero for passive/I0-I1)
maxEstimatedCostUsd
maxAffectedPrincipals, maxAffectedRecords
maxDurationSeconds
maxErrorRateDelta (target error rate delta ceiling)
maxLatencyDeltaMs
```

Required safety controls in v0.2:

- Preflight validation before any active action.
- Dry-run where the tool supports it.
- Canary target or cohort before broader execution.
- Independent watchdog process.
- Continuous health gates on target metrics.
- Fail-closed behavior when telemetry disappears (do not assume "no signal" = "no impact").
- Emergency revocation channel independent of the challenge runner.
- Idempotent cleanup.
- Rollback or containment plan.
- Post-run cleanup verification.
- Cost accounting for the challenge itself.
- Automatic halt on safety-boundary breach regardless of oracle result.

**The commercial "free assessment" model changes** (per ChatGPT). Unsolicited production active-testing is not offered. Alternatives:

- Passive architecture and evidence assessment.
- Customer-run diagnostic package.
- Read-only configuration/inventory reconciliation via continuous plane.
- Staging demonstration.
- Production active challenge only under paid, separately-authorized engagement.

## Consequences

**Positive.** Safety envelope is enforced structurally, not by convention. Production runs are genuinely safer. Legal exposure from unsolicited prospect testing is eliminated.

**Negative.** Higher onboarding friction for free assessments. Some legitimate low-impact prospect testing is deferred to a signed engagement.

**Neutral.** `first-signal-stop` remains available as a stop condition within `impact-bounded` — just not as the primary safety framing.

## References

- [`methodology/OPERATING-MANUAL.md`](../../methodology/OPERATING-MANUAL.md).
- [`methodology/TEMPLATE.md`](../../methodology/TEMPLATE.md) §2 (impactBudget block).
- ChatGPT cross-LLM review of v0, P0-4.
