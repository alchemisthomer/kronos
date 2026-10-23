# K-C7-ROOT-OF-TRUST-INTEGRITY

**Admitted:** 2026-10-22 · [eMudhra's CA private key was the integer 4](../../docs/blog/posts/2026-10-22-emudhra-ca-root-of-trust-admission.md)
**Oracle:** [O-ROOT-OF-TRUST](../oracles/O-ROOT-OF-TRUST.md)
**Holder class:** every target whose runtime terminates at a cryptographic root of trust

## Statement

> For a target T whose runtime terminates at a cryptographic root of trust, T can produce evidence that:
>
> **(a) Key-generation entropy.** The private key material of each trust anchor was generated with sufficient entropy to be computationally unrecoverable. The generation methodology (hardware RNG, entropy source, audited key ceremony) is documented and verifiable.
>
> **(b) Key-storage secrecy.** The key material has not been exposed since generation. Storage mechanism (HSM, offline device, split-knowledge key custody) is documented and verifiable. Access events, where unavoidable, are logged with observable attribution.
>
> **(c) Governance survives.** The industry-level or operator-level governance mechanism around T's trust anchors can detect compromise and revoke the anchor within a stated detection and revocation time budget. The CA/B Forum Baseline Requirements, OneCRL/CRLite propagation, OCSP stapling, DNSSEC KSK rotation — each is an instance of boundary (c) infrastructure.

## The primitive

The primitive protects the architectural assumption that *trust anchors have the secrecy their security model demands*. The specific instance named by the admission incident is eMudhra, which generated eight intermediate-CA private keys with values less than 256 — one of them the integer `4` — in April 2025, and had those keys trusted by major browsers for 18 months before a community member reported the entropy failure to Mozilla on 2026-10-17.

The structural failure modes K-C7 refuses:

- **Insufficient entropy at generation.** The eMudhra case. Key material is deterministically derivable from public information (the certificate itself, since the signature contains hints about the key size the generator used).
- **Key compromise during storage.** HSM failure, insider access to key material, backup leaked. The failure can be detected (via certificate transparency, by unexpected signatures appearing) but typically only after the fact.
- **Governance miss.** The 18-month window between eMudhra's April 2025 generation and the October 2026 discovery is a boundary (c) failure for the CA/B Forum audit mechanism. The compromise existed; the governance did not detect it.

K-C7 is distinct from K-C1 in a specific way: K-C1 protects tenant-held secrets in a platform's custody — the platform is the custodian, the tenant is the owner, both are identified parties with specific trust envelopes. K-C7 protects the trust anchors a runtime uses to verify everyone else — the custodian here is the root-of-trust operator, and the "owner" is implicitly everyone who trusts certificates downstream of the anchor.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence. Default. Also mandatory for any target whose root-of-trust envelope was publicly demonstrated to fail (e.g., eMudhra on subtest (a) as of 2026-10-20). |
| **L1** | Documented posture: (i) enumeration of trust anchors (CAs, signing keys, DNSSEC KSKs), (ii) generation methodology for each — entropy source, HSM / software RNG, ceremony witnesses, (iii) storage mechanism, (iv) governance / revocation path. |
| **L2** | Passes `O-ROOT-OF-TRUST` subtests (a), (b), (c) in a time-boxed engagement. Subtest (a) requires reviewable key-generation evidence (ceremony recording, entropy-source attestation, HSM audit). Subtest (b) demonstrates storage boundary via internal-ro probe. Subtest (c) demonstrates governance timeline via synthetic revocation event. |
| **L3** | Maintains L2 continuously with periodic key-generation re-attestation, HSM audit on cadence, published governance-detection statistics. |

## Holder class

- **Every CA in a browser trust store** (Mozilla NSS, Chrome Root Store, Apple, Microsoft).
- **Every DNSSEC-signed zone** — root, TLD, zone-level.
- **Every code-signing anchor** — Microsoft Authenticode, Apple notarization, Google Play, APT/RPM/Debian signing, Red Hat.
- **Every OS/language bundled trust store** — macOS Keychain, Windows TRCA, Mozilla NSS, Android, Chrome Root Store, OpenSSL ca-bundle, curl, Debian ca-certificates, Java cacerts, Go stdlib (shipped CVE-2026-111943 against eMudhra keys).
- **Every software supply-chain attestation framework** — TUF, in-toto, Sigstore, Fulcio, Rekor.
- **Every corporate PKI** — internal CAs for VPN, S/MIME, device enrollment, Kubernetes TLS, service meshes.
- **Olympus-Grid.** Cosmos-logos envelope keys (Ed25519 per-god, SSM SecureString stored), ingress TLS certs (ACM-managed), Salesforce OG_Signing_Key certificates. Envelope-key provisioning path has not been audited for subtest (a). Posture: honest-L?.

## Related claims

- [K-C1-TENANT-SECRET-ENVELOPE](K-C1-TENANT-SECRET-ENVELOPE.md) — adjacent. K-C1 protects stored tenant secrets; K-C7 protects the trust-anchor keys that are a specific sub-class of secret with additional constraints (entropy at generation, governance for revocation).
- [K-C4-RUNTIME-INTEGRITY](K-C4-RUNTIME-INTEGRITY.md) — adjacent. A target's cryptographic verification code can be perfect at K-C4 (no decoder bug, no buffer overflow) and still fail K-C7 if the trust-anchor key material it verifies against is compromised.
- [K-C8-SUPPLY-CHAIN-INTEGRITY](K-C8-SUPPLY-CHAIN-INTEGRITY.md) — K-C7 is the foundation K-C8 attestation infrastructure (Sigstore, Fulcio, in-toto, TUF) stands on. A K-C7 failure in any of those systems collapses the K-C8 attestation guarantees that depend on it.
- [K-C6-ATTACKER-CADENCE-RESILIENCE](K-C6-ATTACKER-CADENCE-RESILIENCE.md) — K-C7 subtest (c) is specifically a cadence measurement: how fast can the industry governance mechanism detect a compromise and propagate a revocation? Mozilla's 3-hour-to-OneCRL response in the eMudhra case is positive K-C7 subtest (c) evidence, but the 18-month pre-detection window is the governance miss.

## Posts that touch this claim

- [eMudhra's CA private key was the integer 4](../../docs/blog/posts/2026-10-22-emudhra-ca-root-of-trust-admission.md) — admission post
