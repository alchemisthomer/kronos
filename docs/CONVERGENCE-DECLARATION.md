# Kronos v0.5 — Design convergence declaration and implementation-sprint prerequisites

**Date:** 2026-07-24
**Author:** kronos scribe
**Purpose:** Declare the kronos design converged at v0.5 following the initial four-LLM review round (Claude → ChatGPT → Grok → Gemini) and a final convergence pass by each. Freeze the architectural surface. Name what remains for implementation and what remains open for post-MVP.
**Status:** Design frozen. Implementation begins with the first paid engagement against olympus-grid.

---

## Why this document exists

The initial four-LLM review round produced substantive architectural changes across four revision cycles (v0.1 → v0.2 → v0.3 → v0.4). A subsequent convergence pass by the same four reviewers confirmed the design is internally coherent, identified specific consistency defects that this v0.5 commit closes, and flagged a class of concerns that are legitimately implementation-time work rather than design work.

This document exists so that:

- The design is explicitly frozen at v0.5. No further architectural primitives will be added prior to the first implementation prototype shipping.
- The implementation sprint has a clear punch list of work that must precede code deployment.
- Post-MVP concerns are named honestly and deferred with owners rather than left to accumulate silently.
- Subsequent reviewers (should there be any) understand what is being reviewed vs what has already been decided.

## What is converged and frozen

The following architectural surface is frozen at v0.5. Additions require a formal ADR after MVP ships.

**Framework identity (ADR-0001 + ADR-0002):**
Three-layer identity (framework / tools / engagements) mapped to the eos-productization directory pattern (`methodology/`, `runner/`, `oauth-server/`, `actions/`, `templates/`, `docs/`).

**Runtime primitives (ADR-0007 + ADR-0011 + ADR-0012 + ADR-0018):**
Ten object types comprising the canonical typed domain model — Claim, ChallengeSpec, AuthorizedPlan, Engagement, Run, Observation, OracleResult, Finding, EvidenceManifest, ScoreSnapshot — plus RemediationVerification. Ten claim-oriented oracle outcomes. Two peer runtime planes (continuous assurance + engagement). Challenge as parent abstraction with seven subtypes (attack is one).

**Assurance model (ADR-0003 + ADR-0008 + ADR-0010 + ADR-0013):**
Multidimensional scorecard state per cell (maturity + effectiveness + coverage + confidence + freshness + fidelity + open findings + catalog gap). Non-configurable headline over five critical dimensions. Dual-number rendering (pinned + latest). Executive traffic-light view derived from the six-level detail. L3 attainable natively without external attestation.

**Authorization model (ADR-0009 + ADR-0014 + ADR-0016 + ADR-0020):**
Three-axis authorization (impact × environment × executor). Impact-budgeted execution with three policies (passive / impact-bounded / campaign-complete). Incident-state discipline with data-class-preservation. Chain-of-authorization for third parties. Two-tier autonomous authorization (human-signed StandingAuthorization envelope + hardware-backed machine-signed MachineIssuedAuthorization within it). Human co-sign required at impact class ≥ I2. Waived incident-state remains human-only.

**Evidence contract (ADR-0015):**
Two-tier storage (sanitized repository tier + protected raw tier). SLSA-aligned signed evidence manifest. Execution provenance binding artifacts to specific tool invocation. Opt-in disclosure per finding. Chain of custody.

**Tool binding (ADR-0005 + ADR-0017):**
Four layers (typed argv / structured adapter / MCP transport / native). Shell requires explicit high-risk capability. MCP-as-transport with runtime graph validation for tool chaining. Sandbox mandatory by impact class. Signed manifests + hardware-backed credentials preferred. Policy-driven binding resolution.

**Catalog governance (ADR-0019):**
Six lifecycle states (draft / reviewed / active / deprecated / superseded / withdrawn). Applicability predicates. LLM-watcher quarantine (draft-only, zero autonomous writes). Human curator gate for promotion. Community contribution flow with schema validation.

**Standards interoperability (ADR-0006):**
OSCAL import/export as machine-readable substrate (labeled `planned` until implementation lands). OpenCRE as cross-reference backbone. Standards mapping baseline: OWASP ASVS 5.0.0, AISVS 1.0, LLMSVS 2.0, NIST CSF 2.0, NIST AI RMF, MITRE ATT&CK / ATLAS / CAPEC / CWE / CVE.

**Ethics + IP posture:**
Dual-use framework with structural authorization discipline. AGPL v3 license. Patent-strategy decision deferred to IP counsel review; hybrid framing preserved. Novelty language qualified with acknowledged prior art (NIST SP 800-115, MITRE CALDERA, Atomic Red Team, BAS platforms, ATT&CK scoring, OSCAL, SLSA).

## MVP sequencing decision

Per multiple reviewers' feedback and the GTM sanity-check's recommendation, the MVP sequencing decision is:

**Engine-first. Runner second. Continuous plane third. UI surface last.**

Concrete order for the first implementation prototype:

1. Typed JSON schemas for the domain-model objects.
2. Local coordinator / CLI that reads and writes typed objects to git.
3. Independent authorization policy engine (verifies StandingAuthorization + MachineIssuedAuthorization envelopes).
4. Impact-budget watchdog (independent process; fail-closed on telemetry loss).
5. One typed HTTP/AWS executor (no shell).
6. Deterministic attack-oracle engine with the ten claim-oriented outcomes.
7. Evidence manifest writer with SLSA-style provenance + two-tier storage adapter.
8. Cleanup verifier.
9. First engagement executed by hand using the above kernel — Reference Engagement A (olympus-grid L14 attacker-owned CloudFront, expected PASS).
10. Static Markdown/HTML report generator.
11. Claim-level scorecard projection.
12. React runner (only after 1-11 close).
13. OAuth server + collaboration workflows.
14. Continuous assurance plane coordinator.
15. Additional tool adapters + MCP compatibility.
16. Production-capable execution only after independent safety review.

**Rejected alternative:** UI-first (Grok's initial preference). Rejected because a polished UI backed by an incomplete domain model teaches adopters the wrong architecture — the specific failure mode ChatGPT flagged in the "two versions of kronos" finding. UI is built as a projection of the engine, not the other way around.

This decision is recorded. Later reviewers should not reopen it absent a specific new argument.

## Implementation-sprint prerequisites (must land before code deployment)

The following work is legitimately implementation-time hardening. Attempting to solve it in design would either turn design into code (wrong artifact) or defer implementation indefinitely (wrong optimization). Named here so the implementation sprint has a punch list rather than discovering these mid-flight.

### Priority 1 — Foundational (before first executor runs)

1. **Domain-model JSON schemas.** DOMAIN-MODEL.md specifies the shape; schemas do not exist yet. Compile schemas, generate example valid/invalid documents, add referential-integrity validation. Object count in the doc says "ten" but names eleven; resolve.
2. **Finding taxonomy refinement.** ChatGPT correctly noted the single "Finding" object conflates target defects, assurance gaps, framework issues, safety events, and operational events. Split into distinct schemas before the runtime uses them:
   - **TargetFinding** — demonstrated defect in the target.
   - **AssuranceGap** — stale evidence, unknown state, unevaluated claim, insufficient observability coverage.
   - **FrameworkIssue** — defect in kronos itself (tool bug, catalog bug, oracle bug).
   - **SafetyEvent** — watchdog halt, budget breach, revocation, cleanup failure.
   - **OperationalEvent** — ordinary lifecycle and health information.
3. **Plausibility-monitor unit-safety.** PLAUSIBILITY-MONITOR.md formulas need: unit-aware quantities, provider SKU / usage-type granularity, explicit bound kinds (physical / quota / configured / economic / statistical), region and account scope, price/quota source versioning with effective dates, confidence intervals, model-completeness gates (incomplete model → assurance gap, not "impossible"), golden fixtures (normal + incident), property-based dimensional tests. The v0 formula mapping aggregate EC2-Other cost to NAT throughput is a starting sketch, not production math.
4. **Autonomous-authorization hardening.** ADR-0020 model is directionally correct. Missing implementation controls: exact nonce binding per run, plan digest binding, standing-authorization digest binding, target snapshot binding, challenge version binding, tool digest binding, time window enforcement, run count enforcement, execution environment binding, revocation checkpoint semantics, independent policy decision point (not colocated with executor). Broad StandingAuthorization scopes must not implicitly authorize future catalog additions — new catalog entries require re-consent.
5. **Executable authorization revocation.** Revocation channel must be reachable from the executor at check-time with bounded latency. Define the latency SLO. Define behavior when the channel is unreachable (fail-closed).

### Priority 2 — Before first customer engagement

6. **OAuth server security hardening.** OAuth server plan lacks state parameter enforcement, PKCE with S256, exact redirect URI validation, session binding, CSRF controls, rate limiting, token-storage policy, refresh-token rotation, and log-redaction requirements. All must land before deployment.
7. **Tool-binding contract deduplication.** TOOL-BINDING.md contains corrected AND superseded contracts in adjacent sections (typed argv AND shell examples, policy-based AND lexicographic selection, brokered AND env-var credentials, immutable digest AND mutable image tags). Remove the superseded halves.
8. **Evidence-tier interaction with Salesforce backbone.** EVIDENCE.md specifies two-tier storage abstractly. For adopters using Salesforce as backbone (per the reference implementation): decide whether raw evidence artifacts store via Salesforce Files (ContentVersion), external objects (Salesforce Connect), or strictly off-platform with only hashes on the backbone. Auditors will scrutinize this heavily during managed-package security review.
9. **Consulting-operations prerequisites.** Before the first paid engagement: standard authorization + ROE language, MSA + SOW templates, evidence-classification and retention rules, data-processing terms, credential-handling process, professional and cyber-liability insurance, incident and stop procedures, non-certification language. This is product, not administrative overhead.

### Priority 3 — Before self-service SaaS

10. **Standards alignment implementation.** OSCAL import/export is labeled `planned`. Ships when actual import/export runs against conformance fixtures.
11. **Community-contribution flow.** CATALOG.md describes the flow abstractly. Concrete: pull-request template, golden-target repository, curator-review SLA, signing infrastructure, contributor agreement (addressing IP posture per the deferred patent-strategy decision).
12. **Scorecard visualization implementation.** SCORECARD.md specifies renderings. Actual React component that matches the ASCII examples exactly must ship in the runner.
13. **Dynamic Salesforce capacity inference.** Static YAML capacity bounds are dangerous for Salesforce targets whose governor limits shift by allocation. Layer-3 native adapter polls the Salesforce Limits REST API dynamically to keep capacity model current.

## Known consistency defects addressed in v0.5

The following defects were identified in the convergence-round reviews and closed in this v0.5 commit:

- **README stale claims** — removed "seven novel properties … not present in any prior methodology" absolute claim; removed public-by-default finding language; fixed link from renamed `SEVEN-CLAIMS.md` to `INVENTIVE-CONCEPT-CANDIDATES.md`.
- **INVENTIVE-CONCEPT-CANDIDATES body-preamble contradiction** — body rewritten to match preamble; each of the seven candidate concepts qualified with acknowledged prior-art references; the "no prior methodology" language removed; specific-conjunction claim added per Grok recommendation.
- **GTM sanity-check greenfield error** — addendum added acknowledging active competitors (CheckVibe, Vibe App Scanner, VibeEval, Scanbee, Lovable Security, Replit Security Center, StackHawk Vibe, Aikido); positioning refined to "independent release-assurance layer for AI-built applications"; six launch gates specified; Kronos Preflight vs Kronos Launch Review distinction; revised pricing hypothesis; "naive builder" term retired.
- **DESIGN.md v0.5 header** — added convergence declaration; MVP sequencing decision recorded; v0.5 change-log.
- **SCORECARD.md executive projection mandate** — single default projection specified (traffic-light on five critical + pinned/latest headline; multi-axis detail behind drill-down).
- **Day-of-week error** — 2026-07-17 was a Friday, not Sunday. Fixed in founding-incident narrative.
- **Stale references** — global pass fixed SEVEN-CLAIMS.md references, ASVS 4.0.3 references, and duplicate-template consistency.

## Known defects deferred to implementation

The following defects are named but not fully solved in this v0.5 commit. Each has an owner in the implementation-sprint punch list above.

- Full "two versions of kronos" reconciliation between typed-domain-model documents and adoption-facing documents (README, operating manual, engagement templates). Adoption-facing documents mark v0 patterns as superseded where they persist. Full rewrite of adopter surface happens as part of implementation-sprint Priority 1 work.
- Duplicate `methodology/TEMPLATE.md` and `templates/engagement/TEMPLATE.md`. Preserved in v0.5 with a superseded-in-v0.2 note; formal archival to `docs/history/v0/` happens in the implementation sprint.
- OAuth server security prerequisites (Priority 2).
- Autonomous-authorization implementation controls (Priority 1).
- Plausibility-monitor formula unit-safety (Priority 1).
- Finding-taxonomy refinement (Priority 1).

## What is genuinely open

The following questions were flagged across the review rounds and remain genuinely open. Each carries a note about what would close it.

- **Patent strategy** — deferred to operator + IP counsel review. Closed by an IP-counsel engagement.
- **Community-contribution governance body** — small curator team initially (the operator). Closed when adoption warrants a nominated review board.
- **LLM-watcher curator-verification protocol depth** — conceptually resolved; full specification deferred to a subsequent methodology addition after implementation surfaces which verification patterns actually work.
- **Multi-persona runtime evaluation runtime contract** — OPERATING-MANUAL specifies the pattern with guardrails. Concrete runtime contract (how personas are invoked, how their outputs feed the domain model, how their provenance is captured) closes when the first multi-persona engagement runs.
- **Auto-remediation webhook / event-bus primitive** (Gemini) — the framework emits findings; downstream consumption by an automated remediation pipeline is architecturally supported but not specified. Closes when the first target's remediation pipeline integrates.
- **Kronos self-dogfooding** — the framework will evaluate itself. Closes when the first kronos-vs-kronos engagement completes.

## Signature on the freeze

The design at v0.5 is frozen for the purpose of driving the first implementation prototype and the first paid engagement against olympus-grid.

Additions to the framework's architectural surface after this point require:

1. A new ADR authored against the frozen v0.5 baseline.
2. Explicit statement of what new primitive or contract is being added and why.
3. Cross-check against the implementation-sprint prerequisites above — if the addition duplicates or contradicts a prerequisite, the prerequisite resolves first.
4. Operator sign-off before the ADR moves from proposed to accepted.

Cosmetic corrections, consistency fixes, prior-art acknowledgments, and language refinements are permitted without ADRs.

The next artifact after this document is not another review. It is engagement `olympus-grid.kronos-1.md` in `foundation/kronos/engagement/00_scope/`.
