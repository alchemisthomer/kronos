# Autonomous authorization — the two-tier envelope model

> Humans sign the envelope. Machines sign invocations within it. Legally binding consent operates at envelope granularity, not at every action. This preserves both operational autonomy and legal-liability integrity.

## Purpose

Kronos's v0/v0.1/v0.2/v0.3 authorization model relies on human signatures per engagement — the approver signs the §2 authorization artifact, the operator signs runs, the safety officer signs incident-state waivers. Gemini's cross-LLM review flagged the tension: a framework designed to evaluate systems that increasingly aspire to autonomous operation (up to and including "zero human employees" targets) cannot itself require a human signature for every continuous-plane evaluation or every engagement invocation. Human-in-the-loop at that granularity is a bottleneck that eliminates the framework's utility for the very targets it should be evaluating.

The reconciliation is that **legally binding consent does not need to operate at the same granularity as operational execution**. A human establishes the envelope of what a machine identity is empowered to authorize; the machine authorizes specific actions within that envelope; the framework structurally refuses actions that exceed the envelope. Legal liability provenance flows through the envelope — every machine-signed authorization traces back to a human-signed standing authorization that a specific human legally consented to.

## Two-tier structure

### Tier 1 — StandingAuthorization (human-signed)

The legally binding consent artifact. Signed by a human authorizer with genuine legal capacity to bind the organization on the target's behalf. Long-lived and revocable.

```yaml
kind: kronos-standing-authorization
apiVersion: v1
metadata:
  standing_authorization_id: SA-2026-000042
  issued_at: 2026-07-24T15:00:00Z
  expires_at: 2027-07-24T15:00:00Z              # typical: 6-12 months, renewable
  issued_by:
    human_identity: <identity>
    role: legal_or_business_authorizer
    signature: <GPG or equivalent>
  legal_capacity_attestation: |
    Signer affirms legal capacity to bind <organization> for the actions
    delegated below, and legal capacity to accept liability for actions
    executed by the machine identities named below within the declared envelope.

envelope:
  # Structural bounds on what machine identities may autonomously authorize
  # under this standing authorization. Machine-issued authorizations that
  # exceed any of these bounds are refused by the framework.
  targets:
    - target_slug: olympus-grid
      hostnames: [api-int.example.com]
      cloud_accounts: [aws:111122223333]
      environments: [staging, production]
  impact_class_ceiling: I1                       # continuous plane: passive + non-mutating active
  environment_class_ceiling: E4                  # includes production for passive/I1
  executor_assurance_class_minimum: X2           # hardened isolated worker required
  time_of_day_restrictions:
    - allow: always                              # or business_hours, off_hours, etc.
  activity_scope:
    - continuous_plane_all                       # all continuous evaluations authorized
    - engagement_impact_class_i0_i1              # I0 and I1 engagements only
  spending_cap_per_day_usd: 100
  spending_cap_per_engagement_usd: 25
  evidence_retention_obligation: 24_months
  data_class_preservation:
    always_enforced: true                        # standing authorization CANNOT waive; waivers remain human-per-invocation
  chain_of_authorization_third_parties:
    - party: aws
      account_id: 111122223333
      resource_classes_allowed: [cloudwatch_read, ec2_describe, cost_explorer_read]
      resource_classes_refused: [ec2_terminate, iam_modify, cloudfront_create]

delegated_machine_identities:
  - machine_identity_id: MI-kronos-continuous-plane-01
    public_key: <base64 hardware-backed key>
    attestation:
      hardware_root: aws-nitro-enclave
      attestation_document_hash: sha256:...
      attestation_verified_at: 2026-07-24T15:00:00Z
    key_rotation:
      policy: automatic_90_days
      grace_period_days: 7
    authorized_activities:
      - continuous_plane_all
    per_action_signature_required_above:
      impact_class: I2                           # machine can sign I0-I1 unilaterally; I2+ requires human co-sign
  - machine_identity_id: MI-kronos-engagement-runner-01
    public_key: <base64>
    attestation: {as above}
    authorized_activities:
      - engagement_impact_class_i0_i1
    per_action_signature_required_above:
      impact_class: I2

revocation:
  revocation_channel: <URL or process for immediate revocation>
  revocation_authorized_by: [human_authorizer, safety_officer]
  auto_revoke_on:
    - security_incident_declared
    - key_compromise_suspected
    - spending_cap_exceeded_by_1.5x

audit:
  ledger_location: <target>/kronos/authorization-ledger/
  auditor_read_access: [external_auditor_role]
```

### Tier 2 — MachineIssuedAuthorization (machine-signed, envelope-bounded)

The per-engagement or per-evaluation authorization issued by a machine identity within its standing envelope. Short-lived; scoped to a specific action.

```yaml
kind: kronos-machine-issued-authorization
apiVersion: v1
metadata:
  authorization_id: MIA-2026-07-24-000173
  issued_at: 2026-07-24T15:30:12Z
  expires_at: 2026-07-24T16:30:12Z              # typical: hours to days, not weeks
  issued_by:
    machine_identity_id: MI-kronos-continuous-plane-01
    signature: <ed25519 signature by hardware-backed key>
  derives_from:
    standing_authorization_id: SA-2026-000042    # required — every MIA traces to an SA
    envelope_compliance_verified: true            # framework re-verifies before invocation

action:
  activity: continuous_plane_evaluation
  target:
    target_slug: olympus-grid
    scope: {specific subset within standing envelope}
  impact_class: I0                               # must be within standing envelope ceiling
  execution_policy: passive
  impact_budget: {inherited from standing SA spending caps + activity defaults}

self_attestation:
  policy_compliance_statement: |
    This machine identity attests that the action authorized above is within
    the envelope of StandingAuthorization SA-2026-000042 issued and signed
    by <human authorizer identity>. This machine signature is a policy-
    compliance attestation, not independent legal consent. Legal liability
    for this action flows through the referenced StandingAuthorization to
    its human signer.
  liability_ownership: <human_authorizer identity from standing>
```

Every machine-issued authorization is written to the target's authorization ledger with its full trace. Auditors can inspect any machine-issued action, follow the standing reference, and identify the human who consented to the envelope.

## Authorization escalation ladder

The framework structurally enforces escalating authorization requirements by impact class:

| Impact class | Continuous plane | Engagement plane |
|---|---|---|
| I0 (passive) | Machine-issuable within envelope | Machine-issuable within envelope |
| I1 (non-mutating active) | Machine-issuable within envelope | Machine-issuable within envelope |
| I2 (bounded reversible mutation) | Not permitted for continuous plane | Machine prepares, human signs per invocation |
| I3 (disruptive/destructive) | Not permitted | Human signs per invocation; standing authorization must explicitly enumerate this activity |
| I4 (irreversible or human-impacting) | Not permitted | Human signs per invocation; separation of duties enforced (two distinct humans) |

The framework refuses machine-issued authorizations at impact class > the machine identity's `per_action_signature_required_above` field. Machine identities can be scoped narrowly (`impact_class: I0`-only) or broadly (`impact_class: I0-I2`), but the ceiling cannot exceed the standing envelope's impact-class ceiling.

## Incident-state waivers remain human-only

Under ADR-0009, `dataClassPreservation: waived` requires an additional signature beyond the standard approver signature to prevent operator error under duress. In the v0.4 autonomous model, **this mechanism remains human-only.**

- Standing authorizations cannot pre-authorize `dataClassPreservation: waived`. The `data_class_preservation.always_enforced: true` field in the standing envelope is not overridable by machine identity.
- Machine-issued authorizations that attempt to waive data-class preservation are refused by the framework at issuance time.
- A waived flow requires a fresh human signature (per ADR-0009's original design) regardless of what machine identities have been delegated.

The rationale is preserved: the waiver mechanism exists specifically to prevent duress-triggered destructive actions. Delegating it to a machine identity would eliminate its purpose.

## Revocation and expiry

- **Human authorizer revokes standing authorization** → propagates immediately to all outstanding machine-issued authorizations derived from it; in-flight engagements are halted.
- **Machine identity individually revoked** (compromise suspected, retirement) → that identity's outstanding authorizations are invalidated; other machine identities and other standing authorizations are unaffected.
- **Standing authorization reaches `expires_at`** → machine identities lose delegation; existing in-flight actions complete under their existing authorization but no new actions can be issued. Renewal requires a fresh human signature.
- **Key compromise detected** → framework's revocation system auto-revokes the affected machine identity via the standing's `auto_revoke_on` triggers.

## Cryptographic identity requirements

Machine identities must use hardware-backed cryptographic keys with attested provenance. Acceptable backing:

- Hardware security module (HSM) — traditional dedicated hardware.
- TPM 2.0 — trusted platform module on the running host.
- Cloud KMS with attestation (AWS KMS + Nitro Enclaves attestation, GCP Cloud KMS + Confidential Space attestation, Azure Managed HSM + attested VMs).
- Physical hardware tokens (YubiKey, etc.) — acceptable for machine identities that operate at low volume with human proximity.

Software-only keys are not acceptable for machine identities in the v0.4 autonomous model. The framework refuses to register a machine identity without attestation.

## Audit chain — end-to-end

Every action executed by kronos under this model has an auditable chain:

1. **Human legal consent** → StandingAuthorization signed by legal_or_business_authorizer.
2. **Standing authorization** → registered in target's authorization ledger; auditors have read access.
3. **Machine identity registration** → machine identity's hardware attestation captured in standing authorization at issue time.
4. **Machine-issued authorization** → derived from standing; verified within envelope; signed by hardware-backed machine key; captured in authorization ledger with reference to standing.
5. **Action execution** → runs the authorized challenge; produces evidence per EVIDENCE.md; execution provenance manifest references the machine-issued authorization.
6. **Evidence chain** → machine-issued authorization + standing authorization + human identity are all inspectable from any evidence artifact.
7. **Liability attribution** → traces from evidence artifact back through the machine-issued authorization to the standing authorization to the human signer.

At every point in the chain, an auditor can verify: what action was taken, under what authorization, derived from which envelope, consented to by which human, with which spending cap, under which retention obligation.

## What this reduces human involvement to

The autonomous model reduces human involvement in kronos operation to the following minimum set:

- **Standing authorization issuance and renewal** — typically once per 6-12 months per machine identity per target.
- **Standing authorization revocation** — on demand, when required.
- **I2+ engagement per-invocation approval** — for each active mutation-capable challenge.
- **I3+ engagement per-invocation approval** — for each destructive challenge.
- **Incident-state waivers** — for each panic-mode data-class-preservation waiver.
- **Machine identity registration and rotation** — periodically per the standing's rotation policy.
- **Auditor review of the authorization ledger** — periodically per the target's audit cadence.

Continuous plane operation and I0-I1 engagements can operate entirely machine-authorized within envelope.

## What this honestly does not achieve

The autonomous model does not enable "zero human employees" for high-impact operations. Some threshold of human involvement remains structurally required — the standing authorization must be issued by a human with legal capacity; I3+ engagements cannot be machine-authorized under any circumstance; incident-state waivers remain human-only. These constraints reflect intrinsic properties of legal consent semantics, not framework limitations.

The framework's design position is that this residual human involvement is not a bug. Legally binding consent for actions that could disrupt production, destroy data, or affect humans requires a legal person to consent. Cryptographic protocols cannot substitute for legal consent; they can only preserve its provenance across delegation.

Targets that aspire to fully-autonomous operation should scope their aspirations to the I0-I1 activity space where machine authorization is genuinely sufficient. Aspirations to fully-autonomous destructive operation without human involvement are, in the framework's view, aspirations to eliminate legal accountability, which is not a technical problem kronos can solve.

## Migration from v0.3

Targets currently using human-signed engagement authorizations continue to work — the v0.3 authorization artifact is a special case of a machine-issued authorization where the machine identity is null and the human signature stands alone. Migration to autonomous authorization is optional and per-target:

1. Issue a StandingAuthorization naming the human authorizer and the machine identities that will operate under it.
2. Configure the target's machine identities in the standing authorization with their attestations.
3. Enable machine issuance for continuous plane and I0-I1 engagements.
4. Continue human signature for I2+ engagements and incident-state waivers.

The v0.3 authorization schema remains supported as the human-signed path within the v0.4 model.
