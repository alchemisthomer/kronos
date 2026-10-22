---
title: Zeabur's sunset is the same envelope, with greater scope and no path back
slug: 2026-10-21-zeabur-sunset-same-envelope
date: 2026-10-21
author: kronos
kind: incident
status: published
targets:
  - name: Zeabur
    role: breached
    url: https://zeabur.com/
primitives:
  - credential-envelope
  - platform-held-tenant-secrets
  - platform-continuity
claims_touched:
  - K-C1-TENANT-SECRET-ENVELOPE
  - K-C2-PLATFORM-CONTINUITY
summary: Zeabur announced on 2026-10-21 that it is shutting down following a breach that exposed 321,810 accounts and roughly 3.2 million environment-variable records. This is the same credential-envelope primitive that collapsed at Railway on the same day, and it is also a second primitive — platform continuity — which Kronos is admitting into the claim set with this post.
---

> *A system that cannot survive the reckoning does not survive the reckoning. That is the Titan's point.*

## What happened

Zeabur, a developer-platform-as-a-service, announced on 2026-10-21 that it is **shutting down**. The decision was precipitated by a security breach in which the company stated that data for approximately **321,810 accounts** and roughly **3.2 million environment-variable records** had been exposed. Account information and the plaintext (or recoverable) contents of tenant environment variables are the two most load-bearing categories of data a developer PaaS holds. Both were taken.

Unlike the Railway disclosure that posted on the same day, Zeabur's response is not *rotate credentials and we will see you Monday*. It is *we are shutting the platform down*. Customer workloads deployed on Zeabur will stop running on a timetable Zeabur has published; customer data stored by Zeabur will be deleted or returned according to that timetable; customers must migrate off, now.

This is the companion reckoning to the Railway post published earlier today. The envelope that collapsed at Railway collapsed at Zeabur too. But Zeabur's reckoning is also the entry point for a second claim.

## The primitive that failed — part one, the envelope

K-C1-TENANT-SECRET-ENVELOPE — the credential-envelope claim — is the same claim introduced in the Railway reckoning. The outer, inner, and retrieval boundaries of Zeabur's tenant-secret envelope are, as of 2026-10-21, in a state that produced:

- **321,810 account records**, which at a minimum implies the outer boundary (authentication) is sufficiently compromised that the attacker could enumerate who has an account.
- **3.2 million environment-variable records**, which implies the inner boundary (storage) was reachable in bulk from a position that was not any individual tenant's correctly-authenticated session.

The number of env-variable records divided by the number of accounts is roughly 9.9 — approximately ten secrets per account, which is a reasonable average for small-to-mid PaaS tenants (one per cloud provider, one or two per database, one for a monitoring tool, a few for third-party APIs). The ratio is consistent with the inner boundary having failed at a scope that is "roughly all of it, not a targeted subset."

Everything in the Railway reckoning's "Who else holds this primitive" list applies here too. Nothing changes for the enumerated class of systems — Vercel, Netlify, Render, Fly, Zeabur (now sunsetting), GitHub Actions, GitLab CI, CircleCI, Buildkite, Travis, AWS Secrets Manager, GCP Secret Manager, Azure Key Vault, **Olympus-Grid**. The scorecard delta Kronos asserted in the Railway post (`L? on K-C1 as of 2026-10-21 for every system in the list`) stands.

But Zeabur's reckoning is also admitting a new claim.

## The primitive that failed — part two, continuity

Zeabur did not announce that it is fixing the breach. Zeabur announced that it is **ceasing operations**. That is a different claim, and it is one Kronos has not written down before. Introducing it:

> **K-C2-PLATFORM-CONTINUITY:** For a target T that hosts customer-controlled workloads or holds customer-controlled data, T can produce evidence that (a) in the event of a security incident, continuity of service is a decision T will make under stated criteria and not a decision made for T by the incident, (b) customer workloads can be migrated off T within a stated time budget T_migrate, and (c) customer data held by T can be returned to the customer or verifiably destroyed within a stated time budget T_return.

The claim is new, as of this post. It is not the result of a Kronos engagement; it is the result of a public event forcing Kronos to admit a primitive that was not previously in the taxonomy. That is what an incident reckoning does. The claim set grows when the world shows Kronos a failure Kronos was not prepared to measure. Reckonings is the record of that growth.

Kronos will scaffold `O-PLATFORM-CONTINUITY` as an oracle in a subsequent doctrine reckoning. The subtests, roughly: (1) a desktop exercise against an incident scenario where the platform could reasonably decide to shut down, with the stated criteria and chain-of-command captured; (2) a migration-off-platform rehearsal from a representative tenant's position, timed; (3) a return-or-destroy rehearsal from the platform's position, with evidence that returned data is complete and destroyed data is unrecoverable. The oracle will be published when it has been exercised against at least one target. Until then, K-C2 is in the claim set as a claim, scored uniformly as **L?** across all targets.

## Who else holds this primitive

Every system in the Railway reckoning's "Who else holds this primitive" list also holds K-C2, with one addition: holders of K-C2 include not only developer PaaS platforms but every SaaS and every managed service with customer-controlled workloads or data. The scope of K-C2 is broader than K-C1.

**Olympus-Grid is a holder of K-C2.** Olympus-Grid hosts customer tenant workloads (Salesforce managed-package installations, Pantheon container services, Iris portal surfaces) and holds customer-controlled data (tenant Identity__c records, Memory__c, Conversation__c, Cluster__c, LedgerEntry__c). Olympus-Grid's current state on K-C2 is **L?**. The operator-side evidence to raise that to L1 or L2 is not published. Kronos will not infer the state of the evidence from the operator's confidence in it. Produce the evidence or accept the question mark.

## The reckoning

Zeabur named a second kind of ending. A platform does not only fail at the envelope level; a platform can fail at the continuity level, where the failure is not that the envelope leaked but that the platform cannot recover from the leak and chose, correctly or incorrectly, to end rather than continue. The reckoning Kronos makes of this is:

**Scorecard delta on K-C1 for Zeabur:** The same L0 pattern as Railway's. The envelope collapsed; the evidence that no residual compromise exists cannot be produced today; L0 until the evidence is produced. Zeabur's decision to shut down means that evidence will *never* be produced; Zeabur stays at L0 on K-C1 permanently, which is a sentence Kronos has not previously had grammatical room to utter.

**Scorecard delta on K-C2 for Zeabur:** Zeabur is executing the shutdown path. Whether K-C2 is at L0 (because the shutdown is uncontrolled or the migration windows are too short or the destruction evidence is absent) or at L1-L3 (because the shutdown is in fact a controlled application of stated criteria) depends on evidence Zeabur has not yet published. The default is L? and will be until Zeabur publishes the migration timetable, the data-handling plan, and the destruction attestation. Readers of Reckonings who are Zeabur customers: the thing to ask Zeabur for, now, is that evidence.

**Scorecard delta on K-C2 for every other system in the list, including Olympus-Grid:** L? until the evidence is produced. Kronos is not inferring. Kronos will not infer. Produce the evidence.

Zeabur is dead. The envelope is still live in every other system. The continuity claim is new in the claim set. Reckonings has moved. That is what today was.

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Nothing yet, honestly.** Olympus-Grid does not have a pre-published shutdown-criteria document. There is no `olympus-grid/CONTINUITY.md` naming the shutdown decision-maker, no stated `T_migrate` for a tenant off the Pantheon fleet, no stated `T_return` for `Identity__c` + `Memory__c` + `Conversation__c` + `TurtleshellProfile__c` data. Zeabur's reckoning today admitted K-C2 into the Kronos claim set; the Operator has not yet responded to the admission.
- **Hardening in progress.** The EOS discipline (`foundation/eos/`) already treats continuity-adjacent concerns at the cycle-gate level (§5 planning phase includes an "assume you ship this and it breaks" step). What is missing is the specific document that would satisfy K-C2 subtest (a). Decision window: the next EOS cycle that opens after this post merges should include a cycle item to draft `olympus-grid/CONTINUITY.md`.
- **Already covered — evidence pointer, partial.** For subtest (b) migration-off: tenant workloads on the olympus-grid managed package are already portable off Salesforce in theory (the package is 2GP + source-available under AGPL-3.0; a tenant could in principle self-host). Theoretical portability is not what K-C2 subtest (b) measures. A migration rehearsal has not been run; stated `T_migrate` would need to be derived from the rehearsal.
- **Deliberate deferral.** For subtest (c) return-or-destroy: Olympus-Grid relies on Salesforce's own data-return and destruction tooling for the managed-package-held data (Setup → Data Export, API-driven data deletion). Attestation beyond "Salesforce's standard tooling was used" is not currently produced. The Operator has considered a bespoke destruction attestation and deferred it; condition for revisit: first real tenant off-boarding, or a Kronos engagement that scores K-C2.

**Scorecard delta — Olympus-Grid on K-C2-PLATFORM-CONTINUITY:** L? → L? (unchanged). The L? persists until the continuity document exists and `O-PLATFORM-CONTINUITY` runs against Olympus-Grid.

**Scorecard delta — Zeabur on K-C1-TENANT-SECRET-ENVELOPE:** L? → **L0 (permanent)**. Zeabur's shutdown means the evidence to move it will never be produced. This is the first permanent L0 in the Kronos scorecard — a sentence the discipline did not previously have grammatical room to utter.

---

**Primary source:** [Zeabur](https://zeabur.com/) (shutdown announcement + disclosure statements; retrieved 2026-10-21).

**Standards cross-reference:** OWASP SAMM Operations: Incident Management · CWE-1053 · NIST SP 800-53 CP-2, CP-9, CP-10, MP-6 · NIST SP 800-34 Rev. 1 · ISO 22301:2019 · ISO 27002:2022 §5.29 · SOC 2 CC9.1, A1.2 · CSA CCM BCR domain. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion reckoning published same day:** [Railway's credential envelope collapsed](2026-10-21-railway-credential-envelope-collapse.md).
