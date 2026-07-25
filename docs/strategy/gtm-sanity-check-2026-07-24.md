# Kronos GTM sanity-check — "is this a good idea?"

**Date (v1):** 2026-07-24
**Date (v2 addendum):** 2026-07-24 (post-convergence review by Claude, Grok, Gemini, ChatGPT)
**Author:** kronos scribe (in response to the operator's direct request after the four-LLM design review round + a second convergence pass)
**Purpose:** honest strategic assessment of the kronos framework as it stands at v0.5. Addresses three questions the operator raised after reviewing the complete v0 → v0.1 → v0.2 → v0.3 → v0.4 → v0.5 delta stack.
**Status:** advisory. This document is a sanity check, not a design decision. GTM choices are the operator's; this document exists to inform them.
**Not-a-design-doc:** this document adds no framework material. It does not modify methodology, ADRs, or the domain model. It is a strategic reflection meant to be readable alongside DESIGN.md when the operator is deciding what to build first.
**v2 addendum note:** the v1 document below contains a load-bearing empirical error — it claims the naive-builder assurance market is "materially uncontested." Convergence reviewers (Claude and ChatGPT specifically) verified this is false as of mid-2026. The v2 corrections appear at the top under **"v2 addendum — corrections after the final review round."** The v1 text below remains for provenance but should be read *only* through the v2 corrections. When v1 and v2 disagree, v2 wins.

---

# v2 addendum — corrections after the final review round

**Written 2026-07-24 after Claude, ChatGPT, Grok, and Gemini each completed a convergence-round review of the framework and gave independent GTM feedback.**

The v1 document below (Sections labeled "TL;DR" through "What this document is not") retains factual errors that reviewers surfaced. Read the v2 addendum first. It supersedes v1's competitive analysis and revises v1's product recommendations.

## v2 correction 1 — the naive-builder assurance market is NOT greenfield

The v1 sanity-check claimed "no known direct competitor" for a hosted scan targeting AI-built apps. This is false as of mid-2026. Actively-shipping competitors surfaced by convergence reviewers:

- **CheckVibe** — free scanner where a user pastes a URL; runs 100+ checks against Lovable, Cursor, Bolt, v0, and Replit apps. No source access needed. ~30-second scan.
- **Vibe App Scanner (vas)** — built specifically for the vibe-coding workflow. Scans a live app without repo access. Exports findings as markdown with structured remediation that Claude and ChatGPT can execute directly. Ships a "Scanned by vas" badge and weekly monitoring on the paid tier ($19/$39/month). **This is nearly the exact product surface v1 proposed as "Kronos Card."**
- **VibeEval, Scanbee** — additional security-only entrants in the same niche.
- **Lovable native security** — Basic and Deep security scans covering RLS policies, database access, dependencies, endpoint protection, secrets, SQL injection, XSS, storage, and error/log leakage. Also supports Wiz and Aikido integrations. Runs pre-publish or scheduled.
- **Replit Project Security Center** — dependency analysis, application-code analysis, privacy analysis, severity-ranked findings, Agent-driven reviews, automated dependency remediation.
- **StackHawk Vibe** — MCP-delivered runtime security tester for AI coding assistants, $5/month.
- **Aikido** — broader code-to-cloud-to-runtime security platform with a free entry point.
- **Enterprise incumbents** (Snyk, Wiz, Invicti/Veracode) are actively marketing into the vibe-code segment.

The six commodity checks in v1's proposed Kronos Card MVP (secrets, auth/RLS, CVEs, headers, exfil, cost) are exactly the checks these tools already tune for the exact same builder audience with the exact same distribution loop. The pain is real — the Moltbook incident (February 2026, Wiz surfaced misconfigured DB exposing 1.5M auth tokens); the June 2026 Verge warning about vibe-coded app security; the Veracode finding that 45% of AI-generated code shipped a known vulnerability — but real pain is *why the space already has entrants*, not evidence that the space is open.

**Implication for v1's Path B:** the "materially uncontested" premise fails. A vanilla Kronos Card as the first SaaS surface would enter a red ocean against products that have been tuning their checks for longer.

## v2 correction 2 — the actual defensible wedge is narrower than v1 implied

Convergence reviewers verified whether *any* competitor computes kronos's actual differentiator — deductive cost-impossibility from a declared capacity model. The answer:

- **Vibe-security scanners** (vas, CheckVibe, StackHawk Vibe, Aikido): security-only. None do cost-plausibility. Check #3 in v1's MVP list is the one thing that segment does not have.
- **Cloud FinOps tools** (Harness, Sedai, Kion, Finout): do statistical *anomaly detection* ("this spend is unusual vs your history") and threshold alerts ("you crossed $X"). None compute deductive *impossibility* ("your declared infra has zero NAT gateways, therefore any NAT charge is physically impossible, not merely anomalous").
- **LLM-spend layer** (LiteLLM, RouteLLM, AI Cost Guard): budget enforcement, model routing, agent throttling. Same anomaly/threshold shape.

**The distinction that survives:** anomaly detection needs historical data to define "unusual." Impossibility reasoning needs only a declared capacity model. The founding-incident case — a billing pipeline defect producing charges against nonexistent infrastructure — is precisely the case where there is no anomalous history to compare against because the charge was never real. Deductive impossibility catches it; anomaly detection does not.

That distinction is real, unoccupied, and technically defensible. It is also **narrow** — a single specific check inside a category (cost) that the buyer already thinks is handled by their existing FinOps tools. Selling it requires teaching the buyer why plausibility beats anomaly, which is a slower sell than the v1 doc implied.

## v2 correction 3 — the $131B founding story undercuts the need at the moment it should close

v1 recommended opening every sales conversation with the $131B story. Convergence reviewers correctly noted: the story's own resolution is "AWS reversed it, actual cost $505.72, nobody lost a dollar." A skeptical CFO hears *"so the existing system worked and it cost you nothing — why am I buying?"*

**Reframe:** the phantom bill is the dramatization; the point is the *class of exposure*. Next time it is a real Lambda retry loop, a real crypto-miner in a compromised account, a real exposed NAT gateway, a real reflected data-transfer attack — and none of those get an AWS reversal. Sell the class, not the anecdote that happened to be free.

Use the incident *after* identifying the buyer's specific risk. Otherwise kronos sounds like a cloud-billing product rather than an assurance framework.

## v2 correction 4 — retire the term "naive builder"

Multiple reviewers (ChatGPT, Grok) flagged that "naive builder" is internally descriptive but commercially corrosive. No one buys assurance from a company whose internal category for them implies incompetence.

The audience is:

- **AI-native app builders** (individuals shipping via Claude, GPT-4, Cursor, v0, Lovable, Bolt, Replit)
- **AI-assisted founders** (technical founders using AI tools to accelerate)
- **AI app studios** (agencies delivering client applications through generative-development platforms)
- **Product agencies** (traditional dev shops incorporating AI-assisted delivery)

Use these terms in all customer-facing material. Reserve "naive builder" for internal doc-writing only.

## v2 correction 5 — reposition as "independent release assurance for AI-built applications"

The v1 doc positioned Path B as another security scanner competing on scan-volume and freemium pricing. That is not a defensible category; incumbents have been tuning their checks for longer and platforms are absorbing basic security.

The stronger positioning per convergence reviewers is:

> **Kronos is the independent release gate for AI-built applications.**

Supporting statement:

> Kronos independently challenges your app's authentication, data boundaries, APIs, cost controls, and recovery mechanisms, then returns evidence and a fix plan your coding agent can execute.

This is meaningfully different from "we run another SAST/DAST scan." It reads as a *judgment* the buyer needs, not a *tool* they need to operate.

## v2 correction 6 — collapse the twelve dimensions to six release gates for the SaaS surface

The full framework's twelve scorecard dimensions are correct for the framework. They are wrong for the SaaS user experience. For an AI-native app founder, the six release gates are:

1. **Identity & Access** — auth enforcement, privileged routes, tenant isolation, session/token handling.
2. **Data & Privacy** — cross-user data access, public storage exposure, sensitive data in logs/errors, excessive collection.
3. **Secrets & Supply Chain** — repo-history secrets, client-side credentials, vulnerable dependencies, unsafe third-party integrations.
4. **APIs & Business Logic** — unauthenticated endpoints, parameter manipulation, payment/entitlement bypass, rate/abuse controls.
5. **Cost & Blast Radius** — unbounded model/storage/email/SMS consumption, public operations that generate large bills, tenant quotas, provider budgets, **physical and economic plausibility (the defensible wedge)**.
6. **Detection, Shutdown, Recovery** — monitoring + actionable alerts, kill-switch, credential-revocation path, rollback/restore, recovery verification.

The full 12-dimension scorecard remains the framework artifact; the six gates are what the SaaS surface shows.

## v2 correction 7 — split into two distinct products

A "paste a URL and get a report" product cannot honestly evaluate several of the checks that matter most (tenant isolation, kill-switch health, cost blast radius on the customer's own cloud account). Do not sell surface as depth.

Two products:

**Kronos Preflight** (free, lead generation)
- Passive; public URL and optionally public repository.
- Explicitly states: "Surface checks completed. Deeper authorization, data-isolation, cost, and recovery controls were not evaluated."
- Purpose: acquisition. Every free scan produces a follow-up path to Launch Review.

**Kronos Launch Review** (paid, productized service)
- Authorized staging assessment.
- Requires: staging URL, test users, deployment details, read-only cloud inventory, credentials via ephemeral scoped identity, explicit authorization.
- Deliverable: one-page founder view (Proceed / Proceed with conditions / Block release + three most consequential findings + six release-gate statuses + exact next actions + re-test status) plus technical appendix (evidence + reproduction + confidence + coding-agent-executable remediation prompts).
- Includes one remediation re-test.

Positioning Preflight as separate from Launch Review protects the framework's epistemic honesty — a surface scan does not claim to be deep assurance.

## v2 correction 8 — pricing hypothesis revised

v1 proposed $29/month for the Kronos Card SaaS. Convergence reviewers noted this sits directly beside Vibe App Scanner ($19/$39), StackHawk Vibe ($5), and free platform-native scans. At $29 kronos is forced to compete on scan volume and UI polish rather than differentiated value.

Revised pricing hypothesis (test, not lock):

| Offer | Initial price hypothesis |
|---|---|
| Kronos Preflight (passive URL scan) | Free |
| First five design-partner Launch Reviews | $750–$1,500 |
| Standard Launch Review after process stabilization | $2,500–$5,000 |
| Re-test beyond the included verification | $500–$1,000 |
| Recurring release monitoring (post-MVP) | $299–$799 per application/month |
| Enterprise Assurance Sprint | $15,000–$50,000 |

The essential correction: do not sell evidence-backed assurance for the price of an automated scanner. The product is *judgment*, not scanning.

## v2 correction 9 — consulting sequencing softened

v1 recommended enterprise consulting as a rigid 120-day prerequisite before validating the SaaS market. Convergence reviewers correctly noted this could turn kronos into a bespoke consultancy and delay validating whether the productized-service model actually clears.

Revised sequencing:

- **One assurance engine, two packages** — Launch Review for AI app founders and agencies (fixed scope, fixed price, short cycle, repeatable), Assurance Sprint for enterprise buyers (claim-level, eos integration, custom scope, higher price).
- **Sequenced but not gated** — enterprise engagements can fund the work AND validate against the SMB market can run in parallel if the operator's capacity permits. Do not gate SMB validation on landing three enterprise customers.
- **The SMB product validates repeatability and willingness to pay.** The enterprise work provides cash and deeper case studies.
- **Do not build two software products.** One engine, two packagings.

## v2 correction 10 — platform absorption risk

Lovable, Replit, Vercel, Netlify already ship security defaults. They are rationally incentivized to absorb more assurance as a native platform feature (Lovable already integrates Wiz and Aikido; Replit's Agent already reviews security). A standalone scanner is racing the platform to own the platform's own users' safety, and the platform wins that race.

Two responses:

- **Partner with platforms early** where possible (revenue-share integrations into Lovable / Bolt / Cursor / v0 / Replit).
- **Compete for the layer platforms don't own** — the user's own AWS / GCP / Salesforce account and its cost / recovery / cross-account surface. Which, conveniently, is exactly where the plausibility wedge lives.

## v2 correction 11 — the badge must expire and cannot claim "safe" or "secure"

Any public badge kronos ships must be tied to:

- Commit SHA or release identifier
- Environment (staging vs production)
- Catalog/check version at time of scan
- Assessment date
- Expiration date
- Explicit scope limitations

Wording that is permitted:
- "Kronos Checked — scoped release assessment completed"

Wording that is NOT permitted:
- "Kronos Safe"
- "Kronos Secure"
- "Kronos Certified"

The framework's own epistemic discipline (no framework can certify safety) applies to its marketing surface. Vibe App Scanner already ships a trust badge; kronos's badge earns credibility from transparent scope and evidence, not from novelty.

## v2 correction 12 — 90-day validation gates

Before proceeding from productized-service to self-service SaaS, hit the following gates:

- 10 paid Launch Reviews delivered.
- 3 strong testimonials or case studies published.
- 2 repeat or agency customers.
- Delivery process requiring < 4 human hours per standard review.
- Material incremental value beyond native Lovable/Replit security demonstrated in specific findings.
- At least 1 recurring-monitoring customer.
- No authorization, privacy, or execution-safety incident.

The first milestone is not 1,000 paid users. It is: 10 people paid kronos to tell them whether an AI-built application should launch.

## v2 corrections — summary

The v1 GTM sanity check remains directionally correct on: the design is over-scoped for either target market; the scorecard is the commercial primitive; consulting can fund product development; enterprise-consulting cash flow before SaaS spend.

The v1 GTM sanity check is factually wrong on: greenfield claim; competitor absence; $131B story as universal opener; $29/month pricing; the Kronos Card as first SaaS surface; "naive builder" terminology; the sequencing rigidity between enterprise and SMB.

Read the v1 sections below only through this v2 addendum. When they disagree, v2 wins.

---

# v1 sanity check (preserved for provenance)

## Context

The operator completed the initial four-LLM design review round (Claude on v0, ChatGPT on v0, Grok on v0.1, Gemini on v0.3) and expressed three concerns:

1. The scope has ballooned to a point where it is difficult to process the design as a single artifact or to plan a go-to-market strategy against it.
2. They want to know whether the idea is genuinely good given the competitive analysis surfaced across the review rounds.
3. They want to know what other products in the market do what kronos aims to do, especially for the small-to-medium market of "app developers who are really just Claude users or Loveable users" — the exploding population of non-engineers now shipping production apps.

The operator asked for a sanity check before initiating a final review round.

## TL;DR

The idea is real, the design is over-scoped for either target market, the naive-builder market is genuinely greenfield and worth the bet, the enterprise market is crowded but the narrative differentiators are real. The right sequencing is **enterprise-consulting first to fund SaaS second**, not both simultaneously. Cut the MVP scope by 90% for the SaaS product — one page, six checks, a card. The 20-ADR framework is what runs underneath, not what the user sees. What comes next is code, not more design. The design is done enough.

---

## Question 1: Is the idea good?

**Yes, the idea is good.** Specifically:

**What is genuinely good:**

- **The founding incident is real and memorable.** Every sales conversation should open with the $131B story. That is a hook competitors cannot manufacture — origin stories cannot be back-invented.
- **The physical-plausibility oracle is genuinely unique.** No competitor in the BAS / pen-test / CSPM space computes "is this cost physically achievable given declared infrastructure." That is defensible IP-adjacent territory whether or not it becomes a patent.
- **The claim-centric evidence model is epistemically stronger than binary safe/unsafe.** Enterprise security buyers who have been through SOC 2 fatigue will recognize this and it will resonate.
- **Git-native evidence is genuinely portable and philosophically consistent.** Vendor-cloud finding databases (which is what AttackIQ, SafeBreach, and Cymulate all use) are locked into their vendor. Kronos evidence is not.
- **The dialectic with eos is smart consulting-practice packaging.** "Attest what it does + falsify that it holds" is a two-product story that sells better than either product alone.

**Honest concerns:**

- **Scope has ballooned.** 20 ADRs, 10+ methodology documents, multidimensional scorecards, three-axis authorization, autonomous machine identity, two-tier evidence, continuous plane, MCP runtime graph validation. This is a v3.0 product, not an MVP. The operator's overwhelmed reaction is proportionate to the scope — no small team ships this in 90 days.
- **The current design serves neither target market cleanly.** It is too intellectual for a Loveable / Bolt / Cursor user who just wants to know "will this get me sued." It is not obviously differentiated for a Fortune 500 CISO who already has AttackIQ + Wiz + Snyk in their stack.
- **The multidimensional scorecard is beautiful but not what a CFO reads.** "Effectiveness: survived + Confidence: high + Freshness: 12 days + Environment fidelity: staging" is an engineering artifact. Executive rendering must collapse to one sentence + one color for board-level consumption. The engineering-facing view can be as sophisticated as the design specifies; the executive view cannot.
- **Consulting-first is where near-term revenue actually is.** The tool supports the consulting; the consulting funds the tool build. Trying to launch SaaS + consulting simultaneously with the current design is a scope trap.

## Question 2: A simple GTM for MVP

**Radical scope cut for MVP. Pick one audience first. Sequence, do not parallelize.**

### Path A first: enterprise consulting beachhead (0–120 days)

- **Product:** the framework as it exists, applied by hand to 1–3 named enterprise customers.
- **First customer:** olympus-616 itself. The reference implementation is the case study. Get the L14 CloudFront engagement done. Ship the finding. That is the demo.
- **Second customer:** whoever will pay $15–50K for a scoped adversarial assessment. Prospect from the operator's own network — the operator knows Salesforce ecosystem people; they have security budgets and no adversarial tooling.
- **Third customer:** similar.
- **Revenue target:** $50–150K in engagement fees within 120 days.
- **Purpose:** prove the framework works on real customers, produce three case-study writeups, fund Path B.

**Nothing else during Path A.** No SaaS. No runner scaffold. No continuous plane. Just consulting engagements using the framework by hand, producing markdown findings, using the scorecard as a customer artifact.

### Path B second: naive-builder MVP (120–240 days, funded by Path A revenue)

- **Product name:** "Kronos Card" (or similar brand-namable). The scan output IS the product.
- **Surface:** hosted web service. User enters GitHub repo URL. Service runs 15–20 pre-canned checks. Produces **one HTML page.**
- **The page** shows: 3 findings ranked by "how bad if this happens," a card image suitable for embedding as a GitHub README badge, a scorecard with 5–6 traffic-light cells, one paragraph on remediation per finding.
- **What it checks (concrete first set):**
  1. Secrets committed to the repo history
  2. Auth surface reachable without valid session
  3. Cost blast radius (physical-plausibility on declared deployment)
  4. Third-party dependencies with known CVEs
  5. Kill-switch presence (can this thing be turned off in a hurry?)
  6. Data exfiltration surface (does the app leak user data via error messages, telemetry, or endpoint enumeration?)
- **Pricing:**
  - Free card, generated once per repo
  - $29/month for monthly re-runs + remediation-suggestion detail
  - Enterprise tier $299/month for private-repo access + team scoreboard
- **Distribution:** viral badge loop. Every free scan produces a shareable badge. Hacker News + Twitter + Product Hunt launch. Then Cursor / Loveable / Bolt / v0 community forums.
- **Not the full framework.** The 20 ADRs, the two planes, the three-axis authorization — none of that is in this product's user surface. It runs canned checks and produces a card. Under the hood the framework is running (this is the same engine as Path A), but the surface is dead-simple.

### Path C never: try to build both simultaneously

Do not. It is the classic platform-trap failure mode. The framework can serve both markets if the SaaS surface is built as a thin projection on top of the enterprise framework, but the SaaS surface is built after the enterprise framework has three paying customers. Not before.

### Consulting practice inside Path A

- **Positioning:** two-product engagement (eos + kronos) or single-product engagement (kronos-only for prospects without existing attestation).
- **Engagement shape:** 6–12 weeks, one target, 3–5 challenges executed, deliverable is a scorecard + findings + remediation roadmap.
- **Pricing:** $15–50K first engagement, $5–20K/month for continuous-coverage subscription after remediation.
- **Sales narrative:** open with the $131B founding-incident story. Frame kronos as "we tell you what could ruin your Sunday morning before it does." That framing works for both technical and executive buyers.

## Question 3: Is there anything like this in the market?

### Enterprise adversarial-testing market — crowded

| Product | What it does | How kronos differs |
|---|---|---|
| **AttackIQ, SafeBreach, Cymulate** | Breach-and-attack simulation. Continuous control validation. Vendor-cloud evidence store. | Kronos evidence is git-native + public-by-default (if the target chooses). Kronos is open-source (AGPL). Kronos does physical-plausibility oracles that BAS platforms do not. |
| **Pentera, Horizon3.ai** | Autonomous pen-testing. Finds paths from external attacker to crown-jewel data. Both funded / IPO'd. | Kronos is claim-centric ("did this defense fire") vs. exploitation-path-centric ("here is a shell"). Different question, different buyer. |
| **XM Cyber** | Attack path management. Acquired by Schwarz Group ~$700M. | Similar shape to Pentera. Kronos verifies attestations rather than finds paths. |
| **Wiz, Prisma Cloud, Orca Security** | Cloud security posture management. Passive scan against IaC and running resources. | CSPM is passive-only; kronos actively challenges. Kronos treats cost / plausibility as peer to security. |
| **Snyk, GitHub Advanced Security, Semgrep** | SAST / DAST + dependency scanning. Engineering-facing. | Different layer. Kronos consumes their output as one input rather than replacing them. |

The enterprise market has real competitors with real revenue. Defensible differentiators are: git-native evidence + open-source + physical plausibility + claim-centric epistemology + dialectic with attestation. That is a **narrative differentiation** more than a **feature differentiation**. Enterprise buyers will need to be convinced that the narrative is worth switching for. Cost of that conviction is the sales cycle.

### Naive-builder market — greenfield, materially uncontested

No known direct competitor. Adjacent products:

| Adjacent product | What it does | Why it is not kronos |
|---|---|---|
| **Snyk, Semgrep** | Static analysis + dependency scanning | Engineering-facing. Requires the user to understand what a CVE is. |
| **Vercel / Netlify security features** | Basic security defaults + minor scanning | Thin, embedded, not a separate report the user reads. |
| **Cloudflare** | WAF + bot control | Runtime defense, not assessment. |
| **Sentry, LogRocket, Datadog** | Observability, error tracking | Observes what happened; does not tell the user what could happen. |
| **Nothing** | "Point at your vibe-coded app and tell me if I am about to get sued" | The gap kronos aims at. |

**Why the gap exists:** the market only exists because Claude Sonnet 3.5+, GPT-4, Cursor, v0, Loveable, and Bolt made real production apps buildable by non-engineers within the last 12–24 months. Nobody has built assurance for this market yet because the market did not exist to have assurance products built for it. Kronos would be first. First-mover advantage is genuinely defensible if capture is rapid.

**Risks in the naive-builder market:**

- **Market education cost is real.** Non-engineers do not know they need this. Meaningful effort must be spent teaching them that their vibe-coded app has an attack surface.
- **Willingness to pay is untested.** $29/month may be too high for hobbyists and too low for the semi-professional builders who are the actual target. Pricing will need iteration.
- **Distribution is hard.** GitHub badges + Twitter + Hacker News + Product Hunt is the classic dev-tools playbook, but Loveable / Bolt / Cursor users are not all on those channels. May need to partner with the platforms themselves via revenue-share integrations.
- **Unit economics must work.** If each free scan costs $5 in compute, freemium does not work. The technical bar is "sub-$0.50 per scan or the model is broken."

**Risks in the enterprise market:**

- Competitors have 50–500 engineers. Kronos has the operator + Claude. Feature parity is impossible. Narrative differentiation and specific-customer-fit is the only viable path.

## The sanity check in one paragraph

The idea is real, the design is over-scoped for either target market, the naive-builder market is genuinely greenfield and worth the bet, the enterprise market is crowded but the narrative differentiators are real. The right sequencing is enterprise-consulting first to fund SaaS second, not both simultaneously. Cut the MVP scope by 90% for the SaaS product — one page, six checks, a card. The 20-ADR framework is what runs underneath, not what the user sees. If the operator wants to close naive-builder deals, those users must never see the phrase "three-axis authorization envelope" — they must see a card that says "your app has 2 things that could ruin your weekend" and a button that says "fix them for $29."

## Recommendation for next steps

**Immediately:**

1. Complete the final review round with the four LLMs. Do not let reviewers add more scope. Convergence signal is "two consecutive reviewers propose only cosmetic changes."
2. Merge the design-v0.4 branch. Design is done enough.

**Weeks 1–4:**

3. Draft the first engagement plan for olympus-616 (L14 CloudFront) using the v0.4 framework. This is Path A's first customer.
4. Reach out to 3–5 prospects from the operator's Salesforce-ecosystem network. Pitch a scoped adversarial assessment.

**Weeks 4–12:**

5. Execute the olympus-616 L14 engagement. Ship the finding. Write the case study.
6. Sign the first paying engagement. Execute. Case study.

**Weeks 12–20:**

7. Sign the second and third paying engagements.
8. Begin drafting the Kronos Card SaaS spec — one page, six checks, freemium pricing, viral badge loop.

**Weeks 20–36:**

9. Build the Kronos Card MVP as a thin projection on top of the framework used in Path A.
10. Launch. HN + Twitter + Product Hunt. Partner outreach to Loveable / Bolt / Cursor / v0.

**What comes next after the initial cycle:**

- If Path B (SaaS) gets to 1,000 paid users, double down on SaaS.
- If Path B underperforms but Path A has 5+ enterprise customers, become a consulting-led enterprise platform. Do not force SaaS.
- If both work, the operator has a real business.

## What this document is not

This document is not a design update. It is not a review by another LLM. It is not a decision the operator is expected to accept as-is. It is a sanity check the operator asked for, delivered in the operator's requested form (an actual document alongside the design), so that when the operator returns to strategic thinking after the final review round they have this reflection to read alongside DESIGN.md.

If the operator disagrees with any recommendation, the design does not need to change. This document informs GTM. Design informs product. GTM and product interact but are not the same artifact.
