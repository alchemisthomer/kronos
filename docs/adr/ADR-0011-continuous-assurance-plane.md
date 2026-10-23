# ADR-0011 — Continuous assurance plane as first-class runtime peer to engagement plane

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-1

## Context

The v0 design defined a single execution plane: open an engagement, run an attack matrix, evaluate evidence, close the engagement. This is episodic. The founding incident of 2026-07-17 was not detectable by any adversarial attack because there was no adversary — the incident was a contradiction between provider-reported billing and observed infrastructure. It would have been detected by a continuous reconciliation running on a scheduled cadence.

The v0.1 plausibility monitor addressed one class of continuous evaluation but did not formalize a full continuous plane. ChatGPT's cross-LLM review flagged this as the single most important architectural correction.

## Decision

Kronos v0.2 has two peer runtime planes:

1. **Engagement plane** — explicitly authorized on-demand interventions (diagnostic probes, adversarial simulations, fault injections, load tests, tabletop exercises). This is what v0/v0.1 called "the runtime."
2. **Continuous assurance plane** — passive and low-impact evaluations on scheduled or event-triggered cadence (cost/inventory reconciliation, resource-count-vs-quota, usage-vs-physical-throughput, billing reconciliation, enumeration completeness, control drift, catalog-delta impact, evidence freshness, alert-channel and kill-switch health). May be branded as Kronos Sentinel or Kronos Reconciler.

Both planes share the same domain-model primitives (claim, challenge, plan, run, observation, oracle result, finding, score snapshot). Both feed the same scorecard. Each has its own authorization envelope; either can be adopted without the other.

The word "attack" is narrowed. **"Challenge"** becomes the parent abstraction with seven subtypes: `passive-observation`, `invariant-evaluation`, `cross-source-reconciliation`, `diagnostic-probe`, `fault-injection`, `adversarial-simulation`, `tabletop`. Attacks are the `adversarial-simulation` and `fault-injection` subtypes; continuous evaluations are the first three subtypes.

Full specification in [`methodology/CONTINUOUS-ASSURANCE.md`](../../methodology/CONTINUOUS-ASSURANCE.md).

## Consequences

**Positive.** The founding incident's class of failure is now first-class. The framework becomes a claim-centric assurance control plane rather than a red-team framework. Lower barrier to first value (continuous-plane-only adoption requires no engagement authoring). Aligns with breach-and-attack-simulation prior art while distinguishing kronos on the claim-oriented scorecard and dialectic with attestation.

**Negative.** Two planes = more surface area for adopters. Two authorization envelopes to manage. Continuous plane requires observation-source access (Cost Explorer, metric streams, config inventory) that some adopters may not want to grant.

**Neutral.** The v0.1 plausibility monitor becomes one component of the continuous plane rather than a standalone primitive.

## References

- [`methodology/CONTINUOUS-ASSURANCE.md`](../../methodology/CONTINUOUS-ASSURANCE.md) — full specification.
- [`methodology/PLAUSIBILITY-MONITOR.md`](../../methodology/PLAUSIBILITY-MONITOR.md) — one component of the plane.
- ChatGPT cross-LLM review of v0, P0-1.
