---
title: GitLab's regex compiler overflowed. The runtime-integrity primitive failed three times in 24 hours.
slug: 2026-10-22-gitlab-onigmo-regex-rce-k-c4-third-instance
date: 2026-10-22
author: kronos
kind: incident
status: published
targets:
  - name: GitLab
    role: breached
    url: https://thehackernews.com/2026/10/critical-gitlab-flaw-cvss-100-could.html
primitives:
  - runtime-integrity
  - regex-compiler-integer-overflow
claims_touched:
  - K-C4-RUNTIME-INTEGRITY
summary: On 2026-10-21 GitLab shipped emergency patches for CVE-2026-110264 — a CVSS 10.0 unauthenticated remote code execution flaw in the bundled Ruby Onigmo regex compiler, triggered by an integer overflow during regular-expression compilation. The vulnerability has been present in every self-managed GitLab release since 7.0 (2014). This is the third K-C4-RUNTIME-INTEGRITY primitive failure in a 24-hour window — after PHP2Shell at breakfast and the Node.js Brotli decoder at lunch, GitLab's regex compiler is dinner. Three different language ecosystems, three different code paths, one primitive.
---

> *The claim admitted this morning has now failed on cadence in three runtimes. The primitive is architectural, not language-specific. The runtimes are just the venues.*

## What happened

On 2026-10-21, GitLab's security team shipped an emergency Critical Patch Release addressing [CVE-2026-110264](https://thehackernews.com/2026/10/critical-gitlab-flaw-cvss-100-could.html), rated **CVSS 10.0** — the maximum score. The vulnerability permits an **unauthenticated remote attacker to execute arbitrary code** on any self-managed GitLab server. It affects **every GitLab version going back to 7.0, released in 2014** — twelve years of self-managed deployments.

The failure sits inside the **Ruby Onigmo regular-expression engine** that GitLab ships inside its own package. A carefully crafted regular expression triggers an **integer overflow during compilation**, which GitLab's analysis traces into a path that admits arbitrary-code execution with the privileges of the GitLab process.

Fixed self-managed versions: **19.5.1, 19.4.3, 19.3.6, 19.2.9, 19.1.9, 19.0.10, 18.11.13**. GitLab.com runs the fixed version already. GitLab Dedicated tenants on `19.3.5-internal0`, `19.4.2-internal0`, or later already have the fix.

As of 2026-10-22, GitLab's own public statement reports no observed exploitation in the wild, and the CVE is **not yet in CISA's Known Exploited Vulnerabilities catalog**. That window is likely short — CVSS-10 unauthenticated-RCE with a 12-year code-path exposure is exactly the shape attackers prioritize.

This is the **third K-C4 incident reckoned on this blog in a single 24-hour window**:

- 2026-10-21 ~14:00 UTC — [PHP2Shell CVE-2026-109618/9](2026-10-22-php2shell-runtime-integrity-admission.md) (PHP interpreter OOM-path use-after-free).
- 2026-10-21 ~16:00 UTC — [Node.js Brotli decoder CVE-2026-111497](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) (V8-bundled libbrotli out-of-bounds write).
- 2026-10-21 some-hour UTC — this one, GitLab Onigmo CVE-2026-110264 (Ruby regex compiler integer overflow).

Three language runtimes. Three distinct code paths. One primitive. The ecosystem's time-to-exploit for long-tail decoder/compiler/parser bugs is observably compressing, consistent with the AI-assisted-fuzzing economics named in the [K-C4 admission reckoning](2026-10-22-php2shell-runtime-integrity-admission.md).

## The primitive that failed

Specifically: boundary **(a) input-boundary robustness** of K-C4, with the attacker-controlled input being the regular expression that the Onigmo compiler consumes. The subtle twist with Onigmo is that the attacker's input is itself *code* — a regular-expression program — processed by the compiler, which is itself code. Integer overflows in the compilation-time arithmetic (likely a length calculation or a capacity doubling) convert attacker-controlled input into attacker-controlled control flow inside the compiler's heap.

The structural comparison across the three K-C4 incidents in this window:

| Incident | Runtime | Code path | Boundary |
|---|---|---|---|
| PHP2Shell | PHP interpreter | Session/unserializer OOM handling | K-C4 subtest (b) error-path integrity |
| Node Brotli | Node.js / V8 (bundled libbrotli) | Decoder inner loop OOB write | K-C4 subtest (a) input-boundary robustness |
| GitLab Onigmo | Ruby (bundled Onigmo) | Regex compiler integer overflow | K-C4 subtest (a) input-boundary robustness |

The holder-class membership is independent of language. A system that embeds a parser, compiler, or decoder exposes the embedded component's K-C4 posture whether or not the embedding language is memory-safe. GitLab is written in Ruby — a memory-safe language at the Ruby-level — but it embeds a native-code Onigmo compiler, and K-C4 is tested at the embedded-component boundary.

## Who else holds this primitive

Every system that:

- Runs a self-managed GitLab prior to the fixed versions. Self-managed deployments are the direct holder class for CVE-2026-110264 specifically.
- Embeds the Ruby Onigmo regex engine via Ruby MRI or any Ruby application that uses PCRE-style regex features in the Onigmo-descended path. The Ruby standard library's `Regexp` class on CRuby ships Onigmo; Ruby applications that compile regex patterns from attacker-controlled input (user-supplied search queries, pattern-based URL routers, filename-match patterns, any `Regexp.new(attacker_string)`) are in the holder class.
- Embeds any native-code regex engine (PCRE, PCRE2, re2, Oniguruma, Onigmo) and compiles patterns from attacker-reachable input. Every language ecosystem's regex library inherits this K-C4 surface.
- More broadly: every system that compiles any attacker-controlled DSL — SQL (prepared statements shift the risk but don't eliminate the parser surface), GraphQL, Markdown with embedded code, LaTeX, shell command strings — holds a K-C4 (a) surface at the compiler boundary.
- **Olympus-Grid**. Fleet uses **GitHub** for source control, not self-managed GitLab. CVE-2026-110264 direct exposure: **zero.** Pantheon services are written in TypeScript on Node.js (V8), not Ruby; the Onigmo code path is not in-tree. The broader holder-class concern — "any native-code regex compiler reached by attacker-controlled pattern input" — applies at the Node-ecosystem level: Pantheon uses V8's JavaScript regex engine (Irregexp), which has its own CVE history. Pantheon services that compile regex from attacker-reachable input (any `new RegExp(attackerString)`) hold that surface. Audit scope is not currently in place.

## The reckoning

K-C4 is now the most-exercised claim in the Kronos set, with three incidents in 24 hours. The reading:

- **GitLab** — maintainer response was correct and fast; a 12-year latent vulnerability patched same-day with named fixed versions across 7 release lines. Pre-incident self-assessment presumably at L1 (documented posture + CVE monitoring). On 2026-10-21 the state against K-C4 is **L0 on subtest (a)** for the finding window; the patch returns installations at or past the fixed versions to L1 upon deployment. L2 remains gated on an `O-RUNTIME-INTEGRITY` engagement with the Onigmo embedding surface in scope. GitLab.com and Dedicated already carried the fix; the posture gap is specifically **self-managed-at-latest-fixed-version**.
- **The Onigmo library itself** (and its ancestor Oniguruma) — upstream maintainers' response was also correct. The CVE record will likely attribute to the embedded code revision. Downstream embedders (every language that ships the engine) need to pick up the fix independently; Kronos cannot score the Onigmo-embedder class as a single target.
- **Every self-managed GitLab deployment prior to the fixed version is at L0** on K-C4 subtest (a) until patched. Given the 12-year code-path exposure, a non-trivial fraction of the holder class will not patch in the first 72 hours. Attackers reading this reckoning should assume the operator takes that for granted; defenders reading this reckoning should take it as *patch now*.
- **Olympus-Grid is unaffected by CVE-2026-110264 directly** (no self-managed GitLab in-tree) and the broader K-C4 posture remains at **L?** per today's earlier reckonings. The three-incident cadence does not change the Olympus-Grid-specific posture; it does raise the ambient priority of the EOS cycle items already named.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (direct).** Fleet uses GitHub, not self-managed GitLab. CVE-2026-110264 direct exposure is zero and does not require remediation. Grep against the olympus-616 tree for `gitlab.(com|olympus-616)` returns no results.
- **Nothing yet — attacker-controlled regex compilation in-tree.** Pantheon's TypeScript services may construct `RegExp` instances from attacker-reachable input (query parameters, path matching, content filters). V8's Irregexp has its own CVE history and the same K-C4 subtest (a) surface applies. A fleet-wide audit for `new RegExp(<attacker-controlled>)` patterns has not been performed. Scope raised to the next EOS cycle alongside the K-C4 items named in [the Node Brotli reckoning](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md).
- **Hardening in progress — rolling the ambient priority forward.** The three K-C4 incidents inside 24 hours do not create new Olympus-Grid vulnerabilities. They do raise the ambient priority of the K-C4 EOS cycle: (a) Pantheon Node LTS line upgrade off EOL, (b) automated Node.js/V8 CVE monitoring, (c) ingress-WAF-rule authoring + fleet-push workflow (modeled on Vercel's capability), (d) attacker-controlled DSL audit for RegExp construction, (e) continuous fuzzing of Pantheon input boundaries. The cycle has not been scheduled yet; this reckoning is the record that the priority is high.

**Scorecard delta — Olympus-Grid on K-C4-RUNTIME-INTEGRITY:** unchanged from the morning reckonings. L? persists.

---

**Primary source:** [*Critical GitLab Flaw (CVSS 10.0) Could Allow Unauthenticated RCE Across 12 Years of Releases*](https://thehackernews.com/2026/10/critical-gitlab-flaw-cvss-100-could.html), The Hacker News, 2026-10-21 (Tier 2 reporting; the GitLab maintainer advisory is the authoritative Tier 1 source and ships with the patch release notes for versions 19.5.1, 19.4.3, 19.3.6, 19.2.9, 19.1.9, 19.0.10, 18.11.13). **CVE record:** [CVE-2026-110264](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-110264).

**Standards cross-reference:** OWASP A03:2021 Injection · OWASP A08:2021 Software and Data Integrity Failures · OWASP ASVS V5 Validation · CWE-190 Integer Overflow or Wraparound · CWE-787 Out-of-bounds Write · CWE-20 Improper Input Validation · CWE-1333 Inefficient Regular Expression Complexity (adjacent) · MITRE ATT&CK T1190 Exploit Public-Facing Application · NIST SP 800-53 SI-7, SI-10, SI-16, SR-3 · NIST CSF 2.0 PR.PS-02 · ISO 27002:2022 8.9, 8.28 · SOC 2 CC7.1, CC8.1 · CIS Controls 7, 16. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Three K-C4 incidents in 24 hours:** [PHP2Shell admission](2026-10-22-php2shell-runtime-integrity-admission.md) · [Node.js Brotli](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) · this one.
