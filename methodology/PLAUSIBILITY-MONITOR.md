# Plausibility monitor — capacity model and continuous impossibility check

> An observed value is physically impossible if the modeled infrastructure cannot produce it. The plausibility monitor is the primitive that computes this determination continuously and emits findings when observation exceeds physical bounds.

## Purpose

The plausibility monitor is the runtime primitive that would have caught the founding incident within hours instead of five days. It is categorically distinct from the attack oracle: an **attack oracle** is a per-attack deterministic evaluator that answers "did this specific probe succeed?" A **plausibility monitor** is a continuous background computation that answers "is this observed value physically achievable by the modeled infrastructure?"

The distinction is load-bearing. An observed cloud bill of $131,831,457,005.91 is not the result of any attack in any threat catalog. No attack oracle would flag it. But a plausibility monitor comparing the observed cost against the declared infrastructure's physical capacity would flag it in a single evaluation cycle: an AWS account with zero NAT gateways cannot generate $76.5 billion in NAT-gateway data-processing charges, because the physical throughput required (approximately 120 petabytes per day) cannot be produced by nonexistent infrastructure.

The plausibility monitor operates over observables that have physical bounds derivable from a capacity model: cost, byte count, request rate, resource count, transaction count, storage volume, egress volume, credential-use count, and similar. It does not attempt to evaluate observables whose bounds are not physically derivable (semantic correctness, business-rule adherence, user-intent alignment).

## The capacity model

The capacity model is the operator-authored (or observed-and-inferred) mapping from the target's declared infrastructure to the physical bounds each resource class can produce. It is a first-class methodology artifact, committed to the target's repository at `<target>/kronos/capacity.yaml`, versioned in git alongside the engagement kanban.

### Schema

```yaml
kind: kronos-capacity-model
apiVersion: v1
metadata:
  target: <target-slug>
  version: 2026.07.24
  source: declared     # declared | observed | hybrid
  authored_by: <operator-identity>
  attested_by: <optional eos cycle reference>

infrastructure:
  # For each declared resource, the physical bounds it can produce.
  nat_gateways:
    count: 0            # declared count
    max_gbps_per_gateway: 45
    max_bytes_per_gateway_per_day: 486_000_000_000_000   # 486 TB (0.486 PB)
    aggregate_max_bytes_per_day: 0                        # count × max
  ec2_instances:
    count: 1
    running_count: 0
    aggregate_max_vcpu_seconds_per_day: 0
  lambda:
    concurrent_limit: 0
    max_invocations_per_second: 0
    max_gb_seconds_per_day: 0
  s3_buckets:
    count: 34
    aggregate_max_get_requests_per_day: 3_400_000_000     # 100M/bucket cap
    aggregate_max_put_requests_per_day: 3_400_000_000
  cloudfront_distributions:
    count: 14
    aggregate_max_requests_per_day: 1_400_000_000_000

observables:
  # For each observable class, the source of truth and the bound formula.
  cost.ec2_other_usd_per_day:
    source: aws.cost_explorer.ec2_other
    physical_bound: nat_gateways.aggregate_max_bytes_per_day * 0.045      # $0.045/GB
    tolerance_multiplier: 2.0                                              # allow 2x for pricing surprise
  cost.cloudwatch_usd_per_day:
    source: aws.cost_explorer.cloudwatch
    physical_bound: aggregate_log_ingestion_bytes_per_day * 0.50           # $0.50/GB ingestion
  traffic.nat_gateway_bytes_per_day:
    source: aws.cloudwatch.NATGatewayBytes
    physical_bound: nat_gateways.aggregate_max_bytes_per_day
  requests.api_gateway_per_second:
    source: aws.cloudwatch.APIGatewayCount
    physical_bound: api_gateway.throttle_limit * seconds_per_day

triggering:
  # When the monitor emits findings.
  observed_over_bound_by_multiplier: 10.0     # observed > bound × 10 → finding
  observed_over_bound_when_bound_zero: any   # observed > 0 when bound = 0 → finding (the July 17 case)
```

### Source: declared vs observed vs hybrid

- **Declared.** The operator authors the capacity model by hand, listing declared infrastructure and per-resource bounds. Suitable for small targets and for authoritative "this is what we intended" declarations. Divergence between declared and reality is itself a finding class (drift detection).
- **Observed.** A kronos discovery scan enumerates the target's actual infrastructure (via cloud-provider APIs for cloud targets, via configuration inspection for on-premises targets) and infers bounds from resource inventory. Suitable for targets whose declared model is unavailable or unmaintained. Observations require the same paranoid enumerator sanity cross-check as any other framework enumeration (see TOOL-BINDING §Enumeration reconciliation).
- **Hybrid.** The operator declares intent; the observer confirms. Divergence is reported. This is the recommended mode for mature targets.

### Bounds derivation examples

The capacity model's per-resource bounds are derivations from published vendor specifications and pricing. Examples:

- **NAT gateway.** AWS NAT Gateway supports up to 45 Gbps of throughput per gateway (documented). Bytes per day: 45 Gbps × 86,400 s/day × (1 GB / 8 bits) ≈ 486 TB per day per gateway. Multiply by count. If count is zero, bound is zero.
- **Lambda concurrency.** Lambda's default account-level concurrent-execution limit is 1,000 (can be raised on request). Bound = concurrent_limit × max_duration_seconds × invocations_per_slot_per_second.
- **CloudFront requests.** CloudFront distributions have no hard request cap but pricing constrains practical bound. Bound = distribution_count × requests_per_second_per_distribution × 86,400.
- **S3 requests.** S3 supports 3,500 PUT/COPY/POST/DELETE per prefix per second and 5,500 GET/HEAD per prefix per second. Bound = bucket_count × prefix_count × per_prefix_limit × 86,400.

The framework will ship a reference set of bound derivations for common cloud resources (AWS, Azure, GCP) in a versioned bounds library. Adopters extend the library with target-specific bounds for private infrastructure.

## The monitor's lifecycle

The plausibility monitor runs in one of three cadences per observable:

- **Continuous** — the monitor subscribes to a stream of observations (CloudWatch metric stream, provider billing feed) and evaluates each observation as it arrives. Lowest latency; requires operator infrastructure to subscribe.
- **Scheduled** — the monitor runs on a cron, polls the observable's source, and evaluates the aggregate over the poll window. Trades latency for infrastructure simplicity.
- **On-demand** — the monitor runs when triggered manually or by an engagement's execution log. Useful during and after active engagements to confirm no plausibility-boundary was crossed.

The kronos MVP ships scheduled mode as the reference implementation (cron-driven poll of the observable source, one evaluation per poll window). Continuous mode is deferred to a later phase; on-demand mode is a manual trigger from the runner.

## Findings from the monitor

When the monitor determines that an observed value exceeds its physical bound (adjusted by tolerance multiplier), it emits a finding using the same finding schema as attack-oracle findings. The finding's `source` field is `plausibility-monitor` rather than an attack ID; otherwise the finding shape is identical.

Example finding:

```markdown
---
finding_id: F-2026-07-17-001
source: plausibility-monitor
observable: cost.ec2_other_usd_per_day
observed_value: 25_770_000_000_00     # $25.77 billion in one day
physical_bound: 0
bound_source: capacity.nat_gateways.aggregate_max_bytes_per_day=0 → cost.ec2_other bound=0
severity: critical
target: <target-slug>
detected_at: 2026-07-17T07:15:00-07:00
capacity_model_version: 2026.07.24
---

# Cost observation exceeds physical bound by infinite ratio

## Summary

The target's declared infrastructure contains zero NAT gateways. AWS Cost Explorer
reports $25,770,000,000 in EC2-Other charges on 2026-07-10. EC2-Other charges are
predominantly NAT gateway data-processing costs; the physical bound for these
charges given the declared infrastructure is $0.

## Reproduction

1. Query AWS Cost Explorer for account <target-slug> daily EC2-Other cost.
2. Query the target's capacity model at kronos/capacity.yaml for
   nat_gateways.count.
3. If Cost Explorer value > 0 and capacity model count = 0, the finding
   is reproducible.

## Interpretation

The observed value is physically inconsistent with the modeled infrastructure.
Interpretation of the underlying cause requires human investigation. Possible
causes include: cloud-provider billing pipeline defect (empirically observed
2026-07-17 for this target), undisclosed infrastructure not in the capacity
model, account compromise producing hidden infrastructure, or capacity-model
drift (declared count is stale). The plausibility monitor reports the
observation; the operator determines the cause.

## Suggested remediation

Open a support case with the cloud provider. Re-run infrastructure discovery
scan to confirm the capacity model matches reality. Check CloudTrail for
recent infrastructure changes.
```

Note the epistemic discipline. The finding reports the observation and its physical inconsistency. It does NOT assert the cause (billing defect, compromise, drift). The interpretation is deferred to human investigation — the same interpretation discipline that separates the attack oracle from LLM narrative in the runtime primitives.

## Distinction from attack oracle

| Aspect | Attack oracle | Plausibility monitor |
|---|---|---|
| Trigger | Per-attack invocation in engagement | Continuous or scheduled |
| Input | Attack execution evidence | Observable stream |
| Determination | Did the specific attack succeed? (PASS/FAIL/INCONCLUSIVE) | Is observation within physical bounds? (WITHIN/EXCEEDS/UNKNOWN) |
| Persistence | Runs during engagement | Runs indefinitely |
| Emits | Finding per failed oracle | Finding per bound-exceeding observation |
| Requires | Engagement authorization | Capacity model + observation source access |
| Scorecard impact | Attack coverage → maturity dimensions | Cost Integrity + Observability dimensions primarily |

Both are first-class runtime primitives. Neither replaces the other; both feed the same finding schema and scorecard model.

## Integration with the engagement discipline

Plausibility monitors run outside the engagement lifecycle. They do not require an engagement to be open. They do require:

1. An **authorization artifact** at the target scope declaring the monitor's data-access permissions (read cost data, read metric streams, read infrastructure inventory).
2. A **capacity model** at `<target>/kronos/capacity.yaml` giving the bounds against which observations are evaluated.
3. **Observation source access** — cloud-provider API credentials, metric-stream subscriptions, or scheduled poll access.

Findings from the plausibility monitor are committed to `<target>/kronos/findings/plausibility/` alongside engagement findings. The scorecard reads both sources when computing dimension maturity.

## Configuration for the reference implementation

For the olympus-616 reference implementation, the capacity model lives at `olympus-616/foundation/kronos/capacity.yaml`. The monitor is scheduled to run every four hours against AWS Cost Explorer for the target account. Findings land at `olympus-616/foundation/kronos/findings/plausibility/YYYY-MM-DD-<hash>.md`. The Cost Integrity scorecard dimension is fed primarily by the plausibility monitor's outputs.

Had this monitor existed on 2026-07-17, the first phantom-charge day (2026-07-10, $25.77 billion in EC2-Other against a capacity model bound of $0) would have generated a critical finding within four hours of the observation appearing in Cost Explorer. The operator's launch-day cascade would have been avoided.

## Open questions

**Q1. Bounds library maintenance.** The reference bounds library (AWS/Azure/GCP per-resource bounds) must be kept current as vendor limits change. Consider whether this is a community-contributed artifact or a vendor-partnership artifact.

**Q2. Semantic bounds.** Some observables have bounds that are not purely physical — a request rate against a rate-limited API is bounded by the API's rate limit, not by any physical property of the caller. Should the capacity model include declared rate-limits and API quotas alongside physical bounds?

**Q3. Cross-account bounds.** For targets that use multiple cloud accounts (a common pattern), the capacity model must span accounts. Consider whether the model schema needs a `scope: account | region | organization` field.

**Q4. Bound-derivation transparency.** For a finding to be independently verifiable, the third-party observer needs to be able to reproduce the bound derivation. The bounds library must be published with derivation formulas, not just numeric limits.

**Q5. Drift as a first-class finding.** When the capacity model's declared infrastructure differs from observed infrastructure (via a discovery scan), this itself is a finding class. Consider whether drift detection is a plausibility-monitor variant or a distinct primitive.
