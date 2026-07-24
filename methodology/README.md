# kronos methodology

The methodology folder contains the intellectual core of the kronos framework — the operating discipline, the novel-properties claim structure, the engagement document template, and the maturity scorecard model.

## Files

| File | Contents |
|---|---|
| [`OPERATING-MANUAL.md`](OPERATING-MANUAL.md) | The engagement discipline: kanban structure, document sections, attack modes, environment discipline, operating principles, growth mechanism |
| [`SEVEN-CLAIMS.md`](SEVEN-CLAIMS.md) | The seven novel properties of the kronos methodology, described at conceptual level for design review and eventual patent disclosure |
| [`SCORECARD.md`](SCORECARD.md) | The maturity scorecard model — four pillars, twelve dimensions, six levels — including the load-bearing property that L4 and L5 are only reachable via adversarial proof |
| [`TEMPLATE.md`](TEMPLATE.md) | The engagement document scaffold that adopters instantiate for each engagement |
| [`TOOL-BINDING.md`](TOOL-BINDING.md) | The four-layer tool binding contract: how the framework delegates attack execution to bare-shell tools, structured adapters, MCP-compliant tools, and native kronos tools |
| [`INDUSTRY-ALIGNMENT.md`](INDUSTRY-ALIGNMENT.md) | Kronos's positioning against the compliance landscape (SOC 2, ISO 27001, PCI DSS, OWASP ASVS, NIST CSF, NIST AI RMF, AWS Well-Architected, MITRE ATT&CK / ATLAS / CAPEC / CWE / CVE, and more), plus the per-standard mapping strategy |
| [`PLAUSIBILITY-MONITOR.md`](PLAUSIBILITY-MONITOR.md) | The capacity-model and plausibility-monitor primitives — continuous evaluation of observed values against declared physical bounds. Distinct from the per-attack oracle. This is the primitive that would have caught the founding incident within hours. (Added in v0.1 per Claude review P1-1.) |

## Read order

For a first-time reader, the recommended order is:

1. `OPERATING-MANUAL.md` — how the framework runs day-to-day.
2. `SCORECARD.md` — what the framework produces as its primary consumer artifact.
3. `SEVEN-CLAIMS.md` — why the framework is novel (with a deferred-decision block on patent-vs-open-source strategy).
4. `TEMPLATE.md` — the concrete artifact operators author.
5. `PLAUSIBILITY-MONITOR.md` — the continuous impossibility-check primitive that runs outside the engagement lifecycle.
6. `TOOL-BINDING.md` — how tools plug into the framework.
7. `INDUSTRY-ALIGNMENT.md` — where kronos sits in the compliance landscape.

## Companion documents (repo root)

- [`../DESIGN.md`](../DESIGN.md) — the wide-net vision document driving the current design review cycle.
- [`../PATENT-DISCLOSURE-DRAFT.md`](../PATENT-DISCLOSURE-DRAFT.md) — inventive-claim disclosure for IP counsel *(to be authored after design review converges)*.
- [`../WHITE-PAPER.md`](../WHITE-PAPER.md) — theory-and-practice narrative with empirical record *(to be authored after first engagements ship)*.
- [`../SOC2-CONTROL-MAPPING.md`](../SOC2-CONTROL-MAPPING.md) — mapping of scorecard dimensions to SOC 2 control categories *(to be authored after methodology stabilizes)*.

## Portability

The methodology folder is not the portable artifact — [`../templates/`](../templates/) is. When a target adopts kronos, the operator copies `../templates/engagement/` into the target's repository. The methodology folder stays here as the canonical reference; changes to the methodology propagate to adopters through documentation and updated templates, not through mandatory upgrades.
