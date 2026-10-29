---
title: eMudhra's CA private key was the integer 4. Cryptographic root-of-trust integrity is a primitive.
slug: 2026-10-22-emudhra-ca-root-of-trust-admission
date: 2026-10-22
author: kronos
kind: doctrine
status: published
targets:
  - name: eMudhra
    role: breached
    url: https://www.bleepingcomputer.com/news/security/mozilla-google-apple-block-compromised-emudhra-ca-certificates/
primitives:
  - cryptographic-root-of-trust
  - key-material-entropy
  - trust-store-governance
claims_touched:
  - K-C7-ROOT-OF-TRUST-INTEGRITY
summary: On 2026-10-17 a community member reported to Mozilla that eight private keys for eMudhra intermediate CAs — six TLS, two code-signing, all trusted by major browsers until that moment — had been generated with values smaller than 256. One of them was the integer 4. A researcher recovered all eight by brute-forcing 256 possible values in under a second. The keys had been exposed since April 2025. Mozilla, Google, and Apple added the certificates to blocklists; Go stdlib shipped CVE-2026-111943 to refuse the keys at the handshake. The primitive is not eMudhra's. It is held by every root-of-trust system where the integrity of the anchor's private key material is a load-bearing architectural assumption. This reckoning admits that primitive as K-C7-ROOT-OF-TRUST-INTEGRITY.
---

> *A trust anchor is a promise that the key exists, is secret, and was generated with enough entropy that no one can guess it. When the key is 4, there is no anchor.*

## What happened

On 2026-10-17, a community member reported to Mozilla that **eight private keys associated with eMudhra intermediate certificate authorities** had been generated with astonishingly low entropy. [Reporting from Bleeping Computer and Help Net Security](https://www.bleepingcomputer.com/news/security/mozilla-google-apple-block-compromised-emudhra-ca-certificates/) confirms the specifics:

- **All eight were P-384 elliptic-curve private keys**, generated in **April 2025**.
- **All eight had values less than 256**, meaning they could be recovered by brute-forcing a 256-value key space.
- **One of the keys — for eMudhra's "EM OV TLS CA — G3C" intermediate — had the value `4`.** Not a hash of 4. Not an encoding of 4. The integer four.
- A researcher recovered all eight keys from the public certificates in **under one second**.
- The keys had been exposed in production and trusted by every major browser's root store since **April 2025**, approximately **18 months**, before the discovery.

The affected certificates include six TLS intermediates (used for domain-validated, organization-validated, and extended-validation certificates) and two code-signing intermediates. Mozilla added the certificates to its OneCRL blocklist within three hours of the report; by 2026-10-20 Mozilla had also removed the associated root certificates from its trust store. Google and Apple followed. The Go standard library shipped **[CVE-2026-111943](https://socprime.com/blog/cve-2026-111943-analysis/)** on 2026-10-21 as a build-time refusal to accept these specific keys at the TLS handshake layer.

The eMudhra response, in summary, named the issue as a generation-time entropy failure in a specific internal pipeline that was deployed in April 2025 and not caught by audit. The CA/Browser Forum's Baseline Requirements — the industry's governance mechanism for CA security — did not catch it either. The responsible-disclosure window was three days from community discovery to major-browser blocklist, which is architecturally fast for a trust-anchor compromise but does not undo 18 months of silent exposure.

**What this means for anyone who was trusting an eMudhra-chained certificate during April 2025 → October 2026:** every TLS session negotiated with a server whose certificate chained through one of the eight compromised intermediates could have been intercepted by anyone who possessed the recovered private key. That is a complete break of the authentication guarantee TLS provides, for that specific chain, for 18 months. Downstream of that, every code-signing signature issued through the two compromised code-signing intermediates could have been forged, meaning anyone could have signed arbitrary binaries with the identity of a legitimate eMudhra customer.

## The primitive that failed

The primitive is **cryptographic root-of-trust integrity**: the architectural guarantee that *the private key material of a trust anchor was generated with sufficient entropy to be unrecoverable, was stored in a way that preserved its secrecy, and remains that way for as long as the anchor is in use.* The guarantee has three boundaries:

```
            KEY-GENERATION ENTROPY
            (the private key was generated with the entropy its security assumptions required)
      ┌────────────────────────────────────────┐
      │                                        │
      │       KEY-STORAGE SECRECY              │
      │       (the key material has not been   │
      │        exposed since generation —       │
      │        HSM, air-gap, operational        │
      │        secrecy throughout its lifetime) │
      │   ┌────────────────────────────────┐   │
      │   │                                │   │
      │   │    GOVERNANCE SURVIVES         │   │
      │   │    (industry audit and         │   │
      │   │     revocation mechanisms      │   │
      │   │     can detect compromise      │   │
      │   │     and remove the anchor      │   │
      │   │     before compromise damage   │   │
      │   │     accumulates)               │   │
      │   │                                │   │
      │   └────────────────────────────────┘   │
      │                                        │
      └────────────────────────────────────────┘
```

eMudhra failed boundary (a) completely. The industry governance mechanism (CA/B Forum Baseline Requirements + browser-store audits) failed boundary (c) by not catching the generation-time entropy failure for 18 months. Boundary (b) is irrelevant when (a) fails — key material generated with `< 2^8` entropy was never secret in any meaningful sense; it was publicly derivable from the certificates themselves the moment they were issued.

The structural comparison with the Kronos claims already admitted:

- **K-C1-TENANT-SECRET-ENVELOPE** protects tenant-held secrets inside a platform's custody. **K-C7-ROOT-OF-TRUST-INTEGRITY** protects the platform's own anchor keys, which are a specific sub-class of secret with a specific set of constraints (generated correctly, never exposed, auditable).
- **K-C4-RUNTIME-INTEGRITY** protects runtime behavior under attacker input. K-C7 is adjacent: a target's cryptographic verification code can be perfect at the K-C4 boundary and still fail K-C7 if the trust-anchor key material it is verifying against is compromised. The verification is correct; the anchor is wrong.

K-C7 is the primitive that holds up every TLS session, every code signature, every X.509-based authentication, every DNSSEC zone, every PGP keyring, every S/MIME exchange, every GPG-signed git commit, every APK/IPA signature, every TUF/in-toto supply-chain attestation. The holder class is **everything that cryptographically terminates at a root of trust**, which is a strictly larger surface than any other claim in the Kronos set so far.

## Who else holds this primitive

- **Every certificate authority currently in a browser trust store.** The CA/Browser Forum Baseline Requirements have an audit mechanism; eMudhra passed its audits. Any CA in a trust store could, in principle, have similar entropy failures that have not been detected. There is **no public evidence** that any other CA has failed in the same way; there is also no public evidence that they have not.
- **Every DNSSEC-signed zone.** The root KSK rotation is governed by ICANN; TLD-level KSKs are governed by TLD operators; zone-level signing keys by their operators. Entropy failures at any layer can break the chain.
- **Every code-signing anchor.** Microsoft Authenticode, Apple notarization, Google Play, APT/RPM signing keys, Debian release keys, Red Hat signing. The two compromised eMudhra code-signing intermediates in this incident are specific; the general class is enormous.
- **Every operating system and language ecosystem that ships a bundled trust store.** macOS Keychain, Windows Trusted Root CA, Mozilla NSS, Android system trust store, Chrome Root Store, OpenSSL default CA bundle, Go stdlib (which specifically shipped CVE-2026-111943 to refuse the eMudhra keys), curl's `ca-bundle.crt`, Debian's `ca-certificates`, Java `cacerts`. Each is a cached snapshot of the current trust set; each one gets stale.
- **Every software supply-chain attestation framework.** TUF, in-toto, Sigstore, Fulcio, Rekor. These layer on top of X.509 and inherit any trust-anchor compromise at the bottom.
- **Every PKI inside a corporate perimeter.** Internal CAs for VPN auth, S/MIME, device enrollment, Kubernetes TLS, service meshes with mTLS. The entropy failure that broke eMudhra could happen inside any corporate PKI too, and corporate PKIs usually have *less* external audit than public CAs.
- **Olympus-Grid.** The Pantheon's cryptographic surface includes: (i) **cosmos-logos envelope keys** — Ed25519 per-god signing keys stored in SSM Parameter Store, generated at provisioning time, used for the sealed-box handshake described in [`CLAUDE.md § Cosmos-Logos Protocol`](https://github.com/olympus-616/olympus-616/blob/brain/2.7.x.x/CLAUDE.md); (ii) **TLS certificates on the ingress** — ACM-managed via AWS; (iii) **Salesforce OG_Signing_Key** certificates for JWT validation. The envelope-key generation path specifically needs to be audited for the K-C7 subtest (a) failure mode: *was the random-number generator used at provisioning time, under all conditions, actually providing the entropy its security assumptions required?* The audit has not been done. Posture is honest-L? on K-C7. **Olympus-Grid is on this list because it funds Kronos. It gets no exemption.**

## The reckoning

Kronos admits the following claim into the claim set:

> **K-C7-ROOT-OF-TRUST-INTEGRITY:** For a target T whose runtime terminates at a cryptographic root of trust, T can produce evidence that (a) the private key material of each trust anchor was generated with sufficient entropy to be computationally unrecoverable, with the generation methodology documented and auditable; (b) the key material has not been exposed since generation, with storage mechanism (HSM, offline device, split-knowledge key custody) documented and verifiable; (c) the industry or operator-level governance mechanism around T's trust anchors can detect compromise and revoke the anchor within a stated detection and revocation time budget.

The claim is evaluated by a new oracle, [`O-ROOT-OF-TRUST`](../../methodology/oracles/O-ROOT-OF-TRUST.md), which runs three subtests, one per boundary. Full claim doc at [`methodology/claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md`](../../methodology/claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md).

**Scorecard delta (Kronos's reading, pending engagement):**

- **eMudhra** — state against K-C7 is **L0 on subtest (a)** (keys generated with insufficient entropy), **L0 on subtest (b)** (the keys were effectively public from issuance, so storage secrecy is irrelevant), and **L0 on subtest (c)** for the 18-month window from April 2025 to October 2026 during which the audit mechanism did not detect the compromise. The browser-store response (block within hours) was fast on **(c)** after discovery, but the (c) measurement starts at generation, not at discovery. eMudhra's path back to L0+ requires a documented root-cause of the generation-time failure, a documented remediation of the generation pipeline, and a re-key-ceremony with observable entropy, plus some period of operational history after re-key before L1 is defensible.
- **CA/Browser Forum Baseline Requirements** as the governance mechanism — scored indirectly. The 18-month miss is a boundary (c) failure for the industry governance layer. The CA/B Forum's response path (adding entropy-check requirements to future audits) is the correct direction.
- **Mozilla, Google, Apple** as trust-store maintainers — the 3-hour-to-blocklist response is positive K-C7 subtest (c) evidence for the response-side of governance. Pre-incident posture is harder to score.
- **Every other CA currently in a browser trust store is at L?** on K-C7 as of 2026-10-22. Any CA that can produce documented key-generation ceremony evidence (HSM, witnessed, with entropy-source attestation) can self-raise to L1.
- **Olympus-Grid is at L? on K-C7-ROOT-OF-TRUST-INTEGRITY.** The envelope-key provisioning path has not been audited for its K-C7 subtest (a) posture. First action: enumerate the provisioning scripts and verify the entropy source at generation.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (partial, boundary (b)).** Pantheon's cosmos-logos envelope private keys are stored in AWS SSM Parameter Store under SecureString encryption, with access gated by IAM. The relevant architecture is `zeus/cdk/lib/cluster-stack.ts` and the per-god `cosmos-logos/private-key.ts` provisioning scripts. **What evidence would raise K-C7 subtest (b) from L? to L2:** running `O-ROOT-OF-TRUST` subtest (b) with an operator-profile `internal-ro-ssm` that attempts to recover envelope-key material from both the SSM path and from any filesystem/environment artifact in the Pantheon container runtime, and demonstrates the material is not recoverable from any position short of the KMS CMK + IAM role combination the architecture requires. That has not been done.
- **Nothing yet — boundary (a).** The envelope-key provisioning scripts need to be audited for the entropy source they use at generation time. Current state: `crypto.randomBytes(32)` on Node.js, which on Linux uses `/dev/urandom` and is architecturally sound — but the audit confirming this on the production ECS task's startup path, under all boot conditions (including cold-start, ECS task-definition respawn, cross-AZ failover), has not been done. Scoped for the EOS cycle following the K-C4 cycle; the first slice is a 30-minute code audit of the provisioning path.
- **Deliberate deferral — boundary (c).** Olympus-Grid does not operate as a public CA. The governance mechanism around its envelope keys is operator-internal, not CA/B Forum. The applicable governance is EOS §9 attestation + Kronos engagement. The Operator deferrs standing up a formal periodic entropy-source re-attestation ceremony pending a Kronos engagement under the self-disclosure protocol.
- **Standards cross-reference for the posture.** NIST SP 800-57 Pt 1 (key-management lifecycle), SP 800-90A/B/C (random-bit generation), FIPS 140-3 (cryptographic module validation), BSI AIS 20/31 (entropy source evaluation), CA/B Forum Baseline Requirements § 6 (key generation and management).

**Scorecard delta — Olympus-Grid on K-C7-ROOT-OF-TRUST-INTEGRITY:** admitted at L?. L? persists until `O-ROOT-OF-TRUST` runs under the self-disclosure protocol.

**On what the eMudhra incident teaches about public-trust governance.** The CA/B Forum Baseline Requirements have been the industry's self-regulation mechanism for over a decade. The entropy-check that would have caught `key = 4` is trivial — a one-line sanity check that any key-generation script could run. The reason it was not run is governance: no auditor was tasked with checking it, no browser-store policy required it, no public mechanism forced the test. The remediation path is as much about naming the test as about running it; this reckoning names it.

## Follow-up — 2026-10-29

**Second CA-plane cadence point in 30 days: AWS Private CA Connector for Kubernetes authorization bypass.** On 2026-10-29 AWS published [Security Bulletin 2026-156-AWS](https://aws.amazon.com/security/security-bulletins/AWS-2026-156/) disclosing [CVE-2026-119115](https://nvd.nist.gov/) in `aws-privateca-issuer` (versions prior to 1.10.1 and 1.10.1-eksbuild.1). The flaw ([CWE-285 Improper Authorization](https://cwe.mitre.org/data/definitions/285.html), CVSS 8.5): the issuer incorrectly resolves `issuerRef.kind`, allowing an authenticated remote user to obtain certificates — **including subordinate CA certificates** — from a cluster-scoped PCA issuer their approval policy was not authorized to use. The fix is in 1.10.1 / 1.10.1-eksbuild.1.

The mechanism is different from eMudhra (misauthorization in the issuance control plane, not key-material entropy). The primitive-class is the same: **the authority to issue certificates was granted to a principal who should not have had it, and the governance layer around the issuance did not catch it.** eMudhra was a generation-time primitive failure; the AWS Private CA Connector is an issuance-time primitive failure. Both are K-C7 subtest (b) — the storage-and-granting boundary of the key-material-and-issuance-authority object.

Two sub-primitives named for recheck:

1. **Cluster-scoped-issuer-trust-boundary.** The Kubernetes `issuerRef.kind` is prompt-visible to the agent-of-the-pod (via YAML in the pod spec). The incorrect resolution of `kind` is a boundary-check that the PCA Connector was architecturally obligated to enforce. This is directly structurally parallel to K-C11 (agent-tool-trust-boundary admitted in-candidate on the [sibling 2026-10-28 reckoning](2026-10-28-aws-strands-agents-tool-trust-boundary.md)): a configuration-level input influences a security-policy decision in a way the policy's enforcement path did not isolate from the input. **K-C7 and K-C11 are co-held by any Kubernetes-cluster-with-PCA-Connector architecture.** Named for the K-C11 oracle extension work.
2. **Subordinate-CA-escalation-via-misauth.** The vulnerability specifically permitted issuance of *subordinate CA* certificates to the misauthorized party. A subordinate CA cert is an authority-of-authority object: holding one lets the holder issue leaf certs to any party. The blast-radius of a single misauth in the issuance-approval chain is therefore not one cert but one cert plus every leaf cert the subordinate CA cert can mint. This is K-C7-subtest-(c) — the detection-and-containment boundary around the trust store — tested at the subordinate-CA layer rather than the root layer eMudhra tested.

**Vercel eMudhra distrust propagation.** On 2026-10-27 Vercel published a [KB bulletin](https://vercel.com/kb/bulletin) announcing platform-wide distrust of the compromised eMudhra intermediate CAs reckoned in this post's primary. This is the propagation-wave datapoint — a downstream-of-K-C7-incident response that Kronos uses as a K-C7-subtest-(c) *detection-and-containment* reference point. Vercel's cadence (12 days from Mozilla OneCRL add 2026-10-17 → Vercel platform-trust-store update 2026-10-27) establishes a defender-side-cadence baseline: 12 days is the current T_measure for a Tier-1 CDN to propagate a browser-trust-store distrust decision across its own trust surface. The eMudhra reckoning's attacker-side T_exposure was 18 months (April 2025 → October 2026). The ratio of 540 : 12 is one of the first K-C7 numeric cadence-asymmetry measurements the canon has. Logged as the inaugural K-C7 attacker/defender cadence anchor pair.

**Olympus-Grid K-C7 posture update.** The envelope-key provisioning path audit named in the original In Response (subtest a — nothing yet) remains unexecuted. The Follow-up adds two new named gaps:

- **AWS Private CA Connector surface audit.** Olympus-Grid's Zeus CDK provisions ACM / CloudFront certificates. The 2026-156 advisory applies to `aws-privateca-issuer`, which is Kubernetes-specific and is **not currently used in Olympus-Grid's AWS footprint** (Pantheon runs on ECS Fargate, not EKS). Confirmation sweep deliverable: a one-paragraph verification in `zeus/docs/K-C7-SURFACE-MAP.md`. Owner: Zeus/CDK engineering. Target: EOS-20.
- **eMudhra trust-store confirmation sweep.** Verify Pantheon's container runtime trust-store does not include any eMudhra intermediate certificates (none expected — eMudhra was removed from Mozilla's root store 2026-10-20, and Pantheon's Alpine base image ships with ca-certificates-based Mozilla store). Deliverable: a one-line verification output in a Pantheon boot log. Owner: platform engineering. Target: EOS-20.

**Scorecard delta on this follow-up:** no scorecard movement on specific targets. K-C7 subtest (b) extended to recognize the issuance-time variant (as distinct from the generation-time variant eMudhra originally tested). K-C7 subtest (c) acquires its first numeric defender-cadence anchor (12 days, Vercel's platform-trust-store distrust propagation). K-C11-candidate acquires a sibling-primitive witness from the K-C7 adjacency (configuration-level input influencing security-policy enforcement path).

---

**Primary source:** [*Mozilla, Google, Apple block compromised eMudhra CA certificates*](https://www.bleepingcomputer.com/news/security/mozilla-google-apple-block-compromised-emudhra-ca-certificates/), BleepingComputer, 2026-10-21. **2026-10-29 cadence update sources:** [AWS Security Bulletin 2026-156-AWS](https://aws.amazon.com/security/security-bulletins/AWS-2026-156/) (CVE-2026-119115 PCA Connector authz); [Vercel KB bulletin 2026-10-27](https://vercel.com/kb/bulletin) (eMudhra platform-trust-store propagation). **Secondary:** [*eMudhra security blunder left trusted CA signing keys exposed to anyone*](https://www.helpnetsecurity.com/2026/10/21/emudhra-certificates-private-keys-compromised/), Help Net Security, 2026-10-21. **Go stdlib advisory:** [CVE-2026-111943](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-111943). **Mozilla OneCRL blocklist entry:** added 2026-10-17. **Mozilla root-store removal:** 2026-10-20.

**Standards cross-reference:** OWASP A02:2021 Cryptographic Failures · CWE-331 Insufficient Entropy · CWE-338 Use of Cryptographically Weak Pseudo-Random Number Generator · CWE-1240 Use of a Cryptographic Primitive with a Risky Implementation · MITRE ATT&CK T1552.004 Private Keys · MITRE D3FEND D3-CKA Cryptographic Key Attestation · NIST SP 800-57 Pt 1 Key Management Lifecycle · NIST SP 800-90A Deterministic Random Bit Generators · NIST SP 800-90B Entropy Sources · NIST SP 800-90C Random Bit Generator Constructions · NIST SP 800-131A Transitioning Cryptographic Algorithms · FIPS 140-3 Cryptographic Module Validation · BSI AIS 20/31 Entropy Source Evaluation · CA/Browser Forum Baseline Requirements § 6 · ETSI EN 319 411 (CA policy requirements) · ISO 27002:2022 8.24 Use of cryptography · SOC 2 CC6.1 (adjacent). Full mapping added in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion claim doc:** [`methodology/claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md`](../../methodology/claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md). **Companion oracle doc:** [`methodology/oracles/O-ROOT-OF-TRUST.md`](../../methodology/oracles/O-ROOT-OF-TRUST.md).
