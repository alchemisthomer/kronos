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

## Related files

- [`README.md`](README.md) §"What this repository does NOT contain" — the constraint stated for human readers.
- [`SECURITY.md`](SECURITY.md) — the full isolation policy, enforcement steps, and historical incident record.
- Operator's private memory (outside this repo) — the persistent-across-sessions restatement of this rule.

## License

Contributing to this repository accepts the AGPL-3.0 patent grant (§11). See [`LICENSE`](LICENSE).
