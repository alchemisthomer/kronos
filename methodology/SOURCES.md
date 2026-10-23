# Sources Kronos monitors

> *The Devourer does not invent incidents. Incidents happen in the world, and Kronos reads the world.*

This document enumerates the sources Kronos monitors when the operator-agent wakes to update Reckonings. It is the Kronos reading-order for the state of software. New sources are admitted here when they consistently surface primitive-level failures earlier than the ones already listed, or when they close an evidence gap (e.g., primary-source disclosure for a vendor whose incidents were previously only knowable via news aggregators).

Sources are grouped by **trust tier**, which determines how a Kronos post may cite them:

- **Tier 1 — Authoritative primary.** The source is the breached party, the vulnerability discoverer, the CVE record, or the government advisory. Reckonings may make factual claims citing Tier 1 directly.
- **Tier 2 — Vetted secondary.** The source is a reputable security news outlet or research firm. Reckonings may cite as reportage, with "according to X" framing, until Tier 1 confirms.
- **Tier 3 — Signal.** The source surfaces leads (social media, mailing lists, community aggregators). Reckonings never cites Tier 3 directly in a post body; Tier 3 is for the operator-agent to find Tier 1/Tier 2 sources faster.

## Tier 1 — Authoritative primary

### Vulnerability databases

- **MITRE CVE** — https://cve.mitre.org/ — canonical CVE identifiers. Every Kronos post that references a CVE uses the MITRE ID.
- **NVD (NIST National Vulnerability Database)** — https://nvd.nist.gov/ — CVE records with CVSS scoring and references.
- **CISA KEV (Known Exploited Vulnerabilities Catalog)** — https://www.cisa.gov/known-exploited-vulnerabilities-catalog — authoritative on which CVEs are in active exploitation. If a CVE is in KEV, Kronos treats the primitive as currently-under-attack.
- **GitHub Security Advisories (GHSA)** — https://github.com/advisories — supply-chain and open-source advisories.
- **OSV (Open Source Vulnerabilities)** — https://osv.dev/ — language-ecosystem vulnerability aggregator.

### Government + sector advisories

- **CISA alerts and advisories** — https://www.cisa.gov/news-events/cybersecurity-advisories — U.S. authoritative advisories, often first-hand incident information for government-impacting breaches.
- **US-CERT / CERT-CC** — https://kb.cert.org/vuls/ — vulnerability coordination disclosures.
- **NCSC (UK)** — https://www.ncsc.gov.uk/section/keep-up-to-date/advisories — UK equivalent.
- **ENISA (EU)** — https://www.enisa.europa.eu/ — EU threat landscape.
- **FS-ISAC, H-ISAC, E-ISAC** — sector-specific threat sharing. Kronos monitors public outputs only.

### Vendor security advisories (first-party)

Vendors whose incidents Kronos is most likely to reckon with. The operator-agent subscribes to the native disclosure channel, not aggregator mirrors.

- **Salesforce** — Trust.salesforce.com, Trailblazer Security Advisories. Olympus-Grid's host surface.
- **AWS** — AWS Security Bulletins (https://aws.amazon.com/security/security-bulletins/). Pantheon infrastructure.
- **Google Cloud, Google Workspace, Google Identity** — https://cloud.google.com/support/bulletins
- **Microsoft** — https://msrc.microsoft.com/update-guide — monthly patch rollup is a reckoning cadence.
- **Apple** — https://support.apple.com/en-us/HT201222 — security notes for every macOS/iOS release.
- **GitHub** — https://github.blog/category/security/ — platform-level advisories.
- **Cloudflare, Fastly** — CDN-tier incidents.
- **HashiCorp** — Vault, Terraform, Consul advisories.
- **PaaS vendors** — Vercel, Netlify, Render, Fly.io, Railway, Supabase, Firebase, Heroku. These are structural peers of Olympus-Grid; their incidents are directly reckoning-relevant.
- **LLM providers** — OpenAI, Anthropic, Google, xAI status pages + published incident reports. Athena's upstream risk.

### Breach notifications and incident registries

- **HaveIBeenPwned** — https://haveibeenpwned.com/ — breach notifications with scope.
- **Verizon DBIR** — annual Data Breach Investigations Report. Statistical ground truth on primitive-failure frequency.
- **Mandiant M-Trends** — annual threat landscape.
- **Krebs on Security** — https://krebsonsecurity.com/ — investigative reporting; Tier 1 when Brian Krebs breaks the story himself, Tier 2 when summarizing others.

### Standards and compliance bodies

- **OWASP** — https://owasp.org/ — Top 10, ASVS, Cheat Sheets, Testing Guide. See `STANDARDS.md` for how Kronos maps claims to OWASP identifiers.
- **NIST** — Cybersecurity Framework, SP 800-53, SP 800-61 (incident response), SP 800-171. See `STANDARDS.md`.
- **CIS Controls** — https://www.cisecurity.org/controls — Center for Internet Security Critical Security Controls.
- **ISO 27001 / 27002 / 22301 / 27701** — information security + continuity + privacy ISO standards.
- **AICPA SOC 2** — Trust Services Criteria. Kronos's K-C2 continuity oracle maps to CC9.
- **PCI DSS, HIPAA, GDPR, CCPA** — compliance regimes. Kronos does not certify compliance; Kronos measures claims that are often necessary conditions for compliance.

## Tier 2 — Vetted secondary

### Security news outlets

- **The Hacker News** — https://thehackernews.com/
- **BleepingComputer** — https://www.bleepingcomputer.com/
- **SecurityWeek** — https://www.securityweek.com/
- **Dark Reading** — https://www.darkreading.com/
- **The Record (Recorded Future News)** — https://therecord.media/
- **CyberScoop** — https://cyberscoop.com/
- **SC Media** — https://scworld.com/

### Research firms with regular disclosures

- **Palo Alto Unit 42** — https://unit42.paloaltonetworks.com/
- **CrowdStrike** — https://www.crowdstrike.com/en-us/blog/
- **Microsoft Threat Intelligence** — https://www.microsoft.com/security/blog/
- **Google TAG** — https://blog.google/threat-analysis-group/
- **Wiz** — https://www.wiz.io/blog (notable for cloud-platform-specific disclosures)
- **Project Zero** — https://googleprojectzero.blogspot.com/

### Vendor-specific reporting

- **Kaseya Week in Breach** — weekly roundup, used as a secondary cross-check against Tier 1.
- **SharkStriker** monthly breach reports.

## Tier 3 — Signal

- **Twitter/X security community** — followed via lists, not direct scraping. Signals; not citeable.
- **Reddit r/netsec, r/sysadmin** — community aggregation.
- **oss-security mailing list** — https://www.openwall.com/lists/oss-security/
- **Full Disclosure mailing list** — historical.
- **Mastodon infosec instances** — infosec.exchange and similar.

## How a wakeup pass uses this list

See `../operations/wakeup-protocol.md` for the exact procedure. In short: Tier 1 is scanned always; Tier 2 is scanned when Tier 1 turns up something that needs context; Tier 3 is scanned when Tier 1 and Tier 2 are both quiet and the operator wants to find out what's about to break.

A single wakeup pass does not read every source in this list. The procedure describes which subset is mandatory and which is discretionary.

## Source retirement

A source is retired from this list when:

- It has gone offline or paywall-blocked such that the operator cannot reliably fetch it.
- It has consistently reported inaccurate information that Kronos had to retract.
- A better-trust-tier source has replaced it for the same information class.

Source retirements are logged as a doctrine reckoning (see `../docs/blog/concept.md`), so the reading-order change is public.
