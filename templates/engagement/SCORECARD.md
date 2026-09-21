---
target:
  slug: <target-slug>
  display_name: <Human-Readable Target Name>
  primary_repository: <github-org>/<repo>
catalog:
  version: kronos-catalog-2026.07.24
  pinned_at: 2026-07-24
scoring:
  # HEADLINE is not configurable. Per ADR-0010, the public headline is fixed as
  # minimum-across the five critical dimensions listed below (which cannot be
  # disabled). The pillar_weights and secondary_formula fields configure
  # SECONDARY views only, not the headline.
  headline_formula: minimum_across_critical_dimensions   # FIXED, do not change
  secondary_formula: weighted_average                     # for non-critical secondary views
  pillar_weights:
    A: 1.0
    B: 1.0
    C: 1.0
    D: 1.0
dimensions:
  # CRITICAL DIMENSIONS (cannot be disabled — see SCORECARD.md §Critical dimensions):
  A_perimeter_and_access:
    identity_and_access_control: { enabled: true, critical: true }
    perimeter_defense:           { enabled: true, critical: true }
    secret_management:           { enabled: true, critical: true }
  B_runtime_integrity:
    data_integrity:              { enabled: true, critical: true }
    availability_and_resilience: { enabled: true, critical: false }
    observability:               { enabled: true, critical: false }
  C_operational_discipline:
    cost_integrity:              { enabled: true, critical: false }
    change_discipline:           { enabled: true, critical: false }
    supply_chain:                { enabled: true, critical: false }
  D_response_readiness:
    incident_response:           { enabled: true, critical: true }
    recovery_and_continuity:     { enabled: true, critical: false }
    compliance_posture:          { enabled: true, critical: false }
integration:
  # Optional. If eos is co-installed in this target, points at its cycle folder.
  # Kronos scorecard reads this folder for L3-eligibility traceability (not a
  # gate — per ADR-0008, L3 is attainable natively without eos).
  eos_folder: foundation/eos/cycle
  # Optional. If the plausibility monitor is enabled for this target, points
  # at the capacity model file. Findings from the monitor feed the Cost
  # Integrity dimension primarily.
  capacity_model: foundation/kronos/capacity.yaml
---

# Scorecard configuration for `<target-slug>`

This file configures how the kronos runner renders the maturity scorecard for this target. Edit the YAML frontmatter to customize scoring for your specific target.

## Fields

- **`target.slug`** — short identifier used in engagement filenames (`<target-slug>.kronos-<N>.md`).
- **`target.display_name`** — human-readable name shown in the runner UI.
- **`target.primary_repository`** — the GitHub `owner/repo` the runner should read for engagement documents.
- **`catalog.version`** — which version of the kronos threat catalog is applicable to this target's scoring. Pinning insulates the target from catalog upgrades until the operator explicitly re-pins.
- **`scoring.summary_formula`** — how the top-line score is computed. `minimum_across_dimensions` is the strictest and default; `weighted_average` uses the pillar weights.
- **`dimensions.<pillar>.<dimension>.enabled`** — set to `false` to disable a dimension that is not applicable to this target (e.g., a system with no supply chain may disable `supply_chain`). Disabled dimensions do not affect the top-line score.
- **`integration.eos_folder`** — path from repo root to the target's eos cycle folder. Used to determine L3 eligibility. If omitted, kronos operates independently of eos.

## Reading the rendered scorecard

The runner reads this file, walks the target's `kronos/engagement/06_shipped/` folder to gather scorecard deltas, and reads the `integration.eos_folder` to determine L3 eligibility. The rendered scorecard is the composite of these three data sources at the current git HEAD.

Historical trajectory views walk the git history of the same three data sources to reconstruct the scorecard at any prior state.

## First-time setup

1. Replace `<target-slug>` and `<Human-Readable Target Name>` in the frontmatter.
2. Set `target.primary_repository` to your target's GitHub repo path.
3. If your target does not use eos, remove or comment out the `integration.eos_folder` field.
4. If any dimensions are not applicable, set their `enabled` to `false`.
5. Commit the file.

The scorecard starts at L0 across all enabled dimensions. Every shipped engagement updates one or more dimensions.
