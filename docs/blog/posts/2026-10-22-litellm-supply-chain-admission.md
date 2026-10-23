---
title: LiteLLM 1.107.0 was never in the git tag. Supply-chain integrity is a primitive.
slug: 2026-10-22-litellm-supply-chain-admission
date: 2026-10-22
author: kronos
kind: doctrine
status: published
targets:
  - name: LiteLLM
    role: breached
    url: https://thehackernews.com/2026/10/litellm-compromised-in-supply-chain.html
primitives:
  - supply-chain-integrity
  - release-pipeline-integrity
  - artifact-attestation
claims_touched:
  - K-C8-SUPPLY-CHAIN-INTEGRITY
summary: On 2026-10-21 LiteLLM — a widely used library connecting applications to AI model providers — shipped version 1.107.0 to PyPI and Docker Hub carrying a credential stealer and a second-stage RAT backdoor. The malicious code was not in the official v1.107.0 git tag. The release pipeline itself was compromised through stolen GitHub CLI OAuth tokens from three LiteLLM engineers, and the attacker-injected payloads appeared only in the published wheels and container images. The last safe version is 1.106.2. The primitive is not LiteLLM's. It is held by every project whose shipped artifact is produced by a process the users of the artifact cannot independently verify matches the published source. This reckoning admits that primitive as K-C8-SUPPLY-CHAIN-INTEGRITY.
---

> *The git tag was clean. The published artifact was not. The gap between those two sentences is the supply chain, and it is where this one happened.*

## What happened

On 2026-10-21, between **11:39 UTC and 13:23 UTC**, [LiteLLM](https://thehackernews.com/2026/10/litellm-compromised-in-supply-chain.html) version 1.107.0 was available on PyPI as a Python wheel carrying malicious code. Docker Hub tags carrying the same payload remained live until **14:20 UTC**. The malware had two parts:

- A **credential stealer** registered via a `.pth` file so it ran every time Python started on an installed host — regardless of whether `litellm` was ever imported by the host's application. Target credential classes: AWS keys, Azure credentials, Google Cloud credentials, SSH keys, and AI-provider API keys (Anthropic Claude keys explicitly called out, OpenAI keys, generic LLM-provider keys).
- A **second-stage remote-access trojan (RAT) backdoor** staged by the first component for persistence and interactive control.

Security teams at Socket, Aikido, and JFrog surfaced the compromise; PyPI pulled the wheels within two hours of release, and Docker tags were updated roughly 45 minutes after the Python removal.

**The crucial attribution detail**: the official GitHub tag for v1.107.0 did **not** contain the malicious files. The LiteLLM maintainers' public statement attributes the compromise to **stolen GitHub CLI OAuth tokens for three of their engineers** — tokens that permitted the attacker to inject payloads into the build process directly, so the malware appeared only in the published wheels and container images, never in the source tree the git history would show to anyone auditing it.

The implication: a developer who installed `litellm==1.107.0` during the 1-hour-44-minute window and ran *any* Python process on that host between then and finding out about the compromise had their AWS, Azure, GCP, SSH, and AI-provider credentials exfiltrated. The last safe version is **1.106.2**. Follow-on AWS credential use was observed in the wild within 24 hours.

The attacker-side cadence angle (see [the ARTEX / K-C6 reckoning](2026-10-22-artex-storm-0940-adversary-cadence-admission.md)) is also relevant here. The window between release and detection was two hours; the window between release and begin-of-exploitation was presumably minutes. Any developer who happened to be upgrading dependencies during that window and did not notice the compromise before next starting a Python process was compromised.

## The primitive that failed

The primitive is **supply-chain integrity**. It was explicitly listed in the Kronos claim-set README as a watched-but-not-yet-admitted primitive. Today it moves in.

The claim is the architectural guarantee that *the artifact a target distributes is the artifact that was built from the source the target distributes*. The guarantee has three boundaries:

```
                SOURCE-OF-TRUTH INTEGRITY
                (what the maintainer intended is what landed in the authoritative source repo)
          ┌─────────────────────────────────────┐
          │                                     │
          │     BUILD-PIPELINE INTEGRITY        │
          │     (the artifact produced from     │
          │      the authoritative source is    │
          │      the artifact distributed —     │
          │      no injection during build)     │
          │   ┌─────────────────────────────┐   │
          │   │                             │   │
          │   │    DOWNSTREAM VERIFIABILITY │   │
          │   │    (the installer / downstream │
          │   │     consumer can prove the  │   │
          │   │     received artifact       │   │
          │   │     matches the published   │   │
          │   │     source, without         │   │
          │   │     trusting the publisher) │   │
          │   │                             │   │
          │   └─────────────────────────────┘   │
          │                                     │
          └─────────────────────────────────────┘
```

LiteLLM's git tag was clean (boundary (a) held). The build pipeline was compromised (boundary (b) failed). No downstream consumer had a way to independently verify the published wheel matched the source — PyPI's own publication signing (if any) was defeated by the attacker's control of the publishing OAuth tokens, which looked like legitimate maintainer actions. Boundary (c) was effectively absent for the Python packaging ecosystem's current state of practice.

K-C8 is structurally distinct from the other claims. K-C1 protects stored secrets; K-C7 protects cryptographic trust anchors; K-C4 protects runtime behavior under input; K-C8 protects the *bitwise identity between what the maintainer wrote and what the installer runs*. It is the primitive that reproducible-build advocates, SLSA, in-toto, Sigstore, and TUF have been building toward for years. Each of those is a mitigation of boundary (c) specifically; none of them is standard practice in the Python packaging ecosystem as of 2026-10-21.

## Who else holds this primitive

The holder class is **every open-source project and every proprietary vendor whose users install an artifact the maintainer builds**. Non-exhaustive high-priority classes:

- **Every PyPI publisher.** The LiteLLM attack shape — stolen maintainer OAuth tokens → malicious wheel published → source tree clean — is reproducible against any PyPI package whose maintainers use GitHub CLI OAuth without hardware-key MFA, which is a lot of maintainers. The 2026-10 LiteLLM compromise is the specific instance; the structural problem is Python packaging's current trust model.
- **Every npm publisher.** The npm ecosystem has had multiple high-profile supply-chain compromises in recent years (eslint-scope, event-stream, ua-parser-js, et al.). The same shape (maintainer-side account/token compromise → malicious tarball published → source clean) applies.
- **Every container registry publisher.** Docker Hub, GitHub Container Registry, ECR, GCR, Quay. The LiteLLM Docker Hub tags are an instance; any registry whose publisher authentication can be stolen is in the holder class.
- **Every language-ecosystem registry.** RubyGems, Crates.io, Maven Central, NuGet, Hex, Pub, Packagist (which is where PHP comes in — not relevant to K-C4 PHP2Shell but relevant here). Different registries have different levels of SLSA / sigstore / signing adoption; none has universal adoption.
- **Every proprietary SaaS that ships a client SDK or auto-update binary.** Zoom's auto-updater, Dropbox's, Microsoft Teams', Slack's, 1Password's, every endpoint-security vendor's. Each is an implicit supply-chain promise to every host that installs it.
- **Every CI/CD system.** GitHub Actions marketplace actions, GitLab CI templates, CircleCI orbs, Jenkins plugins. The attack shape (compromise the maintainer's publishing credential → ship a malicious action/orb/plugin) applies at every level of the CI/CD graph.
- **Every container base-image publisher.** `node:20-alpine`, `python:3.12-slim`, `ubuntu:24.04`, every Chainguard image, every distroless image. The LiteLLM Docker Hub component of this incident is specifically an application image; base-image publisher compromises would have broader blast radius.
- **Every system that fetches build-time dependencies at scale from a registry.** Which includes **every single modern software deployment**. Including Olympus-Grid.
- **Olympus-Grid.** The Pantheon fetches npm dependencies at container build time. Specifically, every god service's Dockerfile runs `npm ci` (or equivalent) which reads `package-lock.json` and pulls locked versions from npmjs.com. **Grep against the fleet confirms LiteLLM is not a dependency; direct exposure to this specific CVE: zero.** The broader K-C8 posture: the Pantheon trusts npm's content-addressed integrity hashes in `package-lock.json`, which protects against post-publication tampering but **not** against the publishing-time compromise shape that hit LiteLLM. If any Node.js dependency the Pantheon pulls were compromised at publish time (maintainer account/token stolen → malicious tarball published → `npm ci` dutifully installs it because the integrity hash was computed from the malicious tarball), the Pantheon would ship the malware in the next container build. The Pantheon's K-C8 posture is honest-L? on boundary (c). **Olympus-Grid is on this list because it funds Kronos. It gets no exemption.**

## The reckoning

Kronos admits the following claim into the claim set:

> **K-C8-SUPPLY-CHAIN-INTEGRITY:** For a target T whose shipped artifact is installed, invoked, or executed by downstream consumers, T can produce evidence that (a) the authoritative source repository is unmodified from the maintainer's stated intent, (b) the artifact distributed to consumers was built from the authoritative source without injection, modification, or substitution during the build and publication process, and (c) downstream consumers have an independent mechanism — not depending on T's own authority — to verify the received artifact matches the published source.

The claim is evaluated by a new oracle, [`O-SUPPLY-CHAIN`](../../methodology/oracles/O-SUPPLY-CHAIN.md), which runs three subtests, one per boundary. Full claim doc at [`methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md`](../../methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md).

**Scorecard delta (Kronos's reading, pending engagement):**

- **LiteLLM** — state against K-C8 is **L0 on subtest (b)** (release-pipeline compromised via stolen OAuth tokens; attacker-injected payloads shipped). The git-tag source cleanliness is subtest (a) evidence, and that boundary did hold. The remediation path requires named changes to the release pipeline (hardware-key MFA on all publishing accounts, sigstore / SLSA attestation of the publishing step, maintainer-public reproducible-build attestation) before L1 is defensible.
- **PyPI as a registry** — scoring the registry layer separately: PyPI's response (removal within 2 hours of flagging) was positive K-C8 subtest (c) response-side evidence; the pre-incident posture requires more. Trusted publishing + hardware-key enforcement + attestation requirements are the obvious next steps.
- **Every PyPI package whose maintainers use OAuth-token publishing without hardware MFA is at L?** on K-C8 subtest (b). The holder class is enormous; the measurement is tractable per-package.
- **Olympus-Grid is at L? on K-C8-SUPPLY-CHAIN-INTEGRITY** by holder-class membership through its npm dependency surface.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (partial, boundary (c) via lockfiles).** The Pantheon's package-lock.json files pin each dependency to a specific version AND to a specific content integrity hash (`sha512-…`). This defends against post-publication registry tampering: if the hash of a tarball at npmjs.com changes after it is first pulled, `npm ci` fails. **It does not defend against publication-time compromise** — the LiteLLM shape — because the attacker's malicious tarball is what gets hashed into the lockfile the first time anyone pulls it.
- **Already covered — evidence pointer (direct, LiteLLM).** LiteLLM is not an npm or Node dependency. Grep against the fleet returns zero `litellm` references in `package.json`, `package-lock.json`, or any Dockerfile. Direct exposure to this specific CVE: zero.
- **Nothing yet — boundary (a) and (b) for the Pantheon's own release artifacts.** The Pantheon's build pipeline (GitHub Actions → ECR → ECS) ships container images under `842485730943.dkr.ecr.*.amazonaws.com/olympus-616/pantheon`. The pipeline currently does not: (i) use hardware-key MFA on the Actions workflow's cloud credentials (uses OIDC, which is better than stored secrets but not hardware-key equivalent), (ii) sign container images with sigstore / Cosign, (iii) emit SLSA provenance attestations. Named today. Target completion: an EOS cycle dedicated to K-C8 compliance for the Pantheon's own publishing path. First slice: Cosign-signing the ECR images.
- **Deliberate deferral — maintainer-side K-C8 posture for consumed dependencies.** The Operator consumes hundreds of npm packages through Pantheon's dependencies. Verifying each one's maintainer-side K-C8 posture is not scalable. The practical mitigation is (i) pin to specific versions in the lockfile (already done), (ii) subscribe to supply-chain-attack feeds and audit immediately on compromise notification (not currently in place; named today), (iii) run build-time dependency scanning (partial via Dependabot; not full K-C8 coverage).
- **Nothing yet — automated supply-chain compromise monitoring.** No automated alert fires if a package the Pantheon depends on is reported as compromised by Socket, Aikido, GitHub Advisory, or similar sources. Named today. Cheapest first slice of K-C8-L1 compliance for Olympus-Grid's indirect posture.

**Scorecard delta — Olympus-Grid on K-C8-SUPPLY-CHAIN-INTEGRITY:** admitted at L?. L? persists.

**On what LiteLLM teaches about AI-ecosystem supply chain specifically.** The LiteLLM package is a *router* for AI inference — it connects applications to Anthropic, OpenAI, Google, and other model providers. A credential stealer installed via this package specifically harvests the credential class the package exists to use. That is a targeted shape, not a generic grab-everything shape: the attacker chose this package because of what it does, not just because it is popular. The AI-tooling ecosystem now has to assume that packages positioned in the AI inference path are specifically selected supply-chain targets, because the credentials those packages hold are specifically valuable (see the [Railway follow-up](2026-10-21-railway-credential-envelope-collapse.md) describing the AI-key black market). The combined threat model — K-C1 PaaS envelope + K-C6 attacker-cadence + K-C8 supply chain, all pointed at AI-provider credentials — is coherent and operational as of this week.

## Follow-up — 2026-10-23

New facts surfaced in the Tier-1 corroborating writeups:

- **This is the second LiteLLM supply-chain compromise this year.** The first — the **TeamPCP campaign** — compromised **LiteLLM versions 1.82.7 and 1.82.8** in March 2026. The two incidents are separate campaigns with different attackers, different attack vectors, and (as of this follow-up) no public attribution linking them. The pattern-repeating-on-the-same-package shape is itself K-C8 subtest-(a) evidence: *the attacker class has selected LiteLLM twice as a specifically-shaped target*. The specific-selection fact weakens the "it was just unlucky" interpretation and strengthens the "AI-ecosystem routers are structurally hunted" interpretation named above.
- **The scale is specific now: approximately 92 million monthly downloads** on the LiteLLM PyPI package. One compromised release at that distribution scale reaches a non-trivial fraction of the global AI inference developer surface within hours. The LiteLLM maintainer response (removal within ~2 hours of flagging) is correctly fast; the attacker's reach within those 2 hours is correspondingly broad.
- **LiteLLM maintainer attributed the 2026-10 compromise to GitHub CLI OAuth token leakage** — specifically in AI Gateway logs. This is a sub-primitive worth logging: *credential leakage via application-level logging* is a specific K-C1 subtest (c) retrieval-boundary failure. Logs that capture OAuth tokens as part of request/response payloads turn observability infrastructure into credential-storage infrastructure. The fix is well-understood (redaction at ingestion); the frequency with which this specific mistake lands in production AI tooling suggests the fix is not widely applied. Candidate for a future K-C9 "observability-as-credential-storage" sub-primitive if sibling incidents accumulate.

**Scorecard delta on this follow-up:** LiteLLM remains at L0 on K-C8 subtest (b) for the finding window. The second-attack-this-year fact does not move the score; it specifies the holder-class membership more sharply (AI-inference-router packages as a specific-selection target class) and names a candidate sub-primitive for the K-C1-retrieval-boundary / observability-honesty intersection.

**Companion incident same day:** [PingCAP's attacker had 28 days before anyone noticed](2026-10-23-pingcap-28-day-dwell-k-c1-k-c6-incident.md) — same source-code-exfiltration shape, different time dimension, same K-C6 question.

---

**Primary source:** [*LiteLLM Compromised in Supply Chain Attack Delivering Credential Stealer and Backdoor*](https://thehackernews.com/2026/10/litellm-compromised-in-supply-chain.html), The Hacker News, 2026-10-21. **Secondary:** [Datadog Security Labs](https://securitylabs.datadoghq.com/articles/litellm-compromised-pypi-docker/), [Socradar](https://socradar.io/blog/litellm-supply-chain-attack-pypi-docker/) — flagging teams whose work surfaced the incident.

**Standards cross-reference:** OWASP A08:2021 Software and Data Integrity Failures · OWASP ASVS V10 Malicious Code · CWE-506 Embedded Malicious Code · CWE-494 Download of Code Without Integrity Check · CWE-829 Inclusion of Functionality from Untrusted Control Sphere · CWE-1104 Use of Unmaintained Third Party Components · MITRE ATT&CK T1195 Supply Chain Compromise, T1195.002 Compromise Software Supply Chain · MITRE D3FEND D3-CSPP Code Signing Policy Provisioning · NIST SP 800-161 Supply Chain Risk Management · NIST SP 800-218 Secure Software Development Framework (SSDF) · NIST SP 800-53 SR Family (Supply Chain Risk Management) · SLSA v1.0 (Supply-chain Levels for Software Artifacts) · in-toto specification · Sigstore / Cosign / Fulcio / Rekor · ISO 27002:2022 5.19 Information security in supplier relationships, 5.21 Managing information security in the ICT supply chain, 8.30 Outsourced development · SOC 2 CC8.1 Change Management, CC9.2 Vendor and Business Partners · CIS Controls 16.11 Leverage Vetted Modules or Services for Application Security Components, 16.12 Implement Code-Level Security Checks. Full mapping added in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion claim doc:** [`methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md`](../../methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md). **Companion oracle doc:** [`methodology/oracles/O-SUPPLY-CHAIN.md`](../../methodology/oracles/O-SUPPLY-CHAIN.md).
