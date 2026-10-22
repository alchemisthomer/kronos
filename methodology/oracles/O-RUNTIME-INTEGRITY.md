# O-RUNTIME-INTEGRITY

**Version:** 0.1
**Evaluates:** [K-C4-RUNTIME-INTEGRITY](../claims/K-C4-RUNTIME-INTEGRITY.md)
**Operator profiles required:** external-anon, external-tenant, internal-ro-infra, controlled-rce
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary of the runtime-integrity envelope (input-boundary robustness, error-path integrity, request-isolation). All three must pass for the target to reach L2 on K-C4. Any one failing drops the target to L0 for the duration of the finding window.

The oracle requires that the target name its attacker-reachable input boundaries before engagement. If the target cannot or will not enumerate those boundaries, the engagement cannot proceed and the target is capped at L0 by default.

## Subtest (a) — Input-boundary robustness

**Operator profile:** external-anon + external-tenant (both; both must pass)

**Procedure:**

1. **Boundary enumeration.** With target cooperation, enumerate every attacker-reachable input boundary in the runtime. Minimum categories to cover: HTTP header parsing, HTTP body parsing per content type (JSON, form-encoded, multipart, binary), WebSocket upgrade and frame parsing, any file-upload decoding path, any document/media parser invoked on uploaded content, protocol-handshake parsers (TLS, WebSocket, custom), any deserializer invoked on tenant-supplied data. Written down in `evidence/subtest-a/boundaries.md`.
2. **Fuzz corpus construction.** For each named boundary, construct or import a time-boxed fuzz corpus. Minimum budget: 2 CPU-hours per boundary, with coverage-guided feedback where the runtime supports it (AFL, libFuzzer, HonggFuzz, or language-ecosystem equivalent).
3. **Execution.** Run the corpus against each boundary. Record every observed crash, hang (>30s), memory leak (>50MB growth over 10k iterations), and sanitizer violation (ASan, UBSan, MSan where applicable).
4. **Triage.** Each observation is classified: *benign* (expected error-handling behavior), *liveness-only* (crash with no attacker-controlled continuation), *integrity* (memory corruption, RCE-reachable, data leak via undefined behavior).

**Evidence produced:**

- `evidence/subtest-a/boundaries.md` — enumerated boundaries, counter-signed by target
- `evidence/subtest-a/corpus-manifest.md` — fuzzing framework, corpus origin, time budget per boundary
- `evidence/subtest-a/findings/<boundary-slug>.md` — one file per boundary, with observations and triage
- `evidence/subtest-a/summary.md` — pass/fail per boundary

**Pass:** zero integrity-class observations across all named boundaries. Benign and liveness-only observations are logged but do not fail the subtest.

## Subtest (b) — Error-path integrity

**Operator profile:** external-tenant + internal-ro-infra

**Procedure:**

1. **Error-class enumeration.** Target names every error class the runtime handles distinctly: OOM (allocation failure), panic / unrecoverable error, assertion failure, timeout / request-deadline exceeded, abort (OS-level signal), and any language-specific fatal-error class (PHP's `E_ERROR`, Node's `uncaughtException`, Python's `MemoryError`, etc.). Written in `evidence/subtest-b/error-classes.md`.
2. **Invariant mapping.** For each error class, target documents what request-level and process-level invariants are expected to hold after the error aborts request handling. Example invariants: "no attacker-controlled bytes remain reachable from executor-global state", "no file descriptors from the aborted request leak into the next", "any heap allocations made during request processing are either freed or unreachable". Written in `evidence/subtest-b/invariants-by-class.md`.
3. **Deliberate induction.** For each error class, the operator (as `external-tenant`) crafts a request that forces the error class. OOM: induce via a request whose processing allocates past the limit. Panic: induce via a request that triggers a documented panic path. Timeout: induce via a request that forces slow processing to exceed the deadline. The induction request's content is logged.
4. **Post-mortem probe.** Immediately after the error-induced request, the operator sends a *probe request* designed to observe whether any invariant from step 2 has been violated. The probe is specific to the invariant — e.g. to probe the "no attacker-controlled bytes reachable from executor-global state" invariant for a PHP target, the probe is a request that reads from a path known to touch executor-global state and compares the response to the baseline.
5. **Classification.** Each probe response is classified: *invariant held* (probe matches baseline), *invariant broken* (probe reveals residue from the error-induced request or a crash), *inconclusive* (probe cannot distinguish; subtest needs refinement).

**Evidence produced:**

- `evidence/subtest-b/error-classes.md` + `invariants-by-class.md` — target-authored, pre-engagement
- `evidence/subtest-b/<error-class>/induction.md` — the induction request and its target response
- `evidence/subtest-b/<error-class>/probe.md` — the probe request, baseline, and observed response
- `evidence/subtest-b/<error-class>/classification.md` — the classification, with reasoning
- `evidence/subtest-b/summary.md` — pass/fail per error class

**Pass:** every error class × every invariant yields *invariant held*. Any *invariant broken* fails the subtest. *Inconclusive* fails until the subtest is refined to resolve.

## Subtest (c) — Request-isolation

**Operator profile:** controlled-rce (requires explicit written grant from target)

**Procedure:**

1. **Isolation-model declaration.** Target declares what the isolation boundary between requests is: single-process worker (shared heap), process-per-worker (shared OS), container-per-worker (shared kernel), VM-per-worker (shared hypervisor), hardware-per-worker (shared facility). The declaration specifies what properties cross each boundary (e.g., in a container-per-worker setup, kernel memory does not cross; filesystem state may; network state may).
2. **Controlled-RCE deployment.** With target grant, the operator deploys an instrumented endpoint that executes operator-supplied code at the lowest trust layer of the isolation model (e.g., in-process-worker, in-container, in-VM, as applicable). The deployment is time-boxed. The grant document records the trust envelope.
3. **Observation probes.** From the controlled-RCE position, the operator attempts to observe or modify state belonging to a *different* request. Specifically: (i) try to read heap memory from another request's processing, (ii) try to read filesystem artifacts the other request wrote, (iii) try to read network connections the other request is holding, (iv) try to modify shared global state in a way that would corrupt the other request's processing.
4. **Pass criterion.** Each probe either returns an access-denial (OS, hypervisor, or language-level) or returns data that the isolation model's declaration said does not cross the boundary. Any probe that successfully reaches another request's data across a boundary the target declared isolated fails the subtest.

**Evidence produced:**

- `evidence/subtest-c/isolation-model.md` — target-authored, pre-engagement
- `evidence/subtest-c/rce-grant.md` — time-boxed, counter-signed
- `evidence/subtest-c/probes/<probe-id>.md` — one file per probe, with code, invocation, result
- `evidence/subtest-c/summary.md` — pass/fail per isolation boundary

**Pass:** no probe reaches another request's data across a boundary the target's isolation model declared isolated. A target that declares a very permissive isolation model (e.g., single-process shared-heap worker pool) is accepting a specific failure surface; that is a legitimate posture but must be recorded.

## Running order

Subtest (a) is lowest-impact and may be run against any target under an engagement with external endpoints in scope. Subtest (b) requires target cooperation to induce error classes and should be run second. Subtest (c) requires controlled-RCE deployment and is highest impact — must be run last, with a time-boxed grant document.

## Scorecard delta

- All three subtests pass → claim scored L2 for this target under oracle version 0.1
- Any subtest fails → claim scored L0 for this target under oracle version 0.1
- Subtest (c) refused by target (target declines to grant controlled-RCE) → claim capped at L1 for this target under oracle version 0.1
- L3 requires passing all three subtests on a stated cadence, with a documented `T_patch` statistic and continuous fuzzing against named boundaries; outside the scope of a single engagement

## Known limitations of v0.1

- The oracle does not test *side-channel* integrity failures — cache timing, speculative execution (Spectre-class), electromagnetic emanation. v0.2 should extend subtest (c) to cover micro-architectural side channels for high-sensitivity targets.
- The oracle does not test *supply-chain* integrity failures — the runtime itself being backdoored at build time or in a dependency. v0.2 should add a supply-chain subtest, likely in coordination with K-C4's eventual relationship to a supply-chain-integrity claim (not yet admitted).
- The oracle's fuzz corpus budget (2 CPU-hours per boundary) is low. L3 continuous fuzzing bypasses this limit by running indefinitely; L2 engagements accept it as a time-boxing constraint.
- The oracle cannot distinguish between a boundary that genuinely has no integrity failures and a boundary where the fuzz corpus simply did not find them. L2 is a measurement against the specific corpus; it is not a proof of absence.

These limitations are logged here, not fixed, so a target team reading this oracle before engagement knows what the subtests do and do not cover.
