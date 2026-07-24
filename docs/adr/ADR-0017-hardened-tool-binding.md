# ADR-0017 — Hardened tool binding

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** the operator, kronos scribe
- **Supersedes:** In-part supersedes v0.1's Layer 0 shell-interpolation default and MCP "automatic native compatibility" framing
- **Origin:** ChatGPT cross-LLM review of v0, finding P0-8

## Context

The v0/v0.1 tool-binding contract had three security issues ChatGPT flagged:

1. Layer 0 default used `bash -c "..."` with attack-parameter interpolation, creating a command-injection boundary inside the assurance engine itself.
2. MCP was framed as "every MCP-compatible tool becomes a kronos tool with zero integration cost." The MCP specification explicitly states authorization is optional and that implementers must build their own consent, access-control, validation, and privacy protections around MCP.
3. Sandbox posture was `sandbox.recommended` — a tool's suggestion, not framework enforcement — and could be at `process` (no isolation) for high-impact operations.

## Decision

**Layer 0 default becomes typed argv invocation via execve/spawn without shell.** Attack parameters substitute as discrete argv entries; shell metacharacters in substituted values do not trigger shell interpretation. Shell execution requires the tool's manifest to declare `invocation.type: shell` and `authorization.requires_shell: true`, and faces stricter review + lower default `authorization_ceiling_max`.

**MCP is Layer 2 transport compatibility, not automatic trust.** MCP tools still require: capability normalization, schema validation, authorization-policy mapping, trust classification, output validation (MCP results treated as untrusted data), evidence normalization, tool/version pinning, rate and impact enforcement, egress restrictions, and human or deterministic approval for active operations.

**Sandbox posture is derived by policy from impact class**, not recommended by the tool. Minimum required isolation:
- I0 → `process` acceptable if stateless, `container` otherwise
- I1 → `container` required
- I2 → `container` with declared image digest + network policy
- I3 → `vm` with dedicated network namespace
- I4 → dedicated ephemeral VM or dedicated cloud account

Tools whose runtime-available isolation is below required minimum are refused.

**Tool manifests are claims, not enforcement.** Require: signed manifests (unsigned = trust tier 0, no I1+), immutable content digests, SBOM where available, golden-target conformance tests before promotion to approved toolset, runtime version-check.

**Credentials not via environment variables by default.** Use ephemeral scoped credentials (fd/socket/keyring), secret-broker references (KMS ARN mounted via container secret facility), or assumed workload identity (IRSA, Workload Identity). Env-var credentials permitted only with explicit manifest declaration at trust tier 3+.

**Binding resolution is policy-driven, not lexicographic.** Selection criteria in priority order: approved trust tier → signed manifest → pinned version → evidence fidelity → safety compatibility → target compatibility → conformance recency → cost/performance → explicit engagement preference. Equal candidates require explicit engagement selection.

**`no-tool-binding-available` is a framework coverage gap, not a target finding.** Does not lower target scorecard.

Full specification in [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md).

## Consequences

**Positive.** Command-injection boundary eliminated from the framework. MCP tools correctly treated as untrusted. Sandbox isolation matches impact. Credential exposure minimized. Tool selection is principled.

**Negative.** Shell-invoking tools require explicit high-risk declaration and stricter review. Adopters without container runtimes may run I0 tools only. Some existing tools may need adapter rewrites to not require env-var credentials.

**Neutral.** Layer 3 (native kronos tools) unchanged.

## References

- [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md).
- ChatGPT cross-LLM review of v0, P0-8.
- Model Context Protocol specification (external reference).
- SLSA specification (external reference for provenance).
