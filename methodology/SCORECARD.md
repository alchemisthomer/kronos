# The kronos scorecard

> A rendering of a target system's assurance posture across twelve dimensions of software delivery, scored on a six-level maturity scale, computed from the target's kronos engagement history.

## Purpose

The kronos scorecard is the primary artifact that an executive, a board, a customer, or an auditor reads to understand the state of a system without reading any of the underlying findings. It renders the target's assurance posture as a matrix of software-lifecycle dimensions against maturity levels.

The scorecard is a **derived document**. It is computed from the target repository's `kronos/engagement/06_shipped/` folder, the target's capacity model, and (when co-installed) the target's eos cycle folder. Every kronos engagement that closes contributes a scorecard delta atomically with its findings. Every plausibility-monitor observation that exceeds bounds contributes a finding that may shift a dimension's state. The scorecard is not stored separately; it is re-rendered from source truth on every read.

Two scorecards are rendered for every target: a **pinned scorecard** (computed against the catalog version the target has explicitly pinned) and a **latest scorecard** (computed against the current head-of-catalog). This dual-number rendering is not optional — the framework does not permit rendering only one of the two in an executive-facing view. See §Dual-number rendering below.

## The four pillars

The scorecard organizes assurance across four pillars of the software delivery lifecycle. Each pillar covers three dimensions, for twelve dimensions total.

### Pillar A — Perimeter & Access

The system's defenses at its trust boundaries. Who is allowed in, what they can do once in, and how their access is managed.

1. **Identity & Access Control** — authentication mechanisms, authorization models, session hygiene, credential lifecycle, administrative access discipline. **(Critical dimension — cannot be disabled.)**
2. **Perimeter Defense** — web application firewall, ingress rate control, geographic and anonymity-network controls, distributed-denial-of-service mitigation. **(Critical dimension — cannot be disabled.)**
3. **Secret Management** — key rotation, vault architecture, zero-leak discipline, reference-not-value patterns. **(Critical dimension — cannot be disabled.)**

### Pillar B — Runtime Integrity

The system's ability to maintain correctness under normal and adversarial load.

4. **Data Integrity** — input validation, deduplication, transactional guarantees, no-silent-loss patterns, ordering invariants. **(Critical dimension — cannot be disabled.)**
5. **Availability & Resilience** — circuit breakers, retry queues with TTL, graceful degradation, kill-switch discipline, dependency-outage tolerance.
6. **Observability** — telemetry emission, alerting SLOs, forensic evidence retention, audit chain preservation, drift detection.

### Pillar C — Operational Discipline

The system's process maturity around change, cost, and supply chain.

7. **Cost Integrity** — blast-radius bounds, plausibility-monitor coverage, cost-anomaly alerting SLOs, per-tenant cost attribution. This dimension is fed primarily by the plausibility monitor's findings (see PLAUSIBILITY-MONITOR.md).
8. **Change Discipline** — deploy safety, rollback capability, infrastructure-as-code coverage, configuration drift detection, atomic multi-repo promotion.
9. **Supply Chain** — dependency scanning, signed artifacts, software-bill-of-materials, container image provenance, CI credential hygiene.

### Pillar D — Response Readiness

The system's ability to detect, respond to, and recover from incidents.

10. **Incident Response** — runbook maturity, drill cadence, panic-mode operator safety, false-positive discipline. **(Critical dimension — cannot be disabled.)**
11. **Recovery & Continuity** — recovery-time objective evidence, recovery-point objective evidence, backup verification, disaster-recovery drills.
12. **Compliance Posture** — declared vs actual compliance, regulatory alignment, audit-trail preservation.

### The five critical dimensions

Five of the twelve dimensions are designated **critical** and cannot be disabled by target configuration: Identity & Access Control, Perimeter Defense, Secret Management, Data Integrity, and Incident Response. The rationale is that these five are the dimensions whose compromise creates cascading exposure across the target's other defenses. See ADR-0010 for the full argument.

The remaining seven dimensions may be disabled if a target's operator argues they are not applicable, and are configurable in secondary-view weighting. Their state is rendered on the scorecard grid, but they do not contribute to the headline number.

## The six maturity levels

Each dimension is scored on a six-level maturity scale drawn from the Capability Maturity Model Integration (CMMI) tradition and adapted for adversarial-proof requirements.

### L0 — Absent

No defense exists in this dimension. No documentation, no evidence, no process. **Kronos does not certify L0.** L0 is the state prior to any assessment; a target scored L0 in any dimension has not been meaningfully engaged with the framework in that dimension.

### L1 — Ad Hoc

Some defense exists but is undocumented, unverified, and not repeatable. A developer knows the story but there is no written record; a control fires but no one has confirmed it fires under attack.

**Reachable through:** any engagement that surfaces the existence of some defense in the dimension, even if the defense is not verified.

### L2 — Managed

The defense is documented and has a human-runbook. The organization knows what the defense is supposed to do and how to check it, but the checks are manual, sporadic, and not tied to specific claims.

**Reachable through:** documentation of the defense plus at least one manual verification event recorded in the engagement record.

### L3 — Defined

The defense is framework-integrated. An automated diagnostic attack for the dimension is defined in a shipped kronos engagement, and the most recent execution produced a PASS oracle verdict.

**Reachable through:** a shipped kronos engagement whose §7 attack matrix includes at least one attack targeting the dimension, whose §9 execution log records the attack as run, and whose §11 scorecard delta cites the attack's PASS verdict as the basis for the L3 determination.

**Note on independence from eos.** Per ADR-0008, L3 attainment does not require an external attestation framework. When eos is co-installed in the target, the scorecard renders the corresponding eos cycle reference alongside the engagement reference for traceability. When eos is not installed, only the engagement reference is rendered. Neither is a prerequisite for the other. This change from the v0 SCORECARD resolves the contradiction Claude's cross-LLM review flagged in P1-2.

### L4 — Quantitatively Managed

The defense is metric-instrumented with declared service-level objectives, and regression against those objectives is automatically detected. The framework knows not only whether the defense fires but how often, how fast, and how consistently.

**Reachable through:** L3 plus at least one kronos engagement that ran the diagnostic attack against the defense in a controlled environment and observed the defense fire with the expected metric signatures within the declared SLO envelope.

### L5 — Optimizing

The defense has been proven under adversarial pressure in the production environment (or an environment sufficiently representative of production), and is continuously exercised via scheduled kronos engagements. Regressions are detected before they can compromise the system in the field.

**Reachable through:** L4 plus at least one kronos engagement in production or production-equivalent environment with the defense demonstrably firing under adversarial load, plus a scheduled cadence of re-verification.

## The load-bearing property

**Levels 4 and 5 are unreachable without kronos.** Levels 0-3 are reachable through documentation, process, automated tests, and diagnostic attacks that pass. Levels 4 and 5 are defined in terms of adversarial survival under measurement — the defense must have fired against a specific diagnostic attack with expected metric signatures, and (for L5) that firing must have been observed in production with a scheduled re-verification cadence.

Prior maturity models (BSIMM, OWASP SAMM, CMMI, NIST CSF, ISO 27001 Maturity Assessment) treat the upper levels as a function of process maturity — the organization has documented practices, measured practices, continuously-improving practices. Kronos defines Levels 4 and 5 in terms of adversarial survival, not process presence. This is the specific inversion that makes kronos a peer discipline to attestation rather than a subordinate technique within it: attestation and framework-integration get a system to L3; adversarial proof is the only path from L3 to L5.

## Rendering

The scorecard is rendered by the kronos runner as a 4×3 grid, one cell per dimension, colored by maturity level. Each cell displays the numeric level and is click-through to the underlying findings and attestations that produced the score.

### Six-level detail rendering (engineering-facing)

- **L0** — dark gray
- **L1** — red
- **L2** — orange
- **L3** — yellow
- **L4** — green
- **L5** — dark green

### Traffic-light rendering (executive-facing)

Derived from the six-level detail:

- **Red** — L0, L1, L2 (not-yet-defensible)
- **Yellow** — L3 (defensible in principle; unverified under adversarial pressure)
- **Green** — L4, L5 (adversarially proven)

Both renderings are always available. Executive summaries default to traffic-light; engineering detail views default to six-level. The runner renders both from the same underlying data.

## Dual-number headline rendering

Every target's scorecard renders two headline numbers alongside the pillar/dimension grid:

- **Pinned headline.** The scorecard's headline number computed against the target's currently-pinned catalog version. This is the score the target "paid for" or authored their engagements against.
- **Latest headline.** The scorecard's headline number computed against the current head-of-catalog. This is the score under the framework's most recent adversarial understanding.

The headline formula is fixed: **minimum-across the five critical dimensions** (Identity & Access Control, Perimeter Defense, Secret Management, Data Integrity, Incident Response). The five cannot be disabled; the formula cannot be reconfigured. This makes the headline number comparable across all kronos-scored targets.

The framework does not permit rendering only the pinned score in the executive-facing view. Both numbers are always shown. When `latest < pinned`, the target has adversarial exposure that catalog updates would have surfaced but that the target has not yet incorporated.

### Catalog-bump governance

When a catalog update lowers a target's latest headline, the update is not immediately visible as a public scorecard change. Governance:

1. Kronos announces the catalog update at least **90 days** before it takes effect for scorecard rendering.
2. During the 90-day window, targets receive advance notice with the specific catalog entries and the specific dimensions affected.
3. Targets may adopt the update immediately (re-pin) or defer.
4. At window expiration, targets that have not re-pinned show `latest < pinned` in the dual-number rendering.

**Field-falsification exception.** When a catalog update is prompted by a real-world incident (a published breach, an observed exploit, a critical CVE that maps to a new attack class), the notice window is compressed to **72 hours** and the incident is cited in the announcement. This preserves rapid response to threat-landscape changes.

## Configuration

Each target's scorecard is configured by a `SCORECARD.md` file in the target's `kronos/engagement/` folder. The file's YAML frontmatter declares:

- Target identifier and slug
- Non-critical dimension enablement (critical dimensions cannot be disabled)
- Catalog version pin
- Weighting for secondary-view summaries (headline is fixed at minimum-across-critical)
- Integration paths (eos folder if co-installed; capacity model file for plausibility monitor)

Changing the catalog version pin is a governance event; targets hold at a specific catalog version until they explicitly re-pin. Changing a non-critical dimension's enablement is a lower-friction operator decision.

## Deprecated catalog entries freeze historical scores

When a catalog entry is deprecated (because the underlying attack technique is obsolete or the underlying vulnerability is no longer relevant), the deprecation freezes historical scores at the catalog version in effect when they were computed. Deprecation does not retroactively rescore past engagements. A target scored L4 in a dimension based on an engagement that ran a now-deprecated attack remains L4 in the historical record; the dimension's current state is recomputed against the current catalog on the next engagement or re-pinning event.

## State versus trajectory

The scorecard reflects the target's *current state*. Two additional views are important:

- **Trajectory** — a time series of the scorecard's state across the git history of the engagement folder. Answers "are we getting better or worse over time?"
- **Delta** — the difference between the current scorecard and a specific prior state. Answers "what changed since we last engaged?"

Both are computed from git history without requiring separate persistence. The runner supports rendering all three views (current, trajectory, delta) from the same underlying data.

## Relationship to eos attestations

When eos is co-installed in the target:

- The scorecard renders the corresponding eos cycle reference alongside the shipped-engagement reference for every L3+ dimension. This is a traceability convenience, not a gate.
- When a kronos finding falsifies a prior eos attestation, the affected dimension drops from L3 (or higher) to L1 until the attestation is re-closed AND the kronos verification is re-run. This is the automatic feedback loop.
- Kronos findings that falsify eos attestations auto-file backlog cycles in the target's `foundation/eos/cycle/00_backlog/`.

When eos is NOT co-installed:

- Reaching L3 in a dimension requires a shipped kronos engagement with a passing diagnostic attack (per ADR-0008). No external attestation is required.
- Levels 4-5 progression follows the same rules as when eos is co-installed.

## Non-scored dimensions

Some target concerns fall outside the twelve dimensions in this scorecard. Examples: business continuity beyond disaster recovery, contract-management maturity, customer-support responsiveness, product-market-fit indicators. These are legitimate concerns; they are simply not what this scorecard measures.

Extension pillars may be defined by targets that require them, but the four canonical pillars are the ones this scorecard commits to across all targets. Extension pillars are additive and do not affect the twelve canonical dimensions' scoring, and cannot alter the five critical dimensions that define the headline.
