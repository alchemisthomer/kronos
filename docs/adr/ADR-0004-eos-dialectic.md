# ADR-0004 — The eos-kronos dialectic

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The Steward, Kronos
- **Supersedes:** None
- **Superseded by:** None

## Context

Kronos and eos are complementary methodologies. Eos attests — it produces evidence that a system does what its designers claim it does. Kronos falsifies — it produces evidence that a system's claims can (or cannot) be broken under adversarial pressure. Both operate on the same target. Both persist their artifacts in the same repository via git. Both work on any technology stack.

The relationship between the two frameworks must be defined explicitly. Under-integration produces two disjoint tools that don't reinforce each other. Over-integration produces a coupled dependency that prevents either from being adopted alone. The right answer is structured optionality — the two frameworks operate independently, but when co-installed in the same target they integrate bidirectionally through well-defined structural hooks.

Prior adjacent examples do not settle the pattern. DevSecOps ("shift left" integration of security into development) is a philosophy without a structural artifact. Compliance-plus-audit regimes (SOC 2, ISO 27001) treat attestation and audit as sequential rather than dialectical — the auditor confirms the attestation rather than attempting to falsify it. Test-driven development couples design and verification but produces artifacts (tests) that live in the same codebase rather than in complementary methodology frameworks.

The eos-kronos dialectic is more specific: two independently-adoptable methodologies structurally coupled through a shared git-native artifact bus, forming an epistemic backbone in which each framework's outputs are the inputs to the other's next cycle.

## Decision

Kronos and eos operate independently and integrate bidirectionally when co-installed.

### Independent operation

- **Kronos alone.** A target that adopts kronos without eos runs engagements, produces findings, and updates its scorecard. The scorecard reaches L2 via documentation and manual verification recorded in the engagement record. L3 requires an equivalent attestation from another framework, documented in the engagement. L4 and L5 remain kronos-exclusive.
- **Eos alone.** A target that adopts eos without kronos runs attestation cycles, closes claims via §9 telemetry assertions, and maintains a shipped-cycle history. No scorecard is produced because scorecards are a kronos artifact. Maturity claims are limited to eos's attestation model.

### Integration when co-installed

- **Attestation-to-attack.** When a new eos attestation closes, the corresponding kronos catalog entries (those tagged with the same claim identifiers) become eligible for engagement scheduling against the target. The framework does not auto-schedule; it makes visible.
- **Attack-to-backlog.** When a kronos engagement produces a finding that falsifies a previously-closed eos attestation, the finding auto-files a new backlog cycle in the target's `foundation/eos/cycle/00_backlog/` naming the specific claim that was falsified and pointing to the kronos evidence. The auto-filed cycle is the seed for eos's next attestation of the affected dimension.
- **Scorecard-to-attestation.** The kronos scorecard reads the target's `foundation/eos/cycle/06_shipped/` folder to determine L3 eligibility. A dimension reaches L3 only when eos has shipped a corresponding attestation. This creates positive pressure on the target to close eos attestations covering every scorecard dimension.
- **Attestation-to-scorecard.** When a new eos attestation closes, the scorecard automatically reflects the L3 update for the covered dimension. No separate kronos action is required. When an eos attestation is invalidated (either by kronos falsification or by the operator explicitly), the affected dimension drops in the scorecard.
- **Ceremony parity.** Both frameworks use the same commit ceremony (GPG-signed, SSH-pushed, neural-pathway branches for scratch, shared cycle-and-engagement branches for multi-agent work). Operators do not need to context-switch between the frameworks.

### Structural coupling points

The integration is implemented as filesystem conventions, not as code dependencies. Kronos reads the target's eos folder; eos does not need to know kronos exists.

- Kronos's engagement template `§12 Eos integration` section documents the coupling from the engagement side.
- Kronos's scorecard configuration allows a `eos_folder` field pointing to the target's eos cycle folder path (defaults to `foundation/eos/cycle/`).
- Kronos actions (GitHub Actions) implement the attack-to-backlog auto-file when the target's repository contains both `foundation/eos/cycle/` and `kronos/engagement/`.
- Eos remains unchanged. No eos update is required for this integration to work.

### Optional updates to eos (recommended, not required)

The following changes to the eos methodology would improve the dialectic but are not required for it:

1. **Attestation template gets a `§7.1 Red team evaluation` section.** Each attestation can enumerate the kronos catalog entries that are expected to be evaluated against the attested claims once kronos is in scope. This is the eos-side declaration of "these are the attacks I expect to survive."
2. **`06_shipped/` cycles get an optional `kronos_verified` frontmatter field.** A cycle whose claims have been kronos-tested and survived carries this field set to the latest kronos engagement identifier. This makes the eos kanban legible about which claims have been adversarially proven.
3. **A `10_falsified/` folder is added to the eos kanban** (as a peer of `07_aborted/`) for cycles whose claims have been falsified by kronos. Cycles in this folder are the seeds of the auto-filed backlog entries; the target's operators can inspect the falsification evidence directly from the eos kanban.

These changes are proposed as future eos cycles, not as prerequisites for kronos to ship.

## Consequences

### Positive

- Adopters can choose one, the other, or both. The value proposition scales with commitment.
- The two frameworks reinforce each other without depending on each other. Bug-for-bug independence.
- The runner UI can render both kanbans in one view when both are present, showing the full readiness picture at a glance.
- Consulting engagements can be scoped to eos alone (attestation), kronos alone (adversarial), or both (full readiness backbone). Three distinct offerings from two frameworks.
- Cross-framework provenance is clean: any scorecard cell at L3+ can be drilled to its supporting eos attestation; any L4+ can be drilled to its supporting kronos engagement.

### Negative

- Two frameworks means two documentation surfaces to keep synchronized. Operators must learn both to reach the full value proposition. Onboarding cost is higher than for a single unified framework.
- The bidirectional integration relies on filesystem conventions rather than typed APIs. A target that reorganizes its `foundation/eos/cycle/` path breaks the scorecard's L3-eligibility check.
- The optional eos updates depend on the eos maintainer's future prioritization. Until they land, the dialectic runs at reduced fidelity — kronos still auto-files backlog entries, but the eos kanban does not natively express falsified-cycle state.

### Neutral

- The choice to keep eos unchanged for the MVP integration is deliberate. It preserves eos's freedom to evolve independently and keeps the coupling one-way from a code-dependency standpoint (kronos reads eos structure; eos does not read kronos).

## References

- [`../../methodology/OPERATING-MANUAL.md`](../../methodology/OPERATING-MANUAL.md) — sections on presumption of failure and independent operation.
- [`../../methodology/INVENTIVE-CONCEPT-CANDIDATES.md`](../../methodology/INVENTIVE-CONCEPT-CANDIDATES.md) — property 2 (the dialectic as complementary epistemic backbone).
- [`../../methodology/SCORECARD.md`](../../methodology/SCORECARD.md) — L3 eligibility rules that reference eos attestations.
- `alchemisthomer/eos` — the framework kronos is coupled with.
