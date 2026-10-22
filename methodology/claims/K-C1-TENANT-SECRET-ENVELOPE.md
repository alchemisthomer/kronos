# K-C1-TENANT-SECRET-ENVELOPE

**Admitted:** 2026-10-21 · [Railway credential envelope collapse](../../docs/blog/posts/2026-10-21-railway-credential-envelope-collapse.md)
**Oracle:** [O-ENVELOPE-INTEGRITY](../oracles/O-ENVELOPE-INTEGRITY.md)
**Holder class:** any target that holds tenant-controlled secrets on tenants' behalf

## Statement

> For a target T that holds tenant-controlled secrets on tenants' behalf, T can produce, under adversarial challenge, evidence that:
>
> **(a) Outer boundary intact.** The authentication layer that lets "the right customer" read the envelope is intact against the current attacker model. Authenticated-but-wrong-tenant attempts, unauthenticated attempts, and token-replay attempts all return a denial response; no secret material appears in error payloads, telemetry, or logs.
>
> **(b) Inner boundary intact.** The storage mechanism is intact against the insider-with-DB-read model and the KMS-compromise model. A rogue platform employee with read-only database credentials cannot recover plaintext; the sealed-envelope layer requires an additional authority the simulated employee does not have.
>
> **(c) Retrieval boundary observable.** The moment plaintext is unsealed to be used is observable, bounded, and auditable such that a successful attack at the retrieval boundary would be detectable within a stated time budget T_detect. Every retrieval appears in an append-only audit log with the fields `(caller, callee, secret-id, retrieval-ts, retrieval-reason)`, and a synthetic anomalous retrieval triggers detection within T_detect.

## The primitive

Every Platform-as-a-Service, every managed-cloud system, every secrets vault, and every SaaS that lets a customer "paste their API key here" or "store this database password" or "connect this OAuth token" is holding a **tenant-secret envelope** on behalf of that customer. The envelope has three boundaries:

```
                  OUTER BOUNDARY
                  (authentication / authorization)
             ┌─────────────────────────────────┐
             │                                 │
             │       INNER BOUNDARY            │
             │     (at-rest encryption,        │
             │      KMS key separation,        │
             │      insider-attack posture)    │
             │   ┌─────────────────────────┐   │
             │   │                         │   │
             │   │       SECRET            │   │
             │   │       MATERIAL          │   │
             │   │                         │   │
             │   └─────────────────────────┘   │
             │                                 │
             └─────────────────────────────────┘
                  RETRIEVAL BOUNDARY
         (the moment plaintext is unsealed to a worker,
          build pipeline, deploy agent, etc. — the
          envelope's weakest moment)
```

The envelope's job is to make it true that *only the customer, and only through the platform's intended retrieval path, can produce plaintext*. When any one boundary leaks, the customer cannot tell which boundary broke, and the correct response is to assume the whole envelope is burned.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence can be produced today. (Default for any target that has not been engaged. Also the mandatory level for any target whose envelope was publicly demonstrated to have failed, until a new round of post-incident evidence has been assembled.) |
| **L1** | Target can produce evidence of basic hygiene: documented authentication model, documented at-rest encryption model, documented retrieval path. No active oracle evaluation. |
| **L2** | Target has passed `O-ENVELOPE-INTEGRITY` subtests (a), (b), (c) in a time-boxed engagement with Kronos. Evidence is captured in the engagement's `05_evidence/` folder. |
| **L3** | Target maintains L2 continuously: oracle subtests are run on a stated cadence (e.g. monthly), results are published, regressions are detected and remediated within a stated time window. The scorecard delta is kept current. |

## Holder class

The non-exhaustive list of system classes that hold this primitive:

- **Developer platforms-as-a-service**: Vercel, Netlify, Render, Fly.io, Railway, (formerly) Zeabur, and every PaaS not yet named.
- **CI secret stores**: GitHub Actions secrets, GitLab CI variables, CircleCI contexts, Buildkite build secrets, Travis encrypted env.
- **Cloud secrets managers**: AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, HashiCorp Vault.
- **SaaS with cross-account credential storage**: anything with an "integrations" or "connectors" section that holds the customer's third-party tokens.
- **Olympus-Grid**: the operator's own platform. Olympus-Grid holds god-service private keys in SSM Parameter Store under `/olympus/{env}/keys/*` and holds tenant-authentication tokens in `Identity__c` and related Salesforce objects. The envelope's outer boundary is Ares + Site Guest auth + JWT validation; the inner boundary is SSM `SecureString` + Salesforce FLS; the retrieval boundary is the moment Hermes forwards a request bearing `x-user-identity` or `x-salesforce-token` to a god or to a Salesforce ApiRoute. **Olympus-Grid is on this list because it funds Kronos. It gets no exemption.**

## Related claims

- [K-C2-PLATFORM-CONTINUITY](K-C2-PLATFORM-CONTINUITY.md) — admitted on the same day; a system that cannot survive an envelope collapse at the K-C1 level fails K-C2 by definition.

## Posts that touch this claim

- [Railway's credential envelope collapsed](../../docs/blog/posts/2026-10-21-railway-credential-envelope-collapse.md) — inaugural, defines the primitive
- [Zeabur's sunset is the same envelope](../../docs/blog/posts/2026-10-21-zeabur-sunset-same-envelope.md) — same primitive, greater scope
