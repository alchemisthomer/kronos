# Kronos ↔ industry-standard cross-references

Kronos is a claim-centric discipline, not a compliance regime. But Kronos's claims and oracles map, by construction, to well-known industry standards. This document is the mapping. Posts and claim docs cite these identifiers so readers who think in OWASP or NIST or SOC 2 can locate what a Kronos claim is actually measuring.

## Why Kronos uses external identifiers

Three reasons:

1. **Shared vocabulary.** When a Kronos post says "the primitive that failed is the tenant-secret envelope," a reader who has not read `K-C1-TENANT-SECRET-ENVELOPE.md` yet still gets purchase if the post adds "(see also OWASP A02, CWE-312)."
2. **Compliance adjacency.** Many Kronos targets are measured by auditors against SOC 2, ISO, PCI, HIPAA. If a Kronos finding also fails SOC 2 CC6.1, the target team now has two reasons to care, and the auditor-side evidence may already be partially assembled.
3. **Falsifiability check.** External standards are a sanity check on Kronos's own claim boundaries. A claim that doesn't map to any external identifier may be measuring something nobody else measures (interesting but suspect) or measuring nothing coherent at all (reject).

Kronos never *reduces* a claim to its external identifiers. A Kronos claim always has at least one load-bearing assertion that no external identifier covers in isolation. The identifiers are reference points, not definitions.

## Standards consulted

- **OWASP Top 10 (2021 revision)** — https://owasp.org/Top10/
- **OWASP ASVS (Application Security Verification Standard) v4.0.3** — https://owasp.org/www-project-application-security-verification-standard/
- **OWASP SAMM (Software Assurance Maturity Model) v2** — https://owaspsamm.org/
- **MITRE CWE (Common Weakness Enumeration)** — https://cwe.mitre.org/
- **MITRE ATT&CK** — https://attack.mitre.org/ — for mapping attack-matrix entries in engagements
- **MITRE D3FEND** — https://d3fend.mitre.org/ — defensive countermeasures taxonomy
- **NIST Cybersecurity Framework 2.0** — https://www.nist.gov/cyberframework
- **NIST SP 800-53 Rev. 5** — security and privacy controls — https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final
- **NIST SP 800-61 Rev. 2** — incident response — https://csrc.nist.gov/pubs/sp/800/61/r2/final
- **NIST SP 800-171 Rev. 3** — controlled unclassified information
- **NIST SP 800-34 Rev. 1** — contingency planning
- **ISO/IEC 27001:2022** — ISMS
- **ISO/IEC 27002:2022** — controls
- **ISO 22301:2019** — business continuity
- **AICPA SOC 2 Trust Services Criteria (2022)** — https://www.aicpa-cima.com/
- **CIS Controls v8** — https://www.cisecurity.org/controls/v8
- **PCI DSS v4.0** — https://www.pcisecuritystandards.org/
- **CSA Cloud Controls Matrix (CCM) v4** — https://cloudsecurityalliance.org/research/cloud-controls-matrix

## Mapping — Kronos claims to external identifiers

### K-C1-TENANT-SECRET-ENVELOPE

| Standard | Identifier | Relevance |
|---|---|---|
| OWASP Top 10 | **A02:2021 Cryptographic Failures** | directly maps the inner-boundary and retrieval-boundary subtests |
| OWASP Top 10 | **A01:2021 Broken Access Control** | directly maps the outer-boundary subtest |
| OWASP Top 10 | **A09:2021 Security Logging & Monitoring Failures** | maps the retrieval-boundary auditability subtest |
| OWASP ASVS | **V2 Authentication** | outer-boundary |
| OWASP ASVS | **V3 Session Management** | outer-boundary (token-replay) |
| OWASP ASVS | **V6 Stored Cryptography** | inner-boundary |
| OWASP ASVS | **V9 Communications** | retrieval-boundary (in-transit) |
| OWASP ASVS | **V10 Malicious Code** | not directly, but adjacent (supply-chain) |
| MITRE CWE | **CWE-312 Cleartext Storage of Sensitive Information** | the archetypal inner-boundary failure |
| MITRE CWE | **CWE-522 Insufficiently Protected Credentials** | retrieval-boundary + storage |
| MITRE CWE | **CWE-798 Use of Hard-coded Credentials** | the sibling anti-pattern Kronos is explicitly adversarial to |
| MITRE CWE | **CWE-287 Improper Authentication** | outer-boundary |
| MITRE CWE | **CWE-863 Incorrect Authorization** | outer-boundary cross-tenant |
| MITRE ATT&CK | **T1552 Unsecured Credentials** | the attack technique the envelope defends against |
| MITRE ATT&CK | **T1555 Credentials from Password Stores** | adjacent technique |
| NIST SP 800-53 | **SC-28 Protection of Information at Rest** | inner-boundary control |
| NIST SP 800-53 | **IA-5 Authenticator Management** | retrieval-boundary (how secrets are issued and rotated) |
| NIST SP 800-53 | **AU-2 Event Logging** / **AU-9 Protection of Audit Information** | retrieval-boundary auditability |
| NIST CSF 2.0 | **PR.DS-01 Confidentiality of data at rest** | inner-boundary |
| NIST CSF 2.0 | **PR.AC-01 Identities and credentials** | outer-boundary |
| ISO 27002:2022 | **8.24 Use of cryptography** | inner-boundary |
| ISO 27002:2022 | **5.17 Authentication information** | retrieval-boundary |
| SOC 2 | **CC6.1 Logical and physical access controls** | outer-boundary |
| SOC 2 | **CC6.6 Logical access security — infrastructure** | inner-boundary |
| SOC 2 | **CC6.7 Transmission of information** | retrieval-boundary |
| CIS Controls | **CIS 3 Data Protection** | inner-boundary |
| CIS Controls | **CIS 6 Access Control Management** | outer-boundary |
| CSA CCM | **CEK (Cryptography, Encryption & Key Management)** domain | inner-boundary |
| CSA CCM | **IAM (Identity & Access Management)** domain | outer-boundary |

### K-C2-PLATFORM-CONTINUITY

| Standard | Identifier | Relevance |
|---|---|---|
| OWASP SAMM | **Operations: Incident Management** | the shutdown-decision subtest |
| MITRE CWE | **CWE-1053 Missing Documentation for Design** | the "shutdown-criteria must be pre-published" subtest |
| NIST SP 800-53 | **CP-2 Contingency Plan** | subtests (a) and (b) |
| NIST SP 800-53 | **CP-9 System Backup** / **CP-10 System Recovery and Reconstitution** | subtest (c) |
| NIST SP 800-53 | **MP-6 Media Sanitization** | destruction attestation in subtest (c) |
| NIST SP 800-34 Rev. 1 | **entire document** | this is the methodological reference for continuity planning |
| NIST CSF 2.0 | **RC (Recover) function** | all three subtests |
| ISO 22301:2019 | **entire standard** | business continuity management; K-C2 is a Kronos-shaped subset |
| ISO 27002:2022 | **5.29 Information security during disruption** | shutdown-decision + migration |
| ISO 27002:2022 | **8.14 Redundancy of information processing facilities** | adjacent (not directly tested by K-C2 but holder-relevant) |
| SOC 2 | **CC9.1 Risk mitigation for business disruptions** | subtests (a), (b), (c) jointly |
| SOC 2 | **A1.2 Environmental protections, software, data back-up processes** | subtest (c) |
| CIS Controls | **CIS 11 Data Recovery** | subtest (c) |
| CSA CCM | **BCR (Business Continuity Management & Operational Resilience)** domain | all three subtests |

### K-C3-OBSERVABILITY-HONESTY

| Standard | Identifier | Relevance |
|---|---|---|
| OWASP Top 10 | **A09:2021 Security Logging & Monitoring Failures** | the primitive this claim measures |
| OWASP ASVS | **V7 Error Handling and Logging** | subtests (a) and (c) |
| MITRE CWE | **CWE-693 Protection Mechanism Failure** | subtest (a) failure mode |
| MITRE CWE | **CWE-778 Insufficient Logging** | subtest (c) failure mode |
| MITRE CWE | **CWE-779 Logging of Excessive Data** | adjacent (not directly tested but holder-relevant) |
| MITRE CWE | **CWE-1053 Missing Documentation for Design** | the "T_detect must be pre-stated" element of subtest (c) |
| MITRE ATT&CK | **T1562 Impair Defenses** | the attack class subtest (a) measures |
| MITRE ATT&CK | **T1562.001 Disable or Modify Tools** | the Sol-incident shape |
| MITRE ATT&CK | **T1562.002 Disable Windows Event Logging** | sibling, same primitive |
| MITRE ATT&CK | **T1562.008 Disable or Modify Cloud Logs** | sibling, same primitive |
| MITRE D3FEND | **D3-SICA System Internal Consistency Analysis** | the architectural posture subtest (b) requires |
| NIST SP 800-53 | **AU-2 Event Logging** | all three subtests |
| NIST SP 800-53 | **AU-6 Audit Review, Analysis, and Reporting** | subtest (c) |
| NIST SP 800-53 | **AU-9 Protection of Audit Information** | subtest (a) |
| NIST SP 800-53 | **AU-12 Audit Record Generation** | subtest (c) |
| NIST SP 800-53 | **SI-4 System Monitoring** | subtest (c) heartbeat requirement |
| NIST CSF 2.0 | **DE.CM Continuous Monitoring** | all three subtests |
| NIST CSF 2.0 | **DE.AE Adverse Event Analysis** | subtest (c) |
| ISO 27002:2022 | **8.15 Logging** | subtests (a) and (c) |
| ISO 27002:2022 | **8.16 Monitoring activities** | subtests (b) and (c) |
| SOC 2 | **CC7.2 Monitoring activities** | all three subtests |
| SOC 2 | **CC7.3 Evaluating and communicating deficiencies** | subtest (b) |
| CIS Controls | **CIS 8 Audit Log Management** | all three subtests |
| CSA CCM | **LOG (Logging and Monitoring)** domain | all three subtests |

## How a post cites

A Reckonings post that uses this mapping cites by identifier, not by URL (URLs rot; identifiers don't):

> *"The primitive that failed at Railway is covered by OWASP A02:2021 and CWE-312; the measurement Kronos uses is K-C1-TENANT-SECRET-ENVELOPE, which goes further than either by requiring observable auditability at the retrieval boundary (AU-2/AU-9 in NIST SP 800-53 terms)."*

The identifier makes the post readable to an auditor; the Kronos claim id makes it readable to the operator. Both audiences are intended.

## When a new claim is admitted

Admission always includes a mapping to this document. If an admission post or doctrine reckoning cannot name at least one external identifier the claim relates to, the operator should pause and ask whether the claim is actually measuring something or just naming a feeling.

## Mapping drift

Standards versions change. A reader finding this doc years from now should check whether OWASP Top 10 has advanced past 2021, whether NIST SP 800-53 is past Rev. 5, whether ISO has published 27001:2027. The identifiers are stable; the version-anchored tables above may need updating.

Mapping updates are doctrine reckonings — see `../docs/blog/concept.md`.
