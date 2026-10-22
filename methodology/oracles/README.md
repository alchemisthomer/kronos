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

Running an oracle outside the operator profile stated in its procedure is a scope violation. Scope violations invalidate the engagement.
