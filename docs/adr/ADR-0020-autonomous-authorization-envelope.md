# ADR-0020 — Two-tier autonomous authorization with human-signed envelopes

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Origin:** Gemini cross-LLM review of v0.3, finding #1 + direct question on cryptographic workload identities

## Context

Gemini's cross-LLM review identified a genuine tension between the v0/v0.1/v0.2/v0.3 authorization model — which relies heavily on human signatures per engagement — and target architectures that aspire to autonomous operation. A framework that requires a human signature for every continuous-plane evaluation cannot practically evaluate the very targets whose autonomy it should be verifying.

The reconciliation is that legally binding consent does not need to operate at the same granularity as operational execution. Humans establish the envelope; machines authorize invocations within it.

## Decision

Kronos v0.4 adopts a two-tier authorization model:

**Tier 1 — StandingAuthorization** (human-signed, long-lived, envelope-establishing).
- Signed by a human authorizer with legal capacity.
- Establishes bounds: targets, impact class ceiling, environment ceiling, executor assurance floor, spending caps, time restrictions, activity scope, evidence retention obligations, revocation conditions.
- Names one or more machine identities as delegated authorizers.
- Registers each machine identity's hardware-backed public key with attestation.
- Long-lived (typically 6-12 months, renewable).
- Revocable at any time; revocation propagates to all derived authorizations.

**Tier 2 — MachineIssuedAuthorization** (machine-signed, envelope-bounded, per-action).
- Signed by a registered machine identity using its hardware-backed key.
- Must derive from a valid unexpired StandingAuthorization; framework refuses issuances that exceed envelope.
- Short-lived (hours to days per invocation).
- Machine signature is a policy-compliance attestation, not independent legal consent.
- Legal liability flows through the standing to the human signer.

**Escalating scrutiny by impact class:**

| Impact class | Continuous plane | Engagement plane |
|---|---|---|
| I0 (passive) | Machine-issuable within envelope | Machine-issuable within envelope |
| I1 (non-mutating active) | Machine-issuable within envelope | Machine-issuable within envelope |
| I2 (bounded reversible mutation) | Not permitted | Machine prepares, human signs per invocation |
| I3 (disruptive/destructive) | Not permitted | Human signs per invocation |
| I4 (irreversible or human-impacting) | Not permitted | Human signs per invocation, two distinct signatures |

**Incident-state waivers remain human-only.** Standing authorizations cannot pre-authorize `dataClassPreservation: waived` (per ADR-0009). Framework structurally refuses machine-issued waivers.

**Cryptographic identity requirements.** Machine identities use hardware-backed keys (HSM, TPM, cloud KMS with attestation, or physical hardware tokens). Software-only keys are refused for machine-identity registration.

**Audit chain.** Every action traces from evidence artifact → execution provenance → machine-issued authorization → standing authorization → human signer. Auditors have read access to the target's authorization ledger.

Full specification in [`methodology/AUTONOMOUS-AUTHORIZATION.md`](../../methodology/AUTONOMOUS-AUTHORIZATION.md).

## Consequences

**Positive.** Continuous plane and I0-I1 engagements can operate fully machine-authorized within envelope; human involvement reduced to standing-authorization issuance (typically annual per machine identity), revocation, I2+ engagement approvals, and incident-state waivers. Legal-liability integrity preserved via envelope model. Audit chain from evidence to human consent remains inspectable.

**Negative.** More authorization complexity — targets have both standing and machine-issued authorizations to manage. Hardware-backed key requirement raises the operational floor for machine identities. Small autonomous operators may find HSM/TPM/cloud-KMS deployment burdensome.

**Neutral.** v0.3 human-signed engagement authorizations continue to work as a special case (machine identity null). Migration to autonomous authorization is optional and per-target. The framework's "zero human employees" support is bounded to I0-I1 activity; higher-impact operations retain structural human involvement.

## Explicit non-goals

- The autonomous model does not enable fully-autonomous destructive operation. I3+ engagements always require human per-invocation signature. Attempts to remove this requirement would eliminate legal accountability, which the framework treats as out of scope.
- The autonomous model does not eliminate the need for a legal person to establish target authorization. The standing authorization is legally binding consent by a human; machine identities cannot self-issue standing authorizations.
- The autonomous model does not shield the human signer from liability for actions taken under their standing authorization. Legal liability provenance flows through the envelope; the human who signs the standing accepts liability for actions machines take within it.

## References

- [`methodology/AUTONOMOUS-AUTHORIZATION.md`](../../methodology/AUTONOMOUS-AUTHORIZATION.md).
- ADR-0009 — original authorization model (extended, not superseded, by this ADR).
- ADR-0016 — three-axis authorization model.
- Gemini cross-LLM review of v0.3, finding #1 + concluding direct question.
