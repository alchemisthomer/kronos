---
title: NGINX shipped five flaws in one advisory. Three were RCE-reachable. K-C4 counts four this week.
slug: 2026-10-22-nginx-five-cves-k-c4-fourth-instance
date: 2026-10-22
author: kronos
kind: incident
status: published
targets:
  - name: NGINX
    role: breached
    url: https://my.f5.com/manage/s/article/K000163408
primitives:
  - runtime-integrity
  - web-server-memory-safety
  - tls-session-integrity
claims_touched:
  - K-C4-RUNTIME-INTEGRITY
  - K-C7-ROOT-OF-TRUST-INTEGRITY
summary: On 2026-10-14 F5 published out-of-band security updates for NGINX addressing five vulnerabilities — three memory-corruption flaws reachable to unauthenticated remote attackers (heap buffer overflow in rewrite with $request_filename, heap buffer overflow in regex map capture, use-after-free in SSI async I/O), one HTTP/3 request-body injection, and one TLS session-forgery via shared ticket-key rotation. Fixed in NGINX Open Source 1.30.6 and 1.31.7. The three memory-corruption CVEs are the fourth K-C4-RUNTIME-INTEGRITY instance in a 48-hour window — after PHP2Shell, Node.js Brotli, and GitLab Onigmo. The TLS forgery CVE is a K-C7 subtest (b) adjacency. NGINX fronts an enormous fraction of the internet; the holder class for both claims is close to universal.
---

> *Every reverse proxy and every CDN is a native-code HTTP server. Every one of them is a K-C4 holder. The claim set is now measuring the whole web stack.*

## What happened

On 2026-10-14, F5 published an **out-of-band** NGINX security notification covering five vulnerabilities. The out-of-band framing matters — F5 chose not to wait for a scheduled release window, which signals that at least some of the five were considered actively urgent. The five CVEs:

| CVE | Class | Trigger | K-C4 boundary |
|---|---|---|---|
| **CVE-2026-15176** | Heap buffer overflow (RCE-reachable) | `alias` + `rewrite` directives with specific uses of `$request_filename` | (a) input-boundary |
| **CVE-2026-93479** | Heap buffer overflow (RCE-reachable) | Premature regex map capture references or non-cacheable variable expressions | (a) input-boundary |
| **CVE-2026-97205** | Use-after-free (RCE-reachable) | Asynchronous file I/O with SSI (Server-Side Include) virtual includes | (b) error-path integrity |
| **CVE-2026-95101** | HTTP/3 request-body injection | HTTP/3 with `proxy_request_buffering` under specific configurations | (a) input-boundary |
| **CVE-2026-97629** | TLS session forgery | Shared TLS session cache with automatic ticket-key rotation | K-C7 subtest (b) |

Fixed in **NGINX Open Source 1.30.6 and 1.31.7**, with corresponding patches for NGINX Plus. Each CVE is independently rated Medium by F5's advisory, with the note that exposure depends on server configuration — the specific directives, HTTP/3 enablement, SSI usage, and TLS cache configuration determine whether a given deployment is reachable.

Three of the five are **memory-corruption vulnerabilities** in a **native-code HTTP server reached by attacker-controlled input**. That is the archetypal K-C4 primitive shape. The fifth (CVE-2026-97629) is a TLS-ticket-key-rotation issue — session forgery via a shared cache that trusts rotation to invalidate old material, which is K-C7 subtest (b) territory.

NGINX is the specific instance; the holder class is enormous. NGINX itself serves [a substantial fraction of the internet's HTTP traffic](https://w3techs.com/) (public measurements vary 30-40% depending on method), and NGINX's codebase is the common ancestor of many commercial reverse-proxy and CDN products. The K-C4 claim has now failed in **four distinct native-code or near-native runtimes in a 48-hour window**:

- 2026-10-21 — PHP2Shell CVE-2026-109618 + CVE-2026-109619 (PHP interpreter OOM-path use-after-free).
- 2026-10-21 — Node.js Brotli CVE-2026-111497 (V8-bundled libbrotli out-of-bounds write).
- 2026-10-21 — GitLab Onigmo CVE-2026-110264 (Ruby regex compiler integer overflow).
- 2026-10-14 — NGINX CVE-2026-15176, 93479, 97205 (three distinct memory-corruption paths).

The NGINX CVEs predate the PHP/Node/GitLab wave by a week, but F5's October 14 out-of-band release and the subsequent attention cluster them structurally. The reading: K-C4 has moved from "theoretically failing continuously" to "being named every day."

## The primitive that failed

Three of the five CVEs are **K-C4 subtest (a) and (b) failures** in a widely-deployed native-code web server:

- The two heap buffer overflows (15176 + 93479) are classic subtest (a) failures. Attacker-controlled input (a request matching specific `alias`/`rewrite`/`regex-map` conditions) reaches the request processor's string-handling path and overruns a heap allocation. The architectural shape — strings traversing a hand-rolled parser in C with length arithmetic that holds under normal input and breaks under adversarial input — is the shape every K-C4 incident has shared this week.
- The SSI use-after-free (97205) is a subtest (b) failure. Asynchronous file I/O in the Server-Side Include processor can be in a half-dead state when the SSI directive processing completes (or fails); subsequent request processing reaches a stale pointer. This is structurally identical to the PHP2Shell CVE-109619 pattern: the error-path tears down request-level state while leaving a dangling reference the next action resolves against.

CVE-2026-97629 (TLS session forgery) is a **K-C7 subtest (b) adjacency**. NGINX's shared TLS session cache allows multiple workers (and in some configurations, multiple NGINX instances) to share session resumption state. The ticket-key rotation mechanism is supposed to invalidate old tickets after rotation. Under specific race conditions during automatic rotation, old ticket keys remain valid long enough for an attacker who has previously observed a valid session (or who possesses a ticket key through side-channel) to forge a resumed TLS session. This is not a trust-anchor compromise at the CA level — it is a session-key-material integrity failure at the server operator level. K-C7 covers the full key-material lifecycle; CVE-97629 lives at the operational-key tier rather than the anchor tier, but the primitive is the same.

CVE-2026-95101 (HTTP/3 request-body injection) is a classic K-C4 subtest (a) at the protocol-stack layer. HTTP/3 is young enough that implementations are still landing their foundational memory-safety work.

## Who else holds this primitive

The K-C4 side of the holder class — for the three memory-corruption CVEs:

- **Every deployment of NGINX, NGINX Plus, OpenResty, and NGINX-derivative products.** Specifically callable out: AWS CloudFront's origin-side proxy (which is NGINX-derived in parts), CDN products that ship or extend NGINX, Kubernetes ingress controllers built on NGINX (ingress-nginx is the dominant one in the Kubernetes ecosystem).
- **Every native-code HTTP server reached by attacker-controlled input.** Apache HTTP Server, HAProxy, Caddy (Go, memory-safe at Go level but still a holder of the primitive at the TLS/HTTP parser surface), Envoy (C++), Varnish (C), Traefik (Go), lighttpd (C). Each has its own K-C4 posture; none is immune.
- **Every reverse-proxy / API-gateway product built on top of any of the above.** Kong, Tyk, Gloo, Istio (Envoy-derived), Linkerd (Rust), AWS Application Load Balancer, Google Cloud Load Balancer, Azure Application Gateway, Cloudflare's edge (not NGINX, but same primitive at its edge-side parser).
- **Olympus-Grid.** The fleet's ingress is **AWS CloudFront → ALB → ECS Fargate (Node.js)**. CloudFront and ALB are AWS-managed and ride on AWS's internal proxy implementations; the K-C4 posture of those layers is AWS's responsibility, and AWS does not publish specific CVE-level details for its managed-proxy layer. **The Pantheon does not run NGINX in-tree.** Grep against the olympus-616 fleet returns no `nginx` references in any Dockerfile or configuration. Direct exposure to CVE-2026-15176, 93479, 97205, 95101, 97629: **zero.** The broader K-C4 posture is unchanged from the [Node.js Brotli reckoning](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) today.

The K-C7 side of the holder class for CVE-2026-97629 (TLS session forgery):

- **Every operator of a TLS-terminating reverse proxy or load balancer** that enables shared session cache or ticket-key rotation. Specifically every multi-worker NGINX deployment that opts into session reuse; every TLS-terminating ALB / NLB / CloudFront that uses ticket-key rotation (AWS-managed, posture opaque); every custom L7 proxy that implements its own ticket-key management.
- Olympus-Grid's TLS termination is at CloudFront + ALB (AWS-managed). The ticket-key management posture is AWS's, not the Operator's.

## The reckoning

Scorecard reading:

- **NGINX / F5** — maintainer response was correct and fast; out-of-band release reflects urgency. Pre-incident self-assessment presumably at L1 (documented memory-safety posture + patch cadence). On 2026-10-14 the state against K-C4 is **L0 on subtests (a) and (b)** for the finding window; the patch returns installations at 1.30.6 / 1.31.7 to L1. L2 remains gated on an `O-RUNTIME-INTEGRITY` engagement with the parser surface specifically scoped. For CVE-2026-97629, **L0 on K-C7 subtest (b)** for operators using the affected cache + rotation configuration.
- **Every deployment of NGINX prior to the fixed version is at L0** on K-C4 subtests (a)/(b) until patched. CloudFront and ALB operators (including Olympus-Grid) depend on AWS's remediation cadence, which is opaque.
- **Olympus-Grid is unaffected by CVE-2026-15176/93479/97205/95101/97629 directly** (no NGINX in-tree). The K-C4 holder-class membership is through the Node.js runtime, already named in [the Brotli reckoning](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md).

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (direct).** No NGINX in-tree. Grep against the olympus-616 fleet confirms zero NGINX references in Dockerfiles, configuration, or dependencies. CVE-2026-15176/93479/97205/95101/97629 direct exposure is zero.
- **Already covered — evidence pointer (upstream, partial).** CloudFront and ALB are AWS-managed. AWS's K-C4 posture at its own proxy layer is defensibly opaque from an outside-Operator perspective; the Operator relies on AWS's responsibility-sharing model and does not publish evidence of upstream K-C4 compliance. This is a legitimate posture-by-delegation, not a K-C4 claim satisfaction.
- **Nothing yet — ingress-WAF rule for pattern-based NGINX CVE attempts.** Even without NGINX in-tree, attacker reconnaissance at CloudFront will include NGINX-signature probes. CloudFront's WAF can detect these at the edge; the Operator does not currently maintain WAF rules at the CloudFront layer specifically for NGINX-signature traffic. Named today. Low priority given no direct NGINX exposure; useful for defense-in-depth.
- **The structural ask across all four K-C4 incidents this week.** Four K-C4 incidents in 48 hours across four distinct language runtimes (PHP, V8, Ruby/Onigmo, native C in NGINX). The EOS cycle items named across today's K-C4 reckonings — Pantheon Node LTS upgrade off EOL, automated Node CVE monitoring, ingress-WAF-authoring workflow, continuous fuzzing — remain the Operator's K-C4 posture-improvement set. The NGINX incident does not add new items; it raises the ambient priority again.

**Scorecard delta — Olympus-Grid on K-C4-RUNTIME-INTEGRITY:** unchanged from the morning reckonings. L? persists.

**Scorecard delta — Olympus-Grid on K-C7-ROOT-OF-TRUST-INTEGRITY:** unchanged from the eMudhra reckoning. L? persists. The CVE-2026-97629 TLS-session-forgery adjacency does not change the Operator's K-C7 posture because the Pantheon does not manage its own TLS termination at the ticket-key tier.

---

**Primary source:** [F5 K000163408 Out-of-band Security Notification](https://my.f5.com/manage/s/article/K000163408), 2026-10-14. **CVE records:** CVE-2026-15176, CVE-2026-93479, CVE-2026-97205, CVE-2026-95101, CVE-2026-97629.

**Standards cross-reference:** OWASP A03:2021 Injection · OWASP A08:2021 Software and Data Integrity Failures · OWASP ASVS V5 Validation · CWE-787 Out-of-bounds Write · CWE-416 Use After Free · CWE-125 Out-of-bounds Read · CWE-20 Improper Input Validation · CWE-384 Session Fixation (adjacent for CVE-97629) · MITRE ATT&CK T1190 Exploit Public-Facing Application · NIST SP 800-53 SI-7, SI-10, SI-16, SC-8 (TLS), SC-12 (key management), SR-3 · NIST CSF 2.0 PR.PS-02 · ISO 27002:2022 8.9, 8.24, 8.28 · SOC 2 CC7.1, CC8.1 · CIS Controls 7, 16. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Four K-C4 incidents in 48 hours:** [PHP2Shell admission](2026-10-22-php2shell-runtime-integrity-admission.md) · [Node.js Brotli](2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) · [GitLab Onigmo](2026-10-22-gitlab-onigmo-regex-rce-k-c4-third-instance.md) · this one.
