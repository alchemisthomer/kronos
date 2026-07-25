# The kronos scorecard

> A rendering of a target system's assurance posture across twelve dimensions of software delivery. Each dimension carries a multidimensional state — maturity, effectiveness, coverage, confidence, freshness, environment fidelity — rather than a single level. Computed from the target's kronos engagement history, continuous-plane findings, capacity model, and (optionally) co-installed eos attestations.

## Purpose

The kronos scorecard is a primary consumer-facing artifact — the answer to "which assurance claims currently hold, against which scenarios, with what coverage and confidence?" — rendered in a form an executive, a board, a customer, or an auditor can read at a glance.

**The scorecard does not certify that software is safe.** It reports, in structured form, what was evaluated, what survived, what was falsified, what remains untested, in which environment, with which evidence age, at which catalog version. Per ChatGPT's cross-LLM review, the framework's positioning explicitly does not include a universal "is my software safe" answer; the scorecard is the framework's answer to a narrower and more defensible question.

The scorecard is a **derived document**. It is computed from the target's engagement history, its continuous-plane findings, its capacity model, and (when co-installed) its eos cycle folder. Every state transition on any of these inputs re-renders the scorecard. The scorecard is not stored separately; it is projected from source truth on every read.

## Multidimensional cell state

The v0.1 scorecard used a single maturity level per cell. ChatGPT's cross-LLM review flagged in P0-3 that a single number conflates too many properties — process maturity, control effectiveness, adversarial coverage, evidence quality, evidence freshness, environment fidelity — and produces false transitions (one passing test moves an entire dimension from L3 to L4; one failure drops a mature control program to L1).

Under v0.2, each cell carries the following fields:

```yaml
maturity: 0..5                          # process/capability maturity axis (CMMI-derived; see §Maturity axis)
effectiveness:                          # separate axis for control effectiveness
  state: untested | survived | partial | falsified
  as_of: 2026-07-24T15:30:00Z
  source: engagement:<id>:run:<id> | continuous-plane:<evaluation-id>
coverage:
  weighted_claims_percent: 78           # weighted-claims coverage 0-100
  evaluated_claims: 18
  applicable_claims: 23
  unevaluated_claims: [C-alpha, C-beta, C-gamma]
confidence: low | medium | high
freshness:
  last_evaluated_at: 2026-07-24T15:30:00Z
  expires_at: 2026-08-24T15:30:00Z
  is_stale: false
environment_fidelity: lab | staging | production-equivalent | production
open_findings:
  count: 2
  ids: [F-2026-07-24-001, F-2026-07-24-004]
  max_severity: high
applicable_catalog_gap:
  pinned_catalog: kronos-catalog-2026.06
  latest_catalog: kronos-catalog-2026.07
  entries_added: 4
  entries_applicable_to_target: 2
  entries_unevaluated: 2
```

A dimension's rendering combines these fields into a legible summary. Example executive line for Perimeter Defense:

> **Perimeter Defense** — maturity L3; effectiveness survived; 78% weighted coverage; 18 of 23 applicable claims current; 2 open findings (max severity high); high-confidence evidence; staging fidelity; oldest critical evidence 12 days; catalog delta: 2 unevaluated new entries.

That is materially stronger than a "green L4 cell" and more honest about what the framework has and hasn't verified.

### ASCII rendering examples (v0.3 per Grok review)

**Six-level detail grid** (engineering-facing):

```
                              PILLAR A         PILLAR B          PILLAR C            PILLAR D
                              Perimeter        Runtime           Operational         Response
                              & Access         Integrity         Discipline          Readiness
────────────────────────────────────────────────────────────────────────────────────────────────
   1  Identity & Access [!]   L4 survived      L3 survived       L4 survived         L2 partial
   2  Perimeter Defense [!]   L3 survived      —                 —                   —
   3  Secret Management [!]   L4 survived      —                 —                   —
   4  Data Integrity    [!]   —                L3 falsified      —                   —
   5  Availability            —                L3 survived       —                   —
   6  Observability           —                L2 untested       —                   —
   7  Cost Integrity          —                —                 L3 survived (PM)    —
   8  Change Discipline       —                —                 L2 survived         —
   9  Supply Chain            —                —                 L1 untested         —
   10 Incident Response [!]   —                —                 —                   L3 survived
   11 Recovery & Continuity   —                —                 —                   L2 partial
   12 Compliance Posture      —                —                 —                   L2 survived

  [!] = critical dimension (cannot be disabled from headline)
  (PM) = fed primarily by plausibility monitor rather than attack oracle
```

**Executive traffic-light** (derived from six-level):

```
       PERIMETER & ACCESS       RUNTIME INTEGRITY        OPS DISCIPLINE          RESPONSE READINESS
       ┌─────────┬─────────┐    ┌─────────┬─────────┐    ┌─────────┬─────────┐   ┌─────────┬─────────┐
       │ Identity│ green   │    │  Data   │  red    │    │  Cost   │ yellow  │   │Incident │ yellow  │
       │ & Access│  (L4)   │    │Integrity│ (L1,    │    │Integrity│  (L3)   │   │Response │  (L3)   │
       │  [!]    │         │    │  [!]    │  fals-  │    │         │         │   │  [!]    │         │
       ├─────────┼─────────┤    │         │ ified)  │    ├─────────┼─────────┤   ├─────────┼─────────┤
       │Perimeter│ yellow  │    ├─────────┼─────────┤    │ Change  │ red     │   │Recovery │ red     │
       │ Defense │  (L3)   │    │Availa-  │ yellow  │    │ Disc.   │  (L2)   │   │& Cont.  │  (L2)   │
       │  [!]    │         │    │bility   │  (L3)   │    │         │         │   │         │         │
       ├─────────┼─────────┤    ├─────────┼─────────┤    ├─────────┼─────────┤   ├─────────┼─────────┤
       │ Secret  │ green   │    │Observ-  │ red     │    │ Supply  │ red     │   │Compl-   │ red     │
       │  Mgmt   │  (L4)   │    │ability  │  (L2)   │    │ Chain   │  (L1)   │   │iance    │  (L2)   │
       │  [!]    │         │    │         │         │    │         │         │   │         │         │
       └─────────┴─────────┘    └─────────┴─────────┘    └─────────┴─────────┘   └─────────┴─────────┘
       
       HEADLINE (dual-number, per ADR-0010):
         PINNED   (kronos-catalog-2026.06): status DEGRADED — 1 falsified critical (Data Integrity)
         LATEST   (kronos-catalog-2026.07): status DEGRADED — same +2 unevaluated new entries in Perimeter
```

Both renderings are always available. Executive views default to traffic-light; engineering detail views default to the six-level. The runner supports both from the same underlying data.

### Mandated default executive projection (v0.5 per Grok convergence review)

The v0.5 convergence declaration mandates one specific default projection for the executive-facing view. Adopters may configure other projections for internal use, but the executive default is fixed so "kronos executive scorecard" means the same thing across every target:

**Executive default = traffic-light on the five critical dimensions + pinned/latest dual-number headline. Nothing else.**

```
KRONOS EXECUTIVE SCORECARD — <target-slug>
Pinned catalog: kronos-catalog-YYYY.MM   |   Latest catalog: kronos-catalog-YYYY.MM
Overall status (pinned): current | degraded | stale | materially-incomplete
Overall status (latest): current | degraded | stale | materially-incomplete

The five critical dimensions:
  Identity & Access Control     ●  green  |  yellow  |  red
  Perimeter Defense              ●  green  |  yellow  |  red
  Secret Management              ●  green  |  yellow  |  red
  Data Integrity                 ●  green  |  yellow  |  red
  Incident Response              ●  green  |  yellow  |  red
```

Everything else — the seven non-critical dimensions, the multidimensional per-cell state (maturity + effectiveness + coverage + confidence + freshness + fidelity + open findings + catalog gap), trajectory view, delta view, industry-standard mapping view — lives behind drill-down interaction from the default executive projection.

The multi-axis detail is available on request but is not the default. This is deliberate: the executive default must be legible in under three seconds and comparable across every kronos-scored target. Multi-axis detail is legible and comparable only after the reader has established context.

The runner MUST render this default view exactly. Runner implementations that do not match the mandated default projection are non-conformant and must be corrected before deployment.

### Plausibility monitor vs attack oracle — double-counting clarification (v0.3 per Grok review)

The plausibility monitor and attack oracles can both produce findings that affect the same scorecard dimension (particularly Cost Integrity, which is fed by both). Double-counting is avoided as follows:

- **Findings are deduplicated by claim.** Both a plausibility-monitor observation and an attack-oracle verdict may reference the same claim (e.g., `CLAIM-cost-integrity-nat-throughput-bound`). If both produce findings against the same claim within a short correlation window, they are aggregated as a single finding with two evidence sources rather than two separate findings.
- **Effectiveness state is monotonic per claim.** A claim's effectiveness state is the aggregate of all recent findings against it. Two independent falsifications don't compound (the claim doesn't become "double-falsified"); one is sufficient.
- **Coverage counts a claim once.** A claim evaluated by both a plausibility monitor and an attack oracle counts once in the coverage denominator, not twice.
- **Cost Integrity is primarily fed by the plausibility monitor** — most cost-related claims have their effectiveness determined by continuous reconciliation, not by adversarial attacks. Attack oracles for cost-adversarial engagements (destructive-load with cost blast radius) feed the dimension but as a secondary source.
- **Source attribution is preserved** in the finding record (`source: continuous-plane:<eval-id>` vs `source: engagement:<id>:run:<id>:attack:<id>`) so an operator drilling into a dimension can see which findings came from which pathway.

## What each field means

### Maturity axis

The process/capability maturity axis, drawn from CMMI. Measures whether the organization has a defined and repeatable practice for defending this dimension:

- **L0 Absent** — no defense exists.
- **L1 Ad Hoc** — some defense exists but is undocumented and unverified.
- **L2 Managed** — the defense is documented and has a runbook; verification is manual and sporadic.
- **L3 Defined** — framework-integrated with automated diagnostic challenge defined and passing in the most recent shipped engagement (per ADR-0008; attainable natively).
- **L4 Quantitatively Managed** — L3 plus metric-instrumented SLOs, regression detection, and the diagnostic challenge fires under adversarial pressure with expected metric signatures within the declared SLO envelope.
- **L5 Optimizing** — L4 plus an actual improvement loop (per ChatGPT P0-3): challenges execute on a defined cadence, catalog changes trigger reassessment, findings generate remediation work, remediation is independently re-challenged, trends demonstrate reduced exposure or faster detection/recovery, stale evidence automatically expires, the organization can show assurance is improving, not merely recurring.

**A failed challenge does not lower maturity.** Maturity measures process presence; effectiveness measures whether the process's outputs currently hold. A mature process with a failing output has `maturity: 4` and `effectiveness.state: falsified` — both true simultaneously. This resolves the v0/v0.1 pattern where a single failure would erase all documented process maturity.

### Effectiveness axis

Whether the dimension's controls currently hold under challenge:

- **untested** — no diagnostic challenge has been evaluated recently enough to determine effectiveness. The dimension may have high maturity and still be untested.
- **survived** — the most recent applicable challenges returned `CLAIM_SURVIVED`.
- **partial** — most recent applicable challenges returned mixed verdicts, or one or more returned `PARTIAL_OR_DEGRADED`.
- **falsified** — one or more recent applicable challenges returned `CLAIM_FALSIFIED` and the finding is not yet resolved.

Effectiveness is what a challenge can change. A finding closure moves effectiveness from `falsified` back toward `survived` after re-verification. Effectiveness is orthogonal to maturity.

### Coverage

The fraction of applicable claims currently evaluated by shipped engagements or active continuous-plane findings. `weighted_claims_percent` is the primary summary; the underlying `evaluated_claims`, `applicable_claims`, and `unevaluated_claims` lists provide the drill-down.

Coverage decreases when new catalog entries add applicable claims that the target has not yet evaluated. Coverage increases when the target ships engagements evaluating previously-unevaluated claims.

### Confidence

The framework's confidence in the current effectiveness determination. Low confidence indicates evidence is stale, evidence sources are single-source, or oracle results included `PARTIAL_OR_DEGRADED` or `OBSERVABILITY_GAP` outcomes. High confidence indicates evidence is fresh, multi-source, and oracles returned `CLAIM_SURVIVED` unambiguously.

### Freshness

`last_evaluated_at` records the most recent challenge or continuous-plane evaluation for the dimension. `expires_at` is the point at which evidence is considered stale (default: 30 days after evaluation for high-confidence evidence, 7 days for medium, 24 hours for low). `is_stale: true` indicates the current effectiveness determination is based on expired evidence and the dimension should be re-evaluated.

Stale evidence degrades confidence but does NOT change effectiveness state — a `survived` dimension with stale evidence is still `survived`, just less confidently so, and the dimension's re-evaluation is prioritized in scheduling.

### Environment fidelity

Whether the challenges that produced the effectiveness determination ran in an environment representative of production:

- **lab** — synthetic or highly isolated test environment.
- **staging** — dedicated pre-production environment.
- **production-equivalent** — environment configured identically to production including data volume, load profile, and integrations.
- **production** — actual production.

L5 maturity requires `production-equivalent` or `production` fidelity per ADR-0007's plausibility-monitor semantics.

### Open findings

Findings whose lifecycle state is `open`, `accepted`, `remediation-in-progress`, or `awaiting-reverification` for challenges scoped to this dimension. `max_severity` surfaces the worst open finding for executive-visibility triage.

### Applicable catalog gap

Per ADR-0010's dual-number rendering: the delta between the pinned catalog version and the latest, filtered to entries whose applicability predicates match the target and that the target has not yet evaluated. This makes catalog-driven coverage decay visible without automatically penalizing the target.

## The four pillars and twelve dimensions

Unchanged from v0.1. Five dimensions remain critical (cannot be disabled): Identity & Access Control, Perimeter Defense, Secret Management, Data Integrity, Incident Response.

### Pillar A — Perimeter & Access

1. **Identity & Access Control** — authentication mechanisms, authorization models, session hygiene, credential lifecycle, administrative access discipline. **(Critical dimension — cannot be disabled.)**
2. **Perimeter Defense** — web application firewall, ingress rate control, geographic and anonymity-network controls, distributed-denial-of-service mitigation. **(Critical dimension — cannot be disabled.)**
3. **Secret Management** — key rotation, vault architecture, zero-leak discipline, reference-not-value patterns. **(Critical dimension — cannot be disabled.)**

### Pillar B — Runtime Integrity

4. **Data Integrity** — input validation, deduplication, transactional guarantees, no-silent-loss patterns, ordering invariants. **(Critical dimension — cannot be disabled.)**
5. **Availability & Resilience** — circuit breakers, retry queues with TTL, graceful degradation, kill-switch discipline, dependency-outage tolerance.
6. **Observability** — telemetry emission, alerting SLOs, forensic evidence retention, audit chain preservation, drift detection.

### Pillar C — Operational Discipline

7. **Cost Integrity** — blast-radius bounds, plausibility-monitor coverage, cost-anomaly alerting SLOs, per-tenant cost attribution. Fed primarily by the plausibility monitor and cost-reconciliation continuous evaluations.
8. **Change Discipline** — deploy safety, rollback capability, infrastructure-as-code coverage, configuration drift detection, atomic multi-repo promotion.
9. **Supply Chain** — dependency scanning, signed artifacts, software-bill-of-materials, container image provenance, CI credential hygiene.

### Pillar D — Response Readiness

10. **Incident Response** — runbook maturity, drill cadence, panic-mode operator safety, false-positive discipline. **(Critical dimension — cannot be disabled.)**
11. **Recovery & Continuity** — recovery-time objective evidence, recovery-point objective evidence, backup verification, disaster-recovery drills.
12. **Compliance Posture** — declared vs actual compliance, regulatory alignment, audit-trail preservation.

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

Every target's scorecard renders two headline **status summaries** alongside the pillar/dimension grid. Per ChatGPT's cross-LLM review (P0-3), a single weighted average is deliberately avoided because it lets strong low-risk dimensions conceal a failed critical claim. The headline summary reports each of the following load-bearing signals separately:

- **Falsified critical claims** — count of open findings on critical dimensions with severity high or critical.
- **Untested critical claims** — count of claims on critical dimensions with `effectiveness.state: untested`.
- **Weighted coverage** — fraction of applicable claims across all enabled dimensions currently evaluated by fresh evidence.
- **Minimum critical maturity** — lowest maturity level across the five critical dimensions.
- **Minimum critical effectiveness** — worst effectiveness state across the five critical dimensions.
- **Evidence freshness** — count of dimensions with stale evidence.
- **Catalog gap** — number of applicable unevaluated catalog entries (pinned vs latest).
- **Overall status** — one of: `current` / `degraded` / `stale` / `materially-incomplete`, computed from the above signals per a fixed rubric.

Two headline reports are rendered:

- **Pinned headline** — computed against the target's currently-pinned catalog version.
- **Latest headline** — computed against the current head-of-catalog.

The framework does not permit rendering only the pinned headline in the executive-facing view. Both are always shown.

**A weighted average is not used as the primary safety summary.** A weighted average lets an L1 Identity cell hide behind a wall of L4s, which is dangerous because an attacker picks the weakest point, not the average. If a customer requests a single-number summary for a specific downstream integration (a slide deck, a board report), the framework can render one, but only with the explicit note "weighted average across enabled dimensions; not a safety guarantee; see per-dimension breakdown for critical exposure."

### Catalog-bump governance

When a catalog update lowers a target's latest headline, the update is not immediately visible as a public scorecard change. Governance:

1. Kronos announces the catalog update at least **90 days** before it takes effect for scorecard rendering.
2. During the 90-day window, targets receive advance notice with the specific catalog entries and the specific dimensions affected.
3. Targets may adopt the update immediately (re-pin) or defer.
4. At window expiration, targets that have not re-pinned show `latest < pinned` in the dual-number rendering.

**Field-falsification exception.** When a catalog update is prompted by a real-world incident (a published breach, an observed exploit, a critical CVE that maps to a new attack class), the notice window is compressed to **72 hours** and the incident is cited in the announcement. This preserves rapid response to threat-landscape changes.

## Hysteresis and damping for continuous-plane findings (v0.4 per Gemini review)

The continuous plane can generate transient findings — a plausibility-monitor observation that briefly exceeds bounds due to metric-pipeline lag, an observability-gap finding during a target's own scheduled maintenance window, a control-drift finding during a legitimate mid-flight deploy. Without damping, these transient signals would produce rapid scorecard oscillation ("executive panic" per Gemini) that undermines the scorecard's usefulness as a stable decision artifact.

The v0.4 scorecard rendering applies hysteresis and damping to continuous-plane-sourced dimension transitions:

**Effectiveness state — degradation requires sustained evidence.** A `survived` → `partial` or `partial` → `falsified` transition triggered by continuous-plane findings requires the finding to persist for a declared window before the transition renders. Default windows:

- `survived` → `partial`: continuous finding present for at least **30 minutes** (or two consecutive evaluation cycles, whichever is longer).
- `survived` → `falsified`: continuous finding present for at least **1 hour** (or three consecutive evaluation cycles).
- `partial` → `falsified`: continuous finding present for at least **30 minutes**.

**Effectiveness state — recovery renders faster.** A `partial` → `survived` or `falsified` → `survived` transition renders within one evaluation cycle. Recovery is not damped; the scorecard should reflect improvements promptly.

**Attack-oracle findings are not damped.** A `CLAIM_FALSIFIED` verdict from an engagement-plane attack oracle transitions the dimension immediately. Attack-oracle findings are point-in-time authoritative determinations; damping them would obscure real defense failures.

**Damping applies only to the executive-facing rendering.** The underlying finding record is written immediately when the continuous plane emits it. Operators and engineers see the raw finding in the engineering-facing views; only the executive-facing traffic-light and dual-number headline apply damping. This preserves diagnostic timeliness for operators while preventing executive-facing volatility.

**Damping windows are configurable per target** in the SCORECARD.md YAML frontmatter:

```yaml
scoring:
  hysteresis:
    survived_to_partial_minutes: 30       # or set to 0 to disable damping
    survived_to_falsified_minutes: 60
    partial_to_falsified_minutes: 30
    apply_to_engagement_findings: false   # engagement findings render immediately regardless
```

Damping is not intended to hide real degradation. If a continuous finding persists across the damping window, the scorecard reflects it. Damping only smooths transient signals whose underlying cause resolves quickly.

**Explicit note:** Damping is a rendering concern, not a truth concern. An auditor inspecting the target at any moment can query the raw finding stream and see continuous-plane findings as they were emitted, regardless of whether the executive-rendering had transitioned yet. The damped rendering is a legibility optimization; the underlying data is not smoothed.

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
