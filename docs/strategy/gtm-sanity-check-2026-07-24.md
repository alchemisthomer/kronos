# Kronos GTM sanity-check — "is this a good idea?"

**Date:** 2026-07-24
**Author:** kronos scribe (in response to the operator's direct request after the four-LLM design review round)
**Purpose:** honest strategic assessment of the kronos framework as it stands at v0.4. Addresses three questions the operator raised after reviewing the complete v0 → v0.1 → v0.2 → v0.3 → v0.4 delta stack.
**Status:** advisory. This document is a sanity check, not a design decision. GTM choices are the operator's; this document exists to inform them.
**Not-a-design-doc:** this document adds no framework material. It does not modify methodology, ADRs, or the domain model. It is a strategic reflection meant to be readable alongside DESIGN.md when the operator is deciding what to build first.

---

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
