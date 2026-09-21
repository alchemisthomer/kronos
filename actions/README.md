# actions

> Reusable GitHub Actions that enforce kronos discipline on target repositories.

**Status:** to be scaffolded after design review converges. See [`../DESIGN.md`](../DESIGN.md) for the design context.

## What this will be

A collection of GitHub Actions that adopting projects can wire into their CI to enforce the structural properties of the kronos methodology. Each action operates on the target repository's `kronos/engagement/**` tree and fails the build if a discipline invariant is violated.

## Planned actions

| Action | Purpose |
|---|---|
| `kanban-structure-validator` | Enforces the eight-stage folder structure (`00_scope/` through `07_aborted/`) and rejects unknown stage folders or misfiled engagement documents |
| `authorization-artifact-validator` | Validates every engagement document in `01_authorized/` and downstream stages has a well-formed `§2 Authorization artifact` block with an unexpired timestamp, valid GPG signature, and (per ADR-0009) valid `incidentState` and `chainOfAuthorization` blocks where applicable |
| `evidence-hash-verifier` | Recomputes SHA-256 hashes of every artifact referenced in `§9 Execution log` and fails the build if any hash does not match |
| `execution-provenance-verifier` | (New in v0.1 per Claude review P2-3.) Verifies every attack invocation has a corresponding execution-attestation with a valid signature by the operator or runner key. Missing or invalid attestations block the merge |
| `scorecard-consistency-check` | Verifies that every `§11 Scorecard delta` in a `06_shipped/` engagement is reflected in the target's `SCORECARD.md` state, and that the headline number (minimum-across-five-critical-dimensions) is correctly computed |
| `enumeration-reconciler` | (New in v0.1 per Claude review P1-1.) For every tool declaring an enumeration capability, runs the query in both filtered and unfiltered forms; any nonzero delta on a filter that should have returned empty is surfaced as a `scanner-drift` finding |
| `plausibility-monitor-scheduler` | (New in v0.1.) Runs the plausibility monitor on its declared cadence against the target's capacity model; writes findings to `<target>/kronos/findings/plausibility/` for any observation exceeding declared bounds |
| `eos-backlog-auto-file` | When an engagement in `06_shipped/` documents a falsified eos attestation in `§12 Eos integration`, writes the corresponding backlog cycle file to `foundation/eos/cycle/00_backlog/` if that folder exists |
| `first-signal-stop-enforcer` | When an engagement in `04_running/` is configured for `first-signal-stop` mode with a declared severity threshold, halts the running attack matrix on the first FAIL oracle evaluation at-or-above threshold and moves the engagement to `05_evidence/`. INCONCLUSIVE verdicts do not halt |
| `production-authorization-guard` | For any engagement targeting a production environment, verifies the authorization artifact explicitly enables `productionTesting: true`. For engagements targeting a third-party's production (prospect-scope), requires the onboarding-gated prospect authorization per ADR-0009 |
| `catalog-version-governance` | (New in v0.1 per ADR-0010.) When a catalog update would lower a target's headline, enforces the 90-day notice window before the update takes effect for that target (72 hours for field-falsification exception) |

## Adoption pattern

Adopting projects reference these actions in their workflow files:

```yaml
# .github/workflows/kronos-validate.yml (in the target repository)
name: Kronos discipline check
on:
  pull_request:
    paths:
      - 'kronos/engagement/**'
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: alchemisthomer/kronos/actions/kanban-structure-validator@v1
      - uses: alchemisthomer/kronos/actions/authorization-artifact-validator@v1
      - uses: alchemisthomer/kronos/actions/evidence-hash-verifier@v1
      - uses: alchemisthomer/kronos/actions/scorecard-consistency-check@v1
```

The actions are the enforcement layer that gives the methodology teeth. Without them, the discipline relies on operator vigilance; with them, the discipline is CI-enforced and pull requests that violate it cannot merge.

## Relationship to the eos actions

Sibling to the `alchemisthomer/eos` actions. Eos's actions enforce the eos cycle discipline (kanban structure, single-open-cycle mutex, approval-gate check, telemetry-assertion runner); kronos's actions enforce the kronos engagement discipline. When both frameworks are installed, both action suites run against their respective folder trees; they do not interfere.

## Versioning

Actions follow semantic versioning. Adopting projects pin to a major version (`@v1`) and receive bug fixes automatically; breaking changes require an explicit pin update.
