# ADR-0003 — The kronos scorecard is the north-star artifact

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The Steward, Kronos
- **Supersedes:** None
- **Superseded by:** None

## Context

Kronos produces several classes of output: engagement documents, attack execution logs, oracle evaluations, findings, evidence artifacts, remediation recommendations, and scorecards. Any of these could be positioned as the primary artifact of the framework. The choice matters — it determines what the runner primarily renders, what an executive primarily reads, what a consulting engagement primarily delivers, and what a customer primarily pays for.

Prior adversarial testing tools have positioned different artifacts as primary. Vulnerability scanners position lists of findings ranked by severity. Pen-test firms position PDF reports summarizing engagement narrative. CSPM (cloud security posture management) tools position posture dashboards showing configuration compliance. Bug-bounty platforms position per-finding payout records.

None of these primary artifacts answer the executive-level question that motivates every conversation about security in a modern software organization: *"is my software safe?"* The lists of findings are engineer-level. The PDF reports are auditor-level and stale within a week. The posture dashboards conflate configuration presence with adversarial survival. The bounty records show what was found but not what was covered.

The Steward has explicitly identified the kronos scorecard as the artifact that answers this question — the *"logos of is this software safe, regardless of what software it is"* — and framed it as *"perhaps the most fundamentally important tool in all of reality"* in the design conversation of 2026-07-24.

## Decision

The kronos scorecard is designated as the north-star artifact of the framework. All other outputs — engagement documents, findings, evidence — exist to feed the scorecard.

Concretely:

1. **Every engagement produces a scorecard delta.** The delta is committed atomically with the engagement's findings. No engagement closes without a scorecard update. No scorecard update occurs without a corresponding engagement's evidence.
2. **The scorecard is the runner's primary view.** When an operator opens the kronos runner against a target repository, the first thing they see is the scorecard. The engagement kanban is a secondary view accessible from any cell of the scorecard.
3. **The scorecard is the commercial primitive.** A free-assessment engagement produces a baseline scorecard as the sales artifact. A paid engagement moves scorecard cells from red to green as its deliverable. A subscription engagement maintains scorecard cells at their target level over time.
4. **The scorecard is public by default when the target repository is public.** Public repos have public scorecards. Private repos have private scorecards. Access control is repository access control.
5. **The scorecard model itself is a first-class methodology artifact.** It lives at [`../../methodology/SCORECARD.md`](../../methodology/SCORECARD.md) alongside the operating manual, the seven claims, and the engagement template.

The scorecard is composed of four pillars, twelve dimensions, and six maturity levels. The load-bearing property — that L4 and L5 are only reachable via adversarial proof — is what distinguishes the scorecard from prior maturity models and makes it the correct primary artifact of a presumption-of-failure framework.

## Consequences

### Positive

- The framework has a coherent primary artifact that answers the executive question that motivates every security conversation. This is the single sentence a consulting practice needs to answer.
- The runner's primary view is well-defined: render the scorecard, drill down to findings, drill further to evidence. Design decisions cascade cleanly from this hierarchy.
- The commercial funnel is structural: free assessment → scorecard baseline → scoped engagement → scorecard delta → subscription. Each stage has an obvious deliverable.
- Historical trajectory is a natural additional view: walk the git history, recompute the scorecard at any prior state, render the time series. This falls out of the git-native evidence bus without additional infrastructure.
- The scorecard is the natural interface point with the operator's future consulting practice: assessments generate scorecards; scorecards drive roadmap proposals; roadmap execution produces scorecard deltas.

### Negative

- Elevating one artifact to north-star status risks under-investing in the others. The runner must render the scorecard well AND the engagement documents well AND the evidence trail well. All three are load-bearing; only one is primary.
- The scorecard's twelve dimensions are opinionated. Some adopters will disagree with the pillar structure. Configuration is possible (targets may disable dimensions or add extension pillars), but the canonical twelve are what the framework commits to and defends.
- The load-bearing property (L4/L5 requires kronos) will be contested by adopters who want top-level maturity claims without adversarial proof. The framework's response is that this is the whole point — a maturity claim that can be earned without adversarial proof is a claim that has not been earned.

### Neutral

- The scorecard model is versioned. Adopters pin their scoring against a specific catalog version and can defer catalog upgrades until they choose to re-pin. This preserves stability while allowing the framework to evolve.

## References

- [`../../methodology/SCORECARD.md`](../../methodology/SCORECARD.md) — the scorecard model definition.
- [`../../methodology/SEVEN-CLAIMS.md`](../../methodology/SEVEN-CLAIMS.md) — property 3 is the scorecard-as-adversarial-proof-unlock property.
- Design conversation of 2026-07-24 with the Steward, in which the scorecard was explicitly identified as the *"logos of is this software safe"* and the primary consulting artifact.
