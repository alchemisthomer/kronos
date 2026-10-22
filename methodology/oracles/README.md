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

## Operator profile vocabulary

Oracles state what authorization an operator needs. Standard profiles:

- **external-anon** — unauthenticated, external network position. Simulates a public attacker who has not been given any credentials. Can be run under any `AUTHORIZATION.md` that lists the target's public endpoints.
- **external-tenant** — authenticated as a legitimate tenant, external network position. Simulates a hostile customer. Requires an `AUTHORIZATION.md` that explicitly grants the Kronos operator a tenant account on the target.
- **internal-ro-db** — read-only database access on the target's primary data store. Simulates a rogue DBA or a leaked read replica credential. Requires explicit written grant.
- **internal-ro-infra** — read-only cloud-account access on the target's infrastructure. Simulates leaked CI credentials or a mis-scoped operator token. Requires explicit written grant.
- **internal-rw-plane** — read-write control-plane access. Simulates a compromised SRE. Requires explicit written grant AND a time-boxed window.

Running an oracle outside the operator profile stated in its procedure is a scope violation. Scope violations invalidate the engagement.
