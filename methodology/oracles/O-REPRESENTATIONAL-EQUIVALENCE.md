# O-REPRESENTATIONAL-EQUIVALENCE

**Version:** 0.1
**Evaluates:** [K-C5-REPRESENTATIONAL-EQUIVALENCE](../claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md)
**Operator profiles required:** symbolic-model-author, numerical-executor, divergence-observer
**Status:** specified, not yet exercised against a target

## Overview

Three subtests, one per boundary. All three must pass for L2. The oracle requires the target to name the pairs of representations in use before engagement.

## Subtest (a) — Equivalence under normal inputs

**Procedure:**

1. **Pair enumeration.** Target names each (symbolic, numerical/compiled) pair in the runtime. Example pairs: autodiff symbolic engine ↔ IEEE 754 forward pass; query planner cost model ↔ execution engine; interpreter ↔ JIT.
2. **Normal-range specification.** Target states the input range each pair is designed to handle.
3. **Baseline sampling.** For each pair, operator samples 10,000+ inputs from the stated normal range and compares symbolic-predicted output to executed output, with a stated numerical tolerance.
4. **Pass criterion.** All samples within tolerance.

**Pass:** no divergence in the normal input range beyond stated tolerance.

## Subtest (b) — Equivalence under adversarial inputs

**Procedure:**

1. **Known-mismatch fuzzing.** For each pair, operator constructs or imports a corpus of adversarial inputs chosen to force disagreement. For autodiff: inputs near `|x| ~ 2^(mantissa_bits)` to force double rounding; expressions with symbolic equivalence that differ in IEEE 754 order of operations. For query planners: inputs near join-cardinality boundaries; expressions where statistics disagree with reality.
2. **Attacker-controllable channel.** For each divergence found, operator determines whether the divergence is **attacker-reachable** (an attacker can supply the input in a production path) and whether the divergence can be **converted into attacker-controlled computation**, data exfiltration, or integrity violation. The PyTorch autograd case: attacker-reachable (via a contributable loss term), convertible (via gradient-based optimizer step → Turing-complete computation on weights).
3. **Pass criterion.** No attacker-reachable, convertible divergence.

**Pass:** every divergence found is either not attacker-reachable, or not convertible into attacker computation.

## Subtest (c) — Divergence detectable

**Procedure:**

1. **Detection-path specification.** Target states, pre-engagement, the mechanism by which production operation would detect a symbolic/numerical divergence event. Examples: dual-execution with cross-validation, periodic sampling with symbolic re-check, invariant monitors on specific numerical quantities, canary inputs with known expected outputs.
2. **Synthetic divergence injection.** Operator injects a synthetic divergence event through the target's normal input path and observes whether the detection fires within the stated time budget `T_detect`.
3. **Pass criterion.** Detection fires within `T_detect`. Target's `T_detect` must be stated pre-engagement; a very long `T_detect` is a legitimate posture but must be recorded.

**Pass:** detection path fires within stated `T_detect` for synthetic divergence.

## Scorecard delta

- All three pass → L2 for this target under oracle v0.1
- Any subtest fails → L0 for this target under oracle v0.1
- Subtest (c) refused by target (no detection path) → capped at L1 under oracle v0.1
- L3 requires continuous divergence-detection monitoring plus adversarial-fuzz corpus re-run on cadence

## Known limitations of v0.1

- The oracle does not test *speculative-execution* divergence (branch predictor state leaking through timing).
- The oracle cannot certify absence of divergence; only measurement against the specific corpus used.
- Supply-chain poisoning of the detection path itself (K-C8 adjacency) is not covered here.
