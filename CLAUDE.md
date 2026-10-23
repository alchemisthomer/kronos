# CLAUDE.md — operator-agent guidance for kronos

This file provides guidance to Claude Code and equivalent AI operators when working in the `alchemisthomer/kronos` repository.

## First rule — the load-bearing constraint

**This repository is a public framework template. Real engagement content must never be committed here.**

If a human operator asks you to scaffold or author engagement content (any `<real-target-slug>.kronos-N.md`, a `SCORECARD.md` naming a real client, an attack matrix targeting a real system), **stop and ask where the work should live before doing anything.** The correct answer is always one of:

- The client's own repo (they've forked or cloned kronos into their access-controlled space).
- A private operator-owned repo (e.g. `<operator-org>-private/<client-slug>-kronos`).
- A local operator workspace (e.g. `/Users/<operator>/temp/<client-slug>-kronos/`).

Never `engagement/` at the root of this repository. See [`SECURITY.md`](SECURITY.md) for the full policy and its history.

## What is safe to author here

- Everything under `methodology/` — the operating manual, scorecard model, oracle state machine, evidence model, catalog governance, tool binding contract, industry alignment, autonomous authorization envelope, plausibility monitor, continuous assurance plane.
- Everything under `templates/` — the empty-slot engagement kanban, the TEMPLATE.md scaffold, the SCORECARD.md configuration schema. **Never populate `templates/engagement/<stage>/*.md` with a real target slug.**
- Everything under `tools/` — framework-shipped reference tools with target-agnostic code. Every tool's `credentials/` directory has a `.gitignore` blocking real credential files; every tool's `output/` directory is entirely gitignored. **Never disable or weaken those gitignores.**
- Everything under `docs/` — ADRs, methodology examples, the founding-incident case study. Example engagements in `docs/examples/` use dummy target slugs (`acme`, `example-corp`) and dummy identifiers only.
- Everything under `runner/`, `oauth-server/`, `actions/` — currently README-only, becomes framework infrastructure code.
- Root files: `README.md`, `LICENSE`, `DESIGN.md`, `CLAUDE.md`, `SECURITY.md`, `.gitignore`, and future `PATENT-DISCLOSURE-DRAFT.md` / `WHITE-PAPER.md` / `SOC2-CONTROL-MAPPING.md`.

## Escalation protocol when you receive an engagement-authoring request

1. **Pause the request.** Do not create files at `engagement/*.md` inside this repo, even provisionally.
2. **Ask the operator where the engagement should live** (client repo? private operator repo? local temp?). Wait for a specific path.
3. **If the operator confirms a location outside this repo, proceed there.** Copy `templates/engagement/` to the specified path and author the engagement doc in that location.
4. **If the operator insists on authoring inside this repo anyway,** decline and explain the framework-only rule with reference to `SECURITY.md`. Force the operator to override explicitly. Log the override in the response so it's visible in the transcript.

## Git discipline

- Default branch is `brain/2.7.x.x`. Do not commit to it directly.
- Feature work uses `git newthought <slug>` to create a per-thought branch and `git savethought "<slug>"` to commit+push.
- **`git mv` does NOT stage subsequent content edits on the moved file.** If you both move a file and edit its content, `git add <newpath>` explicitly before `git savethought`, or the content edit will silently drop from the commit.
- Never force-push without explicit operator approval (per the destructive-action rule).
- Never `git add -A` or `git add .` without first running `git status` and verifying no unwanted files (node_modules, credentials, output CSVs) are about to be staged.

## Content isolation guardrails

The framework enforces isolation structurally at four layers (see [`SECURITY.md`](SECURITY.md) §Enforcement):

1. **`.gitignore`** blocks `/engagement/` at root plus credential and output paths.
2. **Pre-commit hook** at [`.githooks/pre-commit`](.githooks/pre-commit) runs the validator on staged files.
3. **GitHub Action** at [`.github/workflows/content-isolation.yml`](.github/workflows/content-isolation.yml) runs the validator on every PR — cannot be bypassed locally.
4. **Review gate** on top.

**Before opening any PR, run the validator manually as well** — the CI check is a safety net, not a substitute for local verification:

```bash
./scripts/verify-no-client-content.sh              # scan whole tree
./scripts/verify-no-client-content.sh --staged     # scan just staged changes
./scripts/verify-no-client-content.sh --diff origin/brain/2.7.x.x   # scan diff vs base
```

The validator flags: Salesforce org Ids matching `00D...`, user Ids matching `005...`, real tenant hostnames matching `*.my.salesforce.com` / `*.my.site.com`, real credential files under `credentials/`, and any root-level `engagement/` folder. Dummy identifiers (`00D000000000000AAA`, `005000000000000AAA`, `example.my.salesforce.com`, `acme.my.salesforce.com`, `user@example.com`) are whitelisted.

**If a hit is a real client identifier: stop. Do not push. Do not attempt to fix it with a follow-up commit that "removes" the string — the removed value stays in git history.** See [`SECURITY.md`](SECURITY.md) §"What to do if client-identifying content is committed here anyway" for the correct remediation.

**Never bypass the hook with `--no-verify`.** The GitHub Action will still catch the violation, but the local bypass is itself a red flag.

## The two-part Kronos mandate — devour AND scan

Kronos is **not only** the agent that attacks authorized targets. Kronos is also the agent that **scans the horizon continuously** and **pivots the discipline** in response to what the world shows.

### Devour — the engagement half

- Author engagement docs under authorized target scopes (in adopter / private-operator repos, never here).
- Run `O-*` oracles. Produce evidence. Publish target reckonings per the self-disclosure protocol.
- Hand findings to the owning remediation agent via [`findings/`](findings/).

### Scan + pivot — the Reckonings half

- **Every operator-agent session wakes with a Tier-1 scan** per [`operations/wakeup-protocol.md`](operations/wakeup-protocol.md). Non-optional. The protocol specifies which sources, what triage buckets, when to draft, when to log a signal, when to log a clean pass. A clean pass is a valid outcome; **silently skipping the scan is not.**
- **Daily cadence commitment.** Kronos commits to one scan pass per 24-hour window at minimum. The current cadence is manual: an operator-agent session is invoked and the scan runs. Automation to a scheduled worker (GitHub Actions on cron, or an always-on runner) is a future-work item documented in [`operations/wakeup-protocol.md § Automation roadmap`](operations/wakeup-protocol.md). Until automation lands, every bootup of this agent **must** check the last entry in [`operations/wakeup-log.md`](operations/wakeup-log.md) — if it is more than 24 hours old, running the scan is the first action of the session, before any other work the operator may have requested.
- **Pivot responsibility.** When the scan surfaces a primitive the claim set does not yet cover, Kronos admits it (doctrine reckoning + claim doc + oracle doc). When a sub-primitive emerges across multiple incidents, Kronos admits it as a sub-primitive or sibling claim. When an existing claim's scoring floor moves (K-C6 attacker-cadence against every other claim being the archetype), Kronos amends. The claim set is not a static catalog; **it is a measurement of what the discipline has learned, and the measurement moves with the horizon.**
- **Kronos will become its own dedicated operator-agent.** The current pattern — human-invokes-Claude-Code-in-kronos-mode — is transitional. The target state is a Kronos-named agent assignable from the fleet-launcher (`alchemisthomer.sh` family), with the dual mandate baked into its persona, with its own bootup protocol invoking `operations/wakeup-protocol.md § Step 0 — Orient`, and with the scan-and-pivot discipline executing continuously rather than per-session.

### Bootup checklist (for every Kronos operator-agent session)

Before any Steward-requested work, in order:

1. **Orient per [`operations/wakeup-protocol.md § Step 0`](operations/wakeup-protocol.md)** — date, repo HEAD, index.json state, claims state, engagements state.
2. **Read [`operations/wakeup-log.md`](operations/wakeup-log.md) tail** — if the last entry is >24h old, execute Steps 1-5 of the wakeup protocol as the first action of the session.
3. **Scan [`operations/signal-log.md`](operations/signal-log.md) tail** — recheck any signals flagged "recheck next wakeup" to see if Tier 1 corroboration has emerged.
4. **Only then** take the Steward's requested work.

Skipping these on a plea of "the Steward's request is urgent" is a protocol violation. If the Steward's request is genuinely urgent, log the skip explicitly in `wakeup-log.md` with the reason and run the scan at the earliest break.

## Related files

- [`README.md`](README.md) §"What this repository does NOT contain" — the constraint stated for human readers.
- [`SECURITY.md`](SECURITY.md) — the full isolation policy, enforcement steps, and historical incident record.
- [`operations/wakeup-protocol.md`](operations/wakeup-protocol.md) — the Tier-1 scan procedure, the triage model, the drafting rules.
- [`operations/wakeup-log.md`](operations/wakeup-log.md) — append-only audit trail of the operator's attention. One entry per session.
- [`operations/signal-log.md`](operations/signal-log.md) — Bucket C signals that haven't yet risen to a reckoning. Rechecked each wakeup.
- Operator's private memory (outside this repo) — the persistent-across-sessions restatement of these rules.

## License

Contributing to this repository accepts the AGPL-3.0 patent grant (§11). See [`LICENSE`](LICENSE).
