# 05_evidence/

Engagements here have completed their attack matrix. Evidence has been collected and hashed. Oracles are evaluating the evidence to produce PASS / FAIL / INCONCLUSIVE verdicts. Findings are being drafted.

**Entry:** attack matrix complete → `git mv` from `../04_running/`.

**Exit criterion:** §10 findings written AND §11 scorecard delta prepared → `git mv` to `../06_shipped/`.

The `evidence-hash-verifier` action fires on any push touching this stage. Hash mismatches block the PR — evidence integrity is non-negotiable.
