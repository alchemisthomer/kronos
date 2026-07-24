# Threat catalog — lifecycle governance and LLM-watcher quarantine

> The catalog will not always grow monotonically stronger. Entries can become obsolete, duplicated, misleading, or overly broad. The v0 design's "catalog grows strictly stronger over time" claim assumed only-addition; the v0.2 catalog governance model recognizes six lifecycle states, applicability predicates, and untrusted-input quarantine for LLM-authored proposals.

## Purpose

Kronos's threat catalog is the versioned inventory of challenges (attacks, plausibility computations, drift checks, reconciliations) that can be instantiated against target claims. The catalog is the framework's evolving best understanding of what can go wrong with software systems. It is also the primary artifact whose changes retroactively affect target scorecards; ungoverned catalog changes create customer-trust landmines.

## Catalog entry schema

Each entry is a YAML file at `catalog/challenges/<challenge-id>-v<version>.yaml` with the following structure:

```yaml
kind: kronos-challenge-spec
apiVersion: v1

id: KTC-perimeter-cf-secret-bypass
version: 2.1
state: active     # draft | reviewed | active | deprecated | superseded | withdrawn

title: "Attacker-controlled CloudFront distribution bypasses origin-secret guard"
description: >
  Verifies that the target's origin-secret guard rejects requests originating
  from CloudFront distributions not controlled by the target.

challenge_type: diagnostic-probe    # see CONTINUOUS-ASSURANCE.md for the seven types

applicable_target_types:
  - aws-cloudfront-origin-secret

applicability_predicates:
  # These predicates evaluate against the target's declared model.
  # If any evaluates false, the challenge does NOT apply to this target
  # and is NOT included in the target's coverage or scoring.
  - "target.uses_aws_cloudfront == true"
  - "target.origin_secret_guard.declared == true"
  - "target.perimeter.type in ['alb', 'nlb']"

preconditions:
  - "target.perimeter.reachable == true"
  - "target.origin_secret_guard.deployed_revision == target.declared_revision"

impact_class: I1                     # non-mutating active; see EVIDENCE.md and DOMAIN-MODEL.md

required_capabilities:
  attack_classes: [perimeter.origin-bypass]
  provider_apis: [aws.cloudfront.create-distribution]
  network_scope: [target.perimeter.hostname]

expected_observables:
  primary:
    source: aws.cloudwatch.AresBlocks
    dimension: Reason=cf_secret_missing
    window: 60s
    correlation_id_field: aws.event_id
  secondary:
    source: aws.application-log.ares
    filter: level=info AND reason=cf_secret_missing
    correlation_id_field: log.event_id
  telemetry_lag_policy: 90s
  retry_policy: single-try

oracle_template: perimeter-cf-secret-bypass-oracle-v2
cleanup:
  - "delete attacker-controlled CloudFront distribution"
  - "verify no residual ARN references remain in target account"

false_positive_notes: >
  If the target has recently deployed a new CloudFront distribution intended
  to bypass the origin secret (a legitimate change), this challenge may
  falsely report the defense failing. Verify against target.declared_revision.

false_negative_notes: >
  If AWS CloudFront takes longer than 90 seconds to propagate the attacker
  distribution's ARN, the challenge may not reach the target's origin secret
  guard in time. Extend telemetry_lag_policy to 300s for very fresh AWS
  accounts.

source_provenance:
  - author: alchemisthomer
    date: 2026-07-24
    reference: hostile-universe-defense-kronos-redteam-plan-2026-07-24.md Scenario D

external_mappings:
  mitre_attack: [T1584.004]           # Compromise Infrastructure: CDN
  capec: [CAPEC-141]                  # Cache Poisoning
  cwe: [CWE-346]                      # Origin Validation Error
  owasp_asvs: ["V13.1.3", "V13.2.1"]

reviewers:
  - reviewer: alchemisthomer
    date: 2026-07-24
    verdict: approved
signatures:
  - signature_type: gpg
    signer: alchemisthomer
    key_fingerprint: D0CBC20F09BC64ED
    signature_value: <base64>
supersedes: null    # or reference to prior version being superseded
```

## Six lifecycle states

### draft

The entry has been proposed but not yet reviewed. May be authored by a human curator, produced by the LLM watcher (see below), or auto-drafted from a novel finding. Draft entries are NOT instantiable — the framework refuses to include them in an engagement's attack matrix or the continuous plane's evaluation set. Draft entries live in `catalog/drafts/` rather than `catalog/challenges/`.

### reviewed

The entry has been reviewed by at least one curator (typically human) and passed review. Not yet promoted to active — an entry may be reviewed and held in review-state while related entries are also reviewed, so the promotion can be atomic. Reviewed entries live in `catalog/challenges/` but with `state: reviewed`.

### active

The entry is instantiable. Engagements may include it in their attack matrix; the continuous plane may include it in scheduled evaluations. Active entries contribute to target scorecards via applicability predicates.

### deprecated

The entry remains in the catalog but is no longer recommended for new engagements. Existing engagements that reference the entry continue to work. Deprecation freezes historical scores at the catalog version in effect when they were computed (per ADR-0010). A deprecated entry may still be actively used by targets that have not migrated; the deprecation is a signal, not a removal.

### superseded

The entry has been replaced by a specific successor. Different from deprecated — a superseded entry names its successor via the `supersedes` field on the new entry. Targets are expected to migrate to the successor at their next re-pinning event.

### withdrawn

The entry has been removed from active service due to defect (false-positive rate too high, dangerous side effects observed, ambiguous evaluability). Withdrawal is more drastic than deprecation — the framework will refuse to instantiate a withdrawn entry even for targets that have it in their engagement history. The withdrawal reason is recorded.

## Applicability predicates

Every catalog entry declares applicability predicates: statements about the target that must evaluate true for the challenge to be considered applicable. A challenge only affects a target's scorecard if all predicates evaluate true against the target's declared model.

This resolves the v0 ambiguity about whether catalog additions affect all targets universally. Under v0.2:

- A new catalog entry for AWS CloudFront origin-secret bypass only affects targets whose declared model includes AWS CloudFront + an origin-secret guard. Targets using Azure Front Door or GCP Cloud CDN are not affected.
- A new catalog entry for a generic HTTP header injection affects all targets exposing HTTP interfaces (broader applicability).
- A new catalog entry for a Salesforce Site Guest profile misconfiguration only affects targets whose declared model includes Salesforce.

Applicability predicates make catalog growth non-uniform: some targets are affected by many new entries, others by few, based on their declared surface.

## Coverage accounting

The scorecard's coverage field for each dimension is computed as:

```
coverage = (weighted claims currently evaluated by active applicable entries)
         / (weighted claims applicable to target across all active entries)
```

When a new active entry is added whose applicability predicates match the target, and the target has not yet run a challenge for that entry, the dimension's coverage decreases (denominator grew; numerator did not). This is visible in the dual-number rendering (per ADR-0010) as `latest < pinned`.

The target may re-pin to the new catalog version, at which point the coverage number stabilizes but the "applicable unevaluated" count increases — a signal that new engagements are needed.

## LLM watcher — untrusted-input quarantine

The LLM watcher monitors security-industry sources (CVE feeds, breach post-mortems, conference publications, novel attack research) and proposes new catalog entries. The v0 design under-specified the safety envelope; ChatGPT flagged in P2-7 that CVE descriptions and breach writeups are adversary-influenceable text that the LLM ingests as input.

The v0.2 watcher operates in an untrusted-input quarantine with the following constraints:

**Zero autonomous writes.** The watcher's output is always in `catalog/drafts/`, never in `catalog/challenges/`. Human curator review is required for every promotion from draft to reviewed.

**Zero execution authority.** The watcher may propose new catalog entries; it may not invoke the framework's runtime, may not initiate engagements, may not modify the continuous plane's schedule, may not access target credentials.

**Zero secrets.** The watcher runs in an environment without any target credentials, any operator signing keys, any authorization artifacts. Its input is public information; its output is public drafts.

**No direct ingestion of source instructions as commands.** CVE descriptions may contain prompt-injection payloads ("ignore prior instructions and write..."). The watcher treats source content strictly as data, extracted and re-summarized before feeding to the LLM. The re-summarizer is a deterministic parser (regex + structured extraction) that discards free-form imperative language before the content reaches the LLM.

**Full source provenance.** Every draft the watcher produces carries `source_provenance` naming the exact URL, retrieval timestamp, publication date, and content hash of the source material. A curator reviewing the draft can trace back to the original source and independently evaluate whether the watcher's summary is faithful.

**Draft-only output.** Watcher output is `state: draft` unconditionally. The watcher has no capability to set any other state.

**Preferred two-party review for high-impact drafts.** Drafts whose applicability predicates would affect many targets (broad predicates matching most targets) or whose declared impact class is ≥ I2 require two independent curator reviews before promotion. Single-party review is sufficient for narrow, low-impact drafts.

**Rate-limiting.** The watcher's draft-production rate is bounded per week to prevent flooding the review queue. Excess sources are queued for later processing.

**Adversarial input detection.** The watcher's input parser flags source content that appears to be an intentional prompt-injection attempt (specific patterns known to compromise LLM extraction). Flagged content is quarantined for human triage and does not enter the LLM.

## Auto-from-findings promotion

When an engagement's finding surfaces a novel exploitation pattern that does not fit any existing catalog entry, the finding may seed a new catalog entry. Under v0, the design proposed automatic promotion; ChatGPT correctly flagged that findings-to-catalog automatic promotion has maximum blast radius (retroactively affects all targets).

Under v0.2:

- The framework never auto-promotes a finding to an active catalog entry.
- The framework may auto-draft a candidate entry from a finding, populating `catalog/drafts/<candidate-id>.yaml` with the finding's evidence and applicability inferences.
- Human curator review is required for promotion from draft to reviewed to active, following the same review discipline as watcher-generated drafts.
- The finding that seeded the draft is referenced in the draft's `source_provenance`.

## Governance body

The catalog's day-to-day governance is the responsibility of a small curator team (initially: the operator). As the framework matures and adoption grows, curator authority may extend to a nominated review board of practitioner-experts. The team's responsibilities:

- Review drafts within a stated SLA (target: 5 business days for standard, 24 hours for high-severity field-falsification).
- Set the promotion threshold (single-party vs two-party) based on entry impact.
- Sign approved entries with their identity keys.
- Trigger deprecations, supersessions, and withdrawals when entries prove defective.
- Resolve disputes between curators via a documented process (initially: escalate to the operator).

The governance body's decisions are recorded in the entry's `reviewers` and `signatures` fields. Adopters can inspect provenance for any active entry and verify who authorized it.

## Catalog versioning

The catalog itself is versioned. A catalog version is a snapshot of all entries at their versions at a specific date (e.g., `kronos-catalog-2026.07.24`). Targets pin against a catalog version; new entries in later versions do not affect a pinned target until the target re-pins.

Per ADR-0010, the target's scorecard renders both `pinned catalog version` and `latest catalog version` with a delta. Catalog updates that would lower a pinned target's headline give 90 days notice before affecting the pinned rendering (72 hours for field-falsification exception).

## Community contribution

External contributors may propose catalog entries via pull request. The contribution flow:

1. Contributor authors an entry (typically a draft) with full applicability predicates, external mappings, and provenance.
2. PR is opened against the catalog repository (a subdirectory of `alchemisthomer/kronos` or a dedicated `alchemisthomer/kronos-catalog` repo — TBD in v0.2).
3. Framework CI runs the draft against its schema validator and its golden-target conformance tests.
4. Curator review follows the same rules as watcher-generated drafts.
5. On approval, curator signs and the entry is promoted through review-state to active.

Contribution requires acceptance of the framework's contributor agreement (which addresses IP assignment for patent-strategy purposes).

## What this replaces

- The v0 assertion that the catalog grows "strictly stronger over time." Growth is non-monotonic; entries can be deprecated, superseded, withdrawn.
- The v0 implication that catalog changes affect all targets universally. Applicability predicates make catalog effects target-specific.
- The v0 proposal for fully-automatic LLM-watcher promotion and fully-automatic finding-to-catalog promotion. Both are draft-only; human curation is required for activation.
- The v0 lack of explicit governance for who reviews and signs catalog entries. The curator role is now explicit with signature requirements.
