# Inventive concept candidates

The following are candidate differentiators and potential inventive concepts of the kronos methodology. **Novelty, non-obviousness, claim scope, and freedom-to-operate have not been established.** Each candidate below is a hypothesis that would require professional prior-art analysis before it could be characterized as a novel claim.

This document was renamed from `SEVEN-CLAIMS.md` in v0.2 per ChatGPT's cross-LLM review, which correctly noted that the v0/v0.1 use of "claim" and "no prior methodology" language was too strong given the presence of significant adjacent prior art. Explicit prior-art acknowledgments appear below each candidate.

## Deferred decision — patent strategy vs open-source moat strategy

The Claude cross-LLM design review of v0 flagged a real tension in the framing. Several of the candidates describe methodology, process, or business method; in the US these face steep subject-matter-eligibility headwinds under the Alice/§101 framework. The technically-defensible mechanisms — enumeration reconciliation, execution-provenance signing, git-history scorecard recomputation, capacity-model-based plausibility evaluation — are stronger patent-claim candidates but are not what the earlier numbered list emphasized. Separately, the framework is designed in public, open-sourced under AGPL, and publishes findings by default; each is arguably a public disclosure that starts US patent-clock windows and can foreclose non-US absolute-novelty patentability.

The operator has elected to preserve both framings for now and defer the strategic decision until IP counsel review. This document lists candidate concepts for both purposes:

- If the strategy resolves toward patent play, this document will be revised to narrow to technical mechanisms only, a US provisional will be filed before further public disclosure, and the repository visibility may be adjusted during the provisional-filing window. Candidates 3, 5, and 8 below are the strongest patent-claim candidates on their face; the others describe methodology/process patterns that face steeper eligibility hurdles.
- If the strategy resolves toward open-source moat play, this document will be retained as a differentiators document without patent framing. AGPL, brand, ecosystem, and consulting practice become the primary defensive moat.
- If the strategy resolves toward hybrid (narrow patent scope on technical mechanisms + open-source moat on methodology), this document will be revised to distinguish the two categories explicitly.

The reader should treat every use of "candidate" or "differentiator" below as provisional pending IP counsel review. **This document does not claim patentability of any of the concepts below.**

## Prior-art landscape acknowledged

Per ChatGPT's cross-LLM review, several adjacent bodies of prior art bear on kronos's candidate concepts. Absolute assertions of novelty ("no prior methodology") are removed from v0.2 in favor of explicit prior-art acknowledgment:

- **NIST SP 800-115** — formalizes planning, execution, reporting, authorization constraints, and rules-of-engagement templates for technical security assessment. Kronos's authorization model builds on and extends NIST SP 800-115's ROE precedent rather than inventing it from scratch.
- **MITRE CALDERA** — automated adversary emulation using ATT&CK; well-established in research and operational forms.
- **Atomic Red Team** — structured, portable, reproducible tests mapped to ATT&CK for defensive-control validation.
- **Breach-and-Attack-Simulation (BAS) platforms** (AttackIQ, SafeBreach, Cymulate, others) — continuous control validation, evidence collection, coverage and trend reporting, executive posture dashboards. Kronos's continuous assurance plane and scorecard rendering overlap conceptually with BAS platforms; the differentiation must be established on specific mechanisms rather than on the general idea of continuous validation.
- **NIST OSCAL** — machine-readable models for control catalogs, assessment plans, observations, findings, risks, and continuous assessment results. Kronos's domain model should support OSCAL import/export rather than reinvent the schema layer.
- **OpenCRE** — cross-references requirements across security standards. Kronos's per-claim mapping to industry standards should use OpenCRE as its cross-reference backbone.
- **ATT&CK-based scoring research** — academic and industry proposals for enterprise-security assessment scorecards driven by ATT&CK coverage exist (Astrophysics Data System has published work on this specifically).
- **SLSA (Supply-chain Levels for Software Artifacts)** — provides terminology and a precedent for cryptographic provenance of artifacts. Kronos's execution-provenance signing borrows the SLSA provenance concept and adapts it to challenge-execution provenance rather than build-artifact provenance.
- **AGPL v3** — the license's actual scope is narrower than the v0 documents implied. AGPL requires a modified network-accessible version to offer corresponding source to its users. It is not an authorization control, not a use restriction, not a detection mechanism, not a liability shield.

The kronos candidates below may still be novel in their specific conjunction and specific mechanisms, but the argument for novelty cannot rest on the assumption that these adjacent bodies do not exist.

---

---

## 1. Presumption-of-failure as governance discipline

Every claim a system makes about itself is treated as FALSE until kronos has been unable to falsify it via bounded, authorized adversarial attack. The framework does not certify systems as safe; it publishes the enumeration of attacks that were run and did not succeed. The absence of a finding is documented as "not yet broken by the current threat catalog," never as "verified secure."

This inverts the presumption underlying prior software assurance regimes (SOC 2, ISO 27001, PCI DSS, FedRAMP, HIPAA), all of which optimize for confirming compliance against declared controls rather than searching structurally for the failure of those controls. Prior regimes ask *"can we produce evidence that control X is in place?"* Kronos asks *"can we produce evidence that control X does NOT hold under adversarial pressure?"*

The consequence is that a kronos-endorsed system's assurance posture is stated in the negative — it is a claim about what could not be broken — which is a fundamentally stronger epistemic position than the affirmative certification claim. A negative claim is falsifiable by a single counterexample; an affirmative claim is unfalsifiable except by an audit that has the same confirmation bias that produced it.

## 2. Dialectic with attestation as complementary epistemic backbone

Kronos operates in structured opposition to an attestation framework (specifically the eos methodology, though the pattern generalizes). Where the attestation framework asks *"what does the system claim to do, and can we produce evidence it does that?"* — kronos asks *"can we produce evidence that the claim is false?"* Neither framework is complete alone. A system that has been attested but never adversarially challenged has claims that are internally coherent but empirically untested. A system that has been adversarially challenged but never attested has defenses that hold but no coherent statement of what they defend.

The two frameworks together form the epistemic backbone of readiness proof: attestation states what the system does, kronos falsifies the statement, the loop closes only when both frameworks agree. When an attestation is falsified, kronos automatically files a new backlog cycle in the attestation framework, closing the feedback loop without human intervention.

Both frameworks operate independently — either can be adopted without the other — but their conjunction is strictly more powerful than either alone.

This dialectic-based readiness proof, in which two complementary methodologies are structurally coupled through a shared filesystem-native artifact bus (git), has no direct analogue in prior software engineering practice.

## 3. Executive maturity scorecard driven by adversarial proof

The framework produces, as a first-class output alongside findings, a maturity scorecard rendering the target's assurance posture as a matrix of software-lifecycle dimensions against maturity levels. The scorecard is composed of four pillars — perimeter and access, runtime integrity, operational discipline, response readiness — divided into twelve dimensions, each scored on a six-level maturity scale drawn from the Capability Maturity Model Integration (CMMI) tradition.

**The load-bearing property is that maturity above Level 3 is only reachable via kronos falsification attempts.** Levels 0-3 can be reached via documentation, process, and attestation alone. Levels 4 and 5 — quantitatively managed and continuously optimizing — require adversarial proof, because the definition of those levels involves the system withstanding attack, not merely claiming it would. Under this framework, no amount of policy documentation or vendor certification reaches Level 4; the level itself is defined as *"the specific attack was run, the specific defense fired, the specific telemetry landed, the specific evidence was retained."*

The scorecard is the executive-consumable artifact of the framework — the answer to *"is my software safe"* rendered as a matrix of colored cells with drill-down to underlying evidence. It doubles as a commercial primitive: a fixed-scope assessment produces a baseline scorecard; a fixed-scope engagement moves specific dimensions from red to green; the scorecard delta is the deliverable and the sales artifact both.

No prior maturity model in software assurance (BSIMM, OWASP SAMM, NIST CSF, ISO 27001 Maturity) makes the upper levels of the model structurally dependent on adversarial proof. All treat maturity as a function of process presence rather than adversarial survival.

## 4. Git-native evidence bus with public-by-default findings

Every attack executed, every oracle evaluation, every finding written, every remediation validated is a markdown file committed to the target's repository. There is no separate finding database, no vendor cloud, no proprietary artifact format. If the target's repository is public, its findings are public. If the repository is private, its findings are private. Access control is repository access control.

Evidence artifacts (request/response chains, telemetry excerpts, screenshots, log snippets) are stored alongside the finding markdown, hashed, and referenced by content-addressable identifier. A finding is reproducible from the repository state alone — no external state is required to re-execute the attack, re-evaluate the oracle, and confirm the result.

Public-by-default findings implement a philosophical commitment: the framework operates as an open challenge to the universe. Any observer can read the target's scorecard, drill into the underlying findings, verify the evidence hashes, and independently re-run the attacks. A claim that "the system withstood attack X" is verifiable by any third party who can access the repository — not merely by the operator who ran the engagement.

Prior software assurance methodologies persist findings in proprietary tools (JIRA, ServiceNow, vendor SaaS security-posture products, PDF audit reports) whose access model is separate from the source-code access model. Kronos collapses the two: source access is finding access, and findings are as portable, forkable, and inspectable as the code they evaluate.

## 5. Adversarial coevolution through system-agnostic threat catalog

The framework maintains a top-level, system-agnostic threat catalog — a versioned inventory of attack classes organized by category (identity, perimeter, integrity, availability, cost, supply-chain, and so on). Each catalog entry describes a class of attack in abstract terms, its common instantiations, references to published incidents and research, and suggested detection signals. Catalog entries are not tied to any specific target; they are the periodic table of adversarial pressure.

An engagement instantiates specific catalog entries against a specific target's architecture. As the target hardens (defenses added, attestations closed, prior findings remediated), new catalog entries continue to arrive from three parallel sources:

- Human curation by the framework maintainer
- LLM-driven monitoring of published security research, CVE feeds, and incident post-mortems
- Automatic promotion of novel findings — when an engagement surfaces a finding that does not fit any existing catalog entry, the finding itself becomes the seed for a new entry, which is then available to all future engagements against all targets

The framework becomes strictly stronger over time. No prior remediation is ever "done forever" — every new catalog entry is retroactively applicable to every previously-assessed target. A target scored L4 last quarter may be L3 this quarter because new attacks have been added to the catalog and its prior defense against those attacks has not been demonstrated.

This adversarial coevolution loop, in which the threat catalog is a versioned first-class object and target scorecards are computed against a specific catalog version, has no direct analogue in the automated security testing literature. Static scanners produce lists of known CVEs; kronos produces a scored assessment against a growing catalog of attack methodologies whose applicability transcends any specific vulnerability.

## 6. Per-engagement production-safety mode as commercial primitive

Engagements are parameterized by an explicit environment-safety mode. Two modes are first-class:

- **`first-signal-stop`** — the engagement proceeds until it produces the first evidence that a defense has failed, at which point it immediately halts, writes the finding, alerts the designated contact, and closes. The blast radius of continued attack is bounded to a single finding.
- **`go-to-town`** — the engagement continues until the planned attack matrix is exhausted, the rate ceilings are hit, or the authorization window closes.

Production engagements default to `first-signal-stop`; isolated test environments default to `go-to-town`. The distinction is a first-class parameter of the authorization artifact, not an ad-hoc operational discipline.

The commercial implication is significant: because `first-signal-stop` bounds the risk of production attack, kronos supports a free-assessment engagement model — point the framework at a prospective customer's production system, run in `first-signal-stop` mode until the first finding surfaces, and deliver that finding as the sales artifact. This inverts the traditional pen-testing sales model, which requires either a dedicated test environment (limiting access) or a paid engagement with production authorization (limiting funnel).

Prior adversarial-testing tools treat "production safety" as an operator responsibility outside the tool. Kronos treats it as a structural feature: the mode is declared in the authorization artifact, enforced by the framework, and observable in the engagement record.

## 7. Dual-use with explicit authorization discipline and legal-liability boundary

The framework itself is dual-use. It cannot structurally prevent an unauthorized party from cloning it and pointing it at a system for which no authorization exists. Any tool capable of testing the defenses of a system on behalf of that system's owner is equally capable of attacking that system on behalf of an adversary. This is a permanent property of adversarial-testing frameworks; it cannot be engineered away.

Kronos addresses this property structurally rather than pretending it does not exist:

- The framework requires a signed authorization artifact for every active engagement. This artifact is a first-class primitive with mandatory fields (target, scope, ROE, timeframe, approver identity, contact of record, stop mechanism).
- The framework's own license, terms of use, and README explicitly disclaim liability for unauthorized use.
- The framework's public repository contains a legal notice that separates authorized-user liability (the operator running the engagement) from framework-maintainer liability (the party that wrote the framework code).
- The framework does not include, and will not include, any capability whose only rational purpose is malicious use with no authorized-defensive counterpart. Dual-use capabilities are documented as such; single-use offensive capabilities are refused.

The precedent is that most industry-standard security-testing tools (Metasploit, Burp Suite, sqlmap, Nmap) operate under the same principle: the tool is legal; the use of the tool is the user's responsibility. What is novel in kronos is that the authorization artifact is a first-class first-order object in the methodology — not a click-through EULA, but a signed, versioned, git-committed record that is validated by the framework at every engagement start.

The structural coupling of dual-use tooling with a first-class authorization artifact, in which the authorization is both a legal record and an executable configuration, is not present in prior adversarial-testing methodologies.

---

## Why the combination is novel

Individual properties in this list have partial analogues in prior work:

- Property 1 has philosophical analogues in Popperian falsifiability and in adversarial security testing generally, but no prior *methodology* structures itself around presumption-of-failure as a governance discipline.
- Property 2 has adjacent examples in DevSecOps ("shift left" security integration), but the specific dialectic of attestation-and-falsification frameworks bidirectionally coupled through a git-native artifact bus is not documented in prior methodology.
- Property 3 has analogues in maturity models (BSIMM, OWASP SAMM, CMMI, NIST CSF), but none make maturity above a certain level structurally dependent on adversarial proof.
- Property 4 has analogues in issue trackers and audit-report generation, but no prior methodology uses git-native markdown as the primary evidence bus with public-by-default default posture.
- Property 5 has analogues in vulnerability databases (CVE, CAPEC, MITRE ATT&CK) and threat modeling frameworks (STRIDE, PASTA), but none couple a system-agnostic threat catalog to per-target scorecards with adversarial coevolution as a designed property.
- Property 6 has analogues in "safe mode" flags in various pen-testing tools, but none elevate the mode to a first-class authorization primitive with commercial-model implications.
- Property 7 has legal-industry analogues in security-tool terms-of-use, but none integrate the authorization artifact into the framework as an executable configuration that the framework validates at every engagement start.

The **conjunction of all seven** — presumption-of-failure discipline, dialectic-based readiness proof, adversarial-proof-required maturity scorecard, git-native public-by-default evidence bus, system-agnostic threat catalog with coevolution, per-engagement production-safety mode as commercial primitive, and dual-use structural authorization discipline — is not present in any prior methodology this author is aware of.

## Potential eighth claim — flagged for design review

The positioning of kronos as *"the adversarial verification layer beneath every industry certification"* (see [`INDUSTRY-ALIGNMENT.md`](INDUSTRY-ALIGNMENT.md)) may constitute an eighth novel property beyond the seven articulated above. Prior work in the certification-preparation tool space includes vulnerability scanners (which produce technical evidence without certification-mapping structure), governance/risk/compliance platforms like RSA Archer and ServiceNow GRC (which produce documentation without adversarial evidence), and consulting practices (which produce narrative reports without reproducible evidence). None of these prior tools combine:

- adversarial-proof evidence,
- structural mapping to multiple industry-standard control frameworks (SOC 2, ISO 27001, PCI DSS, OWASP ASVS, NIST CSF, NIST AI RMF, AWS Well-Architected, MITRE ATT&CK / ATLAS / CAPEC / CWE / CVE),
- explicit positioning as verification-layer-beneath-certification rather than certification-competitor,
- mapping artifacts that are versioned and updateable as standards revise,
- evidence that composes across multiple standards from a single engagement.

Whether this positioning constitutes an eighth distinct claim, or is subsumed within claim 3 (executive maturity scorecard driven by adversarial proof) or claim 5 (adversarial coevolution through system-agnostic threat catalog), is a question deferred to the cross-LLM design review cycle. Reviewers are asked to interrogate:

- Is the positioning genuinely novel, or is it a restatement of existing claims applied to certification context?
- Does prior work exist (in security tools, GRC platforms, audit-preparation software) that already embodies this positioning?
- If novel, does it warrant elevation to a formal claim, or should it remain a positioning statement without patent-claim status?

The recommendation, pending review, is to flag but not elevate. Elevate only if reviewer consensus establishes distinct novelty.

## Where to go from here

- [`OPERATING-MANUAL.md`](OPERATING-MANUAL.md) — how the seven properties compose into operating discipline.
- [`TEMPLATE.md`](TEMPLATE.md) — the engagement document scaffold that instantiates the discipline.
- [`SCORECARD.md`](SCORECARD.md) — the maturity model referenced by Property 3.
- `../PATENT-DISCLOSURE-DRAFT.md` — inventive-claim structure for IP counsel (to be authored after design review converges).
- `../WHITE-PAPER.md` — theory-and-practice narrative including empirical record from the flagship reference implementation against olympus-616 (to be authored after the first engagements ship).
