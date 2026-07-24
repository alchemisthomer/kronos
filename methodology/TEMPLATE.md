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
| **Safety mode** | `first-signal-stop` / `go-to-town` |
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

The signed record that unlocks execution. This section is either an inline authorization block or a reference to an external artifact hash.

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
  maximumSafetyLevel: {0-4}
  destructiveTesting: {true|false}
  productionTesting: {true|false}
limits:
  maxRequestsPerSecond: {N}
  maxConcurrentActions: {N}
  maxRunDurationMinutes: {N}
  maxEstimatedCostUsd: {N}
emergency:
  contact: {contact of record}
  stopChannel: {stop mechanism URL or process}
```

## §3 Rules of engagement

- **Modes enabled:** {list, matches header table}
- **Environment posture:** {matches header table}
- **Safety mode:** {first-signal-stop or go-to-town, matches header table}
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

| Attack ID | Threat class | Claim under test | Diagnostic attack | Success would demonstrate |
|---|---|---|---|---|
| A-1 | KTC-NNN | {defense claims X} | {specific probe} | {what a successful attack would prove} |
| A-2 | KTC-NNN | {claim} | {probe} | {proof} |

## §8 Oracles

For each attack, the deterministic assertion that determines pass or fail. Oracles reference observable signals only — metrics, log lines, response payloads, telemetry counters. AI-generated narrative may explain an oracle result but cannot replace it.

| Attack ID | Oracle name | Assertion | Data source |
|---|---|---|---|
| A-1 | {oracle name} | {e.g., "response status IN [401, 403] AND metric AresBlocks increments by 1 within 60s"} | {CloudWatch, application log, response body} |
| A-2 | {oracle} | {assertion} | {source} |

## §9 Execution log

Ordered record of attacks executed. Each entry captures timing, the request/response evidence hash, and the oracle evaluation.

| Timestamp (UTC) | Attack ID | Request evidence (sha256) | Response evidence (sha256) | Oracle evaluation | Notes |
|---|---|---|---|---|---|
| YYYY-MM-DDTHH:MM:SSZ | A-1 | {hash → path in evidence/} | {hash → path in evidence/} | PASS / FAIL / INCONCLUSIVE | {notes} |

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
