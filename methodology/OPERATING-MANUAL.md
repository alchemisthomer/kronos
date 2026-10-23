# Operating manual — the kronos engagement discipline

> Every claim a system makes about itself is false until kronos has been unable to falsify it.

## What kronos is

**kronos** is a discipline for proving that software is safe to run — through structured, authorized, evidence-preserving attempts to break it. It works on any target system, in any language, on any runtime, at any deployment surface. A project adopts kronos by copying a small folder tree into its repository and running the discipline:

- Every meaningful adversarial evaluation of a system is one **engagement**.
- An engagement lives in a single markdown document that travels through a kanban of folders: `00_scope/` → `01_authorized/` → `02_planning/` → `03_ready/` → `04_running/` → `05_evidence/` → `06_shipped/`, with `07_aborted/` for engagements that never close.
- The document has two halves. A **governance half** — target boundary, authorization artifact, rules of engagement, and the human approver's sign-off gate. And an **execution half** — the threat models under test, the attack scenarios, the oracles, the evidence collected, the findings, and the scorecard delta.
- The engagement **closes** only when every planned attack has run, every oracle has evaluated, every finding has been written, and the scorecard has been updated in the target's repository.

The discipline is intentionally folder-and-file-based. It works with `git` on any host, doesn't require a database or a runtime service to persist findings, and can be adopted by any team without adopting any framework's stack choices.

## Why engagements are governance artifacts

An engagement is not a scan. It is not a pen test report. It is a **governance artifact** — a durable, version-controlled record of the adversarial pressure that was authorized, the attacks that were executed, the evidence that was collected, and the findings that resulted.

Under any governance model — a solo operator, a security engineering team, a board-approved security committee — the engagement document is where the authorization is granted, the attacks are executed, the evidence is retained, and the readiness posture is updated. It is what an auditor reads to reconstruct why an attack was permitted, what it attempted, and what the system did in response.

**The engagement as rate limiter for adversarial velocity.** AI can generate attack code at velocities that outpace human oversight — a modestly sophisticated LLM can propose thousands of novel attack variants per hour against any given system. Without governance, that velocity becomes chaos: unauthorized probes against production, findings that lack reproducibility, evidence that never touches persistent storage, false positives that erode trust in the discipline. The kronos engagement is the metronome against that chaos.

Four rules make the metronome work:

1. **One scope per engagement** — one target, one threat model class, one mode. Broader coverage is achieved by many engagements, not one giant engagement.
2. **Authorization gate is non-negotiable** — the framework does not fire a single active probe without a signed authorization artifact naming target, scope, ROE, timeframe, and stop mechanism.
3. **Evidence lands before any finding is asserted** — an attack that produces "the defense failed" without producing the request/response/telemetry evidence chain is not a finding; it is a hypothesis.
4. **Scorecard updates are atomic with findings** — every finding writes a corresponding scorecard delta in the same commit. The scorecard and the evidence never drift apart.

## The presumption of failure

The philosophical inversion vs attestation frameworks is deliberate and load-bearing.

An attestation framework (such as eos) begins from the presumption that a system's claims about itself are likely correct, and requires positive evidence to close each claim. The evidence is confirmatory: "here is the trace that shows the system did what it said it would." This is the correct discipline for building consensus that a system is *ready*.

Kronos begins from the opposite presumption: every claim a system makes about itself is FALSE until kronos has been unable to falsify it via bounded adversarial attack. The evidence is disconfirmatory: "here are the attacks we ran, and here is the evidence that they did or did not succeed." A claim is not "verified" by kronos; it is "not yet falsified by the current threat catalog." This is the correct discipline for finding *reasons not to ship*.

Neither discipline is complete alone. A system that has been eos-attested but never kronos-challenged is a system whose claims are internally consistent but empirically untested against adversarial pressure. A system that has been kronos-challenged but never eos-attested is a system whose defenses may hold today but has no coherent statement of what it is defending. Together, the two frameworks form the epistemic backbone of readiness proof: eos states what the system does; kronos challenges the statement; the loop closes only when both frameworks agree.

Kronos operates independently. It does not require eos to be present. When both are present in the same target, they integrate: a kronos finding that falsifies an eos-attested claim auto-files a new backlog cycle in the eos kanban.

## Attack modes

Kronos supports many modes of adversarial evaluation. Each mode has its own authorization ceiling, rules of engagement, environment discipline, and finding shape.

| Mode | Description | Default environment | Default authorization ceiling |
|---|---|---|---|
| **Red team** | White-box adversarial simulation with full knowledge of the target (source, architecture, credentials) | Test / staging | Signed authorization, destructive testing enabled |
| **Black-box pentest** | Endpoint-only with no prior knowledge; simulates external unauthenticated attacker | Prod (first-signal-stop) or test | Signed authorization, active but non-destructive |
| **Gray-box** | Limited prior knowledge (public docs, sample credentials) | Prod (first-signal-stop) or test | Signed authorization, active but non-destructive |
| **Assertion harness** | Verify that specific designed defenses fire when their diagnostic attack is executed | Test / staging | Signed authorization, active |
| **Destructive load** | DoS, resource exhaustion, cost-blast — bring the system down or make it expensive | Test / staging ONLY | Signed authorization with destructive testing explicitly enabled |
| **Data pollution** | Feed the system malformed data at scale; watch for silent corruption or downstream propagation | Test / staging ONLY | Signed authorization with destructive testing explicitly enabled |
| **Backend flooding** | Flood downstream systems (databases, external APIs, third-party services) through the target | Test / staging ONLY | Signed authorization with destructive testing explicitly enabled |
| **Social engineering** | Phishing, pretexting, credential recovery abuse against human targets in scope | Case-by-case | Signed authorization from every human target's employer of record |
| **Supply chain** | Inject malicious dependencies, compromised container images, or tampered CI artifacts | Isolated test only | Signed authorization with explicit supply-chain scope |
| **Insider simulation** | Simulate a former employee, disgruntled current employee, or compromised administrator | Isolated test only | Signed authorization with explicit insider-scope acknowledgment |
| **Cost adversarial** | Attempt to inflate the target's cloud bill from outside via legal traffic patterns | Prod (first-signal-stop) or test | Signed authorization; sub-mode within destructive load |
| **Compliance drift** | Detect divergence between the target's declared compliance posture and its actual runtime configuration | Prod (read-only) or test | Signed authorization, passive only |
| **Recovery adversarial** | Attack the target's recovery mechanisms specifically — break the kill switch, break the rollback, break the alert | Test / staging ONLY | Signed authorization with destructive testing enabled |

Modes are additive within an engagement's scope declaration. An engagement may specify "red team + cost adversarial" against a target, and the engagement's authorization ceiling is the max of both modes' ceilings.

## Environment discipline — production is in-scope

A common assumption in adversarial testing is that production is off-limits. Kronos rejects this assumption. Production is where the system's defenses actually matter; a defensive posture that has never been tested against production adversarial pressure is a defensive posture whose claims are unfounded.

Two engagement modes govern production testing:

- **`first-signal-stop`** — the engagement proceeds until it produces the first finding at-or-above the engagement's declared severity threshold, at which point the engagement immediately stops, writes the finding, alerts the designated contact of record, and closes. Findings below threshold are recorded but do not halt execution. INCONCLUSIVE oracle verdicts do not halt (they are not findings). Attack matrices in this mode must be severity-ordered so that "stop early" means "stop on the worst thing reached," not "stop on the first thing tried." (This definition supersedes the v0 semantics per ADR-0010 and Claude review P2-1.)
- **`go-to-town`** — the engagement continues attacking until either the planned scenario matrix is exhausted, the rate ceilings are hit, or the authorization time window closes. This is the correct posture for isolated test environments where continued attack surfaces more findings without operational risk.

The default for production engagements is `first-signal-stop` with a severity threshold of `critical` (highest reasonable threshold, guaranteeing that the engagement stops only when a critical exposure has been demonstrated). Any escalation to `go-to-town` in a production environment requires a signed authorization artifact that explicitly enables destructive testing and names the operator of record as accountable for the operational consequences.

### Incident-state authorization

Per ADR-0009, the authorization artifact recognizes a distinct incident-state that changes the framework's tool-invocation gate behavior. When `incidentState.declared: true`:

- **`dataClassPreservation: enforced`** — the framework structurally refuses to invoke any tool whose declared `resource_classes_affected` intersects the engagement's enumerated `dataClassResources` (persistent storage, identity records, DNS records, audit logs, encryption keys by default). This is the founding-incident lesson made structural: under declared incident, data-class resources are protected regardless of the operator's authorization or the tool's declared capabilities.
- **`signedSober: false`** — the framework refuses tools at authorization ceiling ≥ 3 (destructive testing). Duress-signed authorizations do not unlock destructive modes.

The `dataClassPreservation: waived` mode requires an additional signature beyond the standard approver signature — designed to make the "sign it in the middle of a panic to waive the preservation" path expensive enough to prevent operator error under duress.

### Prospect-scope free assessment

Per ADR-0009, "point kronos at a prospective customer's production system" without prior authorization is not supported. The commercial free-assessment flow is onboarding-gated: the prospect enrolls their target, signs a single-scope authorization artifact (safety ceiling 1, first-signal-stop with critical or high threshold, 24-hour duration), and only after signature does the assessment run. The barrier is a single-page authorization signed during enrollment — lower friction than a traditional pen-testing contract, but structurally an authorization.

The framework's `production-authorization-guard` action refuses any engagement targeting a third-party production environment without a valid prospect-scope authorization artifact.

Passive modes (compliance drift, read-only observation) may run in production without either mode declaration, subject to rate ceilings.

## Kanban folder structure

```
kronos/engagement/
├── README.md                     ← this operating manual, copied into the adopting project
├── TEMPLATE.md                   ← empty scaffold; copy when starting a new engagement
├── SCORECARD.md                  ← the target's current maturity posture; rendered from the shipped engagements
├── 00_scope/                     ← engagement declared but not authorized
├── 01_authorized/                ← auth artifact signed; ROE locked
├── 02_planning/                  ← target model + scenarios being written
├── 03_ready/                     ← scenarios validated; ready to execute
├── 04_running/                   ← attacks in flight
├── 05_evidence/                  ← evidence collected; oracle evaluating
├── 06_shipped/                   ← findings written; scorecard updated; append-only history
└── 07_aborted/                   ← stopped early (first-signal-stop hit, ROE violation, auth expired)
```

Movement between folders is `git mv` only — preserves history. Commit message convention:

```
chore(kronos): move <filename> from <source-stage> to <target-stage>
```

## The document's two halves

Every kronos engagement lives in **one markdown file** that travels through the kanban folders above as the work progresses.

**File naming convention:** `<target-slug>.kronos-<N>.md` where `<target-slug>` is a short identifier for the target under evaluation and `<N>` is the ordinal engagement against that target. Example: for the first engagement against olympus-grid, the file is `olympus-grid.kronos-1.md`. The next engagement against the same target is `olympus-grid.kronos-2.md`. Engagements against different targets number independently.

**Sub-engagement form.** When an engagement's subject matter is a recursive verification of a prior engagement — retesting a defense whose prior finding was remediated — the engagement takes the form `<target-slug>.kronos-<N>.<M>.md`. The `.<M>` slot is reserved for follow-up verification of engagement N.

### Top half — approver-authored (the governance)

1. **Target boundary** — which system, which surfaces, which credentials in scope, everything else explicitly out
2. **Authorization artifact** — signed record naming approver, timeframe, rate ceilings, destructive-testing permission, emergency contact, stop mechanism
3. **Rules of engagement** — modes enabled, environment (prod / staging / isolated test), first-signal-stop or go-to-town, retention policy for evidence
4. **Threat model class** — which threat catalog entries are in scope for this engagement
5. **Approver sign-off gate** — explicit checkboxes the approver ticks to unlock execution

### Bottom half — agent-authored (the execution)

6. **Target model** — architecture graph, trust boundaries, declared defenses (may reference an eos attestation for these if eos is present)
7. **Attack matrix** — for each threat-class × claim pair, the specific diagnostic attack that will be executed
8. **Oracles** — for each attack, the observable signals that determine pass or fail; deterministic assertions only
9. **Execution log** — ordered record of attacks run, with timing, request/response evidence, and oracle evaluations
10. **Findings** — every case in which an oracle evaluated to a failure state; each finding contains reproduction instructions, evidence hashes, severity, and remediation suggestions
11. **Scorecard delta** — which dimensions of the target's scorecard change state as a result of this engagement, and by how much
12. **Eos integration** — if eos is co-installed in the target, any findings that falsify a prior eos attestation are listed here with pointers to the auto-filed backlog cycles
13. **Closeout** — what was tested, what was skipped and why, what surprised, what feedback emerged for future engagements

## Lifecycle

```
   ┌─────────────────────────────────────────────────────────────────┐
   │  Operator identifies target and scope; drops engagement doc in │
   │  00_scope/, writes §1 (target boundary)                        │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  authorization artifact signed
   ┌─────────────────────────────────────────────────────────────────┐
   │  git mv 01_authorized/; §2-§4 (auth, ROE, threat class) locked │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  git mv to 02_planning/
   ┌─────────────────────────────────────────────────────────────────┐
   │  Agent decomposes §6-§8 (target model, attack matrix, oracles) │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  git mv to 03_ready/ (§5 signed)
   ┌─────────────────────────────────────────────────────────────────┐
   │  Approver signs §5; engagement ready to execute                │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  git mv to 04_running/
   ┌─────────────────────────────────────────────────────────────────┐
   │  Agent executes §7 attack matrix; writes §9 execution log      │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  git mv to 05_evidence/
   ┌─────────────────────────────────────────────────────────────────┐
   │  Oracles evaluate §9 evidence; §10 findings drafted            │
   └────────────────────────────┬────────────────────────────────────┘
                                ▼  git mv to 06_shipped/
   ┌─────────────────────────────────────────────────────────────────┐
   │  §11 scorecard delta committed; §13 closeout written; doc      │
   │  becomes append-only. Findings visible in scorecard rendering. │
   └─────────────────────────────────────────────────────────────────┘
```

## Operating principles

- **Presumption of failure.** Every claim about the target is FALSE until kronos has been unable to falsify it via a bounded, authorized attack. "No findings" is never "the system is safe." It is "the system is not yet broken by the current threat catalog."
- **One scope per engagement.** Bundle related attacks under one threat class against one target surface. Broader coverage is many engagements, not one engagement of unbounded scope.
- **Authorization before execution.** No active probe runs without the signed authorization artifact. The framework refuses to execute; this is a structural gate, not a policy suggestion.
- **Evidence is not optional.** Every finding requires reproducible evidence — request, response, telemetry, timing — committed to the repository alongside the finding markdown. A finding without evidence is a hypothesis.
- **Scorecard is the artifact of record.** The scorecard delta is committed atomically with every finding. The scorecard is what an executive reads; the findings are what an engineer reads; both point to the same evidence.
- **Prod is in-scope, with mode discipline.** `first-signal-stop` for prod and unfamiliar targets; `go-to-town` for isolated test environments. Escalating to `go-to-town` in prod requires a specific authorization.
- **Do not commit or push without explicit approver authorization when working under a shared engagement.** Stage, verify, report.
- **The engagement document is the contract.** If reality diverges from the plan (a new attack emerges, an oracle changes, an authorization scope narrows), the document moves first.

## Attack surface is dimensional

An engagement's attack matrix is NOT fixed at "one attack per claim." It is dimensional:

- **Broad × shallow** — sweep many threat classes against a target with one diagnostic attack per class. Yields wide coverage; low depth per class.
- **Narrow × deep** — pick one threat class and enumerate many attack variants against every plausible entry point. Yields deep evidence for that class; leaves other classes untested.
- **Compound** — chain multiple attacks across multiple classes to simulate realistic adversary behavior (e.g., a supply-chain compromise that enables a credential exfiltration that enables a destructive backend flood).

The single-scope-per-engagement rule still applies at the engagement level — the engagement declares its dimension explicitly, and the attack matrix executes within it.

## The growth engine

The kronos threat catalog is expected to grow monotonically over time from three sources, running in parallel:

1. **Human curator** — the framework maintainer adds new threat classes as they emerge from field experience, empirical incidents, published breaches, or targeted research.
2. **LLM watcher** — an AI agent monitors security-industry sources (CVE feeds, published breach post-mortems, novel attack research) and proposes new threat classes to the human curator for review before promotion to the catalog.
3. **Auto-from-findings** — when an engagement produces a novel finding that does not fit an existing threat class, the finding itself is the seed for a new catalog entry. The next engagement against a different target automatically inherits the new class.

Every catalog addition is a versioned entry with a stable identifier; targets pin their scorecard against a specific catalog version so that "score improved" and "score got worse because new attacks were added" are distinguishable.

## Multi-persona LLM evaluation (v0.3 per Grok review)

Kronos supports LLM-assisted evaluation at three points in the engagement lifecycle: attack generation, finding interpretation, and remediation-suggestion drafting. The framework's core discipline (deterministic verdicts, oracle authority, plausibility-monitor bounds) is not delegated to LLMs; LLM outputs are always **proposals** that must be adopted, modified, or rejected by the operator before they take effect.

The multi-persona pattern assigns distinct LLM instances (potentially different providers, different system prompts, different context) to three complementary roles per engagement:

- **Red persona** — proposes novel challenges from the target's model and threat catalog. Generates candidate attack matrices, novel oracle scaffolding, and adversarial-simulation scripts. Its output feeds the plan (§7 attack matrix) as candidate entries.
- **Blue persona** — proposes defensive interpretations of observations and challenges the red persona's assumptions. Generates candidate false-positive analyses, alternative explanations for observed signals, and remediation strategies. Its output feeds the finding narrative (§10) as candidate mitigations.
- **Synth persona** — reconciles red and blue outputs, drafts operator-facing summaries, and proposes catalog-entry candidates from novel findings. Its output feeds the closeout (§13) and catalog-draft pipeline.

**Guardrails (non-negotiable):**

- LLM outputs are proposals only. They may draft any content in the engagement document, but their content becomes authoritative only after operator approval and signature.
- LLMs may not issue deterministic verdicts. Attack-oracle results and plausibility-monitor outcomes come from the deterministic oracle engine, not from LLM narrative.
- LLMs may not expand authorization scope. If a red-persona proposal requires broader authorization than the engagement holds, the proposal is refused (per ADR-0009 and ADR-0016).
- LLMs may not choose high-impact actions autonomously. Any action at impact class ≥ I2 requires explicit operator selection from the proposed candidates.
- LLMs may not promote catalog entries. The synth persona's catalog-draft proposals go to `catalog/drafts/`; human curator review is required for promotion (per ADR-0019).
- LLM inputs are sandboxed. CVE descriptions, breach writeups, and third-party threat intel are treated as untrusted input (per CATALOG.md §LLM watcher). Deterministic parsers extract before LLMs see content.
- LLM outputs are provenance-tagged. Every LLM-authored section carries a marker naming the LLM provider, model version, prompt template, and generation timestamp. A finding that includes LLM-drafted narrative shows this provenance in its evidence manifest.

**Persona diversity by vendor is recommended.** Running red and blue personas on the same LLM model produces correlated failure modes (same training biases, same blind spots). At least two vendor LLM families should be used across the three roles when practical.

## Runtime primitives referenced

The framework's core runtime primitives, described in DESIGN.md §9 and specified in adjacent methodology documents:

- **Attack** — the specific probe executed against a target (formerly "oracle input"; the attack is what the tool does).
- **Attack oracle** — the deterministic assertion evaluating whether the attack succeeded (PASS/FAIL/INCONCLUSIVE). The word "oracle" alone is deprecated in favor of "attack oracle" to disambiguate from the plausibility monitor (per ADR-0007).
- **Plausibility monitor** — continuous or scheduled evaluation of observed values against a declared capacity model. Emits findings when observations physically exceed bounds. See [PLAUSIBILITY-MONITOR.md](PLAUSIBILITY-MONITOR.md). Runs outside the engagement lifecycle.
- **Capacity model** — the operator-authored (or observed-inferred) mapping from declared infrastructure to physical bounds per resource class. Committed to `<target>/kronos/capacity.yaml`.
- **Evidence** — the persistent record of an attack and its oracle evaluation, hashed by SHA-256, committed to git.
- **Execution provenance** — signed attestation binding an evidence artifact to a specific tool invocation at a specific time by a specific operator. Distinguishes evidence-integrity from execution-authenticity (per Claude review P2-3).
- **Finding** — an assertion of a specific defense failure or plausibility violation, backed by specific evidence, with reproduction instructions and suggested remediation.

## Commit ceremony

Kronos adopts the following commit ceremony:

- All commits GPG-signed.
- All pushes via SSH.
- Feature branches use the `@<username>/neuralpathway/<base>-<current>-<timestamp>-<slug>` convention for scratch work; shared engagement branches use `engagement/kronos-<target>-<N>` for multi-agent engagements.
- Squash-merge to the deployment-pointer branch on engagement close.

The framework does not enforce these — they are the operator's discipline. Kronos's own runner and actions assume this ceremony when validating engagement documents.
