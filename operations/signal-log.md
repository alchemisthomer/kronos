# Signal log

Append-only. Entries recorded during a wakeup pass when a source has surfaced something interesting but Tier 1 corroboration is insufficient to draft a reckoning (per `wakeup-protocol.md § Bucket C`). Signals that later meet the Tier 1 bar move up to a drafted reckoning; signals that fade without corroboration remain here as the record that the operator saw them and chose not to post.

Format:
```
YYYY-MM-DD — <signal title> — <one-line reason it is a signal not a post> — <next-check condition>
```

---

2026-10-21 — OpenCode "distillation attack" affecting 1.4% of OpenCode Console users with linked external AI providers (Anthropic, OpenAI, Google), disclosed 2026-10-18 — Tier 1 primary disclosure from OpenCode itself not located (only a cited X/Twitter post and a StepSecurity secondary writeup); the technical mechanism of "distillation attack" is not publicly explained; this would be a K-C1 reckoning on the connected-provider-token retrieval boundary if the Tier 1 primary becomes available — recheck on next wakeup; if OpenCode publishes a post-mortem with technical detail, draft an incident reckoning citing it and link in StepSecurity as Tier 2 corroboration.

2026-10-21 — CISA KEV October wave of authentication-bypass-by-spoofing additions (Ivanti Connect Secure CVE-2026-104935, BeyondTrust Remote Support CVE-2026-102764, Atlassian multi-product CVE-2026-21589, Fortinet CVE-2025-61624, Palo Alto PAN-OS CVE-2026-0322) added 2026-10-13 through 2026-10-20 — individually each is a vendor-specific vulnerability not a primitive reckoning; collectively they are a pattern (K-C1 outer-boundary auth bypass, multiple appliance vendors, same two-week window) that could support a composite doctrine piece once a fifth or sixth appliance vendor lands in the same pattern — recheck on next two or three wakeups; if the pattern persists, draft a composite doctrine reckoning on *appliance-class K-C1 outer-boundary brittleness* and consider admitting a holder-class note under K-C1.

2026-10-21 — Google Cloud security bulletins GCP-2026-069 (Istio, 2026-10-19) and GCP-2026-067 (Cloud Service Mesh 1.30.5-asm.8, 2026-10-12) — service-mesh patches at infrastructure-hygiene level; Pantheon routes through Hermes not through a service mesh so direct impact is nil; signal is useful because future olympus-grid or client engagements may route through a mesh — recheck when a mesh enters a target scope; no draft needed on this wakeup.
