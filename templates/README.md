# templates

> Copy-in scaffolds for adopting projects.

**Status:** engagement template scaffolded. Sample engagements to be added after design review converges.

## What this contains

The templates folder holds the file trees that operators copy into their target repositories when adopting kronos. Adoption is by filesystem copy — no CLI, no installer, no runtime dependency.

## Adoption pattern

From the root of the target repository:

```bash
# Copy the engagement kanban tree into your project's kronos folder.
cp -r path/to/kronos/templates/engagement ./kronos/engagement

# Copy the operating manual so contributors can find the discipline.
cp path/to/kronos/methodology/OPERATING-MANUAL.md ./kronos/README.md
```

That is the full adoption ceremony. The target repository now has:

- `kronos/README.md` — the operating manual
- `kronos/engagement/` — the empty kanban folder tree
- `kronos/engagement/TEMPLATE.md` — the engagement document scaffold
- `kronos/engagement/SCORECARD.md` — the target's scorecard config (edit to name your target)

The operator then authors the first engagement document in `kronos/engagement/00_scope/` using the template.

## Files in the engagement template

```
engagement/
├── README.md              # this file, describing the kanban discipline
├── TEMPLATE.md            # empty scaffold for a new engagement document
├── SCORECARD.md           # target scorecard config (edit for the specific target)
├── 00_scope/              # engagement declared but not authorized
│   └── README.md          # stage description + entry/exit criteria
├── 01_authorized/         # authorization artifact signed
│   └── README.md
├── 02_planning/           # target model + scenarios being written
│   └── README.md
├── 03_ready/              # scenarios validated; ready to execute
│   └── README.md
├── 04_running/            # attacks in flight
│   └── README.md
├── 05_evidence/           # evidence collected; oracle evaluating
│   └── README.md
├── 06_shipped/            # findings written; scorecard updated
│   └── README.md
└── 07_aborted/            # stopped early
    └── README.md
```

## Deferred to a later revision

- `npx kronos init` scaffolder (matching eos's deferred CLI).
- Sample engagement documents in each stage folder to seed the runner with meaningful content on first load (parallel to eos's `templates/cycle/` example cards).
- Per-language starter kits for common attack execution patterns (Node HTTP client, Python OpenAPI validator, Bash aws-cli wrapper).

The filesystem-copy default is deliberate — the methodology is portable across every stack, so the primary adoption path shouldn't couple adopters to any one runtime.
