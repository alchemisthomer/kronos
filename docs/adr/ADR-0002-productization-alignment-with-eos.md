# ADR-0002 — Productization alignment with the eos repository shape

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The Steward, Kronos
- **Supersedes:** None
- **Superseded by:** None

## Context

Kronos is being designed as a first-class open-source product paralleling the eos methodology framework at `alchemisthomer/eos`. Both frameworks will be sold together as the two halves of an assurance offering — eos attests, kronos falsifies — through the operator's consulting practice.

For the two products to be adoptable by the same target with coherent operator experience, they must share:

- Directory layout at the repository root
- Adoption pattern (filesystem copy of `templates/`)
- Reference viewer pattern (React/TypeScript SPA reading git via GitHub REST)
- OAuth backend pattern (standalone Node/Express service, PAT fallback)
- Actions catalog pattern (GitHub Actions enforcing kanban discipline)
- Methodology-folder pattern (`methodology/OPERATING-MANUAL.md` + N-CLAIMS + TEMPLATE)
- Patent + white paper artifact pattern (top-level docs at repo root)

The `alchemisthomer/eos` PR #1 (`scaffold: framework skeleton + reference viewer + oauth-server`) established this shape for eos. Prior to this ADR, the kronos design conversation had been drifting toward a different shape (Athena 0.1's monorepo with `apps/` + `packages/` + `adapters/`) which would have created two structurally-different products under the same consulting practice.

## Decision

Kronos adopts the exact directory shape established by `alchemisthomer/eos`. The repository root contains:

```
alchemisthomer/kronos/
├── README.md                       # public-facing overview
├── LICENSE                         # GNU AGPL v3
├── PATENT-DISCLOSURE-DRAFT.md      # inventive-claim disclosure (post design-review)
├── WHITE-PAPER.md                  # theory + practice narrative (post first-engagement)
├── SOC2-CONTROL-MAPPING.md         # scorecard dimensions × SOC 2 controls (post methodology-stabilization)
├── DESIGN.md                       # wide-net vision doc for LLM design review
├── methodology/                    # the intellectual property
│   ├── README.md
│   ├── OPERATING-MANUAL.md
│   ├── SEVEN-CLAIMS.md
│   ├── SCORECARD.md
│   └── TEMPLATE.md
├── runner/                         # React/TS reference viewer for the engagement kanban + scorecard
├── oauth-server/                   # standalone Node/Express GitHub App OAuth code-exchange
├── actions/                        # reusable GitHub Actions
├── templates/                      # copy-in scaffolds for adopting projects
├── docs/                           # quickstart, examples, ADRs
└── docs/inception/                 # the founding incident + case study (already committed)
```

Kronos also adopts eos's operational conventions:

- Filesystem-copy adoption of `templates/engagement/` into target repositories under `<target>/kronos/engagement/`
- Runner is technology-agnostic — it reads folders, markdown, and YAML frontmatter from any GitHub repository and renders the kanban + scorecard in the browser
- OAuth-server is optional; the runner works in PAT-only mode without it
- No CLI in v0 (deferred to a later revision, matching eos's stance)
- Ceremony parity (GPG-signed commits, SSH pushes, neural-pathway branches for scratch, shared cycle branches for multi-agent engagements)

## Consequences

### Positive

- Two products marketed under one consulting practice have coherent operator experience. Muscle memory transfers between eos and kronos in every direction.
- Runner code can share components, hooks, and design-system primitives between eos and kronos — likely a shared package or vendored `runner-core/` at some future point.
- OAuth-server can be shared verbatim between eos and kronos deployments — one auth backend, two viewers.
- Adoption patterns are unified: an adopting project runs `cp -r path/to/eos/templates/cycle ./eos/cycle` and `cp -r path/to/kronos/templates/engagement ./kronos/engagement`. Two lines. Same pattern.
- Patent + white paper cadence mirrors eos's, which is already validated by the flagship reference implementation.

### Negative

- Kronos loses the freedom to adopt a divergent shape that might have been better suited to its adversarial-testing nature (e.g., the Athena 0.1 monorepo pattern optimized for scanner-plus-adapter architecture).
- Contributors who understand pen-testing tooling but not eos may find the alignment surprising — kronos does not look like Metasploit or Burp Suite, it looks like a governance framework.

### Neutral

- Deferred materialization from ADR-0001 (framework / tools / engagements as three layers) is preserved. Those layers still exist conceptually; the productization shape simply gives them concrete homes: framework in `methodology/`, tools in `actions/` and the runner primitives, engagements in each adopting target's `<target>/kronos/engagement/` folder.

## References

- `alchemisthomer/eos` PR #1 — the scaffold PR that established the shape.
- ADR-0001 — three-layer identity (framework, tools, engagements). This ADR provides concrete homes for those layers.
- [`../inception/00-founding-incident.md`](../inception/00-founding-incident.md) — the origin story that motivated productization at the same level as eos.
