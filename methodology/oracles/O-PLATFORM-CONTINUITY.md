# O-PLATFORM-CONTINUITY

**Version:** 0.1
**Evaluates:** [K-C2-PLATFORM-CONTINUITY](../claims/K-C2-PLATFORM-CONTINUITY.md)
**Operator profiles required:** external-tenant, internal-ro-infra, internal-rw-plane (for the destruction attestation step only)
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per clause of the K-C2 statement. Unlike O-ENVELOPE-INTEGRITY, this oracle has a stronger documentary component: much of the evidence is paperwork that must already exist, and the operator's job is to verify it exists and matches the target's actual behavior under rehearsal.

## Subtest (a) — Desktop exercise against a shutdown scenario

**Operator profile:** external-tenant (gathering public documents) + target-stakeholder-interview (not an operator profile — this is a joint session)

**Procedure:**

1. **Collect pre-published criteria.** The operator collects the target's publicly-available (or engagement-provided) documents stating the criteria under which the target would decide to shut down a service. Expected documents: terms of service, business continuity plan, incident response plan, acceptable-use policy. Pass criterion: at least one document names a shutdown decision-maker (by role, not necessarily by individual) and states at least one criterion that would trigger a shutdown decision.
2. **Scenario walkthrough.** The operator and target jointly walk through a shutdown-triggering scenario. Suggested scenarios: envelope collapse (link to K-C1 failure), insolvency, acquisition requiring platform wind-down, regulatory shutdown order. For each: the target identifies which pre-published criterion applies, which decision-maker is accountable, what the decision window is.
3. **Window-boundedness check.** For each scenario, the operator verifies that the decision window is bounded (e.g., "decision within 48 hours of trigger") rather than open-ended. Pass criterion: at least one scenario has a documented, bounded decision window.

**Evidence produced:**

- `evidence/shutdown-decision/criteria-source-docs/` — the pre-published documents, as fetched
- `evidence/shutdown-decision/scenario-walkthrough.md` — scenarios, applicable criteria, decision-maker, window
- `evidence/shutdown-decision/summary.md` — pass/fail per scenario

**Pass:** at least one scenario has a pre-published criterion, named decision-maker, and bounded decision window. Target cannot pass this subtest with "we would decide at the time."

## Subtest (b) — Migration-off rehearsal

**Operator profile:** external-tenant

**Procedure:**

1. **Representative-tenant selection.** The target selects a representative existing tenant (with that tenant's consent) OR provisions a representative test tenant that mimics real customer workload shape (data volume order of magnitude, number of integrations, number of users).
2. **Migration-off kickoff.** The operator (acting from the tenant position) starts the stated migration-off procedure. Clock starts here.
3. **Measure completion.** The operator measures wall-clock time from kickoff to the point at which the tenant's workload is fully operational on a destination of the tenant's choice (another platform, self-hosted, archive form). Record `T_actual`.
4. **Compare to stated `T_migrate`.** The target's `T_migrate` (from its documentation) must be ≥ `T_actual`. If actual exceeds stated, the subtest fails and the target's docs must be updated to reflect reality before re-running.
5. **Completeness verification.** The operator spot-checks that the migrated workload runs the same code, holds the same data (within a stated reconciliation tolerance), and preserves the same integrations.

**Evidence produced:**

- `evidence/migration/representative-tenant-profile.md` — what tenant, what workload
- `evidence/migration/stated-T-migrate.md` — the target's documented budget
- `evidence/migration/kickoff-log.md` + `evidence/migration/completion-log.md` — timestamps
- `evidence/migration/completeness-report.md` — code + data + integrations verified
- `evidence/migration/summary.md` — pass/fail, `T_actual` vs `T_migrate`

**Pass:** `T_actual ≤ T_migrate`; completeness verified against the stated tolerance.

## Subtest (c) — Return-or-destroy attestation

**Operator profile:** internal-ro-infra + (for destruction verification) internal-rw-plane (time-boxed)

**Procedure:**

1. **Pick a return or destroy path.** The target chooses which path to demonstrate: return (data to tenant) or destroy (data irretrievable). Both can be demonstrated; at minimum, one must be.
2. **For return path.**
   - The operator (as internal-ro-infra) observes the target preparing a data return package for the representative tenant from subtest (b).
   - The package must include a stated completeness criterion (e.g., "all rows from Table X between dates Y and Z, with checksum C").
   - The operator verifies the completeness criterion by independently querying the target's primary data store (as internal-ro-infra) and comparing.
   - Pass criterion: returned package meets its stated criterion, verified by the operator against the authoritative data store.
3. **For destroy path.**
   - The operator (as internal-ro-infra) observes the pre-destroy state of the target data.
   - The target executes its destruction procedure (crypto-shred, secure wipe, key destruction, etc.). The operator may need internal-rw-plane access to observe the destruction itself depending on the target's architecture; this is time-boxed and requires explicit grant.
   - After destruction, the operator (as internal-ro-infra) attempts to recover the data by every means the operator can construct given the target's architecture.
   - Pass criterion: operator cannot recover the data; destruction procedure produces an attestation document (what was destroyed, by what procedure, by whom, when) that an independent auditor could later verify.

**Evidence produced:**

- `evidence/return-or-destroy/path-selected.md` — return, destroy, or both
- `evidence/return-or-destroy/return-package-manifest.md` + `evidence/return-or-destroy/return-package-verification.md` — if return path
- `evidence/return-or-destroy/destruction-procedure.md` + `evidence/return-or-destroy/recovery-attempt.md` + `evidence/return-or-destroy/attestation.md` — if destroy path
- `evidence/return-or-destroy/summary.md` — pass/fail

**Pass:** chosen path produces evidence meeting its criterion; destruction attestation is independently auditable.

## Running order

Subtest (a) first — if the target has no pre-published shutdown criteria, the engagement should surface that gap and the target can score at most L0 regardless of what subtests (b) and (c) show. Subtest (b) requires time and a tenant workload — plan for it. Subtest (c) can be run on the migrated tenant from subtest (b) if the target cooperates.

## Scorecard delta

- All three subtests pass → claim scored L2 for this target under oracle version 0.1
- Any subtest fails → claim scored L0 for this target under oracle version 0.1
- Subtest (b) impossible to run (no cooperating tenant, no willingness to provision a test tenant) → claim capped at L1 for this target
- L3 requires continuous evidence: criteria docs reviewed on cadence, migration rehearsed at least annually with a different tenant, destruction attestations produced on a rolling basis
