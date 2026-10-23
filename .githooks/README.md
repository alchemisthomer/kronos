# .githooks/

Git hooks for the kronos framework repo. Not installed by default — every clone opts in.

## Install (per-clone, one command)

From the repo root:

```bash
git config core.hooksPath .githooks
chmod +x .githooks/pre-commit
```

That's it. Every subsequent `git commit` in this clone runs `scripts/verify-no-client-content.sh --staged` before the commit is created; a failure blocks the commit.

## What's included

- **`pre-commit`** — runs the content-isolation validator on staged files. Blocks commits that would leak Salesforce Ids, tenant hostnames, or credential files.

## Bypass

Running `git commit --no-verify` skips the hook. This is **discouraged** and will be flagged in review. If you're bypassing the hook, you're almost certainly about to commit something that violates [`SECURITY.md`](../SECURITY.md).

The GitHub Action at `.github/workflows/content-isolation.yml` runs the same validator on every PR and cannot be bypassed at the developer's workstation. Even if you `--no-verify` locally, CI will catch the violation before merge.
