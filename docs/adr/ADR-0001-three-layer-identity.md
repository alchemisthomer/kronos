# ADR-0001 — Three-Layer Identity: Framework, Tools, Engagements

- **Status:** Accepted (Directory-Materialization section superseded-in-part by ADR-0002)
- **Date:** 2026-07-23
- **Deciders:** The operator, Kronos scribe
- **Supersedes:** None
- **Superseded by:** ADR-0002 (partial — directory materialization pattern only; the three-layer identity claim remains in force)

## Context

Kronos is a technology-agnostic assurance platform intended to evaluate any authorized target — web applications, cloud accounts, Salesforce orgs, Kubernetes clusters, AI agents, off-grid appliances — across security, cost, availability, integrity, data-loss, and compliance dimensions.

The design must answer two coupled questions on day zero:

1. **Where does portability live?** The engagement-independent contracts (schemas, DSL, model, doctrine, safety levels) must remain stable while implementations churn.
2. **Where does target-specificity live?** Each engagement has its own authorization, scope, model, and evidence — these are not shareable across targets.

Two adjacent frameworks in the same universe already answered these questions in ways worth inheriting.

**Omens** (a game framework that ships across Godot, Unity, and web engines to iOS, Android, desktop, and web platforms) separates *engine-agnostic content and contracts* at the repo root from *engine-specific implementations* under `engines/<engine>/`. A single content tree feeds every engine identically.

**Eos** (the attestation framework being extracted from Olympus-616) separates a *portable methodology template* at `cli/eos/` — which projects copy into themselves — from the *dogfooding project* at `eos/`. Adopters install the template into their own repo; the template stays generic.

Kronos inherits both patterns.

## Decision

Kronos has three layers, each with a clear identity, boundary, and stability contract:

### Layer 1 — Framework (`kronos-framework/`)

**What it is:** engine-agnostic contracts. Schemas for target models, authorization artifacts, scenarios, evidence bundles, findings, and attestations. The doctrine (independent trust domain, authorization before execution, safe by default, deterministic oracles, evidence outside the target). The safety-level taxonomy. The stable plug-in API. Language-neutral by design.

**What it is not:** an implementation. The framework declares shapes; it does not run scenarios.

**Stability:** semantic versioning. Framework releases are backward-compatible within a major version. Downstream tools and engagements pin to framework versions.

### Layer 2 — Tools (`kronos-tools/`)

**What it is:** concrete implementations of the framework contracts, in whatever language and runtime fit the job. A Node HTTP runner. A Python OpenAPI parser. A Bash orchestrator around `aws cli`. A Go plug-in host. Each tool declares which framework version it targets and which safety levels it supports.

**What it is not:** a monolith. Tools are independent; they share nothing except the framework contracts.

**Stability:** each tool versions independently. Tools may be added, deprecated, or replaced without touching the framework.

### Layer 3 — Engagements (`kronos-engagements/<target>/`)

**What it is:** a per-target installation. Every engagement contains an authorization artifact naming scope, safety ceiling, time window, rate limits, and stop mechanism; the target's system model; the scenarios pinned to that model; the evidence store; and the run history. An engagement folder may live inside this repository (for reference implementations like Olympus-616) or as a sibling repository the target owns (for customer engagements).

**What it is not:** shareable. Engagement content is bound to one target. Scenarios generalized enough to be reused are promoted upward — to `kronos-framework/scenarios/` (as a reusable pattern) or to `kronos-tools/<tool>/scenarios/` (as a tool-specific default).

**Stability:** engagement content follows the target's lifecycle, not Kronos's. An engagement retains all evidence for its retention window regardless of framework or tool version churn.

## Consequences

**Positive:**

- A downstream customer can adopt Kronos by cloning the framework, choosing a subset of tools, and creating one engagement directory — without inheriting any Olympus-Grid-specific assumption.
- A tool written in Node can be replaced by a tool written in Rust with no engagement rewrite, as long as the new tool honors the framework contracts.
- Engagement evidence is portable across framework versions; a signed attestation from Kronos framework v1.2 is still verifiable under v1.7.
- The design mirrors Omens (content-agnostic framework + engine-specific tools) and Eos (portable methodology + per-project installation) — patterns already validated in the same universe.

**Negative:**

- Three layers is more overhead than a single monorepo. The framework must be defined explicitly enough that a tool author or engagement operator can know when they're crossing a layer boundary.
- Cross-layer refactoring (moving something from a tool to the framework, or from an engagement to a tool) requires ceremony — a framework contract change, a tool bump, an engagement pin update.
- Contributors need to learn where their change belongs before opening a PR.

**Neutral:**

- The framework does not commit to a single language. Tools may be TypeScript, Python, Go, Rust, or Bash. The framework is defined in language-neutral schemas (JSON Schema, YAML) with reference validators in whichever language is convenient.

## Directory Materialization (SUPERSEDED-IN-PART BY ADR-0002)

> ⚠️ **This section is superseded by ADR-0002.** The three-layer identity described above remains in force, but the concrete directory names originally proposed here (`kronos-framework/`, `kronos-tools/`, `kronos-engagements/`) have been replaced by the eos-productization pattern (`methodology/`, `actions/` + `runner/` + `oauth-server/` + future `alchemisthomer/kronos-tools/`, and each target's `<target>/kronos/engagement/` — with `<target>/foundation/kronos/engagement/` used by targets like olympus-616 that follow a foundation/ convention). See ADR-0002 for the current directory shape.

The original proposal (retained for historical reference):

- `kronos-framework/` — created when the first schema (probably `authorization.schema.json`) needs to land.
- `kronos-tools/` — created when the first runnable tool needs a home.
- `kronos-engagements/olympus-616/` — created when we run the first scenario against Olympus-616 and need a place for its authorization artifact and evidence.

The deferred-materialization principle underlying this section (empty directories are architectural claims we have not yet earned) is preserved by ADR-0002.

## References

- Omens framework/tooling separation: `~/dev/repos/olympus-616/omens/`
- Eos portable-methodology pattern: `~/dev/repos/olympus-616/eos/` and `~/dev/repos/olympus-616/foundation/eos/`
- Founding case study: [`docs/inception/00-founding-incident.md`](../inception/00-founding-incident.md)
