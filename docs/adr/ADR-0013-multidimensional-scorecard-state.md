# ADR-0013 — Multidimensional scorecard state per cell

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes SCORECARD.md v0.1's single-level rendering
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-3

## Context

The v0/v0.1 scorecard used a single maturity level (L0–L5) per dimension. ChatGPT's review correctly noted this conflates multiple orthogonal properties — process maturity, control effectiveness, adversarial coverage, evidence quality, evidence freshness, environment fidelity — and produces false state transitions. One passing test moved an entire dimension from L3 to L4. One failure would drop a mature control program to L1, erasing the fact that the program was documented, automated, instrumented, and governed.

## Decision

Each scorecard cell carries the following fields (per SCORECARD.md v0.2):

- **maturity** (0–5, CMMI-derived) — process/capability maturity axis. A failed challenge does not lower this.
- **effectiveness** (`untested` / `survived` / `partial` / `falsified`) — separate axis. This is what a challenge can change.
- **coverage** — weighted fraction of applicable claims currently evaluated.
- **confidence** (`low` / `medium` / `high`) — framework's confidence in the current determination.
- **freshness** — timestamp of last evaluation + expiration + `is_stale` flag.
- **environment_fidelity** (`lab` / `staging` / `production-equivalent` / `production`) — where evaluation ran.
- **open_findings** — count, IDs, max severity of open findings on the dimension.
- **applicable_catalog_gap** — pinned vs latest catalog delta filtered to applicable-unevaluated.

**Executive rendering** derives a legible summary from the multidimensional state ("maturity L3; effectiveness survived; 78% weighted coverage; 2 open findings max severity high; high-confidence evidence; staging fidelity; 12-day-old critical evidence; catalog delta: 2 unevaluated new entries") rather than presenting a single "L4 green" cell.

**Weighted average is not the primary summary.** ChatGPT correctly noted that a weighted average lets an L1 Identity cell hide behind a wall of L4s. Instead, the headline reports several load-bearing signals separately: falsified critical claims count, untested critical claims count, weighted coverage, minimum critical maturity, minimum critical effectiveness, evidence freshness, catalog gap, and an overall status label (`current` / `degraded` / `stale` / `materially-incomplete`).

**L5 requires an actual improvement loop.** Per ChatGPT: challenges execute on defined cadence, catalog changes trigger reassessment, findings generate remediation work, remediation is independently re-challenged, trends demonstrate reduced exposure or faster detection/recovery, stale evidence auto-expires. Not merely "recurring production test."

## Consequences

**Positive.** State transitions are honest. Mature processes with failing outputs remain visibly mature. Untested-but-mature dimensions are visible (previously invisible). Coverage decay from catalog growth is visible without gaming.

**Negative.** More cognitive load for consumers. Executive summaries are richer than a single number. Rendering is more complex.

**Neutral.** The five critical dimensions (per ADR-0010) remain load-bearing for the headline. The L4/L5-require-adversarial-proof property (per ADR-0007 and v0.1) is preserved.

## References

- [`methodology/SCORECARD.md`](../../methodology/SCORECARD.md).
- ADR-0010 (dual-number rendering + non-configurable headline).
- ChatGPT cross-LLM review of v0, P0-3.
