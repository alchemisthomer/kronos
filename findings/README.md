# kronos/findings/

**Findings are the Kronos→other-agent handoff surface.** Each file in this folder names a specific gap, bug, or system-wide guarantee candidate that a Kronos reckoning or engagement surfaced, and identifies which agent should pick it up.

Per the Kronos persona (`alchemisthomer.sh` kronos mode): *"Fixing findings in production god code [and] modifying olympus-grid Apex, LWC, or managed package" are NOT my job. "Kronos reports; the owning agent remediates."* This folder is where the report goes.

## File naming

`F-YYYY-MM-DD-<slug>.md`

A finding is a single file. The slug summarizes what the finding is about, not where it goes.

## Finding types

- **EOS backlog surfacing** (`<slug>-eos-backlog-from-*`). Kronos has named Olympus-Grid gaps that should become EOS cycle backlog items. Owning pickup: `--eos`.
- **God-specific defect** (`<slug>-<god>-*`). Kronos found a bug or exposure in a specific god's source. Owning pickup: the owning god's agent + `--olympus-616` orchestrator.
- **olympus-grid remediation** (`<slug>-olympus-grid-*`). Kronos found a gap in Salesforce metadata, Apex, or the managed package. Owning pickup: `--olympus-grid`.
- **Cross-cutting architectural** (`<slug>-architecture-*`). Kronos is naming an architectural claim that spans multiple surfaces. Owning pickup: Steward decides.

## Finding lifecycle

1. Kronos authors the finding here.
2. Kronos pushes to the kronos repo feature branch.
3. Steward routes the finding to the owning agent.
4. Owning agent executes the remediation in its own repo.
5. On completion, the owning agent closes the loop by linking its PR / merge commit back into this findings file, OR Kronos closes the finding with a `**Status: resolved**` note referencing the resolution.

Findings are never deleted. If a finding is withdrawn (Kronos was wrong), it is marked `**Status: withdrawn**` with a note explaining why.

## Current findings

- [F-2026-10-22-eos-backlog-from-first-reckoning-week.md](F-2026-10-22-eos-backlog-from-first-reckoning-week.md) — 12 EOS backlog items drawn from the first week of Kronos reckonings (K-C1 through K-C8). Owning pickup: `--eos`.

## Not in scope here

- Engagements (`kronos/engagements/<target>/`) — these are time-boxed authorized assessments of specific targets. A finding may *trigger* an engagement; an engagement produces its own evidence record.
- Reckonings (`kronos/docs/blog/posts/`) — public reckonings may *cite* findings but findings themselves are internal to the Kronos operator surface.
- Signal log (`kronos/operations/signal-log.md`) — Bucket C signals that have not risen to a finding yet.
