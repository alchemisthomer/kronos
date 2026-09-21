# runner/prototype/

Static HTML/CSS/JS dashboard for viewing kronos user-assurance analysis reports. Prototype for the future `runner/` React SPA — this proves the data model + interaction pattern without any build step.

## View

Open `index.html` in a browser. That's it. No server, no build, no `npm install`.

The dashboard boots with **embedded synthetic sample data** — two users demonstrating every anomaly class across every dimension. Use the "Load analysis JSONs…" button to swap in real analysis output from the primitive tools.

## Load real data

Click "Load analysis JSONs…" and multi-select any `*-analysis.json` files produced by the kronos salesforce user-scoped tools:

- `user-<slug>-permissions-analysis.json` (from `salesforce-rest-user-permissions`)
- `loginhistory-<slug>-analysis.json` (from `salesforce-rest-user-loginhistory`)
- `user-<slug>-shares-analysis.json` (from `salesforce-rest-user-shares`)
- `user-<slug>-group-membership-analysis.json` (from `salesforce-rest-user-group-membership`)
- `user-<slug>-connected-apps-analysis.json` (from `salesforce-rest-user-connected-apps`)
- `user-<slug>-audit-trail-analysis.json` (from `salesforce-rest-user-audit-trail`)

The dashboard:

- **Groups analyses by `user.id`** — different tools all reference the same user.
- **Reads `kronos_analysis_kind` on each JSON** to route it to the right renderer. Falls back to filename pattern (`*-permissions-*`, `*-loginhistory-*`, etc.) if the field is absent.
- **Aggregates anomalies** into per-user overview counts (critical / high / medium / low) shown as KPIs and sidebar badges.
- **Renders each dimension** in its own tab with a summary card, detail tables, and a collapsible raw-JSON viewer.

## Common JSON envelope

Every analysis file this dashboard consumes has this shape:

```json
{
  "kronos_analysis_kind": "user-permissions" | "user-loginhistory" | "user-shares" | ...,
  "tool": "salesforce-rest-user-...",
  "tool_version": "0.1.0",
  "generated_at": "2026-...",
  "user": {
    "id": "005...",
    "username": "...",
    "name": "...",
    ...dimension-specific...
  },
  "totals": { ... },
  "anomalies": [
    { "class": "...", "severity": "low|medium|high|critical", "detail": "...", "evidence": {} }
  ],
  ...dimension-specific dimensions...
}
```

The primitive tools that ship with kronos emit this shape. If you're building a custom tool, follow it and the dashboard will render your output alongside the framework tools' output.

## Not client data

The embedded sample data uses synthetic identifiers (`005000000000000AAA`, `alice.admin@acme.example.com`, `Sales Team West`, etc.). Never modify this file to include real client-identifying strings — see `../../CLAUDE.md` and `../../SECURITY.md`. The content-isolation validator (`scripts/verify-no-client-content.sh`) scans this file on every commit and CI run.

## From prototype to `runner/`

This dashboard defines the interaction surface the future `runner/` React SPA will implement:

1. Read a target repo's `kronos/engagement/**/*-analysis.json` files via the GitHub REST API (this prototype uses local file input instead).
2. Group by user, render per-dimension tabs.
3. Allow edits to engagement documents that land as pull requests.

The prototype's `renderPermissions`, `renderLoginHistory`, etc. functions are the reference specs for the React components the runner will implement.
