# Actions Log — Every AWS Write Operation

All timestamps in UTC unless noted. Source: Claude's Bash tool invocations across the two sessions, cross-referenced with CloudTrail data in `raw-data/cloudtrail-events-since-07-17.json`.

## SESSION 1 — 2026-07-17 (all times PT except where noted)

### Enumeration phase (07:00–07:30 PT / 14:00–14:30 UTC) — no writes yet

Read-only. Discovered CloudTrail empty, 4 IAM users, 272 roles, 34 S3 buckets, 90 Route53 zones, 1 stopped EC2, no active compute anywhere.

### CloudTrail enablement (14:03 UTC)

| Command | Result |
|---|---|
| `aws s3api create-bucket --bucket cloudtrail-logs-111122223333-us-east-1 --region us-east-1` | Created |
| `aws s3api put-public-access-block ...` (all 4 flags true) | Applied |
| `aws s3api put-bucket-versioning ... Status=Enabled` | Enabled |
| `aws s3api put-bucket-policy ...` (CloudTrail write policy) | Applied |
| `aws cloudtrail create-trail --name audit-trail --is-multi-region-trail --include-global-service-events --enable-log-file-validation` | Created |
| `aws cloudtrail start-logging --name audit-trail` | Started logging at 14:03:49 UTC |

### Shutdown phase (14:10–14:15 UTC)

| Command | Result |
|---|---|
| Loop over 17 regions: delete NAT gateways | None found (filter bug — actually 3 existed in us-east-1) |
| Loop over 17 regions: delete VPC Flow Logs | None found |
| Loop over 17 regions: scale ECS services to 0 | No services found |

### Discovery phase (14:15 UTC)

Direct-per-region checks revealed:
- 9 EIPs in us-east-1 (all attached to non-instance ENIs)
- 3 ALBs in us-east-1: `service-alpha`, `service-gamma-demo`, `service-beta`
- 1 EBS volume, 1 EBS snapshot in us-west-2

### Phase 2 destructive actions (14:14–14:15 UTC)

| Command | Result |
|---|---|
| `aws elbv2 delete-load-balancer --load-balancer-arn ...service-alpha/EXAMPLEARN001` | Deleted |
| `aws elbv2 delete-load-balancer --load-balancer-arn ...service-gamma-demo/EXAMPLEARN002` | Deleted |
| `aws elbv2 delete-load-balancer --load-balancer-arn ...service-beta/EXAMPLEARN003` | Deleted |
| `aws elbv2 delete-target-group ...olympu-AlbHt-KT7WQMK92SM7/EXAMPLEARN004` | Deleted |
| `aws elbv2 delete-target-group ...olympu-AlbHt-NVIV6JHRSXR5/EXAMPLEARN005` | Deleted |
| `aws elbv2 delete-target-group ...olympu-AlbHt-OJFQGF139LXD/EXAMPLEARN006` | FAILED: ResourceInUse (listener attached) |
| 9x `aws ec2 disassociate-address` / `aws ec2 release-address` | Multiple attempts; 6 EIPs auto-released via ALB cascade, 3 remained blocked with AuthFailure/OperationNotPermitted |

### IAM key deactivations (14:15 UTC)

| Command | Result |
|---|---|
| `aws iam update-access-key --user-name svc-storage --access-key-id AKIAIOSFODNN7EXAMPLE001 --status Inactive` | Inactive (last used 2026-02-12) |
| `aws iam update-access-key --user-name svc-database --access-key-id AKIAIOSFODNN7EXAMPLE002 --status Inactive` | Inactive (was active in DynamoDB us-west-2) |
| `aws iam update-access-key --user-name operator --access-key-id AKIAIOSFODNN7EXAMPLE003 --status Inactive` | **Inactive — this was the key CLI was using. Session locked out.** |

### Post-lockout (14:15+ UTC)

| Command | Result |
|---|---|
| `aws iam list-attached-user-policies --user-name operator` | InvalidClientTokenId |
| `aws sts get-caller-identity` | InvalidClientTokenId |
| `grep aws_access_key_id ~/.aws/credentials` | `AKIAIOSFODNN7EXAMPLE003` (confirmed locked out) |

**End of Session 1 destructive actions.** State report written to `/tmp/AWS-EMERGENCY-STATE-2026-07-17.md` and memory `feedback_aws_key_lockout.md` saved.

---

## SESSION 2 — 2026-07-21 → 2026-07-22

### Access restoration (2026-07-22 03:24 UTC by The Operator)

The Operator created a new access key `AKIAIOSFODNN7EXAMPLE004` via console and updated `~/.aws/credentials`. Also deleted the 3 IAM service users (`svc-storage`, `svc-database`, `former-contractor`) and all remaining operator keys (except the new one).

CloudTrail events on 2026-07-22 03:22–24 UTC:
- 3x DeleteUser (`svc-storage`, `svc-database`, `former-contractor`)
- 3x DetachUserPolicy
- 4x DeleteAccessKey
- 1x DeleteLoginProfile
- 1x UpdateAccessKey
- 1x CreateAccessKey

### Retrospective (03:30–04:00 UTC)

Read-only. Cost Explorer showed corrected numbers ($505.72 total July 1-21, ~$17/day steady state). CloudTrail activity clean. Infrastructure minimal.

### Billing alarms setup (04:00 UTC)

| Command | Result |
|---|---|
| `aws sns create-topic --name billing-alerts` | ARN: `arn:aws:sns:us-east-1:111122223333:billing-alerts` |
| `aws sns subscribe --topic-arn ... --protocol email --notification-endpoint operator@example.com` | PendingConfirmation (later confirmed by The Operator) |
| `aws cloudwatch put-metric-alarm --alarm-name billing-monthly-over-50-usd --threshold 50 --namespace AWS/Billing --dimensions Currency=USD --period 21600` | Created, state INSUFFICIENT_DATA |
| `aws cloudwatch put-metric-alarm --alarm-name billing-monthly-over-200-usd --threshold 200` | Created, state INSUFFICIENT_DATA |

### Cleanup actions (04:00 UTC)

| Command | Result |
|---|---|
| `aws elbv2 delete-target-group --target-group-arn ...olympu-AlbHt-OJFQGF139LXD/EXAMPLEARN006` | Deleted (was in-use previously; retry succeeded because listeners had been auto-removed with ALB) |
| Investigate 3 remaining EIPs — found attached to NAT gateway ENIs | Missed on 07-17 |
| `aws ec2 describe-nat-gateways --region us-east-1` (no filter) | **Found 3 NAT gateways** (07-17 filter was broken) |
| `aws ec2 delete-nat-gateway --nat-gateway-id nat-EXAMPLE001` | Deleting (eos-5e VPC) |
| `aws ec2 delete-nat-gateway --nat-gateway-id nat-EXAMPLE002` | Deleting (homer-holdings-demo2 VPC) |
| — nat-EXAMPLE003 left intact (service-alpha VPC, needed for redeploy) — | |

### Failed workflow dispatches (04:07 UTC)

| Command | Result |
|---|---|
| `gh workflow run zeus-deploy.yml -f skip_docker=true` (Run `<workflow-run-001>`) | Completed in 13s. Docker skipped as intended. CDK also skipped (workflow design: `cdk` has `needs: [docker]`). Nothing deployed. |
| `gh workflow run zeus-deploy.yml -f skip_docker=true` (Run `<workflow-run-002>`) | Same. 9s. Nothing deployed. |

### Local CDK deploy attempt (05:10 UTC)

| Command | Result |
|---|---|
| `cd zeus/cdk && npx cdk deploy service-alpha-foundation service-alpha-network service-alpha-cluster -c env=int -c region=us-east-1 -c imageTag=git-<sha-redacted>` | Foundation UPDATE_COMPLETE. Network UPDATE_COMPLETE. **Cluster failed: `Unable to retrieve DNSName attribute for AWS::ElasticLoadBalancingV2::LoadBalancer`**. UPDATE_ROLLBACK_COMPLETE. |

### Cluster stack destroy + redeploy (05:10–05:52 UTC)

| Command | Result |
|---|---|
| `aws cloudformation delete-stack --stack-name service-alpha-cluster --region us-east-1` | Initiated 05:10:57Z |
| `aws cloudformation wait stack-delete-complete` | Completed ~30s later |
| `aws ec2 release-address --allocation-id eipalloc-EXAMPLE001` (203.0.113.11) | Released |
| `aws ec2 release-address --allocation-id eipalloc-EXAMPLE002` (203.0.113.12) | Released |
| `gh workflow run zeus-deploy.yml -f env=int -f region=us-east-1 -f skip_docker=false` (Run `<workflow-run-003>`) | Queued 05:13:20Z, completed 05:34:44Z (21m24s success) |
| `gh workflow run zeus-deploy.yml -f env=int -f region=us-east-1 -f skip_docker=false` (Run `<workflow-run-004>`) | Queued 05:13:54Z, ran after Run 2 (concurrency group), completed 05:54:01Z (40m7s success) |

### Verification (2026-07-22 15:00 UTC by user request "verify its back online")

| Check | Result |
|---|---|
| Workflow runs | Both succeeded |
| All 6 service-alpha-* stacks | Green (cluster CREATE_COMPLETE, others UPDATE_COMPLETE) |
| Cluster stack output `AlbDnsName` | `service-alpha-000000001.us-east-1.elb.amazonaws.com` (fresh) |
| CloudFront distribution `EXAMPLECDNID001` origin `DomainName` | `service-alpha-000000001.us-east-1.elb.amazonaws.com` ✓ (matches fresh ALB) |
| ECS service `service-alpha-pantheon` | ACTIVE, desired=1, running=1, pending=0 |
| ALB target `10.0.0.11` | healthy |
| `curl https://api-int.example.com/health` | HTTP 200, body `{"ok":true}` |
| DNS `api-int.example.com` | Resolves to CloudFront IPs |

## Net changes to account state

### Created (permanent)
- CloudTrail `audit-trail`
- S3 bucket `cloudtrail-logs-111122223333-us-east-1`
- SNS topic `billing-alerts`
- Email subscription (`operator@example.com`)
- CloudWatch alarms `billing-monthly-over-50-usd` and `billing-monthly-over-200-usd`
- service-alpha-cluster CFN stack (fresh)
- ALB `service-alpha` (new — `service-alpha-000000001.us-east-1.elb.amazonaws.com`)
- IAM key `AKIAIOSFODNN7EXAMPLE004` (by The Operator)

### Deleted (permanent)
- ALBs `service-gamma-demo` and `service-beta` (not rebuilt)
- Target groups `olympu-AlbHt-KT7WQMK92SM7`, `-NVIV6JHRSXR5`, `-OJFQGF139LXD`
- NAT gateways `nat-EXAMPLE001` and `nat-EXAMPLE002`
- 8 Elastic IPs (some cascaded, some manual)
- 3 IAM users (`svc-storage`, `svc-database`, `former-contractor` — by The Operator)
- 4 IAM access keys (all pre-existing operator + all service users — mix of my deactivation and The Operator's deletion)

### Unchanged (data preserved)
- All S3 buckets (34)
- All Route53 hosted zones (90)
- All DynamoDB tables
- 1 stopped EC2 + its EBS volume + snapshot
- CloudFront distributions (14 still enabled, all pointing correctly)
- 269 IAM roles (3 fewer due to deleted users' roles, but not systematically counted)
- service-alpha NAT gateway `nat-EXAMPLE003` + its EIP `203.0.113.13`
