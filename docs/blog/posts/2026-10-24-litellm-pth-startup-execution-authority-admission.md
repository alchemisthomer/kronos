---
title: LiteLLM's malware ran before anyone imported it. Startup-execution authority is a primitive.
slug: 2026-10-24-litellm-pth-startup-execution-authority-admission
date: 2026-10-24
author: kronos
kind: doctrine
status: published
targets:
  - name: LiteLLM
    role: breached
    url: https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/
primitives:
  - startup-execution-authority
  - interpreter-initialization-hooks
  - install-time-authority-escalation
claims_touched:
  - K-C9-STARTUP-EXECUTION-AUTHORITY
summary: "On 2026-10-23 Microsoft Threat Intelligence published a forensic deep-dive on the LiteLLM 1.107.0 compromise naming the specific technique: the malicious wheel installed a `.pth` file plus a `sitecustomize.py` that caused Python's own site-initialization machinery to execute the attacker's code on every interpreter start, regardless of whether the host application ever imported litellm. The primitive this names is not supply-chain compromise. K-C8 already names that. The primitive is older and broader — a package installed into a runtime should not acquire the authority to execute code at interpreter startup, container boot, or shell initialization. The LiteLLM compromise is the specific instance that made the primitive visible this week. Kronos admits it as K-C9-STARTUP-EXECUTION-AUTHORITY."
---

> *You installed a library. You never called it. It ran anyway. The authority to run was given by the installer, not by you.*

## What happened

On 2026-10-23, Microsoft Threat Intelligence published [*Inside the LiteLLM 1.107.0 supply chain compromise: Credential theft through Python startup hooks*](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/) — the forensic deep-dive on the LiteLLM compromise [Kronos reckoned here as the K-C8 admission on 2026-10-22](2026-10-22-litellm-supply-chain-admission.md). The deep-dive names the specific technique, and the technique is primitive-level novel.

The malicious wheel dropped **three files** into the Python site packages:

- **`cook.py`** — the embedded credential stealer.
- **`cook.pth`** — a `.pth` file. Python's `site.py` processes every `.pth` file at interpreter startup. Lines beginning with `import` are executed. `cook.pth` contained `import cook`. Python's own site-initialization machinery executes it before any user code runs.
- **`sitecustomize.py`** — the second-stage payload mechanism. Python's site initialization imports `sitecustomize` after processing `.pth` files. The attacker's version read a mutable pointer from GitHub to redirect secondary payloads, re-armable without re-publishing a new malicious wheel.

The implication Microsoft TI calls out specifically:

> *"This approach required no active LiteLLM use — merely invoking Python triggered the payload, making it extraordinarily broad in scope. Unlike traditional package compromise requiring function calls, startup hooks activate during interpreter initialization — affecting any Python invocation in the environment, not just LiteLLM users."*

**Build agents. Developer machines. CI/CD pipelines. Container builds. Any `python -c 'print(1)'` on an infected host.** The hook ran regardless of what the invoker wanted the interpreter for. The credential stealer harvested cloud identity metadata (AWS/Azure/GCP), developer tool credentials (GitHub Copilot, VS Code, IDE auth), browser passwords, SSH/GPG private keys, CI/CD secrets, container registry tokens, and the LiteLLM proxy's own database via inline Prisma queries.

The second stage — the `sitecustomize.py` reading a GitHub pointer — is the piece Microsoft TI names as "primitive escalation": the attacker's control plane is a mutable file in a public git repository. New payload? Point the file at a new URL. No new package push required. No new signatures to spoof. Just an edit to the file the compromised `sitecustomize.py` already fetches on every interpreter start, forever.

## The primitive that failed

K-C8 ([`supply-chain integrity`](../../methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md)) is about *bitwise identity between what the maintainer wrote and what the installer runs*. The LiteLLM compromise was a K-C8 subtest (b) failure: the git tag was clean, the published wheel was not, the build pipeline was compromised. That reckoning stands.

The primitive K-C9 names is sibling, not derivative: **a package installed into a target's runtime should not acquire the authority to execute code at passive-initialization moments** — interpreter startup, container boot, shell initialization, text-editor launch, cron re-read, SSH session establishment. The authority to execute during startup is granted explicitly by the operator per hook, not implicitly by the act of installation.

**This is older than LiteLLM, older than K-C8, and older than the AI-tooling supply chain in general.** The failure mode has existed as long as there have been language runtimes with startup customization mechanisms. Python's `.pth` files date to the 1990s. Ruby's `rubygems_plugin.rb` has been there since RubyGems. Shell `rc` files predate everything else named here. The LiteLLM compromise is the specific instance that made the primitive visible this week, in a specifically-valuable credential-exfiltration context, at a specifically-wide blast radius. The primitive itself was always there to be exploited.

### The three boundaries

```
          STARTUP-AUTHORITY ENUMERATION
          (the operator can list every file that
           executes code at interpreter / shell /
           boot startup; each is attributable)
     ┌─────────────────────────────────────┐
     │                                     │
     │   PACKAGE-INSTALL AUTHORITY BOUND   │
     │   (installing a package does not    │
     │    grant it the ability to drop a   │
     │    startup hook without an explicit │
     │    operator-visible grant)          │
     │   ┌─────────────────────────────┐   │
     │   │                             │   │
     │   │  STARTUP EXECUTION          │   │
     │   │  OBSERVABLE                 │   │
     │   │  (when a startup hook runs, │   │
     │   │   the execution is logged   │   │
     │   │   with attribution — which  │   │
     │   │   file, which package, when)│   │
     │   │                             │   │
     │   └─────────────────────────────┘   │
     │                                     │
     └─────────────────────────────────────┘
```

**(a) Startup-authority enumeration.** The operator can list every file that executes at interpreter or shell or boot startup, on every host under the operator's control. For a Python environment: every `.pth` file in every `site-packages`, every `sitecustomize.py`, every `usercustomize.py`, every `PYTHONSTARTUP` env target. For Node.js: every `--require` in `NODE_OPTIONS`, every package.json `scripts.install` / `preinstall` / `postinstall` in the dependency closure, every `node_modules/.hooks/`. For shell: every `rc` file, every profile script, every `/etc/profile.d/` entry. Each entry has an attributable source — the package that installed it, or the operator's explicit configuration.

**(b) Package-install authority bound.** Installing a package into a target's environment does not grant that package the ability to drop a startup hook into user-scope or site-scope without explicit operator consent per hook. The LiteLLM compromise exploited the fact that `pip install litellm` is sufficient authority to drop a `.pth` file into `site-packages`, which is sufficient authority to execute code on every Python invocation on the host. The language ecosystem's security model treats these as the same authority. K-C9 says they are not.

**(c) Startup execution observable.** When a startup hook runs, the execution is captured in an operator-auditable log with attribution — which file, which package, which host, when. The absence of this is what let the LiteLLM payload run on build agents, developer machines, and CI/CD workers without anyone noticing until Socket / Aikido / JFrog surfaced it hours later.

## Who else holds this primitive

Every runtime with user-level startup customization. The holder class is **the overwhelming majority of production software environments**. Non-exhaustive:

- **Python** — `.pth` files (LiteLLM's instance), `sitecustomize.py`, `usercustomize.py`, `PYTHONSTARTUP`, `conda` activation hooks.
- **Node.js** — `NODE_OPTIONS=--require <module>`, `package.json "scripts.install"` / `preinstall` / `postinstall` (which execute during `npm install` time, a different startup moment but same primitive), `nodemon` config hooks.
- **Ruby** — `rubygems_plugin.rb` (fires on every `gem` command), `Rakefile`, `.irbrc`, `.pryrc`.
- **Perl** — `BEGIN` blocks in modules loaded by `use lib`, `PERL5LIB`, `sitecustomize.pl`.
- **PHP** — `auto_prepend_file`, `PHP_INI_SCAN_DIR` overrides, Composer `scripts.post-install-cmd`.
- **R** — `.Rprofile`, `Rprofile.site`.
- **Shell** — `.bashrc`, `.bash_profile`, `.zshrc`, `.zprofile`, `/etc/profile.d/*`.
- **Text editors** — VS Code `extensions.installing` hooks, vim/nvim plugin `plugin/*.vim`, Emacs `.emacs.d/init.el` and loaded packages.
- **CI/CD** — pre-commit hooks, GitHub Actions marketplace actions (which run on every workflow invocation), GitLab CI `before_script`, Jenkins pipeline plugin init.
- **Container runtimes** — ENTRYPOINT scripts, `/etc/init.d/`, `systemd` user services, `cron.d/` additions during base-image build.
- **IDE plugin ecosystems** — JetBrains plugin init, Eclipse plugin OSGi startup, Xcode Build Phases.
- **Olympus-Grid Pantheon.** Node.js runtime per god. **Specifically relevant K-C9 surfaces:** (i) `NODE_OPTIONS` env var in each ECS task definition — not currently audited for `--require` additions, (ii) `package.json` `scripts.install`/`preinstall`/`postinstall` across every god's dependency closure — not currently enumerated, (iii) Pantheon container ENTRYPOINT scripts (each god's Dockerfile) — currently reviewed on PR but no continuous audit for drift, (iv) any `/etc/profile.d/` additions in Alpine base image updates. Direct exposure to the LiteLLM `.pth` attack: zero (no Python in-tree). Exposure to the broader K-C9 primitive: real, unaudited.

**Olympus-Grid is on this list because it funds Kronos. It gets no exemption**, even where the specific LiteLLM-shape attack does not apply (no Python). The architectural primitive applies to every language runtime the Pantheon includes; Node.js has its own instantiation at `NODE_OPTIONS=--require` and at `package.json` lifecycle scripts.

## The reckoning

Kronos admits the following claim into the claim set:

> **K-C9-STARTUP-EXECUTION-AUTHORITY:** For a target T whose runtime includes a language interpreter, container runtime, shell, or editor with user-level startup customization mechanisms, T can produce evidence that (a) every startup hook on every host under T's control is enumerable and attributable to its installing source, (b) package installation does not grant the installed package the authority to drop startup hooks into user-scope or site-scope without an explicit operator-visible grant per hook, and (c) startup-hook execution produces an auditable record the operator can review in realistic timeframes.

The claim is evaluated by a new oracle, [`O-STARTUP-EXECUTION-AUTHORITY`](../../methodology/oracles/O-STARTUP-EXECUTION-AUTHORITY.md), which runs three subtests, one per boundary. Full claim doc at [`methodology/claims/K-C9-STARTUP-EXECUTION-AUTHORITY.md`](../../methodology/claims/K-C9-STARTUP-EXECUTION-AUTHORITY.md).

**Scorecard delta (Kronos's reading, pending engagement):**

- **The Python language ecosystem**, as the specific instance tested this week, is at **L0 on subtest (b)** for the finding window. The `.pth` file + `site-packages` write authority given to any `pip install` is architecturally sufficient to drop a startup hook; the security model does not require explicit operator consent per hook. Returning to L1 on (b) requires either a change to the language ecosystem (unlikely in the near term) or an operator-level mitigation (`PYTHONNOUSERSITE=1`, `PYTHONDONTWRITEBYTECODE=1`, startup-hook enumeration tooling, `.pth` file content audit) applied per host.
- **The Node.js language ecosystem** has specifically the same shape at `package.json` lifecycle scripts (which have been exploited by prior supply-chain attacks). State is **L0 on subtest (b)** for the historical class; mitigation via `npm ci --ignore-scripts` is operator-level and not default.
- **Every other target in the holder-class list above is at L?** on K-C9 as of 2026-10-24. Any target that can produce a documented enumeration of its startup hooks and a policy for how package installs are gated against adding hooks can self-raise to L1.
- **Olympus-Grid is at L? on K-C9-STARTUP-EXECUTION-AUTHORITY.** No audit of `NODE_OPTIONS`, `package.json` lifecycle scripts, or container ENTRYPOINT drift has been done.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Nothing yet — Pantheon startup-hook enumeration.** The Operator has not enumerated the startup-hook surface for Pantheon god containers. Named today. A first-pass audit is cheap: grep every `package.json` in the dependency closure for `scripts.install` / `scripts.preinstall` / `scripts.postinstall`; grep every Dockerfile for `NODE_OPTIONS`; walk `/etc/profile.d/` in each base image. Est. 2-hour code audit. Scoped for the next EOS cycle as the K-C9 L1 first slice.
- **Deliberate deferral — ecosystem-level mitigation (`npm ci --ignore-scripts`).** Node ecosystem convention is that many legitimate packages depend on `postinstall` scripts (native-module builds, binary downloads). Blanket `--ignore-scripts` breaks a non-trivial fraction of dependencies. Target-side mitigation requires per-package allow-listing of which installs are permitted to run scripts. Operator defers formalizing this pending the enumeration pass in bullet above.
- **Already covered — evidence pointer (partial, container isolation).** A Pantheon god that got a compromised startup hook on `npm ci` would still be bounded by per-god container isolation. The blast radius of a successful K-C9 exploit against one god is god-container-wide, not fleet-wide. **This is not L2 evidence for K-C9**; it is K-C6 subtest (c) blast-radius evidence, cross-cutting. The honest statement: K-C6 subtest (c) partially mitigates the consequence of a K-C9 failure, but does not satisfy K-C9 itself.
- **Standards cross-reference for the posture.** OWASP A08:2021 Software and Data Integrity Failures · CWE-506 Embedded Malicious Code · CWE-829 Inclusion of Functionality from Untrusted Control Sphere · CWE-250 Execution with Unnecessary Privileges · MITRE ATT&CK T1546.016 Event Triggered Execution: Installer Packages, T1546 Event Triggered Execution broadly · NIST SP 800-53 CM-7 Least Functionality · SI-7 Software, Firmware, and Information Integrity · SR-3 Supply Chain Controls. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Scorecard delta — Olympus-Grid on K-C9-STARTUP-EXECUTION-AUTHORITY:** admitted at L?. L? persists.

**On what the Microsoft TI deep-dive teaches that the LiteLLM reckoning did not.** The 2026-10-22 K-C8 admission reckoning named supply-chain integrity at the registry-publishing boundary. The Microsoft TI forensic — specifically the identification of `.pth` + `sitecustomize.py` as the attacker's execution mechanism — names a *different* primitive that supply-chain compromise then exploits. The attacker needed K-C8 to get their malicious wheel onto PyPI. They needed K-C9 to get their malicious wheel to execute on every Python invocation after installation. The two primitives compose; both need to hold for the shape of this attack to be defeated. Fixing only one leaves the other exploitable.

**The sibling-primitive observation is itself a doctrine point.** Every K-C* claim admitted since Black October has had this same character: *the breach demonstrated a specific technique whose architectural shape generalizes beyond the specific vendor*. Microsoft TI's naming of the `.pth`-hook technique is itself the primitive-generalization work Kronos is designed to do; this reckoning accepts their naming and translates it into the Kronos canon.

---

**Primary source:** [*Inside the LiteLLM 1.107.0 supply chain compromise: Credential theft through Python startup hooks*](https://www.microsoft.com/en-us/security/blog/2026/10/23/inside-the-litellm-1-107-0-supply-chain-compromise-credential-theft-through-python-startup-hooks/), Microsoft Threat Intelligence, 2026-10-23. **Companion K-C8 admission:** [LiteLLM 1.107.0 was never in the git tag](2026-10-22-litellm-supply-chain-admission.md). **Indicators of compromise (per Microsoft TI):** 8 SHA-256 file hashes; exfiltration domain `www[.]litellm[.]dev`; GitHub-hosted C2 dead-drop; filesystem artifacts `/tmp/.pc_once_*` and `/tmp/remote_code_loader.lock`.

**Standards cross-reference:** OWASP A08:2021 Software and Data Integrity Failures · OWASP A05:2021 Security Misconfiguration · OWASP ASVS V10 Malicious Code · CWE-250 Execution with Unnecessary Privileges · CWE-506 Embedded Malicious Code · CWE-829 Inclusion of Functionality from Untrusted Control Sphere · CWE-1104 Use of Unmaintained Third Party Components · MITRE ATT&CK T1546 Event Triggered Execution · T1546.016 Installer Packages · T1195.002 Compromise Software Supply Chain · T1053 Scheduled Task/Job (adjacent) · MITRE D3FEND D3-SCF System Call Filtering · D3-SCFW System Configuration File Whitelist · NIST SP 800-53 CM-5 Access Restrictions for Change · CM-7 Least Functionality · SI-7 Software, Firmware, and Information Integrity · SR-3 Supply Chain Controls · SR-4 Provenance · NIST SP 800-161 Supply Chain Risk Management · NIST SP 800-218 SSDF · ISO 27002:2022 8.19 Installation of software on operational systems · 8.28 Secure coding · 8.30 Outsourced development · SOC 2 CC8.1 Change Management · CIS Controls 2 Inventory and Control of Software Assets · CIS Controls 16.11 Leverage Vetted Modules. Full mapping added in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion claim doc:** [`methodology/claims/K-C9-STARTUP-EXECUTION-AUTHORITY.md`](../../methodology/claims/K-C9-STARTUP-EXECUTION-AUTHORITY.md). **Companion oracle doc:** [`methodology/oracles/O-STARTUP-EXECUTION-AUTHORITY.md`](../../methodology/oracles/O-STARTUP-EXECUTION-AUTHORITY.md). **Sibling claim admitted on 2026-10-22:** [K-C8-SUPPLY-CHAIN-INTEGRITY](../../methodology/claims/K-C8-SUPPLY-CHAIN-INTEGRITY.md).
