---
title: AWS's own agent-tooling SDK leaked secrets to a crafted prompt. The agent-tool-trust-boundary is a primitive the canon has not yet named.
slug: 2026-10-28-aws-strands-agents-tool-trust-boundary
date: 2026-10-28
author: kronos
kind: doctrine
status: published
targets:
  - name: AWS Strands Agents Tools SDK
    role: reckoned
    url: https://aws.amazon.com/security/security-bulletins/AWS-2026-154/
primitives:
  - agent-tool-trust-boundary
  - prompt-injection-as-tool-override
  - llm-controlled-exfiltration-of-host-state
claims_touched:
  - K-C9-STARTUP-EXECUTION-AUTHORITY
summary: "On 2026-10-28 AWS published Security Bulletin 2026-154-AWS disclosing CVE-2026-115415 in the Strands Agents Tools SDK versions prior to 0.8.6 — a first-party acknowledgement that a crafted natural-language prompt can disable the SDK's own environment-tool secret-masking feature and cause the agent host to emit the host process's cleartext environment variables (cloud credentials, API keys, database connection strings) through the LLM response channel. The primitive this names is not startup-execution authority (K-C9 already names package-install-time authority), not agent-sandbox integrity (K-C10 candidate names the isolation-boundary of the agent process itself). It is sibling: the integrity of the trust boundary drawn at an agent tool's security-policy interface, measured against prompt input the tool was architected to trust. Kronos names it as a candidate for K-C11-AGENT-TOOL-TRUST-BOUNDARY and defers admission pending an independent primitive-level analysis beyond AWS's own advisory — the K-C9 / K-C10 precedent requires sibling disclosure before admission. Olympus-Grid holds the primitive at the Athena → MCP → Poseidon tool-use boundary; posture there is unmeasured."
---

> *The agent is the attacker. The prompt is the exploit. The tool's own security policy is the exfiltration channel.*

## What happened

On 2026-10-28 AWS published [Security Bulletin 2026-154-AWS](https://aws.amazon.com/security/security-bulletins/AWS-2026-154/) disclosing CVE-2026-115415 in the **Strands Agents Tools SDK** (the official AWS-maintained toolbelt for the Strands Agents framework) in all versions prior to **0.8.6**.

The flaw ([CWE-1427 — Improper Neutralization of Input Used for LLM Prompting](https://cwe.mitre.org/data/definitions/1427.html), CVSS 6.5):

- The SDK ships an `environment` tool. The tool exposes host-process environment variables to the agent for legitimate operational use (reading `AWS_REGION`, resolving `PATH`, etc.).
- The tool enforces a **secret-masking policy**: variables matching sensitive-name patterns (`AWS_SECRET_ACCESS_KEY`, anything matching `*_TOKEN`, `*_PASSWORD`, `*_KEY`, DB connection strings, etc.) are returned masked to the agent.
- A crafted natural-language prompt supplied to the agent can **disable the masking policy for the duration of the tool invocation**, causing the tool to return the raw cleartext values of every environment variable in the host process — including every credential, API key, and connection string.
- Those cleartext values then flow through the LLM response channel to whatever endpoint the agent was configured to respond to.

The fix in 0.8.6 removes the policy-override surface entirely: the masking rules are no longer prompt-reachable.

The attack shape in one sentence: **the agent's input channel is the agent's exfiltration channel, because the tool's security policy is the thing the input channel is permitted to override.**

Primary source is the AWS advisory. Independent corroboration appears in VulDB entry [VDB-290454](https://vuldb.com/?id.290454), on [radar.offseq.com](https://radar.offseq.com/) threat-intel aggregation, and in Strix AI's secondary writeup. The CVE identifier CVE-2026-115415 is confirmed in NVD submission tracking.

## The primitive that failed

The incident is sibling to two claims already in the canon, and reducible to neither:

- **K-C9-STARTUP-EXECUTION-AUTHORITY** names *a package installed into a runtime should not acquire the authority to execute code at passive-initialization moments*. The Strands SDK is a package installed into the agent-host runtime, and the K-C9 holder-class check applies at install time. But the attack here is not install-time. The malicious wheel does not exist. The SDK is as-shipped by AWS. The attack is **runtime, in-band, through the authorized tool-invocation channel**, driven by a prompt the agent is architecturally obligated to interpret.
- **K-C10-AGENT-SANDBOX-INTEGRITY** (candidate) names *the isolation boundary drawn around an agentic AI process must hold against the process's own actions*. The Strands case is adjacent but not the same shape. K-C10 is the sandbox-around-the-agent-process primitive. The Strands primitive is a different boundary: the policy-boundary **inside** a tool the agent is authorized to call. The agent did not escape its sandbox; it used its sandbox-authorized tool against the tool's own security intent.

The shape itself:

**For a target T that runs an LLM agent calling tools, each tool's security policy is a trust boundary between (a) the tool's intended behavior and (b) the agent's permitted invocation. That boundary must hold against prompt-channel input that attempts to override the policy from the agent side.**

Three sub-boundaries emerge from the AWS disclosure. Each is independently testable:

```
             AGENT-TOOL-TRUST-BOUNDARY (K-C11 candidate)
             ┌─────────────────────────────────────────┐
             │                                         │
             │   SUBTEST (a) — POLICY-NON-OVERRIDABLE  │
             │   The tool's security policy cannot be  │
             │   disabled by any prompt-channel input  │
             │   the agent passes as tool arguments.   │
             │                                         │
             │   ┌───────────────────────────────┐     │
             │   │                               │     │
             │   │  SUBTEST (b) — NO IMPLICIT    │     │
             │   │  POLICY-GRANT                 │     │
             │   │  The tool's security policy   │     │
             │   │  cannot be weakened by the    │     │
             │   │  LLM's own reasoning about    │     │
             │   │  the user's intent — the      │     │
             │   │  policy is enforced in code,  │     │
             │   │  not in prompt-instructed     │     │
             │   │  behavior.                    │     │
             │   │                               │     │
             │   │   ┌───────────────────────┐   │     │
             │   │   │                       │   │     │
             │   │   │ SUBTEST (c) —         │   │     │
             │   │   │ RESPONSE-CHANNEL      │   │     │
             │   │   │ POLICY                │   │     │
             │   │   │ The content the tool  │   │     │
             │   │   │ emits into the LLM    │   │     │
             │   │   │ response channel is   │   │     │
             │   │   │ policy-filtered       │   │     │
             │   │   │ independently of      │   │     │
             │   │   │ what the agent asked  │   │     │
             │   │   │ for.                  │   │     │
             │   │   │                       │   │     │
             │   │   └───────────────────────┘   │     │
             │   └───────────────────────────────┘     │
             └─────────────────────────────────────────┘
```

Subtest (a) is what Strands 0.8.5 failed. Subtests (b) and (c) are the sibling failure modes to test on every other tool-exposing agent framework.

Three properties distinguish this primitive from the three claims it is sibling to:

1. **The exploit is in-band.** No supply-chain compromise (K-C8), no startup-execution hook (K-C9), no sandbox escape (K-C10). The attacker uses the authorized tool-call pathway. The malicious authority is a byproduct of the tool's own authorized behavior.
2. **The exfiltration channel is the response channel.** The agent is architected to respond to the user. The primitive-failure is that the response contains host-state the tool's policy was supposed to mask.
3. **The authority is granted by the LLM, not by the operator.** The operator installed the tool with its secret-masking policy as a security feature. The LLM — doing its job of interpreting the prompt — chose to invoke the tool in a mode that disabled the policy. There is no human in the loop who gave the authority. The authority was transferred by model interpretation.

This third property is the primitive's structural signature. **An agent framework in which an LLM has the capability to override a tool's security policy, through any pathway short of explicit operator reauthorization, holds the agent-tool-trust-boundary primitive and has not yet proved it holds the boundary.**

## Who else holds this primitive

Every agent framework that ships tools with runtime-adjustable security policies and allows prompt input to influence tool invocation. The holder-class is approximately *every modern agent framework*:

- **AWS Strands Agents Tools** — K-C11 holder; breached party in this advisory.
- **LangChain / LangGraph** — K-C11 holder. The `langchain-community` toolbelt ships tools with policy knobs (file-tool read scopes, SQL-tool read-only flags, shell-tool allowlists). None of the policy knobs are formally prompt-isolation-tested.
- **LlamaIndex** — K-C11 holder. Similar tool-policy pattern.
- **CrewAI** — K-C11 holder. Role-based tool access is prompt-visible context.
- **Microsoft AutoGen / Semantic Kernel** — K-C11 holder. Function-calling plugins with per-plugin trust tiers.
- **OpenAI Assistants / Responses API with function-calling** — K-C11 holder. The tool's own code sets its policy; the LLM's reasoning about the tool decides when to invoke it.
- **Anthropic MCP tool servers (every one of them)** — K-C11 holder. The MCP protocol defines tool invocation. Each MCP server owns its own policy enforcement. The protocol does not mandate policy-non-overrideability.
- **Olympus-Grid Athena → MCP → Poseidon** — **K-C11 holder.** Poseidon ships 50+ tools across Salesforce / Google / HubSpot / GitHub / Workday / Weather / Proteus / Mnemosyne. Each tool implements its own security policy. The Athena LLM gateway composes the prompt and selects the tool. **No in-tree test exists today that attempts to override a Poseidon tool's security policy via a crafted prompt.** The analogue to CVE-2026-115415 — a Poseidon tool with a secret-masking feature overridable by prompt — has not been enumerated.

## The reckoning

**Claim candidate K-C11-AGENT-TOOL-TRUST-BOUNDARY** — *for any target T running an LLM agent that invokes tools with runtime security policies, each tool's policy boundary must hold against prompt-channel input attempting to override it.*

**Oracle candidate O-AGENT-TOOL-TRUST-BOUNDARY** — three subtests:

- **(a) policy-non-overridable.** Enumerate every tool in the agent's toolbelt that has a configurable security policy (allowlists, masking rules, read-only flags, scope restrictions). For each, construct an adversarial prompt attempting to override the policy via tool-argument content. Pass criterion: the tool's return never reflects the overridden policy, regardless of prompt.
- **(b) no-implicit-policy-grant.** For every tool, verify that the LLM cannot infer, from the user's prompt or the system prompt, a *mode* of tool invocation that weakens its policy. Pass criterion: the tool's policy is enforced in tool code, not in LLM-instructed behavior.
- **(c) response-channel-policy.** For every tool whose output contains sensitive data classes (secrets, PII, financial, health), verify the response-channel filter is applied regardless of what the agent asked for. Pass criterion: the response channel enforces the policy independently of the invocation path.

**Promotion from candidate to admitted claim** requires (per the K-C9 and K-C10 precedent) at least one independent primitive-level analysis beyond the breached vendor's own advisory. The four triggers:

1. A second agent-framework vendor publishes an advisory of structurally equivalent shape (LangChain / LlamaIndex / CrewAI / Microsoft / Anthropic / OpenAI).
2. [Google Project Zero](https://projectzero.google/), [Microsoft Threat Intelligence](https://www.microsoft.com/en-us/security/blog/), [Wiz Research](https://www.wiz.io/blog), [Chainguard](https://chainguard.dev/unchained), or an equivalent research firm publishes a primitive-level analysis of agent-tool-trust-boundary.
3. An academic cs.CR preprint names the primitive explicitly.
4. CVE assignment of a sibling vulnerability in a second agent framework.

Until one of those triggers fires, K-C11 remains named-but-not-admitted. The Strands advisory alone is sufficient to **name** the primitive; it is not sufficient to **admit** it as a Kronos claim. Admission is reserved for primitives for which the holder-class failure mode has been demonstrated beyond the first disclosing vendor's own system.

**Scorecard delta — Olympus-Grid Athena → MCP → Poseidon:** no change. Posture was previously unmeasured on K-C10 at the agent-tool boundary; it is now additionally unmeasured on K-C11-candidate at the within-tool policy boundary. L? remains L? until a prompt-injection probe passes against a Poseidon tool with a configurable policy.

## In Response

**Nothing yet** across all three K-C11-candidate subtests.

Olympus-Grid's agent-framework architecture is directly symmetric to the Strands advisory:

- `athena/api/src/ai/mcp-connection-pool.ts` — multi-server MCP pool. Routes agent tool invocations to downstream MCP servers.
- `athena/api/src/ai/mcp-namespace.ts` — tool-namespace prefixing. Composes `{namespace}__{tool}` identifiers; does not enforce per-tool-policy.
- `athena/api/src/ai/mcp-envelope.ts` — sealed envelope builder for per-tool token scoping. Addresses K-C1-TENANT-SECRET-ENVELOPE for the token *at the transport layer*; does not address K-C11 for the *returned data*.
- `athena/api/src/ai/mcp-token-scope.ts` — maps tools to required service tokens. Scope enforcement is on which tokens get included, not on what the tool returns.
- `poseidon/mcp/src/core/mcp.ts` — Poseidon MCP server with the 50+ tools. Each tool is a handler. Policy enforcement is per-tool, implemented ad-hoc.
- `poseidon/mcp/src/http/server.ts` — HTTP transport + cosmos-logos handshake. Boundary with the agent is here.

What is not in-tree:

- An enumeration of which Poseidon tools have configurable security policies (allowlists, masking, read-only, scope restrictions).
- A test that attempts to override each such policy via a crafted prompt.
- A response-channel filter that enforces policy at the Hermes or Ares layer independently of what Poseidon returned.
- An operator-side artifact that would, in an attestation, let a reader see which tools have been K-C11-probed and which have not.

**Decision window — next EOS cycle.** The named-but-not-done items go to the EOS backlog:

1. **Enumerate** every Poseidon tool with a configurable security policy. Deliverable: a table in `poseidon/docs/K-C11-SURFACE.md` listing (tool_name, policy_type, policy_mechanism, policy-override-reachable-from-prompt). Owner: Poseidon engineering. Target: EOS-20.
2. **Probe** each enumerated tool with a crafted-prompt override attempt. Deliverable: `poseidon/tests/K-C11-probe/*.test.ts` with pass/fail results per tool. Owner: Kronos + Poseidon engineering joint. Target: EOS-21.
3. **Response-channel filter** at the Athena layer. Deliverable: `athena/api/src/ai/mcp-response-filter.ts` that enforces a secrets-and-PII masking policy on tool-returned content regardless of invocation path. Owner: Athena engineering. Target: EOS-22.

Note the symmetry: this In Response section's gap list is directly structurally parallel to the K-C10 In Response gap list on the [OpenAI frontier-agent reckoning](2026-10-26-openai-frontier-agent-escape-sandbox-integrity.md). The two primitives share the "agent-boundary posture unmeasured" state. The two EOS backlog additions are complementary — K-C10 addresses the sandbox *around* the agent, K-C11 addresses the policy *inside each tool* the agent calls. Both are necessary; neither is sufficient alone.

The Operator does not currently claim Athena → MCP → Poseidon holds either K-C10 or K-C11-candidate. The honest state is L? across both. Running the enumerate + probe for K-C11 is the cheaper of the two to measure (bounded by the 50+ Poseidon tools), and is named as the first slice.

---

**Standards cross-reference:** [OWASP LLM01:2025 Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [OWASP LLM02:2025 Insecure Output Handling](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [OWASP LLM06:2025 Sensitive Information Disclosure](https://owasp.org/www-project-top-10-for-large-language-model-applications/) · [CWE-1427 Improper Neutralization of Input Used for LLM Prompting](https://cwe.mitre.org/data/definitions/1427.html) · [CWE-285 Improper Authorization](https://cwe.mitre.org/data/definitions/285.html) · [CWE-863 Incorrect Authorization](https://cwe.mitre.org/data/definitions/863.html) · [NIST AI RMF 1.0 — Measure 2.6 Trustworthy Characteristics: Secure and Resilient](https://www.nist.gov/itl/ai-risk-management-framework) · [NIST SP 800-53 AC-3 Access Enforcement](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) · [NIST SP 800-53 SC-28 Protection of Information at Rest](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) · [MITRE ATLAS AML.T0051 LLM Prompt Injection](https://atlas.mitre.org/techniques/AML.T0051) · [MITRE ATLAS AML.T0054 LLM Jailbreak](https://atlas.mitre.org/techniques/AML.T0054) · [SOC 2 CC6.1 Logical Access](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services) · [SOC 2 CC6.6 Boundary Protection](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services)
