# salesforce-rest-user-shares

Kronos tool. Enumerates the sharing grants that give one Salesforce user access to records beyond their explicit ObjectPermissions: role hierarchy, group memberships, and per-sobject `*Share` materialized grants.

- **Binding layer:** 1. **Tier:** 2 primitive + 3 analysis. **API family:** `salesforce.rest`. **Impact class:** I1 (read-only). **Ceiling max:** 2.

## Why this tool exists

`salesforce-rest-user-permissions` captures the **explicit** permission grants (Profile + PermissionSets + ObjectPermissions.ViewAllRecords). But a user's *effective record access* also includes **implicit** grants via:

- **Role hierarchy** — the user inherits access from records owned by users below them in the role tree, per role-based sharing rules.
- **Group membership** — records shared with a group are visible to every group member.
- **Manual shares** — records shared ad-hoc via the SFDC UI.
- **Sharing-rule cascade** — org-configured rules materialize `*Share` rows per record.

This tool surfaces the sharing side of the equation. Combined with `salesforce-rest-user-permissions`, the two tools give the complete authorization picture.

## Install & run

```bash
cd tools/salesforce-rest-user-shares
npm install

# Default: analyze shares for a user against Account, Contact, Lead, Opportunity, Case.
npx tsx src/index.ts --user-id 005000000000000AAA

# Include custom object shares (custom object share sobjects follow the __Share convention).
npx tsx src/index.ts --user-id 005000000000000AAA --sobjects "Account,MyCustomObject__c"

# Higher sample limit for large orgs.
npx tsx src/index.ts --user-id 005000000000000AAA --sample-limit 10000
```

## Analysis dimensions

- **Role hierarchy** — ascending chain (self → parents → root) + subordinate role Ids (roles below the user, whose owned records this user may see via RoleAndSubordinates rules).
- **Groups** — direct GroupMember entries with Type breakdown (Regular / Queue / Role / RoleAndSubordinates / etc.).
- **Sobject shares** — per-sobject share row count, unique records shared, RowCause distribution (Owner / Manual / Rule / GuestRule / Team / etc.), AccessLevel distribution (Read / Edit / All), recipient-kind breakdown (user vs group).
- **Totals** — aggregates for dashboard consumption.
- **Anomalies** — heuristics: `deep-role-parent-chain`, `broad-subordinate-visibility`, `high-group-membership-count`, `org-wide-group-membership`, `manual-share-heavy`, `share-sample-truncated`, `full-access-shares-broad`.

## Permission requirements

Reading `UserRole`, `GroupMember`, `Group`, and `*Share` sobjects typically requires "Manage Users" OR "View Setup and Configuration" permission on the calling user. If any query returns `INSUFFICIENT_ACCESS`, the tool emits an error run-manifest with that code — a valid finding about the calling identity.

## Version and provenance

- Tool version: **0.1.0**.
- Framework methodology: kronos v0.4.
- Golden-target conformance: **not yet verified**.
- **Not yet tested against a live Salesforce org.**
