# Kronos — Design (v0, for cross-LLM review)

**Document state:** Draft — v0
**Purpose:** wide-net vision document for the cross-LLM design review process. This document exists to be critiqued, refined, and hardened through iterative review by Claude, ChatGPT, Grok, and Gemini before any production code is written. The subsequent v0.N revisions will be produced by the scribe (kronos-agent) based on synthesized review feedback.
**Author:** the Steward and kronos-agent
**Origin:** the founding incident of 2026-07-17; the productization pattern of alchemisthomer/eos; the design conversation of 2026-07-24
**Companion documents:** [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md), [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md), [`methodology/SCORECARD.md`](methodology/SCORECARD.md), [`methodology/TEMPLATE.md`](methodology/TEMPLATE.md), [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md)

---

## 0. Notes to the reviewer

This document intentionally casts the widest possible net. The vision claims are maximalist by design — the review process is expected to interrogate whether each claim is defensible, whether the framework's structural commitments actually deliver on them, whether prior art invalidates any inventive-step assertion, and whether the roadmap is achievable.

Places where the design is deliberately open are marked `<REVIEW:...>` inline. Reviewers should focus critical attention on these, but every claim in the document is up for critique.

The scribe (the kronos-agent responsible for revising this document across review rounds) will synthesize reviewer feedback and produce revised drafts. The scribe is the ultimate editor; reviewer feedback is input, not directive.

---

## 1. Preface — what this document is trying to do

Kronos is being designed as the second product in a two-product open-source assurance suite. The first product, eos, provides an attestation methodology — a discipline for proving that a system does what its designers claim it does through self-emitting telemetry assertions verified against a live production system. Kronos provides the complementary methodology: a discipline for proving that a system's claims cannot be broken under bounded adversarial attack.

This design document exists because kronos is being designed backward from a concrete use case (the first adversarial engagement against olympus-grid, validating the Ares perimeter's L14 origin-secret defense) while also serving a much larger vision (a maturity model for software assurance whose top levels are only reachable via adversarial proof, applicable to any authorized target, growing perpetually as the threat landscape grows). The concrete use case anchors the design against reality; the larger vision informs which primitives must exist even when the first use case does not exercise them.

The document is written before any framework code has been committed. This ordering is deliberate. The scribe has learned, from the operator's experience with the prior eos design cycles, that hardening a design across four independent LLM reviewers before writing production code produces a substantially better first-shipped framework than iteratively refactoring code that was written against a partially-formed vision. The cost of the review cycles is measured in days; the cost of refactoring a shipped framework is measured in weeks and lost credibility.

## 2. Mission — what kronos exists to prove

Kronos exists to make the answer to *"is my software safe to run?"* a reproducible artifact rather than a hopeful assertion.

The claim that a system is safe is, in prior software assurance regimes, a claim that has been confirmed through positive evidence — a checklist has been completed, an auditor has signed off, a certification body has endorsed. Kronos rejects this frame. It observes that positive-confirmation regimes carry structural confirmation bias: the auditor who is paid to certify has professional incentive to certify; the checklist that lists controls in place cannot list the controls that were not thought to be relevant; the certification body that endorses is one falsifying counterexample away from having endorsed nothing.

Kronos instead operates from the presumption that every claim a system makes about itself is FALSE until adversarial pressure has been applied and the claim has survived. A system is not "safe" in the kronos sense; it is "not yet broken by the current threat catalog against which adversarial engagement was attempted." This is a fundamentally different epistemic position from the certification model — a negative claim is falsifiable by a single counterexample; the positive claim is unfalsifiable except by an audit that has the same confirmation bias that produced it.

The framework's operational purpose is to produce, for every target it engages, a **maturity scorecard** rendering the target's assurance posture across twelve dimensions of software delivery, with the load-bearing property that maturity above Level 3 (out of 5) is only reachable through kronos falsification attempts. The scorecard is the executive-consumable artifact — the answer to "is my software safe" rendered as a matrix of colored cells with drill-down to the underlying evidence. It doubles as a commercial primitive: a fixed-scope engagement produces a scorecard delta, moving specific dimensions from red to green, as its deliverable.

The framework's philosophical purpose is to make software assurance falsifiable, in the Popperian sense. A system whose defenses have been challenged by kronos and whose kronos scorecard is public has committed to a claim that any observer can attempt to disprove. That commitment is a fundamentally stronger position than any positive certification.

## 3. The founding incident

The full narrative is in [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md). The compressed version follows because the design implications of the incident are load-bearing for what kronos must be.

On 2026-07-17, the operator received an email from Amazon Web Services indicating a bill of $131,831,457,005.91 on his personal AWS account. Cost Explorer confirmed the meter data was real: $25.77 billion in one day, $115 billion for the preceding two weeks, broken down as $76.5 billion in EC2-Other (NAT gateway data, EBS, data transfer), $18.4 billion in CloudWatch, $14 billion in ECR — and one dollar and sixty cents in actual EC2 compute charges. The account had almost nothing in it: no running EC2 instances, no SageMaker endpoints, no Bedrock provisioned throughput. Not enough infrastructure to generate one percent of what was being billed.

The incident was a defect in AWS's billing pipeline. Every phantom charge was ultimately corrected in place with no invoice adjustment. The real bill for the month was $505.72.

Six design implications for kronos fall directly out of the incident:

**First**, physical plausibility is a first-class oracle. Given a system model (declared or observed) and an observed value (cost, traffic, request rate, resource count), kronos should be able to compute whether the observed value is physically achievable by the modeled infrastructure. The founding incident's central diagnostic move — "$76 billion in NAT charges is physically impossible given zero NAT gateways" — was performed manually by a human under time pressure. A physical-plausibility oracle in kronos would perform this move automatically, continuously, in the background, against every observed system.

**Second**, enumerator sanity cross-check must be structural. During the response, an `aws ec2 describe-nat-gateways --filter "..."` call returned empty across all seventeen regions. Five days later, the same call without the filter returned three real NAT gateways in us-east-1 — three sources of real cost that had been missed for the entire incident window. A scanner that returns zero when it should return three is worse than a scanner that returns an error. Every enumeration primitive in kronos must have a paranoid unfiltered cross-check.

**Third**, panic-mode authorization must preserve data-class resources by structural default. The operator's instruction was "every service without exception." The responder correctly filtered the instruction: stop compute, load balancers, and networking; preserve S3, DynamoDB, Route 53, IAM records, and EBS. This filter was correct regardless of which interpretation of the bill was right — if the bill had been a real compromise, killing compute stopped the bleeding; if it was a bug, killing anyway did no harm; preserving data covered both cases without downside. Kronos's authorization model must make this filter a structural property, not a hand-crafted judgment.

**Fourth**, cost adversarial testing is a first-class mode. The founding incident was not a compromise; no security tool would have caught it because it was not a security vulnerability. But an adversarial-testing framework that treats cost as a security-peer dimension would have caught it — by asserting that a system's cost curve is bounded by physical plausibility. Kronos treats cost as a peer of every other assurance dimension.

**Fifth**, interpretation discipline separates observation from inference. During the response, the responder briefly asserted that the bill was "almost certainly phishing" — an interpretation claim that went beyond the evidence. The correct posture was "the observed values are physically inconsistent with the modeled infrastructure; open a support case regardless of what interpretation we prefer." Kronos's oracles report what the evidence establishes; AI-assisted analysis may propose interpretations; the deterministic verdict is bounded to observation.

**Sixth**, operator-facing legibility is not optional. The founding incident was recoverable because a senior architect could talk it through in prose with a capable AI assistant. Most operators of production systems cannot. Kronos findings must be readable — "your bill can spike to this amount overnight if X happens" beats CloudWatch metric names — because the population of operators who own systems now vastly exceeds the population of operators who can interpret raw telemetry.

## 4. The dialectic with eos

Kronos is the second half of a two-methodology assurance backbone whose first half is eos. The two methodologies are complementary opposites: eos attests to what a system does, kronos falsifies the attestation.

Eos operates from the presumption that a system's designers know what they built and can produce evidence that the built system does what they claim. An eos cycle names a claim, decomposes it into layer-impact changes, ships those changes as coordinated squash-merges across every constituent repository, and closes only when the specific machine-readable telemetry signatures the claim promised to emit are observed in the deployed production system. The evidence is confirmatory: "here is the trace that proves the system did what it said it would."

Kronos operates from the opposite presumption. Every claim a system makes about itself — including the claims that eos has already attested — is FALSE until kronos has been unable to falsify it via bounded, authorized adversarial attack. A kronos engagement names a threat class, enumerates specific attacks against the target's declared defenses, executes those attacks under a signed authorization envelope, and closes only when every attack has been evaluated by a deterministic oracle and every failure has been documented as a finding. The evidence is disconfirmatory: "here are the attacks we ran, and here is the evidence they did or did not succeed."

Neither methodology is complete alone. A system that has been eos-attested but never kronos-challenged has claims that are internally coherent but empirically untested against adversarial pressure. A system that has been kronos-challenged but never eos-attested has defenses that hold today but no coherent statement of what they defend. The two methodologies together form the epistemic backbone of readiness proof.

The two frameworks operate independently — either can be adopted without the other, and each is separately valuable. When co-installed in the same target, they integrate bidirectionally through git-native structural hooks: kronos reads the target's `foundation/eos/cycle/06_shipped/` folder to determine L3 eligibility for the scorecard; when a kronos finding falsifies a previously-closed eos attestation, the finding auto-files a new backlog cycle in the target's `foundation/eos/cycle/00_backlog/` naming the falsified claim and pointing to the kronos evidence.

The integration is one-way at the code level: kronos knows about eos, eos does not need to know kronos exists. This preserves eos's freedom to evolve independently. Optional updates to eos would strengthen the dialectic (an attestation-template section naming anticipated kronos scenarios, a `kronos_verified` frontmatter field on shipped cycles, a `10_falsified/` kanban folder) but are not prerequisites for the integration to function.

The commercial implication is that the two frameworks form three distinct consulting offerings: eos alone (attestation practice), kronos alone (adversarial practice), or both (full readiness backbone with the scorecard as the artifact of record). The Steward's consulting practice is expected to sell all three, sized to the customer's maturity and risk posture.

## 5. Framework identity — the three layers, materialized

ADR-0001 established the three-layer identity: framework (technology-agnostic contracts), tools (implementation-specific execution), engagements (per-target installations with authorization + evidence). ADR-0002 committed to adopting the eos-productization directory shape. The two ADRs together map the three layers to concrete homes:

**Framework** lives in [`methodology/`](methodology/) at the repository root. It contains the operating manual, the seven novel-property claims, the engagement document template, and the scorecard model. Language-neutral, technology-neutral, versioned as a whole. This is the intellectual property; changes here affect every adopter.

**Tools** live in three places. Reusable enforcement lives in [`actions/`](actions/) as GitHub Actions (kanban structure validator, authorization artifact validator, evidence hash verifier, scorecard consistency check). The reference viewer lives in [`runner/`](runner/) as a React/TypeScript SPA. The OAuth backend lives in [`oauth-server/`](oauth-server/) as a standalone Node/Express service. Additional tools (attack executors, protocol adapters, evidence collectors) will accumulate here as needed but are not part of the v0 scaffold.

**Engagements** live in the target's own repository at `<target-repo>/kronos/engagement/`. The kanban folders, engagement documents, target scorecard configuration, and evidence corpus are the target's property, evolve with the target's lifecycle, and are subject to the target's retention policy. Kronos actions read this tree from the target's CI; the kronos runner reads it via the GitHub REST API.

This three-layer separation preserves the property that adopting kronos does not lock the target into any particular runtime, language, or dependency footprint. The methodology is markdown; the templates are markdown and YAML; the actions run in any GitHub Actions runner; the runner is optional and can be pointed at any repository from any deployment. An adopting target that just wants the discipline can adopt the methodology and templates and ignore the runner and actions entirely — the kanban still works, the scorecard still updates (by hand), the findings still commit to git.

## 6. The scorecard — north star, primary artifact, commercial primitive

The kronos scorecard is designated as the framework's north-star artifact per ADR-0003. Its definition is in [`methodology/SCORECARD.md`](methodology/SCORECARD.md); this section captures the design rationale.

The scorecard is the artifact that answers *"is my software safe?"* at executive level, in a single glance, with drill-down to the underlying evidence. It is composed of four pillars — Perimeter & Access, Runtime Integrity, Operational Discipline, Response Readiness — divided into twelve dimensions:

- Identity & Access Control, Perimeter Defense, Secret Management (Pillar A)
- Data Integrity, Availability & Resilience, Observability (Pillar B)
- Cost Integrity, Change Discipline, Supply Chain (Pillar C)
- Incident Response, Recovery & Continuity, Compliance Posture (Pillar D)

Each dimension is scored on a six-level maturity scale drawn from the Capability Maturity Model Integration (CMMI) tradition and adapted for adversarial-proof requirements:

- **L0 Absent** — no defense exists in this dimension
- **L1 Ad Hoc** — some defense exists but is undocumented and unverified
- **L2 Managed** — the defense is documented and occasionally tested
- **L3 Defined** — the defense is framework-integrated with automated tests and attested
- **L4 Quantitatively Managed** — the defense is metric-instrumented with SLOs and regression detection, and has fired under diagnostic attack
- **L5 Optimizing** — the defense has been adversarially proven in production or production-equivalent environment with a scheduled cadence of re-verification

The load-bearing property is that Levels 4 and 5 are structurally unreachable without kronos. Levels 0-3 are reachable through documentation, process, and attestation alone. Levels 4 and 5 are defined in terms of adversarial survival, not process presence. This is the specific inversion that makes kronos a peer discipline to attestation rather than a subordinate technique within it: attestation gets a system to Level 3; adversarial proof is the only path from Level 3 to Level 5.

The scorecard is rendered by the kronos runner as a 4×3 grid, one cell per dimension, colored by level. Each cell is click-through to the underlying findings and attestations that produced the score. A top-line summary is also rendered — commonly the minimum-across-dimensions or the weighted-average-across-pillars.

Historical trajectory (how the scorecard has evolved over time) is computed by walking the git history of the target's `kronos/engagement/06_shipped/` folder and recomputing the scorecard at each historical HEAD. The trajectory view answers "are we getting better or worse over time?" without requiring separate persistence infrastructure.

The scorecard doubles as a commercial artifact. The engagement flow is:

1. **Free assessment** — kronos runs against a prospective customer's target in `first-signal-stop` mode. The first attack that surfaces a finding produces the initial scorecard, showing where the target sits on each of twelve dimensions. This is the sales artifact.
2. **Scoped engagement proposal** — the operator proposes a fixed-scope engagement to move specific dimensions from their current level to a target level. Example: "your Perimeter Defense sits at L2; a 90-day engagement will take it to L4 by shipping the specific attestations and running the specific kronos verifications required."
3. **Engagement execution** — the operator runs eos cycles to reach L3 in the targeted dimensions, then kronos engagements to reach L4. The scorecard delta is the deliverable.
4. **Continuous coverage** — after the engagement closes, a scheduled cadence of kronos re-verifications maintains L4 and works toward L5 in the remaining dimensions.

The scorecard is what the customer sees. The scorecard delta is what the customer pays for. The scorecard's continuous coverage is what the customer subscribes to.

`<REVIEW:` reviewers should critically evaluate the choice of pillar/dimension structure. Twelve dimensions divided into four pillars is opinionated; competing structures include NIST CSF (Identify/Protect/Detect/Respond/Recover, five pillars), BSIMM (twelve practices in four domains), OWASP SAMM (fifteen practices in five business functions). Is the kronos structure better positioned than these, or does it need to converge more closely to industry-recognized taxonomies for enterprise adoption? `>`

`<REVIEW:` reviewers should also evaluate the L0-L5 scale. Six levels is deliberate (matching CMMI); could a simpler traffic-light (red/yellow/green) be more legible for executive consumption at the cost of precision? Is the framework's insistence that L4 and L5 require adversarial proof defensible against enterprise customers who will resist any model where their existing certifications cannot reach the top? `>`

## 7. Attack modes and environment discipline

Kronos supports many modes of adversarial evaluation, each with its own authorization ceiling, rules of engagement, environment discipline, and finding shape. The full mode taxonomy is in [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md); this section captures the design rationale.

The modes are not exclusive; an engagement may combine modes (e.g., red-team + cost-adversarial against the same target under one authorization) and its authorization ceiling is the max of the combined modes' ceilings. The rationale for enumerating modes explicitly is that each mode has genuinely different operational risk profiles — a `black-box pentest` in `first-signal-stop` mode against production is safe by default, whereas a `destructive-load` in `go-to-town` mode against production would be reckless without extraordinary authorization.

Two environment-safety modes are first-class parameters of every engagement:

**`first-signal-stop`** — the engagement proceeds until it produces the first evidence that a defense has failed, at which point it immediately halts, writes the finding, alerts the designated contact, and closes. Blast radius is bounded to one finding.

**`go-to-town`** — the engagement continues until the planned attack matrix is exhausted, the rate ceilings are hit, or the authorization window closes. Blast radius is bounded only by the authorization envelope.

The default for production engagements is `first-signal-stop`. Any escalation to `go-to-town` in production requires a signed authorization artifact that explicitly enables destructive testing and names the operator of record as accountable for the operational consequences.

The commercial implication of `first-signal-stop` is significant: because it bounds the risk of production attack, kronos supports a free-assessment engagement model — point the framework at a prospective customer's production system, run in `first-signal-stop` mode until the first finding surfaces, deliver that finding as the sales artifact. This inverts the traditional pen-testing sales model, which requires either a dedicated test environment (limiting access to prospects who can provide one) or a paid engagement with production authorization (limiting funnel to prospects willing to pay before the value has been demonstrated).

The design commitment that production is in-scope, subject to mode discipline, is deliberate and controversial. Prior adversarial testing tools (`nmap`, `sqlmap`, Burp Suite, ZAP, Metasploit, Nuclei) treat production safety as an operator responsibility outside the tool; they assume the operator knows what they are doing and provide safety flags as suggestions. Kronos treats production safety as a structural feature: the mode is declared in the authorization artifact, enforced by the framework's `first-signal-stop-enforcer` action, and observable in the engagement record.

`<REVIEW:` reviewers should evaluate whether the `first-signal-stop` mode's guarantees are defensible in practice. Consider: what happens if the "first signal" is ambiguous (an oracle evaluates to INCONCLUSIVE rather than FAIL)? What happens if the attack that would have surfaced the first signal is one of the last in the matrix (the engagement then completes without any finding, and the operator has no information about what would have been found)? Are there cases where `first-signal-stop` is actually MORE dangerous than `go-to-town` because it stops at the first finding without exploring whether that finding was the tip of an iceberg? `>`

## 8. The threat catalog and adversarial coevolution

Kronos maintains a top-level, system-agnostic threat catalog — a versioned inventory of attack classes organized by category (identity, perimeter, integrity, availability, cost, supply-chain, and so on). Each catalog entry describes a class of attack in abstract terms, its common instantiations, references to published incidents and research, and suggested detection signals. Catalog entries are not tied to any specific target; they are the periodic table of adversarial pressure.

An engagement instantiates specific catalog entries against a specific target's architecture. The engagement's §7 attack matrix is a materialization of the catalog against the target — for each catalog entry in scope, one or more concrete attacks against specific target endpoints and claims.

The catalog is expected to grow monotonically over time from three parallel sources:

**Human curation.** The framework maintainer (initially: the operator; eventually: a curator team) adds new threat classes as they emerge from field experience, empirical incidents, published breaches, or targeted research. Additions are versioned; adopters pin their scorecard against a specific catalog version so that "score improved" and "score got worse because new attacks were added" are distinguishable.

**LLM watcher.** An AI agent monitors security-industry sources (CVE feeds, published breach post-mortems, novel attack research from conferences and journals) and proposes new threat classes to the human curator for review before promotion to the catalog. The LLM does not have autonomous write access to the catalog; the human curator is the gate.

**Auto-from-findings.** When an engagement produces a novel finding that does not fit any existing catalog entry, the finding itself is the seed for a new entry. The new entry is drafted from the finding, reviewed by the human curator, and promoted to the catalog. The next engagement against a different target automatically inherits the new class.

The framework becomes strictly stronger over time. No prior remediation is ever "done forever" — every new catalog entry is retroactively applicable to every previously-assessed target. A target scored L4 last quarter may be L3 this quarter because new attacks have been added to the catalog and its prior defense against those attacks has not been demonstrated.

This adversarial coevolution loop, in which the threat catalog is a versioned first-class object and target scorecards are computed against a specific catalog version, is a structural claim of the framework. It has no direct analogue in the automated security testing literature. Static scanners (Snyk, Dependabot, Semgrep) produce lists of known CVEs against static code; kronos produces a scored assessment against a growing catalog of attack methodologies whose applicability transcends any specific vulnerability. Threat modeling frameworks (STRIDE, PASTA) provide a taxonomy for reasoning about threats during design; kronos provides an execution engine for running the actual attacks and updating the scorecard.

`<REVIEW:` reviewers should evaluate whether the "grow strictly stronger over time" claim is defensible. Consider: what happens when a catalog entry is deprecated (a class of attack becomes obsolete because the underlying technology changed)? Is a "deprecated" state added to the catalog schema? How is a target's scorecard affected when a catalog entry it was previously falsified against becomes deprecated? `>`

`<REVIEW:` reviewers should also evaluate the LLM watcher role. Is autonomous LLM curation of a security-critical catalog dangerous? What are the failure modes (LLM hallucinates a threat class that doesn't exist, LLM misclassifies a novel real threat, LLM is prompt-injected via a CVE description into proposing malicious entries)? Where do the guardrails go? `>`

## 9. Attack, oracle, evidence, and finding — the runtime primitives

The kronos runtime operates over four primitives that together form the execution model of any engagement.

**Attack** is the specific probe executed against a target. It is versioned, parameterized, and reproducible from its specification alone. An attack has an identity, a threat-class reference, one or more parameters (target endpoint, payload, timing), and a specification of what constitutes success from the attacker's perspective. Attacks are authored in YAML (initially) and executed by tools in the framework's toolset.

**Oracle** is the deterministic assertion that evaluates whether an attack succeeded. Every oracle references observable signals only — response payloads, response status codes, telemetry metrics, log lines, database state, downstream side effects. The oracle produces one of three verdicts: PASS (the attack was blocked as expected), FAIL (the attack succeeded, indicating the defense did not fire), or INCONCLUSIVE (the observable signals did not permit a determination). AI-generated narrative may explain an oracle result but cannot replace it. This constraint is load-bearing: it prevents the framework from being an LLM-in-a-loop that hallucinates security posture.

**Evidence** is the persistent record of an attack and its oracle evaluation. It includes the exact request that was sent, the exact response received, any telemetry signals observed within the correlation window, any side-effects detected in the target's state, and timing information. Evidence artifacts are hashed by SHA-256 and referenced by content-addressable identifier from the engagement document's §9 execution log. Evidence is stored alongside the engagement document in the target's repository (`<target-repo>/kronos/evidence/<engagement-slug>/`), committed to git, and reproducible from repo state alone.

**Finding** is the assertion of a specific defense failure, backed by specific evidence, with reproduction instructions and suggested remediation. Every finding has a stable identifier (deduplicating across engagements of the same target), a severity, and a scorecard-delta contribution. Findings are markdown files with structured YAML frontmatter; they are the primary write-facing output of an engagement.

The runtime executes an engagement by iterating through its §7 attack matrix: for each attack, invoke the appropriate tool to execute, collect the raw response and telemetry as evidence, invoke the oracle to evaluate, and if the oracle returns FAIL, produce a finding. When the matrix is exhausted (or `first-signal-stop` triggers), the engagement moves from `04_running/` to `05_evidence/` and the oracle/finding pass runs to close out. Then to `06_shipped/` with the scorecard delta committed.

The runtime is deliberately simple. There is no distributed orchestration, no message queue, no evidence-collection agent running in-target. The runtime is a shell that invokes tools, hashes their output, and writes markdown. This simplicity is a design commitment: the framework must be operable from a laptop, with git and a few command-line tools, without any framework-hosted service. This is what makes kronos adoptable by any target regardless of infrastructure.

`<REVIEW:` reviewers should evaluate whether the runtime's simplicity is a liability at scale. Consider: what happens when an engagement needs to coordinate attacks across dozens of endpoints in parallel? What happens when evidence collection requires running collectors that are not accessible from the operator's laptop (e.g., CloudWatch metrics from a customer's AWS account)? The simple runtime may need extension points for these cases without losing the "operable from a laptop" property. `>`

## 10. Authorization, dual-use, and the legal-liability boundary

Kronos is dual-use. Any tool capable of testing the defenses of a system on behalf of that system's owner is equally capable of attacking that system on behalf of an adversary. This is a permanent property of adversarial-testing frameworks; it cannot be engineered away. Prior industry-standard tools (Metasploit, Burp Suite, sqlmap, Nmap, Nuclei) operate under the same principle: the tool is legal; the use of the tool is the user's responsibility.

Kronos addresses this property structurally rather than pretending it does not exist. The mechanisms are:

**Authorization artifact as first-class primitive.** Every kronos engagement requires a signed authorization artifact naming target scope, timeframe, rate ceilings, destructive-testing permission, approver identity, and contact of record. The artifact is a first-class first-order object in the methodology — not a click-through EULA, but a signed, versioned, git-committed record that is validated by the framework's `authorization-artifact-validator` action at every engagement start. The framework's runtime refuses to execute active probes without a valid artifact.

**License and terms of use.** Kronos is licensed under GNU AGPL v3. The license does not restrict use, but it does require that any hosted service running modified kronos code make the modified source available to that service's users. This means an adversary running a hosted kronos-derivative for malicious purposes cannot hide the fork; the source is subject to disclosure.

**Explicit authorized-user vs unauthorized-user liability separation.** The repository's README and every public artifact state clearly that CloudPremise LLC (the framework's authoring entity) operates only under signed authorization. Unauthorized use by any party is the responsibility of that party. The framework maintainer does not indemnify unauthorized users and disclaims all liability for their actions.

**Refused capabilities.** The framework does not include, and will not include, any capability whose only rational purpose is malicious use with no authorized-defensive counterpart. Examples of refused capabilities: exploit chains against unpatched CVEs bundled as reusable attacks (an attack-catalog entry names a class; it does not ship a working weaponized exploit); credential-harvesting tools for third-party services; detection-evasion techniques whose sole purpose is to hide from legitimate monitoring. Dual-use capabilities (credential testing, rate-limit probing, network scanning) are documented as such and their authorization-requirement is prominently declared.

The structural coupling of dual-use tooling with a first-class authorization artifact, in which the authorization is both a legal record and an executable configuration, is a claimed novel property of the framework (SEVEN-CLAIMS §7).

`<REVIEW:` reviewers should evaluate whether the framework's authorization discipline is legally defensible. Consider: does AGPL v3 sufficiently protect the framework author from liability for unauthorized use? What jurisdictions apply? Are there jurisdictions (e.g., Germany's §202c StGB "hacker tool" law, US Computer Fraud and Abuse Act) where the framework itself could be considered contraband regardless of authorization discipline? What is the correct legal disclaimer to make prominently visible? `>`

`<REVIEW:` reviewers should also evaluate the "refused capabilities" boundary. Is the line between dual-use and single-use offensive coherent in practice? How does the framework prevent a contributor from proposing a capability that seems dual-use but is actually single-use offensive? Is there a review process for proposed capability additions? `>`

## 11. Reference engagement — olympus-616 HUD-v2.3 L14

The first kronos engagement against a real target is designed to validate the framework's full loop end-to-end. It is intentionally scope-tiny (one attack) and framework-total (every primitive exercised).

**Target:** olympus-grid, specifically the Ares perimeter cascade of `hostile-universe-defense-v2.3-SEALED-2026-07-23.md`, further specifically the L14 origin-secret zero-leak defense.

**Threat model class:** perimeter-bypass via alternate ingress (KTC-perimeter-bypass or equivalent catalog identifier — the catalog itself is being co-designed with this engagement).

**Attack:** Scenario D from `hostile-universe-defense-kronos-redteam-plan-2026-07-24.md` — configure an attacker-controlled AWS CloudFront distribution pointing at the target's ALB DNS, forge a request through the attacker's distribution without the `x-cloudfront-secret` header, observe the response.

**Success from attacker's perspective:** the ALB returns 200 (defense failed; L14 does not protect against attacker-owned distributions).

**Failure from attacker's perspective (defense held):** the ALB returns 403 with a `cfSecretGuard` block reason, and the corresponding CloudWatch metric increments.

**Oracle:** response status IS 403 AND CloudWatch metric `AresBlocks` with dimension `Reason=cf_secret_missing` increments by ≥1 within a 60-second correlation window from request timestamp. If both conditions hold: PASS (defense fired). If either fails: FAIL (finding). If observations are insufficient: INCONCLUSIVE (evidence collection retried; engagement blocked on manual review).

**Environment:** staging environment of olympus-616 (a dedicated test cluster with the same Ares configuration as production but no real user traffic).

**Safety mode:** `first-signal-stop` — the engagement is a single attack; there is nothing to continue past even if the defense held.

**Expected outcome:** the L14 defense fires as designed. The engagement closes with zero findings. The scorecard's Perimeter Defense dimension bumps from L3 (currently attested by the sealed HUD-v2.3 document, verified by manual testing) to L4 (adversarially proven by kronos with the specific diagnostic attack).

**Alternate outcome:** the L14 defense fails. A critical finding is written naming the failure mode, providing reproduction instructions, and suggesting remediation. The Perimeter Defense dimension drops from L3 to L1 pending remediation and re-verification. The corresponding eos attestation (if it exists) auto-files a backlog cycle for re-attestation after remediation.

Both outcomes validate the framework. The framework's usefulness does not depend on any particular defense outcome; it depends on the framework's ability to produce reproducible evidence about defense outcomes.

The engagement will produce, as artifacts committed to `olympus-616/foundation/kronos/`:

- One engagement document: `olympus-grid.kronos-1.md` in `06_shipped/`
- One evidence folder: `evidence/olympus-grid.kronos-1/` containing the raw request, the raw response, and the CloudWatch metric excerpt
- One scorecard update: the target's `SCORECARD.md` reflecting the new Perimeter Defense level
- Zero or one findings: `06_shipped/olympus-grid.kronos-1.finding-1.md` if the defense failed

## 12. Roadmap and MVP prototype architecture

The design converges through cross-LLM review before any framework code is written (Phase 0). Once the design is stable, the MVP prototype is built (Phase 1). Once the MVP validates the framework loop against the reference engagement (Phase 2), production capabilities are incrementally added (Phases 3+).

### Phase 0 — Design convergence (currently in progress)

- v0 of this document (currently)
- v0.1 after Claude.ai web review
- v0.2 after ChatGPT-5 review
- v0.3 after Grok review
- v0.4 after Gemini 2.5 Pro review
- Loop until two consecutive reviewers propose only cosmetic changes
- Patent disclosure draft authored based on converged design

### Phase 1 — MVP prototype scaffold

Produce the minimum runnable framework that supports the reference engagement:

- `runner/` — React/TypeScript SPA that reads a target's `kronos/engagement/**` folder and renders the kanban + scorecard
- `oauth-server/` — Node/Express OAuth exchange, optional (runner works PAT-only)
- `actions/` — at least `kanban-structure-validator`, `authorization-artifact-validator`, `evidence-hash-verifier`
- `templates/engagement/` — the copy-in scaffold (already present in v0)
- One end-to-end attack executor (Bash + AWS CLI + curl, sufficient for the L14 CloudFront attack)
- One oracle evaluator (Node script that reads CloudWatch metrics and evaluates the correlation window)
- One evidence collector (Node script that hashes and commits artifacts)
- The reference engagement, executed against olympus-grid staging, with its full evidence trail committed

### Phase 2 — Framework loop validation

The reference engagement runs. The scorecard updates. Whichever outcome results, the framework's loop has closed end-to-end. Learnings from the first engagement seed refinements to the framework and additions to the threat catalog.

### Phase 3 — Additional engagements against olympus-grid

Systematically cover the remaining layers of `hostile-universe-defense-v2.3` — L1 through L13, plus cross-layer compound scenarios A-D. Each layer is one or more engagements. The scorecard's Perimeter Defense dimension incrementally moves from L3 to L5 as coverage broadens and re-verification schedules are established.

### Phase 4 — Additional pillars against olympus-grid

Beyond the perimeter cascade, engagements against other pillars:
- Cost Integrity — cost-adversarial engagements simulating the 2026-07-17 defect pattern from outside
- Data Integrity — data-pollution engagements against the ledger emit pipeline
- Availability & Resilience — destructive-load engagements against the retry queue and circuit breaker
- Observability — engagements testing whether the ledger records everything it claims to record
- Recovery adversarial — attacks specifically targeting recovery mechanisms

### Phase 5 — Additional targets

Beyond olympus-grid, engagements against other authorized targets. This is the point at which kronos becomes a commercial product — the flagship reference implementation validates the framework, and subsequent targets are external customers under the operator's consulting practice.

### Phase 6 — Threat catalog growth mechanisms

The LLM watcher goes live, monitoring security industry sources and proposing catalog additions. Auto-from-findings promotion becomes automatic. Community contribution (external PRs to the threat catalog) becomes open.

### Phase 7 — Multi-persona runtime evaluation

The runtime multi-persona evaluation pattern (LLMs playing red / blue / synth roles per engagement) is implemented. Engagements can request LLM-assisted attack generation, LLM-assisted finding interpretation, or LLM-assisted remediation suggestions. All LLM outputs remain proposals; deterministic oracles remain authoritative.

## 13. What kronos is not, and boundaries with adjacent disciplines

Kronos is not a penetration test in the traditional consulting sense. Traditional pen tests engage a target with an unbounded scope and hunt for undiscovered flaws, producing a PDF report at the end of the engagement window. Kronos verifies specific claims against a growing catalog of specific attacks, producing a scorecard that evolves over time. The two disciplines are complementary; a mature target will use both.

Kronos is not a vulnerability scanner. Scanners produce lists of known CVEs against static code or configuration. Kronos produces a scored assessment against a catalog of attack methodologies that transcends any specific vulnerability. A CVE-based scanner is a valuable input to kronos (a new CVE class can seed a new catalog entry) but the scanner's output is not the same shape as kronos's output.

Kronos is not a bug bounty program. Bug bounty programs incentivize external researchers to find flaws in a target's production surface, paying per finding. Kronos runs a defined attack catalog under signed authorization; the authorization discipline and the catalog approach are the differences. Bug bounties are valuable and complementary to kronos; the two do not compete for the same operator time.

Kronos is not a cloud-security-posture management (CSPM) tool. CSPM tools compare a target's cloud configuration to a declared compliance posture and surface drift. Kronos actively attacks the target to verify that the compliance posture actually holds under adversarial pressure. CSPM is passive observation; kronos is active challenge. A mature target will use both.

Kronos is not a chaos-engineering framework. Chaos-engineering frameworks inject infrastructure faults (kill a pod, partition a network, delay a service) to test resilience. Kronos may invoke chaos-engineering frameworks as tools within a `destructive-load` mode engagement, but kronos's scope is broader than infrastructure resilience — it includes cost integrity, security, data integrity, and operational discipline as peer dimensions.

Kronos is not a specific security-scanning product ecosystem's competitor (Snyk, Wiz, Prisma, Qualys, Rapid7, Tenable). It is a methodology within which those products can operate as tools when the operator chooses to integrate them. The methodology's value is orthogonal to any specific tool's value; a mature target may use kronos as its methodological backbone and integrate multiple commercial scanners as attack executors within kronos engagements.

## 14. Updates to eos that fall out of this design

Kronos operates independently of eos. However, the following optional updates to the eos methodology would strengthen the bidirectional integration when both frameworks are co-installed. These are proposed for consideration by the eos maintainer; they are not prerequisites for kronos to ship.

**Attestation template `§7.1 Red team evaluation` section.** Each eos attestation can enumerate the kronos catalog entries that are expected to be evaluated against the attested claims once kronos is in scope. This is the eos-side declaration of "these are the attacks I expect to survive." It aligns eos and kronos scope commitments at attestation-authoring time.

**`06_shipped/` cycles get an optional `kronos_verified` frontmatter field.** A cycle whose claims have been kronos-tested and survived carries this field set to the latest kronos engagement identifier. This makes the eos kanban legible about which claims have been adversarially proven.

**A `10_falsified/` folder is added to the eos kanban** as a peer of `07_aborted/`. Cycles in this folder are attestations whose claims have been falsified by kronos. The cycles are the seeds of the auto-filed backlog entries; the target's operators can inspect the falsification evidence directly from the eos kanban.

**Cross-framework provenance in the runner.** When the shared runner renders a target that has both eos and kronos installed, it can present a fused view: eos cycles by stage, kronos engagements by stage, and the composite scorecard reading both. This is a runner-side change, not a methodology change.

These changes are proposed as future eos cycles, sequenced at the eos maintainer's discretion.

## 15. Patent claim scaffold

Kronos claims seven novel properties, described conceptually in [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md). A detailed patent disclosure paralleling `foundation/eos/PATENT-DISCLOSURE-DRAFT.md` will be authored after this design converges through the cross-LLM review process.

The seven claims are:

1. **Presumption-of-failure as governance discipline.** No prior software assurance methodology treats presumption-of-failure as a structural governance property. Prior methodologies presume compliance and require positive evidence; kronos presumes failure and requires evidence of survival.

2. **Dialectic with attestation as complementary epistemic backbone.** No prior methodology structurally couples two independently-adoptable methodologies (attestation and falsification) through a shared filesystem-native artifact bus with bidirectional automatic integration.

3. **Executive maturity scorecard driven by adversarial proof.** No prior maturity model in software assurance makes the upper levels structurally dependent on adversarial proof rather than process presence.

4. **Git-native evidence bus with public-by-default findings.** No prior methodology uses git-native markdown as the primary evidence bus with public-by-default default posture; prior methodologies persist findings in proprietary tools whose access model is separate from the source-code access model.

5. **Adversarial coevolution through system-agnostic threat catalog.** No prior methodology couples a versioned system-agnostic threat catalog to per-target scorecards with adversarial coevolution as a designed property; the retroactive application of new catalog entries to previously-assessed targets is novel.

6. **Per-engagement production-safety mode as commercial primitive.** No prior adversarial-testing framework elevates the mode to a first-class authorization primitive with commercial-model implications (free assessment via `first-signal-stop`).

7. **Dual-use with explicit authorization discipline and legal-liability boundary.** No prior framework integrates the authorization artifact into the framework as an executable configuration that the framework validates at every engagement start, coupled with an explicit legal-liability separation between authorized-user and framework-maintainer.

The **conjunction** of all seven, applied to software assurance, is the inventive step claimed. Individual properties have partial analogues in prior work (referenced in `methodology/SEVEN-CLAIMS.md`); the conjunction is not present.

`<REVIEW:` reviewers should perform prior-art analysis on each of the seven claims. Are there methodologies, tools, or academic papers this design has missed that already embody one or more of these properties? Are there specific instantiations of any of these properties that are well-established prior art (e.g., presumption-of-failure has philosophical analogues in Popperian falsifiability; are there operational instantiations in adjacent industries that predate kronos)? `>`

## 16. Open questions for the design review

Beyond the inline `<REVIEW:...>` markers, several higher-level questions are open for the review process:

**Q1. Is the presumption-of-failure epistemology commercially viable?** Enterprise buyers are accustomed to positive-certification frameworks. A framework that explicitly says "we don't certify your system as safe; we only certify that we couldn't break it" may be a harder sale. Is the framing right, or should the marketing language soften the philosophical commitment while preserving the operational commitment?

**Q2. Is the twelve-dimension scorecard the right structure?** Alternative structures exist (NIST CSF five pillars, BSIMM twelve practices, OWASP SAMM fifteen practices, CIS Controls). Should kronos converge toward one of these industry-recognized taxonomies for enterprise adoption, or is the kronos-specific structure a differentiator worth preserving?

**Q3. How is community contribution to the threat catalog governed?** As kronos grows, external contributors may propose catalog entries. What is the review process? Who decides what counts as a novel threat class vs a variant of an existing one? Is there a governance body?

**Q4. Where does the runtime multi-persona LLM evaluation fit?** The methodology mentions AI-assisted attack generation, finding interpretation, and remediation suggestions. The multi-persona pattern (LLMs playing red/blue/synth roles) is proposed. What is the specific runtime contract? How are LLM outputs distinguished from deterministic outputs in the finding schema?

**Q5. What is the framework's stance on covered testing that requires attacking third-party systems?** Some target defenses depend on third-party components (a WAF provided by a cloud vendor, an identity provider, a payment processor). Testing whether the target's defense holds may require testing the third-party component. How does kronos handle authorization for these cases? Is there a "chain of authorization" concept?

**Q6. Is the runner's read-only-plus-PR-write model sufficient?** The runner reads via GitHub REST and writes via pull requests. For long-running engagements with dozens of committed evidence artifacts, this may be operationally slow. Should there be a batch-commit mode? A direct-push mode for authorized operators?

**Q7. How does kronos evolve its own scorecard?** As the framework itself is a codebase, it has security posture, cost posture, availability posture. Should kronos dogfood itself, running engagements against its own runner and oauth-server? What does self-attack look like structurally?

**Q8. What is the versioning strategy for the framework across breaking methodology changes?** Adopters pin catalog versions. Do they also pin methodology versions? What happens when the scorecard model changes (e.g., a thirteenth dimension is added)? Are legacy scorecards recomputed against the new model, or held at the old model?

## 17. Companion documents and next steps

This document is v0 of the kronos design. It exists to be reviewed. Companion documents (all in this repository):

- [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md) — the operating discipline in full
- [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md) — the novel-property claims for design review and eventual patent disclosure
- [`methodology/SCORECARD.md`](methodology/SCORECARD.md) — the maturity scorecard model
- [`methodology/TEMPLATE.md`](methodology/TEMPLATE.md) — the engagement document template
- [`docs/adr/ADR-0001-three-layer-identity.md`](docs/adr/ADR-0001-three-layer-identity.md)
- [`docs/adr/ADR-0002-productization-alignment-with-eos.md`](docs/adr/ADR-0002-productization-alignment-with-eos.md)
- [`docs/adr/ADR-0003-scorecard-as-north-star.md`](docs/adr/ADR-0003-scorecard-as-north-star.md)
- [`docs/adr/ADR-0004-eos-dialectic.md`](docs/adr/ADR-0004-eos-dialectic.md)
- [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md) — the founding case study
- [`docs/examples/olympus-616.md`](docs/examples/olympus-616.md) — the flagship reference implementation

To be authored after this design converges:

- `PATENT-DISCLOSURE-DRAFT.md` — the detailed inventive-claim structure for IP counsel
- `WHITE-PAPER.md` — the theory-and-practice narrative with empirical record from the first engagements
- `SOC2-CONTROL-MAPPING.md` — the mapping of scorecard dimensions to SOC 2 control categories

**Next step after this document is committed:** the cross-LLM review round-robin begins. The scribe will produce v0.1, v0.2, v0.3, v0.4 as reviewer feedback arrives, and continue iterating until convergence. Then the patent disclosure draft is authored, then the MVP prototype scaffold begins.

The Steward's directive is *have fun. go.* This document is the go.
