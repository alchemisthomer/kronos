# O-ATTACKER-CADENCE

**Version:** 0.1
**Evaluates:** [K-C6-ATTACKER-CADENCE-RESILIENCE](../claims/K-C6-ATTACKER-CADENCE-RESILIENCE.md)
**Operator profiles required:** cadence-simulator, simulated-privilege-compromise, containment-observer
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary. All three must pass for L2. The oracle requires the target to name its assumed attacker class and `T_attacker` before engagement.

## Subtest (a) — `T_detect ≤ T_attacker`

**Operator profile:** cadence-simulator — simulates attacker-cadence traffic patterns at the ingress / identity layer

**Procedure:**

1. **Attacker-class declaration.** Target states the attacker class and `T_attacker` the posture claims to resist. Example: *"ARTEX-class password-spray, `T_attacker` = 3 hours initial-to-privileged."*
2. **Pattern replay.** Operator replays cadence patterns characteristic of the stated attacker class — sign-in attempts per minute, multi-vector enumeration, 24/7 pattern. Patterns are drawn from publicly-documented campaigns and from Kronos-held signatures.
3. **Detection measurement.** Operator records wall-clock time between first pattern start and first detection signal reaching the target's detection system. This is `T_detect` under simulation.
4. **Pass criterion.** `T_detect` measured ≤ target's stated `T_attacker` for the class.

**Pass:** detection fires within the stated attacker-cadence budget.

## Subtest (b) — Automated containment on anomaly

**Operator profile:** containment-observer — monitors target's response infrastructure

**Procedure:**

1. **Containment-path enumeration.** Target names each pre-authorized containment path: kill switch, break-glass credential invalidation, tenant-level deny, specific-user suspension, specific-application permission revocation.
2. **Trigger simulation.** For each named path, operator simulates the detection event that should trigger it (either organically via subtest (a) replay, or synthetically via injected signal).
3. **Containment-latency measurement.** Operator records wall-clock time between detection signal and containment-action execution. Containment must execute without human intervention; human notification is permitted and expected.
4. **Pass criterion.** Containment latency < stated bound (target-stated, typically single-digit minutes); human-in-the-loop requirement does not block execution.

**Pass:** every named containment path executes within stated latency bound, with no human-approval gate.

## Subtest (c) — Blast-radius architecture

**Operator profile:** simulated-privilege-compromise — assumes successful compromise of specific entry points; probes reachable damage

**Procedure:**

1. **Entry-point enumeration.** Target names every entry point whose compromise could lead to privileged access. For a SaaS: Site Guest JWT, admin OAuth, service-principal token, specific API-key classes.
2. **Grant-with-containment deployment.** With target cooperation and time-boxed written grant, operator receives credentials for each named entry point AS IF they had been compromised.
3. **Reachable-damage mapping.** For each entry point, operator attempts (within the grant's bounds and with containment-observer monitoring) to escalate laterally, access other tenants' data, modify cross-cutting state, or persist beyond the engagement window.
4. **Pass criterion.** Each entry point's reachable damage is bounded by stated architectural claim (e.g., "a compromised Pantheon container confers god-container privileges only, not fleet-wide"). Attempts to exceed the stated bound fail or trigger containment.

**Pass:** reachable damage from each entry point matches or is less than the target's declared architectural bound.

## Scorecard delta

- All three pass → L2 for this target under oracle v0.1
- Any subtest fails → L0 under oracle v0.1
- Subtest (c) refused by target (no grant) → capped at L1 under oracle v0.1
- L3 requires continuous `T_detect` publication plus containment-latency SLA plus annual re-engagement

## Known limitations of v0.1

- `T_attacker` is a moving target; the ARTEX-class value as of 2026-10-21 will be below the next framework class's value by publication. Engagements record the specific attacker class and `T_attacker` assumed; L2 is time-stamped against that assumption.
- The oracle does not test cadence-sensitive supply-chain compromise scenarios (K-C8 adjacency).
- The oracle cannot measure attacker-side `T_attacker` directly; measurements rely on publicly-attributed campaign data.
