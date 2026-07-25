# Industry standards alignment

> Kronos does not certify. Kronos falsifies. Every industry certification produces claims of the form "we do X"; kronos verifies whether those claims survive adversarial pressure. This positions kronos underneath rather than parallel to certifications — not a competitor to auditors, but the mechanism by which their attestations become empirically defensible.

## Purpose

Enterprise adopters do not encounter kronos in a vacuum. They already operate under one or more compliance regimes (SOC 2, ISO 27001, PCI DSS, HIPAA, FedRAMP), consult one or more maturity models (BSIMM, OWASP SAMM, CIS Controls, NIST CSF), architect against one or more cloud-vendor frameworks (AWS Well-Architected, Azure Well-Architected, GCP Architecture Framework), and — increasingly — pursue one or more AI-specific risk frameworks (NIST AI RMF, AIUC-1, ISO 42001, EU AI Act conformance).

This document names each of these landscapes explicitly, describes kronos's relationship to it (complementary, foundational, or competitive), and commits to the specific mapping artifacts kronos will produce so that adopters can position kronos coherently within their existing compliance programs.

The alignment principle is (revised in v0.2 per ChatGPT's cross-LLM review to narrow the scope): **kronos is an adversarial and continuous evidence-producing companion for selected technical and operational control objectives across recognized assurance frameworks.** Kronos does not adversarially verify every claim in every certification — many certification requirements concern governance, personnel, contracts, privacy processes, physical controls, board oversight, and organizational conduct that kronos cannot mechanically test. Kronos contributes evidence to the specific technical and operational controls that are within reach of an adversarial or continuous evaluation.

Attainment of any specific certification remains outside kronos's scope. Kronos does not audit. Kronos does not issue certifications. Kronos does not act as an authorized certification body. What kronos does is produce reproducible, evidence-backed answers to the question *"under adversarial pressure, does the control actually hold?"* — answers that certification bodies, auditors, and enterprise stakeholders can consume as inputs to their own decisions.

## The alignment principle in one sentence

**Certifications describe the intent; kronos describes the survival.**

## The landscape, categorized

### Foundational — kronos references these as ground truth

These standards provide the taxonomies kronos catalog entries and findings are tagged against. They are foundational because kronos does not compete with them; kronos uses their vocabulary.

**MITRE ATT&CK** — the knowledge base of adversary tactics and techniques observed in real-world attacks. Every kronos catalog entry that maps to an attack observed in the wild is tagged with the corresponding ATT&CK technique IDs. This gives kronos adopters a well-known frame of reference for "what threats am I defending against?" and makes kronos evidence directly consumable by threat intelligence teams.

**MITRE ATLAS** — the ML-focused equivalent of ATT&CK, cataloging adversarial machine learning tactics and techniques. Kronos AI-specific catalog entries (for engagements against AI systems) are tagged with ATLAS technique IDs. This is the primary alignment vehicle for kronos's coverage of AI systems.

**CAPEC (Common Attack Pattern Enumeration and Classification)** — MITRE's attack pattern taxonomy. Kronos catalog entries cross-reference CAPEC IDs where applicable, providing an additional common vocabulary alongside ATT&CK.

**CWE (Common Weakness Enumeration)** — MITRE's software weakness taxonomy. Kronos findings reference the CWE class of weakness demonstrated, allowing findings to roll up into industry-wide weakness statistics and comparison with static-analysis tool findings.

**CVE (Common Vulnerabilities and Exposures)** — the industry vulnerability identifier system. Kronos findings that demonstrate a specific published CVE reference the CVE ID. Note that kronos catalog entries are typically CLASSES of attack, not specific CVEs — the catalog entry may spawn findings referencing many different CVEs against different targets.

### Complementary — attainment-based (kronos verifies claims made under these regimes)

These are the certification regimes enterprise buyers navigate. Kronos does not attempt to attain any of them; kronos produces the evidence that supports their attainment.

**SOC 2 Type II** — the audit report standard for service organizations, published by the AICPA. Trust Services Criteria: Security, Availability, Processing Integrity, Confidentiality, Privacy. Kronos will publish `SOC2-CONTROL-MAPPING.md` (paralleling the eos artifact of the same name) showing which SOC 2 control categories each kronos scorecard dimension and each catalog entry class helps verify. The positioning: eos provides the process documentation that SOC 2 auditors read; kronos provides the adversarial evidence that the documented processes actually work.

**ISO/IEC 27001** — international standard for information security management systems. Annex A enumerates 93 controls (in the 2022 revision). Kronos will publish an ISO 27001 mapping showing which Annex A controls each catalog entry class helps verify. Particularly relevant for control categories A.5 (Organizational), A.8 (Technological), and Annex A's audit-and-monitoring requirements.

**PCI DSS** — payment card industry security standard. Very prescriptive. Kronos is particularly relevant to Requirement 11 (Regularly Test Security of Systems and Networks) and Requirement 6 (Develop and Maintain Secure Systems). Kronos will publish a PCI DSS mapping showing which requirements each catalog entry helps verify.

**HIPAA / HITECH** — US healthcare data protection. Similar complementary positioning; kronos verifies that access controls, audit trails, and integrity guarantees actually hold under adversarial pressure.

**FedRAMP** — US federal cloud authorization. Kronos evidence contributes to FedRAMP continuous monitoring requirements. Alignment will be pursued if a customer with FedRAMP goals commissions the mapping work.

**HITRUST CSF** — healthcare-focused unified framework covering HIPAA, PCI, ISO 27001, NIST 800-53. Kronos alignment inherits from the underlying frameworks.

### Complementary — maturity-based (kronos scorecard is a peer, orthogonal dimension)

These are maturity models similar in shape to the kronos scorecard but measuring different properties (process maturity, capability presence). Kronos is complementary because it measures a different property (adversarial-proof maturity) that the process-maturity models cannot measure.

**OWASP SAMM (Software Assurance Maturity Model)** — 15 practices in 5 business functions (Governance, Design, Implementation, Verification, Operations), each scored 1-3. SAMM measures whether an organization has a security practice; kronos scorecard measures whether the practice's outputs survive adversarial pressure. The two are orthogonal; both are valuable. Kronos will publish an OWASP SAMM mapping showing how kronos evidence composes with SAMM assessments.

**BSIMM (Building Security In Maturity Model)** — descriptive rather than prescriptive; captures what real organizations do across 12 practices. Kronos scorecard is more prescriptive than BSIMM. The two are complementary — BSIMM tells you what your industry peers do; kronos tells you where your defenses actually hold.

**NIST Cybersecurity Framework (CSF) 2.0** — six functions (Govern, Identify, Protect, Detect, Respond, Recover). Very well-recognized in enterprise. Kronos scorecard's four pillars map to NIST CSF as follows:

| Kronos pillar | NIST CSF function |
|---|---|
| Perimeter & Access | Protect |
| Runtime Integrity | Protect + Detect |
| Operational Discipline | Govern + Identify |
| Response Readiness | Respond + Recover |

Kronos will publish a NIST CSF 2.0 mapping showing per-dimension alignment to CSF categories and subcategories.

**CIS Controls v8** — 18 top-level controls organized in three Implementation Groups (IG1, IG2, IG3). Kronos is particularly relevant to CIS Control 18 (Penetration Testing) and provides evidence supporting continuous verification of controls 1-17. Kronos will publish a CIS Controls mapping.

### Complementary — architectural (kronos verifies architectural claims)

Cloud-vendor architectural frameworks describe best practices for building on the vendor's platform. Kronos verifies whether the best-practices-followed claim actually holds under attack.

**AWS Well-Architected Framework** — six pillars (Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability). Alignment:

| Kronos pillar | AWS WAF pillar(s) |
|---|---|
| Perimeter & Access | Security |
| Runtime Integrity | Reliability + Performance Efficiency |
| Operational Discipline | Operational Excellence + Cost Optimization |
| Response Readiness | Reliability + Operational Excellence |

Kronos will publish an AWS Well-Architected mapping. Particularly relevant is the Security pillar's design principle "Apply security at all layers" — kronos is the mechanism by which "applied" becomes verifiable rather than aspirational.

**Azure Well-Architected Framework** — five pillars (Reliability, Security, Cost Optimization, Operational Excellence, Performance Efficiency). Similar alignment structure; mapping to be published as customer demand warrants.

**Google Cloud Architecture Framework** — six pillars (System Design, Operational Excellence, Security & Privacy, Reliability, Cost Optimization, Performance Optimization). Similar alignment; mapping to be published as customer demand warrants.

### Mapping targets — verification-forward (standards whose model kronos scorecard aligns tightly)

These are standards whose structure has significant overlap with the kronos scorecard model. Explicit mapping documents are highest-value here.

**OWASP ASVS (Application Security Verification Standard)** — updated in v0.2 to reference the current version **ASVS 5.0.0** (released May 30, 2025), not the v0.1-referenced 4.0.3. ASVS 5.0.0 organizes application security controls across three levels (L1 opportunistic, L2 standard, L3 advanced) with revised category structure from prior versions. Kronos scorecard cells cite the ASVS 5.0.0 control IDs each engagement helps verify. Kronos ASVS mapping is a first-priority artifact.

Positioning: an application that has passed kronos engagements covering the ASVS L2 or L3 control set has an assurance claim substantially stronger than one that has only self-assessed against ASVS. Kronos is an adversarial-verification companion for the technical controls within ASVS's scope.

**NIST AI Risk Management Framework (AI RMF 1.0)** — four functions (Govern, Map, Measure, Manage) with subcategories under each. Published January 2023; rapidly becoming the reference framework for AI risk in US government and enterprise contexts. Kronos is particularly relevant to the Measure function — AI systems make claims (this model refuses harmful content; this RAG isolates tenants; this agent respects tool authorization) that are otherwise entirely trust-based; kronos can be the canonical adversarial verifier of those claims.

Kronos NIST AI RMF mapping will detail how kronos engagements against AI systems produce evidence supporting each Measure subcategory. This is a strategic mapping — the AI safety industry is nascent, and kronos positioning as the adversarial verification arm of AI RMF establishes early standing in a rapidly-consolidating field.

### Emerging AI-specific — kronos is highly relevant, alignment work is early

The AI risk landscape is evolving rapidly. Kronos will track these and publish alignment as they mature.

**OWASP AISVS 1.0** — Artificial Intelligence Security Verification Standard, released June 24, 2026. First-priority AI-specific mapping target. Provides verification requirements for AI systems paralleling ASVS for applications. Kronos AI engagements cite AISVS 1.0 requirement IDs.

**OWASP LLMSVS 2.0** — Large Language Model Security Verification Standard. Complementary to AISVS with focused LLM-specific requirements. Kronos LLM-target engagements cite LLMSVS 2.0 requirement IDs.

**OWASP AI Testing Guide** — repeatable trustworthiness testing across application, model, infrastructure, and data layers. Referenced by kronos AI-target engagement plans.

**AIUC-1** — AI Underwriting Company Level 1 certification, an emerging framework for AI risk certification aimed at insurability of AI systems. Kronos engagement evidence directly supports AIUC-1 assessment criteria around AI system safety and reliability. Mapping to be published as the AIUC-1 specification stabilizes.

**ISO/IEC 42001** — the first international standard for AI management systems (published December 2023). Establishes requirements for organizational AI risk management. Kronos evidence supports ISO 42001 conformance particularly in the operational-controls and continuous-improvement clauses.

**EU AI Act conformance regimes** — the EU AI Act (published August 2024) requires high-risk AI systems to demonstrate conformance to specific technical standards (risk management, data governance, technical documentation, transparency, accuracy, robustness, cybersecurity). Kronos is directly relevant to the robustness and cybersecurity requirements. Mapping to be published as the EU harmonized standards for AI Act conformance emerge from the CEN-CENELEC working groups.

**Anthropic Responsible Scaling Policy / OpenAI Preparedness Framework / Google DeepMind Frontier Safety Framework** — company-specific frameworks for evaluating frontier AI system risks. Kronos does not compete with these frameworks (they are internal AI-lab governance), but kronos engagements against AI systems can produce evidence that complements the internal evaluations these frameworks require.

## Machine-readable mapping via OSCAL and OpenCRE

Per ChatGPT's cross-LLM review, kronos does not build all mappings as bespoke markdown. The v0.2 mapping strategy uses two existing machine-readable substrates:

**NIST OSCAL (Open Security Controls Assessment Language)** — defines machine-readable models for control catalogs, assessment plans, observations, findings, risks, evidence, assessment assets, and continuous assessment results. Kronos's domain-model schemas (see DOMAIN-MODEL.md) support OSCAL import/export or a defined profile. This means:

- A kronos engagement's observations, findings, and evidence manifest can be exported as an OSCAL Assessment Results document consumable by OSCAL-aware GRC platforms.
- An OSCAL Control Catalog (NIST 800-53, ISO 27001, PCI DSS, etc.) can be imported as a source of claim mappings.
- Downstream integrations with continuous ATO systems, third-party GRC platforms, and audit-preparation tools follow the standard OSCAL contract rather than kronos-specific integrations.

**OpenCRE (Open Common Requirement Enumeration)** — cross-references requirements across security standards. Kronos claim identifiers map to OpenCRE IDs, which in turn map to specific requirements across every standard OpenCRE indexes. This means:

- A kronos claim need be mapped only to OpenCRE once; the OpenCRE-to-standard mappings are inherited from OpenCRE's maintenance.
- Adopters pursuing multiple certifications get multi-standard coverage from a single claim mapping.
- Kronos does not need to independently maintain per-standard mappings for every standard OpenCRE already indexes.

Recommended mapping structure:

```
Kronos claim ID
  ↔ OpenCRE IDs (via OpenCRE maintainers' cross-references)
  ↔ OSCAL control/objective IDs (via OSCAL catalog import)
  ↔ ASVS 5.0.0 / AISVS 1.0 / LLMSVS 2.0 requirements
  ↔ ATT&CK / ATLAS / CAPEC / CWE identifiers (in the catalog entry)
```

This structure means the framework's mapping-maintenance burden is materially lower than a bespoke-mapping-per-standard approach. Kronos maintains claim-to-OpenCRE and claim-to-OSCAL mappings; the industry maintains OpenCRE-to-standard and OSCAL-to-standard mappings.

### Adjacent — not yet mapped, worth tracking

**PSD2** (EU payment services), **DORA** (EU financial services operational resilience), **CMMC** (US defense contractor cybersecurity maturity), **NIS2** (EU network and information security), **SOC 3** (public trust services report), **CSA STAR** (cloud security alliance), **APRA CPS 234** (Australian financial services). All potentially relevant depending on customer profile; alignment work initiated on demand.

## Positioning statements

Depending on the audience, kronos's positioning against industry standards can be stated in different phrasings, all consistent with the alignment principle:

**For security teams:** *"Kronos is the adversarial verification layer beneath your existing compliance program. Your SOC 2 auditor reads controls; kronos runs attacks against those controls; the resulting scorecard is evidence you can attach to your SOC 2 report."*

**For engineering teams:** *"OWASP ASVS tells you what secure-application controls should exist. Kronos runs the attacks that would succeed if the controls did not exist. Your ASVS L2 claim is stronger when it is backed by a passing kronos scorecard against the ASVS L2 control set."*

**For executive teams:** *"Kronos maps to every major industry framework — NIST CSF, ASVS, SAMM, AWS Well-Architected, PCI DSS. Your kronos scorecard cites the industry-standard control IDs your board and auditors already recognize. The scorecard is the evidence that translates 'we comply with framework X' into 'we survive adversarial pressure against framework X's controls'."*

**For AI teams:** *"NIST AI RMF and AIUC-1 tell you what AI risk management should look like. Kronos runs the attacks that would surface the risks the frameworks describe. If your AI system passes kronos engagements against the RMF Measure subcategories, you have adversarial evidence — not just process documentation — supporting your AI RMF claims."*

**For consulting engagements** (revised in v0.2 per ChatGPT — eos does not "close paperwork" for third-party certifications): *"We help you pursue certification X. Eos supports control documentation and technical attestation of the aspects of the certification within its scope; kronos closes the actual-defense-works verification for the technical and operational controls within its scope. Neither framework substitutes for the third-party audit engagement; both contribute evidence the auditor and the certification body consume."*

## Mapping artifacts kronos will produce

For each standard in the Complementary and Mapping-Target categories above, kronos will produce a mapping document in `docs/alignment/` following a common template:

```
docs/alignment/
├── README.md                      # index of mappings
├── owasp-asvs-5.0.0.md            # first-priority artifact
├── nist-csf-2.0.md                # first-priority artifact
├── nist-ai-rmf-1.0.md             # first-priority artifact
├── soc-2-tsc-2017.md              # first-priority artifact
├── iso-iec-27001-2022.md          # second-priority (customer-demand triggered)
├── aws-well-architected.md        # second-priority
├── owasp-samm-2.0.md              # third-priority
├── cis-controls-v8.md             # third-priority
├── pci-dss-4.0.md                 # customer-demand triggered
└── ...
```

Each mapping document contains:

1. Overview of the target standard
2. Table of kronos scorecard dimensions mapped to standard's control categories
3. Table of kronos catalog entries mapped to standard's control IDs
4. Guidance on how kronos evidence composes with the standard's audit or certification process
5. Explicit non-mappings — controls in the standard that kronos does not attempt to verify (and why)

Mappings are versioned. When a standard revises (e.g., ASVS 5.0.0 → 6.0), the mapping is updated in place with a version-bump commit.

## What kronos does NOT do with respect to industry certifications

Explicit non-goals to prevent scope creep:

- Kronos does not issue certifications of any kind.
- Kronos does not act as an authorized auditor or certification body under any regime.
- Kronos does not substitute for third-party audit engagements (SOC 2, ISO 27001, PCI DSS require external auditors).
- Kronos does not guarantee certification attainment. A passing kronos scorecard is one input among many; certification bodies have their own criteria.
- Kronos does not consult on certification strategy beyond producing the mapping artifacts. Certification strategy is the operator's responsibility (or their consulting engagement's, if the operator retains the consulting practice for that purpose).

The line is clear: kronos produces evidence; certification bodies consume evidence (among other inputs) and issue certifications. Kronos stays firmly on the evidence-production side of the line.

## Novelty consideration for patent claim structure

The positioning of kronos as "the adversarial verification layer beneath every industry certification" may constitute a novel property beyond the seven claims already articulated in [`INVENTIVE-CONCEPT-CANDIDATES.md`](INVENTIVE-CONCEPT-CANDIDATES.md). Prior work in the certification-preparation tool space includes vulnerability scanners (which produce technical evidence without a certification-mapping structure), governance/risk/compliance platforms like RSA Archer, ServiceNow GRC (which produce documentation without adversarial evidence), and consulting practices (which produce narrative reports without reproducible evidence).

None of these prior tools combine: (a) adversarial-proof evidence, (b) structural mapping to multiple industry-standard control frameworks, (c) explicit positioning as verification-layer-beneath-certification rather than certification-competitor, (d) mapping artifacts that are versioned and updateable as standards revise, and (e) evidence that composes across multiple standards from a single engagement.

Whether this constitutes an eighth claim distinct from the seven already articulated, or is subsumed within claim 3 (executive maturity scorecard driven by adversarial proof) or claim 5 (adversarial coevolution through system-agnostic threat catalog), is a question for the design review cycle. Recommendation: flag for reviewer consideration; defer decision until the LLM review has interrogated the claim structure for novelty independent of any specific enumeration.

## Open questions

**Q1. Certification-mapping maintenance burden.** Each mapping is a versioned artifact that must be revised when the underlying standard revises. For long-lived kronos, this becomes a real maintenance load. Consider whether mapping maintenance should be community-contributed (a per-standard maintainer per mapping) or contracted (partnership with an audit firm to maintain mappings professionally).

**Q2. Certification-body relationships.** Would formal partnerships with certification bodies (e.g., an AICPA endorsement for SOC 2 mapping accuracy, a CENELEC engagement for EU AI Act mapping) strengthen the alignment claim? Or would such partnerships compromise kronos's independent adversarial posture?

**Q3. Cross-standard control synthesis.** Many controls appear in multiple standards under slightly different names (SOC 2's CC6.1 access control ≈ ISO 27001 A.5.15 ≈ PCI DSS 7.1 ≈ CIS Control 6). Should kronos maintain a synthesized control taxonomy that maps to all applicable standards from one internal reference? This would reduce per-standard mapping duplication but adds an internal-taxonomy maintenance burden.

**Q4. AI-specific frameworks are moving fast.** NIST AI RMF, EU AI Act, ISO 42001, AIUC-1 are all evolving. Kronos alignment work on emerging standards is expensive and may need to be redone as standards stabilize. Recommend: publish alignment mappings for stable standards (SOC 2, ISO 27001, ASVS) first; treat AI-specific mappings as strategic bets that may need substantial revision.

**Q5. Standards positioning in the runner UI.** The kronos runner renders the scorecard. Should the scorecard also render, per-cell, which industry-standard control IDs that cell's evidence supports? This makes the scorecard's certification-value immediately visible but adds significant rendering complexity. Defer to Phase 3+ of the runner roadmap.
