# ADR-0006 — Industry standards alignment posture

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The Steward, Kronos
- **Supersedes:** None
- **Superseded by:** None

## Context

Enterprise adopters do not encounter kronos in a vacuum. They already operate under one or more compliance regimes (SOC 2, ISO 27001, PCI DSS, HIPAA, FedRAMP), consult one or more maturity models (BSIMM, OWASP SAMM, CIS Controls, NIST CSF), architect against one or more cloud-vendor frameworks (AWS Well-Architected, Azure, GCP), and — increasingly — pursue one or more AI-specific risk frameworks (NIST AI RMF, AIUC-1, ISO 42001, EU AI Act conformance).

The Steward's review of design v0 identified that the framework had been silent on how it relates to this landscape. This is both a marketing gap (enterprise buyers need to see kronos in relation to standards they already know) and a legitimate structural question (kronos scorecard dimensions have real overlap with several standards; not naming the relationships leaves adopters to invent their own mappings, which is expensive and error-prone).

The alignment question decomposes into three sub-questions:
1. Which standards does kronos compete with, complement, or ignore?
2. What mapping artifacts should kronos produce, and at what priority?
3. What is kronos's positioning claim relative to certification programs?

## Decision

Kronos adopts the positioning: **the adversarial verification layer beneath every industry certification claim.** The full alignment analysis is in [`methodology/INDUSTRY-ALIGNMENT.md`](../../methodology/INDUSTRY-ALIGNMENT.md); this ADR captures the architectural commitments that fall out of the positioning.

**Category 1 — Foundational standards** (kronos references as ground truth): MITRE ATT&CK, MITRE ATLAS, CAPEC, CWE, CVE. Kronos catalog entries carry tags for applicable ATT&CK/ATLAS technique IDs and CAPEC IDs; kronos findings reference CWE class and CVE ID where applicable. This alignment is structural — the tagging schema is part of the catalog entry and finding schema definitions.

**Category 2 — Complementary attainment-based standards** (kronos verifies claims made under these regimes): SOC 2 Type II, ISO/IEC 27001, PCI DSS, HIPAA/HITECH, FedRAMP, HITRUST CSF. Kronos produces per-standard mapping documents in `docs/alignment/` showing which scorecard dimensions and catalog entries help verify which controls. Kronos does not compete with the certification bodies; it produces evidence they can consume.

**Category 3 — Complementary maturity-based standards** (kronos scorecard is orthogonal peer): OWASP SAMM, BSIMM, NIST CSF 2.0, CIS Controls v8. Kronos scorecard measures adversarial-proof maturity; these measure process-presence maturity. Both are valuable. Kronos publishes mappings showing how the models compose.

**Category 4 — Complementary architectural standards** (kronos verifies architectural claims): AWS Well-Architected, Azure Well-Architected, GCP Architecture Framework. Kronos scorecard pillars map to Well-Architected pillars; mapping documents published as customer demand warrants.

**Category 5 — Mapping targets** (standards whose structure aligns tightly with kronos scorecard): OWASP ASVS L1/L2/L3, NIST AI Risk Management Framework 1.0. Explicit mapping documents are first-priority artifacts.

**Category 6 — Emerging AI-specific** (nascent standards; kronos is highly relevant): NIST AI RMF, AIUC-1, ISO/IEC 42001, EU AI Act conformance regimes. Mapping work tracked as standards mature.

**Explicit non-goals.** Kronos does not issue certifications. Kronos does not act as an authorized certification body. Kronos does not substitute for third-party audits. Kronos does not guarantee certification attainment. The line is clear: kronos produces evidence; certification bodies consume evidence (among other inputs) and issue certifications.

**Mapping artifact convention.** Mappings live at `docs/alignment/<standard-slug>-<version>.md` following a common template. Each mapping is versioned; when a standard revises, the mapping is updated with a version-bump commit.

**Priority order for initial mappings** (based on estimated customer demand and mapping tractability):
1. OWASP ASVS 4.0.3
2. NIST CSF 2.0
3. NIST AI RMF 1.0
4. SOC 2 TSC 2017
5. AWS Well-Architected Framework
6. OWASP SAMM 2.0
7. CIS Controls v8

Remaining standards produce mappings on customer demand.

## Consequences

### Positive

- Enterprise adopters can position kronos coherently within their existing compliance programs. The scorecard becomes evidence for the certifications they already pursue.
- The commercial narrative is strong: eos closes documentation requirements; kronos closes adversarial-evidence requirements; combined, the two frameworks move customers materially forward on any recognized certification path.
- MITRE ATT&CK / ATLAS / CAPEC alignment gives kronos catalog entries a well-known vocabulary; adopters can immediately see "which threats are in scope" using industry-standard identifiers.
- The kronos scorecard becomes multi-standard: each cell cites the industry-standard control IDs it helps verify. This makes the scorecard's certification-value visible at rendering time.
- Positioning as "adversarial verification layer beneath every certification" avoids competing with certification bodies while establishing a distinct, defensible category for kronos.

### Negative

- Mapping maintenance is real ongoing work. Standards revise every 1-3 years; each revision requires mapping updates. For long-lived kronos, mapping maintenance may become a significant fraction of framework maintenance burden. Mitigation: community-contribute per-standard mapping maintenance to security professionals who use the framework operationally.
- Some standards are moving very fast (NIST AI RMF, EU AI Act, ISO 42001). Alignment work on emerging standards is expensive and may need substantial revision. Mitigation: stable standards get mapping artifacts first; volatile standards are tracked with lightweight commentary until they stabilize.
- The "does not certify" boundary may be tested. Customers who want kronos to substitute for a SOC 2 audit will be disappointed. Explicit and repeated messaging is required.
- Explicit non-mapping declarations (controls in a standard that kronos does not verify) may reveal gaps in kronos coverage that competitors can exploit. This is acceptable — false completeness claims would be worse than acknowledged gaps.

### Neutral

- Some standards may become important over time (e.g., a currently-obscure AI safety framework may become industry-canonical if a major regulator adopts it). The alignment posture is designed to accommodate additions without restructuring — new mapping documents drop into `docs/alignment/` without changing the underlying framework.
- The alignment positioning is a marketing claim as much as a technical one. Whether it holds against enterprise procurement rigor is a question the design review process should interrogate.

## References

- [`methodology/INDUSTRY-ALIGNMENT.md`](../../methodology/INDUSTRY-ALIGNMENT.md) — the alignment analysis in full.
- [`methodology/SEVEN-CLAIMS.md`](../../methodology/SEVEN-CLAIMS.md) — the seven novel-property claims. Consider whether the alignment posture constitutes an eighth claim; deferred to the LLM review cycle for determination.
- [`methodology/SCORECARD.md`](../../methodology/SCORECARD.md) — the scorecard model. Mapping artifacts cite scorecard dimensions.
- ADR-0003 — scorecard as north star. Mappings from scorecard cells to industry control IDs make the scorecard's certification-value directly visible.
