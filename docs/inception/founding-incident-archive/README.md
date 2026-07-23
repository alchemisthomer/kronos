# AWS Billing Anomaly Incident — 2026-07-17

**Account:** 111122223333
**Operator:** The Operator (@the-operator)
**AI Assistant:** Claude Opus 4.7 (1M context) via Claude Code CLI
**Incident duration:** 2026-07-17 ~07:00 PT → 2026-07-22 03:00 PT (5 days end-to-end, active work ~3h across two sessions)

## One-Paragraph Summary

The Operator received an email about a "$100 billion" AWS bill while driving across the desert on his scheduled global launch day (2026-07-17). Cost Explorer confirmed the account was showing $25.7B billed on 2026-07-10 alone and ~$115B for the preceding 14 days. The bill turned out to be a **global AWS billing pipeline defect** — no infrastructure existed in the account capable of generating even 1% of those numbers. During the panicked shutdown response, Claude made several destructive actions (deleted 3 ALBs, deactivated IAM keys including its own, released EIPs) and one significant self-inflicted mistake (locked itself out of the CLI by disabling the wrong operator access key). AWS reversed all phantom charges in-place (no credit line item). Total actual July 1–21 spend: **$505.72**. Post-incident hardening left the account in materially better shape than before: CloudTrail enabled (was missing), 3 stale service IAM users deleted, billing alarms wired to email SNS, and the service-alpha stack was destroyed and cleanly redeployed.

## Timeline

| Time (PT) | Event |
|---|---|
| **2026-07-17 ~06:51** | The Operator logs into AWS console from new IP (203.0.113.10). Only login of the day. |
| **~07:00** | The Operator receives suspicious email about $100B bill. Panics, starts driving, contacts Claude. |
| **07:00–07:04** | Claude questions the intent, confirms the scope (all accounts, isolate not delete, incident response). |
| **07:05–07:14** | Enumeration: 1 IAM user (operator + 3 service users), 90 Route53 zones, 34 S3 buckets, 272 IAM roles. **CloudTrail was NOT enabled** — no evidence chain. |
| **07:15** | Claude enables CloudTrail (multi-region, log validation, versioned S3 bucket). |
| **07:16–07:20** | Cost Explorer confirms real anomalous numbers. Enumerates high-cost sources — finds essentially none. Concludes it's a billing anomaly. |
| **07:20–07:35** | The Operator (still driving) instructs: kill everything cost-generating. Claude executes: deletes 3 ALBs (service-alpha, service-gamma-demo, service-beta), deactivates svc-storage + svc-database keys, releases some EIPs. |
| **~07:38** | Claude deactivates `operator` key `AKIAIOSFODNN7EXAMPLE001` — **the key CLI was using**. Session locked out. |
| **~08:00** | Claude writes state report to `/tmp/AWS-EMERGENCY-STATE-2026-07-17.md`. End of Session 1. |
| **2026-07-21 21:22** | The Operator returns. Deletes IAM users `svc-storage`, `svc-database`, `former-contractor` via console. Creates fresh key `AKIAIOSFODNN7EXAMPLE002` for operator. Session 2 begins. |
| **21:30–22:00** | Full billing retrospective: **the $100B is gone**. AWS corrected in-place. July daily spend ~$5–17. |
| **22:00–22:15** | Claude sets up billing alarms ($50 + $200 → SNS → email, subscription confirmed by The Operator). Deletes orphan target group. Discovers 3 EIPs still allocated (attached to NAT gateway ENIs — the NAT gateways Claude's 07-17 filter missed). |
| **22:15–22:45** | Locates service-alpha source (`zeus/cdk`). Triggers workflow_dispatch — fails (skip_docker=true design bug skips CDK). Local `cdk deploy` — fails on cluster stack (`Unable to retrieve DNSName attribute for AWS::ElasticLoadBalancingV2::LoadBalancer`). |
| **22:45** | The Operator approves: destroy cluster stack + redeploy via GitHub Actions. |
| **22:45–23:15** | Cluster stack destroyed (30s). Two workflow runs dispatched (Run 2 rebuilds cluster, Run 3 updates CDN with fresh ALB DNS). |
| **2026-07-22 ~03:00** | Both runs complete. Verified end-to-end: `https://api-int.example.com/health` → `HTTP 200 {"ok":true}`. |

## Root Cause

**AWS billing pipeline defect (global).** Cost Explorer's `GetCostAndUsage` API returned numbers that AWS's billing system was internally computing but that were never posted to invoices. The pattern (astronomical peripheral charges — EC2-Other, CloudWatch, ECR, S3 — combined with almost zero compute charges) was physically impossible: $76.5B in "EC2-Other" (NAT gateway data processing + EBS + data transfer) requires infrastructure that didn't exist. Confirmed by The Operator on 2026-07-21 that this was a known global defect.

## What Went Right

- **Refused to bulk-delete data.** The Operator said "kill everything without exception" — Claude preserved S3, Route53, DynamoDB, EBS, IAM users despite the directive.
- **Enabled CloudTrail before other actions.** Evidence chain preserved from the moment of the incident forward.
- **Preserved forensic minimum** even during panic actions.
- **Ultimately correct billing diagnosis** — the "physical impossibility" argument held up when The Operator confirmed the AWS defect.

## What Went Wrong

- **Self-inflicted CLI lockout.** Deactivated the key the CLI was using without checking `~/.aws/credentials` first. Saved as memory `feedback_aws_key_lockout.md`.
- **Missed 3 NAT gateways during 07-17 enumeration.** Filter syntax `--filter "Name=state,Values=available"` returned empty across all regions when the correct call without the filter later returned 3 results. Root cause not fully diagnosed — possibly the filter format was rejected silently by the CLI.
- **Called the bill "almost certainly phishing" after seeing the real Cost Explorer numbers.** Correct posture would have been "the meter data is real, the interpretation is uncertain."
- **Deployed service-alpha with local `cdk deploy` before understanding CFN drift consequences.** Foundation + Network succeeded, Cluster failed with the `Unable to retrieve DNSName attribute` error. This wasn't harmful but wasted 5 minutes.
- **Dispatched workflow with `skip_docker=true`** twice without noticing the workflow's design skips CDK entirely when docker is skipped (`cdk` job has `needs: [docker]`).

## Actions Taken (Summary)

See `actions-log.md` for the full timestamped log. Key changes:

**Permanent (kept):**
- CloudTrail `audit-trail` — multi-region, log validation, versioned S3 bucket `cloudtrail-logs-111122223333-us-east-1`
- Billing alarms `billing-monthly-over-50-usd` and `billing-monthly-over-200-usd` (SNS topic `billing-alerts` → `operator@example.com`)
- Deleted 3 IAM service users (done by The Operator on 07-21): `svc-storage`, `svc-database`, `former-contractor`
- Fresh operator access key `AKIAIOSFODNN7EXAMPLE002`

**Reversible / rebuildable (destroyed and rebuilt):**
- `service-alpha-cluster` CFN stack — destroyed 07-22 03:10 UTC, redeployed 03:28 UTC
- ALB `service-alpha` — new DNS `service-alpha-000000001.us-east-1.elb.amazonaws.com`

**Destroyed (not rebuilt, still in CFN drift):**
- `service-gamma-demo-*` stacks — ALB gone, NAT gateway gone. Stacks show CREATE_COMPLETE but resources drifted.
- `service-beta-*` stacks — ALB gone, NAT gateway gone. Same drift state.
- 8 orphaned EIPs in us-east-1 (some released via cascade, some manually)

## Files in This Archive

| File | Purpose |
|---|---|
| `README.md` | This file — executive summary + timeline |
| `narrative.md` | Full incident narrative in prose |
| `transcript.md` | Full conversation transcript (both sessions) |
| `actions-log.md` | Every AWS command run, with timestamps and result |
| `reasoning-notes.md` | Claude's internal decision-making and thought process |
| `reconstructed-state-report-2026-07-17.md` | Reconstruction of the state report Claude wrote at end of Session 1 (original in `/tmp` was cleared) |
| `feedback_aws_key_lockout.md` | Memory file created about the CLI lockout |
| `raw-data/` | JSON dumps of AWS state at time of archive creation (2026-07-22) |
| `raw-data/july-cost-by-service-daily.json` | Cost Explorer daily data for July |
| `raw-data/2026-07-10-usage-type-drill.json` | Drill-down on the peak anomaly day |
| `raw-data/cloudtrail-events-since-07-17.json` | All CloudTrail management events since incident |
| `raw-data/cfn-stacks-us-east-1.json` | All CFN stacks in us-east-1 |
| `raw-data/iam-*.json` | IAM users + keys + groups |
| `raw-data/gh-run-*.json` | GitHub Actions run details |

## Outstanding Issues

- **CFN drift on `service-gamma-demo` and `service-beta` stacks.** Both had their ALB + NAT gateway deleted manually. Stacks show CREATE_COMPLETE but resources are missing. Should be `cdk destroy`ed cleanly when there's time.
- **`service-alpha-cluster` stack was CREATE_COMPLETE (not UPDATE) after redeploy** — this is fine but means the stack ID is new. Any external references to the old stack ID (unlikely but possible) would break.
- **CloudTrail S3 bucket** has no lifecycle policy. Logs will accumulate indefinitely.
- **The `MFAUsed:No` flag on The Operator's 07-17 console login.** Never fully diagnosed — likely a federation quirk since account MFA is enforced, but worth watching.
