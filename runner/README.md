# runner

> React/TypeScript reference viewer for the kronos engagement kanban and scorecard.

**Status:** to be scaffolded after design review converges. See [`../DESIGN.md`](../DESIGN.md) for the design context.

## What this will be

The runner is a React/TypeScript single-page application that reads any GitHub repository's `kronos/engagement/**` folder tree via the GitHub REST API and renders both the engagement kanban and the target's scorecard in the browser. Edits to engagement documents land as pull requests via the same API.

It intentionally knows nothing about the technology of the project under evaluation — it reads folders, markdown, and YAML frontmatter. There is no backend of its own, no database, and no state store outside the target repository. Point it at any GitHub repository you can read (public repos work anonymously), and it renders that project's kanban and scorecard.

## Primary views

1. **Scorecard view** — the north-star artifact per ADR-0003. Renders the 4×3 pillar/dimension matrix in two modes: a **six-level detail view** for engineering consumption (L0–L5 with distinct colors) and an **executive traffic-light view** derived from the detail (L0–L2 red, L3 yellow, L4–L5 green). The **dual-number headline** (pinned score + latest score computed against head-of-catalog) is always rendered per ADR-0010. Click-through to underlying findings and evidence.
2. **Plausibility findings view** (added in v0.1) — the running list of findings from the plausibility monitor, sourced from `<target>/kronos/findings/plausibility/`. Distinct from engagement findings; renders the capacity-model bound alongside the observed value that exceeded it.
3. **Engagement kanban view** — the eight stage folders (00_scope through 07_aborted) rendered as columns. Each engagement document is a card. Drill into any card for the full document.
4. **Trajectory view** — historical view of the scorecard over time, computed from git history of the `06_shipped/` folder. Recomputes the scorecard at each historical HEAD.
5. **Delta view** — the difference between the current scorecard and a specific prior state. Answers "what changed since we last engaged?"
6. **Evidence view** — the raw evidence artifacts (request/response chains, telemetry excerpts, screenshots) as rendered by their content type. Includes the execution-provenance attestation viewer so an observer can inspect the signature binding an evidence artifact to a specific tool invocation.
7. **Industry-alignment view** (planned) — per-scorecard-cell mapping to the industry-standard control IDs the cell's evidence supports (SOC 2, ISO 27001, OWASP ASVS, NIST CSF, NIST AI RMF, etc.).

## Relationship to the eos runner

The kronos runner is a sibling to the `alchemisthomer/eos` runner, not a fork of it. Both are React/TypeScript SPAs with the same GitHub-REST-driven pattern, and both will likely share a `runner-core/` package for common concerns (GitHub API client, markdown rendering, Aphrodite Mythic Forge design-system integration, OAuth handshake with the shared oauth-server).

When both frameworks are installed in the same target, the runner presents both kanbans — the eos cycle kanban and the kronos engagement kanban — as sibling views, along with a combined readiness overview that fuses the eos §9 telemetry assertions with the kronos scorecard.

## OAuth

The runner works PAT-only for read access to public repositories and for write access when the operator provides a personal access token. For deployments requiring GitHub App user-to-server OAuth (an installed GitHub App with fine-grained permissions), the runner delegates the code-for-token exchange to the standalone [`../oauth-server/`](../oauth-server/) service. The oauth-server is optional; the runner is fully functional without it.

## Batch-commit guidance for evidence-heavy engagements (v0.3 per Grok review)

Individual per-artifact PR writes work for lightweight engagements (a handful of evidence artifacts per run). For evidence-heavy engagements — dozens of artifacts per run, or continuous-plane engagements producing findings at scheduled cadence — per-artifact PR writes are operationally slow and produce noisy PR history.

The v0.3 runner supports two additional write modes for these cases:

- **Batch commit mode.** The runner accumulates evidence artifacts and manifest updates locally, then commits them as a single atomic batch at engagement close (or at a checkpoint declared by the operator). A single PR carries the entire evidence bundle; reviewers see the coherent artifact set rather than N incremental commits.
- **Direct push mode (authorized operators only).** For operators who have write authority to the target repository and prefer to skip the PR-review step for their own kronos activity, the runner may push directly to the target's designated engagement branch. Direct push requires explicit configuration per-target and is not the default. All commits remain signed; the PR-review step is skipped, not the signature.

The PR-write default is preserved for engagements where an external reviewer is expected to approve findings before they land in the target's history. Batch and direct modes are opt-in based on operator role and engagement type.

## Deferred to a later revision

- Real-time push notifications for engagement state changes (webhook consumer)
- Multi-target aggregate views (rendering multiple targets' scorecards side-by-side)
- Threat-catalog browser (navigating the system-agnostic catalog independent of any target)
- Attack-composer UI (authoring new attack scenarios without hand-editing YAML)

## Copy-adoption pattern

The runner is deployed once per operator (typically on an internal server or as a static site), not once per target. A single runner instance renders any target's kanban and scorecard by accepting the target repository URL as configuration. This mirrors the eos runner's deployment pattern.
