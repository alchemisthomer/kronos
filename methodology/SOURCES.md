# Sources Kronos monitors

> *The Devourer does not invent incidents. Incidents happen in the world, and Kronos reads the world.*

This document is the Kronos **reading order** for the state of software. It enumerates the sources an operator-agent reads during a wakeup pass per [`../operations/wakeup-protocol.md`](../operations/wakeup-protocol.md), with cadence recommendations and access methods for each.

**Source quality is itself a discipline.** The operator's trust in a reckoning rests on the operator's trust in the reckoning's citations. This document is maintained to a specific bar: sources are categorized by **access method** (how the operator reads them — structured feed vs scraped page vs search) and by **attention cadence** (daily / weekly / per-event / annual), not just by trust tier. Both axes matter because they determine whether a daily-cadence wakeup pass can actually touch the source without hallucination risk.

## The three-axis source model

Every source Kronos reads sits on three axes:

1. **Trust tier** — can Kronos cite the content directly in a reckoning, or only treat it as a lead?
2. **Access method** — can Kronos retrieve the content via a structured feed (JSON / RSS / GraphQL API) with authoritative formatting, or must the operator fetch an HTML page and extract via summarization (hallucination-prone)?
3. **Attention cadence** — how often is this source worth re-reading?

The three axes do not covary. A Tier-1 authoritative source may be slow (annual DBIR), fast (hourly KEV JSON feed), or weekly (NIST SP revisions). An unstructured page may be Tier-1 (a vendor's hand-rolled security disclosure) or Tier-2 (a news aggregator). The operator-agent must choose the right axis to care about for the current pass.

The sections below enumerate sources with all three axes stated. Where a structured feed exists, **the structured feed is preferred over the HTML page** — search-snippet summarization is a known hallucination surface for CVE numbers, dates, and version strings.

## Trust tiers (definitions)

- **Tier 1 — Authoritative primary.** The source is the breached party, the vulnerability discoverer, the CVE record, or the government advisory. Reckonings may make factual claims citing Tier 1 directly.
- **Tier 2 — Vetted secondary.** The source is a reputable security news outlet or research firm republishing. Reckonings may cite as reportage ("according to X") until Tier 1 confirms.
- **Tier 3 — Signal.** The source surfaces leads (social media, mailing lists, community aggregators). Reckonings never cite Tier 3 directly in a post body; Tier 3 is for the operator-agent to find Tier 1/Tier 2 sources faster.

## Attention cadences (definitions)

- **Daily** — hit this source on every wakeup pass. Non-optional.
- **Weekly** — hit this source once per 7-day window.
- **Per-event** — hit this source when a related primitive surfaces elsewhere (e.g., check PCI DSS when a card-data breach is reckoned).
- **Annual / semi-annual** — reports Kronos reads on publication only (DBIR, M-Trends).
- **Decaying** — low priority on routine wakeups; raise priority on an on-topic incident.

---

## Tier 1 — Authoritative primary

### Vulnerability databases — structured feeds

| Source | Access method | Cadence | Why |
|---|---|---|---|
| **CISA KEV** JSON feed — [`cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`](https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json) | **JSON feed (preferred)** | Daily | Authoritative list of actively-exploited CVEs. Updates near-real-time. KEV additions are the strongest signal that a primitive is under active attack. |
| **CISA KEV** catalog page — [`cisa.gov/known-exploited-vulnerabilities-catalog`](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) | HTML (fallback) | Daily | Human-readable version of the JSON feed. Use when the JSON structure needs an index to interpret. |
| **NVD CVE API** — [`services.nvd.nist.gov/rest/json/cves/2.0`](https://services.nvd.nist.gov/rest/json/cves/2.0) | **JSON API (preferred)** | Daily | CVE records with CVSS v3.1 + v4.0 scoring, affected product lists, references. Query by CVE id or by date window. |
| **NVD** HTML — [`nvd.nist.gov`](https://nvd.nist.gov/) | HTML (fallback) | Daily | Browser-readable CVE records. |
| **MITRE CVE List v5** on GitHub — [`github.com/CVEProject/cvelistV5`](https://github.com/CVEProject/cvelistV5) | **git clone + file read** | Weekly | Full historical CVE record set in a public git tree. Useful for historical context on an older CVE whose record moved. |
| **GitHub Security Advisory Database (GHSA)** — [`github.com/advisories`](https://github.com/advisories) + GraphQL via `gh api graphql` | **GraphQL (preferred)** | Daily | Ecosystem-aware supply-chain advisories (npm, pypi, maven, pub, nuget, rubygems, go, actions). Filter by ecosystem + severity + published-date. |
| **OSV.dev** — [`osv.dev`](https://osv.dev/) + [`api.osv.dev`](https://api.osv.dev/) | **JSON API (preferred)** | Daily | Language-ecosystem vulnerability aggregator. Better coverage of OSS packages than NVD for the Node/Python/Ruby/Go sides. |
| **RustSec** advisory DB — [`rustsec.org`](https://rustsec.org/) + [`github.com/rustsec/advisory-db`](https://github.com/rustsec/advisory-db) | **git + TOML files** | Weekly | Rust ecosystem advisories. Structured TOML in a git tree. |

### Government + sector advisories

| Source | Access method | Cadence |
|---|---|---|
| **CISA alerts and advisories** — [`cisa.gov/news-events/cybersecurity-advisories`](https://www.cisa.gov/news-events/cybersecurity-advisories) | HTML + RSS | Daily |
| **CISA Known Exploited Vulnerabilities Catalog alerts page** — specific `/alerts/*` subpaths | HTML | Daily |
| **US-CERT / CERT-CC** — [`kb.cert.org/vuls/`](https://kb.cert.org/vuls/) | HTML + Atom | Weekly |
| **NCSC (UK)** — [`ncsc.gov.uk/section/keep-up-to-date/advisories`](https://www.ncsc.gov.uk/section/keep-up-to-date/advisories) | HTML + RSS | Weekly |
| **CERT-In (India)** — [`cert-in.org.in`](https://www.cert-in.org.in/) | HTML | Per-event (India breach claims) |
| **ENISA (EU)** — [`enisa.europa.eu`](https://www.enisa.europa.eu/) | HTML + RSS | Monthly |
| **BSI (Germany)** — [`bsi.bund.de`](https://www.bsi.bund.de/) | HTML + RSS | Per-event |
| **ACSC (Australia)** — [`cyber.gov.au`](https://www.cyber.gov.au/) | HTML + RSS | Per-event |
| **FS-ISAC, H-ISAC, E-ISAC** — public outputs only | HTML | Per-event (sector-specific) |

### Ecosystem-specific language maintainer feeds

**Every language runtime is a K-C4 holder and a K-C7/K-C9 holder.** Monitor each ecosystem's security channel directly rather than wait for aggregators.

| Runtime | Security feed | Access | Cadence |
|---|---|---|---|
| **Node.js** | [`nodejs.org/en/blog/vulnerability/`](https://nodejs.org/en/blog/vulnerability/) + [`nodejs.org/en/feed/blog.xml`](https://nodejs.org/en/feed/blog.xml) | **RSS (preferred)** | Daily |
| **PHP** | [`php.net/security`](https://www.php.net/security) + php.net mailing list archives | HTML + mbox | Daily |
| **Python / CPython** | [`python.org/news/security/`](https://www.python.org/news/security/) + [`discuss.python.org`](https://discuss.python.org/) `security` tag | HTML | Daily |
| **Ruby** | [`ruby-lang.org/en/security`](https://www.ruby-lang.org/en/security/) | HTML + Atom | Weekly |
| **Go** | [`go.dev/security`](https://go.dev/security/) + [`pkg.go.dev/vuln`](https://pkg.go.dev/vuln) | **JSON (preferred)** | Daily |
| **Rust** | RustSec advisory DB (above) | git + TOML | Weekly |
| **JVM / OpenJDK** | [`openjdk.org`](https://openjdk.org/) security advisories + Oracle Critical Patch Updates | HTML | Quarterly (Oracle CPUs on fixed schedule) |
| **.NET / CLR** | [`dotnet.microsoft.com`](https://dotnet.microsoft.com/) security advisories | HTML | Daily |
| **V8 (JavaScript engine)** | [`v8.dev`](https://v8.dev/) + Chrome releases blog | HTML | Daily |
| **Erlang / OTP** | [`erlang.org/download`](https://www.erlang.org/) advisory posts | HTML | Weekly |
| **PostgreSQL** | [`postgresql.org/support/security`](https://www.postgresql.org/support/security/) | HTML + RSS | Daily |
| **Redis** | [`redis.io/docs/management/security`](https://redis.io/docs/management/security/) | HTML | Weekly |
| **nginx** | [`nginx.org/en/security_advisories.html`](https://nginx.org/en/security_advisories.html) | HTML | Weekly |
| **Apache HTTP Server** | [`httpd.apache.org/security/`](https://httpd.apache.org/security/) | HTML | Weekly |
| **OpenSSL** | [`openssl.org/news/vulnerabilities.html`](https://www.openssl.org/news/vulnerabilities.html) | HTML + RSS | Daily |

### Olympus-Grid substrate — mandatory daily scan

The current Olympus-Grid deployment substrate is **Salesforce (spine) + AWS (compute) + Anthropic (one of the Athena LLM providers) + GitHub (source + CI/CD)**. These four sources are the specific substrate under the operator's own trust envelope. **Any security advisory on any of them is directly actionable for the operator**, independent of whether the advisory touches a Kronos claim. Scan every wakeup.

| Substrate | Primary channel | Access | Why mandatory |
|---|---|---|---|
| **Salesforce Trust Advisories** | [`security.salesforce.com/advisory-archives/`](https://security.salesforce.com/advisory-archives/) + [`status.salesforce.com`](https://status.salesforce.com/) | HTML | Olympus-Grid runs as a managed package on the Salesforce platform; every Trust advisory is substrate-level. Historical Salesloft/Drift incident still referenced as the governance precedent. |
| **AWS Security Bulletins** | [`aws.amazon.com/security/security-bulletins/`](https://aws.amazon.com/security/security-bulletins/) + RSS | HTML + RSS | Pantheon runs on ECS Fargate in account 842485730943. The 2026-10-21 → 2026-10-23 window alone shipped nine bulletins — AWS MCP Server sandbox escape (2026-149), Multi Model Server multi-CVE (2026-148), aws-c-mqtt memory allocation (2026-147), **Strands Agents SDK cross-session data disclosure (2026-146 — K-C1 outer-boundary in an AWS agent SDK)**, SAM CLI command injection (2026-145), Athena authorization bypass (2026-144), PHP runtime pass-through (2026-143), SageMaker bucket ownership (2026-142), CI/CD privilege-assignment (2026-141). AWS's own cadence this week is itself a K-C6 confirmation. |
| **Anthropic news (safety + security)** | [`anthropic.com/news`](https://www.anthropic.com/news) + Anthropic alignment publications | HTML | Athena invokes Anthropic as one of the LLM providers; Anthropic incidents propagate downstream to every Athena-mediated inference. Recent substrate-relevant posts: *Strengthening defenses against distillation attacks* (2026-10-12, 90% reduction in illicit distillation), *Anthropic Cyber Mission* (2026-10-08), *2026 Usage Policy update* (2026-10-08), *Cyber Verification Program expansion* (2026-10-06). |
| **GitHub Security blog** | [`github.blog/category/security/`](https://github.blog/category/security/) + RSS | HTML + RSS | Source control + Actions is the Pantheon build pipeline. A GitHub Actions runner compromise, token leakage, or Advanced Security advisory is substrate-level. Also check [`github.com/advisories`](https://github.com/advisories) for ecosystem-wide npm advisories affecting Pantheon dependencies. |
| **GitHub Status** | [`githubstatus.com`](https://www.githubstatus.com/) | HTML + Atom | Runner availability affects CI; outages affect release cadence (K-C2 adjacency). |

**Additional substrate adjacencies** worth per-event scanning: Datadog (Pantheon telemetry if adopted), Sentry (error aggregation), Cloudflare (CDN if adopted), AWS KMS / IAM / Secrets Manager advisories (K-C7 anchor).

### Vendor security advisories (first-party)

Vendors whose incidents Kronos is likely to reckon with. **Subscribe to the native disclosure channel, not aggregator mirrors.**

| Vendor | Channel | Access | Cadence |
|---|---|---|---|
| **Salesforce** | Trust.salesforce.com, Trailblazer Security Advisories | HTML | Daily (olympus-grid host surface) |
| **AWS** | [`aws.amazon.com/security/security-bulletins/`](https://aws.amazon.com/security/security-bulletins/) | HTML + RSS | Daily |
| **Google Cloud / Workspace / Identity** | [`cloud.google.com/support/bulletins`](https://cloud.google.com/support/bulletins) | HTML + Atom | Daily |
| **Microsoft (MSRC)** | [`msrc.microsoft.com/update-guide`](https://msrc.microsoft.com/update-guide) | HTML + CSAF JSON | Daily (monthly rollup is a reckoning cadence) |
| **Microsoft Threat Intelligence blog** | [`microsoft.com/en-us/security/blog/`](https://www.microsoft.com/en-us/security/blog/) | HTML + RSS | **Daily** — forensic deep-dives (e.g., LiteLLM 2026-10-23 K-C9-admission trigger) |
| **Apple** | [`support.apple.com/en-us/HT201222`](https://support.apple.com/en-us/HT201222) | HTML | Daily (every macOS/iOS release) |
| **GitHub** | [`github.blog/category/security/`](https://github.blog/category/security/) | HTML + RSS | Daily |
| **GitLab** | [`about.gitlab.com/releases/categories/releases/`](https://about.gitlab.com/releases/categories/releases/) + critical patch release blog | HTML + RSS | Daily |
| **Cloudflare** | [`blog.cloudflare.com/tag/security/`](https://blog.cloudflare.com/tag/security/) + Cloudflare status | HTML + RSS | Daily |
| **Fastly** | [`fastly.com/security`](https://www.fastly.com/security) | HTML | Weekly |
| **HashiCorp** — Vault, Terraform, Consul | [`discuss.hashicorp.com/c/announcements`](https://discuss.hashicorp.com/c/announcements) | HTML | Weekly |

### PaaS / managed-cloud peer vendors

**Structural peers of Olympus-Grid.** Any incident here is a candidate for an incident reckoning naming a shared primitive.

| Vendor | Status / disclosure | Cadence |
|---|---|---|
| **Vercel** | [`vercel.com/kb/bulletin`](https://vercel.com/kb/bulletin) + [`vercel-status.com`](https://www.vercel-status.com/) | Daily |
| **Netlify** | [`netlifystatus.com`](https://netlifystatus.com/) + Netlify security page | Daily |
| **Render** | [`status.render.com`](https://status.render.com/) + Render security page | Weekly |
| **Fly.io** | [`status.flyio.net`](https://status.flyio.net/) + Fly community | Weekly |
| **Railway** | [`railway.statuspage.io`](https://railway.statuspage.io/) + Railway community | Weekly — raised priority given Oct 2026 breach context |
| **Supabase** | [`status.supabase.com`](https://status.supabase.com/) + Supabase security | Weekly |
| **Firebase** | Firebase release notes | Weekly |
| **Heroku** | [`status.heroku.com`](https://status.heroku.com/) | Weekly |
| **Cloudflare Workers** | Cloudflare status + blog | Daily |

### LLM provider research + alignment + safety blogs

**Athena's upstream risk** and the K-C3 / K-C5 holder-class.

| Provider | Research channel | Access | Cadence |
|---|---|---|---|
| **OpenAI alignment** | [`alignment.openai.com/misalignment-reports`](https://alignment.openai.com/misalignment-reports) | HTML | **Daily** — K-C3 admission trigger was published here |
| **OpenAI status + model-release blog** | [`openai.com/blog`](https://openai.com/blog) + status.openai.com | HTML + status | Daily |
| **Anthropic** | [`anthropic.com/news`](https://www.anthropic.com/news) + status.anthropic.com + Anthropic research publications | HTML | Daily |
| **Google DeepMind** | [`deepmind.google/discover/blog/`](https://deepmind.google/discover/blog/) + Google TAG | HTML + RSS | Daily |
| **xAI** | [`x.ai/blog`](https://x.ai/blog) | HTML | Weekly |
| **Mistral AI** | [`mistral.ai/news`](https://mistral.ai/news/) | HTML | Weekly |
| **Hugging Face Hub security** | [`huggingface.co/security`](https://huggingface.co/security) | HTML | Weekly |
| **Meta AI** | Meta AI blog + FAIR publications | HTML | Weekly |

### Breach notifications + statistical reporting

| Source | Access | Cadence |
|---|---|---|
| **HaveIBeenPwned** | [`haveibeenpwned.com`](https://haveibeenpwned.com/) + API | **API (preferred)** | Daily |
| **Verizon DBIR** (Data Breach Investigations Report) | Annual PDF | Annual (publication read) |
| **Mandiant M-Trends** | Annual PDF | Annual (publication read) |
| **CrowdStrike Global Threat Report** | Annual PDF + quarterly updates | Semi-annual |
| **Microsoft Digital Defense Report** | Annual PDF | Annual |
| **IBM X-Force Threat Intelligence Index** | Annual PDF | Annual |
| **Krebs on Security** | [`krebsonsecurity.com`](https://krebsonsecurity.com/) + RSS | Daily (Tier 1 when Brian breaks the story; Tier 2 when summarizing) |

### Standards + compliance bodies

| Body | What Kronos reads | Cadence |
|---|---|---|
| **OWASP** | Top 10 revisions, ASVS updates, SAMM revisions, new project launches | Per-publication |
| **NIST** | Cybersecurity Framework, SP 800-53 revisions, SP 800-61 updates, AI RMF updates | Per-publication |
| **MITRE ATT&CK** | New techniques, framework version updates | Quarterly |
| **MITRE ATLAS** | AI/ML threat matrix updates | Per-publication |
| **MITRE D3FEND** | Defensive countermeasure additions | Quarterly |
| **CIS Controls** | Version updates | Per-publication |
| **ISO** | 27001 / 27002 / 22301 / 27701 / 42001 revisions | Per-publication |
| **AICPA SOC 2 TSC** | Trust Services Criteria updates | Per-publication |
| **CA/Browser Forum** | Baseline Requirements updates, OneCRL changes, root-store policy updates | Weekly (K-C7 governance) |
| **PCI DSS, HIPAA, GDPR, CCPA, DORA, NIS2** | Compliance regime updates | Per-event (when a reckoned incident touches regulated data classes) |

---

## Tier 2 — Vetted secondary

### Security news outlets

Daily to weekly skim; cite as "according to X" until Tier 1 confirms.

| Outlet | Access | Cadence |
|---|---|---|
| **The Hacker News** | [`thehackernews.com`](https://thehackernews.com/) + RSS | Daily |
| **BleepingComputer** | [`bleepingcomputer.com`](https://www.bleepingcomputer.com/) + RSS | Daily |
| **SecurityWeek** | [`securityweek.com`](https://www.securityweek.com/) + RSS | Daily |
| **Dark Reading** | [`darkreading.com`](https://www.darkreading.com/) + RSS | Daily |
| **The Record (Recorded Future News)** | [`therecord.media`](https://therecord.media/) + RSS | Daily |
| **CyberScoop** | [`cyberscoop.com`](https://cyberscoop.com/) + RSS | Daily |
| **The Register — Security section** | [`theregister.com/security/`](https://www.theregister.com/security/) + RSS | Daily |
| **Ars Technica — Security** | [`arstechnica.com/security/`](https://arstechnica.com/security/) + RSS | Weekly |
| **SC Media** | [`scworld.com`](https://scworld.com/) | Weekly |

### Research firms with regular technical disclosures

These are the "quiet-but-high-signal" sources. **Many drop infrequently but their posts tend to carry primitive-level novelty worth a doctrine reckoning.** Hit each at every wakeup.

| Firm | Channel | Why — recent primitive-admissions trigger |
|---|---|---|
| **Google Project Zero** | [`projectzero.google`](https://projectzero.google/) | Deep per-vulnerability analyses + methodology |
| **Google Threat Analysis Group (TAG)** | [`blog.google/threat-analysis-group/`](https://blog.google/threat-analysis-group/) | State-actor attribution |
| **Microsoft Threat Intelligence** | [`microsoft.com/security/blog/`](https://www.microsoft.com/en-us/security/blog/) | **K-C6 ARTEX admission source. K-C9 LiteLLM-deep-dive source.** |
| **Mandiant** (Google Cloud) | [`cloud.google.com/blog/topics/threat-intelligence`](https://cloud.google.com/blog/topics/threat-intelligence) | Advanced persistent threat deep-dives |
| **Palo Alto Unit 42** | [`unit42.paloaltonetworks.com`](https://unit42.paloaltonetworks.com/) | Threat intel + reverse-engineering |
| **CrowdStrike** | [`crowdstrike.com/en-us/blog/`](https://www.crowdstrike.com/en-us/blog/) | APT tracking + eCrime |
| **Wiz Research** | [`wiz.io/blog`](https://www.wiz.io/blog) | **K-C4 PHP2Shell admission source.** Cloud-platform-specific. |
| **Volexity** | [`volexity.com/blog/`](https://www.volexity.com/blog/) | Nation-state TTP analysis |
| **Datadog Security Labs** | [`securitylabs.datadoghq.com`](https://securitylabs.datadoghq.com/) | Supply-chain + cloud workload |
| **Socket Security** | [`socket.dev/blog`](https://socket.dev/blog) + Socket feed | **Supply-chain compromise alerts — LiteLLM 2026-10-21 surfaced here first** |
| **Aikido Security** | [`aikido.dev/blog`](https://www.aikido.dev/blog) | Supply-chain + CVE triage |
| **JFrog Security Research** | [`jfrog.com/blog/category/security-research/`](https://jfrog.com/blog/category/security-research/) | Supply-chain + binary analysis |
| **Snyk Security** | [`snyk.io/blog/category/security/`](https://snyk.io/blog/category/security/) + Snyk vulnerability database | Dependency scanning |
| **GitGuardian** | [`blog.gitguardian.com`](https://blog.gitguardian.com/) | Secret sprawl + leaked credentials |
| **chainguard** | [`chainguard.dev/unchained`](https://chainguard.dev/unchained) | Supply-chain + container image security — see 2026-10-21 PHP2Shell disclosure-cadence controversy |
| **VulnCheck** | [`vulncheck.com/blog`](https://vulncheck.com/blog) + VulnCheck research notes | Quantitative CVE / exploit telemetry. Produced the "AI drove a doubling of digital flaws discovered year-over-year" number cited by Reuters/Prince 2026-10-23 — the first publishable trailing baseline for K-C6 attacker-side cadence. |

### Named-individual industry voices (per-event, high-signal)

Specific industry leaders whose public statements carry K-C-level framing weight. **Not citeable as Tier 1 in the "authoritative primary breach disclosure" sense, but Tier 1 for industry-posture evidence** when the individual's observational scale is non-replicable (CEO of a Tier-1 CDN seeing traffic no researcher sees).

| Person / Role | Channels | Why |
|---|---|---|
| **Matthew Prince** / Cloudflare CEO | Cloudflare blog + conference talks + Reuters/Bloomberg interviews | Cloudflare's network sees ~20% of global HTTP traffic; Prince's public statements have observational scale no academic has. **Confirmed K-C6 framing in Reuters interview 2026-10-23**: "I think we're going to have a couple years where every single week it's going to feel like the sky is falling." His "monsters from a haunted house" long-term framing is the industry's first widely-circulated optimistic counter-frame to the Black October narrative. |
| **Charlie Hero** / various CTOs of CDN peers | Fastly, Akamai executive channels | Peer-vendor executive statements that corroborate or disagree with Cloudflare-tier framing |
| **Dustin Moody** / NIST post-quantum lead | NIST announcements | K-C7 governance framing (algorithm sunset) |
| **CISA leadership** / Jen Easterly historical, current CISA Director | CISA press + blog | Government framing of KEV posture, agency-level T_detect commitment |

Industry-voice sources are logged specifically because the Kronos canon's claim framing often lags or precedes industry framing by weeks. A convergence event (Microsoft TI naming the K-C9 technique, Prince naming the K-C6 phenomenon) is itself evidence that the primitive has stabilized in the public discourse and is reckoning-worthy.

### Attack-side intelligence (research publication venues)

Review when publishing-season items are relevant. **Several K-* primitives first appear as academic research years before they land in production attacker toolchains.**

| Venue | What to read | Cadence |
|---|---|---|
| **USENIX Security Symposium** | Proceedings + session videos | Annual (post-conference) |
| **IEEE Symposium on Security and Privacy** | Proceedings | Annual |
| **ACM CCS (Computer and Communications Security)** | Proceedings | Annual |
| **NDSS (Network and Distributed System Security)** | Proceedings | Annual |
| **DEF CON** | Media server + whitepapers | Annual (August) |
| **Black Hat** | Briefings + whitepapers | Annual (July + regional) |
| **ShmooCon** | Talks + whitepapers | Annual (January) |
| **arXiv cs.CR** | Preprints | Weekly |

---

## Tier 3 — Signal

Not citeable directly. Used by the operator-agent to find Tier 1 / Tier 2 sources faster.

| Source | Access | Cadence |
|---|---|---|
| **Twitter/X security community** | Followed via lists | Daily (lead-finding) |
| **Mastodon infosec.exchange** | ActivityPub feed | Daily |
| **Reddit r/netsec, r/sysadmin, r/aws** | Top-of-day | Weekly |
| **oss-security mailing list** | [`openwall.com/lists/oss-security/`](https://www.openwall.com/lists/oss-security/) | Daily |
| **Full Disclosure mailing list** | Archive | Weekly |
| **Hacker News security tag** | [`news.ycombinator.com`](https://news.ycombinator.com/) + Algolia API | Daily |
| **Lobsters security tag** | [`lobste.rs/t/security`](https://lobste.rs/t/security) | Daily |

---

## Infrastructure provider status pages (K-C2 holder tracking)

Not security advisories per se, but K-C2 continuity failures surface here first and shape incident-reckoning context.

| Provider | Status page |
|---|---|
| **AWS** | [`health.aws.amazon.com/health/status`](https://health.aws.amazon.com/health/status) |
| **GCP** | [`status.cloud.google.com`](https://status.cloud.google.com/) |
| **Azure** | [`status.azure.com`](https://status.azure.com/) |
| **Cloudflare** | [`cloudflarestatus.com`](https://www.cloudflarestatus.com/) |
| **GitHub** | [`githubstatus.com`](https://www.githubstatus.com/) |
| **Stripe** | [`status.stripe.com`](https://status.stripe.com/) |
| **Twilio** | [`status.twilio.com`](https://status.twilio.com/) |

---

## Verification protocol — how to cite a Tier-2 source responsibly

A Reckonings post cites Tier 1 directly. If only Tier 2 is available, follow this protocol:

1. **Find the CVE id or vendor advisory URL** that Tier 2 is citing.
2. **Verify the CVE id against NVD or GHSA** via the structured JSON API. Do not trust Tier-2's rendition of the CVSS score, affected version string, or publication date — these are the most-frequently-wrong fields in secondary reporting.
3. **If the Tier-2 source names a specific technical mechanism** (buffer overflow in function X, use-after-free in object Y), **confirm against the vendor advisory before writing a reckoning**. Technical details in Tier-2 writeups are often simplified or wrong in load-bearing ways.
4. **If Tier 1 is missing**, log the finding in [`../operations/signal-log.md`](../operations/signal-log.md) as Bucket C. **Do not draft a reckoning yet.** The Kronos three-kind post taxonomy requires Tier 1 citation.
5. **Record the "Tier 1 missing" state in the signal log** and re-check on the next wakeup.

## Cross-reference with Kronos-held state

Each wakeup pass should also cross-reference the horizon scan against Kronos's own current state:

1. **Walk the `claims_touched` fields of recent reckonings** — if a target in a claim's holder-class list has moved posture (shipped new mitigation, suffered new incident), that's a candidate scorecard update.
2. **Walk the signal log tail** — recheck each "recheck next wakeup" entry.
3. **Walk watched-targets list** (future work: structured list of specific vendors Kronos is tracking longitudinally). Currently informal: Olympus-Grid (always), Pantheon dependency surface, cosmos-logos peers.

## How a wakeup pass uses this list

See [`../operations/wakeup-protocol.md`](../operations/wakeup-protocol.md) for the exact procedure. In short:

- **Daily cadence** sources are scanned on every wakeup. The structured feeds (CISA KEV JSON, NVD CVE JSON, GHSA GraphQL, OSV API, Node.js RSS, PostgreSQL RSS, Microsoft TI blog) are the mandatory first stop because they can be queried in a few seconds without hallucination risk.
- **Research-firm blogs** are scanned on every wakeup because their post cadence is low (weekly to monthly) but their primitive-admission value is high.
- **Secondary news outlets** are scanned when the structured feeds have surfaced an item the operator-agent needs context on.
- **Tier 3** is scanned when Tier 1 and Tier 2 are quiet and the operator-agent is looking for leads on primitives not yet named.
- A single wakeup pass does not read every source in this list. **The protocol describes which subset is mandatory and which is discretionary.**

## Source retirement

A source is retired from this list when:

- It has gone offline or paywall-blocked such that the operator cannot reliably fetch it.
- It has consistently reported inaccurate information that Kronos had to retract.
- A better-trust-tier source has replaced it for the same information class.
- A better-access-method source has replaced it (unstructured HTML scrape replaced by structured JSON feed → prefer the feed).

Source retirements are logged as a **doctrine reckoning** (see [`../docs/blog/concept.md`](../docs/blog/concept.md)), so the reading-order change is public.

## Source admission

A source is admitted into this list when:

- It consistently surfaces primitive-level incidents earlier than existing sources on the list.
- It closes a sector / region / ecosystem evidence gap (e.g., primary-source disclosure for a vendor whose incidents were previously only knowable via aggregators).
- It provides a structured-feed version of a source currently accessed via HTML scraping.

Source admissions are logged in the next wakeup entry (`operations/wakeup-log.md`) and documented here with trust tier + access method + cadence.

## Changelog

- **2026-10-24 (second pass, same day)** — Added **Olympus-Grid substrate** mandatory-daily-scan section (Salesforce / AWS / Anthropic / GitHub) with specific URLs + cadence. Added **VulnCheck** as a quantitative-telemetry research source (the "AI doubled discovery YoY" number). Added **Named-individual industry voices** section with Matthew Prince / Cloudflare CEO as the inaugural entry (Reuters 2026-10-23 K-C6 framing confirmation + "monsters from a haunted house" optimistic counter-frame). Documented the AWS 2026-10-21 → 10-23 nine-bulletin wave as the first substrate-specific cadence confirmation (Strands Agents SDK cross-session disclosure is K-C1-at-the-agent-infrastructure-layer; AWS MCP Server sandbox is K-C9 adjacency).
- **2026-10-24** — Major restructure introducing the three-axis source model (trust tier · access method · attention cadence). Added:
  - Structured-feed emphasis for CISA KEV JSON, NVD CVE API, GHSA GraphQL, OSV API, RustSec, Node.js RSS, PostgreSQL RSS, Go pkg.go.dev/vuln (replaces search-snippet discovery as the recommended daily-scan path for CVE / advisory material).
  - Ecosystem-specific maintainer feed section (Node / PHP / Python / Ruby / Go / Rust / JVM / .NET / V8 / PostgreSQL / Redis / nginx / Apache / OpenSSL).
  - "Research firms with regular technical disclosures" section explicitly flagging **Microsoft TI** (K-C6 ARTEX admission source, K-C9 LiteLLM-deep-dive source), **Wiz Research** (K-C4 PHP2Shell admission source), **Socket Security** (K-C8 LiteLLM surfacing source), **Chainguard** (PHP2Shell disclosure-cadence incident) as high-signal, low-cadence sources worth scanning on every wakeup.
  - Attack-side intelligence (academic + conference) section.
  - Infrastructure provider status pages section (K-C2 context).
  - Verification protocol section for responsibly citing Tier-2.
  - Cross-reference-with-Kronos-held-state section.
- **2026-10-21** — Original three-tier source list authored.
