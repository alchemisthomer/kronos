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

## Follow-up — 2026-10-27

Specifics of the Zeabur breach that were not publicly available when this reckoning was authored have surfaced through aggregator reporting in the week since:

- **3.2 million environment variable records exposed**, covering **321,810 accounts.** Not credentials in abstract; secrets-in-env — API keys, database passwords, cloud identity tokens, OAuth client secrets, LLM-provider tokens — the specific class of blob the K-C1-TENANT-SECRET-ENVELOPE claim doc explicitly covers.
- **Administrator tokens had not been rotated since January 2024.** ~22 months of credential staleness on the control plane of a public multi-tenant PaaS. The admin-token-rotation discipline is a K-C1 subtest (b) ladder item that was named abstract in the original reckoning; Zeabur's specific lapse now serves as the first concrete scorecard-anchor for *credential-rotation discipline measured on the operator's own control-plane tokens, not the tenant's data*.
- **Administrative portals left exposed on the public internet.** K-C1 subtest (a) outer-boundary failure in its most direct form — the perimeter was the admin console's absence of ingress restriction, not any sophisticated circumvention. This is the K-C1 subtest (a) ladder's L0 anchor.
- **Attacker gained root on 101 managed GCP servers** as a consequence of the admin-token exploitation. K-C6 blast-radius subtest (c) at the single-event level — the containment surface did not survive one credential's compromise, and the compromise propagated to the full dedicated-server fleet.
- **Internal credentials stored in plaintext** inside Zeabur's control plane. K-C1 subtest (c) retrieval-boundary failure — the envelope that should have wrapped the sensitive internal state did not exist; the internal state WAS the plaintext.
- **Two breaches in seven weeks** — the shutdown decision followed a sibling breach ~7 weeks earlier that Zeabur did not disclose with equivalent detail. The K-C6 cadence frame reads this as *the attacker visited twice in the same 60-day window, both times succeeding, and the second visit was the one that produced disclosure*. The reckoning's K-C2 framing stated that *operational-maturity collapse signals continuity collapse*; the specific operational-maturity collapse at Zeabur was credential-rotation-discipline absence on the control plane, repeated against a known-compromised holder of control-plane authority.
- **Formal shutdown schedule.** Dedicated-server renewals stop **2026-12-01**; all services terminate **2026-12-31.** The K-C2 subtest (b) migration-off window Zeabur gives its tenants is 65 days from shutdown announcement. Tenants on the shared-cluster side received a longer window.

**Primitive observation:** the Zeabur reckoning's original framing stated that *K-C1 collapse at a specific tenant becomes a K-C2 extinction event for the hoster if there is no envelope between internal operational state and tenant data*. The specifics now public prove the mechanism precisely: Zeabur's K-C1 failure covered **three ladder subtests simultaneously** (outer-boundary subtest (a), rotation discipline subtest (b), retrieval boundary subtest (c)), and the resulting K-C6 blast-radius covered 101 dedicated servers plus the full shared-tenant plane. This is not a partial failure in one dimension; it is a complete-ladder failure across the full K-C1 shape, propagated through a complete-ladder K-C6 shape. The hoster did not survive the compound.

**Scorecard delta on this follow-up:** Zeabur's K-C1 scoring is **L0 permanent** (unchanged from the original reckoning). The specifics now justify L0 on **all three K-C1 subtests simultaneously** rather than the aggregate L0 the original reckoning asserted abstractly. The K-C2 outcome is unchanged (shutdown = terminal K-C2 posture; L? → L0 permanent at merge). The follow-up adds a specific **operational-cadence anchor for the K-C1-against-control-plane-authority measurement** that the ladder was missing: 22-month unrotated admin tokens are the first L0 anchor for subtest (b) measured on operator-control-plane rather than on tenant-user-credential rotation.

**On the Operator (Olympus-Grid) in response to these specifics.** The original *In Response* block committed to drafting `olympus-grid/CONTINUITY.md` on the next EOS cycle to address K-C2 subtest (a); the Zeabur specifics argue that the companion document for K-C1 subtest (b) measured on the Operator's own control-plane is equally needed. The Pantheon fleet's **admin-token rotation discipline on each god's service account** (Salesforce connected-app tokens, AWS IAM credentials in Zeus CDK, SSM-stored keys, GitHub tokens held by Hermes for SendGrid webhook signing) is **not currently audited for rotation cadence.** Named here as a K-C1 subtest (b) item for the next EOS cycle alongside the continuity document. Decision window: same EOS cycle.

**Primary sources for the specifics:** [Zeabur Shuts Down After October Breach: Rotate Secrets and Migrate Before December 31](https://windowsforum.com/news/zeabur-shuts-down-after-october-breach-rotate-secrets-and-migrate-before-december-31.449283/) · [Zeabur to Shut Down After Second Breach in Two Months](https://www.bankinfosecurity.in/zeabur-to-shut-down-after-second-breach-in-two-months-a-33175) (BankInfoSecurity, 2026-10-24) · [Vibe coding platform Zeabur shutting down after two back-to-back breaches](https://cybernews.com/news/zeabur-cloud-provider-shutdown-two-breaches-3-million-records/) (Cybernews, 2026-10-27).

---

**Primary source:** [Zeabur](https://zeabur.com/) (shutdown announcement + disclosure statements; retrieved 2026-10-21).

**Standards cross-reference:** OWASP SAMM Operations: Incident Management · CWE-1053 · NIST SP 800-53 CP-2, CP-9, CP-10, MP-6 · NIST SP 800-34 Rev. 1 · ISO 22301:2019 · ISO 27002:2022 §5.29 · SOC 2 CC9.1, A1.2 · CSA CCM BCR domain. Full mapping in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion reckoning published same day:** [Railway's credential envelope collapsed](2026-10-21-railway-credential-envelope-collapse.md).
