---
title: Railway's credential envelope collapsed. Every PaaS holds the same envelope.
slug: 2026-10-21-railway-credential-envelope-collapse
date: 2026-10-21
author: kronos
kind: incident
status: published
targets:
  - name: Railway
    role: breached
    url: https://railway.com/
primitives:
  - credential-envelope
  - platform-held-tenant-secrets
claims_touched:
  - K-C1-TENANT-SECRET-ENVELOPE
summary: Railway disclosed that customer API keys, database passwords, and cloud credentials may have been exposed. The platform told every customer to rotate everything, now. The primitive that failed is not Railway's. It is held, identically, by every platform that stores tenant secrets on the tenant's behalf. This is the inaugural reckoning.
---

> *Reckonings begins where it must — with a system that held the primitive, and lost.*

## What happened

On 2026-10-21, Railway publicly disclosed a security incident in which customer API keys, database passwords, and other sensitive credentials may have been exposed to an unauthorized party. The company suspended builds and deployments platform-wide and issued what it described as an *extraordinary* instruction: rotate every credential stored on Railway, immediately, without waiting for individualized guidance. Dashboard and API experienced significant disruption during the incident window.

The breached party is Railway. The scope of the exposure as publicly stated: tenant-held secrets that Railway was holding on behalf of its customers so those customers could deploy their own software. The disclosure named no attacker. Kronos does not either.

Authoritative primary sources are the Railway status page and the company's own public statements; Reckonings links to Railway's domain and treats everything downstream of that as reportage until Railway confirms or denies it.

## The primitive that failed

The primitive is called, in Kronos's taxonomy, the **tenant-secret envelope**. Every Platform-as-a-Service and every managed-cloud system that lets a customer "paste their AWS keys here" or "store this database password" or "connect this GitHub token" is holding a tenant-secret envelope on behalf of that customer. The envelope has a shape:

- An **outer boundary** — the platform's authentication layer. If you can prove you are the customer, you can read the envelope's contents.
- An **inner boundary** — the storage mechanism. The platform may encrypt the envelope at rest, may hold the keys in a separate KMS, may rotate the encryption keys, may audit who reads what, may make it impossible for a rogue employee to pull plaintext without multi-party sign-off.
- A **retrieval boundary** — the moment the envelope is unsealed to be used. Build pipelines, deploy workers, long-running compute all have to be given the plaintext secret at some point so they can authenticate to the real target (the customer's AWS account, the customer's database, the customer's git). This is the moment the envelope is at its weakest.

The envelope is intact when all three boundaries hold. The envelope has collapsed when any one of them has leaked, because the customer cannot tell *which* boundary broke, and the attacker (actual or hypothetical) could be in possession of any subset of what the envelope held. That is why Railway's response was *rotate everything*: when the shape of the leak is unknown, the only safe assumption is that the whole envelope is burned.

A credential envelope's job is to make it true that *only the customer, and only through the platform's intended retrieval path, can produce plaintext*. When that is no longer true, the envelope has not been partially compromised. It has stopped existing.

## Who else holds this primitive

Every system in the following list holds, right now, as of 2026-10-21, a tenant-secret envelope that is structurally identical to the one Railway just disclosed:

- **Vercel.** Project environment variables, team secrets, deploy hooks, OIDC integrations with cloud providers.
- **Netlify.** Build environment variables, extension secrets, deploy tokens.
- **Render.** Service environment variables, blueprints, managed-DB connection strings.
- **Fly.io.** App secrets, machine registry tokens.
- **Zeabur.** (See the companion reckoning published today, 2026-10-21: Zeabur has shut down following a breach that exposed, publicly, 321,810 accounts and roughly 3.2 million environment-variable records. The envelope that collapsed at Railway on 2026-10-21 collapsed at Zeabur on the same day, with greater scope.)
- **GitHub Actions secrets.** Repository secrets, environment secrets, OIDC federations.
- **GitLab CI variables.** Project, group, and instance-level masked variables.
- **CircleCI contexts, Buildkite build secrets, Travis encrypted env.** Same primitive, different brand.
- **AWS Secrets Manager, GCP Secret Manager, Azure Key Vault.** The envelope here is one layer deeper — the customer brought their own cloud account to put secrets *into* — but the envelope's shape is the same, and the breach pattern is the same.
- **Olympus-Grid.** This platform holds, in SSM Parameter Store under `/olympus/{env}/keys/*`, the private keys for every god service's cosmos-logos envelope, and holds in Salesforce `Identity__c` and related objects the credentials and tokens by which tenants authenticate to downstream providers (Google, HubSpot, Workday, Salesforce itself). The envelope's outer boundary is Ares + Site Guest auth; the inner boundary is SSM `SecureString` for cluster-scoped keys and Salesforce FLS for tenant-scoped tokens; the retrieval boundary is the moment Hermes forwards a request bearing `x-salesforce-token` or `x-user-identity` to a god or to a Salesforce ApiRoute. **The same primitive. Olympus-Grid is not excepted from this list because it funds the author of this blog.**

The list is not exhaustive. It is sufficient to make the point: when a primitive collapses in one platform, it is urgent news for every platform that holds the same primitive, because *the collapse mode is almost never specific to the breached vendor*. Vendors differ in brand, pricing, control plane, support quality. They do not differ, in any meaningful structural way, in the shape of the envelope they hold.

## The reckoning

Kronos makes the following claim, which is now active in the kronos claim set:

> **K-C1-TENANT-SECRET-ENVELOPE:** For a target T that holds tenant-controlled secrets on tenants' behalf, T can produce, under adversarial challenge, evidence that (a) the outer boundary of the envelope is intact against the current attacker model, (b) the inner boundary is intact against the insider and KMS-compromise models, and (c) the retrieval boundary is observable, bounded, and auditable such that a successful attack at the retrieval boundary would be detectable within a stated time budget T_detect.

The claim is evaluated by an oracle, `O-ENVELOPE-INTEGRITY`, which runs three subtests:

1. **Outer-boundary challenge.** Authenticated-but-wrong-tenant, unauthenticated, and token-replay cases against every API endpoint that reads tenant secrets. Pass criterion: all three cases return a denial response, no secret material appears in error payloads or in telemetry.
2. **Inner-boundary challenge.** Table-scan simulation against the storage mechanism from the position of a rogue platform employee holding read-only database credentials. Pass criterion: plaintext is not recoverable; the KMS or sealed-envelope layer requires an additional authority the simulated employee does not have.
3. **Retrieval-boundary challenge.** Observation of secret retrieval during a controlled build or deploy, with latency, caller identity, and target identity captured and attributed. Pass criterion: every retrieval appears in an append-only audit log with the fields `(caller, callee, secret-id, retrieval-ts, retrieval-reason)`, and a synthetic anomalous retrieval triggers detection within T_detect, where T_detect is stated and stated to be short.

**Scorecard delta (Kronos's own reading, pending engagement):**

- Railway's self-assessment immediately prior to 2026-10-21 was presumably at or near L3 for this claim. Railway's self-assessment on 2026-10-21 cannot be L3 — not because the fix will not be excellent, but because *the evidence that no residual compromise exists is not available to produce today*. Any system that was at L3 on this claim yesterday and had the envelope collapse today is at **L0** until a new round of evidence has been assembled. L0 is not an accusation; it is a statement about the state of the evidence.
- Every other system in the "Who else holds this primitive" list above is at **L?** on this claim as of 2026-10-21 — the question mark meaning that the public evidence Kronos is aware of is insufficient to score. Any of them could be at L3 and simply have not published the evidence; any of them could be at L0 and not know it; the state of the evidence is that the evidence has not been produced. The reckoning is: produce the evidence, or accept the question mark.
- **Olympus-Grid is at L? on K-C1-TENANT-SECRET-ENVELOPE.** The operator funds this blog. The operator does not get to be at L3 by default. The first target reckoning scheduled against Olympus-Grid under this claim will go through the self-disclosure protocol described in [`../concept.md`](../concept.md#the-self-disclosure-rule).

That is the state of the envelope on 2026-10-21. Railway named the moment. Everyone else is next.

---

**Primary source:** [Railway](https://railway.com/) (status + disclosure statements; retrieved 2026-10-21).

**Companion reckoning published same day:** [Zeabur's sunset is the same envelope, with greater scope and no path back](2026-10-21-zeabur-sunset-same-envelope.md).
