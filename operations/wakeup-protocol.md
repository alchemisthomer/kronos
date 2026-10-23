# Wakeup protocol

> *When the Operator wakes, this is the order.*

This is the standard operating procedure the Kronos operator-agent follows at the start of a session. It converts the raw signal of "the world has moved since you last looked" into either (a) new reckoning posts, (b) scorecard updates on existing targets, or (c) the correct answer *nothing to report, go back to sleep*.

The protocol has one hard rule: **cite Tier 1 before you write.** A post that cites only Tier 2 or Tier 3 (see `../methodology/SOURCES.md`) is not a reckoning; it is reportage of reportage, and Kronos does not publish that.

## Step 0 — Orient

Before scanning sources, confirm the operator's current state:

1. What date is it (actual UTC, not from training data)?
2. What is the HEAD commit of this repo's default branch?
3. What posts are currently in `docs/blog/index.json`?
4. What claims are currently in `methodology/claims/`?
5. Are there any `kronos/engagements/*/04_running/` folders — meaning there's an in-flight engagement whose findings may need to drop a target reckoning this cycle?

If any of these are unknown, stop and resolve them before writing.

## Step 1 — Mandatory scan (Tier 1)

The operator scans the following sources in order and takes note of anything that has moved since the previous wakeup:

1. **CISA KEV catalog** — https://www.cisa.gov/known-exploited-vulnerabilities-catalog — any new entry added. KEV additions are the strongest signal that a primitive is under active attack.
2. **MITRE CVE / NVD** — any CVE with CVSS ≥ 7.0 that affects a target in Kronos's holder-class lists (see each claim doc). Filter to the last 7 days; broader if resuming from a long gap.
3. **Vendor advisories** for the subset of vendors Kronos has a current engagement with or whose incidents would affect Olympus-Grid's own infrastructure stack. Minimum: Salesforce, AWS, Google Cloud, Apple, Microsoft, GitHub.
4. **PaaS peer disclosures** — Vercel, Netlify, Render, Fly, Supabase, Firebase, Heroku. These are structural peers of Olympus-Grid; any incident here is a candidate for an incident reckoning that names a shared primitive.
5. **LLM-provider status pages** — OpenAI, Anthropic, Google, xAI. Athena's upstream risk.
6. **GitHub Security Advisories** scoped to the ecosystems Olympus-Grid depends on (npm, maven, pypi, actions).
7. **HaveIBeenPwned** — any new breach with scope ≥ 100k accounts.

A clean scan with nothing new is a valid outcome. Record the wakeup in `operations/wakeup-log.md` (append a one-liner with date + "nothing to report") and sleep.

## Step 2 — Triage

For each item that moved, decide which of three buckets it belongs to:

**Bucket A — Incident reckoning candidate.** The incident shows a primitive failing in a system whose holder-class is already in a Kronos claim, OR it demonstrates an unmeasured primitive that may admit a new claim.

- If it maps to an existing claim: draft an `incident` post. Reference the claim in `claims_touched` frontmatter.
- If it demonstrates a NEW primitive: draft a `doctrine` post that admits a new claim. Also create the claim doc + oracle doc under `methodology/claims/` and `methodology/oracles/`.

**Bucket B — Scorecard update candidate.** The incident changes an existing scorecard entry (usually downgrading a target to L0 under the claim that just failed for them). No new post required; just update `methodology/SCORECARD.md` (once it exists) and note the delta in the next composite post.

**Bucket C — Signal, not report.** The incident is interesting but doesn't yet have enough Tier 1 corroboration to post. Record in `operations/signal-log.md` and continue monitoring.

## Step 3 — Write (if any Bucket A)

The post structure is defined in `../docs/blog/README.md § Post format` and must have the four mandatory sections. In addition, every post written under this protocol MUST include an **In Response** section (see below).

### The "In Response" section

Every reckoning closes with a block headed `## In Response` that answers: *given this incident, what is the Operator (CloudPremise / Olympus-Grid) actually doing differently?*

The answer has one of four shapes:

1. **Hardening in progress.** A specific control change in Olympus-Grid or a specific Kronos engagement is being opened. Name the change, name the PR or engagement folder, state the target completion date.
2. **Already covered — evidence pointer.** Olympus-Grid already addresses the primitive. Cite the specific control (e.g., "Ares cookie-to-header middleware + SSM SecureString for cosmos-logos private keys addresses the retrieval-boundary subtest of K-C1"). Link to the file. State what evidence would be needed to upgrade from L? to L2.
3. **Deliberate deferral.** The Operator has considered the primitive and decided not to invest further right now. State why. State the condition under which the deferral would be revisited. Deliberate deferral is a legitimate posture; silent deferral is not.
4. **Nothing yet.** The Operator has not responded. Say so. Set a decision window. Nothing-yet is honest, better than a fabricated response.

The In Response section is the piece of each reckoning that makes the blog **a working surface, not an outside-looking-in commentary.** Kronos devours its host too. Every incident in the world is also a question about Olympus-Grid's posture against the same primitive.

### Linking out

Every post links to:

- The primary source (Tier 1) in the `targets[].url` frontmatter field.
- The relevant Kronos claim(s) in `claims_touched`.
- The relevant OWASP / NIST / CWE / SOC 2 identifiers inline in the body, per `../methodology/STANDARDS.md`.

If a post names an external standard, it MUST use the exact identifier (e.g., `OWASP A02:2021`, `CWE-312`, `NIST SP 800-53 SC-28`, `SOC 2 CC6.1`). Loose references like "the OWASP cryptographic failures thing" are rejected at review.

## Step 4 — Commit

Each post is one commit. Each `index.json` update that adds the post is part of the same commit. The commit message follows the format:

```
reckoning(incident|target|doctrine): <slug>
```

e.g. `reckoning(incident): 2026-10-21-railway-credential-envelope-collapse`.

Push to a branch. Open a PR against the default branch. The Steward's PR review is the publication gate.

## Step 5 — Log and sleep

Append a one-liner to `operations/wakeup-log.md`:

```
YYYY-MM-DD HH:MM UTC — <posts drafted> | <scorecard updates> | <signals logged>
```

If no posts drafted, the line is still appended with the counts. The log is the audit trail of the Operator's attention.

## Edge cases

### Multi-vendor incidents

An incident that affects multiple vendors (e.g., a CVE in a library used by many targets) gets ONE post. The post lists all affected vendors in `targets`. Don't post one-per-vendor.

### Olympus-Grid is directly involved

If an incident has Olympus-Grid as the breached party (not just a holder of the primitive), the post is `kind: target`, not `kind: incident`. Target reckonings require explicit Steward sanction per the self-disclosure protocol in `../docs/blog/concept.md`. Do NOT draft a target reckoning about Olympus-Grid without first checking in.

### A post you drafted turned out to be wrong

Retract via a NEW commit that sets `status: retracted` on the post frontmatter and prepends a retraction notice to the body. Reckonings are never deleted. The retraction notice is itself an In Response block for the retraction event.

### You wake up and the world has moved a lot

If the operator has been asleep for a week or more and the Tier 1 scan reveals a backlog, do NOT try to catch up all at once. Pick the two or three most structurally important items, write those, log the rest as signals, and let the backlog surface in subsequent wakeups. A Reckonings post that was rushed is worse than a Reckonings post that didn't exist.

## Cadence commitment

Kronos commits to **one wakeup pass per 24-hour window at minimum.** The commitment is to the reader of Reckonings: *the horizon is being scanned on a known cadence, by a named discipline, and the log of attention is public.* A reader who checks `operations/wakeup-log.md` can see the exact pattern of operator attention over any window they care to measure.

**The commitment holds whether or not an incident surfaces.** A clean scan with "nothing to report" is a valid outcome and gets logged with the counts and the sources scanned. **Silently skipping a day is a protocol violation** — it breaks the audit trail of attention that gives the Reckonings blog its structural trust claim.

### Current state — manual cadence

Each wakeup pass is currently triggered by invoking a Kronos operator-agent session (human-invokes-Claude-Code-in-kronos-mode). The operator-agent executes Steps 0 through 5 above and appends to `wakeup-log.md`.

### Automation roadmap — the Kronos dedicated agent + scheduled worker

Target state has two parts, both planned, neither shipped yet:

**(a) Dedicated Kronos operator-agent in the fleet-launcher.** Current state: Kronos is a mode of the general `alchemisthomer` operator-agent. Target state: a Kronos-named agent assignable from the fleet-launcher (`alchemisthomer.sh` family), with the dual mandate (devour + scan+pivot per [`../CLAUDE.md § The two-part Kronos mandate`](../CLAUDE.md)) baked into its persona. The dedicated agent carries the Reckonings blog, the engagement surface, and the horizon-scan responsibility as its full scope. Spec work pending.

**(b) Scheduled worker that invokes the dedicated agent.** Options:

1. **GitHub Actions on cron.** A workflow at `.github/workflows/daily-wakeup.yml` fires daily (e.g. 09:00 UTC), invokes the dedicated Kronos agent (via Claude Agent SDK + Steward credentials), passes it the current repo state, and lets it run through Steps 0-5. The agent writes any new reckonings as a PR for Steward review (never auto-merges).
2. **Always-on runner.** A Kronos-dedicated runner (ECS task, cron on a persistent host, or similar) holds the operator-agent process alive and triggers Steps 0-5 on a tick. Lower latency than Actions-on-cron; higher operational cost.
3. **Steward-triggered until automation ships.** Current state. The Steward invokes a session; the session runs the scan; the log appends. The reader of Reckonings can measure cadence from the public log.

The scheduled-worker piece requires the Agent SDK's `AUTHORIZATION.md` posture to be solved — a scheduled worker running autonomously needs a durable sanction artifact for the "non-interactive wakeup pass" scope. Not technically hard; design work pending.

**Interim rule for the manual cadence.** Every operator-agent session invoked for Kronos work **MUST** check the tail of `operations/wakeup-log.md` as its first action. If the last entry is more than 24 hours old, running the wakeup scan is the first action of the session — before any other work the Steward may have requested. The Steward's request still gets served; it gets served *after* the scan. See [`../CLAUDE.md § Bootup checklist`](../CLAUDE.md) for the full ordering.

## The Kronos agent persona — devour AND scan

Kronos is **not only** the adversarial-assurance operator that attacks authorized targets. Kronos is also the **continuous horizon-scanner** that keeps the claim set honest.

- **Devour** — authorized engagement runs, target reckonings, scorecard deltas. The "break what claims to be unbreakable" half.
- **Scan + pivot** — Tier-1 feed scan on cadence, Reckonings posts drafted for every structural movement in the public record, the claim set amended when the horizon reveals a primitive the canon doesn't yet cover. The "watch what the world shows and update the discipline" half.

Both halves are the job. The job never goes offline. See [`../CLAUDE.md § The two-part Kronos mandate`](../CLAUDE.md) for the role definition and the bootup checklist.
