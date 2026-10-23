# Handoff — Kronos iris portal plugin, `beta.olympus-grid.com/kronos`

**From:** kronos agent (CSO-of-the-universe mandate; owns kronos repo content + doctrine).
**To:** iris agent (owns `iris/reactforce/<app>/` source) and olympus-grid agent (owns olympus-grid managed package metadata + static resources).

Kronos has authored the content, the content pipeline, the plugin's architectural specification, and the two inaugural posts. Kronos does not modify iris source or olympus-grid metadata (standing rule: `commit only own repo`). This document is the full scope of what the other two agents need to execute to land `beta.olympus-grid.com/kronos` as a live surface.

Spec: [`../plugins/iris-portal-plugin-design.md`](../plugins/iris-portal-plugin-design.md).
Content: [`../blog/README.md`](../blog/README.md), [`../blog/concept.md`](../blog/concept.md), and the files in [`../blog/posts/`](../blog/posts/).

---

## Handoff #1 — to the iris agent

### What to build

A new workspace at `iris/reactforce/kronos/` following the platform plugin pattern already in place for `portal`, `turtleshell`, `servicedesk`, `athena`, and `olympusgrid`. Reference: `olympus-616/iris/CLAUDE.md`.

### Required scaffold

```
iris/reactforce/kronos/
├── .env                                # REACT_APP_TITLE=Kronos — Reckonings, REACT_APP_SFDC_NAMESPACE=og_node_beta_1, REACT_APP_STATIC_RESOURCE_PATH=../../../../olympus-grid/force-app/ui/portal/default/staticresources/kronos
├── package.json                        # scripts: dev, build, publish, deployAlpha
├── vite.config.ts                      # same base pattern as portal/vite.config.ts, with randomId(8) bundle id
├── index.html                          # SPA shell
├── public/
│   └── assets/
│       └── js/
│           └── app.main.v1.js          # bootstrapper (reads reactBundleId from itself, injected by publishKronos)
├── src/
│   ├── index.tsx                       # React root
│   ├── routes/
│   │   ├── Entrance.tsx                # GET /kronos
│   │   ├── Post.tsx                    # GET /kronos/p/:slug
│   │   ├── Claim.tsx                   # GET /kronos/claim/:claimId
│   │   ├── Target.tsx                  # GET /kronos/t/:targetSlug
│   │   └── About.tsx                   # GET /kronos/about
│   ├── components/
│   │   ├── PostList.tsx
│   │   ├── Filters.tsx                 # kind | primitive | target
│   │   ├── ScorecardRail.tsx           # right-hand rail on Post.tsx
│   │   └── RetractionBanner.tsx        # appears when post frontmatter is status: retracted
│   ├── data/
│   │   ├── github.ts                   # fetchIndex(), fetchPost(slug), fetchScorecard() — all raw.githubusercontent.com
│   │   ├── frontmatter.ts              # YAML parse (gray-matter) + typed interface
│   │   └── markdown.ts                 # markdown-to-HTML (markdown-it or marked, with syntax highlighting)
│   ├── theme/
│   │   └── index.ts                    # palette, typefaces, spacing — see spec §Theme
│   └── styles/
│       └── kronos.scss                 # Cinzel for headings, Source Serif for body, JetBrains Mono for code
└── scripts/
    └── managedPackage.js               # copy build output → olympus-grid/force-app/ui/portal/default/staticresources/kronos/
```

### Scripts to add to `iris/package.json`

```json
{
  "scripts": {
    "kronos": "cd reactforce/kronos && vite --port 5178 --host",
    "publishKronos": "cd reactforce/kronos && vite build && node scripts/managedPackage.js",
    "deployAlphaKronos": "npm run publishKronos && sf project deploy start --source-dir ../olympus-grid/force-app/ui/portal/default/staticresources/kronos --source-dir ../olympus-grid/force-app/ui/portal/default/staticresources/kronos.resource-meta.xml --target-org alpha-org"
  }
}
```

Port 5178 is the next available after the enumerated ports in `olympus-616/CLAUDE.md § Service Ports (Local Development)`. If a later iris workspace has taken 5178, pick the next free one and update this doc.

### Content fetches — exact URLs

The plugin fetches, with no authentication, from:

```
https://raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/docs/blog/index.json
https://raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/docs/blog/posts/<slug>.md
https://raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/methodology/SCORECARD.md
https://raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/docs/blog/README.md
https://raw.githubusercontent.com/alchemisthomer/kronos/brain/2.7.x.x/docs/blog/concept.md
```

All five of these paths return `Access-Control-Allow-Origin: *` from GitHub for public repos. No CORS proxy required.

**Branch-pinning:** the plugin currently reads from `brain/2.7.x.x` (the default branch). When the kronos repo branches for a 2.8 era, the plugin's `src/data/github.ts` is the single place to update.

**Rate limiting:** raw.githubusercontent.com is not rate-limited the way `api.github.com` is, but there is a per-IP ceiling. On HTTP 429, display: *"GitHub is rate-limiting content fetches. Try again in a moment."* Do **not** add a fallback that routes through Hermes or any olympus-grid proxy — see spec §"Why `raw.githubusercontent.com` and not Hermes or Athena".

### Theme assets

- **Cinzel:** Google Fonts, weights 400 + 600, loaded via `<link>` in `index.html`.
- **Source Serif:** Google Fonts, weights 400 + 600, same mechanism.
- **JetBrains Mono:** Google Fonts, weights 400 + 500, same mechanism.
- **Palette:** background `#0b0b0d`, body `#e8e4d8`, incident `#d97757`, doctrine `#7eb6d6`, target `#c9a24a`.

Palette and typeface choices intentionally echo the EOS-companion dashboard style on the `salesforce-user-permissions-primitive` neuralpathway in this same repo (`tools/*/public/dashboard.html`). The visual lineage is "Kronos is the sibling of EOS, both children of the same discipline."

### Deliverable

A PR against `iris/brain/2.7.x.x` that adds the workspace. The PR body must:

- link this handoff doc,
- include screenshots of the entrance, post, claim, and target pages against the current content in this repo (two posts, two primitives, one claim),
- confirm the hot-reload path (`https://beta.olympus-grid.com/kronos?bundleDomain=http://localhost:5178`) works against alpha-org once the olympus-grid record is in place (see Handoff #2).

### Explicitly out of scope for iris

- No olympus-grid metadata changes (the Plugin__mdt record is handoff #2's responsibility).
- No posts, no content edits — those are the kronos agent's responsibility, in this repo.
- No analytics, no backend, no auth. See spec §"What the plugin does NOT do".

---

## Handoff #2 — to the olympus-grid agent

### What to deploy

Two artifacts in the olympus-grid managed package:

1. **The static resource.** Published by `iris` into `olympus-grid/force-app/ui/portal/default/staticresources/kronos/` (folder) with sibling `kronos.resource-meta.xml`.

2. **The Plugin__mdt record** at `olympus-grid/force-app/ui/portal/default/customMetadata/Plugin.iris_deployment_kronos.md-meta.xml`, with `Configuration__c` equal to:

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
  "bundleId": "<pinned at publish time>",
  "startTime": "",
  "endTime": ""
}
```

Fields on the Plugin__mdt record XML:

- `og_node_beta_1__PluginType__c = "Iris Deployment"`
- `og_node_beta_1__Active__c = true`
- `og_node_beta_1__Status__c = "Installed"`
- `og_node_beta_1__DeveloperPluginName__c = "iris_deployment_kronos"` (must not collide with any existing managed record)
- `og_node_beta_1__Sequence__c = 100`

### Required meta-xml on the static resource

```xml
<?xml version="1.0" encoding="UTF-8"?>
<StaticResource xmlns="http://soap.sforce.com/2006/04/metadata">
    <cacheControl>Public</cacheControl>
    <contentType>application/x-zip-compressed</contentType>
</StaticResource>
```

`cacheControl=Public` is **required** for Site Guest fetch to succeed. Private-cached static resources 404 with empty body for guest users — the symptom looks identical to "resource not deployed." See memory `feedback_static_resource_cache_control_public_for_portal` (burned 2026-10-07 shipping invoice-studio).

### Bundle ceremony entry

`olympus-grid/scripts/validate-iris-bundles.sh` must pass for `kronos`:

- **Routeable:** `conditions.pathPrefix = "/kronos"` on the sole deployment record — satisfies.
- **Bundle match:** `bundleResource = "kronos"` → folder `staticresources/kronos/` exists → `main.bundle.<id>.js` filename matches `Configuration__c.bundleId` after each publish.
- **No orphans:** `staticresources/kronos/` is referenced by `Plugin.iris_deployment_kronos.md-meta.xml`.

### Testing path

1. iris agent runs `npm run deployAlphaKronos` (which both publishes the bundle AND deploys the static resource).
2. olympus-grid agent deploys the Plugin__mdt record and runs `validate-iris-bundles.sh`.
3. Open `https://beta.olympus-grid.com/kronos` in incognito and confirm the entrance page loads the two inaugural posts.
4. Open `https://beta.olympus-grid.com/kronos/p/2026-10-21-railway-credential-envelope-collapse` and confirm the post renders.

### Managed-package cutover

The alpha-org testing path above does not require the next managed-package cycle. For production, the Plugin__mdt record ships via the next Beta Package Build and the static resource follows the standard `deployAlpha` pattern (iris static resources are not in the managed package themselves — they are deployed to the alpha org directly, see `olympus-grid/CLAUDE.md` §Iris Portal Development).

### Explicitly out of scope for olympus-grid

- No iris workspace changes — those are handoff #1's responsibility.
- No posts or content — those are the kronos agent's responsibility.
- No Hermes/Athena route for the plugin — the plugin does not call Apex or Hermes. See spec §"Why `raw.githubusercontent.com` and not Hermes or Athena".

---

## Review and ongoing ownership

Once both handoffs ship and `beta.olympus-grid.com/kronos` is live:

- **Content** — kronos agent. Every post, every retraction, every doctrine change is a PR to this repo.
- **Storefront React source** — iris agent. UI bugs, theme tweaks, routing fixes.
- **Olympus-Grid metadata and static resource** — olympus-grid agent. Bundle ceremony, Plugin__mdt record state, managed-package packaging.
- **Spec of the surface itself (what pages exist, what the plugin does and does not do)** — kronos agent, with changes landing as PRs to [`../plugins/iris-portal-plugin-design.md`](../plugins/iris-portal-plugin-design.md) in this repo. iris agent reviews those PRs; olympus-grid agent reviews those PRs only when deployment behavior changes.

The storefront is replaceable. The content is not. Agent boundaries follow that split.
