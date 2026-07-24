# 04_running/

Engagements here are actively attacking their target. The agent is executing the attack matrix (§7) and writing entries to §9 execution log. Evidence artifacts are being committed to `../evidence/<engagement-slug>/`.

**Entry:** agent begins execution → `git mv` from `../03_ready/`.

**Exit criterion:** attack matrix exhausted OR first-signal-stop triggered OR authorization expired → `git mv` to `../05_evidence/` (or `../07_aborted/` if terminated abnormally).

Only ONE engagement per target may occupy this stage at a time. Parallel attacks against the same target contaminate each other's evidence. Different targets can have concurrent engagements without contention.

The `first-signal-stop-enforcer` action monitors engagements here and halts execution on the first FAIL oracle evaluation when the engagement is configured for that mode.
