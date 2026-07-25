# Canonical domain model

> Markdown is the human projection. Versioned typed schemas are the source of truth. Each domain object has its own file, its own lifecycle, and its own signature envelope.

## Purpose

The v0 design used a single engagement markdown file as the canonical representation of the entire engagement lifecycle — target scope, authorization, plan, execution log, findings, scorecard delta, and closeout all in one document that moved through kanban folders. ChatGPT's cross-LLM review flagged this in P0-5 as a load-bearing shortcut that conflated authorization, mutable execution state, immutable runs, and durable findings.

The v0.2 architecture separates these concerns. The engagement markdown file remains the human governance artifact — the operator's reading experience for one engagement — but it is a **projection** of the canonical domain model, not the model itself.

## Domain objects

The canonical domain model contains ten object types, each with a versioned JSON Schema (or equivalent typed schema) defining its structure. Each object is versioned independently and each has its own signature envelope where signing is required.

### Claim

A statement about the target that can be tested. Claims are the atomic units of assurance: each represents one testable proposition about the target's behavior or state.

- Stable identifier (`CLAIM-<target>-<dimension>-<slug>`).
- Version — claims evolve; older versions remain readable.
- Owner — the party responsible for maintaining the claim.
- Testable predicate — the specific condition that must hold.
- Applicable environments — production, staging, both.
- Related catalog entries — which threat-catalog entries evaluate this claim.
- Related industry-standard controls — OpenCRE, OSCAL, ASVS, AISVS, NIST CSF, MITRE ATT&CK IDs.
- Prior falsifications — history of times this claim was falsified and re-established.

Claims live at `<target>/kronos/claims/<claim-id>.yaml`.

### ChallengeSpec

The specification of a challenge that can be executed against a target's claims. Challenges are versioned; a challenge spec at version 1.2 is a specific artifact whose behavior is fixed.

- Identifier and version.
- Challenge type — one of the seven types defined in CONTINUOUS-ASSURANCE.md.
- Applicable target types and applicability predicates.
- Preconditions.
- Impact class (I0–I4).
- Required capabilities (references tool manifest capabilities).
- Expected observables (references oracle templates).
- False-positive and false-negative notes.
- Cleanup requirements.
- Source provenance.
- External mappings (ATT&CK, CAPEC, CWE).
- Signature envelope (from catalog governance).

Challenge specs live in the catalog at `catalog/challenges/<challenge-id>-v<version>.yaml`.

### AuthorizedPlan

The materialization of a challenge spec against a specific target, under a specific authorization. Distinct from the challenge spec (reusable) and the run (immutable execution record).

- Plan identifier.
- Engagement identifier (parent).
- Referenced challenge spec (by ID + version).
- Concrete parameters (target endpoints, payloads, cadence, timing).
- Authorization envelope (see below).
- Impact budget (see IMPACT-BUDGET-EXECUTION.md).
- Preflight validation status.
- Approval signature.

Plans live at `<target>/kronos/engagements/<engagement-id>/plans/<plan-id>.yaml`.

### Engagement

The durable authorization envelope for a set of related plans and runs.

- Engagement identifier.
- Target reference.
- Purpose statement.
- Threat model class.
- Scope declaration.
- Rules of engagement.
- Approver identity.
- Time window (notBefore / expiresAt).
- Emergency contact + stop mechanism + revocation channel.
- Referenced plans (child objects).
- Terminal state (see below).

Engagements live at `<target>/kronos/engagements/<engagement-id>/engagement.yaml`. The authorization payload is stored separately as `authorization.sig.json` and signed independently of any mutable engagement content.

### Run

An immutable record of one plan's execution against one target.

- Run identifier.
- Plan reference.
- Executor identity (operator + runner + tool digest).
- Timestamps (startedAt, completedAt, clockSource).
- Impact budget consumption (final).
- Reason for termination (see terminal states below).

Runs live at `<target>/kronos/engagements/<engagement-id>/runs/<run-id>/run.json`. Runs are append-only; a run is written once and never modified.

### Observation

A raw signal captured during a run. Multiple observations may be captured per run.

- Observation identifier.
- Run reference.
- Source (tool output, telemetry, log, database query result).
- Timestamp.
- Raw content (or reference to protected-tier storage if sensitive).
- Content hash (SHA-256).
- Classification (public / redacted / protected).

Observations live at `<target>/kronos/engagements/<engagement-id>/runs/<run-id>/observations/<observation-id>.json`.

### OracleResult

The deterministic evaluation of a run's observations against the challenge's expected criteria.

- Oracle result identifier.
- Run reference.
- Observations evaluated.
- Oracle template referenced (from the challenge spec).
- Assertions and their results.
- Verdict — one of the ten outcomes defined in ORACLE.md (`CLAIM_SURVIVED`, `CLAIM_FALSIFIED`, `PARTIAL_OR_DEGRADED`, `INCONCLUSIVE`, `OBSERVABILITY_GAP`, `INVALID_TEST`, `EXECUTION_ERROR`, `BLOCKED`, `HALTED_SAFETY`, `NOT_RUN`).
- Confidence.
- Narrative explanation (optional; AI-generated permitted; does not affect verdict).

Oracle results live at `<target>/kronos/engagements/<engagement-id>/runs/<run-id>/oracle-result.json`.

### Finding

A durable assertion of a defense failure, plausibility violation, or observability gap. Findings outlive runs and have their own lifecycle.

- Finding identifier (stable, deduplicating across engagements of the same target).
- Source (`engagement:<id>:run:<id>` or `continuous-plane:<evaluation-id>`).
- Severity (derived from impact + exploitability + reachable assets + compensating controls + data/privilege impact + business consequence, per ChatGPT P0 reference-engagement review; NOT fixed by attack success alone).
- Affected claim(s).
- Reproduction instructions.
- Referenced evidence manifest.
- Suggested remediation.
- Current lifecycle state (`open`, `accepted`, `remediation-in-progress`, `awaiting-reverification`, `resolved`, `resolved-superseded`, `risk-accepted`, `false-positive`, `withdrawn`).
- Assigned owner.
- Disclosure state (`private`, `embargoed`, `public`, `withdrawn`).
- Auto-filed eos backlog cycle reference (if eos co-installed).

Findings live at `<target>/kronos/findings/<finding-id>.yaml`.

### EvidenceManifest

The signed manifest of a run's evidence artifacts. See EVIDENCE.md for the full manifest schema and two-tier storage model.

- Manifest identifier.
- Run reference.
- Authorization digest.
- Plan digest.
- Executor identity, tool digest, adapter digest.
- Target snapshot digest.
- Artifact list (each with content hash, storage tier reference, classification, redaction status).
- Cleanup result.
- Signature envelope.

Evidence manifests live at `<target>/kronos/engagements/<engagement-id>/runs/<run-id>/evidence-manifest.json`.

### ScoreSnapshot

A point-in-time snapshot of the target's scorecard. Multiple snapshots may exist per target; the scorecard's rendered state is derived from the most recent snapshot plus post-snapshot findings.

- Snapshot identifier.
- Timestamp.
- Catalog version at snapshot time.
- Score model version at snapshot time.
- Per-dimension state (maturity, effectiveness, coverage, confidence, freshness, environment fidelity, open findings, applicable catalog gap).
- Headline number (minimum-across-critical-dimensions).
- Trigger event (engagement close, continuous-plane finding, catalog bump, manual snapshot).

Score snapshots live at `<target>/kronos/scorecards/<timestamp>.json`.

### RemediationVerification

The record of a re-verification of a previously-falsified claim after remediation.

- Verification identifier.
- Original finding reference.
- Re-verification engagement / run reference.
- Verdict (whether the finding is closed by this verification).

Remediation verifications live at `<target>/kronos/engagements/<engagement-id>/verifications/<verification-id>.yaml`.

## Terminal states

Engagements and runs both have explicit terminal states. The v0 design used only implicit "shipped" vs "aborted" states; ChatGPT correctly flagged this as ambiguous (does first-signal-stop count as shipped or aborted?).

The v0.2 terminal states for engagements and runs are:

- **`completed-no-falsification`** — the engagement ran to completion; all challenges either passed or produced non-critical findings; scorecard updated positively.
- **`completed-with-findings`** — the engagement ran to completion; one or more findings were emitted at various severities; scorecard updated to reflect findings.
- **`completed-partial`** — the engagement ran to plan but not all planned challenges executed; scorecard partially updated with explicit "unevaluated" notation for skipped challenges.
- **`halted-safety`** — impact budget was exceeded, or safety-boundary breach detected; engagement halted before completing; findings-to-date preserved.
- **`blocked-prerequisite`** — a required prerequisite (tool availability, target readiness, authorization prerequisite) was not met; no challenges executed.
- **`expired-authorization`** — the engagement's authorization time window closed before challenges completed; findings-to-date preserved.
- **`cancelled`** — the operator or approver revoked authorization; engagement stopped without completing.
- **`inconclusive-review-required`** — one or more oracles returned INCONCLUSIVE or OBSERVABILITY_GAP; human review required before scorecard is updated.
- **`execution-failed`** — the framework itself failed (runner crash, evidence storage failure); engagement did not complete; the failure is itself a framework-level finding.

Each terminal state has different downstream effects on the scorecard, on eos backlog auto-filing, and on the target's disclosure obligations.

## Signature envelopes

Different domain objects require different signature envelopes. The v0 design's practice of signing a single markdown file that combined authorization and mutable execution content is superseded.

- **Authorization** is signed once, by the approver, at engagement authorization time. The signed payload is `authorization.sig.json` containing the approver identity, target scope, ROE, time window, and impact ceiling. This signature does not become invalid when mutable engagement content is edited later.
- **Plan** is signed once, at plan approval, by the approver. Plan signature covers the specific challenge spec + version + parameters + impact budget.
- **Run** is signed once, at run completion, by the runner. Run signature covers the immutable run record (executor identity, timestamps, terminal state).
- **Evidence manifest** is signed once, at manifest finalization, by the runner. Signature covers all evidence artifact hashes plus provenance.
- **Score snapshot** is signed once, at snapshot generation, by the framework. Signature covers the snapshot's per-dimension state.
- **Finding** is signed at each state transition, by the party effecting the transition (typically the operator on accept, the remediator on resolve).

Multiple signatures may be required for the same object (e.g., an authorization with `signedSober: false` requires an additional signature to waive data-class preservation, per ADR-0009).

## Human projection

Despite the typed schemas being the source of truth, adopters primarily interact with the framework via markdown files. The runner renders:

- **Per-engagement view** — a markdown-formatted rendering of the engagement + its plans + its runs + its findings + its scorecard delta, all derived from the typed schemas.
- **Per-target view** — the scorecard + open findings + engagement history + continuous-plane findings.
- **Per-finding view** — the finding record + reproduction + evidence-manifest excerpts + remediation history.

The markdown views are convenient but not authoritative. When markdown and typed schemas disagree, the typed schemas win. Markdown-authored engagement documents (the pre-v0.2 pattern) are automatically converted to typed schemas at commit time by a framework action.

## Migration from v0

Targets that adopted the v0 markdown-only pattern do not need to rewrite existing engagement documents. The v0.2 framework provides a `migrate-v0` action that:

1. Reads the target's `<target>/kronos/engagement/06_shipped/*.md` documents.
2. Extracts sections corresponding to each v0.2 domain object.
3. Writes the corresponding typed schemas at their canonical paths.
4. Preserves the original markdown as `<target>/kronos/engagement/06_shipped/*.md.v0-original` for provenance.

The typed schemas become the source of truth from the point of migration forward.

## Schema evolution

Each domain object's schema is versioned. Schema changes follow semantic versioning:

- **Patch** — backward-compatible field additions or clarifications. No target-side action required.
- **Minor** — backward-compatible field additions that affect scoring. Targets receive advance notice per the catalog-governance window.
- **Major** — breaking changes. Requires explicit target-side migration; historical objects at prior versions remain readable.

Schema versions are pinned per-target in `<target>/kronos/target.yaml`. Targets may hold at older schema versions; the runner renders both current and pinned versions and flags the delta.

## What this replaces

- The v0 pattern of one markdown file per engagement carrying all state.
- The implicit binary "shipped vs aborted" terminal-state model.
- The practice of signing markdown containing both authorization and mutable content.
- The pattern of engagement-scoped evidence storage without a signed manifest.

The kanban folder pattern (`00_scope/` through `07_aborted/`) is preserved as a **workflow view** but is no longer the framework's state machine. Engagement terminal state is determined by the typed `engagement.terminal_state` field, not by folder location. The runner may render engagements grouped by kanban stage for continuity with v0 muscle memory, but folder placement is no longer authoritative.
