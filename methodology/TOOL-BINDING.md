# Tool binding — how kronos delegates attack execution

> The framework describes attacks. Tools execute them. The binding contract between the two is what makes kronos work with anything without knowing about everything.

## Purpose

Kronos is not itself a security scanner. It does not natively know how to send an HTTP request, run Burp Suite against an endpoint, execute sqlmap, scan with Nuclei, drive a browser, generate load with k6, or inject faults with chaos-mesh. It knows how to describe an attack abstractly — a `§7 attack matrix` entry declares intent, parameters, and required capabilities — and it delegates execution to tools that know how to perform the described work.

The **tool binding contract** is what governs the delegation. It answers: how does the framework invoke a tool? How does a tool return evidence? How does the framework know what a tool can do? How does the framework decide which tool to use for which attack? How does a tool declare its authorization requirements? How does the framework prevent a tool from exceeding those requirements?

This document specifies the binding contract at four layers of integration depth. Every existing security tool can bind at some layer; every custom tool an adopter writes can bind at some layer. The framework accepts all four.

## The four binding layers

A tool binds at the highest layer it can support. The framework accepts all four; the layer determines the depth of structural integration but not whether the tool is usable.

### Layer 0 — Bare shell invocation

The minimum viable binding. Any tool that can be scripted from a shell — `curl`, `nmap`, `dig`, `openssl s_client`, `aws ec2 describe-instances`, any Bash script — is a Layer 0 tool.

**Contract:**
- The framework invokes the tool via `bash -c "..."` with the attack's parameters substituted into a command template.
- `stdout` is captured as the primary evidence artifact.
- `stderr` is captured as secondary evidence.
- The exit code is captured as a coarse pass/fail signal (0 = normal completion; non-zero = tool-reported error).
- The captured output is hashed via SHA-256 and committed to the engagement's evidence folder.
- Oracle authors write assertions against the raw output using regex, JSON path (if output is JSON), or similar text-matching primitives.

**When to bind at Layer 0:**
- The tool has no structured output format worth mapping.
- The attack is one-shot and the oracle logic is simple.
- Rapid prototyping — get the attack running now, upgrade the binding later.

**Barrier to entry:** zero. A Layer 0 tool binding is a shell command template committed to the engagement.

### Layer 1 — Structured adapter

The pragmatic default for most established security tools. Tool has a YAML manifest declaring its capabilities and an adapter script (Python, Node, Bash — any language the operator wants) that translates between the framework's abstract attack specification and the tool's concrete invocation, and translates the tool's output into the framework's evidence schema.

**Contract:**
- Manifest declares the tool's identity, version, capabilities, invocation requirements, authorization requirements, and evidence field mapping (see §Tool manifest schema below).
- Adapter script accepts the attack specification as JSON on stdin, invokes the tool according to the manifest, parses the tool's output, and emits structured evidence as JSON on stdout.
- Evidence conforms to the framework's evidence schema — typed request/response fields, structured log entries, per-finding severity fields.
- Framework passes evidence to the engagement's oracle registry; oracles receive structured data rather than raw text.

**When to bind at Layer 1:**
- The tool has a stable output format (JSON, XML, HTML, structured text) that maps cleanly to attack evidence.
- Multiple engagements will use the tool; the adapter authoring cost amortizes.
- Oracle authors want to write assertions against typed fields rather than regex.

**Barrier to entry:** one YAML manifest + one adapter script. Adapters can be hundreds of lines for complex tools (Burp) or under fifty lines for simple ones (sqlmap with `--batch --dump`).

### Layer 2 — Model Context Protocol tool

The emerging standard for AI-native tool invocation. Tool exposes a Model Context Protocol server. Framework speaks MCP directly. Attack specifications become MCP tool calls; evidence comes back as MCP tool results.

**Contract:**
- Tool implements an MCP server (over stdio, HTTP+SSE, or WebSocket depending on the tool's deployment model).
- Framework connects to the MCP server at engagement start, discovers the tool's capabilities via the `tools/list` method, matches against the engagement's attack requirements.
- For each attack, framework invokes the appropriate MCP tool call with the attack's parameters.
- MCP tool result is captured as evidence; MCP structured-content responses are mapped to typed evidence fields.
- Framework respects MCP's error semantics (protocol errors, tool errors, tool-refusal responses).

**When to bind at Layer 2:**
- The tool is AI-native or was designed with MCP compatibility in mind.
- Multiple tools will be composed within a single attack; MCP's capability-discovery and unified invocation model reduces per-tool integration cost.
- The tool is a resource server (RAG index, memory store, credential vault) that other tools need to access during the attack.

**Barrier to entry:** the tool must implement an MCP server. For tools not designed with MCP in mind, this may require a wrapper adapter — effectively making it a Layer 1 binding to a Layer 2 wrapper.

**Why MCP as first-class in kronos.** Model Context Protocol has emerged as an actual standard for exposing tools to AI agents. Kronos's LLM-assisted attack generation, runtime multi-persona evaluation (LLMs playing red/blue/synth roles), and future AI-driven catalog growth all naturally speak MCP. Aligning the tool binding contract with MCP puts kronos inside the emerging AI-tool ecosystem rather than inventing a parallel protocol. Every MCP-compatible tool becomes a kronos tool with zero framework-side integration cost.

### Layer 3 — Native kronos tool

The deepest integration. Tool is built specifically for kronos, lives in `alchemisthomer/kronos-tools/` (a future sibling repository), and implements the framework's internal tool interface directly.

**Contract:**
- Tool imports the framework's tool SDK (language TBD; likely TypeScript to match runner and oauth-server).
- Tool implements the `KronosTool` interface: `validate()`, `estimate()`, `execute()`, `cleanup()`, `describe()`.
- Tool has direct access to framework primitives: the evidence store, the oracle registry, the catalog reference index, the engagement context.
- Tool participates in the framework's build and test cycle; is versioned as part of the framework release.

**When to bind at Layer 3:**
- The tool is a reference implementation of a core primitive (bare HTTP client, evidence hasher, oracle runner).
- The tool needs to compose with other framework internals in ways external adapters cannot express.
- The tool's authors are the framework's authors and control the internal API.

**Barrier to entry:** highest. Requires understanding the framework's internal API, conforming to the framework's build tooling, and accepting the framework's release cadence.

## Tool manifest schema

Every tool (Layers 1, 2, 3) declares its capabilities in a `manifest.yaml` file. The framework reads the manifest to know what the tool can do without having any tool-specific code.

```yaml
kind: kronos-tool
apiVersion: v1

metadata:
  id: burp-suite-professional
  version: 2024.6
  vendor: PortSwigger
  license: commercial
  homepage: https://portswigger.net/burp
  description: Interactive web application security testing platform

capabilities:
  attack_classes:
    - id: web.injection
      subclasses: [sqli, xxe, xss, ssti, ssrf, cmdi]
    - id: web.auth-bypass
    - id: web.session-fixation
    - id: web.access-control-bypass
  evidence_types:
    - http-request-response
    - proxy-log
    - burp-issue-report
  protocols_supported: [http, https, ws, wss]

invocation:
  binding_layer: 1
  adapter: ./adapters/burp-suite.py
  invocation_type: shell
  invocation_template: |
    burp-rest-api --project {{project}} --scope {{target.hostname}} --attack {{attack.class}}
  timeout_seconds: 600

authorization:
  requires_network:
    - target.hostnames
  requires_credentials: false
  requires_elevated_privilege: false
  destructive_testing: false
  authorization_ceiling_max: 2      # this tool may not run above authorization ceiling 2 (controlled)
                                     # (renamed from safety_level_max per P3-2 to disambiguate from
                                     # the maturity level scale used in SCORECARD.md)

enumeration:
  # Per Claude review P1-1: any tool that declares an enumeration capability must
  # support paranoid unfiltered cross-check. The framework runs the query in both
  # the declared filtered form and the unfiltered form and captures the delta.
  # A nonzero delta on a filter that was supposed to return empty is itself a
  # finding — this is the mechanism that would have caught the 2026-07-17
  # incident's "filter silently returned 0 when the truth was 3" scanner bug.
  reconcile: true
  filter_variants:
    - unfiltered           # required baseline
    - {filter1}            # tool's normal filtered query
    - {filter2}            # additional variants for validation
  delta_threshold: 0       # any delta > threshold surfaces a finding of class "scanner-drift"
  delta_finding_severity: high

sandbox:
  recommended: container
  container_image: portswigger/burp-suite-pro:2024.6
  network_restrictions:
    - allowlist: [target.hostnames]
    - denylist: [rfc1918-except-target-subnet]
  resource_limits:
    memory_mb: 4096
    cpu_cores: 2

evidence_mapping:
  http_request:
    source_field: burp.request
    hash_algorithm: sha256
  http_response:
    source_field: burp.response
    hash_algorithm: sha256
  finding:
    severity_map:
      Critical: critical
      High: high
      Medium: medium
      Low: low
      Info: informational
    dedup_key_fields: [target_url, issue_type, param_name]

credentials:
  # If the tool requires credentials at runtime, they are provided via
  # environment variables from the engagement's authorization artifact.
  # Tools MUST NOT persist credentials beyond the invocation.
  env_variables_expected: []
  credential_leakage_audit: true
```

## Capability declaration and binding resolution

At attack execution time, the framework runtime consults available tools' manifests and matches against the current attack's requirements.

**Attack side** — the engagement's §7 attack matrix declares, per attack, the required capabilities:

```yaml
attacks:
  - id: A-1
    name: sqli-against-search-endpoint
    threat_class: KTC-injection-sql
    required_capabilities:
      attack_classes: [web.injection.sqli]
      protocols_supported: [https]
    target:
      endpoint: https://target.example.com/api/search
      params: [q]
    parameters:
      payload_class: union-based
      max_iterations: 50
```

**Framework side** — the runtime enumerates tool manifests in `<target-repo>/kronos/tools/` and the framework default tool set, and finds tools whose capabilities superset the attack's required capabilities.

**Resolution rules:**
- If exactly one tool matches, it is bound.
- If multiple tools match, the engagement's §3 rules-of-engagement may specify a preferred tool by ID. Otherwise, the framework picks the first match in a deterministic order (lexicographic by tool ID).
- If no tools match, the engagement is blocked with a `no-tool-binding-available` framework-level finding — this itself is diagnostic information (the operator's toolset does not cover the attack surface the engagement declared).
- If the matched tool's `authorization.safety_level_max` is below the engagement's authorization ceiling, the tool is refused for this engagement even if it matches — the operator must find a lower-safety tool or escalate the tool's declared max (which requires re-signing the tool manifest).

## Authorization gate on tool invocation

The framework enforces authorization structurally at tool invocation time:

1. **Authorization ceiling check.** Tool's `authorization_ceiling_max` must be >= engagement's declared authorization ceiling. If not, the tool is refused and the framework records the refusal in the execution log. (The ceiling scale runs 0-4: static / passive / controlled / destructive / catastrophic-simulation. It is distinct from the six-level maturity scale in SCORECARD.md.)
2. **Network scope check.** Tool's `requires_network` list must be a subset of the engagement's authorized network scope. Tools requesting broader network access than the engagement authorizes are refused.
3. **Destructive testing check.** If the tool's manifest declares `destructive_testing: true`, the engagement's authorization artifact must explicitly enable destructive testing. Otherwise the tool is refused.
4. **Privilege check.** Tools declaring `requires_elevated_privilege: true` require the engagement's authorization to acknowledge elevated privilege in the ROE (§3).
5. **Credential handoff.** If the tool requires credentials (`env_variables_expected` non-empty), the framework provides them from the authorization artifact's credential section. Credentials are passed via environment variables to the tool subprocess; the framework audits the tool's stdout/stderr for credential-substring leakage.
6. **Incident-state check.** When the engagement's authorization declares `incidentState.declared: true` AND `dataClassPreservation: enforced`, the framework refuses any tool invocation whose declared `resource_classes_affected` intersects the engagement's declared `dataClassResources`. This is the founding-incident lesson made structural: under declared incident, data-class resources are structurally protected regardless of the tool's own capabilities.
7. **Chain-of-authorization check.** When a tool's declared operations touch third-party platforms, the engagement's `chainOfAuthorization.thirdParties` block must enumerate the party with a matching `resourceClassesAffected` list. Tools operating against undeclared third parties are refused.
8. **Duress-signed authorization limit.** When the authorization declares `incidentState.signedSober: false`, the framework refuses tools at `authorization_ceiling_max >= 3` (destructive testing) regardless of other authorization fields. Duress-signed authorizations do not unlock destructive modes.

These are structural refusals, not warnings. A tool that fails any check is not invoked; the engagement records the reason and continues to the next attack.

## Execution provenance signing

Per Claude review finding P2-3, every tool invocation produces a signed **execution-attestation** alongside the evidence hash. Evidence hashes prove the artifact was not altered after commit; execution attestations prove the artifact was produced by a real execution against the claimed target at the claimed time by the claimed operator.

Each execution attestation contains:

```yaml
kind: kronos-execution-attestation
apiVersion: v1
attestation:
  attack_id: A-1
  tool_id: burp-suite-professional
  tool_version: 2024.6
  target_slug: <target-slug>
  target_endpoint: <endpoint invoked>
  invoked_at: YYYY-MM-DDTHH:MM:SS.mmmZ
  completed_at: YYYY-MM-DDTHH:MM:SS.mmmZ
  operator_identity: <operator-signing-key-fingerprint>
  runner_identity: <runner-signing-key-fingerprint>
  evidence_refs:
    - {sha256 of request artifact}
    - {sha256 of response artifact}
    - {sha256 of any telemetry artifact}
signature:
  algorithm: ed25519
  signed_by: {operator-key OR runner-key OR both}
  signature_value: {base64}
```

The attestation is written to `<target-repo>/kronos/evidence/<engagement-slug>/provenance/<attack-id>.yaml` and referenced by hash from the engagement's §9 execution log.

**What the attestation proves.** That a specific tool at a specific version was invoked at a specific time against a specific target endpoint, produced specific evidence artifacts, and was signed by a specific operator or runner identity. A third-party verifier can check the signature against the operator's or runner's known public key, confirm the timestamps are consistent with the engagement's authorization window, and verify the evidence hashes match the referenced artifacts.

**What the attestation does not prove.** That the tool itself is honest (a malicious tool can produce fabricated evidence and sign it). The tool honesty problem is addressed separately via manifest signing and `tool-verify` golden-target checks (see open Q4 below). Provenance and tool-honesty are complementary defenses.

**Reproducibility caveat** (per Claude review P2-3). Evidence integrity (hash) and execution provenance (signature) are durable. **Reproducibility** of an attack against a live target is not durable in general — target state drifts, credentials rotate, attacker-owned resources are torn down. A finding can be valid and still fail to reproduce months later. The framework distinguishes evidence-of-what-happened (durable) from re-executability (often ephemeral) and does not promise the latter unconditionally.

## Sandbox and isolation

The manifest's `sandbox.recommended` field is the tool's declaration of its preferred isolation posture. The framework respects the declaration and may enforce it:

- **`sandbox.recommended: process`** — no additional isolation beyond OS process boundaries. Suitable for stateless tools that only make outbound requests.
- **`sandbox.recommended: container`** — the framework invokes the tool inside a Docker (or equivalent) container using the declared `container_image`. Network restrictions and resource limits are enforced by the container runtime.
- **`sandbox.recommended: vm`** — for tools that need kernel-level isolation. Framework invokes the tool inside a lightweight VM (Firecracker or equivalent). Suitable for tools known to be exploitable (running untrusted plug-ins, etc.).

For the MVP, kronos supports `process` and `container` sandbox modes. `vm` mode is deferred to a later phase.

Sandbox choice is a security posture; adopters who cannot run containers (air-gapped environments, restricted policy) may run all tools at `process` mode with the operator's explicit acknowledgment that isolation is reduced.

## Custom tooling

An adopter writing their own tool follows the same manifest pattern:

```
<target-repo>/kronos/tools/<tool-id>/
├── manifest.yaml       # declares capabilities and invocation
├── adapter.py          # or .sh, .ts, .go — whatever the tool author prefers
└── README.md           # documents the tool
```

The framework treats target-adopter-written tools identically to first-party framework tools. The tool discovery walks the `<target-repo>/kronos/tools/` folder alongside the framework's default tool set.

**Barrier to entry for a custom tool at Layer 0:** one shell command committed to the engagement — no manifest required if the operator is willing to author oracles against raw shell output.

**Barrier to entry for a custom tool at Layer 1:** one YAML manifest + one adapter script. For simple tools, both files can be under one hundred lines total.

**Contribution pathway to the framework.** Custom tools that prove broadly useful can be contributed back to a future `alchemisthomer/kronos-tools/` community repository. Contribution requires the manifest to be signed by the framework maintainer's key and pass a review for capability-declaration accuracy and safety.

## Reference tools kronos will ship or bind

First-tier tools committed to work with kronos out of the box:

| Tool | Binding layer | Purpose |
|---|---|---|
| Bare HTTP client | 3 (native) | Fundamental primitive; every HTTP-based attack has a fallback to this |
| AWS CLI wrapper | 3 (native) | Cloud-plane attacks against AWS targets; drills into CloudWatch, CloudTrail, IAM, EC2 |
| Salesforce API wrapper | 3 (native) | For olympus-grid and other Salesforce-hosted targets; SOQL queries, SObject mutations, apex-anonymous execution |
| GitHub REST client | 3 (native) | For supply-chain attacks against GitHub-hosted targets; workflow inspection, secret enumeration |
| Burp Suite Professional | 1 (structured adapter) | Web application security testing; requires commercial license |
| OWASP ZAP | 1 (structured adapter) | OSS alternative to Burp for web testing |
| sqlmap | 1 (structured adapter) | SQL injection specifically |
| Nuclei | 1 (structured adapter) | Template-based vulnerability scanning; kronos catalog entries map cleanly to Nuclei templates |
| Nmap | 0 (shell) | Network reconnaissance |
| k6 | 1 (structured adapter) | Destructive-load engagements |
| Artillery | 1 (structured adapter) | Alternative load generator |
| chaos-mesh | 1 (structured adapter) | Infrastructure fault injection for `recovery-adversarial` mode |
| Any MCP-compliant security tool | 2 (MCP) | Capability-discovered at engagement start; no framework-side integration required |

## Open questions

**Q1. Adapter language choice.** Layer 1 adapters can be authored in any language, but the framework needs a supported set for its own reference adapters. Node/TypeScript aligns with runner and oauth-server; Python aligns with the broader security tool ecosystem. Recommend TypeScript for framework-shipped adapters, Python permitted for community contributions.

**Q2. Tool credential handling.** Tools that require credentials (Burp against authenticated endpoints, AWS CLI against authenticated cloud accounts) need credentials handed off at invocation. The framework provides via env vars from the authorization artifact's credential section. Open question: how are credentials rotated during a long-running engagement? How are they scrubbed from tool-crash coredumps?

**Q3. Tool version pinning.** Manifests declare tool version; framework refuses to run a tool whose actual version differs from the declared version. But how does the framework verify the actual version? For containerized tools, image digest pinning; for shell tools, `--version` output parsing. Both are fragile. Consider whether the framework should require a supply-chain-verified tool provenance (Sigstore, in-toto attestation) for higher safety levels.

**Q4. Adversarial tool authors.** A malicious tool manifest could declare capabilities the tool does not have, then produce fabricated evidence that causes false-negative findings. The framework's defense is that the operator inspects and signs manifests before adoption. Is this defense sufficient? Consider whether kronos should provide a `tool-verify` action that runs the tool against known-vulnerable golden targets and confirms it produces the expected findings.

**Q5. Sandbox escape.** Containerized tools may escape sandbox via kernel vulnerabilities. For tools declaring `destructive_testing: true` or `requires_elevated_privilege: true`, is stricter isolation (VM, dedicated host) mandatory? Consider whether kronos should require a specific sandbox posture for tools at safety level ≥ 3.

## Where this fits in the framework

Tool binding is Layer 2 of the three-layer identity from ADR-0001:

- **Framework** (`methodology/`) — declares the attack, oracle, evidence, and finding primitives; declares the tool binding contract.
- **Tools** (`actions/`, `runner/`, future `alchemisthomer/kronos-tools/`, and each target's `<target-repo>/kronos/tools/`) — implements the tool binding contract for specific attack executors.
- **Engagements** (`<target-repo>/kronos/engagement/`) — declares which capabilities each attack requires; framework resolves against available tools at execution time.

The tool binding contract is what makes kronos a framework rather than a tool. Every specific security tool that exists today, every tool that will exist tomorrow, is a candidate kronos tool — provided it can bind at some layer. The framework is deliberately agnostic about which tools are best; it is opinionated about how tools declare what they do and how the framework decides which to invoke.
