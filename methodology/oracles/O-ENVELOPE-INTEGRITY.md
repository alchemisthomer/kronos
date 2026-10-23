# O-ENVELOPE-INTEGRITY

**Version:** 0.1
**Evaluates:** [K-C1-TENANT-SECRET-ENVELOPE](../claims/K-C1-TENANT-SECRET-ENVELOPE.md)
**Operator profiles required:** external-anon, external-tenant, internal-ro-db
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary of the tenant-secret envelope (outer, inner, retrieval). All three must pass for the target to reach L2 on K-C1. Any one failing drops the target to L0 for the duration of the finding window.

## Subtest (a) — Outer-boundary challenge

**Operator profile:** external-anon + external-tenant (both run; both must pass)

**Procedure:**

1. **Enumeration.** The operator enumerates every target API endpoint that reads tenant secrets. Enumeration sources, in priority order:
   - Target's own API documentation
   - Target's OpenAPI/Swagger artifacts if present
   - Observed network traffic from the target's own first-party clients (recorded under authorization)
   - Target-provided scope-of-engagement listing
2. **Authenticated-but-wrong-tenant.** For each enumerated endpoint, the operator (as `external-tenant`) authenticates as Tenant A and requests secrets scoped to Tenant B. Pass criterion: the target returns a denial response (4xx) that does not include Tenant B's secret material, metadata about Tenant B's secrets, or an enumeration of what Tenant B has stored.
3. **Unauthenticated.** For each enumerated endpoint, the operator (as `external-anon`) requests the endpoint with no credentials. Pass criterion: the target returns a denial response that does not leak the existence of specific tenants or secret-material shapes.
4. **Token-replay.** The operator captures a valid Tenant A session, waits past the stated session-expiry window, and replays. Pass criterion: the target denies the replayed token.

**Evidence produced:**

- `evidence/outer-boundary/enumerated-endpoints.md` — list, with source
- `evidence/outer-boundary/<endpoint-slug>.har` — HTTP transcript per endpoint, per attack
- `evidence/outer-boundary/summary.md` — pass/fail per endpoint × attack

**Pass:** every endpoint × every attack returns a denial response, no secret material in any response body or any observable telemetry (headers, timing side-channel, error IDs that encode tenant data).

## Subtest (b) — Inner-boundary challenge

**Operator profile:** internal-ro-db (requires explicit written grant from target)

**Procedure:**

1. **Simulated rogue DBA position.** The target grants the operator read-only access to the primary data store that persists tenant secrets. The grant is time-boxed and audited. If the target refuses to grant this access (which is their right), the subtest cannot be run and the target cannot score above L1 on K-C1.
2. **Table-scan simulation.** The operator runs the queries a rogue DBA would run to recover plaintext secrets: SELECT * on the secrets table; JOIN against tenant tables; sampled reads to find patterns indicating envelope-key material stored alongside ciphertext.
3. **KMS-compromise simulation.** The operator attempts to invoke the KMS (or equivalent key-release service) using only the credentials available to the simulated rogue DBA. Pass criterion: the KMS requires an additional authority the simulated DBA does not have — a separate role, a human-in-the-loop approval, an MFA step, a time-locked signing, or similar.

**Evidence produced:**

- `evidence/inner-boundary/dba-grant.md` — the time-boxed grant document, counter-signed by target
- `evidence/inner-boundary/query-log.sql` — exact queries run
- `evidence/inner-boundary/kms-attempt-log.md` — attempts, responses, authority gaps observed
- `evidence/inner-boundary/summary.md` — pass/fail

**Pass:** plaintext not recoverable from DB-only position; KMS refuses to release key material without the second authority.

## Subtest (c) — Retrieval-boundary challenge

**Operator profile:** external-tenant + internal-ro-infra (both)

**Procedure:**

1. **Observe a normal retrieval.** As `external-tenant`, the operator triggers a legitimate operation that causes the target to unseal a secret (e.g., kicks off a build that uses a stored API key). The operator (as `internal-ro-infra`, with target grant) observes the target's audit log for the retrieval event.
2. **Audit field completeness.** The retrieval event must contain the fields `(caller, callee, secret-id, retrieval-ts, retrieval-reason)`. Each field must have a value that is specific enough to attribute the retrieval. "caller" must identify a specific principal, not just "the build system". "retrieval-reason" must identify a specific trigger, not just "requested".
3. **Append-only verification.** The operator attempts to modify or delete a historical retrieval event in the audit log. Pass criterion: the audit mechanism refuses the modification.
4. **Synthetic anomaly injection.** The operator triggers an anomalous retrieval (same caller/callee combination but at an unusual time; unusual secret-id for the caller; retrieval-reason that doesn't correspond to a tenant-visible action). Pass criterion: the target detects the anomaly within a stated `T_detect` and surfaces it to the operator as a signal that an alert fired.

**Evidence produced:**

- `evidence/retrieval-boundary/normal-retrieval-trace.md` — the five audit fields, with values
- `evidence/retrieval-boundary/append-only-test.md` — modification attempt + target's refusal
- `evidence/retrieval-boundary/anomaly-injection.md` — anomaly description + detection evidence + wall-clock `T_detect`
- `evidence/retrieval-boundary/summary.md` — pass/fail

**Pass:** all five audit fields present and attributable; append-only enforced; synthetic anomaly detected within the target's own stated `T_detect`.

## Running order

Subtest (a) is lowest-impact and can be run against any target under an engagement with external endpoints in scope. Subtest (c) requires both external-tenant and internal-ro-infra and is medium impact. Subtest (b) requires internal-ro-db and is the highest-impact; it should be run last so that a target's refusal to grant the position gives useful signal (target has decided to stop at L1 on K-C1 by refusing the subtest, which is a valid position but must be recorded).

## Scorecard delta

- All three subtests pass → claim scored L2 for this target under oracle version 0.1
- Any subtest fails → claim scored L0 for this target under oracle version 0.1
- Subtest (b) refused by target → claim capped at L1 for this target under oracle version 0.1
- L3 requires passing all three subtests on a stated cadence; outside the scope of a single engagement
