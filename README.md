# Kronos

**Universal Adversarial Assurance Platform**

> *Model the system. Challenge the assumptions. Preserve the evidence.*

**Status:** pre-alpha. Design in progress. No code yet.

---

<p align="center">
  <img src="docs/inception/images/day-of-binding.jpg" width="450" alt="AWS Budget alert screenshot: 3:09 AM on 2026-07-17. AWS Budgets notification stating the account has a budget exceeding your alert threshold, with actual month cost shown as $131,831,457,005.91. Account identifiers redacted with solid black bars."/>
</p>

<p align="center"><em>2026-07-17, 3:09 AM.<br/>The moment Kronos was named.</em></p>

The full story of why this bill was never real, why an empty AWS account cannot generate 120 petabytes of NAT-gateway traffic per day, and why that impossibility is the load-bearing insight of Kronos: [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md).

## What Kronos Is

Kronos is an assurance platform for operators who need to prove — with evidence, not vibes — that the systems they built or bought are safe, solvent, recoverable, and legible enough to shut down when they need to.

It is not only a security tool. It treats **security, cost, availability, integrity, data-loss, compliance drift, and operator-error blast radius** as peer classes of vulnerability. Any of them can end a company; all of them deserve deterministic, reproducible verdicts.

Kronos is technology- and platform-agnostic. It models the target system as a graph, derives what must remain true, executes bounded and authorized scenarios, collects evidence outside the target trust domain, and produces findings — including findings the operator can act on without a computer science degree.

## Why Kronos Exists

Everyone is building apps now. The pool of people shipping production systems has expanded far past the pool of people who can reason about what could go wrong. A senior architect can be broadsided on launch day by a cloud-provider billing pipeline defect; a first-time app-builder shipping a generative platform they don't fully understand is exposed to a class of risk they cannot even name.

Kronos exists to make the answer to "can you prove your system is safe?" a reproducible artifact instead of a hopeful assertion.

The full origin story lives in [`docs/inception/00-founding-incident.md`](docs/inception/00-founding-incident.md).

## What Kronos Is Not

- Not a replacement for specialized tools. Kronos integrates with scanners, fuzzers, proxies, and chaos frameworks; it makes them accountable to an authorization envelope and a deterministic verdict.
- Not autonomous. Every active test is bound to a signed authorization artifact naming target, scope, safety level, time window, rate ceiling, and stop mechanism.
- Not an Olympus-Grid module. Olympus-Grid is the flagship reference implementation and first major target, but Kronos remains operable when Olympus-Grid is unavailable, compromised, or entirely absent.
- Not the final oracle. AI may propose threats, generate scenarios, or explain evidence; deterministic assertions decide pass or fail.

## Ethics Gate

Kronos operates only under authorized security assessment.

- The Steward-owned Olympus-616 / Olympus-Grid universe is authorized by construction.
- Every other target requires a written authorization artifact — scope, timeframe, contact, rules of engagement, signature — before a single request fires against it.
- Kronos will refuse and stop on any request tending toward mass targeting, unauthorized third-party recon, supply-chain compromise, detection evasion whose only rational purpose is malicious use, or capability development that has no defensive, CTF, or authorized-pentest framing.

## Repository Shape

The design is committed as documents before the code exists:

```
kronos/
├── README.md                              (this file)
├── LICENSE                                (GNU AGPL v3)
└── docs/
    ├── adr/
    │   └── ADR-0001-three-layer-identity.md
    └── inception/
        ├── 00-founding-incident.md
        └── founding-incident-archive/     (sanitized narrative documents)
```

Framework, tools, and engagement directories will be created as real work justifies them. See ADR-0001 for the identity boundary.

## License

Kronos is licensed under the [GNU Affero General Public License v3](LICENSE). Modifications used to provide a hosted service must be published to that service's users.

## Name

The spelling is intentional. Κρόνος (Kronos, the Titan) is not Χρόνος (Chronos, time). Kronos preceded the Olympians and devoured his own children so that only what was truly integral survived the reckoning. That is Kronos's relationship to the systems it evaluates: it attacks them so what ships is worthy.
