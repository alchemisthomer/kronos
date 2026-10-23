# K-C8-SUPPLY-CHAIN-INTEGRITY

**Admitted:** 2026-10-22 · [LiteLLM 1.107.0 was never in the git tag](../../docs/blog/posts/2026-10-22-litellm-supply-chain-admission.md)
**Oracle:** [O-SUPPLY-CHAIN](../oracles/O-SUPPLY-CHAIN.md)
**Holder class:** every open-source project and every proprietary vendor whose users install an artifact the maintainer builds

## Statement

> For a target T whose shipped artifact is installed, invoked, or executed by downstream consumers, T can produce evidence that:
>
> **(a) Source-of-truth integrity.** The authoritative source repository is unmodified from the maintainer's stated intent. Commits are signed; the source tree is reproducible; any unauthorized change would be detectable.
>
> **(b) Build-pipeline integrity.** The artifact distributed to consumers was built from the authoritative source without injection, modification, or substitution during the build and publication process. Build happens in an isolated and attested environment; publication tokens are hardware-key protected; the pipeline itself is auditable.
>
> **(c) Downstream verifiability.** The installer / downstream consumer has an independent mechanism — not depending on T's own authority — to verify the received artifact matches the published source. SLSA provenance, Sigstore signatures, in-toto attestations, reproducible-build witnesses, TUF root-of-trust.

## The primitive

The primitive is **bitwise identity between what the maintainer wrote and what the installer runs**. The LiteLLM incident is the specific instance named by this claim's admission: the git tag was clean, the published wheel was not, and no downstream consumer had a way to tell the difference without the Socket / Aikido / JFrog teams raising the alarm after the fact.

Failure modes K-C8 refuses:

- **Source-side insertion** — attacker lands a malicious commit in the authoritative source repo. Boundary (a) failure. Caught by commit signing + code review + security audit of accepted PRs.
- **Build-side injection** — attacker compromises the build pipeline and injects payloads into the artifact without touching source. The LiteLLM shape. Caught by hardware-key MFA on publishing credentials + SLSA provenance + sigstore signing + reproducible builds.
- **Publication-side substitution** — attacker replaces an already-built artifact in the registry with a different one. Caught by content-addressed registry + signature verification at install time + TUF-style metadata freshness.
- **Install-side verification bypass** — downstream installer does not verify what the registry provides. Boundary (c) failure. Caught by requiring signature verification in package managers (which is spotty across ecosystems as of 2026-10).

K-C8 is distinct from K-C7 structurally: K-C7 is about the cryptographic anchor's integrity (the key is secret, generated with entropy, revocable); K-C8 is about the end-to-end identity of a software artifact across the publishing pipeline. K-C8 attestation infrastructure (Sigstore, TUF, in-toto) depends on K-C7 anchors; a K-C7 failure in Fulcio or Rekor would collapse K-C8 guarantees that depend on it.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence. Default. Also mandatory for any target whose supply-chain envelope was publicly demonstrated to fail (e.g., LiteLLM on subtest (b) as of 2026-10-21). |
| **L1** | Documented posture: (i) source-repo integrity controls (commit signing, branch protection, review requirements), (ii) build-pipeline description, (iii) publication-credential MFA posture, (iv) downstream verification mechanism offered (if any). |
| **L2** | Passes `O-SUPPLY-CHAIN` subtests (a), (b), (c) in a time-boxed engagement. Subtest (b) requires producing a reviewable build-pipeline attestation (SLSA level 2+ or equivalent). Subtest (c) requires demonstrating that a downstream consumer can verify the received artifact without trusting the publisher. |
| **L3** | Maintains L2 continuously. Builds are reproducible across time (bit-identical rebuild from source). Publication credentials are hardware-key MFA'd and rotated on cadence. Attestation infrastructure is monitored and verified. |

## Holder class

Enormous — see admission post for the enumeration. Highest-priority classes:

- **Every PyPI publisher** (LiteLLM shape — stolen GitHub CLI OAuth tokens → compromised build → malicious wheel).
- **Every npm publisher.**
- **Every container-registry publisher** — Docker Hub, GHCR, ECR, GCR, Quay.
- **Every language-ecosystem registry** — RubyGems, Crates.io, Maven Central, NuGet, Hex, Pub, Packagist, APT, RPM, Flatpak, Snap, Homebrew.
- **Every proprietary SaaS that ships a client SDK or auto-update binary.**
- **Every CI/CD action/orb/plugin publisher.**
- **Every container base-image publisher.**
- **Olympus-Grid.** The Pantheon fetches hundreds of npm packages per container build. Lockfile pinning (K-C8 subtest (b) partial) defends against post-publication tampering but **not** against the LiteLLM-shape publication-time compromise. The Pantheon also publishes its own container images to ECR — the publishing path is OIDC-authenticated (better than stored secrets, not hardware-key equivalent), unsigned (no Cosign), and un-attested (no SLSA provenance). Posture on both the consumption and the production sides: honest-L?.

## Related claims

- [K-C7-ROOT-OF-TRUST-INTEGRITY](K-C7-ROOT-OF-TRUST-INTEGRITY.md) — K-C8 attestation infrastructure depends on K-C7 anchors.
- [K-C5-REPRESENTATIONAL-EQUIVALENCE](K-C5-REPRESENTATIONAL-EQUIVALENCE.md) — K-C5-channel exploits (autograd-embedded malware in model weights) delivered via K-C8-channel distribution produce the full LLM-model-poisoning threat.
- [K-C6-ATTACKER-CADENCE-RESILIENCE](K-C6-ATTACKER-CADENCE-RESILIENCE.md) — K-C8 compromises hit at attacker cadence; the window between "malicious publish" and "worldwide install" is minutes to hours.

## Posts that touch this claim

- [LiteLLM 1.107.0 was never in the git tag](../../docs/blog/posts/2026-10-22-litellm-supply-chain-admission.md) — admission post
