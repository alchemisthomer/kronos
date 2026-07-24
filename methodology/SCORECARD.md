# The kronos scorecard

> The single executive-consumable answer to "is my software safe?"

## Purpose

The kronos scorecard is a rendering of a target system's assurance posture as a matrix of software-lifecycle dimensions against maturity levels. It is the primary artifact that an executive, a board, a customer, or an auditor reads to understand the state of a system without reading any of the underlying findings.

The scorecard is not a report. It is a **live document**, rendered from the target repository's `kronos/engagement/06_shipped/` folder, that reflects the current assurance posture at any point in time. Every engagement that closes updates the scorecard atomically with its findings. The scorecard and the evidence chain are never allowed to drift apart.

## The four pillars

The scorecard organizes assurance across four pillars of the software delivery lifecycle. Each pillar covers three dimensions, for twelve dimensions total.

### Pillar A — Perimeter & Access

The system's defenses at its trust boundaries. Who is allowed in, what they can do once in, and how their access is managed.

1. **Identity & Access Control** — authentication mechanisms, authorization models, session hygiene, credential lifecycle, administrative access discipline
2. **Perimeter Defense** — web application firewall, ingress rate control, geographic and anonymity-network controls, distributed-denial-of-service mitigation
3. **Secret Management** — key rotation, vault architecture, zero-leak discipline, reference-not-value patterns (ARN-not-secret)

### Pillar B — Runtime Integrity

The system's ability to maintain correctness under normal and adversarial load.

4. **Data Integrity** — input validation, deduplication, transactional guarantees, no-silent-loss patterns, ordering invariants
5. **Availability & Resilience** — circuit breakers, retry queues with TTL, graceful degradation, kill-switch discipline, dependency-outage tolerance
6. **Observability** — telemetry emission, alerting SLOs, forensic evidence retention, audit chain preservation, drift detection

### Pillar C — Operational Discipline

The system's process maturity around change, cost, and supply chain.

7. **Cost Integrity** — blast-radius bounds, physical-plausibility oracles, cost-anomaly alerting SLOs, per-tenant cost attribution
8. **Change Discipline** — deploy safety, rollback capability, infrastructure-as-code coverage, configuration drift detection, atomic multi-repo promotion
9. **Supply Chain** — dependency scanning, signed artifacts, software-bill-of-materials, container image provenance, CI credential hygiene

### Pillar D — Response Readiness

The system's ability to detect, respond to, and recover from incidents.

10. **Incident Response** — runbook maturity, drill cadence, panic-mode operator safety, false-positive discipline
11. **Recovery & Continuity** — recovery-time objective evidence, recovery-point objective evidence, backup verification, disaster-recovery drills
12. **Compliance Posture** — declared vs actual compliance, regulatory alignment (SOC 2, ISO 27001, HIPAA, PCI DSS as applicable), audit-trail preservation

## The six maturity levels

Each dimension is scored on a six-level maturity scale drawn from the Capability Maturity Model Integration (CMMI) tradition, adapted for adversarial-proof requirements.

### L0 — Absent

No defense exists in this dimension. No attestation, no evidence, no process. The system is exposed on this dimension.

**Kronos does not certify L0.** L0 is the state prior to any assessment; a target scored L0 in any dimension has not been meaningfully engaged with the framework in that dimension.

### L1 — Ad Hoc

Some defense exists but is undocumented, unverified, and not repeatable. A developer knows the story but there is no written record; a control fires but no one has proven it fires under attack.

**Reachable through:** any engagement that surfaces the existence of some defense in the dimension, even if the defense is not verified.

### L2 — Managed

The defense is documented, has a human-runbook, and is occasionally tested. The organization knows what the defense is supposed to do and how to check it, but the checks are manual, sporadic, and not tied to specific claims.

**Reachable through:** documentation of the defense plus at least one manual verification event recorded in the engagement record.

### L3 — Defined

The defense is framework-integrated, has automated tests, and is attested by an attestation framework (specifically eos, though the pattern generalizes). Every claim about the defense is stated as a testable assertion; every assertion has an associated automated check; the checks run at a defined cadence.

**Reachable through:** an eos attestation cycle that closes with §9 telemetry assertions covering the dimension, or an equivalent attestation record.

### L4 — Quantitatively Managed

The defense is metric-instrumented with declared service-level objectives, and regression against those objectives is automatically detected. The framework knows not only whether the defense fires but how often, how fast, and how consistently.

**Reachable through:** L3 plus at least one kronos engagement that ran the diagnostic attack against the defense in a controlled environment and observed the defense fire with the expected metric signatures within the declared SLO envelope.

### L5 — Optimizing

The defense has been proven under adversarial pressure in the production environment (or an environment sufficiently representative of production), and is continuously exercised via scheduled kronos engagements. Regressions are detected before they can compromise the system in the field.

**Reachable through:** L4 plus at least one kronos engagement in production or production-equivalent environment with the defense demonstrably firing under adversarial load, plus a scheduled cadence of re-verification.

## The load-bearing property

**Levels 4 and 5 are unreachable without kronos.** This is by design.

Prior maturity models (BSIMM, OWASP SAMM, CMMI, NIST CSF, ISO 27001 Maturity Assessment) treat the upper levels as a function of process presence — the organization has documented practices, measured practices, continuously-improving practices. The measurement is process-internal. An organization can reach the top level of these models without ever having its defenses actually broken.

Kronos defines Levels 4 and 5 in terms of adversarial survival. Level 4 requires the defense to have fired against the specific diagnostic attack whose success would have compromised the dimension. Level 5 requires that firing to have been observed in production or production-equivalent environment with a scheduled cadence of re-verification. No amount of documentation, attestation, or process maturity reaches Level 4 or Level 5.

This is the specific inversion that makes kronos a peer discipline to attestation rather than a subordinate technique within it. Attestation gets a system to Level 3. Adversarial proof is the only path from Level 3 to Level 5.

## Rendering

The scorecard is rendered by the kronos runner (the React/TypeScript reference viewer) as a 4×3 grid, one cell per dimension, colored by maturity level:

- **L0** — dark gray
- **L1** — red
- **L2** — orange
- **L3** — yellow
- **L4** — green
- **L5** — dark green

Each cell displays the numeric level and is click-through to the underlying findings and attestations that produced the score. A top-line summary is also rendered — commonly the minimum-across-dimensions or the weighted-average-across-pillars; the specific summary formula is a target-scoped configuration in the scorecard's YAML frontmatter.

The rendering also supports historical view — the scorecard's state at any prior point in time can be reconstructed by walking the git history of the `kronos/engagement/06_shipped/` folder and re-computing the maturity levels as of the desired timestamp.

## Consulting engagement primitive

The scorecard doubles as a commercial artifact. A typical engagement flow:

1. **Free assessment** — kronos runs against a prospective customer's target in `first-signal-stop` mode. The first attack that surfaces a finding produces the initial scorecard, showing where the target sits on each of twelve dimensions. This scorecard is the sales artifact.
2. **Scoped engagement proposal** — the operator proposes a fixed-scope engagement to move specific dimensions from their current level to a target level. Example: "your Perimeter Defense sits at L2; a 90-day engagement will take it to L4 by shipping the specific attestations and running the specific kronos verifications required to unlock L3 and L4."
3. **Engagement execution** — the operator runs eos cycles to reach L3 in the targeted dimensions, then kronos engagements to reach L4. The scorecard delta is the deliverable.
4. **Continuous coverage** — after the engagement closes, a scheduled cadence of kronos re-verifications maintains L4 and works toward L5 in the remaining dimensions.

The scorecard is what the customer sees. The scorecard delta is what the customer pays for. The scorecard's continuous coverage is what the customer subscribes to.

## Configuration

Each target's scorecard is configured by a `SCORECARD.md` file in the target's `kronos/engagement/` folder. The file's YAML frontmatter declares:

- Target identifier and slug
- Pillar and dimension configuration (a target may choose to disable dimensions that are not applicable — e.g., a system with no supply-chain exposure may disable Supply Chain)
- Weighting for the top-line summary (uniform, pillar-weighted, or custom)
- Catalog version pin (which version of the kronos threat catalog is applicable to this target's scoring)

Changing the catalog version pin is a governance event; targets may hold at a specific catalog version and defer scorecard recomputation until they explicitly re-pin.

## Scorecard state versus scorecard trajectory

The scorecard reflects the target's *current state*. Two additional views are important:

- **Trajectory** — a time series of the scorecard's state across the git history of the engagement folder. Answers "are we getting better or worse over time?"
- **Delta** — the difference between the current scorecard and a specific prior state. Answers "what changed since we last engaged?"

Both are computed from git history without requiring separate persistence. The runner supports rendering all three views (current, trajectory, delta) from the same underlying data.

## Relationship to eos attestations

When eos is co-installed in the target:

- Levels 0-3 are shared with the eos attestation model. Reaching L3 in a dimension requires a closed eos attestation covering that dimension. The scorecard reads the eos cycle folder to determine L3 eligibility.
- Levels 4-5 remain kronos-exclusive. No eos attestation reaches L4 without a corresponding kronos engagement.
- When a kronos finding falsifies a prior eos attestation, the affected dimension drops from L3 (or higher) to L1 until the attestation is re-closed AND the kronos verification is re-run. This is the automatic feedback loop.

When eos is NOT co-installed:

- Levels 0-2 are reachable via documentation and manual verification recorded in the engagement record.
- Reaching L3 in a dimension requires either an equivalent attestation record from another framework (documented in the engagement) or a kronos engagement that includes an explicit L3 attestation step.
- Levels 4-5 remain kronos-exclusive as always.

## Non-scored dimensions

Some target concerns fall outside the twelve dimensions in this scorecard. Examples: business continuity beyond disaster recovery, contract-management maturity, customer-support responsiveness, product-market-fit indicators. These are legitimate concerns; they are simply not what this scorecard measures.

Extension pillars may be defined by targets that require them (an extended `Pillar E — Business Continuity`, for example), but the four canonical pillars are the ones this scorecard commits to across all targets. Extension pillars are additive and do not affect the twelve canonical dimensions' scoring.
