# ADR-0008 — L3 maturity is natively attainable by kronos without external attestation

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The operator, Kronos scribe
- **Supersedes:** In-part supersedes SCORECARD.md v0's L3 definition
- **Superseded by:** None
- **Origin:** Claude cross-LLM design review of v0, finding P1-2

## Context

The v0 SCORECARD defined Level 3 (L3 Defined) as "framework-integrated, has automated tests, and is attested by an attestation framework (specifically eos, though the pattern generalizes)." This coupled L3 to the presence of an attestation framework — either eos or an "equivalent attestation record from another framework."

The Claude review flagged this in finding P1-2: kronos has no native attestation primitive. Attestation is eos's entire reason to exist. The scorecard's fallback for kronos-alone adopters ("an equivalent attestation record from another framework" or "a kronos engagement that includes an explicit L3 attestation step") did not specify what a kronos-native L3 attestation step actually is or produces.

The chain of consequences the reviewer traced:
- No attestation primitive → no native path to L3
- L4/L5 defined as "L3 plus adversarial proof"
- Therefore a kronos-only adopter's scorecard cannot exceed L2 in any dimension
- Which is a hard dependency on eos (or an unspecified external attestation), contradicting the "independently adoptable" claim asserted repeatedly throughout DESIGN.md and ADR-0004

The reviewer offered three resolutions and recommended (b): redefine L3 so it does not require external attestation.

## Decision

L3 is redefined as **framework-integrated with an automated diagnostic attack defined and passing.** Kronos attains L3 natively when:

- A diagnostic attack for the dimension is defined in the target's engagement corpus (i.e., an engagement exists that names an attack targeting the dimension's controls).
- The most recent execution of that attack against the target produced a PASS oracle verdict.
- The engagement that ran the attack is in `06_shipped/`.

This definition removes the external-attestation gate. L3 is attainable by kronos alone. The eos coupling becomes a **value-add for traceability**, not a gate — a target co-adopted with eos can additionally cite the eos cycle that documented the intent behind the tested control, but the L3 determination itself does not require the eos cycle to exist.

L4 and L5 definitions are unchanged. L4 still requires the defense to fire under diagnostic attack with expected metric signatures within a declared SLO envelope. L5 still requires adversarial proof in production or production-equivalent environment with scheduled re-verification cadence. The load-bearing property — that L4 and L5 are only reachable via adversarial proof — is preserved.

The revised maturity ladder:

- **L0 Absent** — no defense exists in this dimension.
- **L1 Ad Hoc** — some defense exists but is undocumented and unverified.
- **L2 Managed** — the defense is documented and occasionally tested (manual verification recorded in engagement).
- **L3 Defined** — framework-integrated; automated diagnostic attack defined and passing in the most recent shipped engagement.
- **L4 Quantitatively Managed** — L3 plus metric-instrumented SLOs, regression detection, and the diagnostic attack has fired under adversarial pressure with expected metric signatures.
- **L5 Optimizing** — L4 plus continuous re-verification in production or production-equivalent environment.

The scorecard's relationship to eos section is updated: when eos is co-installed, the scorecard renders both the L3-eligibility source (the shipped kronos engagement) and the traceability reference (the eos cycle, if present). When eos is not installed, only the engagement reference is rendered. Neither is a prerequisite for the other.

## Consequences

### Positive

- The "independently adoptable" claim is now true structurally. A kronos-alone adopter can reach L3, L4, L5 in every scorecard dimension without ever installing eos.
- The dialectic with eos remains valuable — a target co-adopted with both frameworks has stronger traceability from claim (eos attestation) to falsification attempt (kronos engagement) to survival evidence (kronos scorecard). But the dialectic is no longer a hidden prerequisite masquerading as an optional integration.
- Kronos's L3 definition becomes a natural stopping point for adopters who want the framework's discipline without adopting a second framework alongside it. Lower barrier to first meaningful adoption.
- The scorecard's L3 → L4 → L5 progression is now internally coherent — every level's definition refers only to kronos's own primitives.

### Negative

- Some information is lost by dropping the mandatory attestation-linkage at L3. When eos is not installed, the scorecard's L3 cells do not carry a link to the design intent that motivated the tested control. Adopters can add such linkage themselves in their engagement documents' §6 target model, but the framework does not enforce it.
- The v0 SCORECARD document requires substantive revision — this is not a minor language change; the definition of L3 shifts. Downstream references in DESIGN.md, methodology/README.md, and INDUSTRY-ALIGNMENT.md must be updated.

### Neutral

- The claim in SEVEN-CLAIMS Property 2 ("Dialectic with attestation as complementary epistemic backbone") is unchanged in substance. The dialectic remains real; it is just no longer structurally required to reach L3. The claim's novelty is preserved — no prior methodology structurally couples attestation and adversarial-falsification frameworks in the bidirectional way this design commits to — even if the coupling is optional rather than required.

## References

- [`../../methodology/SCORECARD.md`](../../methodology/SCORECARD.md) — the scorecard model, updated in v0.1 to reflect this ADR.
- [`../../methodology/SEVEN-CLAIMS.md`](../../methodology/SEVEN-CLAIMS.md) Property 2 — the eos dialectic claim, unchanged in substance.
- ADR-0004 — the eos dialectic ADR, updated in v0.1 to reflect the "value-add not gate" positioning.
- Claude cross-LLM review of v0, P1-2 — the review finding that surfaced the contradiction.
