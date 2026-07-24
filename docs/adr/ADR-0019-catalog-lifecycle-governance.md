# ADR-0019 — Threat catalog lifecycle governance and LLM-watcher quarantine

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0/v0.1 "catalog grows strictly stronger" framing and LLM-watcher framing
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-10

## Context

The v0 claim that the catalog "grows strictly stronger over time" assumed only-addition. In practice catalogs accumulate obsolete, duplicate, misleading, overly broad, or low-quality entries. Additionally, the v0 LLM-watcher framing under-specified untrusted-input handling — CVE descriptions and breach writeups are adversary-influenceable text; the watcher ingests them.

## Decision

**Six lifecycle states** for every catalog entry:

- `draft` — proposed, not instantiable
- `reviewed` — passed review, held in review state
- `active` — instantiable, contributes to scoring
- `deprecated` — no longer recommended, existing usages continue
- `superseded` — replaced by named successor
- `withdrawn` — removed from active service due to defect; framework refuses to instantiate

**Applicability predicates** — every entry declares predicates against target model. Entry only affects a target's scorecard if all predicates evaluate true. New entries do not universally affect all targets.

**Coverage accounting** distinguishes evaluated / applicable / unevaluated per dimension. New applicable entries decrease coverage until evaluated.

**LLM watcher operates in untrusted-input quarantine:**
- Zero autonomous writes (drafts only, always in `catalog/drafts/`)
- Zero execution authority
- Zero secrets access
- No direct ingestion of source instructions as commands — deterministic parser extracts before LLM sees content
- Full source provenance recorded per draft
- Draft-only output unconditionally
- Two-party review required for high-impact drafts (broad applicability or impact class ≥ I2)
- Rate-limiting on draft-production
- Adversarial input detection with quarantine for suspected prompt injection

**Auto-from-findings promotion never fully automatic.** Findings may seed candidate drafts; human curation required for promotion draft → reviewed → active.

**Governance body** — small curator team (initially the operator; potentially a review board as adoption matures) with review SLAs, single-party or two-party promotion thresholds, and signed approvals.

**Community contribution** via PR against catalog repository with schema validation, golden-target conformance, and curator review.

Full specification in [`methodology/CATALOG.md`](../../methodology/CATALOG.md).

## Consequences

**Positive.** Catalog is governed rather than accreting. LLM watcher's poisoning surface is bounded. Findings-to-catalog automation cannot lower every target's public score without human review. Deprecation and supersession semantics are explicit.

**Negative.** Curator workload is a real ongoing burden. Community contribution flow requires additional infrastructure.

**Neutral.** The catalog's growth remains valuable; growth is just no longer represented as monotonically strengthening.

## References

- [`methodology/CATALOG.md`](../../methodology/CATALOG.md).
- ChatGPT cross-LLM review of v0, P0-10.
