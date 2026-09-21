# runner/prototype/

Static executive assurance dashboard for kronos. Single-file HTML/CSS/JS. Zero build. Zero server. Open the file in any browser.

## Companion to EOS

The visual language mirrors [`alchemisthomer/eos`](https://github.com/alchemisthomer/eos) — the two frameworks are designed as companions:

- **EOS attests.** It produces evidence that a system does what its designers claim it does.
- **Kronos falsifies.** It produces evidence that a system's claims can (or cannot) be broken under adversarial pressure.

Same palette, same typography, same design vocabulary — so a stakeholder reviewing both consoles in the same session doesn't context-switch between visual languages.

| Token | Value | Meaning |
|---|---|---|
| `--bg` | `#06060a` | Near-black canvas |
| `--fg` | `#e8e4dc` | Parchment-cream text |
| `--gold` | `#fcd34d` | Brand accent, headings, highlights |
| `--emerald` | `#34d399` | Success, clean, attested |
| `--rose` | `#ef4444` | Critical finding, danger |
| `--amber` | `#f59e0b` | High severity |
| `--sapphire` | `#60a5fa` | Low / informational |
| — | Cinzel serif | Headings, brand mark |
| — | JetBrains Mono | Everything else |

## Drill-down structure

```
Portfolio (home)  → the CEO view: KPIs, "what you need to know", engagement grid
    Engagement    → per-target executive brief: takeaway, summary, scenarios, findings, scorecard delta
        Scenario  → the attack / oracle verdict / findings / evidence bundle
```

Every view is deep-linkable via URL hash (`#/`, `#/e/<engagement-id>`, `#/e/<engagement-id>/s/<scenario-id>`) so screenshots and shared links open to the exact intended state.

## View

Open `index.html` in any browser. Boots to the portfolio home with three synthetic engagements:

- **Northwind Retail** · running · evidence stage · **2 critical findings**. Insider-simulation reproducing a compromised user's data pull. Six scenarios drill through the compromised user's authorization envelope, login history, OAuth grants, sharing envelope, audit trail, and full data reproduction.
- **Vega Health** · shipped · **clean**. HIPAA-adjacent attestation support. Every finding closed, no waivers, scorecard delta moves Identity/Access + Data Integrity to L4.
- **Meridian Insurance** · running · investigating. 41× baseline AWS NAT-gateway spend — the cost-integrity dimension no security tool would have caught (echoes the founding-incident case study).

## Home view

- **Hero**: portfolio KPIs — engagements open, critical findings, avg maturity, coverage — with a Cinzel headline in the mythic manuscript aesthetic.
- **"What you need to know"**: curated bulletins with severity coloring (rose = critical, amber = high, gold = medium, sapphire = low, emerald = clean).
- **Engagement portfolio grid**: cards with target name, platform, status badge, findings-bar visualization, and drill-in.

## Engagement detail

- **Detail hero** with target name in Cinzel, meta row in JetBrains Mono.
- **Key takeaway** color-coded callout with icon (⚠ / ✓ / ⚡).
- **Executive summary** — multi-paragraph prose.
- **Scenarios list** — click any row to drill in.
- **Findings summary** — 5-card breakdown by severity.
- **Scorecard delta** — 4 pillars × 3 dimensions, before/after level with direction arrow.

## Scenario detail

- **Detail hero** with verdict badge and threat class.
- **Oracle verdict** — the deterministic pass/fail rationale.
- **Findings** — severity-coloured cards with evidence JSON.
- **Attack summary** — what the tool did.
- **Evidence artifacts** — kind / path / bytes / sha256.

## Content isolation

Sample data uses fully synthetic names (`Northwind Retail`, `Vega Health`, `Meridian Insurance`) and fully synthetic identifiers. The content-isolation validator (`scripts/verify-no-client-content.sh`) scans this file on every commit and CI run. Never modify this file to include real client-identifying strings — see `../../SECURITY.md` and `../../CLAUDE.md`.

## From prototype to `runner/`

This prototype defines the interaction surface the future `runner/` React SPA will implement. Same design tokens, same drill-down structure, same layout patterns. The React port will additionally read live engagement data from a target repo's `kronos/engagement/**/*.md` via the GitHub REST API.

## Export

Top-right **Export** button triggers browser print → clean PDF for stakeholder distribution. The dark background prints as-is; if a lighter print is preferred, use browser print settings to invert colors.
