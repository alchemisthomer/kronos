# Kronos oracles

An **oracle** is a procedure. It takes a target as input and produces evidence. The evidence is what moves a target up or down a claim's scoring ladder.

Every oracle in this folder has:

- A **canonical id** (`O-<SHORT-NAME>`), paired with the claim it evaluates.
- A **procedure** — the ordered set of subtests. Each subtest has a pass criterion stated in advance.
- An **evidence specification** — what artifacts the oracle produces, what format they take, what belongs in the engagement's `05_evidence/` folder.
- An **operator profile** — the authorization scope required to run the oracle (what credentials, what access, what rules of engagement).

Oracles are deterministic in intent — same target state + same subtest + same operator profile → same result — even though the subtests themselves may involve stochastic adversarial inputs. An oracle that is not deterministic in intent is a demo, not a measurement.

Oracles are versioned. When a subtest changes, the oracle's version bumps. Engagements record which oracle version was run.

## Current oracles

| Id | Evaluates | Status |
|---|---|---|
| [O-ENVELOPE-INTEGRITY](O-ENVELOPE-INTEGRITY.md) | [K-C1-TENANT-SECRET-ENVELOPE](../claims/K-C1-TENANT-SECRET-ENVELOPE.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-PLATFORM-CONTINUITY](O-PLATFORM-CONTINUITY.md) | [K-C2-PLATFORM-CONTINUITY](../claims/K-C2-PLATFORM-CONTINUITY.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-OBSERVABILITY-HONESTY](O-OBSERVABILITY-HONESTY.md) | [K-C3-OBSERVABILITY-HONESTY](../claims/K-C3-OBSERVABILITY-HONESTY.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-RUNTIME-INTEGRITY](O-RUNTIME-INTEGRITY.md) | [K-C4-RUNTIME-INTEGRITY](../claims/K-C4-RUNTIME-INTEGRITY.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-REPRESENTATIONAL-EQUIVALENCE](O-REPRESENTATIONAL-EQUIVALENCE.md) | [K-C5-REPRESENTATIONAL-EQUIVALENCE](../claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-ATTACKER-CADENCE](O-ATTACKER-CADENCE.md) | [K-C6-ATTACKER-CADENCE-RESILIENCE](../claims/K-C6-ATTACKER-CADENCE-RESILIENCE.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-ROOT-OF-TRUST](O-ROOT-OF-TRUST.md) | [K-C7-ROOT-OF-TRUST-INTEGRITY](../claims/K-C7-ROOT-OF-TRUST-INTEGRITY.md) | v0.1 — subtests specified, not yet exercised against a target |
| [O-SUPPLY-CHAIN](O-SUPPLY-CHAIN.md) | [K-C8-SUPPLY-CHAIN-INTEGRITY](../claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md) | v0.1 — subtests specified, not yet exercised against a target |

## Operator profile vocabulary

Oracles state what authorization an operator needs. Standard profiles:

- **external-anon** — unauthenticated, external network position. Simulates a public attacker who has not been given any credentials. Can be run under any `AUTHORIZATION.md` that lists the target's public endpoints.
- **external-tenant** — authenticated as a legitimate tenant, external network position. Simulates a hostile customer. Requires an `AUTHORIZATION.md` that explicitly grants the Kronos operator a tenant account on the target.
- **internal-ro-db** — read-only database access on the target's primary data store. Simulates a rogue DBA or a leaked read replica credential. Requires explicit written grant.
- **internal-ro-infra** — read-only cloud-account access on the target's infrastructure. Simulates leaked CI credentials or a mis-scoped operator token. Requires explicit written grant.
- **internal-rw-plane** — read-write control-plane access. Simulates a compromised SRE. Requires explicit written grant AND a time-boxed window.
- **agent-authority-under-test** — a controlled agent deployed inside the target's runtime, with the trust envelope that typical in-target agents possess. Simulates an in-production agent that could, under permissive instructions, modify observability. Requires explicit written grant, a time-boxed test window, and a target-written assurance that the controlled agent will not be given production authority outside the window.
- **independent-attestor** — a reporter on target-system state that is not itself the party under measurement and does not share a trust class (or, in v0.2+, a model lineage) with the party under measurement. Required by `O-OBSERVABILITY-HONESTY` subtest (b).
- **external-monitor-killer** — an operator-controlled mechanism to silence a target's monitor cleanly, by stopping the collector, blocking the egress path, or revoking the write credential. Required by `O-OBSERVABILITY-HONESTY` subtests (b) and (c). Requires explicit written grant and a time-boxed window.
- **controlled-rce** — an operator-deployed instrumented endpoint that executes operator-supplied code at the lowest trust layer of the target's declared isolation model. Simulates a successful RCE and lets the operator probe cross-request isolation. Required by `O-RUNTIME-INTEGRITY` subtest (c). Requires explicit written grant, a time-boxed window, and a target-declared isolation model the probes are evaluated against.
- **symbolic-model-author** — an operator positioned to contribute to a target's symbolic model (e.g., a loss function in an autodiff pipeline, a query hint in a SQL optimizer). Required by `O-REPRESENTATIONAL-EQUIVALENCE` subtest (b).
- **numerical-executor** — an operator positioned to observe the target's numerical execution directly, with access to intermediate values. Required by `O-REPRESENTATIONAL-EQUIVALENCE` subtest (a).
- **divergence-observer** — an operator positioned to probe the target's divergence-detection path with synthetic events. Required by `O-REPRESENTATIONAL-EQUIVALENCE` subtest (c).
- **cadence-simulator** — an operator-controlled traffic source that can replay documented attacker-cadence patterns (ARTEX-class password-spray, high-rate enumeration). Required by `O-ATTACKER-CADENCE` subtest (a). Requires written grant with time-boxed window.
- **simulated-privilege-compromise** — an operator granted credentials for named entry points AS IF they had been compromised, used to probe blast-radius architecture. Required by `O-ATTACKER-CADENCE` subtest (c). Requires explicit grant, time-boxed, with containment-observer monitoring.
- **containment-observer** — an operator with read-only access to the target's response infrastructure (detection pipelines, containment-action logs). Required by `O-ATTACKER-CADENCE` subtest (b).
- **ceremony-auditor** — an operator reviewing key-generation ceremony artifacts and sampling the entropy source directly. Required by `O-ROOT-OF-TRUST` subtest (a). Requires written grant for entropy-source sampling.
- **internal-ro-hsm** — read-only access to the storage layer holding trust-anchor key material. Required by `O-ROOT-OF-TRUST` subtest (b). Requires explicit written grant.
- **governance-observer** — an operator submitting synthetic compromise reports through the target's governance channel to measure response and revocation propagation. Required by `O-ROOT-OF-TRUST` subtest (c).
- **source-auditor** — an operator probing a target's source-repository integrity controls via unauthorized-change simulation and audit-trail sampling. Required by `O-SUPPLY-CHAIN` subtest (a). Requires written grant.
- **build-pipeline-auditor** — an operator reproducing a target's build artifacts bit-for-bit from source, and probing publication-credential posture. Required by `O-SUPPLY-CHAIN` subtest (b).
- **downstream-verifier** — an operator positioned as a standard downstream consumer, with no privileged relationship with the target, running the documented artifact-verification mechanism. Required by `O-SUPPLY-CHAIN` subtest (c).

Running an oracle outside the operator profile stated in its procedure is a scope violation. Scope violations invalidate the engagement.
