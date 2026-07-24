# {engagement title}

> File name: `<target-slug>.kronos-<N>.md` — the Nth kronos engagement against `<target-slug>`. For sub-engagements (re-verification of prior findings), use `<target-slug>.kronos-<N>.<M>.md`.

| | |
|---|---|
| **Target slug** | `<target-slug>` |
| **Engagement ordinal** | `kronos-N` (Nth engagement against this target) |
| **Status** | `Scoped` / `Authorized` / `Planning` / `Ready` / `Running` / `Evidence` / `Shipped` / `Aborted` |
| **Opened** | YYYY-MM-DD |
| **Closed** | YYYY-MM-DD (or `—`) |
| **Prior engagement** | `<target-slug>.kronos-<N-1>` (`—` if first against this target) |
| **Mode** | `red-team` / `black-box` / `gray-box` / `assertion-harness` / `destructive-load` / `data-pollution` / `backend-flooding` / `social-engineering` / `supply-chain` / `insider-simulation` / `cost-adversarial` / `compliance-drift` / `recovery-adversarial` (comma-separated if multiple) |
| **Environment** | `production` / `staging` / `isolated-test` |
| **Execution policy** | `passive` / `impact-bounded` / `campaign-complete` (per ADR-0014) |
| **Stop condition (if impact-bounded)** | `first-signal-stop` / `matrix-complete` / `impact-budget-exhausted` |
| **Catalog version** | `kronos-catalog-YYYY.MM.DD` (the threat catalog version this engagement is pinned against) |
| **Theme** | one-line summary (e.g., "verify origin-secret zero-leak against attacker-owned CloudFront") |
| **Estimated effort** | Nh |
| **Actual effort** | Nh (filled at closeout) |

---

# § Approver-authored (top half — governance)

## §1 Target boundary

Which system is under evaluation, which surfaces are in scope, which credentials the engagement is granted, and everything explicitly out of scope.

- **In scope:** {hosts, paths, services, accounts, regions, credentials granted}
- **Out of scope:** {everything else, explicitly enumerated where ambiguity exists}
- **Human targets:** {none / list of individuals whose participation is authorized, with their employer-of-record confirmation reference}

## §2 Authorization artifact

The signed record that unlocks execution. This section is either an inline authorization block or a reference to an external artifact hash. See ADR-0009 for the design rationale.

```yaml
authorizationId: KRA-YYYY-NNNNNN
issuedAt: YYYY-MM-DDTHH:MM:SSZ
expiresAt: YYYY-MM-DDTHH:MM:SSZ
issuedBy: {approver identity}
approverSignature: {GPG signature or externally-verifiable equivalent}
target:
  slug: {target-slug}
  hostnames:
    - {hostname}
  cloudAccounts:
    - {provider}: {account-id}
  environments:
    - {environment}
permissions:
  # Three-axis authorization model (v0.2 per ADR-0016 and ChatGPT P0-7).
  # The v0.1 single-axis authorizationCeiling is decomposed into three
  # orthogonal axes so that a "destructive test in staging with a hardened
  # executor" is distinguishable from "passive test in production with a
  # local process executor" — the two are different risk shapes.
  impactClass: {I0-I4}                  # I0=passive, I1=non-mutating active, I2=bounded reversible mutation,
                                         # I3=disruptive/destructive, I4=irreversible or human-impacting
  environmentClass: {E0-E4}             # E0=synthetic, E1=isolated lab, E2=staging,
                                         # E3=production-equivalent, E4=production
  executorAssuranceClass: {X0-X4}       # X0=local process, X1=restricted container, X2=hardened isolated worker,
                                         # X3=dedicated VM/account, X4=independently controlled execution environment
  # Legacy alias for tool-binding compatibility; derived from impactClass.
  authorizationCeiling: {0-4}
  # Explicit flags for legacy semantics; must be consistent with impactClass.
  destructiveTesting: {true|false}
  productionTesting: {true|false}

impactBudget:
  # Impact budget (v0.2 per ADR-0014 and ChatGPT P0-4). Bounds impact
  # rather than only finding count. Enforced structurally by the runtime
  # watchdog; breach automatically halts the engagement.
  maxRequests: {N}
  maxRequestsPerSecond: {N}
  maxConcurrentActions: {N}
  maxStateMutations: {N}                # zero for I0/I1 engagements
  maxEstimatedCostUsd: {N}
  maxAffectedPrincipals: {N}
  maxAffectedRecords: {N}
  maxDurationSeconds: {N}
  maxErrorRateDelta: {float}            # e.g., 0.5 = target error rate may not rise by 50 percentage points
  maxLatencyDeltaMs: {N}

emergency:
  contact: {contact of record}
  stopChannel: {stop mechanism URL or process}
  revocationChannel: {URL or process for the approver to revoke authorization mid-engagement}
  revocationIdentifier: {stable identifier for this authorization used in revocation systems}

roles:
  # Separation-of-duty roles (v0.2 per ADR-0016 and ChatGPT P0-7).
  # A single individual may hold multiple roles for small engagements;
  # for larger engagements, distinct individuals are required.
  targetOwner: {identity}                # party accountable for the target system
  legalOrBusinessAuthorizer: {identity}  # party with authority to bind the target's organization
  safetyOfficer: {identity}              # party with authority to halt the engagement
  operator: {identity}                   # party executing the engagement
  evidenceCustodian: {identity}          # party responsible for evidence retention and chain of custody
  reviewer: {identity}                   # party that reviews findings before disclosure

precedent:
  # Explicit alignment with NIST SP 800-115 ROE templates.
  nistSp800115Section: "3.4 Rules of Engagement"
  additionalStandards: []

# Incident-state block (per ADR-0009). Governs framework behavior when the
# authorization is issued under declared incident conditions.
incidentState:
  declared: false                                 # true when engagement is authorized under declared incident conditions
  signedSober: true                               # affirms authorization was signed outside duress
  dataClassPreservation: enforced                 # enforced | waived (waived requires signedSober=true AND additional signature)
  additionalSignatureForWaiver: {optional GPG signature required only when dataClassPreservation=waived}
  dataClassResources:                             # framework refuses to modify these under declared incident
    - persistent_storage                          # S3 buckets, EBS volumes, EBS snapshots, RDS databases, DynamoDB tables
    - identity_records                            # IAM users, roles, groups (credential revocation is separate and permitted)
    - dns_records                                 # Route 53 zones and records
    - audit_logs                                  # CloudTrail trails, log archives, evidence bundles
    - encryption_keys                             # KMS keys, secrets vault entries

# Chain-of-authorization block (per ADR-0009; MANDATORY in v0.3 per Grok review
# when any attack references third-party resources). The
# authorization-artifact-validator action FAILS the engagement if any attack
# in §7 references a resource class from a party not enumerated here.
chainOfAuthorization:
  required: true                                # v0.3: framework enforces
  thirdParties:
    - party: aws
      accountId: {redact-in-public-artifact}
      resourceClassesAffected: [cloudfront_distribution, alb_target]
      acknowledgment: |
        Operator affirms that the actions authorized by this engagement fall
        within AWS Acceptable Use Policy and AWS Customer Agreement. Operator
        is the account holder or has written authorization from the account
        holder to execute the described actions.
      reference: aws-aup-2024-05
      signature: {signed by operator}           # v0.3: per-third-party ack signed

# Example: waived incident-state flow (v0.3 per Grok review §4)
# When incidentState.declared: true AND dataClassPreservation: waived,
# the following additional signature is required beyond the standard
# approver signature. This makes the "sign in the middle of a panic" path
# expensive enough to prevent operator error under duress.
#
# incidentState:
#   declared: true
#   signedSober: false               # duress-signed authorization
#   dataClassPreservation: waived    # requires additional signature
#   additionalSignatureForWaiver:
#     signer: {second approver identity}
#     signature: {signed by second approver}
#     signedAt: {timestamp}
#     rationale: |
#       {explicit rationale for why data-class preservation must be waived;
#        recorded in permanent engagement history for post-incident review}
```

## §3 Rules of engagement

- **Modes enabled:** {list, matches header table}
- **Environment posture:** {matches header table}
- **Execution policy:** {passive / impact-bounded / campaign-complete, matches header table — per ADR-0014}
- **Stop condition:** {first-signal-stop / matrix-complete / impact-budget-exhausted — only meaningful for impact-bounded}
- **Severity threshold (for first-signal-stop):** {critical | high | medium | low} — the minimum severity at which a finding stops the engagement. Findings below this threshold are recorded but do not halt execution. (Per ADR-0010 and the severity-ordered matrix requirement.)
- **INCONCLUSIVE handling:** {continue | halt-for-review} — behavior when an oracle returns INCONCLUSIVE. Default is `continue` (INCONCLUSIVE is not a finding); `halt-for-review` requires operator adjudication before the engagement proceeds.
- **Retention policy:** {how long evidence is retained, where it is stored, who has access}
- **Prohibited actions:** {actions explicitly refused even under this authorization — e.g., "no attacks that would trigger legal disclosure obligations to third parties"}
- **Communication cadence:** {when the approver is briefed during the engagement, especially in `first-signal-stop` mode}

## §4 Threat model class

Which catalog entries this engagement instantiates. Each entry lists the class identifier and the reason for its inclusion in this engagement.

| Catalog ID | Class name | Rationale for inclusion |
|---|---|---|
| KTC-NNN | {class name} | {why this class is in scope for this target} |
| KTC-NNN | {class name} | {rationale} |

## §5 Approver sign-off gate

- [ ] Target boundary locked
- [ ] Authorization artifact valid and unexpired
- [ ] Rules of engagement locked
- [ ] Threat model class list locked
- [ ] Approved to execute — signed: **{approver initials}** **{date}**

---

# § Agent-authored (bottom half — execution)

## §6 Target model

The architecture graph the engagement is executing against. Contains assets, actors, trust boundaries, dependencies, and declared defenses. Where an eos attestation exists for the target, this section may reference the attestation's §6 layer-impact map instead of restating it.

- **Assets under attack:** {list}
- **Actors simulated:** {list of adversary personae this engagement is playing}
- **Trust boundaries crossed:** {list}
- **Declared defenses (from eos attestation or equivalent):** {list, with reference to the attestation document if applicable}

## §7 Attack matrix

For each threat-class × claim pair, the specific diagnostic attack that will be executed. Each row is one attack.

**Matrix ordering.** For engagements in `first-signal-stop` mode, the attack matrix MUST be severity-ordered (highest-declared-severity attacks first). This ensures that "stop on the first finding at-or-above threshold" produces a finding that represents the target's worst reached exposure, not an artifact of matrix authoring order. Engagements in `go-to-town` mode may use any order.

| Attack ID | Threat class | Claim under test | Diagnostic attack | Declared severity if finding | Success would demonstrate |
|---|---|---|---|---|---|
| A-1 | KTC-NNN | {defense claims X} | {specific probe} | critical / high / medium / low | {what a successful attack would prove} |
| A-2 | KTC-NNN | {claim} | {probe} | {severity} | {proof} |

## §8 Attack oracles

For each attack, the deterministic assertion that determines pass or fail. Attack oracles reference observable signals only — metrics, log lines, response payloads, telemetry counters. AI-generated narrative may explain an oracle result but cannot replace it. (This section is for **attack oracles** specifically; plausibility-monitor findings from `<target>/kronos/findings/plausibility/` are aggregated separately at scorecard rendering time.)

| Attack ID | Oracle name | Assertion | Data source |
|---|---|---|---|
| A-1 | {oracle name} | {e.g., "response status IN [401, 403] AND metric AresBlocks increments by 1 within 60s"} | {CloudWatch, application log, response body} |
| A-2 | {oracle} | {assertion} | {source} |

## §9 Execution log

Ordered record of attacks executed. Each entry captures timing, the request/response evidence hash, the oracle evaluation, and the execution-provenance signature.

| Timestamp (UTC) | Attack ID | Request evidence (sha256) | Response evidence (sha256) | Oracle evaluation | Execution provenance (sha256) | Notes |
|---|---|---|---|---|---|---|
| YYYY-MM-DDTHH:MM:SSZ | A-1 | {hash → path in evidence/} | {hash → path in evidence/} | PASS / FAIL / INCONCLUSIVE | {hash → path in evidence/provenance/} | {notes} |

**Execution provenance** (per Claude review P2-3): each attack invocation produces a signed execution-attestation containing timestamp, target identity, tool identity and version, operator identity and signing key. The attestation is hashed and referenced from this table. Evidence hashes prove the artifact was not altered after commit; execution provenance proves the artifact was produced by a real execution against the claimed target at the claimed time by the claimed operator. Both are required for public findings to be independently verifiable.

Full evidence files (request bodies, response bodies, telemetry excerpts, screenshots) are committed as siblings to this document under `../evidence/<engagement-slug>/`.

## §10 Findings

Every case in which an oracle evaluated to FAIL is a finding. Each finding contains:

- **Finding ID:** F-NNN
- **Attack ID (source):** A-N
- **Severity:** critical / high / medium / low / informational
- **Summary:** one-sentence description of what was demonstrated
- **Reproduction:** exact steps to re-run the attack against the target, including any environmental setup
- **Evidence:** hashes and paths to the specific evidence artifacts that support this finding
- **Suggested remediation:** what the target's defenders could change to close this finding, framed as a hypothesis to be tested by a subsequent kronos engagement
- **Eos backlog integration:** if eos is co-installed, the auto-filed backlog cycle identifier

## §11 Scorecard delta

Which dimensions of the target's scorecard change state as a result of this engagement. This section is atomic with §10 findings — no finding is complete without the corresponding scorecard update.

| Pillar | Dimension | Prior level | New level | Rationale |
|---|---|---|---|---|
| A | Identity & Access Control | L3 | L4 | Attack A-1 (JWT replay) executed against production; defense fired within SLO envelope; L4 unlocked |
| C | Cost Integrity | L4 | L3 | Attack A-3 (physical-plausibility on cost blast) surfaced finding F-2; L4 requires re-verification after remediation |

## §12 Eos integration

If eos is co-installed in the target:

- **Attestations falsified by this engagement:** {list, with attestation cycle identifier and specific claim that was falsified}
- **Backlog cycles auto-filed:** {list, with backlog cycle identifier and pointer to the file in the target's eos/cycle/00_backlog/}
- **Attestations reinforced by this engagement:** {list — attestations whose claims the engagement attempted to falsify and could not; these are strengthened as unfalsified-by-current-catalog}

If eos is NOT co-installed:

- N/A. This section is omitted.

## §13 Closeout

Filled at end of engagement. Document goes append-only after this.

### What was tested
- List of attacks executed and their outcomes.

### What was skipped and why
- Attacks in the plan that were not executed. Include reason (rate ceiling hit, authorization expired, first-signal-stop triggered, etc.).

### What surprised
- Novel behaviors observed during the engagement that were not anticipated by the attack matrix. These may seed new catalog entries or new engagements.

### Feedback that emerged from this engagement (seed for the next one)
- Observations about the framework itself, the target's defensive posture, the approver's decision framework, etc.

### Evidence corpus
- Pointer to `../evidence/<engagement-slug>/` and enumeration of the top-level artifacts committed.

### Engagement close commit
- Branch / PR link
- Approver sign-off: **{approver initials}** **{date}**
