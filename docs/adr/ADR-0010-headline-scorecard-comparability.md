# ADR-0010 — Non-configurable headline scorecard and dual-number rendering for comparability

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The operator, Kronos scribe
- **Supersedes:** In-part supersedes SCORECARD.md v0's configuration and rendering sections
- **Superseded by:** None
- **Origin:** Claude cross-LLM design review of v0, findings P1-3 (part A), P2-4

## Context

The Claude review identified two related weaknesses in the v0 scorecard's public-artifact posture:

**Weakness A — Retroactive catalog vs. sold public number.** SEVEN-CLAIMS §5 and DESIGN.md §8 assert that the threat catalog grows monotonically over time and applies retroactively — new entries can lower previously-scored targets' cells. SCORECARD §6/§Purpose asserts the scorecard is a "live document that answers *is my software safe* right now." These compose to a customer-trust landmine: a customer who paid to reach L4 in some dimension can wake up at L3 in public, with no change to their system, because kronos unilaterally added a catalog entry.

The v0 mitigation (catalog-version pinning) creates a different problem: the pinned score is stale by definition, which contradicts the "live document" claim. There is no coherent semantics for "live" that resolves the tension between pinned and re-pinned-to-latest.

**Weakness B — Operator-configurable headline undermines comparability.** SCORECARD v0 lets targets disable dimensions and choose their own top-line summary formula (minimum-across / weighted-average / custom). These give very different answers and create different incentives. Minimum-across is the honest security semantic (you are as safe as your weakest boundary) but caps the board at the worst cell — which customers will game by disabling that dimension. Weighted-average lets an L1 Identity cell hide behind a wall of L4s, which is dangerous because attackers pick the weakest point, not the average. Disable-plus-reweight means the public number means something different for every target.

The reviewer's directives:
- For A: dual-number scorecard by default (pinned score + re-pinned-to-latest exposure delta); explicit governance event for catalog bumps that lower public cells; contractual notice window before the bump lands.
- For B: non-configurable headline over a fixed set of critical dimensions that cannot be disabled; configuration retained only for non-critical dimensions and for secondary views.

## Decision

### Non-configurable headline over five critical dimensions

The scorecard's public headline number is computed over five dimensions that CANNOT be disabled by target configuration:

- **A.1 Identity & Access Control**
- **A.2 Perimeter Defense**
- **A.3 Secret Management**
- **B.1 Data Integrity**
- **D.1 Incident Response**

The headline formula is fixed: **minimum-across-the-five-critical-dimensions**. This is the honest security semantic (you are as safe as your weakest boundary), and by fixing the formula and the dimensions it becomes comparable across all kronos-scored targets.

The remaining seven dimensions (Availability & Resilience, Observability, Cost Integrity, Change Discipline, Supply Chain, Recovery & Continuity, Compliance Posture) may be disabled by target configuration and may use configurable formulas for secondary views. Their state is still rendered on the scorecard grid, but they do not affect the headline number.

The rationale for these five as critical: they are the dimensions whose compromise creates cascading exposure across the target's other defenses. An adversary who breaks Identity & Access can escalate to any other dimension; an adversary who breaks Perimeter Defense reaches internals that other defenses assume unreachable; an adversary who exploits Secret Management leakage bypasses every credential-gated control; a Data Integrity failure poisons every downstream computation; and an Incident Response failure turns any of the above into an extended incident. The five are the load-bearing floor.

### Dual-number rendering as default

Every target's scorecard renders two numbers alongside the pillar/dimension grid:

- **Pinned score.** The scorecard as computed against the target's currently-pinned catalog version. This is the score the target "paid for" and the score the target's public materials may cite.
- **Latest score.** The scorecard as computed against the current head-of-catalog. This is the score under the framework's most recent adversarial understanding.

When pinned = latest, the target is current. When latest < pinned, the target has adversarial exposure that catalog updates would have surfaced. The delta between the two is itself a signal — a large gap indicates the target has not adopted recent catalog updates.

Both numbers are always rendered. The framework does not permit rendering only the pinned score in the executive-facing view. The commercial claim "we are safe" is qualified by which catalog version underwrites it; the framework makes this qualification visible by default.

### Catalog-bump governance

When a catalog update lowers a target's latest headline, the update is not visible as a public scorecard change until a **governance event** completes:

1. Kronos announces the catalog update at least **90 days** before it takes effect for scorecard rendering.
2. During the 90-day window, targets receive advance notice with the specific catalog entries and the specific dimensions affected on their scorecard.
3. Targets may adopt the update immediately (re-pin) or defer until the window expires.
4. At window expiration, targets that have not re-pinned show `latest < pinned` in the dual-number rendering. The pinned number does not change; the latest number reflects the new catalog.

This gives customers a contractual notice window before a catalog bump can lower their public number. It does not shield them indefinitely — the exposure is visible via the latest number throughout the notice window and after.

For targets that experienced a **field falsification** (a real-world incident that the catalog update captures), the notice window is compressed to **72 hours** and the incident is cited in the update announcement. This preserves the ability to react quickly when a threat class becomes known through public breach.

### Executive traffic-light rendering

The internal six-level scale (L0-L5) is preserved for detailed rendering. An executive traffic-light derived from the six-level scale is rendered alongside:

- **Red** — L0, L1, L2
- **Yellow** — L3
- **Green** — L4, L5

This resolves the v0 review marker on §6 (six levels vs traffic light): keep both. The traffic-light is for executive consumption; the six-level detail is for engineering consumption; both are rendered.

### Deprecated catalog entries freeze historical scores

Per the reviewer's inline resolution: when a catalog entry is deprecated (because the underlying attack technique is obsolete or the underlying vulnerability is no longer relevant), the deprecation freezes historical scores at the catalog version in effect when they were computed. Deprecation does not retroactively rescore past engagements. A target scored L4 in some dimension based on an engagement that ran a now-deprecated attack remains L4 in the historical record; the dimension's current state is recomputed against the current catalog on the next engagement or re-pinning event.

## Consequences

### Positive

- The public headline number is comparable across targets. A "kronos headline 4" means the same thing on every scorecard.
- Customer expectation about score stability is grounded in a governance event with a notice window. Catalog bumps are known events, not surprises.
- The gaming vector (disable the weak dimension to raise the headline) is closed for the five critical dimensions. Non-critical dimensions remain configurable, which preserves adopter flexibility where the stakes are lower.
- The dual-number rendering makes the "pinned versus latest" tension visible by design rather than papered over. Customers cannot claim a stale score without also showing the current exposure.
- The traffic-light derivation gives executive consumers a legible three-state summary without collapsing the underlying six-level detail.

### Negative

- Some adopters will resist the five-dimensions-cannot-be-disabled rule. A target with no persistent data (e.g., a stateless compute service) may argue Data Integrity is not applicable. The design position is that this rigidity is a feature — cross-target comparability requires a fixed floor. Targets that genuinely cannot be scored on a critical dimension will show as unassessed (L0) rather than "disabled," which correctly signals that the dimension has not been evaluated.
- The 90-day catalog-bump notice window slows the framework's response to threat-landscape evolution. This is deliberate; the alternative (immediate scorecard update on any catalog change) creates the customer-trust landmine the reviewer flagged. Field-falsification exception at 72 hours preserves rapid response for high-urgency events.
- Dual-number rendering complicates the "single glance answer to is-my-software-safe" ambition. Executives now see two numbers, not one. The design position is that this is honest — the single-number ambition assumed a static threat landscape, which is false.

### Neutral

- The v0 SCORECARD document requires substantive revision in v0.1 to reflect this ADR. Multiple sections change: Purpose, Rendering, Configuration, Historical trajectory, and the relationship-to-eos section (as adjusted by ADR-0008).

## References

- [`../../methodology/SCORECARD.md`](../../methodology/SCORECARD.md) — the scorecard model, revised in v0.1.
- ADR-0008 — L3 native attainability. Both ADRs revise SCORECARD substantively; together they define the v0.1 scorecard.
- Claude cross-LLM review of v0, findings P1-3A (retroactive catalog vs public number), P2-4 (operator-configurable headline).
