# salesforce-rest-user-connected-apps

Kronos tool. Enumerates OAuth token grants and third-party account links for one Salesforce user.

- **Binding layer:** 1. **Tier:** 2 primitive + 3 analysis. **Impact class:** I1 (read-only). **Ceiling max:** 2.

Every active OAuth grant is a compromise vector — a stolen token bypasses password and 2FA. This tool surfaces:

- Every `OauthToken` for the user with app, last-used, use-count, created-date
- Every `ThirdPartyAccountLink` (SSO / social auth linkage)
- Per-app rollup with dev-tool identification (Workbench, Salesforce Inspector, Data Loader, Postman, VS Code, SFDX)
- 5 anomaly heuristics

## Run

```bash
cd tools/salesforce-rest-user-connected-apps && npm install
npx tsx src/index.ts --user-id 005000000000000AAA
```

## Anomalies

- `stale-oauth-token-accumulation` — 3+ tokens last used > 90 days ago
- `never-used-oauth-tokens` — 3+ tokens with UseCount=0 (abandoned auth attempts or recon)
- `high-use-external-app` — non-dev-tool app with 1000+ API calls (integration marker to verify)
- `developer-tool-oauth-grants` — Workbench/Inspector/etc grants (fine for admins, suspicious for end-users)
- `oauth-token-churn` — 5+ tokens for same app (session churn or leak-and-refresh pattern)

## Permissions

Requires "Manage OAuth Consumers" OR "View Setup and Configuration" to read OauthToken for other users. Own-user reads work by default.

Not yet tested against a live Salesforce org.
