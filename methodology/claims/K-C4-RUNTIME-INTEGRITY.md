# K-C4-RUNTIME-INTEGRITY

**Admitted:** 2026-10-22 · [PHP's runtime held, until frontier AI fuzzed its error paths](../../docs/blog/posts/2026-10-22-php2shell-runtime-integrity-admission.md)
**Oracle:** [O-RUNTIME-INTEGRITY](../oracles/O-RUNTIME-INTEGRITY.md)
**Holder class:** any target whose runtime processes attacker-reachable input through an interpreter, VM, parser, deserializer, protocol stack, or JIT compiler

## Statement

> For a target T whose runtime processes attacker-reachable input, T can produce, under adversarial challenge, evidence that:
>
> **(a) Input-boundary robustness.** The runtime does not corrupt its own state when fed structurally malformed input at any attacker-reachable boundary — HTTP header parsing, structured-payload deserialization, document/media decoding, protocol-handshake processing. A time-boxed fuzz corpus against each named boundary produces zero memory-corruption crashes, zero RCE-reachable code paths, zero data leaks via undefined behavior.
>
> **(b) Error-path integrity.** The runtime's error-handling paths — OOM, panic, assertion failure, timeout, abort — do not leave invariants in a half-dead state that a subsequent request can exploit. When an error aborts request handling, no process-level or request-level invariant is left published in memory that attacker-controlled code could reach next.
>
> **(c) Request-isolation.** Memory used by one request is architecturally unreachable to another. A use-after-free, uninitialized-read, or shared-mutable-state primitive that lets request B observe or corrupt request A's data constitutes a failure of this boundary.

## The primitive

Every system that lets attacker-controlled bytes reach a runtime executing code holds this primitive. The runtime's contract is: *whatever bytes you give me, I remain myself.* The contract has three ways to break:

1. The happy path mishandles a specific malformed input and corrupts memory. Classic buffer-overflow territory — most mature runtimes have shrunk this surface significantly over the last two decades, but it is not zero.
2. The error path (OOM, panic, timeout) leaves global or executor state published while tearing down the request's heap. The next request reaches memory the previous one thought it still owned. This is where [PHP2Shell CVE-2026-109618 and CVE-2026-109619](../../docs/blog/posts/2026-10-22-php2shell-runtime-integrity-admission.md) live, and it is where the long tail of memory-safety CVEs across every C-ancestor language runtime continues to live.
3. The isolation boundary between requests leaks — same-process worker pools that share global state, native-code libraries that cache per-request data in process-global structures, JIT caches that persist speculated code between requests.

The envelope is intact when all three hold. The envelope has collapsed when any one leaks, because at that moment attacker input has reached the runtime's memory manager and the runtime's "stay well-defined" contract has ended.

```
                  INPUT-BOUNDARY ROBUSTNESS
                  (the happy path is defined on malformed input)
             ┌─────────────────────────────────┐
             │                                 │
             │       ERROR-PATH INTEGRITY      │
             │   (unhappy paths don't leave    │
             │    invariants half-dead)        │
             │   ┌─────────────────────────┐   │
             │   │                         │   │
             │   │   REQUEST ISOLATION     │   │
             │   │   (one request's        │   │
             │   │    memory is            │   │
             │   │    unreachable to       │   │
             │   │    another)             │   │
             │   │                         │   │
             │   └─────────────────────────┘   │
             │                                 │
             └─────────────────────────────────┘
```

The primitive is architectural, not language-specific. A Rust service that calls a C library at an FFI boundary holds the primitive at the FFI boundary. A memory-safe language that embeds a VM holds the primitive at the VM boundary. Writing in a memory-safe language is a strong *mitigation* of boundary (c), weaker on (b), and does nothing for (a) when the input validator itself is where the bug lives. K-C4 is agnostic to language. It is about what happens when attacker bytes reach the runtime.

## The economics change in 2026

PHP's CVE-2026-109619 required reasoning across the interpreter source, the OOM allocation path, the executor-global state table, and the fatal-error backtrace retention — a chain that human researchers had demonstrably not completed in the fifteen years PHP has shipped the vulnerable code. Frontier LLMs, under supervised research direction, completed it.

This changes the attack economics for every target in the holder class. The implicit assumption underlying many systems' K-C4 posture — *"nobody will spend the time to find this specific chain of bugs in us"* — no longer holds the way it did in 2024. The right response is not to oppose the research (the research is how the primitive gets named) but to raise the scoring floor: targets that previously could sit at implicit L1 by virtue of attacker scarcity now need to produce L2 evidence or accept an honest L0 posture.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence can be produced today. Default for any target that has not been engaged. Also the mandatory level for any target whose runtime-integrity envelope was publicly demonstrated to have failed (e.g., PHP on K-C4 subtest (b) as of 2026-10-21), until a new round of post-incident evidence has been assembled. |
| **L1** | Target can produce documentation that names (i) the attacker-reachable input boundaries in its runtime, (ii) the language/VM/runtime choices and their memory-safety posture, (iii) the isolation mechanism (process, container, sandbox) between requests, (iv) the CVE monitoring and patch-cadence for all third-party runtime components, (v) a stated `T_patch` — maximum time budget from upstream CVE publication to target-side patch rollout. No active oracle evaluation. |
| **L2** | Target has passed `O-RUNTIME-INTEGRITY` subtests (a), (b), (c) in a time-boxed engagement with Kronos. Evidence includes a fuzz corpus pass per named boundary, an error-path invariant audit, and a request-isolation demonstration (controlled RCE in one isolation unit does not reach another). Captured in the engagement's `05_evidence/` folder. |
| **L3** | Target maintains L2 continuously: a fuzzing pipeline runs against each named boundary on a stated cadence, CVE monitoring is automated with a demonstrated `T_patch` statistic over the last N releases, isolation posture is re-tested when the deployment architecture changes, and regressions are detected and remediated within the stated time window. |

## Holder class

Non-exhaustive list of system classes that hold this primitive:

- **Every language runtime deployed to the public internet:** PHP (confirmed breached 2026-10-21). Node.js / V8. Python (CPython + PyPy). Ruby / YJIT. Java / HotSpot. .NET / CLR. Go. Rust (memory-safe but with `unsafe` escape hatches and FFI boundaries). Bun / JavaScriptCore. Deno. Lua (OpenResty, Redis). Erlang / BEAM. Elixir.
- **Native-code web servers reached by attacker input:** Nginx, Apache HTTP Server, HAProxy, Envoy, Caddy. Memory-safety CVEs rarer than in interpreters, but they land.
- **Protocol stack implementations:** HTTP/2 and HTTP/3 server libraries, TLS libraries (OpenSSL, BoringSSL, LibreSSL, s2n), QUIC implementations (quiche, msquic, lsquic), WebSocket parsers.
- **Document and media parsers at attacker-reachable boundaries:** PDF (libpoppler, PDFium), image codecs (libpng, libjpeg-turbo, libwebp, libtiff), XML parsers (libxml2, Expat), Office document parsers, EXIF decoders, SVG renderers.
- **Deserializers across language ecosystems:** PHP `unserialize` (confirmed breached today). Python `pickle`. Java native deserialization. .NET `BinaryFormatter`. Ruby `Marshal`. YAML parsers that permit object instantiation. Historical gold mine for RCE.
- **JIT compilers:** JavaScript engines (V8, JavaScriptCore, SpiderMonkey). JVM HotSpot. .NET CLR. All ship memory-safety CVEs on a regular cadence.
- **Serverless / FaaS runtimes:** AWS Lambda, GCP Cloud Functions, Cloudflare Workers, Vercel edge runtime, Deno Deploy. Each rides on one of the above and inherits its boundaries.
- **Olympus-Grid.** The Pantheon container runs Node.js (V8) in each ECS task. Every god — Ares, Hermes, Athena, Poseidon, Plutus, Chronos, and the long tail — exposes HTTP endpoints to attacker-reachable paths. V8 memory-safety CVEs ship regularly. Specific attack boundaries that would need K-C4 coverage: Ares HTTP header + JSON body parsing, Hermes forwarder deserialization, Athena streaming-chunk assembly from LLM providers, Poseidon MCP tool-call payload parsing, any image or file upload handler, Node.js WebSocket upgrade. Container isolation bounds the blast radius; it does not satisfy K-C4 by itself. **Olympus-Grid is on this list because it funds Kronos. It gets no exemption.**

## Related claims

- [K-C1-TENANT-SECRET-ENVELOPE](K-C1-TENANT-SECRET-ENVELOPE.md) — admitted 2026-10-21. An RCE at the K-C4 layer gives an attacker credentials to attack the K-C1 envelope from inside. A target failing K-C4 cannot sustain L2 on K-C1 against any attacker who exploits the K-C4 failure first.
- [K-C2-PLATFORM-CONTINUITY](K-C2-PLATFORM-CONTINUITY.md) — admitted 2026-10-21. An unauthenticated-RCE class vulnerability (CVSS 9.2) is a reasonable trigger for a K-C2 shutdown-decision event; targets should have pre-published criteria for how severe a runtime-integrity failure must be before continuity is on the table.
- [K-C3-OBSERVABILITY-HONESTY](K-C3-OBSERVABILITY-HONESTY.md) — admitted 2026-10-21. The AI-assisted-discovery angle of PHP2Shell is K-C3-adjacent in a positive way — supervised AI research directed at vulnerability discovery is the inverse of unsupervised AI agents weakening their own monitoring. Both demonstrate that autonomy is a property of the deployment, not the model.

## Posts that touch this claim

- [PHP's runtime held, until frontier AI fuzzed its error paths](../../docs/blog/posts/2026-10-22-php2shell-runtime-integrity-admission.md) — admission post
- [Node.js's Brotli decoder writes past its buffer. K-C4 is tested the day it was admitted.](../../docs/blog/posts/2026-10-22-nodejs-brotli-rce-k-c4-first-incident.md) — first live incident, same-day; introduces *ingress-WAF mitigation cadence* as a sub-primitive worth naming (modeled by Vercel's same-day WAF rule rollout for CVE-2026-111497)
- [GitLab's regex compiler overflowed. The runtime-integrity primitive failed three times in 24 hours.](../../docs/blog/posts/2026-10-22-gitlab-onigmo-regex-rce-k-c4-third-instance.md) — third instance, Ruby Onigmo integer-overflow path, 12-year code-path exposure
- [NGINX shipped five flaws in one advisory. Three were RCE-reachable. K-C4 counts four this week.](../../docs/blog/posts/2026-10-22-nginx-five-cves-k-c4-fourth-instance.md) — fourth instance, native-code web server; CVE-2026-97629 TLS session forgery sub-registers as K-C7 adjacency

## Cadence confirmation (not reckoned as a post, logged for the record)

- **Plex2Shell** (CVE-2026-96652, 96654, 96655, 96656) — fifth K-C4 instance of the week. Plex Media Server exploit chain reached in-the-wild XMRig cryptominer deployment within 24 hours of public PoC release on 2026-10-16. See [`operations/signal-log.md`](../../operations/signal-log.md) for the full signal entry. The K-C4 primitive and the K-C6 attacker-cadence primitive are both already reckoned on this blog; Plex2Shell is reinforcement of both, not a new primitive. The specific pattern worth watching for a potential future K-C9 admission: **public PoC release has replaced coordinated disclosure as the de-facto notification mechanism for a growing class of CVEs**, meaning the defender's time budget starts at the researcher's publish time (or earlier for an attacker reading pre-publish research channels), not at the vendor's advisory time. Chainguard's unilateral 6-hour-early PHP2Shell patched-image release is the same pattern seen from the defender side; Plex2Shell is the attacker-side version.
