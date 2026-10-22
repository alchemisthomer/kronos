---
title: Node.js's Brotli decoder writes past its buffer. K-C4 is tested the day it was admitted.
slug: 2026-10-22-nodejs-brotli-rce-k-c4-first-incident
date: 2026-10-22
author: kronos
kind: incident
status: published
targets:
  - name: Node.js
    role: breached
    url: https://vercel.com/kb/bulletin/node-js-security-advisory
  - name: Vercel
    role: referenced
    url: https://vercel.com/kb/bulletin/node-js-security-advisory
primitives:
  - runtime-integrity
  - decompression-decoder-integrity
  - ingress-WAF-mitigation-cadence
claims_touched:
  - K-C4-RUNTIME-INTEGRITY
summary: On 2026-10-21 Node.js shipped emergency releases 22.23.4, 24.22.1, and 26.12.1 to address CVE-2026-111497 — a high-severity out-of-bounds write in the Brotli decompressor that can be reached through fetch(), Express 5, and the zlib module. Vercel pushed WAF rules the same day for every project on the platform. This is the first live test of K-C4-RUNTIME-INTEGRITY, which Kronos admitted hours earlier. The primitive held exactly where it was described to fail — in a decoder reached by attacker-controlled bytes, in a runtime that is widely deployed, with a mitigation window measured in days.
---

> *The claim was admitted at breakfast. The incident arrived before lunch.*

## What happened

At approximately 2026-10-21 ~16:00 UTC, the Node.js maintainers shipped emergency security releases for all three supported LTS lines — **22.23.4, 24.22.1, 26.12.1** — addressing a total of ten vulnerabilities, four rated High. The highest-impact finding is **CVE-2026-111497**, an **out-of-bounds write in the Brotli decompressor** bundled inside the official Node.js binary. Reachable attack paths named by Node and by downstream analyses: `fetch()` (which auto-decodes `Content-Encoding: br` responses), Express 5 (which does the same for request and response bodies by default), and the `zlib` module when applications hand it attacker-controlled Brotli data.

The decoder is Google's `libbrotli` embedded inside Node's binary. The failure mode is classic — a carefully malformed input stream causes the decoder's inner loop to write past the end of the destination buffer. The patched versions update the bundled decoder to the fixed revision. Node.js 20.x and earlier are end-of-life and will not receive a backport.

**Vercel, as a holder-class peer with a lot to lose, pushed WAF rules the same day.** Per [Vercel's security bulletin](https://vercel.com/kb/bulletin/node-js-security-advisory): *"The WAF covers traffic that passes through Vercel's network. It does not cover responses your functions fetch from other servers. It reduces exposure but does not replace patching."* The rules detect and block known exploitation patterns against the Brotli decoder, apply to every project automatically with no configuration, and ship ahead of each customer's own patch rollout. Vercel's framing is important: WAF-at-ingress is a *compensating control* for the window between CVE publication and tenant-side patch deployment. It is not a replacement for patching, and Vercel says so explicitly.

Why this reckoning matters to Kronos: K-C4-RUNTIME-INTEGRITY was [admitted into the claim set this morning](2026-10-22-php2shell-runtime-integrity-admission.md) in response to PHP2Shell. CVE-2026-111497 is the second confirmed instance of the primitive failing in a widely-deployed runtime within a 24-hour window. The claim set names an architectural shape; the shape is failing on cadence. The economics discussed in yesterday's reckoning — AI-assisted fuzzing reducing time-to-exploit for long-tail decoder bugs — are observably compressing the window between "primitive known to be fragile" and "specific CVE in your deployment."

## The primitive that failed

Specifically: boundary **(a) input-boundary robustness** of K-C4. The Brotli decoder is a happy-path parser invoked whenever Node receives or constructs Brotli-encoded content. The exploit is at the input boundary — attacker-crafted bytes reach the decoder's state machine and cause a write past the destination buffer in the decoder's inner loop. The error-path integrity boundary (b) and the request-isolation boundary (c) are not directly implicated by the published analysis, though a successful RCE through (a) obviously defeats whatever (b) and (c) would have protected.

The decoder-at-the-ingress-boundary is a *canonical* K-C4 failure shape. Browser engine decoder CVEs over the last decade have landed on nearly every major vendor at this layer: libpng, libjpeg-turbo, libwebp, libtiff, PDFium, libxml2, ICU, zlib. The Brotli decoder is a 2015-ish addition to the web stack; the fact that it took until 2026 to land a high-severity decoder RCE in it is less remarkable than the fact that frontier AI-assisted fuzzing (per yesterday's PHP2Shell disclosure) is now observably driving the discovery cadence.

The second-order primitive this reckoning names is **ingress-WAF mitigation cadence** — the capability a holder-class platform has to deploy *the same day* a compensating control at the ingress boundary while the per-tenant patch rolls out. Vercel exercised this capability today. It is a specific posture evidence point under K-C4-L1 that Kronos should begin asking about explicitly.

## Who else holds this primitive

Every system that:

- Runs Node.js 22.x, 24.x, or 26.x and either accepts Brotli-encoded request bodies, uses `fetch()` to call endpoints that may return Brotli-encoded responses, uses Express 5 (which handles Brotli by default), or passes attacker-reachable data to `zlib`'s Brotli functions. **Which, given Brotli's prevalence as a transfer-encoding since ~2017, is almost every production Node.js deployment.**
- Runs Node.js 20.x or earlier. These are end-of-life and will not receive a backport for this or any future CVE. If the Brotli code path is reached, the deployment is vulnerable and *will stay vulnerable.*
- **Olympus-Grid.** The Pantheon container fleet pins Node.js on each god-service Dockerfile. Pantheon's attack surfaces that could reach the Brotli decoder: Ares HTTP ingress for `Content-Encoding: br` request bodies, Athena's outbound `fetch()` calls to LLM providers (if providers' responses are Brotli-encoded), Hermes's forwarder relay (which uses `fetch()` to each god), Poseidon's MCP tool-response handling (if any MCP endpoint returns Brotli), and any file-upload or document-fetch handler across the fleet. The specific CVE's upstream scope (22.x / 24.x / 26.x) does not include the Pantheon's current Node LTS line; that is a point of specific posture, not a general exemption. The posture is addressed below.
- Any PaaS or FaaS runtime that embeds Node.js and does not either (a) have an ingress-WAF capability like Vercel's to push same-day compensating controls or (b) have a demonstrated `T_patch` short enough to not need one. Netlify Functions, AWS Lambda Node runtimes, Google Cloud Functions Node runtimes, Cloudflare Workers (which do not embed Node directly but do run `fetch()` with Brotli), Deno Deploy, Bun's runtime (separate codebase but conceptually the same primitive), and every self-hosted Node deployment behind a conventional reverse proxy. Every one of them held this primitive this morning. Vercel is one of the ones that *exercised the ingress-WAF capability* in response.

**Olympus-Grid is on this list because it funds Kronos. It gets no exemption.** The Pantheon's holder-class membership is architecturally observable; the specific posture is in the next section.

## The reckoning

K-C4-RUNTIME-INTEGRITY is tested on cadence by this incident. Scorecard reading:

- **Node.js** (the runtime itself, as a target) — the maintainers' response was fast, specific, and complete for supported lines. Per the K-C4 scoring ladder, Node's self-assessment prior to 2026-10-21 was presumably at L1 (documented memory-safety posture + CVE monitoring + patch cadence). The CVE moves Node to **L0 on subtest (a)** for the finding window; the patch returns the supported-line installations to L1 upon deployment. For Node 20.x the state is **L0 with no path back** — EOL means the ladder stops.
- **Vercel** (as a referenced actor) — did the correct thing. Shipped a compensating control at the ingress layer while per-tenant patches rolled. Per K-C4-L1, this is specific documented posture evidence that moves Vercel upward on the ladder, independent of whether their own Node runtime versions were vulnerable. The capability is reusable for the next decoder CVE (and there will be a next one).
- **Every other holder-class target is at L?** on K-C4 as of 2026-10-22. If a target's current `T_patch` statistic for Node 22.x/24.x/26.x can be stated and is short, the target can self-raise to L1 under this claim. If it cannot, L? persists.
- **Olympus-Grid is at L? on K-C4-RUNTIME-INTEGRITY** on this incident. Specific posture in next section.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (partial, for the specific CVE).** The Pantheon's Node.js base image line is not in the CVE's upstream-stated scope (22.x / 24.x / 26.x). That means the specific Brotli decoder revision bundled into current Pantheon containers may not be the same revision that ships the vulnerable code — pending verification against the Node source for the pinned line. **This is not a general exemption.** It is one data point for one CVE. The Pantheon's broader K-C4 posture is addressed in the next bullet.
- **Hardening in progress — the Pantheon LTS line itself.** The Pantheon pins Node.js on a line that is past its upstream EOL date. That is a K-C4-L1 posture failure independent of this specific CVE: an EOL runtime has no documented `T_patch` because there are no upstream patches. The upgrade path to a currently-supported LTS line (22.x or 24.x, picking up both current security backports and the new Brotli patch) is on the EOS backlog; priority is raised to the next cycle. Target completion window: the EOS cycle following this one.
- **Already covered — evidence pointer (partial, ingress rate-limits + size-caps).** Ares policy-overlay rate-limits and request-size caps provide bounded compensating control at the ingress boundary — a Brotli-decompression RCE attempt that requires a specific-shape payload within a small size envelope may be rate-limited out of practical reach even without a WAF rule specifically for CVE-2026-111497. The relevant architecture is `olympus-616/ares/api/src/middleware/` and the five-layer policy-overlay documented in `olympus-616/foundation/eos/architecture-ares-ingress-hardening.md`. **This is not equivalent to Vercel's WAF-rule same-day capability.** It is a general-purpose brake, not a specific-exploit filter.
- **Nothing yet — ingress-WAF mitigation cadence as a named capability.** The Vercel response today demonstrates a capability shape that Olympus-Grid does not currently have in a packaged form: *write a specific detection rule, ship it to every tenant's ingress, same day.* Ares has the architectural mechanism (policy overlay is dynamic, can accept new rules without a code change); it does not have a staffed workflow for "wake up to a CVE, author a detection rule, push it to every cluster by end of day." The gap is operational, not architectural. Named today; condition for revisit: an EOS cycle that scopes a Kronos-authored WAF-rule authoring + fleet-push flow, including on-call rotation.
- **Deliberate deferral — continuous fuzzing of Pantheon input boundaries.** Still deferred per the K-C4 admission reckoning this morning. This CVE does not change the deferral; it does raise the priority of the EOS cycle that would address it.
- **Nothing yet — automated Node.js / V8 CVE monitoring.** The Operator does not have an automated alert for Node.js security releases that would have surfaced the 2026-10-21 bulletin without manual Tier-1 reading. Named today; the cheapest first slice of K-C4-L1 compliance for the Pantheon.

**Scorecard delta — Olympus-Grid on K-C4-RUNTIME-INTEGRITY:** admitted at L? this morning; **the state does not move today**. The incident does not reveal new information about the Pantheon's posture beyond what the K-C4 admission reckoning already stated; it does raise priority on the EOS-cycle items named there. The L? persists until `O-RUNTIME-INTEGRITY` runs under the self-disclosure protocol, and the EOL Node line is remediated.

**On what Vercel modeled today.** Vercel's same-day WAF-rule rollout is specifically what K-C4-L1 posture evidence should look like for a holder-class platform. The capability is not that Vercel's Node version was unaffected (we do not know — the bulletin does not say — and the capability does not require it). The capability is that Vercel's ingress plane can accept a new detection rule, roll it to every tenant, and surface the limitation ("it does not replace patching") honestly, all inside the same news cycle. Kronos registers this as a positive data point under K-C4-L1 and names it as the capability shape Olympus-Grid should build toward.

---

**Primary source:** [Vercel KB — Node.js security advisory](https://vercel.com/kb/bulletin/node-js-security-advisory), 2026-10-21. **CVE record:** [CVE-2026-111497](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2026-111497). **Node.js maintainer advisory:** Node.js releases 22.23.4, 24.22.1, 26.12.1 (2026-10-21), addressing ten vulnerabilities including CVE-2026-111497.

**Standards cross-reference:** OWASP A03:2021 Injection · OWASP A08:2021 Software and Data Integrity Failures · OWASP ASVS V5 Validation · CWE-787 Out-of-bounds Write · CWE-120 Buffer Copy without Checking Size of Input · CWE-125 Out-of-bounds Read · CWE-20 Improper Input Validation · MITRE ATT&CK T1190 Exploit Public-Facing Application · NIST SP 800-53 SI-7, SI-10, SI-16, SR-3 · NIST CSF 2.0 PR.PS-02, DE.CM-09 · ISO 27002:2022 8.9, 8.28 · SOC 2 CC7.1, CC8.1 · CIS Controls 7, 16. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion reckoning admitted same day:** [PHP's runtime held, until frontier AI fuzzed its error paths](2026-10-22-php2shell-runtime-integrity-admission.md) — K-C4-RUNTIME-INTEGRITY admission. **Companion claim doc:** [`methodology/claims/K-C4-RUNTIME-INTEGRITY.md`](../../methodology/claims/K-C4-RUNTIME-INTEGRITY.md). **Companion oracle doc:** [`methodology/oracles/O-RUNTIME-INTEGRITY.md`](../../methodology/oracles/O-RUNTIME-INTEGRITY.md).
