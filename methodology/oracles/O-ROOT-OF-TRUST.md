# O-ROOT-OF-TRUST

**Version:** 0.1
**Evaluates:** [K-C7-ROOT-OF-TRUST-INTEGRITY](../claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md)
**Operator profiles required:** ceremony-auditor, internal-ro-hsm, governance-observer
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary. All three must pass for L2. Target must enumerate its trust anchors before engagement.

## Subtest (a) — Key-generation entropy

**Operator profile:** ceremony-auditor — reviews generation methodology artifacts

**Procedure:**

1. **Anchor enumeration.** Target names every active trust anchor (CA signing key, code-signing anchor, DNSSEC KSK, envelope key).
2. **Ceremony-artifact review.** For each anchor, target produces: (i) entropy-source documentation — hardware RNG make/model, FIPS 140-3 certification level if any, BSI AIS 20/31 class if applicable; (ii) key-generation ceremony record — participants, witnesses, date; (iii) key-length and algorithm declaration; (iv) **witness-independent entropy sanity check** — a reproducible check that the generated keys do not fall in known-weak ranges (small values, repeated patterns, structure revealing the generator).
3. **Independent entropy sampling.** Operator samples the entropy source directly (if an HSM is in use, via its sampling API; if software RNG, via `/dev/random` reads under controlled conditions) and verifies output against NIST SP 800-90B health tests.
4. **Pass criterion.** All anchors have reviewable generation evidence; independent entropy sampling passes 800-90B health tests; sanity check against known-weak ranges succeeds for every active key.

**Pass:** every active anchor's key material is evidenced to have been generated with sufficient entropy, with the generation methodology reviewable.

## Subtest (b) — Key-storage secrecy

**Operator profile:** internal-ro-hsm — read-only access to the storage layer, time-boxed

**Procedure:**

1. **Storage-mechanism enumeration.** Target documents where each anchor's private key material resides (specific HSM model + partition, offline device + custody chain, cloud KMS + key policy, split-knowledge key custodians).
2. **Access-attempt simulation.** With time-boxed grant, operator attempts to recover key material from an internal-ro position (e.g., HSM operator credential at authorized tier, backup repository read-only, filesystem read-only on the machine that holds a software key). The grant document records exactly which privileges the operator is granted.
3. **Pass criterion.** Key material is not recoverable from the granted position. The attempt itself is logged by the target's access-logging infrastructure with observable attribution.

**Pass:** key material is not recoverable from internal-ro positions short of the full access set the architecture explicitly requires.

## Subtest (c) — Governance survives

**Operator profile:** governance-observer — probes revocation / detection infrastructure

**Procedure:**

1. **Governance-mechanism specification.** Target names its governance mechanism (CA/B Forum for public CA, internal CAB for enterprise PKI, EOS §9 for Olympus-Grid-class operators) and states the detection and revocation time budgets `T_detect_gov` and `T_revoke`.
2. **Synthetic-compromise notification.** Operator submits a synthetic compromise report through the standard channel (e.g., for a public CA, a report via the CA's incident-reporting path) and times response.
3. **Revocation-propagation measurement.** For a known test anchor (or using the synthetic report path), operator times propagation from governance decision to downstream trust-store removal / OCSP revocation / OneCRL update / CRLite propagation.
4. **Pass criterion.** `T_detect_gov` and `T_revoke` measurements are within the target's stated budgets.

**Pass:** governance detection and revocation propagate within stated budgets.

## Scorecard delta

- All three pass → L2 under oracle v0.1
- Any subtest fails → L0 under oracle v0.1
- Subtest (b) refused (no internal-ro grant) → capped at L1 under oracle v0.1
- L3 requires continuous entropy-source attestation, periodic HSM re-audit, published governance-detection statistics

## Known limitations of v0.1

- The oracle cannot detect compromise that pre-dates engagement without a specific signal to look for; passing the oracle does not retroactively certify historical anchor use.
- Subtest (a) sanity checks are only as good as the known-weak-range catalog; novel generator failure modes (new algorithmic weakness, side-channel leak) are not detected.
- Governance mechanisms outside the operator's control (CA/B Forum, ICANN) are measured as observed; the oracle cannot change them.
