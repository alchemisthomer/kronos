# kronos methodology

The methodology folder contains the intellectual core of the kronos framework — the operating discipline, the novel-properties claim structure, the engagement document template, and the maturity scorecard model.

## Files

| File | Contents |
|---|---|
| [`OPERATING-MANUAL.md`](OPERATING-MANUAL.md) | The engagement discipline: kanban structure, document sections, challenge modes, environment discipline, operating principles, growth mechanism |
| [`INVENTIVE-CONCEPT-CANDIDATES.md`](INVENTIVE-CONCEPT-CANDIDATES.md) | Candidate differentiators / potential inventive concepts, with explicit prior-art acknowledgment. Renamed from SEVEN-CLAIMS.md in v0.2 per ChatGPT review to avoid unqualified novelty claims |
| [`SCORECARD.md`](SCORECARD.md) | The multidimensional scorecard model — four pillars, twelve dimensions, per-cell state (maturity + effectiveness + coverage + confidence + freshness + fidelity). L4/L5 require adversarial proof |
| [`TEMPLATE.md`](TEMPLATE.md) | The engagement document scaffold with three-axis authorization + impact budgets (v0.2) |
| [`TOOL-BINDING.md`](TOOL-BINDING.md) | The four-layer tool binding contract with typed argv (no shell default), MCP-as-transport, mandatory sandbox by impact class, and policy-driven binding resolution |
| [`INDUSTRY-ALIGNMENT.md`](INDUSTRY-ALIGNMENT.md) | Kronos's positioning as evidence-producing companion for selected technical and operational control objectives. Maps to OSCAL / OpenCRE / ASVS 5.0 / AISVS 1.0 / LLMSVS 2.0 / NIST CSF / NIST AI RMF / MITRE ATT&CK / ATLAS / CAPEC / CWE / CVE |
| [`PLAUSIBILITY-MONITOR.md`](PLAUSIBILITY-MONITOR.md) | The capacity-model and plausibility-monitor primitives. In v0.2 this is one component of the continuous assurance plane |
| [`CONTINUOUS-ASSURANCE.md`](CONTINUOUS-ASSURANCE.md) | The continuous assurance plane (Kronos Sentinel / Reconciler) — first-class peer to the engagement plane. Runs passive and low-impact evaluations on schedule or event trigger. Introduces "challenge" as parent abstraction with attack as one subtype. (New in v0.2 per ChatGPT P0-1.) |
| [`DOMAIN-MODEL.md`](DOMAIN-MODEL.md) | The canonical typed domain model — engagement, plan, run, observation, oracle result, finding, evidence manifest, score snapshot as separately versioned objects. Markdown is the human projection; typed schemas are the source of truth. (New in v0.2 per ChatGPT P0-5.) |
| [`EVIDENCE.md`](EVIDENCE.md) | Two-tier evidence storage (sanitized repository tier + protected raw tier), SLSA-aligned provenance signing, opt-in disclosure model, chain of custody. (New in v0.2 per ChatGPT P0-6.) |
| [`ORACLE.md`](ORACLE.md) | Expanded oracle state machine — 10 claim-oriented outcomes replacing v0.1's PASS/FAIL/INCONCLUSIVE. Required per-challenge scaffolding (baseline + positive/negative controls + correlation ID + cleanup oracle). (New in v0.2 per ChatGPT P0-9.) |
| [`CATALOG.md`](CATALOG.md) | Threat catalog lifecycle governance — six states, applicability predicates, LLM watcher quarantine, community contribution flow, naming conventions. (New in v0.2 per ChatGPT P0-10; naming conventions added in v0.4 per Gemini review #4.) |
| [`AUTONOMOUS-AUTHORIZATION.md`](AUTONOMOUS-AUTHORIZATION.md) | Two-tier authorization model — human-signed StandingAuthorization establishes the envelope, hardware-backed machine identities issue per-invocation MachineIssuedAuthorization within it. Preserves legal-consent semantics while enabling autonomous continuous-plane operation. (New in v0.4 per Gemini review #1 and direct question on cryptographic workload identities.) |

## Read order

For a first-time reader, the recommended order is:

1. `OPERATING-MANUAL.md` — how the framework runs day-to-day.
2. `CONTINUOUS-ASSURANCE.md` — the plane that runs when no engagement is open. Read early because it changes what "kronos" means.
3. `DOMAIN-MODEL.md` — the objects the framework operates over and their signature envelopes.
4. `SCORECARD.md` — what the framework produces as its primary consumer artifact.
5. `INVENTIVE-CONCEPT-CANDIDATES.md` — candidate differentiators with explicit prior-art acknowledgment and patent-strategy deferred-decision block.
6. `TEMPLATE.md` — the concrete artifact operators author.
7. `ORACLE.md` — how deterministic verdicts are established.
8. `EVIDENCE.md` — how evidence is stored, provenance-signed, and disclosed.
9. `CATALOG.md` — how the threat catalog is governed and grows.
10. `PLAUSIBILITY-MONITOR.md` — the specific continuous-plane primitive that would have caught the founding incident.
11. `TOOL-BINDING.md` — how tools plug into the framework.
12. `INDUSTRY-ALIGNMENT.md` — where kronos sits in the compliance landscape.

## Companion documents (repo root)

- [`../DESIGN.md`](../DESIGN.md) — the wide-net vision document driving the current design review cycle.
- [`../PATENT-DISCLOSURE-DRAFT.md`](../PATENT-DISCLOSURE-DRAFT.md) — inventive-claim disclosure for IP counsel *(to be authored after design review converges)*.
- [`../WHITE-PAPER.md`](../WHITE-PAPER.md) — theory-and-practice narrative with empirical record *(to be authored after first engagements ship)*.
- [`../SOC2-CONTROL-MAPPING.md`](../SOC2-CONTROL-MAPPING.md) — mapping of scorecard dimensions to SOC 2 control categories *(to be authored after methodology stabilizes)*.

## Portability

The methodology folder is not the portable artifact — [`../templates/`](../templates/) is. When a target adopts kronos, the operator copies `../templates/engagement/` into the target's repository. The methodology folder stays here as the canonical reference; changes to the methodology propagate to adopters through documentation and updated templates, not through mandatory upgrades.
