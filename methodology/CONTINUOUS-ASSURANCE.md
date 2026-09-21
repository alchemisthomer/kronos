# Continuous assurance plane

> The founding incident of 2026-07-17 was not an intrusion. It was a contradiction between provider-reported billing, observed inventory, pricing mechanics, quotas, and physical capacity. A framework that only runs episodic engagements would not have caught it. The continuous assurance plane is the first-class runtime that does.

## Purpose

Kronos operates two peer execution planes. The **engagement plane** runs explicitly authorized interventions on demand — diagnostic control challenges, red-team scenarios, fault injections, load tests. The **continuous assurance plane** runs passive and low-impact evaluations on schedule or event trigger — the reconciliation and drift checks that catch the class of failure the founding incident revealed. Both planes share the same domain-model primitives (claim, challenge, plan, run, observation, oracle result, finding, score snapshot) but they have different lifecycles, different authorization envelopes, and different sales models.

This distinction was missing from the v0 design and was flagged by ChatGPT's cross-LLM review as the single most important architectural correction. The plausibility monitor added in v0.1 is one component of the continuous plane; this document specifies the full plane.

## Naming

The continuous plane's runtime component may be referred to as **Kronos Sentinel** or **Kronos Reconciler** in operator-facing and marketing contexts. Both names are appropriate; the underlying software artifact is a single scheduled/event-triggered coordinator.

## Challenge as parent abstraction

Because the continuous plane runs many evaluations that are not adversarial (physical-plausibility computation, cost/inventory reconciliation, control drift detection), the word "attack" is too narrow for the framework's parent abstraction. Kronos adopts **challenge** as the parent term. An attack is one kind of challenge. Formally:

```
Challenge (parent abstraction)
├── passive-observation             — collect a signal without perturbing the target
├── invariant-evaluation            — compute whether a declared invariant currently holds
├── cross-source-reconciliation     — compare two independent sources for consistency
├── diagnostic-probe                — actively probe a specific defense to observe its response
├── fault-injection                 — inject a controlled fault into the target's dependencies
├── adversarial-simulation          — execute a red-team scenario against the target
└── tabletop                        — human-facilitated scenario walkthrough with recorded verdict
```

The first three subtypes are the primary residents of the continuous plane. The last four are primarily engagement-plane subtypes. Some (diagnostic-probe) legitimately live in both planes with different authorization envelopes.

The v0.1 documents' use of "attack" is retained where the challenge is specifically an adversarial simulation or fault injection. Elsewhere, prefer "challenge."

## The continuous plane's residents

The following continuous evaluations are recognized as first-class:

**Cost-and-inventory reconciliation.** Compare provider-reported cost against declared and observed infrastructure inventory, adjusted by pricing model and physical capacity bounds. This is the specific evaluation whose absence produced the founding incident. Implemented by the plausibility monitor described in [PLAUSIBILITY-MONITOR.md](PLAUSIBILITY-MONITOR.md).

**Resource-count-versus-quota reconciliation.** Compare observed resource counts against declared quotas. Values exceeding quota indicate quota misconfiguration or accounting error; values within quota but exceeding declared baseline indicate resource proliferation.

**Usage-versus-physical-throughput reconciliation.** Compare observed throughput (bytes, requests, transactions) against physical throughput bounds derived from the capacity model. Observations exceeding bounds indicate meter error, undisclosed infrastructure, or account compromise.

**Billing-unit and price reconciliation.** Compare invoiced amounts against expected values derived from observed usage × declared pricing model. Divergence indicates pricing model drift, billing pipeline defect, or hidden charges.

**Cross-region and cross-account inventory completeness.** Ensure inventory enumeration covers all authorized regions and accounts. Enumeration returning zero from a region known to contain resources is itself a finding (the founding-incident scanner-bug class).

**Pagination and API-error completeness.** For any enumeration call that supports pagination, verify all pages were fetched. For any enumeration call that could return partial results due to rate-limiting or timeout, verify complete iteration. Silent truncation is a finding class.

**Control drift detection.** Compare currently-observed control configuration against last-attested configuration (from the target's eos cycle folder if co-installed, or from the operator's declared baseline). Configuration divergence is a finding.

**Catalog-delta impact analysis.** When a new catalog entry is added or an existing entry is revised, evaluate whether the target's current scorecard is affected. New entries whose applicability predicates match trigger a "coverage gap" finding until the target runs a diagnostic against the new entry.

**Evidence freshness and expiration.** Track the age of each shipped engagement's evidence. Evidence older than its declared expiration (in the engagement's §3 rules-of-engagement) triggers a "stale evidence" finding; the affected scorecard cell degrades accordingly.

**Alert-channel and kill-switch health.** Periodically exercise the target's declared alerting and kill-switch mechanisms without triggering false operational responses. Verify that an alert would be delivered and a kill-switch would fire. Silent failure of these mechanisms is a critical finding.

The above is not exhaustive. Additional continuous evaluations are added over time as the framework matures and as adopters contribute domain-specific reconciliations.

### Backbone-resilience reconciliations (v0.4 per Gemini review)

For targets whose backbone depends on a shared platform (Salesforce, cloud vendor APIs with tenant-wide limits, third-party SaaS with account-wide quotas), the continuous plane's own load must be structurally bounded to avoid degrading the primary application it is evaluating. Reconciliations specifically designed for backbone resilience:

- **API concurrency reconciliation.** Observe API concurrency headroom on the target backbone (e.g., Salesforce API concurrent-request limit vs. currently-in-flight kronos-generated requests). Emit a finding if the framework's own consumption exceeds a declared fraction (default 10%) of the target's API concurrency budget.
- **Utility-bar and integration-boundary reconciliation.** For Salesforce targets where user-facing Lightning components share API bandwidth with backend integrations, observe utility-bar responsiveness during continuous-plane activity. Finding if p95 latency for user-facing components rises above declared SLO during kronos observation windows.
- **Daily execution quota reconciliation.** Observe daily API call counts against tenant-wide daily limits (Salesforce daily API limit, cloud vendor rate quotas). Emit a finding when kronos-generated consumption is on trajectory to exceed a declared fraction (default 5%) of the daily budget.
- **Governor-limit reconciliation.** For Salesforce and similar platforms with governor limits (SOQL rows queried per transaction, DML statements per transaction, callouts per transaction, heap size), observe governor-limit consumption from kronos-invoked Apex against per-transaction budgets.
- **Cost budget reconciliation.** Beyond the general plausibility-monitor cost check, specifically reconcile kronos's own AWS/cloud cost consumption against a declared kronos budget line item. Findings when kronos itself becomes a material cost driver.

### Framework self-throttling

Continuous plane implementations MUST support self-throttling. The framework's coordinator observes:

- **Target-side latency signals** — target endpoint p50/p95/p99 during kronos activity windows.
- **Backbone quota consumption** — as declared in the target's capacity model.
- **Cost velocity** — kronos's own cost accumulation per hour.

When any of these approach declared safety thresholds, the coordinator throttles its own request rate proportionally. Under sustained pressure, the coordinator pauses continuous-plane activity entirely and emits a `framework-self-throttled` observation. Human operators are alerted per the target's alerting configuration.

The framework structurally guarantees that continuous plausibility monitoring and reconciliation checks do not degrade primary application performance. If the framework cannot maintain this guarantee for a given target's declared capacity, the framework refuses to run the continuous plane against that target and requires the operator to either (a) raise the target's declared capacity, (b) reduce kronos's declared budget within it, or (c) run kronos in engagement-only mode without the continuous plane.

## Lifecycle

The continuous plane operates in one of three cadences per evaluation:

- **Continuous** — the evaluation subscribes to a stream of observations (CloudWatch metric stream, provider billing feed, config event stream) and evaluates each observation as it arrives. Lowest latency; requires infrastructure to subscribe. Best for high-value or high-volatility evaluations.
- **Scheduled** — the evaluation runs on a cron cadence, polls the observable source, and evaluates the aggregate over the poll window. Trades latency for infrastructure simplicity. Best for the majority of continuous evaluations.
- **Event-triggered** — the evaluation runs when a specific event is observed (a new engagement closes, a new catalog entry is promoted, a config change is detected). Best for cross-plane integration.

The kronos MVP ships scheduled cadence as the reference implementation, with continuous cadence deferred to a later phase.

## Authorization for the continuous plane

Continuous-plane evaluations require an authorization artifact separate from any engagement's authorization. The continuous authorization declares:

- **Target scope** — which targets the continuous plane is authorized to observe.
- **Observation-source access** — which read-only credentials are granted to enable the evaluation (Cost Explorer read, CloudWatch read, config inventory read).
- **Evaluation catalog** — which continuous evaluations are enabled for this target.
- **Cadence** — the scheduled/continuous/event-triggered cadence for each enabled evaluation.
- **Finding-emission scope** — where continuous-plane findings are written (target's `kronos/findings/plausibility/`, `kronos/findings/drift/`, etc.).
- **Alerting** — for each finding class, whether the plane emits an alert (SNS, email, ticketing system).
- **Runtime constraints** — max concurrent evaluations, max API request rate per source, cost ceiling.

The continuous authorization has a longer default duration (typically 1 year renewable) than engagement authorizations (typically 24 hours to 30 days). It is passive by default (impact class I0 or I1 only); continuous evaluations that would require I2+ actions are refused by the plane's authorization gate and must be run as engagements.

## Findings emitted by the continuous plane

Findings emitted by the continuous plane follow the same finding schema as engagement findings (see DOMAIN-MODEL.md), with two distinctions:

- **Source field.** Continuous-plane findings have `source: continuous-plane:<evaluation-id>` rather than `source: engagement:<engagement-id>:attack:<attack-id>`.
- **Interpretation discipline preserved.** Continuous findings report observations. They do NOT assert causes. A cost/inventory discrepancy finding reports "$76B in EC2-Other observed; capacity model bound is $0; discrepancy is 10^N standard deviations." It does not assert "billing pipeline defect" or "compromise" or "operator drift." Interpretation is deferred to human investigation, consistent with the founding-incident lesson.

## Scorecard integration

Continuous-plane findings feed the target's scorecard alongside engagement findings, with the following mapping:

- **Cost Integrity dimension** — primarily fed by cost/inventory reconciliation, billing-unit reconciliation, usage-throughput reconciliation.
- **Observability dimension** — primarily fed by alert-channel and kill-switch health, evidence freshness.
- **Data Integrity dimension** — fed by pagination/completeness checks against data pipelines.
- **Perimeter Defense, Identity & Access Control, Secret Management** — fed by control drift detection.
- **Compliance Posture** — fed by declared-vs-actual configuration comparisons.

The continuous plane's findings can lower a scorecard cell's effectiveness state without an engagement running. The scorecard's dimensional-state model (see SCORECARD.md v0.2) distinguishes maturity from effectiveness so that a continuous-plane finding degrading effectiveness does not erase the target's documented process maturity.

## Integration with the engagement plane

The two planes share primitives but do not depend on each other:

- **Engagement plane runs standalone.** A target can adopt kronos with only the engagement plane, running scheduled engagements against its declared claims. No continuous plane is required.
- **Continuous plane runs standalone.** A target can adopt kronos with only the continuous plane, receiving reconciliation findings without ever running an active engagement. This is the lowest-commitment adoption path.
- **Both planes together.** A target with both planes gets the strongest posture. Continuous findings can trigger engagement planning (a control-drift finding may prompt a scheduled re-verification engagement); engagement findings can update the continuous plane's baseline (a shipped remediation updates the drift detector's expected configuration).

The two planes never compete for authorization. Each has its own authorization artifact with its own scope.

## Why this correction matters

Absent the continuous plane, kronos is a red-team framework with a well-formed methodology and a good scorecard. That is a valuable but bounded product. With the continuous plane as a peer, kronos becomes a **claim-centric assurance control plane** that continuously reconciles system claims against observed reality — a materially broader product category, and one whose fit with the founding incident is much tighter than a red-team framework's fit.

The founding incident would have been caught by the continuous plane's cost/inventory reconciliation running on a four-hour cadence. It would not have been caught by any engagement, because there was no adversary to simulate.
