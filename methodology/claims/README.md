# Kronos claims

A **claim** is a precise, falsifiable statement about a target that an **oracle** can evaluate. The claim set is what Kronos measures. The scorecard is where each target's state against each claim is recorded.

Every claim in this folder has:

- A **canonical id** (`K-C<N>-<SHORT-NAME>`), stable across time. Ids are never reused.
- A **statement** — one or two sentences, falsifiable, phrased in terms of what evidence would make it true.
- A **primitive** it protects — the architectural shape that collapses when the claim does not hold.
- An **oracle** — the procedure in `../oracles/` that evaluates it.
- A **scoring ladder** — L0 (no evidence), L1 (evidence of basic hygiene), L2 (evidence under adversarial conditions), L3 (evidence under adversarial conditions over time, with regression protection).
- A **holder class** — the kinds of targets this claim can be scored against.

The claim set grows by **doctrine reckonings** (see `../../docs/blog/concept.md`). A claim admitted into the set because a public failure demonstrated an unmeasured primitive is announced in a `kind: doctrine` post on Reckonings. Claims are never retired silently; retirement is also a doctrine reckoning.

## Current claim set

| Id | Name | Admitted | Source event |
|---|---|---|---|
| [K-C1-TENANT-SECRET-ENVELOPE](K-C1-TENANT-SECRET-ENVELOPE.md) | Tenant-secret envelope | 2026-10-21 | Railway credential disclosure |
| [K-C2-PLATFORM-CONTINUITY](K-C2-PLATFORM-CONTINUITY.md) | Platform continuity | 2026-10-21 | Zeabur shutdown |
| [K-C3-OBSERVABILITY-HONESTY](K-C3-OBSERVABILITY-HONESTY.md) | Observability honesty | 2026-10-21 | OpenAI Sol / Astra agent monitor-suppression incidents |
| [K-C4-RUNTIME-INTEGRITY](K-C4-RUNTIME-INTEGRITY.md) | Runtime integrity under attacker-controlled input | 2026-10-22 | PHP2Shell — CVE-2026-109618 + CVE-2026-109619 |
| [K-C5-REPRESENTATIONAL-EQUIVALENCE](K-C5-REPRESENTATIONAL-EQUIVALENCE.md) | Symbolic ↔ numerical/compiled execution equivalence | 2026-10-22 | PyTorch autograd Turing-complete malware via IEEE 754 vs symbolic disagreement (Litman) |
| [K-C6-ATTACKER-CADENCE-RESILIENCE](K-C6-ATTACKER-CADENCE-RESILIENCE.md) | Defender cadence ≥ attacker cadence | 2026-10-22 | ARTEX / Storm-0940 / ConnectWise — <3hr initial-to-privileged, 2,900 sign-ins/min |
| [K-C7-ROOT-OF-TRUST-INTEGRITY](K-C7-ROOT-OF-TRUST-INTEGRITY.md) | Cryptographic root-of-trust integrity (entropy, storage, governance) | 2026-10-22 | eMudhra — 8 CA private keys with values < 256; one was the integer 4 |
| [K-C8-SUPPLY-CHAIN-INTEGRITY](K-C8-SUPPLY-CHAIN-INTEGRITY.md) | Bitwise identity between published source and shipped artifact | 2026-10-22 | LiteLLM 1.107.0 PyPI compromise — malicious wheel never in git tag |
| [K-C9-STARTUP-EXECUTION-AUTHORITY](K-C9-STARTUP-EXECUTION-AUTHORITY.md) | Package install does not grant startup-hook execution authority | 2026-10-24 | LiteLLM `.pth` + `sitecustomize.py` hooks (Microsoft TI forensic deep-dive) |

## Reading the claim set

- **Operators** read a claim before scoring a target against it. The statement tells you what to prove; the oracle tells you how.
- **Target teams** read a claim before responding to a Kronos engagement. The scoring ladder tells you what evidence Kronos will accept.
- **Readers of Reckonings** click into a claim from a post. The claim's holder class tells you who else is on the hook for the same primitive.

## Not in the claim set yet

The following primitives are watched but not yet claimed. They are admitted when a public failure makes the measurement load-bearing:

- **Dependency-recovery readiness** — the primitive protecting that the target can continue to function when one of its named dependencies (identity provider, payment processor, LLM provider) goes down.
- **Coordinated-disclosure cadence** — the primitive protecting that the embargo-release window is not itself an attacker surface. Signal from the Chainguard-vs-PHP-Foundation disagreement 2026-10-21; one incident is not sufficient to admit. Candidate K-C9.

Each of these could become a Kronos claim. None have yet. (Observability honesty, previously listed, was admitted 2026-10-21 as [K-C3](K-C3-OBSERVABILITY-HONESTY.md). Supply-chain integrity, previously listed, was admitted 2026-10-22 as [K-C8](K-C8-SUPPLY-CHAIN-INTEGRITY.md).)
