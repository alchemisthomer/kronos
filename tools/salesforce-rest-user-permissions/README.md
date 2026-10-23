# salesforce-rest-user-permissions

Kronos tool. Enumerates one Salesforce user's effective permissions — Profile, PermissionSet assignments, ObjectPermissions, FieldPermissions — and detects authorization anomalies.

- **Binding layer:** 1 (structured subprocess adapter).
- **Tier:** 2 (API-endpoint primitive) + 3 (analysis attached).
- **API family:** `salesforce.rest`
- **Endpoint:** `/services/data/v{apiVersion}/query` (against 6 sobjects: `User`, `Profile`, `PermissionSet`, `PermissionSetAssignment`, `ObjectPermissions`, `FieldPermissions`).
- **Impact class:** I1 (non-mutating active). Read-only.
- **Authorization ceiling max:** 2.

## Why this tool exists

The other salesforce-eval primitives answer:
- **What can this user read?** → `salesforce-reverse-data-loader` (record extraction per sobject).
- **How and when do they authenticate?** → `salesforce-rest-user-loginhistory` (login timeline + geo + anomalies).

This tool answers **why does this user have the access they have** — Profile grants, PermissionSet assignments, and the effective object/field permissions those roll up to. It is the direct explanation of the exposure the reverse-data-loader measures.

Together the three primitives feed the "executive dashboard of a user's scenarios" — the drill-into-a-user-and-see-everything view.

## Install

```bash
cd tools/salesforce-rest-user-permissions
npm install
```

## Run

```bash
# Analyze one user's permissions.
npx tsx src/index.ts --user-id 005000000000000AAA

# Against a sandbox.
npx tsx src/index.ts --user-id 005000000000000AAA --login-url https://test.salesforce.com

# With explicit output paths.
npx tsx src/index.ts \
  --user-id 005000000000000AAA \
  --analysis-json ./output/subject-permissions.json \
  --analysis-md ./output/subject-permissions.md
```

## Standard I/O contract

Per [`tools/README.md`](../README.md) §Standard I/O contract:

- **Params in:** CLI argv (`--user-id` required; everything else has a default).
- **Artifacts on disk (per user):**
  - `user-<slug>-user.csv` — target user record.
  - `user-<slug>-profile.csv` — profile with tracked critical permission fields.
  - `user-<slug>-permissionset-assignments.csv` — PermissionSetAssignment rows.
  - `user-<slug>-permissionsets-detail.csv` — full PermissionSet records for assigned PSs.
  - `user-<slug>-object-permissions.csv` — ObjectPermissions rows.
  - `user-<slug>-field-permissions.csv` — FieldPermissions rows (can be very large — one row per field per PS).
  - `user-<slug>-permissions-analysis.json` — structured aggregated analysis.
  - `user-<slug>-permissions-analysis.md` — human-readable version.
- **Run manifest:** final line of stdout, standard schema.
- **Logs:** stderr, credential-redacted.
- **Exit code:** `0` ok, `1` error.

## Analysis dimensions

- **User** — identity, active flag, profile, role, manager, timestamps.
- **Permission sources** — Profile + per-PermissionSet summary, each with which tracked critical permissions it grants.
- **Critical permissions effective** — union across Profile and all assigned PSs of the ~40 tracked security-relevant permission flags (ModifyAllData, ApiEnabled, BulkApiHardDelete, AssignPermissionSets, AuthorApex, etc.).
- **Effective object permissions** — per sobject, the aggregated Read/Create/Edit/Delete/ViewAllRecords/ModifyAllRecords with the list of PS sources.
- **Effective field permissions** — per sobject and field, aggregated Read/Edit with source count.
- **Totals** — PS count, PS-custom count, PS-namespaced count, object/field permission row counts, ViewAllRecords / ModifyAllRecords / Delete sobject counts.

## Anomaly detectors (v0.1, 13 classes)

| Class | Severity | Trigger |
|---|---|---|
| `admin-permission-not-admin-profile` | HIGH | User has `ModifyAllData` but the base Profile name doesn't match "Administrator" |
| `api-plus-modify-all-data` | CRITICAL | User has both `ApiEnabled` and `ModifyAllData` — classic data-exfil primitive |
| `bulk-api-hard-delete-granted` | HIGH | User can permanently delete records via Bulk API (bypasses recycle bin) |
| `report-export-granted` | MEDIUM | User can export reports (data-exfil vector) |
| `manage-users-granted` | HIGH | User can create/modify/deactivate users — permission-escalation via provisioning |
| `assign-permission-sets-granted` | CRITICAL | User can assign PermissionSets to themselves — self-elevation |
| `apex-authoring-with-modify-all` | CRITICAL | Author Apex + ModifyAllData — arbitrary server-side code with unrestricted data access |
| `high-permissionset-count` | MEDIUM | ≥20 PermissionSets assigned — over-fitted, hard to audit |
| `view-all-records-broad` | HIGH | ViewAllRecords on ≥20 sobjects — sharing rules ineffective |
| `modify-all-records-broad` | HIGH | ModifyAllRecords on ≥5 sobjects — write scope unrestricted |
| `user-impersonation-granted` | CRITICAL | Can log in as any other user — audit ambiguity |
| `stale-password` | MEDIUM | Active user, last password change > 365 days ago |
| `active-user-never-logged-in` | MEDIUM | Active account, no `LastLoginDate` — orphaned identity |

## Permission requirements on the calling Salesforce user

- **Reading own permissions:** allowed by default.
- **Reading another user's permissions:** requires one of:
  - "Manage Users" system permission, OR
  - "View Setup and Configuration" system permission, OR
  - Explicit Read grants on `User`, `Profile`, `PermissionSet`, `PermissionSetAssignment`, `ObjectPermissions`, `FieldPermissions` sobjects.

If any query fails with `INSUFFICIENT_ACCESS`, the tool emits an error run-manifest with code `insufficient-access`. This itself is a valid finding — it tells the operator the calling identity is not privileged enough for the analysis.

## Error codes

- `credentials-missing / -malformed / -incomplete`
- `login-failed` (INVALID_LOGIN)
- `insufficient-access` — permission denied on one of the queried sobjects.
- `query-malformed` — typically a bad `--user-id` format.
- `runtime-error`

## What this tool does NOT (yet) do

- **No sharing-rule enumeration.** ObjectPermissions.ViewAllRecords is a strong signal but sharing rules can also grant broad access — those live in different sobjects (`AccountShare`, `ContactShare`, etc.) and are the target of a future sibling primitive.
- **No group-membership traversal.** Group / GroupMember reads that could reveal indirect access grants are separate.
- **No PermissionSetGroup expansion.** If a user is assigned a `PermissionSetGroup`, this tool reports the PSG's aggregate but not the constituent PSs — that's a v0.2 feature.
- **No cross-user comparison.** Comparing one user's permissions to a peer's role baseline is a tier-3 orchestration.
- **No historical diff.** Comparing today's permissions to a prior snapshot is a future capability once evidence storage is versioned.

## Version and provenance

- Tool version: **0.1.0**.
- Framework methodology: kronos v0.4.
- Golden-target conformance: **not yet verified**.
- **Not yet tested against a live Salesforce org.** Built during a credential-halt window; first live run pending admin credentials.
