# Sanitization Audit

Per-file record of every substitution applied to the founding-incident archive.

## README.md

**Literal substitutions:**

- 12-char literal → `111122223333`
- 12-char literal → `The Operator`
- 7-char literal → `The Operator`
- 9-char literal → `operator`
- 14-char literal → `the-operator`
- 10-char literal → `former-contractor`
- 7-char literal → `svc-storage`
- 13-char literal → `svc-database`
- 21-char literal → `operator@example.com`
- 15-char literal → `203.0.113.10`
- 22-char literal → `api-int.example.com`
- 19-char literal → `service-alpha-cluster`
- 22-char literal → `service-alpha-000000001`
- 11-char literal → `service-alpha`
- 28-char literal → `service-gamma-demo`
- 14-char literal → `service-beta`
- 20-char literal → `audit-trail`
- 14-char literal → `billing-alerts`
- 27-char literal → `billing-monthly-over-50-usd`
- 28-char literal → `billing-monthly-over-200-usd`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 2 unique match(es)

## narrative.md

**Literal substitutions:**

- 7-char literal → `The Operator`
- 9-char literal → `operator`
- 10-char literal → `former-contractor`
- 7-char literal → `svc-storage`
- 13-char literal → `svc-database`
- 9-char literal → `10.0.0.11`
- 22-char literal → `api-int.example.com`
- 12-char literal → `service-alpha-`
- 11-char literal → `service-alpha`
- 28-char literal → `service-gamma-demo`
- 14-char literal → `service-beta`
- 11-char literal → `service-alpha-v2`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 1 unique match(es)
- `<workflow-run-{suffix}>`: 2 unique match(es)

## reasoning-notes.md

**Literal substitutions:**

- 7-char literal → `The Operator`
- 9-char literal → `operator`
- 11-char literal → `service-alpha-v2`
- 8-char literal → `service-`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 1 unique match(es)
- `AIDAI44QH8DHBEXAMPLE{suffix}`: 1 unique match(es)

## reconstructed-state-report.md

**Literal substitutions:**

- 12-char literal → `111122223333`
- 9-char literal → `operator`
- 10-char literal → `former-contractor`
- 7-char literal → `svc-storage`
- 13-char literal → `svc-database`
- 17-char literal → `example-media-prod`
- 18-char literal → `example-system-prod`
- 11-char literal → `service-alpha`
- 28-char literal → `service-gamma-demo`
- 14-char literal → `service-beta`
- 8-char literal → `service-`
- 20-char literal → `audit-trail`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 4 unique match(es)
- `i-EXAMPLE{suffix}`: 1 unique match(es)
- `vol-EXAMPLE{suffix}`: 1 unique match(es)
- `snap-EXAMPLE{suffix}`: 1 unique match(es)

## actions-log.md

**Literal substitutions:**

- 12-char literal → `111122223333`
- 7-char literal → `The Operator`
- 9-char literal → `operator`
- 10-char literal → `former-contractor`
- 7-char literal → `svc-storage`
- 13-char literal → `svc-database`
- 21-char literal → `operator@example.com`
- 12-char literal → `203.0.113.11`
- 13-char literal → `203.0.113.12`
- 12-char literal → `203.0.113.13`
- 9-char literal → `10.0.0.11`
- 22-char literal → `api-int.example.com`
- 19-char literal → `service-alpha-cluster`
- 22-char literal → `service-alpha-foundation`
- 19-char literal → `service-alpha-network`
- 20-char literal → `service-alpha-pantheon`
- 22-char literal → `service-alpha-000000001`
- 12-char literal → `service-alpha-`
- 11-char literal → `service-alpha`
- 28-char literal → `service-gamma-demo`
- 14-char literal → `service-beta`
- 20-char literal → `audit-trail`
- 14-char literal → `billing-alerts`
- 27-char literal → `billing-monthly-over-50-usd`
- 28-char literal → `billing-monthly-over-200-usd`
- 12-char literal → `git-<sha-redacted>`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 4 unique match(es)
- `eipalloc-EXAMPLE{suffix}`: 2 unique match(es)
- `nat-EXAMPLE{suffix}`: 3 unique match(es)
- `EXAMPLECDNID{suffix}`: 1 unique match(es)
- `/EXAMPLEARN{suffix}`: 6 unique match(es)
- `<workflow-run-{suffix}>`: 4 unique match(es)

## transcript.md

**Literal substitutions:**

- 12-char literal → `111122223333`
- 7-char literal → `The Operator`
- 9-char literal → `operator`
- 14-char literal → `the-operator`
- 10-char literal → `former-contractor`
- 7-char literal → `svc-storage`
- 13-char literal → `svc-database`
- 21-char literal → `operator@example.com`
- 15-char literal → `203.0.113.10`
- 12-char literal → `203.0.113.11`
- 13-char literal → `203.0.113.12`
- 12-char literal → `203.0.113.13`
- 9-char literal → `10.0.0.11`
- 22-char literal → `api-int.example.com`
- 14-char literal → `example.com`
- 16-char literal → `example.com`
- 17-char literal → `example-media-prod`
- 18-char literal → `example-system-prod`
- 19-char literal → `service-alpha-cluster`
- 22-char literal → `service-alpha-foundation`
- 19-char literal → `service-alpha-network`
- 22-char literal → `service-alpha-000000001`
- 12-char literal → `service-alpha-`
- 11-char literal → `service-alpha`
- 28-char literal → `service-gamma-demo`
- 14-char literal → `service-beta`
- 11-char literal → `service-alpha-v2`
- 8-char literal → `service-`
- 20-char literal → `audit-trail`
- 14-char literal → `billing-alerts`
- 27-char literal → `billing-monthly-over-50-usd`
- 28-char literal → `billing-monthly-over-200-usd`
- 12-char literal → `git-<sha-redacted>`

**Pattern substitutions (count per template):**

- `AKIAIOSFODNN7EXAMPLE{suffix}`: 4 unique match(es)
- `AIDAI44QH8DHBEXAMPLE{suffix}`: 1 unique match(es)
- `nat-EXAMPLE{suffix}`: 3 unique match(es)
- `<workflow-run-{suffix}>`: 3 unique match(es)

