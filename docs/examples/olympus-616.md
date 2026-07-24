# Reference implementation: olympus-616

The flagship reference implementation of kronos is the [olympus-616](https://github.com/olympus-616/olympus-616) platform. Olympus-616 is a fleet of 32+ AI services running as a single Docker image on AWS ECS, backed by the olympus-grid Salesforce managed package, defended by the Ares perimeter cascade (`hostile-universe-defense-v2.3-SEALED`), and — by design — the first target kronos ever attacks.

Olympus-616 is unique among adopters in two ways:

1. It is the target on which the framework's shape has been co-designed. Every kronos primitive has been validated against a real olympus-616 defense claim before being committed to this framework.
2. It is co-adopted with eos. Both frameworks are installed; the dialectic runs at full fidelity; the runner renders both kanbans plus the fused scorecard.

## Installation locations

Kronos artifacts in the olympus-616 repository:

```
olympus-616/foundation/kronos/
├── README.md                      # copied from alchemisthomer/kronos/methodology/OPERATING-MANUAL.md
├── engagement/                    # copied from alchemisthomer/kronos/templates/engagement/
│   ├── README.md
│   ├── TEMPLATE.md
│   ├── SCORECARD.md               # target-slug: olympus-grid
│   ├── 00_scope/
│   ├── 01_authorized/
│   ├── 02_planning/
│   ├── 03_ready/
│   ├── 04_running/
│   ├── 05_evidence/
│   ├── 06_shipped/
│   └── 07_aborted/
└── evidence/                      # evidence artifacts, one folder per engagement
```

Eos artifacts already live in `olympus-616/foundation/eos/`. The two folders are peers; both are read by the runner.

## First engagement (proof of concept)

The first kronos engagement against olympus-grid is intentionally scope-tiny and framework-total. It executes ONE attack from the `hostile-universe-defense-kronos-redteam-plan-2026-07-24.md` cross-layer scenario set — Scenario D, the attacker-owned CloudFront distribution — and verifies that the L14 origin-secret defense (`cfSecretGuard`) fires as designed.

**Target slug:** `olympus-grid`
**Engagement:** `olympus-grid.kronos-1.md`
**Mode:** `assertion-harness`
**Environment:** `staging`
**Safety mode:** `first-signal-stop`
**Threat class:** KTC-perimeter-bypass (perimeter defense bypass via alternate ingress)

The engagement's success criterion is not "the L14 defense held" — it is "the framework's full loop executed end-to-end: authorization signed, attack executed, evidence collected, oracle evaluated, finding written, scorecard updated." If the L14 defense holds (as expected), the scorecard's Perimeter Defense dimension is bumped from L3 to L4 with cited evidence. If the L14 defense fails, a critical finding is written and the Perimeter Defense dimension drops to L1 with the falsified attestation cited.

Either outcome is a successful validation of kronos itself. The framework's usefulness does not depend on any particular defense outcome; it depends on the framework's ability to produce reproducible evidence about defense outcomes.

## Roadmap of engagements

Once the POC engagement closes and the framework loop is validated, additional engagements will be scheduled against olympus-grid to cover the full `hostile-universe-defense-v2.3` cascade. Each L-layer (L1 through L14) becomes one or more engagements. The cross-layer compound scenarios A-D become engagements of their own. The scorecard's Perimeter Defense dimension incrementally moves from L3 to L4 to L5 as coverage broadens.

Beyond the perimeter cascade, subsequent engagements will target other pillars:

- **Cost Integrity** — cost-adversarial engagements simulating the 2026-07-17 defect pattern from outside. Does olympus-616's cost blast radius remain bounded under adversarial input?
- **Data Integrity** — data-pollution engagements against the ledger emit pipeline. Does duplicate delivery produce duplicate ledger rows? Does the DUPLICATE_VALUE insert semantic hold under sustained retry storms?
- **Availability & Resilience** — destructive-load engagements against the retry queue and circuit breaker. Does the retry queue's TTL-eviction fire correctly under sustained failure?
- **Observability** — data-pollution engagements testing whether the ledger records everything it claims to record. Are there classes of event that silently disappear?
- **Recovery adversarial** — attacks that specifically target the recovery mechanisms. Can the kill switch be bypassed? Can the rollback be corrupted?

Each engagement is one kronos document, one attack matrix, one set of findings, one scorecard delta. The scorecard, over time, becomes the running answer to "is olympus-grid safe?" — updated on every engagement close, drillable to any finding, verifiable by any observer with repository access.

## Public visibility

The olympus-616 repository is (or is planned to be) public. Every kronos engagement, every finding, every scorecard state is therefore public by default. This is the operationalization of the framework's public-by-default evidence property (SEVEN-CLAIMS §4) — any observer can independently verify that the scorecard's claimed maturity is supported by the underlying engagement evidence.

This public posture is also the operational form of the framework's foundational claim: "olympus-grid is the greatest software platform that will ever be built, and can run continuously on a solar-powered Raspberry Pi." That claim is refutable — any observer can attempt to falsify it by running kronos against olympus-grid and producing findings that lower the scorecard. The framework's authors invite this attempt.

## Integration with eos

Olympus-616 is co-adopted with eos. When a kronos engagement falsifies a previously-closed eos attestation cycle, the falsification auto-files a new backlog cycle in `olympus-616/foundation/eos/cycle/00_backlog/` naming the falsified claim and pointing to the kronos evidence. The auto-filed cycle is the seed for eos's next attestation of the affected claim.

The runner presents both kanbans in a fused view, along with the composite scorecard, whenever the operator opens the olympus-616 repository. This is the reference implementation of the eos-kronos dialectic — the two frameworks operating in structured opposition, reinforcing each other through git-native artifact flow.
