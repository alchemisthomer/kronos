# O-STARTUP-EXECUTION-AUTHORITY

**Version:** 0.1
**Evaluates:** [K-C9-STARTUP-EXECUTION-AUTHORITY](../claims/K-C9-STARTUP-EXECUTION-AUTHORITY.md)
**Operator profiles required:** environment-auditor, adversarial-package-publisher, startup-execution-observer
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary. All three must pass for L2. The oracle requires the target to name its runtimes (which language interpreters, container runtimes, shells, editors are in-scope) before engagement.

## Subtest (a) — Startup-authority enumeration

**Operator profile:** environment-auditor — read-only access to representative hosts

**Procedure:**

1. **Runtime declaration.** Target names the runtimes in scope. For each: which startup-customization mechanisms are known to exist (per the holder-class list in the claim doc).
2. **Representative-host sampling.** Operator selects a representative set of hosts (CI runners, production ECS tasks, developer workstations if in-scope, container base images). Grant is read-only on each.
3. **Enumeration pass.** On each sampled host, operator enumerates every startup-hook file for every runtime in scope. For Python: every `.pth` across every `site-packages`; `sitecustomize.py` across site + user; `usercustomize.py`; `PYTHONSTARTUP`. For Node.js: `NODE_OPTIONS`; every `scripts.install`/`preinstall`/`postinstall` in the dependency closure; every `node_modules/.hooks/`. For shells: `/etc/profile.d/*`, `.bashrc`, `.zshrc`, `.bash_profile`, `.zprofile`.
4. **Attribution.** For each enumerated hook, operator attempts to attribute it to its installing source — package name + version, operator-authored config file, OS-package provenance.
5. **Pass criterion.** Every enumerated hook has a correct attribution. The hook count is within the target's documented expected range for the host class. No unknown-provenance hooks.

**Evidence produced:**

- `evidence/subtest-a/runtime-scope.md` — runtimes in scope, target-authored
- `evidence/subtest-a/host-sample.md` — hosts audited, grant document
- `evidence/subtest-a/<host-slug>/hooks.md` — per-host enumeration with attribution per hook
- `evidence/subtest-a/summary.md` — pass/fail per host

**Pass:** every host's enumeration matches target's documented expected range; every hook is attributable.

## Subtest (b) — Package-install authority bound

**Operator profile:** adversarial-package-publisher — operator publishes a controlled "malicious" package to a test registry the target consumes from, OR drops a tarball directly into the target's package install path

**Procedure:**

1. **Target-permitted mechanism.** Target states which install mechanisms are in scope (public PyPI, internal mirror, direct wheel install, container-image package operations, etc.).
2. **Adversarial-package construction.** With time-boxed written grant, operator constructs a controlled package that attempts to drop a startup hook at each of the known-vulnerable paths for the runtime: for Python, a `.pth` file in the wheel's data_files; for Node.js, a `postinstall` script that writes to `~/.npmrc` or `node_modules/.hooks/`.
3. **Install.** The adversarial package is installed into a representative environment the target controls, via the mechanism(s) in step 1.
4. **Observation.** Operator records what the installation did — did the `.pth` file land? did the `postinstall` script execute? did any sandbox or policy prevent either? did any observable event fire?
5. **Pass criterion.** The install either refused the hook drop, OR permitted the drop and emitted an observable event the target's monitoring can review within a stated T_observe. "Permitted silently" is a fail.

**Evidence produced:**

- `evidence/subtest-b/install-scope.md` — mechanisms in scope, target-written
- `evidence/subtest-b/grant.md` — adversarial-publisher grant, time-boxed, counter-signed
- `evidence/subtest-b/attempts/<mechanism>.md` — per-mechanism install log + outcome
- `evidence/subtest-b/summary.md` — pass/fail per mechanism

**Pass:** every install mechanism either refuses the hook drop or emits an observable event within T_observe. No silent-permit outcomes.

## Subtest (c) — Startup execution observable

**Operator profile:** startup-execution-observer — read-only access to the target's monitoring infrastructure

**Procedure:**

1. **Hook-execution instrumentation.** Target documents how its monitoring is expected to detect startup-hook execution. For a Python environment: `audit` events via `sys.addaudithook` or OS-level file-read monitoring on `.pth` files; for Node.js: process-tree events; for CI/CD: Actions runner audit logs.
2. **Synthetic hook execution.** Operator triggers a known-benign startup hook on a monitored host (e.g., an operator-authored `.pth` file that logs a specific attribution token).
3. **Detection measurement.** Operator records the time between hook execution and the detection signal appearing in the operator-reviewable monitoring surface. This is T_observe.
4. **Pass criterion.** T_observe is within the target's stated SLA for startup-hook detection. The attribution token appears correctly in the monitoring surface.

**Evidence produced:**

- `evidence/subtest-c/instrumentation.md` — target-documented
- `evidence/subtest-c/trigger.md` — synthetic hook content + invocation
- `evidence/subtest-c/detection.md` — monitoring artifact + T_observe measurement
- `evidence/subtest-c/summary.md` — pass/fail

**Pass:** T_observe ≤ stated SLA; attribution token correctly surfaced.

## Running order

Subtest (a) is lowest-impact and may be run against any target with environment-auditor scope. Subtest (c) requires monitoring access and is medium-impact. Subtest (b) requires adversarial-package publishing and is highest-impact — must be last, with a time-boxed grant.

## Scorecard delta

- All three pass → L2 for this target under oracle v0.1
- Any subtest fails → L0 under oracle v0.1
- Subtest (b) refused by target (no adversarial-package grant) → capped at L1 under oracle v0.1
- L3 requires continuous enumeration + install-time hook grant centralization + SLA'd execution observation

## Known limitations of v0.1

- The oracle enumerates known startup-hook mechanisms per the holder-class list. **Unknown or novel mechanisms (new language-ecosystem features, new container-runtime extensions) are not detected until added to the enumeration.** v0.2 should add a canary mechanism: observe which files the interpreter opens during cold-start on an instrumented host; flag any that are not in the known-hook list.
- The oracle does not test *runtime-emitted* hooks — hooks that are generated by a running package at execution time, intended to persist for subsequent interpreter starts. v0.2 should extend subtest (b) to include this class.
- The oracle depends on the host operating system's file-read audit infrastructure being trustworthy — a target that fails [K-C3](../claims/K-C3-OBSERVABILITY-HONESTY.md) at the OS-audit layer may pass subtest (c) spuriously.
