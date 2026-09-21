# runner/prototype/

Static executive dashboard for kronos. Single-file HTML/CSS/JS. Zero build. Zero server. Open the file in any browser.

## What this is

The prototype of the CEO-facing assurance console. Top-down drill-down:

```
Portfolio (home)   → what a CEO or board reviewer sees first
    Engagement     → what a customer sees for one target
        Scenario   → the attack / finding / evidence bundle
```

Every view is deep-linkable via URL hash (`#/`, `#/e/<engagement-id>`, `#/e/<engagement-id>/s/<scenario-id>`) so screenshots and stakeholder shares open to the exact state intended.

## View

Open `runner/prototype/index.html` in any browser. Boots to the portfolio home with three synthetic engagements that demonstrate the range of what kronos catches:

- **Northwind Retail** (running · evidence stage) — insider-simulation reproducing a compromised user's data pull. Critical findings surfaced. Six scenarios drill through the compromised user's authorization envelope, login history, OAuth grants, sharing envelope, audit trail, and full data reproduction.
- **Vega Health** (shipped · clean) — HIPAA-adjacent attestation support. Every finding closed, no waivers, scorecard delta moves Identity/Access and Data Integrity to L4 (adversarially challenged). Demonstrates the "successful audit" ship state.
- **Meridian Insurance** (running · investigating) — cost-anomaly engagement driven by the plausibility monitor. 41× baseline AWS NAT-gateway spend. Not a security compromise — a cost-integrity dimension no security tool would have caught. Demonstrates the founding-incident class of finding.

## Home view — what a CEO sees

- **Hero**: portfolio KPIs (open engagements, critical findings, avg maturity, coverage%).
- **"What you need to know"**: 3-5 curated bulletins with severity coloring — the CEO doesn't need to read every engagement's markdown, they need the headlines that require attention.
- **Portfolio grid**: engagement cards with status badge, findings summary bar (crit / high / medium / low), and drill-in affordance.

## Engagement detail — what a customer or auditor sees

- **Hero**: target name, engagement-ordinal, mode, environment, opened/updated dates.
- **Key takeaway**: single-sentence executive verdict, color-coded by severity.
- **Executive summary**: multi-paragraph prose describing what happened and what it means.
- **Scenarios list**: every scenario with its verdict badge and threat class.
- **Findings summary**: 5-card visualization of critical / high / medium / low / total counts.
- **Scorecard delta**: 4-pillar heatmap showing before → after per dimension with direction arrows.

## Scenario detail — what an analyst or IR responder sees

- **Hero**: scenario name, verdict, severity, threat class.
- **Oracle verdict**: deterministic pass/fail rationale.
- **Findings**: cards per finding with severity pill, class name, detail, and evidence blob.
- **Attack summary**: what the tool did.
- **Evidence artifacts**: kind / path / bytes / sha256 — the audit trail.

## No client-identifying content

Sample data uses fully synthetic names (`Northwind Retail`, `Vega Health`, `Meridian Insurance`) and fully synthetic user IDs (`005000000000001BBB` style). Real engagement data belongs in the adopter's own repo, not here — see [`../../SECURITY.md`](../../SECURITY.md) for the client-data isolation policy.

The content-isolation validator scans this file on every commit and CI run.

## From prototype to production `runner/`

This prototype defines the design system, interaction model, and drill-down hierarchy the future `runner/` React SPA will implement. The React version will additionally:

- Read engagement data from a target repo's `kronos/engagement/**` folder via the GitHub REST API.
- Render engagement markdown documents directly (not just the summary cards).
- Allow annotations and status changes that land as pull requests against the target repo.
- Support multi-target portfolios (many engagement repos aggregated into one console).

The visual language, color palette, typography, spacing, and interaction pattern in this prototype are the reference for the React port.

## Export / print

The dashboard's print stylesheet is the CSS defaults — a browser's Print → Save as PDF produces a clean report suitable for stakeholder distribution. Use the top-right Export button to trigger print dialog.

## File contents

- `index.html` — the whole thing. ~2200 lines. HTML + CSS + JS + sample data.
- `data/` — gitignored drop-zone for future real-data loading.
- (No `sample-data/` folder; sample data is inline in `index.html` for immediate viewing off file://.)
