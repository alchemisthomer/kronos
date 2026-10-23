# F-2026-10-22 — EOS backlog from the first reckoning week

**Status:** Open · awaiting `--eos` agent to encode into `foundation/eos/cycle/00_backlog/`
**Authored by:** kronos (Universal Adversarial Assurance Platform)
**Date:** 2026-10-22
**Scope:** Olympus-Grid In-Response gaps named across the first week of Kronos reckonings (K-C1 through K-C8)
**Target repo:** `foundation/eos/cycle/00_backlog/`
**Owning agent for pickup:** `--eos`

## What this document is

This is a Kronos-authored handoff artifact. Kronos published 11 reckonings in the first week of operation (2026-10-21 → 2026-10-22) admitting eight primitive claims (K-C1 through K-C8) into the Kronos claim set. Each reckoning's "In Response" section named specific posture gaps on Olympus-Grid. Those gaps are listed below in a form that the `--eos` agent can convert into EOS backlog items in `foundation/eos/cycle/00_backlog/`.

**Kronos's role here is to name the gap and point at the evidence. The `--eos` agent's role is to encode the gap into a cycle backlog item with the EOS template, size it, prioritize it, and move it through the kanban.** This document is the bridge between the two.

Per the `kronos` persona definition: *"Kronos writes the check; EOS gives it a home."* This file is the check.

## Reckonings this handoff draws from

| Reckoning | Primitive admitted / tested | Olympus-Grid posture |
|---|---|---|
| [Railway credential envelope collapse](../docs/blog/posts/2026-10-21-railway-credential-envelope-collapse.md) | K-C1 inaugural | L? |
| [Zeabur sunset](../docs/blog/posts/2026-10-21-zeabur-sunset-same-envelope.md) | K-C1 + K-C2 inaugural | L? |
| [OpenAI monitor suppression](../docs/blog/posts/2026-10-21-openai-agents-silenced-their-monitors.md) | K-C3 admission | L? |
| [PHP2Shell](../docs/blog/posts/2026-10-22-php2shell-runtime-integrity-admission.md) | K-C4 admission | L? |
| [Node.js Brotli](../docs/blog/posts/2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) | K-C4 first incident | L? |
| [GitLab Onigmo](../docs/blog/posts/2026-10-22-gitlab-onigmo-regex-rce-k-c4-third-instance.md) | K-C4 third instance | L? |
| [NGINX five flaws](../docs/blog/posts/2026-10-22-nginx-five-cves-k-c4-fourth-instance.md) | K-C4 fourth + K-C7 adjacency | L? |
| [PyTorch autograd](../docs/blog/posts/2026-10-22-pytorch-autograd-representational-equivalence-admission.md) | K-C5 admission | L? indirect |
| [ARTEX / Storm-0940](../docs/blog/posts/2026-10-22-artex-storm-0940-adversary-cadence-admission.md) | K-C6 admission | L? |
| [eMudhra CA](../docs/blog/posts/2026-10-22-emudhra-ca-root-of-trust-admission.md) | K-C7 admission | L? |
| [LiteLLM supply chain](../docs/blog/posts/2026-10-22-litellm-supply-chain-admission.md) | K-C8 admission | L? |

## EOS backlog items (deduplicated across all reckonings)

Each item below is sized small/medium/large for EOS triage. Items are listed in approximate priority order (small-and-cheap-first within each primitive). References point into the reckonings for the full "why."

### 1. Pantheon Node LTS line upgrade off EOL

**Source primitives:** K-C4 (Node.js Brotli reckoning), K-C7 (eMudhra reckoning, Node CVE-2026-106074 entropy-cache signal), ambient across the K-C4 wave.
**Size:** large.
**Scope:** Every Pantheon god service pins `FROM node:20-alpine` in its Dockerfile. Node 20 is past upstream EOL and does not receive security backports. Upgrade to a currently-supported LTS line (22.x or 24.x).
**Entry points:** `*/api/Dockerfile`, `poseidon/mcp/Dockerfile`, `*/mcp/Dockerfile`, `*/api/package.json` engines field (where set), CI workflows that build Pantheon containers.
**Acceptance criterion:** `grep -rE "FROM node:20" --include="Dockerfile*" .` returns zero matches; `nvm`/pinned-version evidence in each service's package.json `engines` field matches the Dockerfile line; CI builds succeed across every god; a fleet-wide pantheon-up smoke test passes against the new base.
**Follow-on EOS checks:** this is the single most actionable item from the K-C4 wave; it also addresses K-C7 subtest (a) exposure to CVE-2026-106074 which Node 20 will not receive a patch for.
**Suggested EOS cycle size:** could ride on an existing cycle as a §9 claim ("Pantheon runs no EOL Node"), or stand up as its own cycle if the sizing warrants.

### 2. Automated Node.js / V8 / Pantheon-dependency CVE monitoring

**Source primitives:** K-C4 (Node.js Brotli, GitLab, NGINX reckonings — all name the gap).
**Size:** small.
**Scope:** No alert fires today when upstream Node.js or V8 ships a security release. The Pantheon finds out via manual Tier-1 reading (which is what this Kronos operator does). Automate it.
**Entry points:** GitHub Actions workflow or external monitoring (RSS of nodejs.org/en/security + V8 security tracker + GitHub Advisory Database filtered by npm ecosystem + Pantheon's dependency surface).
**Acceptance criterion:** an alert channel (Steward-chosen) receives a notification within one hour of a Node.js or V8 security advisory being published, with the specific CVE record and the affected version range.
**Suggested EOS cycle size:** one small cycle, or ride on a maintenance cycle. Pairs naturally with item 7.

### 3. Ingress-WAF-rule authoring + fleet-push workflow for Ares

**Source primitives:** K-C4 (Node.js Brotli reckoning — Vercel's same-day WAF-rule rollout as the capability shape to build toward), K-C6 (ARTEX reckoning — ingress-WAF rules as attacker-cadence containment).
**Size:** medium.
**Scope:** Ares has the dynamic policy overlay (architectural mechanism exists). What is missing is an operational workflow: "wake up to a CVE → author a detection rule → push it to every cluster same day." Define the on-call rotation, the rule-authoring template, the fleet-push mechanism, and the rollback.
**Entry points:** `ares/api/src/policy/`, `ares/api/src/middleware/`, EOS §9 process documentation.
**Acceptance criterion:** a documented workflow from CVE publication to deployed Ares policy-overlay rule in <24h, with a rehearsal of the workflow against a synthetic CVE recorded as evidence. L1-posture evidence under K-C4 and K-C6.
**Suggested EOS cycle size:** medium cycle, likely combined with item 4 (automated detection→containment).

### 4. Automated detection → containment chain in Ares

**Source primitives:** K-C6 (ARTEX reckoning), K-C4 (Node Brotli ingress-WAF frame).
**Size:** medium.
**Scope:** Ares has kill switches and rate limits. Detection signals (rate limit breach, repeated 401s, unusual geo pattern) exist and page an on-call. The detection→kill-switch chain is **not** currently automated end-to-end. Close that gap: on documented anomaly, automated containment action fires without waiting for human escalation; the human is informed, not consulted.
**Entry points:** `ares/api/src/policy/`, `ares/api/src/middleware/`, Plutus ledger integration for the containment-action attribution path.
**Acceptance criterion:** `O-ATTACKER-CADENCE` subtest (b) passes under rehearsal — every named containment path executes within stated latency bound, with no human-approval gate. Documented `T_detect` statistic for Olympus-Grid-relevant attacker classes.
**Suggested EOS cycle size:** medium cycle; natural pair with item 3.

### 5. Envelope-key provisioning entropy audit

**Source primitives:** K-C7 (eMudhra reckoning).
**Size:** small.
**Scope:** Pantheon's cosmos-logos envelope private keys are provisioned at container startup. The entropy source (`crypto.randomBytes(32)` on Node.js → `/dev/urandom` on Linux) is architecturally sound on paper, but the audit confirming this on the production ECS task's startup path, under all boot conditions (cold-start, task-definition respawn, cross-AZ failover, Fargate microVM entropy state), has not been done. Do it.
**Entry points:** `*/api/src/cosmos-logos/private-key.ts` provisioning scripts across all gods, `zeus/cdk/lib/cluster-stack.ts` for the ECS task-definition entropy context, Node.js version-specific entropy-cache behavior (CVE-2026-106074 relevance).
**Acceptance criterion:** documented review of the provisioning path, with explicit identification of the entropy source at generation time under every boot condition, and sanity checks against known-weak key ranges (small values, repeated patterns). First slice is a 30-minute code audit. If audit flags any gap, remediation is a follow-on item.
**Suggested EOS cycle size:** small cycle, likely combined with items 2 and 7.

### 6. Attacker-controlled DSL audit for `new RegExp()` in Pantheon code

**Source primitives:** K-C4 (GitLab Onigmo reckoning — same primitive at V8's Irregexp regex engine).
**Size:** small.
**Scope:** Pantheon services (TypeScript) may construct `RegExp` instances from attacker-reachable input (query parameters, path matching, content filters). V8's Irregexp has its own CVE history and the same K-C4 subtest (a) surface applies. Audit for `new RegExp(<attacker-controlled>)` patterns fleet-wide; where found, either eliminate (prefer literal regex or hand-rolled parse) or bound (length-cap + timeout + regex-complexity analysis).
**Entry points:** fleet-wide grep for `new RegExp` with manual-triage for each hit.
**Acceptance criterion:** every `new RegExp(x)` where `x` could be attacker-reachable is either eliminated or wrapped in a documented bound. L1-posture evidence under K-C4.
**Suggested EOS cycle size:** small cycle; could ride on item 2's maintenance cycle.

### 7. ECR image signing with Cosign + SLSA provenance

**Source primitives:** K-C8 (LiteLLM reckoning).
**Size:** medium.
**Scope:** The Pantheon's build pipeline (GitHub Actions → ECR → ECS) ships container images without Cosign signatures and without SLSA provenance attestations. Add both. The CI side is OIDC-authenticated (OK on credential posture); the artifact side needs the attestation layer.
**Entry points:** `.github/workflows/*.yaml` (Pantheon docker-build-push workflows), `zeus/cdk/lib/cluster-stack.ts` for ECS task-definition image reference (optionally gated on signature verification).
**Acceptance criterion:** every pushed ECR image has a valid Cosign signature and a SLSA provenance attestation in Rekor; ECS task definition optionally gates on signature verification (if the operational cost is acceptable). L1-posture evidence under K-C8.
**Suggested EOS cycle size:** medium cycle.

### 8. Supply-chain compromise alert pipeline

**Source primitives:** K-C8 (LiteLLM reckoning).
**Size:** small.
**Scope:** No automated alert fires if a package the Pantheon depends on is reported as compromised by Socket, Aikido, GitHub Advisory Database, or similar sources. Subscribe and alert.
**Entry points:** external monitoring; GitHub Advisory Database RSS; Socket webhook if available; Aikido webhook if available.
**Acceptance criterion:** an alert channel receives a notification within one hour of any package in Pantheon's `package-lock.json` surface being reported as compromised. L1-posture evidence under K-C8.
**Suggested EOS cycle size:** small cycle; pairs with item 2.

### 9. T_detect statistic for high-privilege operations

**Source primitives:** K-C6 (ARTEX reckoning).
**Size:** small.
**Scope:** The Operator does not currently measure, publish, or track a `T_detect` number for the specific attack classes Kronos has named this week (ARTEX-class password spray, PaaS-class credential-envelope breach, agentic reconnaissance pattern). Pick one class, measure `T_detect`, publish it.
**Entry points:** Plutus `LedgerEntry__c` emission + Ares middleware instrumentation + a chosen attacker-class signature.
**Acceptance criterion:** at least one documented `T_detect` number for one Kronos-named attacker class. L1-posture evidence under K-C6.
**Suggested EOS cycle size:** small cycle.

### 10. Behavioral anomaly monitoring at Athena (model output drift)

**Source primitives:** K-C5 (PyTorch autograd reckoning — indirect LLM-model-weight supply chain).
**Size:** medium.
**Scope:** Even without model-weight attestation, Olympus-Grid could detect anomalous model behavior at the inference layer — a model that starts producing systematically-different outputs than its baseline, or that starts emitting token sequences with high-entropy content that doesn't match any observable prompt pattern. Not in place at Athena.
**Entry points:** `athena/api/src/`, baseline model-behavior sampling, drift-detection logic, alerting integration with Hermes/Plutus.
**Acceptance criterion:** at least one documented drift-detection monitor on Athena model outputs, with a demonstrated detection of synthetic drift. L1-posture evidence under K-C5 indirect exposure.
**Suggested EOS cycle size:** medium cycle.

### 11. Attestation path for upstream LLM provider model weights

**Source primitives:** K-C5 (PyTorch autograd reckoning).
**Size:** large / out-of-scope for near-term.
**Scope:** Verify that upstream LLM provider models (OpenAI, Anthropic, Google, xAI) have not been poisoned via autograd-channel or similar supply-chain compromise. **Not actionable from the Olympus-Grid side** — depends on upstream providers publishing attestation evidence. Logged here as *deliberate deferral*; condition for revisit is an upstream K-C5 incident or an industry model-attestation standard emerging.
**Suggested EOS cycle size:** out-of-scope; log in `foundation/eos/cycle/00_backlog/` with a deferral note.

### 12. Olympus-Grid K-C* engagements via self-disclosure protocol

**Source primitives:** every claim admitted this week (K-C1 through K-C8).
**Size:** large / recurring.
**Scope:** The honest posture across every claim admitted this week is **L?** — "no evidence has been produced." Moving to L1 requires documentation; moving to L2 requires running the oracle under the self-disclosure protocol in `kronos/docs/blog/concept.md § The self-disclosure rule`. Each engagement is sized separately per oracle.
**Entry points:** `kronos/engagements/olympus-grid/` (does not yet exist); each oracle under `kronos/methodology/oracles/`.
**Acceptance criterion:** at least one Olympus-Grid K-C* engagement executed under self-disclosure, producing a target reckoning published to the Reckonings blog with scorecard delta.
**Suggested EOS cycle size:** large; probably one cycle per K-C* claim as engagement capacity allows.

## How to use this document

**For the `--eos` agent:** read each item above; use the EOS feature template at `foundation/eos/docs/features/TEMPLATE.md` (or wherever the current template lives); encode each item as a backlog markdown file under `foundation/eos/cycle/00_backlog/`; size and prioritize per EOS discipline; reference this findings document from each created backlog item so the Kronos origin is traceable.

**For the Steward:** this is Kronos's recommended `--eos` handoff. The current state is that Kronos has written the checks; EOS needs to give them homes. Direct the `--eos` agent at this file when the next backlog refresh is scheduled.

**For future Kronos operators:** reference this file from each applicable claim doc as "the EOS backlog state for this claim." Update this file on each wakeup pass that adds items. Keep this file de-duplicated — multiple reckonings pointing at the same Olympus-Grid gap collapse to one item here.

## Not covered by this document

- EOS-level process changes (how the cycle template works, how the §9 claims are structured, how attestation flows). Those belong to `--eos`.
- Olympus-Grid Apex / LWC / managed-package changes needed to execute specific items. Those belong to `--olympus-grid`.
- Pantheon-god-specific defect fixes. Each god's defect fixes belong to that god's agent.
- Reckonings themselves. Those are in `kronos/docs/blog/posts/`.

## Related documents

- `kronos/CLAUDE.md` — Kronos persona (if/when authored; the persona definition is currently in the agent-launcher config)
- `kronos/methodology/claims/` — the eight current Kronos claims
- `kronos/methodology/oracles/` — the eight current Kronos oracles
- `kronos/docs/blog/posts/` — the eleven current Kronos reckonings
- `kronos/operations/signal-log.md` — Bucket C signals that may become future reckonings
- `kronos/operations/wakeup-log.md` — operator-pass log
- `foundation/eos/cycle/` — EOS kanban (owned by `--eos`)
