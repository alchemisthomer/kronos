# K-C6-ATTACKER-CADENCE-RESILIENCE

**Admitted:** 2026-10-22 · [ARTEX achieved privileged access in under three hours](../../docs/blog/posts/2026-10-22-artex-storm-0940-adversary-cadence-admission.md)
**Oracle:** [O-ATTACKER-CADENCE](../oracles/O-ATTACKER-CADENCE.md)
**Holder class:** every target that holds operational state attackers want

## Statement

> For a target T, T's architectural posture ensures that an attacker achieving privileged access within a time window `T_attacker` (observed as low as 3 hours in the ARTEX-driven class as of 2026-10-21) cannot escalate to catastrophic loss faster than T can detect and contain. Specifically:
>
> **(a) `T_detect ≤ T_attacker`.** Detection path for a stated attacker class fires within a time window shorter than the attacker's observed time-to-privileged-access for that class. `T_detect` is a measured, published number, not an aspiration.
>
> **(b) Automated containment on anomaly.** When (a) fires, containment action executes without waiting for human escalation. Pre-authorized revocation paths (kill switches, break-glass invalidation, tenant-level deny rules) execute from the detection signal directly.
>
> **(c) Blast-radius architecture.** The architectural maximum damage from any single successful privilege compromise is bounded by design, independent of (a) and (b). Blast-radius containment is the posture that survives (a) and (b) failing.

## The primitive

The primitive K-C6 names is **cadence** — the architectural guarantee that defender-side response time can keep up with the attacker-side offense time. The ARTEX disclosure named the specific trigger: open-source agentic AI penetration-testing frameworks are now operational, achieving `T_attacker` of 3 hours or less for initial-to-privileged-access, running 2,900 sign-in attempts per minute, and operating on 24/7 automated cadence.

This is the first Kronos claim whose scoring floor is **actively moving on attacker time**. L2 yesterday is below L1 today. The ARTEX-class floor as of 2026-10-21 will be undercut by the next generation of agentic pen-test frameworks on publication.

K-C6 also acts as an **ambient re-scoring factor** across every other claim in the Kronos set:

- A target at L2 on **K-C1** under old-cadence attacker assumptions may still fail K-C6 if `T_detect` for a Railway-class envelope breach exceeds attacker-side exfiltration speed.
- A target at L2 on **K-C2** may still fail K-C6 if the shutdown-decision path cannot be invoked faster than an attacker can accomplish catastrophic data destruction.
- A target at L2 on **K-C3** (observability honesty) may still fail K-C6 if the independent attestor's reporting cadence is slower than the attacker's silence-cadence.
- A target at L2 on **K-C4** may still fail K-C6 if the ingress-WAF-rule authoring workflow cannot ship a compensating control in the same window as a CVE's exploitation curve.
- A target at L2 on **K-C7** may still fail K-C6 if the trust-anchor revocation path (OneCRL, OCSP, system updates) propagates slower than attackers can abuse a compromised anchor.
- A target at L2 on **K-C8** may still fail K-C6 if supply-chain-compromise notification-to-containment takes longer than the installed-everywhere exploitation window.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence. Default. Also mandatory for any target whose cadence-resilience envelope was publicly demonstrated to fail (e.g., ConnectWise on subtest (a) as of 2026-10-21). |
| **L1** | Documented posture: (i) named attacker class with assumed `T_attacker`, (ii) measured `T_detect` statistic for high-privilege operations, (iii) list of automated-containment paths, (iv) blast-radius architecture description. No active oracle evaluation. |
| **L2** | Passes `O-ATTACKER-CADENCE` subtests (a), (b), (c) in time-boxed engagement. `T_detect` measured under adversarial simulation; containment paths exercised; blast-radius bounds demonstrated via `simulated-privilege-compromise` operator profile. |
| **L3** | Maintains L2 continuously. `T_detect` and containment-latency published as trailing-window statistics with regression tracking. Blast-radius architecture re-tested when deployment architecture changes. |

## Holder class

**Every target that holds operational state attackers want.** High-priority classes:

- Every multi-tenant SaaS with service-principal / application-level auth (ConnectWise this week).
- Every M365/Google Workspace/Salesforce tenant with multi-tenant admin apps installed (downstream from the above).
- Every PaaS / managed-cloud platform with privileged tenant-crossing credentials (Railway class — see K-C1).
- Every CI/CD platform with privileged production credentials (LiteLLM demonstrated the shape — see K-C8).
- Every identity provider.
- **Olympus-Grid.** Ares is the architectural locus for Pantheon's K-C6 posture. Policy overlay has the mechanism; the operational workflow for cadence-matched response is incomplete. Posture: honest-L?.

## Related claims

- **All of K-C1 through K-C5 and K-C8** are re-scored under K-C6 as described above. K-C6 is doctrine-level infrastructure for the rest of the claim set.
- [K-C3-OBSERVABILITY-HONESTY](K-C3-OBSERVABILITY-HONESTY.md) — inverse-pair. K-C3 is about defender-side agent integrity; K-C6 is about defender-side agent response speed. Both demonstrate that agentic deployment properties matter structurally, not just as sophistication.

## Posts that touch this claim

- [ARTEX achieved privileged access in under three hours](../../docs/blog/posts/2026-10-22-artex-storm-0940-adversary-cadence-admission.md) — admission post
