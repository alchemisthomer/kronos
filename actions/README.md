# actions

> Reusable GitHub Actions that enforce kronos discipline on target repositories.

**Status:** to be scaffolded after design review converges. See [`../DESIGN.md`](../DESIGN.md) for the design context.

## What this will be

A collection of GitHub Actions that adopting projects can wire into their CI to enforce the structural properties of the kronos methodology. Each action operates on the target repository's `kronos/engagement/**` tree and fails the build if a discipline invariant is violated.

## Planned actions

| Action | Purpose |
|---|---|
| `kanban-structure-validator` | Enforces the eight-stage folder structure (`00_scope/` through `07_aborted/`) and rejects unknown stage folders or misfiled engagement documents |
| `authorization-artifact-validator` | Validates every engagement document in `01_authorized/` and downstream stages has a well-formed `§2 Authorization artifact` block with an unexpired timestamp and a valid GPG signature |
| `evidence-hash-verifier` | Recomputes SHA-256 hashes of every artifact referenced in `§9 Execution log` and fails the build if any hash does not match |
| `scorecard-consistency-check` | Verifies that every `§11 Scorecard delta` in a `06_shipped/` engagement is reflected in the target's `SCORECARD.md` state, and that no scorecard cell has been mutated without a supporting engagement |
| `eos-backlog-auto-file` | When an engagement in `06_shipped/` documents a falsified eos attestation in `§12 Eos integration`, writes the corresponding backlog cycle file to `foundation/eos/cycle/00_backlog/` if that folder exists |
| `first-signal-stop-enforcer` | When an engagement in `04_running/` is configured for `first-signal-stop` mode, halts the running attack matrix on the first FAIL oracle evaluation and moves the engagement to `05_evidence/` |
| `production-authorization-guard` | For any engagement targeting a production environment, verifies the authorization artifact explicitly enables `productionTesting: true` and refuses execution otherwise |

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
