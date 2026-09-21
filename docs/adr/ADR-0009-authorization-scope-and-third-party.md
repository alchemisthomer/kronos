# ADR-0009 — Authorization scope, incident-state discipline, and third-party chain-of-authorization

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The operator, Kronos scribe
- **Supersedes:** In-part supersedes TEMPLATE.md v0's §2 authorization schema and DESIGN.md v0's free-assessment framing
- **Superseded by:** None
- **Origin:** Claude cross-LLM design review of v0, findings P1-1 (part 3), P1-3 (part B), P2-6

## Context

The Claude review surfaced three related authorization gaps that the v0 design papered over rather than resolved:

**Gap A — Panic-mode authorization was rhetoric, not schema.** DESIGN.md §3 (implication #3) and SEVEN-CLAIMS §7 asserted that the authorization artifact would recognize a distinct incident-state that bumps teardown permissions while structurally preserving data-class resources "unless signed sober." TEMPLATE §2's authorization schema had no incident-state field, no data-class-preservation flag, and no sober-vs-duress distinction. The founding-incident's operator-error lesson had no home in the primitive.

**Gap B — Free assessment collided with the authorization gate.** SEVEN-CLAIMS §6 and DESIGN.md §6/§7 proposed "point kronos at a prospective customer's production system" in `first-signal-stop` mode as a customer-acquisition primitive. OPERATING-MANUAL asserted "the framework does not fire a single active probe without a signed authorization artifact." These collided: a prospect has by definition not yet signed an authorization; running any active probe against their production is unauthorized. The `first-signal-stop` mode bounds blast radius, not authorization. Unauthorized active testing of a third party's production system is a CFAA / computer-misuse exposure regardless of how gentle the probe is.

**Gap C — Third-party chain-of-authorization was deferred despite being required for engagement #1.** DESIGN.md §16 Q5 listed third-party authorization as an open question for future work. But the reference engagement (Scenario D — attacker-owned CloudFront distribution) requires creating a real CloudFront distribution on AWS as part of the attack. That is a third-party cloud-provider action on the operator's own AWS account, which requires acknowledgment of AWS's acceptable-use policy. The chain-of-authorization concept is load-bearing for engagement #1, not for a later phase.

The reviewer's directives for all three gaps: extend the authorization schema with structural mechanisms rather than rhetoric.

## Decision

The authorization artifact (TEMPLATE.md §2 schema) is extended with three new structural blocks.

### 1. Incident-state block

```yaml
incident_state:
  declared: false                          # true when engagement is authorized under declared incident conditions
  signed_sober: true                       # affirms authorization was signed outside duress
  data_class_preservation: enforced        # enforced | waived (waived requires signed_sober=true AND separate additional signature)
  data_class_resources:                    # explicit enumeration; framework refuses to modify these under declared incident
    - persistent_storage                   # S3 buckets, EBS volumes, EBS snapshots, RDS databases, DynamoDB tables
    - identity_records                     # IAM users, roles, groups (but not their credentials — credentials can be revoked)
    - dns_records                          # Route 53 zones and records
    - audit_logs                           # CloudTrail trails, log archives, evidence bundles
    - encryption_keys                      # KMS keys, secrets vault entries (not credentials — those are separate)
```

When `incident_state.declared: true` AND `data_class_preservation: enforced`, the framework structurally refuses to invoke any tool that would modify a resource of the enumerated data-classes, regardless of the tool's own declared capabilities. This is a hard runtime refusal, not a policy warning. Setting `data_class_preservation: waived` requires an additional signature beyond the standard approver signature — designed to make the "sign it in the middle of a panic to waive the preservation" path expensive enough to prevent operator error under duress.

When `incident_state.signed_sober: false`, the framework refuses to invoke tools at authorization ceilings ≥ 3 (destructive testing) regardless of other authorization fields. Duress-signed authorizations do not unlock destructive modes.

### 2. Chain-of-authorization block

```yaml
chain_of_authorization:
  # For engagements that require operating against a third party's infrastructure
  # (creating resources on cloud providers, sending traffic through third-party
  # networks, invoking third-party APIs), the chain of authorization is enumerated
  # explicitly. Each entry is a separate authorization that must resolve.
  third_parties:
    - party: aws
      account_id: <redacted-in-public-artifact>
      resource_classes_affected: [cloudfront_distribution, alb_target]
      acknowledgment: |
        Operator affirms that the actions authorized by this engagement fall
        within AWS Acceptable Use Policy and AWS Customer Agreement.
        Operator is the account holder or has written authorization from the
        account holder to execute the described actions.
      reference: aws-aup-2024-05
    - party: <other-third-party>
      ...
```

The chain-of-authorization block is required for any engagement whose attack matrix includes actions against resources on a third-party platform. The framework's `authorization-artifact-validator` action fails engagements whose attack matrix references third-party resource classes not declared in the chain.

This block does not create legal authorization the operator does not otherwise have — it makes the operator's affirmation of existing authorization structurally recorded and versioned in the engagement artifact. Chain-of-authorization is documentation, not delegation.

### 3. Prospect-scope authorization (replaces free-assessment framing)

The v0 design's "point it at a prospect's prod" free-assessment framing is dropped. It is replaced with an **onboarding-gated free assessment** flow:

1. The prospect enrolls their target explicitly. Enrollment produces a single-scope authorization artifact:
   ```yaml
   authorization:
     target: <prospect-target>
     scope: single-finding-first-signal-stop
     safety_ceiling: 1     # passive only
     duration: 24_hours
     signed_by: <prospect-authorized-signer>
     signature: <prospect-signature>
   ```
2. Only after this artifact is signed does kronos initiate the assessment.
3. The assessment runs in `first-signal-stop` mode with a severity threshold at critical or high (see ADR-0010 for severity-thresholded stop). The first finding at threshold ends the engagement and becomes the sales artifact.
4. The prospect receives the finding, the scorecard baseline, and an offer for a scoped engagement to remediate.

This flow preserves the commercial funnel (low-commitment entry point, sales artifact as free deliverable) without ever running unauthorized active probes. The barrier is a single-page authorization artifact that the prospect signs during onboarding — a lower friction than a traditional pen-testing engagement contract, but structurally an authorization.

The framework's `production-authorization-guard` action refuses any engagement targeting a third-party production environment without a valid prospect-scope authorization artifact.

## Consequences

### Positive

- The founding incident's operator-error lesson (panic-authorized destructive action against data-class resources) is now a structural gate, not a hopeful discipline.
- The commercial funnel's authorization exposure is closed. Every kronos active probe is under signed authorization, including free assessments.
- The reference engagement's third-party dimension (AWS CloudFront maneuver) has an authorization home. The engagement can be authored without appealing to a "future" concept.
- The `signed_sober` mechanism gives operators an explicit way to record that an authorization was made under panic conditions, and the framework structurally limits what such authorizations can permit. Duress-signed authorizations are still valid but limited.

### Negative

- Onboarding friction for free assessments is slightly higher than "click and probe" would be. The prospect must complete an enrollment flow, sign an artifact. This is deliberate; the reviewer's alternative was to route the whole free-assessment concept to legal counsel for review before any implementation, and the enrollment gate is the design-side answer.
- The chain-of-authorization block requires operators to enumerate third-party dependencies at engagement authoring time. This is real authoring cost, especially for engagements that touch multiple cloud providers or SaaS platforms.
- The `data_class_preservation` mechanism could be seen as paternalistic — the operator has to fight the framework to teardown data-class resources under declared incident. The design position is that this friction is a feature, not a bug; the founding incident is a specific documented case where the operator's own instruction under duress would have caused irreversible harm if the framework had complied.

### Neutral

- The authorization schema grows in complexity, but the complexity is optional for engagements that don't involve incident conditions or third-party resources. A simple engagement against the operator's own test environment can leave the two new blocks empty.

## References

- [`../../methodology/TEMPLATE.md`](../../methodology/TEMPLATE.md) §2 — updated authorization schema.
- [`../../methodology/OPERATING-MANUAL.md`](../../methodology/OPERATING-MANUAL.md) — updated environment discipline and mode declarations.
- [`../inception/00-founding-incident.md`](../inception/00-founding-incident.md) — the incident whose operator-error lesson motivated the incident-state block.
- Claude cross-LLM review of v0, findings P1-1 (data-class preservation gap), P1-3B (free-assessment authorization gap), P2-6 (third-party chain gap).
