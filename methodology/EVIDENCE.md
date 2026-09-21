# Evidence handling — two-tier storage, SLSA-aligned provenance, opt-in disclosure

> A SHA-256 hash proves that bytes have not changed. It does not prove who produced them, under whose authorization, when, or whether the producing tool was trustworthy. The v0 design conflated these. The v0.2 evidence model separates them.

## Purpose

Kronos evidence is the persistent record of what a challenge observed. It is the substrate on which every finding is built. It is also, potentially, some of the most sensitive material the framework will handle: session tokens, API keys, cookies, personal data, customer records, internal hostnames, exploit payloads, sensitive logs, security architecture details, and third-party data subject to contractual retention.

The v0 design proposed committing exact requests, responses, telemetry, and screenshots to the target's git repository, potentially public by default. It further claimed a finding could be "reproduced from repository state alone." ChatGPT's cross-LLM review flagged this in P0-6 as materially unsafe.

The v0.2 evidence model has three properties the v0 model lacked:

1. **Two-tier storage** — sanitized records in the repository, raw sensitive artifacts in a protected store the customer controls.
2. **SLSA-aligned provenance** — signed attestations recording where, when, how, and from which inputs an evidence artifact was produced.
3. **Opt-in disclosure** — public evidence requires explicit disclosure authority, not the default git-visibility of the repository.

## The two tiers

### Repository tier (`<target>/kronos/`)

Committed to git alongside the engagement document. Public if the target's repository is public. Contains:

- Sanitized engagement records — engagement, plan, run summary.
- Findings (with sanitized reproduction instructions).
- Evidence manifests (see below).
- Content hashes (SHA-256) of protected-tier artifacts.
- Signed execution-provenance attestations.
- Tool identity and container digests.
- Authorization digest.
- Target snapshot digest.
- Redaction records (what was redacted and why).
- Evidence classification per artifact.
- Retention and disclosure state per artifact.
- Public-safe report.

This tier is what a third-party observer can inspect to verify that a finding was legitimately produced. It is not a full reproduction of the attack; it is a signed audit trail sufficient for external verification of the framework's discipline.

### Protected evidence tier (`<protected-store>/<target>/engagements/<engagement-id>/runs/<run-id>/`)

Stored in a customer-controlled or Kronos-managed protected store, NOT committed to git. Contains:

- Raw requests and responses.
- Full telemetry captures.
- Screenshots.
- Packet captures.
- Sensitive logs.
- Potentially weaponizable reproduction artifacts.

This tier is encrypted at rest, access-controlled per operator identity, retention-governed, and capable of legal hold or deletion on request. The protected store may be:

- Kronos-managed (default for hosted deployments; SOC 2 audited).
- Customer-managed S3/Azure/GCS bucket (for customers with strict data-residency requirements).
- On-premises encrypted volume (for air-gapped or high-security deployments).
- A dedicated enterprise evidence vault.

The protected store is referenced from the repository tier by content-addressable identifier and storage-tier locator. A third-party observer with access to only the repository tier can verify that the manifest is well-formed and signed; verification of the raw artifacts requires access to the protected store.

## Evidence manifest schema

Each run produces one signed evidence manifest. The schema is SLSA-aligned — the provenance concepts are lifted from the SLSA framework (per ChatGPT P0-6 recommendation) but adapted to Kronos's challenge model rather than build-artifact provenance.

```yaml
kind: kronos-evidence-manifest
apiVersion: v1
manifest:
  run_id: R-2026-07-24-000042
  engagement_id: E-olympus-grid-kronos-1
  authorization_digest: sha256:...       # digest of the signed authorization payload
  plan_digest: sha256:...                # digest of the plan referenced by this run
  executor:
    operator_identity: <operator-signing-key-fingerprint>
    runner_identity: <runner-signing-key-fingerprint>
    runner_version: kronos-runner-v0.2.0
  tool:
    tool_id: burp-suite-professional
    tool_version: 2024.6
    tool_manifest_digest: sha256:...     # digest of the signed tool manifest
    container_image_digest: sha256:...   # if containerized
    adapter_digest: sha256:...           # digest of the Layer 1 adapter script if applicable
  target:
    target_slug: olympus-grid
    target_snapshot_digest: sha256:...   # digest of the target configuration at run time
    target_endpoints_probed: [...]       # enumerated endpoints for scope verification
  timing:
    started_at: 2026-07-24T15:30:12.123Z
    completed_at: 2026-07-24T15:30:45.678Z
    clock_source: chrony-system-time
    clock_last_synced_at: 2026-07-24T15:00:00Z
  artifacts:
    - artifact_id: A-req-001
      description: "HTTP request to attacker-CloudFront path"
      digest: sha256:...
      media_type: application/http
      classification: sensitive             # public / redacted / sensitive
      redaction_status: not-redacted        # or: redacted-fields:[list]
      storage_ref:
        tier: protected
        locator: s3://kronos-evidence/olympus-grid/E-.../R-.../A-req-001
    - artifact_id: A-resp-001
      ...
    - artifact_id: A-metric-001
      description: "CloudWatch AresBlocks metric excerpt"
      digest: sha256:...
      classification: public
      redaction_status: not-redacted
      storage_ref:
        tier: repository
        locator: docs/engagements/olympus-grid/kronos-1/evidence/metric-001.json
  cleanup:
    performed: true
    verified: true
    verification_evidence_digest: sha256:...
signature:
  algorithm: ed25519
  signed_by: <runner-signing-key-fingerprint>
  signature_value: <base64>
```

The manifest binds every claim about the run — what it did, when, by whom, with what tool, against which target snapshot, producing which artifacts — to a single signed statement. A third-party observer can verify the signature, verify the referenced digests against the corresponding artifacts (if the observer has access), and verify that the run was authorized by inspecting the referenced authorization digest.

## Reproducibility

The v0 design claimed evidence was "reproducible from repository state alone." The v0.2 design replaces this with a more honest claim, per ChatGPT's directive:

> **Evidence is auditable from preserved provenance and replayable where target state, credentials, dependencies, and authorization permit.**

The distinction matters. Evidence integrity (the artifact was not altered) is durable via hash. Execution authenticity (the artifact was produced by a real execution) is durable via signed provenance. **Reproducibility of the attack** — actually re-running the challenge and observing the same result — is not durable in general. Target state drifts. Credentials rotate. Third-party resources are torn down. Dependencies shift. An engagement's finding can be legitimate and unassailable and yet fail to re-execute months later.

Kronos does not promise re-executability unconditionally. The evidence contract promises audit trail durability and cryptographic integrity; re-execution is a best-effort property that depends on target and environment stability.

## Disclosure

The v0 design's implicit "public repo = public findings" model is replaced with an explicit disclosure state per finding.

Each finding has a `disclosure` field with one of the following states:

- **`private`** — the finding is stored only in the target's repository (or protected store, depending on classification). Not disclosed to any third party.
- **`embargoed`** — the finding is under responsible-disclosure embargo. The framework records the embargo window and the parties in the embargo. On embargo expiry, the finding transitions to `public` unless the operator extends the embargo.
- **`public`** — the finding is disclosed publicly. The public-safe report is generated and published; sensitive raw evidence remains in the protected store.
- **`withdrawn`** — the finding has been withdrawn from disclosure. The withdrawal itself is recorded (findings do not disappear from history), but the finding is not surfaced in current public renderings.

The transition from `private` or `embargoed` to `public` requires explicit disclosure authority — an operator with the `disclosure` role signs the transition. The framework refuses to auto-transition to public.

Public disclosure applies only to the sanitized finding record and the public-safe report. Raw evidence in the protected store is never auto-disclosed regardless of the finding's disclosure state.

## Redaction

Evidence artifacts requiring redaction (containing credentials, PII, or third-party sensitive data) undergo a redaction pass before being stored. Redaction produces two records:

- **Redacted artifact** — the artifact with sensitive fields replaced by tokens (e.g., `<REDACTED:api_key>`, `<REDACTED:session_token>`).
- **Redaction record** — a signed record of what was redacted, why, by whom, and when. The redaction record is stored in the protected tier and referenced from the evidence manifest.

The redaction record allows a third party with sufficient authorization to reconstruct the original artifact if the sensitive fields become non-sensitive (e.g., credentials expire).

Automatic redaction is applied for well-known credential patterns. Manual redaction is required for target-specific sensitive fields not covered by patterns.

## Retention

Each evidence artifact has a declared retention period in its manifest entry. Default retention:

- Public-tier artifacts: indefinite (they live in git history).
- Protected-tier artifacts: 24 months, renewable.

Legal hold overrides retention: an artifact under legal hold is not deleted regardless of expiry. Deletion of expired artifacts is an authorized action requiring the operator with the `retention` role. Deletion is itself recorded in the framework (the finding remains; the deleted artifact is marked with `deletion_timestamp` and `deletion_authorized_by`).

## Chain of custody

Each state transition on an evidence artifact (creation, redaction, storage-tier move, disclosure change, retention change, deletion) is recorded in the artifact's chain-of-custody log. The log is append-only, signed at each transition, and stored in the protected tier alongside the artifact.

Chain of custody is what makes a finding suitable for downstream use in litigation, regulatory disclosure, or auditor review. The v0 evidence model did not have this property; the v0.2 model does.

## Migration from v0

v0 engagements that committed raw evidence to git carry a technical-debt burden: sensitive artifacts may already be in public git history. Migration from v0 to v0.2 requires:

1. Identifying which v0-committed artifacts contain sensitive material.
2. For public-repo targets: acknowledging that git history rewriting is generally not viable retrospectively; new artifacts follow the two-tier model going forward.
3. For private-repo targets: migrating sensitive artifacts to a protected store and rewriting git history if the operator chooses (BFG or git-filter-repo).

The migration is not automatic. The framework provides a `migrate-evidence-v0` action that identifies candidate artifacts for migration; the operator decides the migration policy.

## What this replaces

- The v0 claim that evidence is "reproducible from repository state alone." Replaced with auditability + replayability distinction.
- The v0 default of public-by-default disclosure tied to repository visibility. Replaced with explicit per-finding disclosure state.
- The v0 pattern of storing raw sensitive artifacts in git. Replaced with two-tier storage.
- The v0 assumption that a SHA-256 hash is sufficient provenance. Replaced with SLSA-aligned signed manifest.
