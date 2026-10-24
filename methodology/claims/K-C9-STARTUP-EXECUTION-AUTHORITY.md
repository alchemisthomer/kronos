# K-C9-STARTUP-EXECUTION-AUTHORITY

**Admitted:** 2026-10-24 · [LiteLLM's malware ran before anyone imported it](../../docs/blog/posts/2026-10-24-litellm-pth-startup-execution-authority-admission.md)
**Oracle:** [O-STARTUP-EXECUTION-AUTHORITY](../oracles/O-STARTUP-EXECUTION-AUTHORITY.md)
**Holder class:** any target whose runtime includes a language interpreter, container runtime, shell, or editor with user-level startup customization mechanisms

## Statement

> For a target T whose runtime includes a language interpreter, container runtime, shell, or editor with user-level startup customization mechanisms, T can produce evidence that:
>
> **(a) Startup-authority enumeration.** Every file that executes at interpreter / shell / boot / editor startup, on every host under T's control, is enumerable and attributable to its installing source (operator-authored, dependency `scripts.install`, a specific package drop, etc.).
>
> **(b) Package-install authority bound.** Installing a package into T's environment does not grant that package the authority to drop startup hooks into user-scope or site-scope without an explicit operator-visible grant per hook. The ecosystem's security model either refuses the drop or logs it with an attribution the operator can review.
>
> **(c) Startup execution observable.** When a startup hook runs, the execution produces an auditable record — which file, which package, which host, which interpreter invocation — the operator can review in realistic timeframes.

## The primitive

Every language runtime with user-level startup customization — Python `.pth` files, Node.js `NODE_OPTIONS=--require` and `package.json` lifecycle scripts, Ruby `rubygems_plugin.rb`, Perl `BEGIN` blocks, PHP `auto_prepend_file`, R `.Rprofile`, every shell's rc files, every text-editor plugin init — has a well-defined architectural failure mode: *the authority to execute at startup can be acquired by any package that gets installed into the right directory*. The LiteLLM `.pth` + `sitecustomize.py` compromise (admitted via [K-C8](K-C8-SUPPLY-CHAIN-INTEGRITY.md) 2026-10-22, deep-dive published by [Microsoft TI 2026-10-23](../../docs/blog/posts/2026-10-24-litellm-pth-startup-execution-authority-admission.md)) is the specifically-visible instance; the primitive is as old as the mechanisms themselves.

The sibling-primitive relationship with K-C8:

- **K-C8 Supply-chain integrity** asks: *is the artifact I installed what the maintainer wrote?* Protects against publication-time compromise, release-pipeline injection, registry substitution.
- **K-C9 Startup-execution authority** asks: *when the artifact runs — including when the interpreter starts without anyone invoking it — is the execution confined to the entry points the installer thought they were authorizing?* Protects against startup-hook abuse regardless of whether the artifact itself is faithful to source.

Both claims can fail together (LiteLLM 2026-10-21). Either can fail alone. The LiteLLM compromise demonstrated the composition: the attacker needed K-C8 to get their malicious wheel onto PyPI, then needed K-C9's weakness to turn that wheel into on-every-interpreter-start execution. Fixing only one would have left the other exploitable.

### The three boundaries

```
          STARTUP-AUTHORITY ENUMERATION
          (every startup hook is enumerable + attributable)
     ┌─────────────────────────────────────┐
     │                                     │
     │   PACKAGE-INSTALL AUTHORITY BOUND   │
     │   (install does not implicitly      │
     │    grant startup-hook authority)    │
     │   ┌─────────────────────────────┐   │
     │   │                             │   │
     │   │  STARTUP EXECUTION          │   │
     │   │  OBSERVABLE                 │   │
     │   │  (hook execution is logged  │   │
     │   │   with attribution)         │   │
     │   │                             │   │
     │   └─────────────────────────────┘   │
     │                                     │
     └─────────────────────────────────────┘
```

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence. Default. Also mandatory for any target whose startup-execution-authority envelope was publicly demonstrated to fail (e.g., the entire Python ecosystem on subtest (b) as of 2026-10-21, by the shape of the LiteLLM `.pth` compromise). |
| **L1** | Documented posture: (i) which language runtimes / containers / shells / editors are in T's environment, (ii) which startup-customization mechanisms each exposes, (iii) current enumeration of hooks on representative hosts, (iv) operator policy on which installs are allowed to drop hooks and which are refused. No active oracle evaluation. |
| **L2** | Passes `O-STARTUP-EXECUTION-AUTHORITY` subtests (a), (b), (c) in a time-boxed engagement. Includes an adversarial-install challenge (a controlled "malicious" package attempts to drop a startup hook; subtest-(b) measures whether the drop is permitted and whether the drop is observable). |
| **L3** | Maintains L2 continuously. Startup-hook enumeration is re-run on a stated cadence (per CI build, per container deploy, per weekly audit). Install-time hook grants are centralized and auditable. Hook execution produces an SLA'd observable signal. |

## Holder class

**Every target with a language runtime, container runtime, shell, or editor that supports user-level startup customization.** Non-exhaustive, with instance mechanisms:

- **Python** — `.pth` files (the LiteLLM instance), `sitecustomize.py`, `usercustomize.py`, `PYTHONSTARTUP`, `conda` activation hooks, Jupyter kernel init.
- **Node.js** — `NODE_OPTIONS=--require <module>`, `package.json` `scripts.install` / `preinstall` / `postinstall` / `prepare`, `node_modules/.hooks/`.
- **Ruby** — `rubygems_plugin.rb` (every `gem` command), `Rakefile`, `.irbrc`, `.pryrc`, Bundler plugin init.
- **Perl** — `BEGIN` blocks in auto-loaded modules, `sitecustomize.pl`, `PERL5OPT`.
- **PHP** — `auto_prepend_file`, `PHP_INI_SCAN_DIR` overrides, Composer `scripts.post-install-cmd`.
- **R** — `.Rprofile`, `Rprofile.site`, `.Renviron`.
- **Shells** — `.bashrc`, `.bash_profile`, `.zshrc`, `.zprofile`, `/etc/profile.d/*`, `/etc/bash.bashrc`.
- **Text editors / IDEs** — VS Code extension `activationEvents`, vim/nvim `plugin/*.vim`, Emacs `init.el`, JetBrains plugin init, Eclipse OSGi.
- **CI/CD** — pre-commit hooks, GitHub Actions `uses:` steps (every workflow invocation), GitLab CI `before_script`, Jenkins plugin init.
- **Container runtimes** — Dockerfile `ENTRYPOINT`, `CMD`, `/etc/init.d/`, `systemd` user services, `cron.d/` additions, `/etc/profile.d/` in base images.
- **IDE plugin ecosystems** — any editor whose plugin install mechanism permits init-time code execution.
- **Olympus-Grid Pantheon.** Node.js runtime per god. Specific K-C9 surfaces: `NODE_OPTIONS` in each ECS task definition; `package.json` lifecycle scripts across every god's dependency closure (`npm ci` executes `postinstall` by default); Pantheon container ENTRYPOINT scripts per Dockerfile; `/etc/profile.d/` additions in Alpine base. Audit not yet performed. **Olympus-Grid is on this list because it funds Kronos. It gets no exemption.**

## Related claims

- [K-C8-SUPPLY-CHAIN-INTEGRITY](K-C8-SUPPLY-CHAIN-INTEGRITY.md) — admitted 2026-10-22. Sibling, not derivative. K-C8 protects the identity between source and installed artifact. K-C9 protects what the installed artifact is permitted to execute at passive-initialization moments. Both failed together in LiteLLM; both need to hold for the attack shape to be defeated.
- [K-C4-RUNTIME-INTEGRITY](K-C4-RUNTIME-INTEGRITY.md) — adjacent. K-C4 protects runtime behavior under attacker-controlled input (decoders, parsers, VMs). K-C9 protects runtime behavior under attacker-authored startup hooks that the runtime executes by design. The two failure classes do not overlap, but target the same operational surface.
- [K-C6-ATTACKER-CADENCE-RESILIENCE](K-C6-ATTACKER-CADENCE-RESILIENCE.md) — K-C9's observability boundary (c) is a direct K-C6 subtest-a feed: the time between startup-hook execution and operator notice is the K-C6 T_detect for this attack class.

## Posts that touch this claim

- [LiteLLM's malware ran before anyone imported it](../../docs/blog/posts/2026-10-24-litellm-pth-startup-execution-authority-admission.md) — admission post
