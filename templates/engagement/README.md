# engagement kanban

The eight-stage kanban that governs a kronos engagement's lifecycle. Each engagement document is a single markdown file (`<target-slug>.kronos-<N>.md`) that travels through these folders via `git mv` as the engagement progresses.

## Stages

| # | Stage | Occupant is expected to be doing |
|---|---|---|
| 00 | `scope/` | Operator scoping the engagement — writing §1 target boundary |
| 01 | `authorized/` | Authorization artifact signed; §2-§4 (auth, ROE, threat class) locked |
| 02 | `planning/` | Agent decomposing §6-§8 (target model, attack matrix, oracles) |
| 03 | `ready/` | Approver signed §5; engagement is ready to execute |
| 04 | `running/` | Attacks in flight; §9 execution log being written |
| 05 | `evidence/` | Attack matrix complete; oracles evaluating §9 evidence |
| 06 | `shipped/` | §10 findings written; §11 scorecard updated; §13 closeout complete. Append-only. |
| 07 | `aborted/` | Engagement stopped early — first-signal-stop triggered, ROE violation, authorization expired |

## Movement discipline

- Movement is `git mv` only. Preserves history and blame.
- Commit message convention: `chore(kronos): move <filename> from <source-stage> to <target-stage>`
- Multiple engagements may occupy earlier stages (00, 01, 02) simultaneously. Only one engagement may occupy `04_running/` at a time against a single target — parallel attacks against the same target contaminate each other's evidence.
- Different targets can have concurrent engagements without contention.

## Read order for a first-time operator

1. [`../../methodology/OPERATING-MANUAL.md`](../../methodology/OPERATING-MANUAL.md) — the discipline this kanban enforces.
2. [`TEMPLATE.md`](TEMPLATE.md) — the engagement document scaffold.
3. [`SCORECARD.md`](SCORECARD.md) — the target's scorecard configuration.
4. Any existing engagement in `06_shipped/` — a worked example.
