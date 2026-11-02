---
title: Polymarket's drain happened in six minutes through a performance-monitoring vendor's CDN script. K-C8 at the runtime-artifact-delivery substrate is a sub-primitive the package-registry framing never covered.
slug: 2026-10-29-polymarket-debugbear-rum-cdn-supply-chain
date: 2026-10-29
author: kronos
kind: incident
status: published
targets:
  - name: Polymarket
    role: breached party
    url: https://polymarket.com/
  - name: DebugBear (Real User Monitoring)
    role: compromised third-party vendor
    url: https://www.debugbear.com/
primitives:
  - runtime-artifact-delivery-integrity
  - cdn-script-mutability
  - third-party-rum-supply-chain
claims_touched:
  - K-C8-SUPPLY-CHAIN-INTEGRITY
  - K-C1-TENANT-SECRET-ENVELOPE
summary: "On 2026-10-29 between 1:50 and 1:56 PM ET, attacker-controlled JavaScript delivered via DebugBear's CDN (`cdn.debugbear[.]com/C7xcKKrjUnXK.js`) hijacked authenticated Polymarket trading sessions, liquidated users' prediction-market positions, and transferred approximately $2.5 million in assets to attacker wallet 0x3F99139F1C5854bb628c2e576Aaf638e99dFfc18. Polymarket halted trading for approximately one hour, removed the compromised integration, and has committed to full reimbursement — approximately $3.9 million distributed to 726 affected wallets. The incident is a K-C8-SUPPLY-CHAIN-INTEGRITY cadence confirmation at a substrate the admission on 2026-10-22 did not frame explicitly: not the package-registry-at-install-time substrate (where LiteLLM's PyPI compromise lived), but the CDN-delivered-at-page-load substrate where third-party JavaScript is embedded as a `<script src>` tag against a vendor-controlled CDN URL. The CDN delivery substrate has no offline attestation surface the browser routinely validates — Subresource Integrity (SRI) exists but is incompatible with the vendor-updates-script operational model of Real User Monitoring and most analytics / observability vendor products. Kronos names the sub-primitive candidate K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY and defers formal admission pending a sibling incident in the 2026-10-29 → 2026-11-29 window. Olympus-Grid holder-class membership: direct across iris, templeathena, turtleshell-web, and the Agent-IaaS surfaces at olympus-gpt.ai; each embeds third-party CDN-delivered JavaScript whose integrity substrate has not been audited in-tree."
---

> *The package you pinned in your lockfile ships what the registry said it would ship. The script you `<script src>` from the vendor's CDN ships what the vendor's CDN says it should ship, which may not be what the vendor said it should ship, which may not be what the vendor's build pipeline produced. Three different trust boundaries. The browser verifies none of them by default.*

## What happened

On 2026-10-29 between approximately 1:50 PM and 1:56 PM Eastern Time, [Polymarket](https://polymarket.com/) — the US-based prediction-market platform — was the target of a client-side supply-chain attack delivered through a compromised Real User Monitoring (RUM) script. [BleepingComputer's reporting](https://www.bleepingcomputer.com/news/security/polymarket-halts-trading-after-crypto-draining-script-breach-25m-traced/) documents the mechanism; [DebugBear's own post-incident statement](https://www.debugbear.com/) and [Polymarket's incident statement](https://polymarket.com/) corroborate the attack vector.

The compromised asset was a JavaScript file served at `cdn.debugbear[.]com/C7xcKKrjUnXK.js`. [DebugBear](https://www.debugbear.com/) is a performance-monitoring vendor whose Real User Monitoring (RUM) product is embedded in client websites via a `<script>` tag that fetches the RUM JavaScript at page load. Polymarket embedded the DebugBear RUM script on authenticated trading pages. Between 1:50 and 1:56 PM ET, the script served from that URL was replaced with an attacker-authored payload designed to:

- Hijack authenticated Polymarket trading sessions in the browser.
- Programmatically liquidate open prediction-market positions (sell at market).
- Transfer the resulting crypto assets from the user's custody-controlled wallet to an attacker-controlled wallet.

The attacker-controlled wallet, identified by [Hudson Rock Research](https://www.hudsonrock.com/) and corroborated across multiple blockchain-analytics observers, is **0x3F99139F1C5854bb628c2e576Aaf638e99dFfc18**. Approximately $2.5 million in assets moved to the wallet across the six-minute window; approximately $2.19 million remained in the primary wallet at investigation time.

Polymarket's response (as paraphrased by [SecurityWeek](https://www.securityweek.com/polymarket-returns-3-9-million-to-traders-as-debugbear-cites-dns-hijack/) and corroborated by [BleepingComputer](https://www.bleepingcomputer.com/news/security/polymarket-halts-trading-after-crypto-draining-script-breach-25m-traced/)):

> "One of our third party providers was compromised, and we have referred this to relevant law enforcement."
>
> "Anyone who has been impacted will be made whole."

The platform halted trading at approximately 2:05 PM ET and resumed normal operations approximately one hour later. Polymarket subsequently distributed approximately **$3.9 million** to **726 affected wallets** as full reimbursement — more than the drained amount, likely to cover slippage and unrealized loss on the forced-liquidation path.

DebugBear's statement (as reported by SecurityWeek):

> "If you use our RUM product, please remove the embed code from your website."

The DebugBear statement is notable for its clarity about scope (RUM-product-specific, not the broader DebugBear product line) and about remediation (unconditional removal, not a patched-version advice). SecurityWeek's reporting characterizes the vendor-side root cause as a **DNS hijack** against DebugBear's CDN hostname — attacker gained control of the CDN hostname's DNS record for the duration of the attack, redirecting fetches to attacker-controlled origin that served the malicious payload under the same URL.

The DNS-hijack attribution is secondary and awaits DebugBear's full post-mortem. Three plausible root-cause classes are visible in the public record:

1. **DNS record compromise.** Attacker gains control of the DNS entry for `cdn.debugbear.com` and points it at attacker-controlled origin for the attack window.
2. **CDN edge-node compromise.** Attacker gains control of a CDN edge POP and overrides the cached response for the specific URL for the attack window.
3. **Origin compromise.** Attacker gains write access to DebugBear's own build / deploy / origin storage and replaces the file for the attack window.

The three have different patch surfaces, different detection surfaces, and different implications for every customer of the same CDN substrate. The DNS-hijack attribution is the most-reported but least-verified of the three; the forthcoming DebugBear post-mortem will settle the attribution.

Primary source: the BleepingComputer article dated 2026-10-29 with wallet-address and URL-level forensic detail. Secondary corroboration: SecurityWeek, SCWorld, GamblingNews, DEV Community aggregator post, and the [Checkpoint 2nd November Threat Intelligence Report](https://research.checkpoint.com/2026/2nd-november-threat-intelligence-report/).

## The primitive that failed

The incident is sibling to one claim already in the canon:

- **K-C8-SUPPLY-CHAIN-INTEGRITY**, admitted on [2026-10-22 via LiteLLM 1.107.0 PyPI compromise](2026-10-22-litellm-supply-chain-admission.md). The claim is phrased as **bitwise identity between published source and shipped artifact**. The 2026-10-22 reckoning framed the primitive around *package-registry-at-install-time* substrates: the attacker compromised a maintainer account, published a malicious wheel to PyPI, and the compromised wheel was never corresponding-tagged in the upstream git repository. The integrity gap was between the published source (git tag) and the shipped artifact (PyPI wheel). The [2026-10-24 LiteLLM Microsoft TI deep-dive reckoning](2026-10-24-litellm-pth-startup-execution-authority-admission.md) extended K-C8 to the sibling K-C9-STARTUP-EXECUTION-AUTHORITY primitive on the *runtime-authority* axis.

Neither 2026-10-22 nor 2026-10-24 framed K-C8 against the **client-side runtime-artifact-delivery substrate** — the layer where a browser fetches a `<script src>` at page load and executes the response under the embedding site's security context without checking that the response matches a known-good hash.

The Polymarket + DebugBear incident is the K-C8 primitive at that layer. Specifically:

- **The "published source" is DebugBear's intended RUM JavaScript.** The vendor's build pipeline produced a specific artifact.
- **The "shipped artifact" is what Polymarket's users' browsers fetched from `cdn.debugbear[.]com/C7xcKKrjUnXK.js` between 1:50 and 1:56 PM ET.** The CDN-delivered payload during that window.
- **The gap is six minutes.** For six minutes, the browser-fetched artifact was the attacker's payload. Bitwise identity between what DebugBear built and what Polymarket's clients ran was violated for those six minutes.

The structural novelty of the K-C8-at-CDN-delivery substrate is not that compromise is possible. The novelty is that **the CDN-delivery substrate has no offline attestation surface the browser routinely validates.**

[Subresource Integrity](https://www.w3.org/TR/SRI/) (SRI) is the W3C standard for the primitive: a `<script src="..." integrity="sha384-...">` tag causes the browser to compute the SHA-384 (or SHA-256 / SHA-512) of the fetched asset and refuse to execute if the hash does not match. SRI is the browser-level mechanism that would turn the K-C8-at-CDN primitive into a measurable property: if Polymarket's DebugBear embed had been SRI-locked to the hash of DebugBear's intended artifact, the attacker's modified payload would have been rejected by every client browser.

SRI is incompatible with the operational model of most RUM vendors. RUM vendors update their script frequently (sometimes multiple times per day) and expect customer sites to pick up updates without re-deploying. An SRI-locked embed would require the customer site to update its SRI hash every time the vendor shipped a new version — operationally impractical for many sites and requiring tooling the RUM ecosystem has not standardized.

The result is that RUM scripts, performance monitors, analytics tags, feature-flag SDKs, A/B-testing SDKs, chat widgets, and most third-party JavaScript substrates are embedded **without SRI** by widespread industry practice. The practice makes K-C8 at the runtime-artifact-delivery substrate structurally undefended.

Kronos names the sub-primitive explicitly:

**K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY** is the pattern where (a) a target T embeds a third-party artifact at execution time rather than install time, (b) the artifact is delivered through a substrate (CDN, DNS, origin storage) the target does not control, and (c) the target has no mechanism to verify that the delivered artifact matches a known-good state at the moment of delivery.

Three subtests of the sub-primitive are independently measurable:

- **(a) hash-lock verification.** For every runtime-fetched third-party artifact, is the artifact locked to a hash (SRI, equivalent client-side verification, or vendor-attestation that commits the hash)? Pass criterion: every `<script src>` tag that points to a non-first-party domain has an `integrity` attribute whose hash is verified at every page load.
- **(b) delivery-substrate attestation.** For every third-party CDN whose assets the target embeds, has the vendor published attestation that their CDN delivery substrate (DNS, edge nodes, origin storage) has an auditable integrity policy, or has the target reviewed the vendor's security posture against the specific attack classes (DNS hijack, edge-node compromise, origin compromise) that make K-C8.b exploitable? Pass criterion: a documented vendor-security review exists for every runtime third-party embed, re-reviewed on a defined cadence.
- **(c) runtime-script-mutation monitoring.** Does the target monitor for script-content changes at runtime (via Content Security Policy report-only mode, Reporting API, browser-telemetry, or server-side synthetic probes)? Pass criterion: a script-mutation detection path exists that would fire within an attack-window-relevant time (minutes, not hours or days) for every embedded third-party script.

The shape of the sub-primitive:

**For every target T that embeds a third-party artifact at runtime, every delivery substrate the target does not control is a trust boundary. T must either (i) lock the artifact to a hash and reject unmatched deliveries, or (ii) prove the delivery substrate's integrity through vendor-attestation covering DNS, edge nodes, and origin, or (iii) detect delivered-artifact changes at runtime through independent monitoring. Where (i), (ii), and (iii) all fail, T holds the K-C8.b primitive and has not proved it holds the primitive.**

## Who else holds this primitive

Every site that embeds third-party JavaScript via CDN at runtime without SRI. The holder-class is approximately *every production web site*. The RUM / analytics / observability / feature-flag / A/B-testing / chat-widget / live-support substrates specifically expand the holder-class because the vendor-updates-script operational model makes SRI operationally impractical.

Specific holder members by substrate:

- **Real User Monitoring (RUM) vendors** — DebugBear (this incident), Datadog RUM, New Relic Browser, Dynatrace RUM, Sentry Browser, LogRocket, FullStory, Smartlook. Every customer of these products is a K-C8.b holder.
- **Analytics vendors** — Google Analytics (gtag.js), Mixpanel, Amplitude, Heap, Segment, PostHog, Plausible, Fathom. Analytics embeds dominate the holder-class by volume.
- **Feature-flag / experimentation vendors** — LaunchDarkly, Optimizely, Statsig, GrowthBook, Split, VWO. Feature-flag SDKs frequently embed at runtime with high-frequency updates.
- **Live-support / chat vendors** — Intercom, Zendesk Chat, Drift, HubSpot Chat, Crisp, Tawk. Chat widgets execute under the embedding site's origin with full DOM access.
- **Tag managers** — Google Tag Manager, Tealium, Segment Tag Manager. Tag managers are specifically designed to proxy *other* third-party scripts, multiplying the K-C8.b surface.
- **Payment-widget vendors** — Stripe.js, Braintree Drop-in, Checkout.com. Payment widgets are usually SRI-pinnable (financial industry has adopted it); other vendors have not.
- **Olympus-Grid iris + templeathena + turtleshell-web + Agent-IaaS surfaces at olympus-gpt.ai** — **holder.** The iris React bundle and the TurtleShell web surfaces embed third-party scripts for analytics, performance monitoring, and ancillary functions. The specific inventory and the SRI-coverage posture across the inventory has not been audited in-tree.

The Olympus-Grid bullet is the Operator-targeted statement. The iris portal + templeathena + turtleshell-web stack embeds JavaScript assets from CDN substrates the Operator does not control. Specific inventory items observed in the iris and templeathena published bundles (per cursory review of the public portal source) include analytics tags and potentially third-party CDN-delivered React Reactforce bundles. The SRI posture of each embed, and the comprehensive inventory, are **not** evidenced in-tree.

The structural matter is Agent-IaaS: olympus-gpt.ai per [`project_olympus_gpt_ai_vision.md`](../../CLAUDE.md) will host developer-facing agent playgrounds and cluster API documentation. The public developer-portal substrate is a high-value K-C8.b target: a compromise of a widely-embedded Agent-IaaS SDK CDN would propagate into every developer's build pipeline and every developer's downstream users. The Agent-IaaS roadmap substrate has not yet shipped the SDK layer where K-C8.b becomes measurable, but the design decision — SRI-locked SDK CDN vs vendor-updates-script model — is upcoming.

## The reckoning

**Claim admission:** none new. K-C8-SUPPLY-CHAIN-INTEGRITY admitted on 2026-10-22 is confirmed; the 2026-10-29 Polymarket + DebugBear incident is the second cadence instance (first was LiteLLM 1.107.0).

**Sub-claim admission:** none on this reckoning. **K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY named as a sub-primitive candidate.** The admission threshold set in the K-C9 reckoning (one post precedent-sets the technique; a second sibling instance within 30 days admits the sub-primitive) applies here. A second runtime-CDN-delivery-substrate compromise against a different vendor class in the 2026-10-29 → 2026-11-29 window would qualify as the sibling case for formal sub-primitive admission.

Candidate sibling cases to watch for in the recheck window:

- A second compromise against any of the holder-class vendors listed above (RUM, analytics, feature-flag, chat, tag-manager, payment-widget).
- A compromise against a non-vendor substrate (e.g. a CDN-delivered open-source library like React, Vue, jQuery served from a public CDN like unpkg or jsdelivr) where the attack vector is CDN-level mutation rather than registry-level compromise.
- A compromise against DNS infrastructure where the hijack lets attacker-controlled JavaScript be served from a legitimate-looking hostname.

Any of the three would admit K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY as a sub-primitive and author `methodology/oracles/O-SUPPLY-CHAIN.md` sub-oracle entries for the three subtests.

**Oracle admission:** none. The pre-admission state carries the pattern into the signal-log recheck list.

**Scorecard delta — Olympus-Grid iris + templeathena + turtleshell-web:**

- K-C8-SUPPLY-CHAIN-INTEGRITY: L? (unchanged — the primitive was already at L? across the surfaces).
- K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY (candidate): L? across (a) hash-lock verification, (b) delivery-substrate attestation, (c) runtime-script-mutation monitoring. All three subtests at L? because none is in-tree-probed.

**Follow-up — append to K-C8 claim doc.** The 2026-10-29 Polymarket + DebugBear entry is the second K-C8 cadence instance and the first K-C8.b candidate-sub-primitive instance. The claim-doc instance table is updated with the CDN-delivery substrate as a new recorded holder-substrate category.

**Co-touch on K-C1-TENANT-SECRET-ENVELOPE.** Polymarket's users were tenants of Polymarket; their trading-session state was a Polymarket-held tenant resource; the drain mechanism was the attacker leveraging the hijacked session to perform tenant-authorized actions. The K-C1 subtest (c) action-boundary (the surface at which a tenant action is authorized) was crossed from the attacker's position via a trust path (the DebugBear script) that the tenant's own browser was configured to trust. This is K-C1 at the client-side-trust-boundary layer — sibling to the Railway credential-envelope breach but one layer out (session-mediated action vs. secret-mediated access).

## In Response

**Nothing yet** across the three subtests of K-C8.b-RUNTIME-ARTIFACT-DELIVERY-INTEGRITY candidate for Olympus-Grid.

**Subtest (a) — hash-lock verification against Olympus-Grid iris / templeathena / turtleshell-web / Agent-IaaS.** Nothing yet. No in-tree enumeration exists of every third-party `<script src>` embedded across the surfaces. The iris bundle ceremony (per [CLAUDE.md § Iris Portal Bundle Release](../../CLAUDE.md)) ensures bundle-ID consistency across five locations for the Operator's own React bundle, but does not enforce SRI on any third-party embeds. The hash-lock verification posture is implicitly L0; it has never been evidenced.

**Subtest (b) — delivery-substrate attestation.** Nothing yet. No vendor-security review process exists in-tree for the third-party vendors whose scripts the Olympus-Grid surfaces embed. The posture is implicitly L0 across the vendor inventory.

**Subtest (c) — runtime-script-mutation monitoring.** Nothing yet. The surfaces do not emit CSP Reporting API events or run server-side synthetic probes for third-party-script-content drift. The posture is implicitly L0.

**Decision window — next EOS cycle.** Items go to the EOS backlog:

1. **Third-party script inventory.** Enumerate every `<script src>` tag loaded across iris + templeathena + turtleshell-web + Agent-IaaS at build time, grouped by (first-party / third-party) and by vendor class. Deliverable: `iris/docs/K-C8.b-THIRD-PARTY-SCRIPT-INVENTORY.md`. Owner: platform engineering. Target: EOS-22.
2. **SRI-coverage audit + first-pass SRI enablement.** For every third-party embed in the inventory, decide (SRI-enable now, SRI-defer with vendor-attestation review, SRI-not-viable per vendor operating model) and ship SRI for the enabled class. Deliverable: iris frontmatter update + CI check. Owner: platform engineering + Kronos. Target: EOS-22.
3. **Agent-IaaS SDK design decision — SRI-locked CDN vs vendor-updates-script.** The olympus-gpt.ai developer SDK's CDN substrate is upcoming; the design decision on SRI should be made before SDK v1 ships. Deliverable: ADR in `olympus-616/docs/adr/`. Owner: platform engineering + API-first architecture lead. Target: EOS-23.

**Pairs with the K-C3.b-OBSERVABILITY-ARCHITECTED-AWAY In Response.** The forensic-ephemerality primitive from the [2026-10-29 ESX + Fragnesia reckoning](2026-10-29-esx-warp-panda-fragnesia-forensic-ephemerality.md) and the runtime-artifact-delivery primitive here share a structural signature: the attacker arranges for the attack to be invisible to the defender's normal detection cadence. For Polymarket, the attack window was six minutes — well below the defender-side scan cadence of most third-party-script-change-detection products. The K-C8.b subtest (c) runtime-script-mutation monitoring item specifically addresses the Olympus-Grid version of the same ephemerality gap.

The Operator does not currently claim L1 or above on K-C8.b for any surface. The honest state is L? across all three subtests. Running the inventory (subtest a) is the cheapest first slice; the SRI-enablement for the subset that supports it is a two-week deliverable; the vendor-attestation-review (subtest b) is a process-design task; the mutation-monitoring (subtest c) requires either CSP tooling or synthetic-probe infrastructure.

---

**Standards cross-reference:** [OWASP A08:2021 Software and Data Integrity Failures](https://owasp.org/Top10/A08_2021-Software_and_Data_Integrity_Failures/) · [OWASP A05:2021 Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/) · [OWASP A03:2021 Injection](https://owasp.org/Top10/A03_2021-Injection/) · [W3C Subresource Integrity](https://www.w3.org/TR/SRI/) · [W3C Content Security Policy Level 3](https://www.w3.org/TR/CSP3/) · [W3C Reporting API](https://www.w3.org/TR/reporting/) · [CWE-494 Download of Code Without Integrity Check](https://cwe.mitre.org/data/definitions/494.html) · [CWE-829 Inclusion of Functionality from Untrusted Control Sphere](https://cwe.mitre.org/data/definitions/829.html) · [CWE-918 Server-Side Request Forgery (SSRF, adjacent at origin layer)](https://cwe.mitre.org/data/definitions/918.html) · [CWE-345 Insufficient Verification of Data Authenticity](https://cwe.mitre.org/data/definitions/345.html) · [NIST SP 800-53 SI-7 Software, Firmware, and Information Integrity](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) · [NIST SP 800-53 SA-12 Supply Chain Protection](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) · [NIST SP 800-161r1 Cybersecurity Supply Chain Risk Management](https://csrc.nist.gov/pubs/sp/800/161/r1/final) · [NIST SSDF SP 800-218 PO.1 / PS.3 / PW.4](https://csrc.nist.gov/pubs/sp/800/218/final) · [MITRE ATT&CK T1189 Drive-by Compromise](https://attack.mitre.org/techniques/T1189/) · [MITRE ATT&CK T1195.002 Supply Chain Compromise: Compromise Software Supply Chain](https://attack.mitre.org/techniques/T1195/002/) · [MITRE ATT&CK T1557.003 DHCP Spoofing (DNS-hijack adjacent)](https://attack.mitre.org/techniques/T1557/003/) · [MITRE ATT&CK T1584 Compromise Infrastructure](https://attack.mitre.org/techniques/T1584/) · [SOC 2 CC6.8 Prevention of Unauthorized Software](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services) · [SOC 2 CC7.1 System Operations](https://www.aicpa-cima.com/resources/landing/system-and-organization-controls-soc-suite-of-services) · [PCI DSS 4.0 Requirement 6.4.3 Payment-page scripts](https://www.pcisecuritystandards.org/) · [PCI DSS 4.0 Requirement 11.6.1 Change-and-tamper detection](https://www.pcisecuritystandards.org/) · [ISO/IEC 27001:2022 Annex A.5.21 Managing information security in ICT supply chain](https://www.iso.org/standard/27001)
