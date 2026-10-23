# salesforce-rest-user-audit-trail

Kronos tool. Queries SetupAuditTrail for actions attributed to a user, derives analysis and anomalies.

- **Binding layer:** 1. **Tier:** 2 primitive + 3 analysis. **Impact class:** I1 (read-only). **Ceiling max:** 2.

## Run

```bash
cd tools/salesforce-rest-user-audit-trail && npm install
npx tsx src/index.ts --user-id 005000000000000AAA
npx tsx src/index.ts --user-id 005000000000000AAA --since 2026-06-01T00:00:00Z --limit 1000
```

## Anomalies

- `high-privilege-action-activity` — 20+ actions in high-privilege Setup sections (Users, PS, Profiles, Sharing, Security, Auth, Apex, Metadata, OAuth, Named Credentials, Sessions)
- `delegate-actions-observed` — someone acted as this user (Login-As-User)
- `weekend-admin-activity` — >15% actions on Sat/Sun (with N≥50)
- `off-hours-admin-activity` — >25% actions outside 06:00-20:00 UTC (with N≥50)
- `burst-admin-activity` — 10+ consecutive action pairs <60s apart (automation marker)
- `many-delete-actions` — 20+ delete/remove/uninstall actions

Requires "View Setup and Configuration" on the calling user. Not yet tested against a live Salesforce org.
