# ADR-0015 — Two-tier evidence storage with SLSA-aligned provenance

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0/v0.1 evidence model (public-by-default git commit of raw evidence)
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-6

## Context

The v0 design committed exact requests, responses, telemetry, and screenshots to the target's git repository, potentially public by default, and claimed findings were "reproducible from repo state alone." ChatGPT correctly flagged this as unsafe: raw evidence can contain session tokens, API keys, cookies, personal data, customer records, exploit payloads, and third-party data under contractual retention. Git is poor at secret removal, retention expiry, large binary storage, and selective legal hold.

A SHA-256 hash proves bytes have not changed. It does not prove who produced them, under what authorization, when, or whether the producing tool was trustworthy. v0.1 added execution-provenance signing (from Claude review P2-3) which addressed authenticity but did not fix the two-tier storage issue.

## Decision

Kronos v0.2 uses two-tier evidence storage:

1. **Repository tier** (git-committed) — sanitized engagement records, findings with sanitized reproduction, evidence manifests (SLSA-aligned schema), content hashes, signed execution provenance, tool/container digests, authorization digests, target snapshot digests, redaction records, evidence classifications, retention state, public-safe reports.

2. **Protected evidence tier** (encrypted, access-controlled, customer or Kronos-managed) — raw requests/responses, full telemetry, screenshots, packet captures, sensitive logs, potentially weaponizable reproduction artifacts.

Storage locations:
- Kronos-managed protected store (default for hosted deployments; SOC 2 audited).
- Customer-managed S3/Azure/GCS bucket.
- On-premises encrypted volume.
- Enterprise evidence vault.

Evidence manifest schema aligns with SLSA provenance concepts adapted to challenge execution rather than build artifacts.

**Reproducibility claim revised** — v0's "reproducible from repo state alone" is replaced with:

> **Evidence is auditable from preserved provenance and replayable where target state, credentials, dependencies, and authorization permit.**

Public disclosure is opt-in per finding (`private` / `embargoed` / `public` / `withdrawn`). Public transition requires operator with `disclosure` role. Raw evidence is never auto-disclosed regardless of finding disclosure state.

Chain of custody, redaction records, legal hold, and deletion authority are formalized.

Full specification in [`methodology/EVIDENCE.md`](../../methodology/EVIDENCE.md).

## Consequences

**Positive.** Sensitive data protection resolved. GDPR / customer-data-retention obligations satisfiable. Legal hold and selective deletion supported. Chain-of-custody sufficient for downstream regulatory / litigation use. SLSA precedent lowers integration cost with supply-chain-verified environments.

**Negative.** Two-store architecture is more complex than "everything in git." Adopters must decide where their protected store lives.

**Neutral.** Public disclosure remains supported (it is opt-in, not disabled). Public-safe reports are the vehicle for public disclosure.

## References

- [`methodology/EVIDENCE.md`](../../methodology/EVIDENCE.md).
- SLSA specification (external reference).
- ChatGPT cross-LLM review of v0, P0-6.
