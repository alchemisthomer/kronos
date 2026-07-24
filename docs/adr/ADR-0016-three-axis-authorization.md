# ADR-0016 — Three-axis authorization model

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0.1's single-axis `authorizationCeiling`
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-7

## Context

The v0.1 `authorizationCeiling` (0–4: static/passive/controlled/destructive/catastrophic-simulation) conflated impact, environment, and executor-assurance concerns into a single axis. ChatGPT correctly noted that "destructive test in staging with a hardened executor" and "passive test in production with a local process executor" are different risk shapes that a single-axis model cannot distinguish.

## Decision

Authorization decomposes into three orthogonal axes:

**Impact class:**
- I0 — passive
- I1 — non-mutating active
- I2 — bounded reversible mutation
- I3 — disruptive/destructive
- I4 — irreversible or human-impacting

**Environment class:**
- E0 — synthetic
- E1 — isolated lab
- E2 — staging
- E3 — production-equivalent
- E4 — production

**Executor assurance class:**
- X0 — local process
- X1 — restricted container
- X2 — hardened isolated worker
- X3 — dedicated VM / cloud account
- X4 — independently controlled execution environment

Combined with additional TEMPLATE §2 authorization fields (added or made explicit in v0.2):
- `notBefore` and `expiresAt`
- Revocation identifier and revocation channel
- Proof of target ownership or delegated authority
- Contract/SOW/ROE reference
- Exact scope (accounts, tenants, regions, hosts, paths, source identities)
- Approved challenge IDs or capability classes
- Approved tool and image digests
- Third-party systems explicitly excluded or separately authorized (chain-of-authorization per ADR-0009)
- Cost, traffic, data, mutation, and human-impact ceilings (impact budget per ADR-0014)
- Emergency contacts and escalation order
- Cleanup and rollback obligations
- Evidence classification and retention (per ADR-0015)
- Jurisdiction and contractual constraints
- Disclosure authority
- Required clock synchronization
- Separation-of-duty roles (targetOwner, legalOrBusinessAuthorizer, safetyOfficer, operator, evidenceCustodian, reviewer)

**Credentials are not embedded in the authorization artifact.** Use short-lived workload identity, assumed roles, secret-broker references, or scoped ephemeral tokens.

**Explicit precedent alignment** — kronos authorization aligns with and extends NIST SP 800-115 §3.4 (Rules of Engagement). This alignment is stated so kronos does not appear to claim novelty over the ROE concept.

## Consequences

**Positive.** Authorization expressiveness matches actual operational risk shapes. Runtime enforcement is per-axis (impact class gates data-mutation checks; environment class gates production-touching checks; executor assurance class gates sandbox posture). Separation-of-duty roles are structural.

**Negative.** More authorization complexity. Simple engagements against the operator's own test environment carry unused fields.

**Neutral.** Legacy `authorizationCeiling` alias derived from impactClass for tool-binding compatibility.

## References

- [`methodology/TEMPLATE.md`](../../methodology/TEMPLATE.md) §2.
- NIST SP 800-115 §3.4 Rules of Engagement (external precedent).
- ChatGPT cross-LLM review of v0, P0-7.
