# ADR-0005 — Layered tool binding with MCP as first-class protocol

- **Status:** Accepted
- **Date:** 2026-07-24
- **Deciders:** The Steward, Kronos
- **Supersedes:** None
- **Superseded by:** None

## Context

Kronos is not a security scanner. It does not natively execute HTTP requests, drive browsers, run Burp Suite, execute sqlmap, or scan with Nuclei. The framework describes attacks abstractly (§7 attack matrix in an engagement document) and delegates execution to tools that know how to perform the described work.

The framework needs a **tool binding contract** — the protocol by which the runtime invokes a tool, receives evidence back, discovers what tools can do, and enforces authorization at invocation time. Prior versions of the design conversation had left this contract unspecified, treating "tools" as an abstract layer without committing to how they bind.

The Steward's review of design v0 identified this gap and asked for a concrete binding model that supports both established security tools (Burp, sqlmap, Nuclei, ZAP) and custom tools an adopter might write specifically for their own target.

Two adjacent developments inform the decision:

1. **Model Context Protocol (MCP)** has emerged as a real standard for exposing tools to AI agents. Kronos's LLM-assisted attack generation, runtime multi-persona evaluation, and future AI-driven catalog growth all naturally speak MCP.
2. **The eos-productization pattern** established that kronos's runtime and tools should be as filesystem-native and dependency-light as possible. Adopters must be able to write custom tools with minimal ceremony.

## Decision

Kronos adopts a four-layer tool binding contract. Tools bind at the highest layer they can support; the framework accepts all four. The specification is [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md); this ADR captures the rationale.

**Layer 0 — Bare shell.** Any tool that can be scripted from bash. Framework invokes via `bash -c "..."`, captures stdout/stderr/exit-code as raw evidence, hashes and commits. Zero barrier to entry.

**Layer 1 — Structured adapter.** Tool has a YAML manifest declaring capabilities and an adapter script that translates framework attack-spec ↔ tool CLI ↔ framework evidence schema. The pragmatic default for most established security tools.

**Layer 2 — Model Context Protocol.** Tool exposes an MCP server; framework speaks MCP directly. Capability discovery via `tools/list`; attack execution via MCP tool calls. Every MCP-compatible tool becomes a kronos tool with zero framework-side integration cost.

**Layer 3 — Native kronos tool.** Tool implements the framework's internal tool SDK directly. Deepest integration; access to evidence store, oracle registry, catalog reference index. Reserved for reference-implementation primitives (bare HTTP client, evidence hasher, oracle runner).

Every tool declares its capabilities via a `manifest.yaml` file with schema defined in TOOL-BINDING.md. The framework resolves attack-to-tool bindings at execution time by matching attack-required capabilities against available tools' declared capabilities. Authorization is enforced structurally: a tool's declared `safety_level_max` must be at least the engagement's declared safety level, or the tool is refused.

Custom tooling by adopters follows the same manifest pattern. Custom tools live in `<target-repo>/kronos/tools/<tool-id>/` alongside the framework's default tool set; the framework treats them identically.

MCP is designated as a first-class binding layer rather than a bolt-on integration. This aligns kronos with the emerging AI-tool ecosystem and lowers the integration cost for AI-native security tools that will proliferate in the coming years.

## Consequences

### Positive

- Universal binding coverage. Every existing security tool can bind at some layer; every future tool can bind at some layer. The framework is not the bottleneck.
- Low barrier to entry for custom tools. An adopter writing a target-specific tool needs one YAML manifest + one adapter script. Under one hundred lines for simple tools.
- MCP alignment positions kronos in the emerging AI-tool ecosystem. Kronos does not invent a parallel tool protocol; it adopts the emerging standard and inherits its ecosystem.
- Structural authorization enforcement. A tool cannot be invoked at a safety level higher than its declared max. This is a first-order safety property, not a policy suggestion.
- Framework agnosticism preserved. The framework has no tool-specific code; all tool knowledge lives in manifests. Adding a new tool never requires framework changes.

### Negative

- Four layers is more than one; some contributors will find the layering surface area confusing. Documentation must be clear about "which layer should I use for this tool?"
- Manifest schema is opinionated. Tool authors must express their tool's capabilities in kronos's taxonomy; the taxonomy may not match the tool's native categorization perfectly, requiring judgment calls in manifest authoring.
- MCP dependency introduces external protocol risk. If MCP evolves in ways incompatible with kronos assumptions, the Layer 2 binding may require adjustment. Mitigation: version-pin the MCP protocol version kronos targets, and treat MCP compatibility as a first-class release-note item.
- Sandbox posture is per-tool declared rather than framework-enforced by default. Adopters who cannot run containers may run all tools at process-mode with reduced isolation. This is a trade-off between operational flexibility and defense-in-depth.

### Neutral

- The framework's own runner (the React/TypeScript SPA reference viewer) is not a "tool" in the tool-binding sense — it consumes engagement documents and renders the scorecard, but it does not execute attacks. Runner and tools are distinct concerns.
- Actions (GitHub Actions in `actions/`) are also not tools — they enforce discipline (kanban validators, authorization validators, evidence hash verifiers) but do not execute attacks. Actions and tools are distinct.

## References

- [`methodology/TOOL-BINDING.md`](../../methodology/TOOL-BINDING.md) — the tool binding specification in full.
- ADR-0001 — three-layer identity (framework, tools, engagements). This ADR provides the binding contract that tools use to fulfill their role as Layer 2 of the identity.
- ADR-0002 — productization alignment with eos. The tool binding contract is one part of what makes kronos structurally symmetric to eos.
- Model Context Protocol specification — external reference (specification location TBD as MCP versioning evolves).
