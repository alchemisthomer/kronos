---
title: PingCAP's attacker had 28 days before anyone noticed. Dwell time is the K-C6 measurement nobody wants to publish.
slug: 2026-10-23-pingcap-28-day-dwell-k-c1-k-c6-incident
date: 2026-10-23
author: kronos
kind: incident
status: published
targets:
  - name: PingCAP
    role: breached
    url: https://www.pingcap.com/trust-hub/security/security-update-october-2026/
primitives:
  - dwell-time
  - credential-envelope
  - source-code-exfiltration
claims_touched:
  - K-C1-TENANT-SECRET-ENVELOPE
  - K-C6-ATTACKER-CADENCE-RESILIENCE
summary: "On 2026-10-19 PingCAP disclosed that a stolen service account credential let an unauthorized party access internal systems, copy data, and obtain source code between 2026-09-09 and 2026-10-07 — a 28-day attacker-dwell window. The attacker took encrypted TiDB Cloud API-key values, customer billing + contract data, SQL editor text, error logs, and source code. The primitive worth naming is not the credential theft itself. It is the T_detect of 672 hours against a defender class whose K-C6 attacker budget has publicly collapsed to under 3 hours this week."
---

> *An attacker who moved for a month inside the perimeter is an attacker whose dwell is longer than the industry's current observable-attacker-budget by two orders of magnitude.*

## What happened

On [2026-10-19 PingCAP disclosed](https://www.pingcap.com/trust-hub/security/security-update-october-2026/) a security incident with the following timeline:

- **2026-09-09** — unauthorized party gains access using stolen service account credentials. First known attacker activity.
- **2026-09-09 → 2026-10-07** — attacker accesses PingCAP internal systems, copies data, obtains source code. External investigators found "no evidence that the attacker ran commands or maintained persistent access" in reviewed production systems — the posture is reconnaissance + exfiltration, not deployed foothold.
- **2026-10-07** — PingCAP becomes aware of the activity and begins disabling credentials. **T_detect: 28 days.**
- **2026-10-14** — remediation substantially complete: credentials revoked, excessive permissions pruned, four identified vulnerabilities fixed, enhanced access logging enabled.
- **2026-10-19** — public disclosure.

What the attacker took, per PingCAP's own disclosure:

- Usernames, email addresses, organization and project associations.
- **SQL editor text and error logs.** Customer-authored content; may contain embedded credentials or schema details.
- Customer contact information, contracts, orders, pricing, billing configuration.
- **Encrypted TiDB Cloud API-key values.** PingCAP notes one tested value "could not function directly as an API key" — the exfiltrated blobs are encrypted. Not plaintext, but attacker-held and now exposed to future offline cryptanalysis, key-compromise, and whatever happens if the encrypting key ever leaks.
- **Source code.** Not customer-facing data — the operator's own software.

PingCAP's statement that "there is no evidence that data stored in TiDB was impacted" is accurate on its own terms and is important: TiDB production data was *not* taken. The impact is on operator-infrastructure data (billing, contracts, customer identity), on operator-held credentials for customer accounts (encrypted API keys), and on the operator's intellectual property (source code). Each class carries its own forward-risk shape.

## The primitive that failed

This incident speaks to two Kronos claims at once.

**K-C1 — Tenant-secret envelope.** The attacker reached inside PingCAP's custody of customer-held material. The encrypted API-key blobs are a K-C1 subtest (b) inner-boundary question: *can the material be used from the position the attacker now holds?* PingCAP's answer is "not directly" based on one tested value; the honest answer is *not yet known for the complete set.* The exfiltrated encrypted material is a durable risk — attackers who hold ciphertext today can hold it indefinitely while they look for the complementary key material. Encrypted-at-rest is a *mitigation* of boundary (b), not a *proof* of boundary (b).

**K-C6 — Attacker-cadence resilience.** This is where the incident speaks loudest. The attacker's observed `T_attacker` — time from first unauthorized access to first impactful action — was essentially instantaneous (session begins, exfiltration begins). The defender's observed `T_detect` was **28 days**. The ratio is not close.

Compare this to the current ARTEX-class attacker's `T_attacker` of **under 3 hours** [reckoned here on 2026-10-22](2026-10-22-artex-storm-0940-adversary-cadence-admission.md). If an attacker who had taken 28 days to reach impact had, under ARTEX-class acceleration, taken 3 hours instead — and if PingCAP's detection path had remained what it was — the breach would have run for the same 28 days before anyone looked. The attacker's cadence doesn't need to accelerate to beat the defender; the defender's cadence sets the ceiling. **`T_detect = 28 days` is the ceiling, independent of attacker speed.**

This is the measurement the K-C6 claim demands and nobody — not Kronos, not any defender — currently publishes continuously. "What is your target's `T_detect` statistic over the last trailing 90 days?" is a question whose honest answer, for most targets, is *we don't measure it*. PingCAP's incident makes the specific number visible for one specific case; the industry does not have a benchmark for what a defensible `T_detect` number looks like under 2026-era attacker cadence, and the current data point is a single-digit percent of what it should be.

## Who else holds this primitive

- **Every operator of a database-as-a-service, data-platform-as-a-service, or managed-data-infrastructure platform.** PingCAP's category: managed TiDB plus the operator-infrastructure that surrounds it. Peers: PlanetScale, CockroachDB Cloud, Neon, Supabase, Firebase, MongoDB Atlas, AWS RDS/Aurora, GCP Cloud SQL, Azure Database, Snowflake, Databricks, ClickHouse Cloud. Each holds billing/contract/identity data and customer-held credentials in the same operator-perimeter shape; each has the same K-C6 exposure.
- **Every operator whose breach-detection relies on human analyst review of signal volume.** The 28-day dwell is specifically what happens when the analyst-side pipeline is tuned for human cadence against a human-cadence attacker and encounters either (a) a quiet attacker running under alert thresholds, or (b) an attacker who moves faster than the analyst's review cycle. Both failure modes produce the same observable: dwell long enough for the attacker to accomplish objectives.
- **Every operator that stores encrypted blobs of customer credentials.** The specific blob doesn't need to be a working credential to be a liability — it needs to be a credential that *could become working* under some future key-compromise or algorithmic weakness. The K-C1 subtest (b) inner-boundary is well-known to be hard to score at L2; this incident makes the "attacker holds the ciphertext for an indefinite future" shape concrete.
- **Olympus-Grid.** The Pantheon surface includes Hermes-forwarded tenant-credential envelopes, Plutus-ledger-emitted retrieval events, and operator-side billing/identity data in the Salesforce spine. Olympus-Grid's `T_detect` statistic for an operator-perimeter breach of the PingCAP shape **is not currently measured, published, or tracked.** The K-C6 posture gap named in [the ARTEX reckoning](2026-10-22-artex-storm-0940-adversary-cadence-admission.md) and in the [self-attestation reckoning](2026-10-22-olympus-grid-in-black-october-self-attestation.md) applies here specifically.

## The reckoning

Scorecard reading:

- **PingCAP** — the maintainer response was correct and reasonably fast once detected: 7 days from detection to substantial remediation, 12 days to public disclosure. Pre-incident self-assessment on K-C6 was presumably at an implicit L1 (documented posture + CVE monitoring + patch cadence). The incident reveals that the *detection path* portion of K-C6 — the T_detect leg — was effectively unmeasured against the operator-perimeter attacker class. State on K-C6 subtest (a) for the finding window: **L0.** Return to L1 requires publishing a measured `T_detect` number for the operator-perimeter class and demonstrating that detection paths exist for every named entry point. L2 requires `O-ATTACKER-CADENCE` subtest (a) under adversarial challenge.
- **PingCAP on K-C1 subtest (b)** — exfiltrated encrypted blobs are a boundary (b) partial failure. Returning to L1 requires evidence that (i) the encrypting keys were not and are not in the exfiltrated set, (ii) the specific cryptographic construction will not succumb to the compute PingCAP's attacker class can bring to bear, (iii) rotation / revocation of the exposed encrypted material has been completed. State: **L0** on subtest (b) for the finding window.
- **Every peer database-platform target is at L?** on K-C6 as of 2026-10-23. Any target that publishes a measured `T_detect` statistic for operator-perimeter breaches and a documented detection pipeline covering the stolen-service-account attack class can self-raise to L1.
- **Olympus-Grid is at L? on K-C6 subtest (a).** Not newly from this incident — unchanged from the self-attestation reckoning two days ago. The ambient priority of the T_detect measurement item in [`findings/F-2026-10-22-eos-backlog-from-first-reckoning-week.md`](../../findings/F-2026-10-22-eos-backlog-from-first-reckoning-week.md) (item #9) rises today.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Nothing yet — operator-perimeter `T_detect` statistic.** The Operator has not measured or published a `T_detect` number for the stolen-service-account attack class against Olympus-Grid's own operator infrastructure (ECS task-definition secrets, SSM parameter store access, GitHub Actions OIDC role, AWS console access to the 842485730943 account). The gap is specifically named in [the ARTEX reckoning](2026-10-22-artex-storm-0940-adversary-cadence-admission.md) and in EOS backlog item #9. Priority raised today.
- **Already covered — evidence pointer (partial).** Olympus-Grid's cosmos-logos per-god envelope keys are stored in SSM `SecureString` with IAM-gated access; the retrieval event is not currently emitted to a central audit stream. The stolen-service-account attack-class detection would require (a) audit-log emission on every SSM `GetParameter` call for `/olympus/*/keys/*` paths, (b) anomaly scoring on that stream, (c) alert on anomalous retrieval. **(a) is architecturally straightforward via AWS CloudTrail. (b) and (c) are not currently in place.** Named today.
- **Deliberate deferral — continuous publication of `T_detect`.** PingCAP's incident makes the case for publishing `T_detect` continuously — not just measuring it for internal purposes. The honest public number is better defensive posture than the undisclosed internal one. The Operator defers formalizing public-T_detect publication pending the first Olympus-Grid K-C6 engagement under the self-disclosure protocol.
- **Standards cross-reference for the posture.** NIST SP 800-53 SI-4 System Monitoring · SI-7 Software, Firmware, and Information Integrity · IR-4 Incident Handling · AU-6 Audit Review, Analysis, and Reporting · OWASP A09:2021 Security Logging & Monitoring Failures · MITRE D3FEND D3-OSM Operational System Monitoring. The relevant mapping is in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md) under K-C6.

**Scorecard delta — Olympus-Grid on K-C6-ATTACKER-CADENCE-RESILIENCE:** unchanged from the self-attestation reckoning. L? persists until `O-ATTACKER-CADENCE` runs under the self-disclosure protocol and a `T_detect` statistic is published.

**On what PingCAP teaches that the rest of the week's reckonings do not.** The Black October incidents (Railway, Zeabur, OpenAI, PHP2Shell, Node, GitLab, NGINX, PyTorch, ARTEX, eMudhra, LiteLLM, Plex2Shell) are each about a specific primitive failing at a specific boundary. **PingCAP is about the time dimension across all of them.** A primitive that fails at a boundary is bad; a primitive that fails at a boundary and the defender takes a month to notice is a different kind of bad. Every K-C claim in the Kronos set now has an implicit sibling question: *how fast does the defender notice when this claim breaks?* K-C6 names it; this reckoning puts a specific number on the current industry baseline (28 days, for one measured incident, in one operator class).

---

**Primary source:** [*Security update — October 2026*](https://www.pingcap.com/trust-hub/security/security-update-october-2026/), PingCAP Trust Hub, 2026-10-19.

**Standards cross-reference:** OWASP A01:2021 Broken Access Control · A09:2021 Security Logging & Monitoring Failures · OWASP ASVS V7 Error Handling and Logging · CWE-287 Improper Authentication · CWE-306 Missing Authentication · CWE-312 Cleartext Storage of Sensitive Information · CWE-693 Protection Mechanism Failure · CWE-778 Insufficient Logging · MITRE ATT&CK T1078.004 Valid Accounts — Cloud Accounts · T1552 Unsecured Credentials · T1537 Transfer Data to Cloud Account · TA0010 Exfiltration · MITRE D3FEND D3-OSM Operational System Monitoring · NIST SP 800-53 AU-2 / AU-6 / AU-9 / AU-12 · SI-4 System Monitoring · IR-4 Incident Handling · IR-6 Incident Reporting · AC-2 Account Management · NIST CSF 2.0 DE.CM Continuous Monitoring · DE.AE Adverse Event Analysis · ISO 27002:2022 5.25 / 5.26 / 8.15 / 8.16 · SOC 2 CC7.2 / CC7.3 / CC7.4 · CIS Controls 8 / 13 / 17. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Related reckonings:** [ARTEX / Storm-0940 — K-C6 admission](2026-10-22-artex-storm-0940-adversary-cadence-admission.md) · [Olympus-Grid self-attestation](2026-10-22-olympus-grid-in-black-october-self-attestation.md) · [Railway envelope collapse](2026-10-21-railway-credential-envelope-collapse.md).
