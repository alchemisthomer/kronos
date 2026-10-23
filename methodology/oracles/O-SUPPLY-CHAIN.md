# O-SUPPLY-CHAIN

**Version:** 0.1
**Evaluates:** [K-C8-SUPPLY-CHAIN-INTEGRITY](../claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md)
**Operator profiles required:** source-auditor, build-pipeline-auditor, downstream-verifier
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary. All three must pass for L2.

## Subtest (a) — Source-of-truth integrity

**Operator profile:** source-auditor

**Procedure:**

1. **Repo-integrity controls enumeration.** Target documents branch-protection rules, commit-signing enforcement, review requirements, authorized-committer list, protected-branch access.
2. **Attack-attempt simulation.** With cooperation, operator attempts to land an unauthorized change via known attack vectors: compromised reviewer account, bypass of branch protection via admin override, force-push, release-branch tag spoof.
3. **Audit-trail examination.** For historical period (last 90 days or last engagement window), operator samples commits and verifies signing + review-chain integrity.
4. **Pass criterion.** Attack simulations fail or are detected and audit-traced; audit-trail sampling finds no silent protection bypass.

**Pass:** source-side integrity holds under attempted bypass.

## Subtest (b) — Build-pipeline integrity

**Operator profile:** build-pipeline-auditor

**Procedure:**

1. **Pipeline description.** Target documents build environment (CI runner, container image, dependency fetching), publication credential posture (MFA, hardware key, short-lived OIDC tokens), attestation output (SLSA level, in-toto record, Sigstore signature).
2. **Reproducibility test.** Operator attempts to reproduce a recent published artifact bit-for-bit from the authoritative source using the documented build environment. Any divergence from the published artifact is a boundary (b) finding.
3. **Credential-posture probe.** Operator verifies that publication credentials are hardware-key MFA'd or equivalent (short-lived OIDC acceptable; stored password-only is not).
4. **Pass criterion.** Reproducibility succeeds (or the specific points of non-reproducibility — timestamps, nondeterministic compile — are documented and bounded). Credential posture meets or exceeds hardware-key MFA bar. SLSA level 2 or better evidenced.

**Pass:** build pipeline produces reproducible or attested artifacts; publication credentials are hardware-key MFA.

## Subtest (c) — Downstream verifiability

**Operator profile:** downstream-verifier — simulates a consumer with no privileged relationship with the target

**Procedure:**

1. **Verification-mechanism enumeration.** Target documents what downstream consumers can use to verify the artifact independently: Sigstore signature + Rekor lookup, SLSA provenance, TUF metadata, PGP signature.
2. **End-to-end verification walk.** Operator installs the artifact as a standard consumer and performs the documented verification. The verification must not depend on trusting the target's own authority (the target's own signing key, if any, must be anchored in a K-C7-compliant trust path).
3. **Tamper detection.** Operator substitutes a modified artifact at the download step and verifies the mechanism detects the tamper and refuses.
4. **Pass criterion.** Verification walk succeeds, is reproducible by any consumer with the documented mechanism, and refuses tampered artifacts.

**Pass:** downstream verification exists, is independently reproducible, and detects tamper.

## Scorecard delta

- All three pass → L2 under oracle v0.1
- Any subtest fails → L0 under oracle v0.1
- Subtest (c) refused (no verification mechanism offered) → capped at L1 under oracle v0.1
- L3 requires reproducible builds across time + published attestation statistics + continuous registry-monitoring

## Known limitations of v0.1

- The oracle does not test *dependency-of-dependency* supply-chain integrity (transitive compromise, build-time dep → published-wheel path).
- Reproducible builds are hard; subtest (b) acknowledges well-known non-reproducible components (timestamps, compilation nondeterminism) and bounds rather than requires absolute reproducibility.
- Sigstore + Rekor are themselves K-C7-anchored; a K-C7 failure in Fulcio/Rekor undermines all K-C8 attestations that depend on them.
