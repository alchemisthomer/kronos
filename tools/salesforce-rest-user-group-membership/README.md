# salesforce-rest-user-group-membership

Kronos tool. Traverses the Salesforce group graph from a target user's perspective — direct memberships, transitive membership via nested public groups, and Queue-to-sobject mapping.

- **Binding layer:** 1. **Tier:** 2 primitive + 3 analysis. **Impact class:** I1 (read-only). **Ceiling max:** 2.

## Why this tool exists

`salesforce-rest-user-shares` sees the user's DIRECT group memberships and the record-share consequences. This tool answers the deeper question: *how far does the user's group graph reach?*

Public groups in Salesforce can nest — group A can include group B, which includes group C. A user who is in group C is effectively also in A and B. This has cascading consequences for share-based access (a record shared with A is visible to the user via three hops).

This tool BFS-traverses that graph up to a configurable depth and surfaces the effective group inventory. Also maps each Queue membership to the sobjects that queue works with, revealing which sobjects the user can act on via queue-based workflows.

## Install & run

```bash
cd tools/salesforce-rest-user-group-membership
npm install
npx tsx src/index.ts --user-id 005000000000000AAA
npx tsx src/index.ts --user-id 005000000000000AAA --max-transitive-depth 10
```

## Analysis dimensions

- **Direct group memberships** — from `GroupMember`.
- **Transitive group memberships** — BFS through `GroupMember WHERE UserOrGroupId IN (:current_frontier)` until no new groups found or depth cap hit. Each transitive group records its depth and the group Id(s) that reached it.
- **Queues** — subset of memberships with `Type='Queue'`, plus `QueueSobject` rows mapping each queue to its target sobject(s).
- **Anomalies:** `deep-transitive-group-graph`, `very-high-total-group-count`, `org-wide-group-membership`, `high-queue-membership`, `group-includes-role-bosses`.

## Version

Tool version 0.1.0. Not yet tested against a live Salesforce org.
