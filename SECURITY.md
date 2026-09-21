# SECURITY.md — Client-data isolation policy

## The rule

**This repository is public. Real engagement content — client-identifying strings, target-org identifiers, individuals under test, incident narratives, raw record data, credentials — must never be committed here.**

This is not a preference. It is the load-bearing constraint that makes the framework safe to open-source.

## What "engagement content" means

Contributors and operators must treat the following as strictly forbidden in this repo:

- **Target identifiers:** hostnames, domain names, Salesforce/AWS/GCP/Azure account identifiers, organization Ids, tenant Ids, instance URLs of any real customer.
- **Individuals:** user Ids, email addresses, employee names, phone numbers of any real person whose account or actions are the subject of an engagement.
- **Incident narratives:** dates, timelines, actions of any real security incident tied to a real customer.
- **Attack matrices for real targets:** any §7 entry (per `templates/engagement/TEMPLATE.md`) whose `target` field names a real system.
- **Credentials of any kind:** `salesforce.json`, `.env` with real values, service-account keys, session tokens, refresh tokens, API keys, personal access tokens.
- **Extract data:** CSV, JSON, or any file containing rows/records queried from a real target system.

These are forbidden in commits, in PR titles, in PR bodies, in issue titles, in issue comments, in commit messages, in filenames, and in any file the repo tracks.

## Where engagements DO live

Kronos operators run engagements in a separate workspace, following the framework's adoption pattern:

1. **Client-owned repos.** The client forks or clones kronos and copies `templates/engagement/` into their own repo. Their engagement lives in their access-controlled space.
2. **Operator-private repos.** CloudPremise (or a third-party pen-tester) creates a private repo per client engagement. Common naming: `github.com/<operator-org>-private/<client-slug>-kronos`. Copies `templates/engagement/` there.
3. **Local operator workspace.** For work not yet ready for any repo: `/Users/<operator>/temp/<client-slug>-kronos/` or equivalent. Not synced anywhere until reviewed.

The framework tools in `tools/` are safe to publish here because their code is target-agnostic. Their `credentials/` directories carry `.gitignore` rules to prevent real credentials from ever being staged. Their `output/` directories are entirely gitignored.

## Enforcement — four structural layers

The policy is enforced with layered controls, not just documentation. In order of when they fire:

1. **`.gitignore` deny-list.** The repo-root `.gitignore` blocks `/engagement/` at the root outright (so accidentally creating an engagement folder here won't stage), plus per-tool blocks for `credentials/*.json` (except `.example.json`) and `output/*`. Files never enter the staging area.
2. **Pre-commit hook.** [`.githooks/pre-commit`](.githooks/pre-commit) runs [`scripts/verify-no-client-content.sh`](scripts/verify-no-client-content.sh) `--staged` before every commit. Blocks the commit locally on any Salesforce Id / tenant hostname / credential-file / root-level-engagement violation. Every clone opts in with `git config core.hooksPath .githooks` (see [`.githooks/README.md`](.githooks/README.md)).
3. **GitHub Action.** [`.github/workflows/content-isolation.yml`](.github/workflows/content-isolation.yml) runs the same validator on every push and PR against `brain/2.7.x.x` or `main`. Fails CI on any violation — cannot be bypassed at the developer's workstation. Even if a developer `--no-verify`s locally, CI catches the violation before merge.
4. **Review gate.** Reviewers check for client-identifying content before approving. Any PR that names a real target must be closed and the branch deleted immediately (see incident-response section below).

**AI operators (Claude Code and equivalents):** see [`CLAUDE.md`](CLAUDE.md) for the operator-agent-specific rules and the escalation protocol when the operator is asked to scaffold or author engagement content in this repo.

## What to do if client-identifying content is committed here anyway

1. **Do not force-push a rewrite without explicit approval from the repository owner.** Force-push destroys shared history and may not remove commits from GitHub's ref cache.
2. **Delete the offending branch from remote** (`gh api DELETE ...` or `git push origin --delete <branch>`) — with owner approval per the destructive-action rule in [`CLAUDE.md`](CLAUDE.md).
3. **Close any PRs** referencing the deleted branch.
4. **Edit PR bodies** to strip any client-identifying text — GitHub preserves edit history, so this is partial mitigation only.
5. **Contact GitHub support** to purge orphaned commits from the ref cache if the content is severe enough to warrant it.
6. **Notify the affected client** if any real identifying material was public for any window; provide the exposure window (from-commit-timestamp to remediation-timestamp) and the visibility profile at the time (watchers / forks / stars).
7. **File an incident record** in the operator's private incident-tracking system. Update this file (`SECURITY.md`) if the incident reveals a mitigation gap.

## Historical incident

**2026-09-21 — kronos-old.** The predecessor repository `alchemisthomer/kronos-old` (originally `alchemisthomer/kronos`) briefly held an engagement document for a real client on a public branch. Zero watchers, zero forks, zero stars at time of exposure. Remediation: repository renamed to `kronos-old` and made private; this repository was created fresh from a sanitized snapshot. No credentials, no extract data, no PII rows were ever committed — only the target's slug, org id, user id, and the fact of the engagement. That was enough to trigger the isolation policy formalized here.

## Reporting a vulnerability in the framework itself

If you discover a security vulnerability in the kronos framework, methodology, or reference tools (not in a target being tested), open a private security advisory via GitHub's Security tab, or contact the operator via the address in the LICENSE file. Do not open a public issue.
