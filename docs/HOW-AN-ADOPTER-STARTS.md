# How an adopter starts — one-page flow

**Purpose:** the minimum viable adoption path for kronos, using only the primitives that exist in the frozen v0.5 design. Written per Grok's convergence-round recommendation so that a first-time adopter has a legible starting flow without needing to read the full DESIGN.md + 20 ADRs first.

**Audience:** an operator responsible for a target system (an application, a service, a cloud account, a Salesforce org) who wants to install kronos and produce a first meaningful engagement.

**Prerequisite:** git and a text editor. That is all. No runner, no CLI, no framework runtime is required for the first engagement — the discipline is filesystem-native.

---

## Step 1 — Copy the templates

From the root of your target repository:

```bash
# Bring in the engagement kanban tree.
cp -r <path-to-kronos-clone>/templates/engagement ./kronos/engagement

# Bring in the operating manual so contributors can find the discipline.
cp <path-to-kronos-clone>/methodology/OPERATING-MANUAL.md ./kronos/README.md
```

Your target repository now contains a `kronos/` folder with an empty eight-stage kanban and the engagement template.

## Step 2 — Configure your target scorecard

Edit `./kronos/engagement/SCORECARD.md`. Fill in the YAML frontmatter:

- `target.slug` — a short identifier for your target (e.g., `acme-checkout-api`).
- `target.display_name` — human-readable name.
- `target.primary_repository` — the GitHub `owner/repo` this target lives in.
- `catalog.version` — pin to the current catalog version (e.g., `kronos-catalog-2026.07.24`).
- `integration.eos_folder` — if you have eos co-installed, point at its cycle folder. Otherwise remove the line.
- `integration.capacity_model` — if you will use the plausibility monitor, point at your capacity model file. Otherwise remove the line.

Commit this file. Your scorecard renders at L0 across all dimensions (no evidence yet).

## Step 3 — Identify your first claim

Pick one specific claim about your target that you want to challenge. Examples:

- "The `/api/v1/orders` endpoint returns 401 to any request without a valid session."
- "The staging Salesforce org's Guest User profile cannot read `Account.SSN__c`."
- "The AWS account's monthly cost cannot exceed $500 given declared infrastructure."
- "A malformed webhook payload does not cause the retry queue to overflow."

Write the claim as a testable proposition. Give it a stable identifier: `CLAIM-<target>-<slug>` (e.g., `CLAIM-acme-checkout-api-auth-boundary`).

## Step 4 — Author the first engagement document

Copy `./kronos/engagement/TEMPLATE.md` to `./kronos/engagement/00_scope/<target-slug>.kronos-1.md`.

Fill in the top half (approver-authored):

- **§1 Target boundary** — what surface the engagement covers; what is explicitly out of scope.
- **§2 Authorization artifact** — sign this yourself if you are the target's owner, or have the accountable party sign. Include the `incidentState` block (default: not-declared, dataClassPreservation enforced). Include the `chainOfAuthorization` block if the challenge touches third-party platforms (AWS, GCP, Salesforce).
- **§3 Rules of engagement** — pick execution policy (`passive` for read-only reconciliation; `impact-bounded` with first-signal-stop for active challenges; `campaign-complete` only in isolated lab).
- **§4 Threat model class** — reference the catalog entry your claim relates to.
- **§5 Approver sign-off** — check the boxes.

`git mv` the document to `./kronos/engagement/01_authorized/`.

## Step 5 — Decompose the plan

Fill in the bottom half (agent-authored, but you can do this yourself for the first engagement):

- **§6 Target model** — what defenses you claim exist and where.
- **§7 Attack matrix** — the specific probe(s) you will run.
- **§8 Attack oracles** — the deterministic assertions that determine pass/fail. Reference observable signals only (metric increments, log lines, response codes, database state).

`git mv` to `./kronos/engagement/02_planning/` while decomposing, then to `./kronos/engagement/03_ready/` when §5 is signed and §6-§8 are complete.

## Step 6 — Execute

For the first engagement, execute by hand:

1. `git mv` to `./kronos/engagement/04_running/`.
2. Run each attack in §7 manually (`curl`, browser, AWS CLI, whatever the challenge specifies).
3. Capture the request, response, and any telemetry signal as evidence. Hash each artifact with SHA-256. Store under `./kronos/evidence/<engagement-slug>/`.
4. Record each attack invocation in §9 execution log with the evidence hash.
5. For each attack, evaluate its oracle against the evidence. Record the verdict (one of the ten outcomes in ORACLE.md).

`git mv` to `./kronos/engagement/05_evidence/` when the matrix is complete.

## Step 7 — Findings and scorecard

For each oracle that returned `CLAIM_FALSIFIED`, `PARTIAL_OR_DEGRADED`, or `OBSERVABILITY_GAP`, write a finding markdown at `./kronos/findings/<finding-id>.md`. Include:

- Severity (derived from impact + exploitability + reachable assets + compensating controls + data/privilege impact + business consequence — not fixed by falsification alone).
- Reproduction instructions.
- References to the evidence artifacts.
- Suggested remediation.

Update the scorecard's affected dimensions in §11 of the engagement document. A `CLAIM_SURVIVED` outcome updates the dimension's effectiveness state to `survived` and increments its coverage; it does not automatically bump maturity level. A `CLAIM_FALSIFIED` outcome updates effectiveness to `falsified` and leaves maturity unchanged (a mature process with a failing output is both, simultaneously).

## Step 8 — Ship

Write §13 closeout. `git mv` to `./kronos/engagement/06_shipped/`. Commit.

If eos is co-installed and this engagement falsified an eos-attested claim, file a new backlog cycle in `./foundation/eos/cycle/00_backlog/` naming the falsified claim and pointing to the kronos evidence.

## What you have now

- One typed engagement document permanently recording what was tested, how, when, by whom, with what evidence.
- Zero or more finding documents outliving the engagement, with lifecycle state you will maintain (open → remediation-in-progress → awaiting-reverification → resolved).
- A scorecard cell (or cells) updated with the engagement's findings.
- A repository state that any auditor can inspect independently — the discipline is git-native, no vendor cloud, no proprietary format.

## What comes next

- **Second engagement against the same target** — pick a second claim and repeat. Coverage grows.
- **Enable the continuous plane** — write a capacity model for your target (see `PLAUSIBILITY-MONITOR.md`) and schedule the plausibility monitor to run reconciliations on a cron cadence. This runs outside the engagement lifecycle and produces findings when observations exceed physical bounds.
- **Adopt the runner** — when the React/TypeScript runner ships, point it at your target's repository and it renders the kanban + scorecard in the browser. Nothing about your engagement documents changes.
- **Autonomous authorization** — if your target needs I0-I1 continuous evaluation without per-invocation human signatures, issue a StandingAuthorization (see `AUTONOMOUS-AUTHORIZATION.md`) delegating authority to a hardware-backed machine identity within the envelope.

## What you do NOT need at first

- The React runner (renders the scorecard but doesn't produce it).
- The oauth-server (only needed for GitHub App OAuth deployments; PAT works otherwise).
- The GitHub Actions (enforce discipline in CI but not required for the discipline itself).
- The two-tier evidence protected-store (only needed for sensitive raw artifacts; sanitized manifests in git work for the first engagement).
- The autonomous authorization envelope (only needed for machine-authorized evaluations; human signatures work for the first engagement).
- Every ADR (they are architecture rationale; they inform the framework but not your first adoption step).

Start small. One engagement, one claim, one week. Grow coverage from there.
