# K-C2-PLATFORM-CONTINUITY

**Admitted:** 2026-10-21 · [Zeabur sunset](../../docs/blog/posts/2026-10-21-zeabur-sunset-same-envelope.md)
**Oracle:** [O-PLATFORM-CONTINUITY](../oracles/O-PLATFORM-CONTINUITY.md)
**Holder class:** any target that hosts customer-controlled workloads or holds customer-controlled data

## Statement

> For a target T that hosts customer-controlled workloads or holds customer-controlled data, T can produce evidence that:
>
> **(a) Shutdown is a decision, not a surprise.** In the event of a security incident, business failure, or other continuity-breaking event, continuity of service is a decision T makes under stated, pre-published criteria — not a decision made for T by the incident. The decision-maker is identified. The decision window is bounded. The criteria are reviewable before the fact, not reconstructed after.
>
> **(b) Migration-off time budget is stated and demonstrated.** Customer workloads can be migrated off T within a stated time budget T_migrate. "Stated" means written down in a document the customer can read. "Demonstrated" means at least one representative customer has rehearsed the migration end-to-end within T_migrate, with artifacts of the rehearsal preserved.
>
> **(c) Return-or-destroy is verifiable.** Customer data held by T can either be returned to the customer in a usable form or verifiably destroyed within a stated time budget T_return. Returned data has a stated completeness criterion; destroyed data has a destruction attestation that an independent party could audit.

## The primitive

A platform does not only fail at the credential-envelope level ([K-C1](K-C1-TENANT-SECRET-ENVELOPE.md)). A platform can also fail at the continuity level, where the failure is not that any single boundary leaked but that the platform *cannot recover* from the leak and chooses — correctly or incorrectly — to end rather than continue.

Zeabur named this kind of ending on 2026-10-21. Zeabur did not announce a fix; Zeabur announced it was shutting down. Customer workloads deployed on Zeabur would stop running on a Zeabur-published timetable; customer data would be deleted or returned per that timetable; customers had to migrate off, now.

The primitive K-C2 protects is this: *the customer is not surprised by what happens to their workload and their data when the platform stops being a platform.* The claim fails when the ending is a surprise — when the timetable is announced in the same breath as the incident, when the migration path is invented after the fact, when the return-or-destroy promise is a sentence in a goodbye email rather than a verifiable procedure.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence can be produced today. Default for all targets. Also the mandatory level for any target that announced a shutdown without pre-published criteria, migration budget, or return-or-destroy procedure. |
| **L1** | Target has written documentation that names the shutdown decision-maker, states a `T_migrate`, states a `T_return`, and describes the return-or-destroy procedure. No active oracle evaluation. |
| **L2** | Target has passed `O-PLATFORM-CONTINUITY` subtests (a), (b), (c) in a Kronos engagement. Specifically: the pre-published criteria exist and are reviewable; a representative customer has rehearsed migration within `T_migrate`; a destruction attestation has been produced in a test context and would be reproducible under incident conditions. |
| **L3** | Target maintains L2 continuously: the shutdown-decision document is reviewed on a stated cadence; a migration rehearsal is run at least annually with a different customer each time; destruction attestations are produced on a rolling basis for a sample of expired customer workloads and are externally auditable. |

## Holder class

Broader than [K-C1](K-C1-TENANT-SECRET-ENVELOPE.md): includes every SaaS and every managed service with customer-controlled workloads OR customer-controlled data, not just those holding tenant secrets.

In addition to the K-C1 list, holders include:

- **Managed-DB providers** without full self-managed-export paths
- **Hosted-LLM providers** holding fine-tuned model weights or prompt libraries
- **CRM / ERP / ticketing SaaS** holding operational data
- **Document platforms** holding customer-authored content
- **Olympus-Grid** — holds customer workloads (Salesforce managed-package installations, Pantheon container services, Iris portal surfaces) AND customer data (`Identity__c`, `Memory__c`, `Conversation__c`, `Cluster__c`, `LedgerEntry__c`, `TurtleshellProfile__c` if still live, `Feedback__c`). Olympus-Grid's current state on K-C2 is **L?** — the operator-side evidence to raise this has not been published.

## Related claims

- [K-C1-TENANT-SECRET-ENVELOPE](K-C1-TENANT-SECRET-ENVELOPE.md) — admitted on the same day; targets that hold tenant secrets AND customer workloads/data are on the hook for both.

## Posts that touch this claim

- [Zeabur's sunset is the same envelope](../../docs/blog/posts/2026-10-21-zeabur-sunset-same-envelope.md) — admission post
