# Kronos — Design (v0.4, post-Claude, post-ChatGPT, post-Grok, and post-Gemini reviews)

**Document state:** Draft — v0.4 (folds in the four-LLM initial review round: Claude on v0, ChatGPT on v0, Grok on v0.1, Gemini on v0.3; convergence-check pass next)
**Purpose:** wide-net vision document for the cross-LLM design review process. This document exists to be critiqued, refined, and hardened through iterative review by Claude, ChatGPT, Grok, and Gemini before any production code is written. The subsequent v0.N revisions are produced by the scribe based on synthesized review feedback.
**Author:** the operator and the kronos scribe
**Origin:** the founding incident of 2026-07-17; the productization pattern of alchemisthomer/eos; the design conversations of 2026-07-24; two cross-LLM reviews of v0 (Claude and ChatGPT).
**Changes from v0 (via Claude review, landed in v0.1):** plausibility monitor + capacity model added as first-class primitives (ADR-0007); L3 redefined to be attainable natively without external attestation (ADR-0008); authorization schema extended with incident-state and chain-of-authorization blocks (ADR-0009); scorecard headline made non-configurable over five critical dimensions with dual-number rendering (ADR-0010); first-signal-stop redefined as severity-thresholded with severity-ordered matrix; execution-provenance signing added to evidence contract; enumeration reconciliation added to tool-binding manifest schema; second reference engagement (expected FAIL) added; unfalsifiable claims replaced with bounded operational claims; patent-strategy tension flagged; register partially cleaned.
**Changes from v0.3 (via Gemini review, landed in v0.4):** **two-tier autonomous authorization model** added (ADR-0020): human-signed StandingAuthorization establishes the envelope; hardware-backed machine identities issue per-invocation MachineIssuedAuthorization within it; framework enforces escalating human-signature requirements by impact class (I0-I1 machine-issuable, I2 human co-sign, I3-I4 always human, incident-state waivers always human). `methodology/AUTONOMOUS-AUTHORIZATION.md` added. **Backbone-resilience reconciliations** added to CONTINUOUS-ASSURANCE (Salesforce API concurrency, utility-bar responsiveness, daily quota reconciliation, governor limits, cost budget); **framework self-throttling** made structural (coordinator observes target latency + backbone quota consumption + cost velocity and throttles proportionally; sustained pressure pauses continuous plane entirely). **Runtime graph validation for MCP tool chaining** added to TOOL-BINDING (whitelist of transitively-permitted tools, impact-class inheritance and clamping, budget debit at every hop, cycle detection, depth ceiling default 3, complete provenance). **Naming convention guidelines** added to CATALOG for community contributions. **Hysteresis and damping** added to SCORECARD for continuous-plane-sourced dimension transitions (30-60 minute persistence required before executive-facing transitions render for degradation; recovery renders immediately; attack-oracle findings not damped; damping is rendering only, not truth). Direct answer to Gemini's concluding question on cryptographic workload identities documented in AUTONOMOUS-AUTHORIZATION.md and ADR-0020.

**Changes from v0.2 (via Grok review, landed in v0.3):** prominent **IP posture** section added to README + DESIGN §17 (respecting operator's deferred hybrid choice; naming the strongest technical-mechanism patent-claim candidates vs the methodology-framing candidates that face Alice/§101 headwinds); **rendering examples** (ASCII grids for both six-level detail view and executive traffic-light view) added to SCORECARD; **plausibility-monitor vs attack-oracle double-counting** clarification added to SCORECARD; **first-signal-stop vestiges** cleaned across DESIGN and TEMPLATE (execution policy is now `passive` / `impact-bounded` / `campaign-complete` per ADR-0014, with `first-signal-stop` as one stop condition within `impact-bounded`); **MCP invocation sequence** concrete example added to TOOL-BINDING (nine-step flow: capability discovery → attack binding → pre-invocation gate → invocation → result reception → evidence mapping → provenance signing → oracle handoff → impact-budget accounting); **tool-verify golden-target mandate** added to TOOL-BINDING for all Layer 1+ tools; **multi-persona LLM evaluation** subsection added to OPERATING-MANUAL with explicit guardrails (LLMs as proposers only; deterministic oracles remain authoritative; per-persona provenance tags); **chainOfAuthorization made structurally required** in TEMPLATE §2 with framework-enforced validator (not just declared); **waived incident-state flow sample** added to TEMPLATE showing additional-signature requirement for panic-mode data-class preservation waiver; **MVP sequencing tension** between ChatGPT (engine-first) and Grok (runner-first) explicitly noted in DESIGN §13 and deferred to Gemini/operator; **batch-commit and direct-push modes** documented in runner/README for evidence-heavy engagements.

**Changes from v0.1 (via ChatGPT review, landed in v0.2):** **continuous assurance plane** added as first-class runtime peer to the engagement plane, with "challenge" as the parent abstraction (attack becomes one subtype); **canonical typed domain model** separates engagement, plan, run, observation, oracle result, finding, evidence manifest, and score snapshot into individually-versioned objects; **multidimensional scorecard state** per cell (maturity + effectiveness + coverage + confidence + freshness + fidelity + open findings + catalog gap) replaces single-level rendering; **impact-budgeted execution** replaces first-signal-stop as the primary safety envelope; **two-tier evidence storage** separates sanitized repository-tier records from raw protected-tier artifacts; **three-axis authorization** (impact × environment × executor-assurance) replaces single ceiling; **tool-binding hardened** (typed argv default, shell requires explicit high-risk capability, MCP is transport not trust tier, sandbox mandatory by impact class, credentials not via env vars by default); **expanded oracle state machine** (10 claim-oriented outcomes including CLAIM_SURVIVED, CLAIM_FALSIFIED, PARTIAL_OR_DEGRADED, INCONCLUSIVE, OBSERVABILITY_GAP, INVALID_TEST, EXECUTION_ERROR, BLOCKED, HALTED_SAFETY, NOT_RUN); **catalog governance** (six lifecycle states, applicability predicates, LLM watcher quarantine, no fully-automatic promotion); **standards baseline updated** to ASVS 5.0.0, AISVS 1.0, LLMSVS 2.0, OSCAL import/export, OpenCRE cross-references; **certification positioning narrowed** to "companion for selected technical and operational controls"; **mission language corrected** to remove "is my software safe" claim; **AGPL language corrected**; **SEVEN-CLAIMS.md renamed to INVENTIVE-CONCEPT-CANDIDATES.md** with explicit prior-art acknowledgment (NIST SP 800-115, MITRE CALDERA, Atomic Red Team, BAS platforms, ATT&CK scoring, OSCAL, SLSA); **reference engagement changed** to update one claim rather than a whole dimension. See ADRs 0011-0019 for the architectural decisions.
**Companion documents:** [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md), [`methodology/INVENTIVE-CONCEPT-CANDIDATES.md`](methodology/INVENTIVE-CONCEPT-CANDIDATES.md), [`methodology/SCORECARD.md`](methodology/SCORECARD.md), [`methodology/TEMPLATE.md`](methodology/TEMPLATE.md), [`methodology/TOOL-BINDING.md`](methodology/TOOL-BINDING.md), [`methodology/PLAUSIBILITY-MONITOR.md`](methodology/PLAUSIBILITY-MONITOR.md), [`methodology/CONTINUOUS-ASSURANCE.md`](methodology/CONTINUOUS-ASSURANCE.md), [`methodology/DOMAIN-MODEL.md`](methodology/DOMAIN-MODEL.md), [`methodology/EVIDENCE.md`](methodology/EVIDENCE.md), [`methodology/ORACLE.md`](methodology/ORACLE.md), [`methodology/CATALOG.md`](methodology/CATALOG.md), [`methodology/INDUSTRY-ALIGNMENT.md`](methodology/INDUSTRY-ALIGNMENT.md), [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md)

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

## 2. Mission — what kronos exists to produce

**Mission statement (v0.2, corrected per ChatGPT P0-2):**

> **Kronos produces reproducible, time-bounded evidence about whether declared system claims survive authorized challenge and continuous reconciliation.**

The v0/v0.1 formulation ("make the answer to 'is my software safe to run?' a reproducible artifact") was rhetorically strong but epistemically incoherent — no framework can answer that question universally, and the surrounding text acknowledged as much (per the "not yet broken by the current catalog" framing). The v0.2 formulation names what kronos actually does.

**Executive-facing question:**

> *"What assurance claims currently hold, against which scenarios, with what coverage and confidence?"*

**Short positioning:**

> **Kronos does not certify safety. It makes assurance claims testable, challengeable, and auditable.**

Kronos operates from the presumption that every claim a system makes about itself is unverified until either (a) an authorized adversarial challenge has been executed against it and returned `CLAIM_SURVIVED`, or (b) a continuous-plane reconciliation has confirmed the claim holds against observed reality. Claims for which neither has occurred are `untested`. Claims falsified by challenge are `falsified` until re-verified after remediation. The framework does not produce a universal "is my software safe" answer; it produces a per-claim ledger of what was tested, what survived, what was falsified, in which environment, with what evidence age, at which catalog version.

The framework's operational output is a **multidimensional scorecard** (see [`methodology/SCORECARD.md`](methodology/SCORECARD.md)) rendering per-dimension state across maturity, effectiveness, coverage, confidence, freshness, and environment fidelity. The scorecard is the executive-consumable projection of the underlying claim ledger. The scorecard does not, by itself, answer "is my software safe" — it reports what has been evaluated, what has survived, and what remains untested. This is materially more defensible than any single-number certification claim.

The framework can answer, precisely and reproducibly:

- Which claims were evaluated?
- Which challenges were executed?
- Which claims survived, which were falsified, which returned partial, inconclusive, or observability-gap?
- What remained untested in the current catalog?
- What environment was used?
- How representative was that environment of production?
- How recent is the evidence?
- Which catalog and methodology versions applied?
- How strong was the evidence?
- What open findings remain?

The framework cannot produce a universal answer that software is safe.

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

The commercial implication is that the two frameworks form three distinct consulting offerings: eos alone (attestation practice), kronos alone (adversarial practice), or both (full readiness backbone with the scorecard as the artifact of record). The framework's operator (CloudPremise LLC) expects to sell all three, sized to the customer's maturity and risk posture.

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

The scorecard is rendered by the kronos runner as a 4×3 grid, one cell per dimension. Each cell carries the multidimensional state defined in ADR-0013 (maturity + effectiveness + coverage + confidence + freshness + environment fidelity + open findings + catalog gap) — not a single level. Click-through to underlying findings, attestations, and evidence.

The **headline** is the dual-number rendering per ADR-0010: a pinned headline (against the target's currently-pinned catalog version) and a latest headline (against head-of-catalog). Each headline is a **multi-signal status summary**, not a weighted average — reporting falsified critical claims, untested critical claims, weighted coverage, minimum critical maturity, minimum critical effectiveness, evidence freshness, catalog gap, and an overall status label (`current` / `degraded` / `stale` / `materially-incomplete`). Weighted-average summaries are available for narrow downstream integrations (slide decks, board reports) but are never the primary safety summary — they let strong low-risk dimensions conceal failed critical claims.

Historical trajectory (how the scorecard has evolved over time) is computed by walking the git history of the target's `kronos/engagement/06_shipped/` folder and recomputing the scorecard at each historical HEAD.

Historical trajectory (how the scorecard has evolved over time) is computed by walking the git history of the target's `kronos/engagement/06_shipped/` folder and recomputing the scorecard at each historical HEAD. The trajectory view answers "are we getting better or worse over time?" without requiring separate persistence infrastructure.

The scorecard doubles as a commercial artifact. The engagement flow is:

1. **Free assessment** — after the prospect enrolls their target and signs the single-scope authorization artifact per ADR-0009, kronos runs against the target in `impact-bounded` execution policy (per ADR-0014) with `first-signal-stop` as the stop condition and severity threshold `critical` or `high`. The first finding at-or-above threshold produces the initial scorecard. This is the sales artifact. Unsolicited-prospect testing without prior authorization is not supported.
2. **Scoped engagement proposal** — the operator proposes a fixed-scope engagement to move specific dimensions from their current level to a target level. Example: "your Perimeter Defense sits at L2; a 90-day engagement will take it to L4 by shipping the specific attestations and running the specific kronos verifications required."
3. **Engagement execution** — the operator runs eos cycles to reach L3 in the targeted dimensions, then kronos engagements to reach L4. The scorecard delta is the deliverable.
4. **Continuous coverage** — after the engagement closes, a scheduled cadence of kronos re-verifications maintains L4 and works toward L5 in the remaining dimensions.

The scorecard is what the customer sees. The scorecard delta is what the customer pays for. The scorecard's continuous coverage is what the customer subscribes to.

`<REVIEW: RESOLVED IN v0.1 —` reviewer recommendation was to keep the kronos-specific structure as primary and publish crosswalks to industry taxonomies (already in INDUSTRY-ALIGNMENT). Enterprise buyers do not need kronos to adopt their taxonomy; they need a defensible mapping to it. The differentiator (adversarial-proof maturity) is preserved by not converging to CSF. Subsequent reviewers may still critique but the current v0.1 direction is to hold. `>`

`<REVIEW: RESOLVED IN v0.1 —` reviewer recommendation was to keep six levels for the internal model AND render an executive traffic-light derived from it (L0-L2 red, L3 yellow, L4-L5 green). Both are now shipped in the SCORECARD design. Enterprise resistance to "cannot reach top level without adversarial proof" is real but is a feature, not a bug — the whole point of the framework. Held. `>`

## 7. Attack modes and environment discipline

Kronos supports many modes of adversarial evaluation, each with its own authorization ceiling, rules of engagement, environment discipline, and finding shape. The full mode taxonomy is in [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md); this section captures the design rationale.

The modes are not exclusive; an engagement may combine modes (e.g., red-team + cost-adversarial against the same target under one authorization) and its authorization ceiling is the max of the combined modes' ceilings. The rationale for enumerating modes explicitly is that each mode has genuinely different operational risk profiles — a `black-box pentest` in `first-signal-stop` mode against production is safe by default, whereas a `destructive-load` in `go-to-town` mode against production would be reckless without extraordinary authorization.

**Execution policies (updated in v0.2 per ADR-0014).** The v0.1 two-mode model (`first-signal-stop` vs `go-to-town`) is superseded by a three-policy model where `first-signal-stop` is one stop condition within one policy, not a standalone safety guarantee:

- **`passive`** — no target-state-affecting actions. Impact class ≤ I1. May run on production without additional authorization above the standard scope.
- **`impact-bounded`** — active challenges permitted within a declared impact budget (see ADR-0014 for the full budget schema). May include `first-signal-stop` as one stop condition. Blast radius is bounded by budget, not just by finding count.

**`first-signal-stop`** (as a stop condition within `impact-bounded`) — the engagement proceeds until it produces the first finding at-or-above the engagement's declared **severity threshold** (critical / high / medium / low). Findings below threshold are recorded but do not halt execution. INCONCLUSIVE oracle verdicts are not findings and do not halt. When a threshold-meeting finding lands, the engagement immediately halts, writes the finding, alerts the designated contact, and closes.

Two structural constraints ensure this mode produces a meaningful sales/decision artifact:
- **Severity-ordered matrix.** In first-signal-stop mode, the attack matrix must be severity-ordered (highest-declared-severity attacks first). This ensures "stop early" means "stop on the worst thing reached," not "stop on the first thing tried."
- **Explicit INCONCLUSIVE semantics.** INCONCLUSIVE oracle verdicts are logged but do not count as findings for the stop condition. Engagements may optionally set INCONCLUSIVE handling to `halt-for-review` if the operator wants human adjudication before continuing.

- **`campaign-complete`** — the engagement continues until the planned attack matrix is exhausted, impact budget is exhausted, rate ceilings are hit, or the authorization window closes. Only permitted at impact class ≥ I2 in staging/lab; only permitted at impact class ≥ I3 in dedicated ephemeral environments per ADR-0014.

The default for production engagements is `impact-bounded` with `first-signal-stop` at severity threshold `critical` — the strictest threshold, guaranteeing the engagement stops only when a critical exposure has been demonstrated. `campaign-complete` in production is not supported; the framework refuses.

The commercial implication is significant: because `first-signal-stop` bounds the risk of production attack, kronos supports an **onboarding-gated free assessment** model (revised in v0.1 per Claude review P1-3B and ADR-0009). The prospect enrolls their target explicitly, signs a single-scope authorization artifact (authorization ceiling 1, first-signal-stop with critical or high threshold, 24-hour duration), and only after signature does the assessment run. The barrier is a single-page authorization signed during enrollment — lower friction than a traditional pen-testing engagement, but structurally an authorization. The v0 design's implicit "point it at a prospect's prod without authorization" framing has been removed as legally indefensible under CFAA and equivalent computer-misuse regimes.

The design commitment that production is in-scope, subject to mode discipline, is deliberate and controversial. Prior adversarial testing tools (`nmap`, `sqlmap`, Burp Suite, ZAP, Metasploit, Nuclei) treat production safety as an operator responsibility outside the tool; they assume the operator knows what they are doing and provide safety flags as suggestions. Kronos treats production safety as a structural feature: the mode is declared in the authorization artifact, enforced by the framework's `first-signal-stop-enforcer` action, and observable in the engagement record.

`<REVIEW: RESOLVED IN v0.1 —` Claude review P2-1. First-signal-stop redefined as severity-threshold-triggered rather than first-any-finding-triggered. Attack matrix must be severity-ordered when this mode is engaged. INCONCLUSIVE verdicts do not halt (they are not findings). See §7 above. Held pending subsequent reviewer input on edge cases. `>`

## 8. The threat catalog and adversarial coevolution

Kronos maintains a top-level, system-agnostic threat catalog — a versioned inventory of attack classes organized by category (identity, perimeter, integrity, availability, cost, supply-chain, and so on). Each catalog entry describes a class of attack in abstract terms, its common instantiations, references to published incidents and research, and suggested detection signals. Catalog entries are not tied to any specific target; they are the periodic table of adversarial pressure.

An engagement instantiates specific catalog entries against a specific target's architecture. The engagement's §7 attack matrix is a materialization of the catalog against the target — for each catalog entry in scope, one or more concrete attacks against specific target endpoints and claims.

The catalog is expected to grow monotonically over time from three parallel sources:

**Human curation.** The framework maintainer (initially: the operator; eventually: a curator team) adds new threat classes as they emerge from field experience, empirical incidents, published breaches, or targeted research. Additions are versioned; adopters pin their scorecard against a specific catalog version so that "score improved" and "score got worse because new attacks were added" are distinguishable.

**LLM watcher.** An AI agent monitors security-industry sources (CVE feeds, published breach post-mortems, novel attack research from conferences and journals) and proposes new threat classes to the human curator for review before promotion to the catalog. The LLM does not have autonomous write access to the catalog; the human curator is the gate.

**Auto-from-findings.** When an engagement produces a novel finding that does not fit any existing catalog entry, the finding itself is the seed for a new entry. The new entry is drafted from the finding, reviewed by the human curator, and promoted to the catalog. The next engagement against a different target automatically inherits the new class.

The framework becomes strictly stronger over time. No prior remediation is ever "done forever" — every new catalog entry is retroactively applicable to every previously-assessed target. A target scored L4 last quarter may be L3 this quarter because new attacks have been added to the catalog and its prior defense against those attacks has not been demonstrated.

This adversarial coevolution loop, in which the threat catalog is a versioned first-class object and target scorecards are computed against a specific catalog version, is a structural claim of the framework. It has no direct analogue in the automated security testing literature. Static scanners (Snyk, Dependabot, Semgrep) produce lists of known CVEs against static code; kronos produces a scored assessment against a growing catalog of attack methodologies whose applicability transcends any specific vulnerability. Threat modeling frameworks (STRIDE, PASTA) provide a taxonomy for reasoning about threats during design; kronos provides an execution engine for running the actual attacks and updating the scorecard.

`<REVIEW: RESOLVED IN v0.1 —` Claude review inline resolution. Catalog schema now includes a `deprecated` state. Deprecation freezes historical scores at the catalog version in effect when they were computed; deprecation does not retroactively rescore past engagements. Documented in SCORECARD.md §Deprecated catalog entries. `>`

`<REVIEW:` reviewers should also evaluate the LLM watcher role. Is autonomous LLM curation of a security-critical catalog dangerous? What are the failure modes (LLM hallucinates a threat class that doesn't exist, LLM misclassifies a novel real threat, LLM is prompt-injected via a CVE description into proposing malicious entries)? Where do the guardrails go? `>`

## 9. The runtime primitives

The kronos runtime operates over six primitives that together form the execution model of any engagement and the observation model of any target under continuous evaluation. (This section supersedes v0's four-primitive enumeration per ADR-0007 and Claude review P1-1.)

**Attack** is the specific probe executed against a target during an engagement. It is versioned, parameterized, and specified from a threat-catalog entry. An attack has an identity, a threat-class reference, one or more parameters (target endpoint, payload, timing), a declared severity if the attack succeeds, and a specification of what constitutes success from the attacker's perspective. Attacks are authored in YAML and executed by tools bound through the tool-binding contract (see §10).

**Attack oracle** is the deterministic assertion that evaluates whether an attack succeeded. Every oracle references observable signals only — response payloads, status codes, telemetry metrics, log lines, database state, downstream side-effects. The oracle produces one of three verdicts: PASS (the attack was blocked as expected), FAIL (the attack succeeded, indicating the defense did not fire), or INCONCLUSIVE (the observable signals did not permit a determination). AI-generated narrative may explain an oracle result but cannot replace it. This constraint is load-bearing: it prevents the framework from being an LLM-in-a-loop that hallucinates security posture. (Renamed from "oracle" in v0 to disambiguate from the plausibility monitor below, per ADR-0007.)

**Plausibility monitor** is a continuous or scheduled evaluation of observed values against a declared capacity model. It is a distinct object from the attack oracle: the attack oracle answers "did this specific attack succeed?" once per attack; the plausibility monitor answers "is this observation within physical bounds?" continuously. When the monitor determines that an observed value exceeds the capacity model's physical bound (adjusted by tolerance multiplier), it emits a finding using the same finding schema. The monitor runs outside the engagement lifecycle; it requires only an authorization artifact granting observation-source access and a capacity model. This primitive is the mechanism that would have caught the founding incident within hours instead of five days — the "$76B in NAT charges is impossible given zero NAT gateways" reasoning is the plausibility monitor's central move. See [`methodology/PLAUSIBILITY-MONITOR.md`](methodology/PLAUSIBILITY-MONITOR.md) for the full specification.

**Capacity model** is the operator-authored (or observed-inferred) mapping from the target's declared infrastructure to the physical bounds each resource class can produce. Lives at `<target>/kronos/capacity.yaml`. First-class methodology artifact, versioned in git, referenced by plausibility-monitor findings. Bounds are derivations from published vendor specifications and pricing (e.g., "AWS NAT Gateway supports 45 Gbps → 486 TB/day per gateway → $0/day when count is zero"). The framework will ship a reference bounds library for AWS/Azure/GCP; adopters extend for private infrastructure.

**Evidence** is the persistent record of an attack execution and its oracle evaluation, or of a plausibility-monitor observation. It includes exact request/response payloads, telemetry signals within the correlation window, side-effects detected in target state, and timing. Evidence artifacts are hashed by SHA-256 and referenced by content-addressable identifier from the engagement's §9 execution log or the plausibility-monitor's finding record. Evidence is stored under `<target-repo>/kronos/evidence/`, committed to git.

**Execution provenance** is the signed attestation binding an evidence artifact to a specific tool invocation at a specific time by a specific operator. Contains: attack ID, tool ID + version, target slug + endpoint, invocation timestamps, operator identity + runner identity, evidence-artifact hashes. Signed with an ed25519 or equivalent key by the operator or runner. Evidence hashes prove the artifact was not altered after commit; execution provenance proves the artifact was produced by a real execution. Both are required for public findings to be independently verifiable. (Added in v0.1 per Claude review P2-3 to distinguish evidence-integrity from execution-authenticity.)

**Finding** is the assertion of a specific defense failure or plausibility violation, backed by specific evidence and execution provenance, with reproduction instructions and suggested remediation. Every finding has a stable identifier (deduplicating across engagements of the same target), a severity, a source (`attack:<id>` or `plausibility-monitor:<observable>`), and a scorecard-delta contribution. Findings are markdown files with YAML frontmatter.

**Reproducibility caveat.** Evidence integrity (hash) and execution provenance (signature) are durable. **Reproducibility** of an attack against a live target is not durable in general — target state drifts, credentials rotate, attacker-owned resources are torn down. A finding can be valid and still fail to reproduce months later. The framework distinguishes evidence-of-what-happened (durable) from re-executability (often ephemeral) and does not promise the latter unconditionally. (Added in v0.1 per Claude review P2-3.)

**Engagement runtime loop.** The runtime executes an engagement by iterating through its §7 attack matrix (severity-ordered for first-signal-stop engagements): for each attack, invoke the appropriate tool through the tool-binding contract, collect raw response and telemetry as evidence, produce the execution-provenance attestation, invoke the attack oracle to evaluate, and if the oracle returns FAIL at-or-above the engagement's severity threshold, produce a finding and (in first-signal-stop mode) halt the engagement. When the matrix is exhausted or first-signal-stop triggers, the engagement moves from `04_running/` to `05_evidence/` and the oracle/finding pass runs to close out. Then to `06_shipped/` with the scorecard delta committed.

**Plausibility-monitor runtime loop.** Runs outside the engagement lifecycle. On its declared cadence (continuous, scheduled, or on-demand), the monitor polls each observable declared in the target's capacity model, evaluates against the model's declared bounds (with tolerance multiplier), and emits findings for any observation exceeding bounds. Findings land at `<target>/kronos/findings/plausibility/YYYY-MM-DD-<hash>.md` and are aggregated by the scorecard.

The runtime is deliberately simple. There is no distributed orchestration, no message queue, no evidence-collection agent running in-target for the core case. The core runtime is a shell that invokes tools, hashes their output, signs provenance, and writes markdown. This simplicity is a design commitment: the framework must be operable from a laptop, with git and a few command-line tools, without any framework-hosted service.

**Extension points** (added in v0.1 per Claude review §9 inline). The simple core does not preclude parallel execution or external collectors. The framework declares two extension interfaces: (a) an optional **parallel executor** interface for engagements that need to coordinate attacks across dozens of endpoints simultaneously; (b) a **collector interface** for evidence sources that are not accessible from the operator's laptop (in-target CloudWatch subscribers, cloud-native metric-stream consumers). Both are optional; the reference implementation ships the sequential/laptop-only core, with the extension interfaces documented and reference implementations shipped as separate optional packages.

## 10. Tool binding — how the framework delegates attack execution

Kronos is not itself a security scanner. It does not natively know how to send an HTTP request, run Burp Suite against an endpoint, execute sqlmap, scan with Nuclei, drive a browser, or generate load with k6. It knows how to describe an attack abstractly (§7 attack matrix) and delegates execution to tools that know how to perform the described work.

The **tool binding contract** governs the delegation. It answers: how does the framework invoke a tool? How does a tool return evidence? How does the framework know what a tool can do? How does the framework decide which tool to use for which attack? How does a tool declare its authorization requirements? How does the framework prevent a tool from exceeding those requirements?

The full specification is in [`methodology/TOOL-BINDING.md`](methodology/TOOL-BINDING.md). The design commitments are:

**Four binding layers.** Every tool binds at the highest layer it can support; the framework accepts all four:

- **Layer 0 — Bare shell.** Any tool that can be scripted from bash. Framework invokes via `bash -c "..."`, captures stdout/stderr/exit-code as raw evidence. Zero barrier to entry.
- **Layer 1 — Structured adapter.** Tool has a YAML manifest declaring capabilities and an adapter script that translates framework attack-spec ↔ tool CLI ↔ framework evidence schema. The pragmatic default for established security tools (Burp Suite, sqlmap, Nuclei, ZAP, k6, Artillery, chaos-mesh).
- **Layer 2 — Model Context Protocol.** Tool exposes an MCP server; framework speaks MCP directly. Capability discovery via `tools/list`; attack execution via MCP tool calls. Every MCP-compatible tool becomes a kronos tool with zero framework-side integration cost. This is the alignment vehicle with the emerging AI-tool ecosystem.
- **Layer 3 — Native kronos tool.** Tool implements the framework's internal tool SDK directly. Reserved for reference-implementation primitives (bare HTTP client, evidence hasher, oracle runner) that will live in a future `alchemisthomer/kronos-tools/` sibling repository.

**Tool manifest schema.** Every tool (Layers 1, 2, 3) declares its identity, version, capabilities (attack classes + subclasses + evidence types produced), invocation binding layer, authorization requirements (network access, credentials, elevated privilege, max safety level), and sandbox recommendation via a `manifest.yaml` file. The framework reads the manifest to know what the tool can do without having any tool-specific code.

**Binding resolution.** At attack execution time, the framework matches the attack's required capabilities against available tools' declared capabilities. Multiple tools may match; the engagement's §3 rules of engagement may specify preference; otherwise the framework picks deterministically. If no tools match, the engagement is blocked with a `no-tool-binding-available` finding — this is itself diagnostic information (the operator's toolset does not cover the attack surface the engagement declared).

**Structural authorization enforcement.** A tool's declared `safety_level_max` must be at least the engagement's declared safety level, or the tool is refused. Network scope, credential handoff, and sandbox posture are all authorization-gated at invocation time. These are structural refusals, not policy warnings.

**Custom tooling.** An adopter writing a target-specific tool creates `<target-repo>/kronos/tools/<tool-id>/` with a manifest + adapter + README. The framework treats it identically to a distributed tool. Barrier to entry: one YAML + one script.

**First-tier reference tools** kronos will ship or bind: bare HTTP client (native), AWS CLI wrapper (native), Salesforce API wrapper (native), GitHub REST client (native), Burp Suite Professional (Layer 1), OWASP ZAP (Layer 1), sqlmap (Layer 1), Nuclei (Layer 1), Nmap (Layer 0), k6 / Artillery (Layer 1), chaos-mesh (Layer 1), any MCP-compliant security tool (Layer 2 with capability discovery).

The tool binding contract is what makes kronos a framework rather than a tool. Every specific security tool that exists today, every tool that will exist tomorrow, is a candidate kronos tool — provided it can bind at some layer.

`<REVIEW:` reviewers should evaluate whether the four-layer model is the right decomposition. Consider: is Layer 2 (MCP) mature enough to commit to as first-class? Is Layer 3 (native SDK) worth the maintenance cost of a stable internal API contract? Should there be a Layer -1 for "kronos-refused capabilities" (single-use offensive tools we will not integrate under any circumstances)? `>`

`<REVIEW:` reviewers should also evaluate the manifest schema. Are the required fields the right set? Is the capabilities taxonomy expressive enough for real security tools whose capabilities may be highly parameterized (Burp can do many things depending on which extensions are loaded)? How does the manifest handle tool version drift when the underlying tool ships weekly? `>`

See ADR-0005 for the architectural rationale.

## 11. Authorization, dual-use, and the legal-liability boundary

Kronos is dual-use. Any tool capable of testing the defenses of a system on behalf of that system's owner is equally capable of attacking that system on behalf of an adversary. This is a permanent property of adversarial-testing frameworks; it cannot be engineered away. Prior industry-standard tools (Metasploit, Burp Suite, sqlmap, Nmap, Nuclei) operate under the same principle: the tool is legal; the use of the tool is the user's responsibility.

Kronos addresses this property structurally rather than pretending it does not exist. The mechanisms are:

**Authorization artifact as first-class primitive.** Every kronos engagement requires a signed authorization artifact naming target scope, timeframe, rate ceilings, destructive-testing permission, approver identity, and contact of record. The artifact is a first-class first-order object in the methodology — not a click-through EULA, but a signed, versioned, git-committed record that is validated by the framework's `authorization-artifact-validator` action at every engagement start. The framework's runtime refuses to execute active probes without a valid artifact.

**Incident-state discipline** (added in v0.1 per ADR-0009). The authorization artifact recognizes a distinct incident-state (`incidentState.declared: true`) with two structural consequences: (a) `dataClassPreservation: enforced` — the framework refuses to invoke any tool whose declared `resource_classes_affected` intersects the engagement's enumerated `dataClassResources` (persistent storage, identity records, DNS, audit logs, encryption keys by default), regardless of the operator's authorization or the tool's declared capabilities; (b) `signedSober: false` — the framework refuses tools at authorization ceiling ≥ 3 (destructive testing). The `dataClassPreservation: waived` mode requires an additional signature beyond the standard approver signature, making the "sign it in the middle of a panic to waive the preservation" path expensive enough to prevent operator error under duress. This is the founding-incident lesson made structural.

**Chain-of-authorization for third parties** (added in v0.1 per ADR-0009 and Claude review P2-6). Engagements whose attack matrix touches third-party platforms (cloud providers, SaaS services, third-party APIs) require an explicit `chainOfAuthorization.thirdParties` block enumerating each party, the resource classes affected, and the operator's acknowledgment that the actions fall within the third party's acceptable-use policy. The framework's `authorization-artifact-validator` action fails engagements whose attack matrix references third-party resource classes not declared in the chain. Chain-of-authorization is documentation, not delegation — the block does not create legal authorization the operator does not otherwise have; it makes the operator's affirmation structurally recorded and versioned.

**License and terms of use.** Kronos is licensed under GNU AGPL v3. The license does not restrict use, but it does require that any hosted service running modified kronos code make the modified source available to that service's users. This means an adversary running a hosted kronos-derivative for malicious purposes cannot hide the fork; the source is subject to disclosure.

**Explicit authorized-user vs unauthorized-user liability separation.** The repository's README and every public artifact state clearly that CloudPremise LLC (the framework's authoring entity) operates only under signed authorization. Unauthorized use by any party is the responsibility of that party. The framework maintainer does not indemnify unauthorized users and disclaims all liability for their actions.

**Refused capabilities.** The framework does not include, and will not include, any capability whose only rational purpose is malicious use with no authorized-defensive counterpart. Examples of refused capabilities: exploit chains against unpatched CVEs bundled as reusable attacks (an attack-catalog entry names a class; it does not ship a working weaponized exploit); credential-harvesting tools for third-party services; detection-evasion techniques whose sole purpose is to hide from legitimate monitoring. Dual-use capabilities (credential testing, rate-limit probing, network scanning) are documented as such and their authorization-requirement is prominently declared.

The structural coupling of dual-use tooling with a first-class authorization artifact, in which the authorization is both a legal record and an executable configuration, is a claimed novel property of the framework (SEVEN-CLAIMS §7).

`<REVIEW:` reviewers should evaluate whether the framework's authorization discipline is legally defensible. Consider: does AGPL v3 sufficiently protect the framework author from liability for unauthorized use? What jurisdictions apply? Are there jurisdictions (e.g., Germany's §202c StGB "hacker tool" law, US Computer Fraud and Abuse Act) where the framework itself could be considered contraband regardless of authorization discipline? What is the correct legal disclaimer to make prominently visible? `>`

`<REVIEW:` reviewers should also evaluate the "refused capabilities" boundary. Is the line between dual-use and single-use offensive coherent in practice? How does the framework prevent a contributor from proposing a capability that seems dual-use but is actually single-use offensive? Is there a review process for proposed capability additions? `>`

## 12. Reference engagements — olympus-616 (two engagements)

Per Claude review P2-5, the reference implementation covers two engagements rather than one. A single passing engagement exercises the pass path but not the write-heavy paths (finding-writing, scorecard-drop, eos-backlog auto-file, first-signal-stop actually stopping, INCONCLUSIVE handling). Two engagements — one expected PASS and one expected FAIL — exercise the complete framework loop.

### Reference engagement A — expected PASS (validates the pass path)

The first kronos engagement against a real target is designed to validate the framework's full loop end-to-end for the case where the defense holds.

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

Both outcomes validate the framework, but only one exercises each set of paths. Engagement A demonstrates the pass path; engagement B (below) demonstrates the write-heavy paths.

The engagement will produce, as artifacts committed to `olympus-616/foundation/kronos/`:

- One engagement document: `olympus-grid.kronos-1.md` in `06_shipped/`
- One evidence folder: `evidence/olympus-grid.kronos-1/` containing the raw request, the raw response, the CloudWatch metric excerpt, and the execution-provenance attestation
- One scorecard update: the target's `SCORECARD.md` reflecting the new Perimeter Defense level
- Zero findings expected

### Reference engagement B — expected FAIL (validates the write-heavy path)

The second reference engagement targets a deliberately-injected weakness in an isolated staging environment to exercise the write-heavy paths: finding generation, scorecard-drop, eos-backlog auto-file, first-signal-stop actually halting, and INCONCLUSIVE handling under genuine ambiguity.

**Target:** olympus-grid staging, with a temporary configuration change disabling one specific L-layer defense (candidate: L1 event-registry drop-first classification is temporarily set to allow-first for a specific unknown event_type). This is authored expressly so the engagement will produce a finding.

**Threat model class:** perimeter-bypass via forged event-type header.

**Attack:** POST 40 requests with a forged `event_type: "payment.stripe.settled"` header to a public endpoint that emits to Plutus, per the L1 diagnostic attack in `hostile-universe-defense-kronos-redteam-plan-2026-07-24.md`.

**Mode:** `first-signal-stop` with severity threshold `high`. The attack matrix is severity-ordered.

**Oracle:** expect CloudWatch metric `AresEventsDropped` with dimension `Tier=recon` to show drops ≥ 30 within 60s; if not, defense failed and the finding is critical severity.

**Expected outcome:** the disabled L1 defense does not fire; the recon-tier rate cap does not drain; over-threshold events are admitted; the oracle returns FAIL; a critical finding is written; the engagement halts at first-signal-stop; the scorecard's Perimeter Defense dimension drops from its previous state to L1 with the finding cited; if eos is co-installed, the finding auto-files a backlog cycle in `olympus-616/foundation/eos/cycle/00_backlog/` naming the L1 attestation as falsified.

The engagement produces:

- Engagement document `olympus-grid.kronos-2.md` in `06_shipped/`
- Evidence folder with request/response artifacts, CloudWatch metric excerpts showing the missing drop count, and execution-provenance attestation
- Finding markdown `06_shipped/olympus-grid.kronos-2.finding-1.md` with reproduction instructions and remediation suggestion
- Scorecard update reflecting the drop
- Auto-filed eos backlog cycle in `foundation/eos/cycle/00_backlog/eos-N-perimeter-restoration.md`

After the engagement closes, the temporary configuration change is reverted and engagement C is planned to re-verify the defense holds.

### Third-party authorization prerequisite

Per Claude review P2-6 and ADR-0009, engagement A's use of an attacker-owned AWS CloudFront distribution requires an explicit chain-of-authorization block in the engagement's §2 authorization artifact naming AWS as the third party, enumerating the resource classes (CloudFront distribution creation, ALB target invocation), and containing the operator's acknowledgment that the actions fall within AWS Acceptable Use Policy. This is not a future concept; it is a prerequisite for engagement A shipping.

## 13. Roadmap and MVP prototype architecture

The design converges through cross-LLM review before any framework code is written (Phase 0). Once the design is stable, the MVP prototype is built (Phase 1). Once the MVP validates the framework loop against the reference engagement (Phase 2), production capabilities are incrementally added (Phases 3+).

### Phase 0 — Design convergence (currently in progress)

- v0 of this document (currently)
- v0.1 after Claude.ai web review
- v0.2 after ChatGPT-5 review
- v0.3 after Grok review
- v0.4 after Gemini 2.5 Pro review
- Loop until two consecutive reviewers propose only cosmetic changes
- Patent disclosure draft authored based on converged design

### Tension between reviewers on MVP sequence (v0.3 note)

Grok's cross-LLM review recommended prioritizing the runner scaffold (React/TS dual-number scorecard + kanban + evidence drill-down) and dogfooding immediately against the kronos repo itself. ChatGPT's review recommended engine-first (schemas → CLI → typed executor → oracle → evidence → watchdog → L14 reference engagement → static report → scorecard → React runner). These are directly opposite sequences.

The v0.3 documents preserve ChatGPT's engine-first ordering below because engine-first ensures every UI rendering has real underlying primitives to render; UI-first risks producing a polished interface backed by an incomplete domain model. But Grok's argument for early dogfooding has merit for adopter validation. The subsequent reviewer (Gemini) is invited to weigh in explicitly on this sequencing question; if consensus doesn't emerge, the operator will decide.

Regardless of sequence, both reviewers agree the runner and engine are both required for v1.0; the disagreement is only about which ships first as MVP.

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

## 14. What kronos is not, and boundaries with adjacent disciplines

Kronos is not a penetration test in the traditional consulting sense. Traditional pen tests engage a target with an unbounded scope and hunt for undiscovered flaws, producing a PDF report at the end of the engagement window. Kronos verifies specific claims against a growing catalog of specific attacks, producing a scorecard that evolves over time. The two disciplines are complementary; a mature target will use both.

Kronos is not a vulnerability scanner. Scanners produce lists of known CVEs against static code or configuration. Kronos produces a scored assessment against a catalog of attack methodologies that transcends any specific vulnerability. A CVE-based scanner is a valuable input to kronos (a new CVE class can seed a new catalog entry) but the scanner's output is not the same shape as kronos's output.

Kronos is not a bug bounty program. Bug bounty programs incentivize external researchers to find flaws in a target's production surface, paying per finding. Kronos runs a defined attack catalog under signed authorization; the authorization discipline and the catalog approach are the differences. Bug bounties are valuable and complementary to kronos; the two do not compete for the same operator time.

Kronos is not a cloud-security-posture management (CSPM) tool. CSPM tools compare a target's cloud configuration to a declared compliance posture and surface drift. Kronos actively attacks the target to verify that the compliance posture actually holds under adversarial pressure. CSPM is passive observation; kronos is active challenge. A mature target will use both.

Kronos is not a chaos-engineering framework. Chaos-engineering frameworks inject infrastructure faults (kill a pod, partition a network, delay a service) to test resilience. Kronos may invoke chaos-engineering frameworks as tools within a `destructive-load` mode engagement, but kronos's scope is broader than infrastructure resilience — it includes cost integrity, security, data integrity, and operational discipline as peer dimensions.

Kronos is not a specific security-scanning product ecosystem's competitor (Snyk, Wiz, Prisma, Qualys, Rapid7, Tenable). It is a methodology within which those products can operate as tools when the operator chooses to integrate them. The methodology's value is orthogonal to any specific tool's value; a mature target may use kronos as its methodological backbone and integrate multiple commercial scanners as attack executors within kronos engagements.

## 15. Updates to eos that fall out of this design

Kronos operates independently of eos. However, the following optional updates to the eos methodology would strengthen the bidirectional integration when both frameworks are co-installed. These are proposed for consideration by the eos maintainer; they are not prerequisites for kronos to ship.

**Attestation template `§7.1 Red team evaluation` section.** Each eos attestation can enumerate the kronos catalog entries that are expected to be evaluated against the attested claims once kronos is in scope. This is the eos-side declaration of "these are the attacks I expect to survive." It aligns eos and kronos scope commitments at attestation-authoring time.

**`06_shipped/` cycles get an optional `kronos_verified` frontmatter field.** A cycle whose claims have been kronos-tested and survived carries this field set to the latest kronos engagement identifier. This makes the eos kanban legible about which claims have been adversarially proven.

**A `10_falsified/` folder is added to the eos kanban** as a peer of `07_aborted/`. Cycles in this folder are attestations whose claims have been falsified by kronos. The cycles are the seeds of the auto-filed backlog entries; the target's operators can inspect the falsification evidence directly from the eos kanban.

**Cross-framework provenance in the runner.** When the shared runner renders a target that has both eos and kronos installed, it can present a fused view: eos cycles by stage, kronos engagements by stage, and the composite scorecard reading both. This is a runner-side change, not a methodology change.

These changes are proposed as future eos cycles, sequenced at the eos maintainer's discretion.

## 16. Industry standards alignment

Enterprise adopters do not encounter kronos in a vacuum. They already operate under one or more compliance regimes (SOC 2, ISO 27001, PCI DSS, HIPAA, FedRAMP), consult one or more maturity models (BSIMM, OWASP SAMM, CIS Controls, NIST CSF), architect against one or more cloud-vendor frameworks (AWS Well-Architected, Azure, GCP), and — increasingly — pursue one or more AI-specific risk frameworks (NIST AI RMF, AIUC-1, ISO 42001, EU AI Act conformance). The framework's silence on how it relates to this landscape would be both a marketing gap and a legitimate structural gap.

The full alignment analysis is in [`methodology/INDUSTRY-ALIGNMENT.md`](methodology/INDUSTRY-ALIGNMENT.md). The design commitments are:

**Positioning claim.** Kronos is the adversarial verification layer beneath every industry certification claim. Certifications describe controls that ought to be in place. Kronos runs the attacks that would succeed if the controls were not actually in place. A certification with kronos evidence behind it is a stronger claim than a certification without. Kronos does not compete with certification bodies; it produces the evidence they can consume.

**Six categorizations of the landscape.** The complete taxonomy is in INDUSTRY-ALIGNMENT.md. In summary:

- **Foundational** — MITRE ATT&CK, MITRE ATLAS (AI), CAPEC, CWE, CVE. Kronos catalog entries carry tags for these identifiers; findings reference CWE class and CVE ID where applicable. Structural alignment; kronos uses their vocabulary.
- **Complementary — attainment-based** — SOC 2 Type II, ISO/IEC 27001, PCI DSS, HIPAA/HITECH, FedRAMP, HITRUST CSF. Kronos produces per-standard mapping documents showing which scorecard dimensions and catalog entries help verify which controls.
- **Complementary — maturity-based** — OWASP SAMM, BSIMM, NIST CSF 2.0, CIS Controls v8. Kronos scorecard is orthogonal peer measuring adversarial-proof maturity while these measure process-presence maturity.
- **Complementary — architectural** — AWS Well-Architected, Azure Well-Architected, GCP Architecture Framework. Kronos scorecard pillars map to Well-Architected pillars.
- **Mapping targets** — OWASP ASVS L1/L2/L3, NIST AI Risk Management Framework 1.0. Scorecard cells cite these standards' control IDs directly.
- **Emerging AI-specific** — NIST AI RMF, AIUC-1, ISO/IEC 42001, EU AI Act conformance regimes. Kronos is highly relevant; alignment work tracked as standards stabilize.

**Mapping artifact convention.** Per-standard mapping documents live in `docs/alignment/` following a common template. Each mapping is versioned; when a standard revises, the mapping is updated in place. Priority order for initial mappings: OWASP ASVS 4.0.3 → NIST CSF 2.0 → NIST AI RMF 1.0 → SOC 2 TSC 2017 → AWS Well-Architected → OWASP SAMM 2.0 → CIS Controls v8. Remaining standards produce mappings on customer demand.

**The consulting narrative.** eos + kronos becomes "SOC 2 helper + adversarial verifier" — the combined offering moves customers toward certification. eos closes the documentation requirements; kronos closes the actual-defense-works verification. Certification bodies see documented controls; kronos evidence shows those controls survive attack.

**Explicit non-goals.** Kronos does not issue certifications. Kronos does not act as an authorized certification body. Kronos does not substitute for third-party audits. Kronos does not guarantee certification attainment. The line is clear: kronos produces evidence; certification bodies consume evidence (among other inputs) and issue certifications.

**Potential eighth claim for patent structure.** The positioning of kronos as "the adversarial verification layer beneath every industry certification" may constitute a novel property beyond the seven claims already articulated. Prior work in the certification-preparation tool space includes vulnerability scanners (which produce technical evidence without certification-mapping structure), governance/risk/compliance platforms (which produce documentation without adversarial evidence), and consulting practices (which produce narrative reports without reproducible evidence). None combine adversarial-proof evidence with structural mapping to multiple industry-standard frameworks with explicit positioning as verification-layer-beneath-certification. Whether this constitutes an eighth claim or is subsumed within existing claims is a question for the design review cycle.

`<REVIEW:` reviewers should evaluate whether the mapping-maintenance burden is sustainable. Each mapping is a versioned artifact that must be revised when the underlying standard revises. For long-lived kronos, this becomes real ongoing work. Consider: should per-standard mapping maintenance be community-contributed (a per-standard maintainer per mapping) or contracted (partnership with an audit firm)? What is the failure mode when a mapping goes stale? `>`

`<REVIEW:` reviewers should also evaluate the AI-specific alignment work. NIST AI RMF, EU AI Act, ISO 42001, AIUC-1 are all evolving rapidly. Alignment work on emerging standards is expensive and may need substantial revision. Is the strategic bet on early AI-standard alignment worth the risk of needing to redo the work as standards stabilize? Or should kronos wait for AI standards to stabilize before publishing mappings? `>`

See ADR-0006 for the architectural rationale.

## 17. IP posture and patent claim scaffold

### IP posture (deferred hybrid)

The strategic question of whether kronos pursues patent protection on specific technical mechanisms is **deferred pending IP counsel review**. The operator has elected hybrid framing: both patent-claim and open-source-moat language coexist in current documents; downstream resolution will narrow one direction, both, or neither. Contributors accept the AGPL-3.0 patent grant (§11) as part of the contribution agreement.

**The strongest candidates for eventual patent claims** (per prior-art analysis in INVENTIVE-CONCEPT-CANDIDATES.md) are technical mechanisms rather than methodology framing:

- **Enumeration reconciliation** as mandatory tool-binding contract with filtered/unfiltered delta as first-class finding class (ADR-0017 §Enumeration; the specific mechanism that would have caught the founding-incident scanner bug).
- **Execution-provenance signing** binding evidence artifacts to specific tool invocation via SLSA-aligned signed attestation (ADR-0015).
- **Git-history scorecard recomputation** producing time-series trajectory from the same source-of-truth without separate persistence (SCORECARD §State versus trajectory).
- **Capacity-model bounds derivation** for physical-plausibility monitoring (ADR-0007, PLAUSIBILITY-MONITOR §Bounds derivation examples).
- **Dual-plane execution model** with challenge-as-parent-abstraction and continuous-plane running outside engagement lifecycle (ADR-0011).

Methodology-level framing (presumption-of-failure discipline, dialectic with attestation, scorecard-as-north-star, per-engagement production-safety mode) faces steeper Alice/§101 subject-matter-eligibility headwinds in the US and is more defensibly held as open-source-moat differentiation rather than patent claims.

### Patent claim scaffold

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

## 18. Open questions for the design review

Beyond the inline `<REVIEW:...>` markers, several higher-level questions remain open for subsequent review rounds. Questions resolved by Claude's first-pass review are marked (RESOLVED IN v0.1); those still open are marked (OPEN).

**(RESOLVED IN v0.1 — Claude review P1-1)** How does the physical-plausibility oracle actually work as a mechanism? — Resolved via ADR-0007 and `methodology/PLAUSIBILITY-MONITOR.md`. Capacity model + plausibility monitor added as first-class primitives distinct from the attack oracle.

**(RESOLVED IN v0.1 — Claude review P1-1)** Where does the enumeration reconciliation live? — Resolved via mandatory `enumeration.reconcile` field in the tool manifest schema (TOOL-BINDING.md).

**(RESOLVED IN v0.1 — Claude review P1-1)** Where does panic-mode authorization with data-class preservation live? — Resolved via `incidentState` and `dataClassResources` blocks in TEMPLATE §2 (ADR-0009).

**(RESOLVED IN v0.1 — Claude review P1-2)** Can kronos reach L3 without eos? — Resolved via ADR-0008 (L3 redefined as "framework-integrated with automated diagnostic attack defined and passing," attainable natively).

**(RESOLVED IN v0.1 — Claude review P1-3A)** How does retroactive catalog growth interact with a sold public number? — Resolved via ADR-0010 (dual-number rendering + 90-day catalog-bump governance window + 72-hour field-falsification exception).

**(RESOLVED IN v0.1 — Claude review P1-3B, P2-6)** How does the free-assessment model comply with authorization discipline? — Resolved via ADR-0009 (onboarding-gated prospect authorization; chain-of-authorization for third parties; unsolicited prod probing dropped).

**(RESOLVED IN v0.1 — Claude review P2-1)** What are the exact semantics of first-signal-stop? — Resolved via severity-threshold + severity-ordered matrix + explicit INCONCLUSIVE handling (documented in §7 and OPERATING-MANUAL).

**(RESOLVED IN v0.1 — Claude review P2-2)** The word "oracle" was overloaded. — Resolved via rename to "attack oracle" throughout, with "plausibility monitor" as the distinct object.

**(RESOLVED IN v0.1 — Claude review P2-3)** Evidence has integrity but not authenticity. — Resolved via execution-provenance signing (TOOL-BINDING and TEMPLATE §9), with explicit reproducibility caveat.

**(RESOLVED IN v0.1 — Claude review P2-4)** The headline score was operator-configurable and not comparable. — Resolved via ADR-0010 (fixed minimum-across-five-critical-dimensions headline).

**(RESOLVED IN v0.1 — Claude review P2-5)** The reference engagement validated only the pass path. — Resolved via addition of reference engagement B (expected FAIL) in §12.

**(RESOLVED IN v0.1 — Claude review P2-8)** An unfalsifiable claim in the reference-impl doc violated the framework's Popperian brand. — Resolved via replacement with bounded operational claims in docs/examples/olympus-616.md.

**(OPEN — deferred to operator + IP counsel, flagged in v0.1)** Is the strategy patent play, open-source moat play, or hybrid? — Deferred-decision block added to SEVEN-CLAIMS. Downstream framing depends on this decision.

**(OPEN — Claude review P2-7)** How is the LLM watcher's curator verification protocol specified? What treats CVE descriptions as untrusted input rather than instructions? Should auto-from-findings promotion ever be fully automatic given its retroactive scorecard impact? Recommendation is to specify curator protocol in a subsequent methodology file and to keep human-in-loop indefinitely for catalog promotion. Not blocking v0.1 shipment.

**(OPEN — subsequent reviewer input needed)** Are the five critical dimensions the correct five? Alternative selections include swapping Incident Response for Availability & Resilience (some argue availability is more consequential than response readiness) or adding Cost Integrity (given the founding incident). Recommendation: hold the current five until a subsequent reviewer proposes a specific alternative with justification.

**(OPEN)** How is community contribution to the threat catalog governed? Reviewer proposal, threat-class contribution flow, curator authority, and revocation procedures.

**(OPEN)** Where does the runtime multi-persona LLM evaluation fit? The methodology mentions AI-assisted attack generation, finding interpretation, and remediation suggestions. The multi-persona pattern (LLMs playing red/blue/synth roles) is proposed but the specific runtime contract is not yet specified.

**(OPEN)** Is the runner's read-only-plus-PR-write model sufficient for long-running engagements with dozens of committed evidence artifacts?

**(OPEN)** How does kronos evolve its own scorecard? Should kronos dogfood itself, running engagements against its own runner and oauth-server?

**(OPEN)** What is the versioning strategy for the framework across breaking methodology changes? Adopters pin catalog versions; do they also pin methodology versions?

**Q1. Is the presumption-of-failure epistemology commercially viable?** Enterprise buyers are accustomed to positive-certification frameworks. A framework that explicitly says "we don't certify your system as safe; we only certify that we couldn't break it" may be a harder sale. Is the framing right, or should the marketing language soften the philosophical commitment while preserving the operational commitment?

**Q2. Is the twelve-dimension scorecard the right structure?** Alternative structures exist (NIST CSF five pillars, BSIMM twelve practices, OWASP SAMM fifteen practices, CIS Controls). Should kronos converge toward one of these industry-recognized taxonomies for enterprise adoption, or is the kronos-specific structure a differentiator worth preserving?

**Q3. How is community contribution to the threat catalog governed?** As kronos grows, external contributors may propose catalog entries. What is the review process? Who decides what counts as a novel threat class vs a variant of an existing one? Is there a governance body?

**Q4. Where does the runtime multi-persona LLM evaluation fit?** The methodology mentions AI-assisted attack generation, finding interpretation, and remediation suggestions. The multi-persona pattern (LLMs playing red/blue/synth roles) is proposed. What is the specific runtime contract? How are LLM outputs distinguished from deterministic outputs in the finding schema?

**Q5. What is the framework's stance on covered testing that requires attacking third-party systems?** Some target defenses depend on third-party components (a WAF provided by a cloud vendor, an identity provider, a payment processor). Testing whether the target's defense holds may require testing the third-party component. How does kronos handle authorization for these cases? Is there a "chain of authorization" concept?

**Q6. Is the runner's read-only-plus-PR-write model sufficient?** The runner reads via GitHub REST and writes via pull requests. For long-running engagements with dozens of committed evidence artifacts, this may be operationally slow. Should there be a batch-commit mode? A direct-push mode for authorized operators?

**Q7. How does kronos evolve its own scorecard?** As the framework itself is a codebase, it has security posture, cost posture, availability posture. Should kronos dogfood itself, running engagements against its own runner and oauth-server? What does self-attack look like structurally?

**Q8. What is the versioning strategy for the framework across breaking methodology changes?** Adopters pin catalog versions. Do they also pin methodology versions? What happens when the scorecard model changes (e.g., a thirteenth dimension is added)? Are legacy scorecards recomputed against the new model, or held at the old model?

## 19. Companion documents and next steps

This document is v0 of the kronos design. It exists to be reviewed. Companion documents (all in this repository):

- [`methodology/OPERATING-MANUAL.md`](methodology/OPERATING-MANUAL.md) — the operating discipline in full
- [`methodology/SEVEN-CLAIMS.md`](methodology/SEVEN-CLAIMS.md) — the novel-property claims (with a deferred-decision block on patent-vs-open-source strategy)
- [`methodology/SCORECARD.md`](methodology/SCORECARD.md) — the maturity scorecard model, including non-configurable critical-dimension headline and dual-number rendering (v0.1)
- [`methodology/TEMPLATE.md`](methodology/TEMPLATE.md) — the engagement document template, including the incident-state and chain-of-authorization blocks (v0.1)
- [`methodology/TOOL-BINDING.md`](methodology/TOOL-BINDING.md) — the four-layer tool binding contract, manifest schema, enumeration reconciliation, and execution-provenance signing (v0.1)
- [`methodology/PLAUSIBILITY-MONITOR.md`](methodology/PLAUSIBILITY-MONITOR.md) — the capacity-model and plausibility-monitor primitives (new in v0.1)
- [`methodology/INDUSTRY-ALIGNMENT.md`](methodology/INDUSTRY-ALIGNMENT.md) — kronos's positioning against the compliance landscape and per-standard mapping strategy
- [`docs/adr/ADR-0001-three-layer-identity.md`](docs/adr/ADR-0001-three-layer-identity.md) — with directory-materialization section marked superseded-in-part by ADR-0002
- [`docs/adr/ADR-0002-productization-alignment-with-eos.md`](docs/adr/ADR-0002-productization-alignment-with-eos.md)
- [`docs/adr/ADR-0003-scorecard-as-north-star.md`](docs/adr/ADR-0003-scorecard-as-north-star.md)
- [`docs/adr/ADR-0004-eos-dialectic.md`](docs/adr/ADR-0004-eos-dialectic.md)
- [`docs/adr/ADR-0005-layered-tool-binding.md`](docs/adr/ADR-0005-layered-tool-binding.md)
- [`docs/adr/ADR-0006-industry-standards-alignment.md`](docs/adr/ADR-0006-industry-standards-alignment.md)
- [`docs/adr/ADR-0007-plausibility-monitor.md`](docs/adr/ADR-0007-plausibility-monitor.md) — plausibility monitor + capacity model as first-class primitives (new in v0.1)
- [`docs/adr/ADR-0008-l3-native-attainability.md`](docs/adr/ADR-0008-l3-native-attainability.md) — L3 attainable natively by kronos without external attestation (new in v0.1)
- [`docs/adr/ADR-0009-authorization-scope-and-third-party.md`](docs/adr/ADR-0009-authorization-scope-and-third-party.md) — incident-state, chain-of-authorization, prospect-scope (new in v0.1)
- [`docs/adr/ADR-0010-headline-scorecard-comparability.md`](docs/adr/ADR-0010-headline-scorecard-comparability.md) — non-configurable headline + dual-number rendering (new in v0.1)
- [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md) — the founding case study
- [`docs/examples/olympus-616.md`](docs/examples/olympus-616.md) — the flagship reference implementation

To be authored after this design converges:

- `PATENT-DISCLOSURE-DRAFT.md` — the detailed inventive-claim structure for IP counsel
- `WHITE-PAPER.md` — the theory-and-practice narrative with empirical record from the first engagements
- `SOC2-CONTROL-MAPPING.md` — the mapping of scorecard dimensions to SOC 2 control categories
- `docs/alignment/<standard>.md` — per-industry-standard mapping documents; first-priority set: OWASP ASVS 4.0.3, NIST CSF 2.0, NIST AI RMF 1.0, SOC 2 TSC 2017, AWS Well-Architected

**Next step after this document is committed:** the cross-LLM review round-robin continues. v0.1 (this revision) folds in Claude's first-pass review. Next reviewer: ChatGPT-5. Subsequent reviewers: Grok, Gemini. The scribe will produce v0.2, v0.3, v0.4 as feedback arrives and continue iterating until convergence (two consecutive reviewers proposing only cosmetic changes). Then the patent-strategy decision is resolved, the patent disclosure draft is authored (if patent strategy resolves in that direction), and the MVP prototype scaffold begins.
