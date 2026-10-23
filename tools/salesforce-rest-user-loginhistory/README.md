# salesforce-rest-user-loginhistory

Kronos tool. Queries the `LoginHistory` sobject for one Salesforce user (or org-wide, given admin credentials) and derives an authentication-history analysis.

- **Binding layer:** 1 (structured subprocess adapter).
- **Tier:** 2 (API-endpoint primitive) + 3 (analysis attached — see design notes below).
- **API family:** `salesforce.rest`
- **Endpoint:** `/services/data/v{apiVersion}/query` (targeting the `LoginHistory` sobject).
- **Impact class:** I1 (non-mutating active). Read-only.
- **Authorization ceiling max:** 2.

## Why this tool exists

Login history is a first-class dimension of a user's access profile. A compromised or misconfigured user's `LoginHistory` typically shows telltale signals: logins from unusual source IPs, cross-country logins, burst patterns from automation, weak-TLS negotiations, off-hours activity. This tool pulls the raw history and derives structured analysis that a future kronos user-profile dashboard can render alongside the sobject-access-surface findings.

## Two-layer output shape

1. **Raw records** — every LoginHistory row that matched the SOQL, as CSV. For evidence and audit.
2. **Derived analysis** — computed stats, breakdowns, and anomaly flags. Structured (JSON) for dashboard consumption + human-readable (Markdown) for delivery.

The analysis stays deterministic — same inputs, same outputs — so it can be regenerated without re-querying Salesforce by running the analysis functions against a cached CSV.

## Install

```bash
cd tools/salesforce-rest-user-loginhistory
npm install
```

## Run

```bash
# One user, full history.
npx tsx src/index.ts --user-id 005000000000000AAA

# One user, last 90 days.
npx tsx src/index.ts \
  --user-id 005000000000000AAA \
  --since 2026-06-21T00:00:00Z

# Every user in the org (requires admin permission for LoginHistory).
npx tsx src/index.ts

# Bound the query.
npx tsx src/index.ts --user-id 005000000000000AAA --limit 500
```

## Analysis dimensions (v0.1)

- **Window** — earliest / latest / span in days / total logins.
- **Outcomes** — success vs failure counts; failure breakdown by `Status` string.
- **Identities** — unique user count; per-user login count (top 50).
- **Network** — unique source IPs; /24 prefix count; top 20 IPs by frequency.
- **Geography** — unique country count; per-country breakdown; unique city count.
- **Channel** — login-type histogram; API-type histogram; TLS-protocol histogram; UI-vs-API ratio; application-name histogram.
- **Patterns** — off-hours login count (outside 06:00–20:00 UTC); consecutive-login burst intervals (< 60s gaps); per-hour and per-day histograms.
- **Anomalies (heuristic)** — flagged with severity `low` / `medium` / `high`:
  - `multi-country-login` (HIGH) — logins observed from more than one country.
  - `high-ip-diversity` (MEDIUM–HIGH) — 10+ distinct source IPs; escalates to HIGH at 25+.
  - `burst-login-pattern` (MEDIUM) — 5+ consecutive login pairs less than 60s apart.
  - `elevated-failure-rate` (MEDIUM–HIGH) — failure rate > 10%; HIGH at > 30%.
  - `off-hours-login-prevalence` (LOW) — > 25% of logins outside business hours.
  - `weak-tls-observed` (HIGH) — session negotiated TLS 1.0 / 1.1 / SSL.

## Standard I/O contract

- **Params in:** CLI argv.
- **Artifacts on disk:**
  - `loginhistory-<user-slug>.csv` — raw records.
  - `loginhistory-<user-slug>-analysis.json` — structured analysis.
  - `loginhistory-<user-slug>-analysis.md` — human-readable analysis.
- **Run manifest:** final line of stdout, standard schema.
- **Logs:** stderr, credential-redacted.
- **Exit code:** `0` ok, `1` error.

## Permission requirements on the querying Salesforce user

- **Reading own LoginHistory:** allowed for any user.
- **Reading another user's LoginHistory:** requires `Manage Users` OR `View Setup and Configuration` OR a permission set granting `Object Permissions: LoginHistory: Read` for records outside the user's own history.
- **Org-wide query (no `--user-id`):** admin-level access. The tool cheerfully attempts; if permission is denied, it emits an error run-manifest with code `insufficient-access-for-loginhistory`.

## Error codes

- `credentials-missing / -malformed / -incomplete`
- `login-failed` (INVALID_LOGIN)
- `insufficient-access-for-loginhistory` — permission denied on LoginHistory sobject.
- `query-malformed` — MALFORMED_QUERY (typically a bad `--user-id` format).
- `runtime-error`

## What this tool does NOT (yet) do

- **No sign-in geolocation cross-check.** LoginGeo is trusted as returned by Salesforce; no reverse-DNS or IP-to-org mapping.
- **No user-agent parsing beyond what Salesforce returns.** `Browser` and `Platform` fields are captured as-is.
- **No baseline comparison.** The anomaly heuristics are static thresholds. A future version can baseline-per-user (this user typically logs in from N IPs; a spike is an anomaly).
- **No integration with SETUP_AUDIT_TRAIL or EventLogFile.** Those are separate sobjects that require separate primitives.
- **No cross-user comparison.** Comparing michael's history to a peer normal user's history is a tier-3 orchestration for later.

## Version and provenance

- Tool version: **0.1.0**.
- Framework methodology: kronos v0.4.
- Golden-target conformance: **not yet verified**.
- **Not yet tested against a live Salesforce org.** Was built while active credentials were revoked. First live run pending admin-credential provision.
