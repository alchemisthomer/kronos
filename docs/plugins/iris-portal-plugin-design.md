# Kronos iris portal plugin — architectural design

**Mount:** `beta.olympus-grid.com/kronos` (path-based route on the beta domain, companion to the Aeon mount at `beta.olympus-grid.com/agent`).

**Role in Kronos's stack:** cosmetic storefront. The plugin reads markdown content from a public GitHub tree and renders it. It does not host content. It does not persist anything. It is replaceable without data loss.

**Authored by:** kronos (this repo, this doc).
**Built by:** the iris agent (writes React source under `iris/reactforce/kronos/`).
**Deployed by:** the olympus-grid agent (places built bundle + `Plugin.iris_deployment_kronos.md-meta.xml` in the olympus-grid managed package).

Kronos's agent (CSO-of-the-universe mandate) does not modify iris source or olympus-grid metadata. Kronos authors the specification and reviews what lands. See [`../handoff/kronos-portal-plugin-handoff.md`](../handoff/kronos-portal-plugin-handoff.md) for the handoff checklist for the other two agents.

---

## Why the storefront is kept cosmetic

See [`../blog/concept.md`](../blog/concept.md). Short version: Kronos's blog cannot be gated by Olympus-Grid, because Olympus-Grid is a Kronos target. The storefront can be served from Olympus-Grid's CDN because the storefront is replaceable; the content, which is not, must live elsewhere.

## Surfaces the plugin renders

1. **Entrance** (`/kronos`) — a single hero + a chronological list of posts.
   - Hero copy is the mythic framing (Titan, devourer, reckoning). It is **short**: one line above the fold, one paragraph below.
   - Post list is reverse-chronological; each row is `date · kind · title · one-line summary`. Rows are clickable permalinks.
   - Three filters: by `kind` (incident, target, doctrine), by `primitive`, by `target`.
2. **Post** (`/kronos/p/<slug>`) — a single post, rendered from the markdown file at `docs/blog/posts/<slug>.md`.
   - Frontmatter is rendered as a sidebar: date, kind, targets, primitives, claims_touched, scorecard_delta, link to engagement if present.
   - Body is standard markdown with code-fence highlighting and typographic quotes.
   - Footer links: "Primary source" (if the frontmatter has a URL on a target), "Companion reckoning" (if the body links to another post in this blog).
   - If `status: retracted`, a prominent banner at the top with the retraction notice (which is a prepended block in the post body).
3. **Claim** (`/kronos/claim/<claim-id>`) — a single page per Kronos claim id (`K-C1-TENANT-SECRET-ENVELOPE`, etc.).
   - Reads the claim's description, oracle id, and current state from `methodology/SCORECARD.md` (parsed structurally — see Content shape below).
   - Lists every post whose `claims_touched` includes this claim id.
   - Lists every target that has been scored on this claim, with current scorecard level.
4. **Target** (`/kronos/t/<target-slug>`) — a single page per target that has been named in a post.
   - Lists every post that names the target (any role: breached, reckoned, referenced).
   - If the target has been formally reckoned (there is a `kind: target` post), the scorecard for that target is rendered inline.
5. **About** (`/kronos/about`) — pulls `docs/blog/README.md` + `docs/blog/concept.md` and renders them as two tabs. No separate marketing copy.

That is the entire surface. No comment system, no email capture, no "related posts" ML, no personalization. If a reader wants to see more, they filter.

## Content shape — what the plugin reads

The plugin reads **four kinds of file** from `raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/`:

| Path | Format | What it is |
|---|---|---|
| `docs/blog/index.json` | JSON | Manifest of all published posts. See [`../blog/README.md`](../blog/README.md#the-index). The plugin reads this first on every page load, caches for 60 seconds, then fetches individual posts on demand. |
| `docs/blog/posts/<slug>.md` | Markdown + YAML frontmatter | Post content. Fetched on demand when a reader opens a permalink. See [`../blog/README.md`](../blog/README.md#post-format) for the mandatory structure. |
| `methodology/SCORECARD.md` | Markdown with structured sections | Claim definitions, oracle references, and the operator's current scoring of each target on each claim. The plugin parses the `## K-C<N>-<NAME>` headings and the following tables. |
| `docs/blog/README.md`, `docs/blog/concept.md` | Markdown | Rendered on `/kronos/about`. |

That is the full content vocabulary. If a page in the plugin wants to render something that is not in those four files, the plugin is doing something it should not be doing.

## Why `raw.githubusercontent.com` and not Hermes or Athena

The plugin fetches directly from GitHub, not via Hermes or any Olympus-Grid-side proxy. Three reasons:

1. **Trust path.** The whole point of Kronos's content living outside Olympus-Grid is that Olympus-Grid cannot alter it. A Hermes proxy puts Olympus-Grid back in the trust path, defeating the point.
2. **CORS.** `raw.githubusercontent.com` serves `Access-Control-Allow-Origin: *` for public repos. The browser can fetch directly. No proxy needed.
3. **Simplicity.** The plugin is a static-resource React SPA. Adding a backend dependency to render blog posts introduces a maintenance surface Kronos does not want to own.

If GitHub rate-limits (60 unauthenticated requests per hour per IP for API; raw.githubusercontent.com is more generous but not unlimited), the plugin degrades gracefully: it caches `index.json` for 60s, caches individual post bodies for the browser session, and shows a specific "GitHub is rate-limiting; please try again shortly" message if a fetch 429s. The plugin does **not** fall back to a Hermes proxy; graceful degradation preserves the trust path.

## Routing within Olympus-Grid's iris pattern

Reference: `olympus-616/CLAUDE.md` *Iris Portal Bundle Release* and the `beta.olympus-grid.com/agent` Aeon precedent (`project_aeon_v1_attested_2026_10_20` in memory).

The plugin needs **one** `Plugin.iris_deployment_kronos.md-meta.xml` record in olympus-grid with configuration:

```json
{
  "active": true,
  "description": "Kronos — the Reckonings blog + CSO surface",
  "sequence": 100,
  "percent": 100,
  "conditions": { "domain": "beta.olympus-grid.com", "pathPrefix": "/kronos" },
  "bundleResource": "kronos",
  "bundleNamespace": "",
  "allowBundleDomain": true,
  "bundleId": "<pinned bundle id — stamped at publish time>",
  "startTime": "",
  "endTime": ""
}
```

Routing is path-based on the already-live `beta.olympus-grid.com` domain. The Aeon mount at `/agent` is sequence=100 for its own pathPrefix; Kronos at `/kronos` is a sibling record. No new domain, no new CloudFront config, no new DNS.

## Bundle ceremony — Kronos is included in `validate-iris-bundles.sh`

The olympus-grid pre-release validator (`scripts/validate-iris-bundles.sh`) will need a row for `kronos` once the bundle lands. The validator's three invariants (routeable, bundle match, no orphans) all apply:

- **Routeable:** Kronos's deployment record will have `conditions.pathPrefix = "/kronos"` — satisfies the routeable rule.
- **Bundle match:** Kronos is a LOCAL bundle (not CDN-only). `bundleResource: "kronos"` → folder `olympus-grid/force-app/ui/portal/default/staticresources/kronos/`. The `main.bundle.<id>.js` filename must match `Configuration__c.bundleId`.
- **No orphans:** The `kronos` static resource folder must be referenced by its deployment record.

Also: the StaticResource meta-xml must declare `<cacheControl>Public</cacheControl>` and `<contentType>application/x-zip-compressed</contentType>`. See memory `feedback_static_resource_cache_control_public_for_portal`. Site Guest cannot fetch a Private-cached static resource; the symptom is a 404 with empty body (looks exactly like "resource not deployed").

## What the plugin does NOT do

Explicit non-features. If any of these appear in a future PR to the plugin, Kronos is reviewing them hostile:

- **No local persistence.** No IndexedDB, no localStorage beyond theme preference, no session cookies.
- **No analytics.** Reckonings does not count readers. Reckonings does not identify readers. If the operator wants to know how many people read a post, the operator reads CloudFront access logs; the plugin itself does not instrument.
- **No submission form.** Readers do not submit tips, feedback, or incident reports through the plugin. If a reader wants to reach the operator about a reckoning, the kronos repo's `SECURITY.md` is the inbox.
- **No live-data pulls from olympus-grid.** The plugin does not call Apex. It does not call Hermes. It does not read Salesforce. The storefront is on olympus-grid; the content pipeline is not.
- **No AI generation.** Posts are human-authored (by the kronos agent, with the Steward's review). The plugin does not generate text, suggest edits, or summarize posts. If the methodology changes and this ever changes, that is a doctrine reckoning, and it goes through the normal publication path.

## Theme

Visual language:

- **Palette.** Deep near-black background. Bone-white body. Ember-orange accent for links and the kind-badge on `kind: incident`. Pale-blue accent for `kind: doctrine`. Gold accent for `kind: target` (same gold as the EOS-companion dashboard restyle on the salesforce-user-permissions-primitive neuralpathway — intentional lineage).
- **Typefaces.** Headings in a serif that reads as mythic — Cinzel (same choice as the EOS-companion dashboard). Body in a workhorse serif — Source Serif or similar. Code in JetBrains Mono. No sans-serif body.
- **Layout.** Narrow single-column body (max 70ch), generous line-height, no sidebars except on `/kronos/p/<slug>` where frontmatter is rendered as a right-hand rail. Mobile layout collapses the rail under the title.
- **Chrome.** Minimal. A header with the word *Reckonings* and a filter affordance. A footer with: AGPL-3.0, link to the kronos repo, link to `methodology/README.md`. No breadcrumbs, no nav tree, no "home" link beyond the header word.

## Build commands (from iris side, once the iris agent scaffolds the workspace)

Following the pattern established by portal/turtleshell/servicedesk/athena/olympusgrid in `iris/reactforce/<app>/`:

```bash
cd olympus-616/iris
npm run kronos             # dev server (new port, see Port Assignments in olympus-616/CLAUDE.md)
npm run publishKronos      # vite build + copy to olympus-grid static resource
npm run deployAlphaKronos  # publish + sf project deploy start --target-org alpha-org
```

Hot-reload against production via `https://beta.olympus-grid.com/kronos?bundleDomain=http://localhost:<port>`.

## Build commands (from olympus-grid side)

```bash
cd olympus-616/olympus-grid
sf project deploy start \
  --source-dir force-app/ui/portal/default/staticresources/kronos \
  --source-dir force-app/ui/portal/default/staticresources/kronos.resource-meta.xml \
  --source-dir force-app/ui/portal/default/customMetadata/Plugin.iris_deployment_kronos.md-meta.xml \
  --target-org dev_enterprise
```

Deployment to alpha-org is via the standard managed-package cycle. Scratch-org testing via the direct `sf project deploy start` above.
