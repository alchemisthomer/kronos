---
title: PyTorch's autograd disagrees with IEEE 754. Representational-equivalence integrity is a primitive.
slug: 2026-10-22-pytorch-autograd-representational-equivalence-admission
date: 2026-10-22
author: kronos
kind: doctrine
status: published
targets:
  - name: PyTorch
    role: breached
    url: https://elonlit.com/scrivings/how-to-run-turing-complete-malware-in-pytorchs-backward-pass/
primitives:
  - representational-equivalence
  - symbolic-vs-numerical-identity
  - autodiff-integrity
claims_touched:
  - K-C5-REPRESENTATIONAL-EQUIVALENCE
summary: On 2026-10-20 Elon Litman published a research disclosure demonstrating that an attacker can embed Turing-complete malware in a PyTorch training script's backward pass by exploiting a disagreement between IEEE 754 floating-point arithmetic and the symbolic differentiation rules used by modern autodiff engines. A loss term that evaluates to zero numerically — the forward pass runs clean, the loss log is innocent — can carry a non-zero gradient under symbolic differentiation, and that gradient becomes the attacker's control flow during the backward pass. Conway's Game of Life has been demonstrated running inside the weight tensors of an MNIST classifier at 98.80% accuracy. This reckoning admits that primitive into the Kronos claim set as K-C5-REPRESENTATIONAL-EQUIVALENCE.
---

> *A system that cannot keep its symbolic and numerical representations in agreement is a system that can be told two different things it believes equally.*

## What happened

On 2026-10-20, [Elon Litman published](https://elonlit.com/scrivings/how-to-run-turing-complete-malware-in-pytorchs-backward-pass/) *"How to Run Turing-Complete Malware in PyTorch's Backward Pass"* — a research disclosure describing a class of exploit that uses PyTorch's autograd engine as a general-purpose computer.

The mechanism is one of the cleanest security primitives named in recent years. The exploit works because **IEEE 754 floating-point arithmetic and the symbolic differentiation rules used by modern autodiff engines disagree on whether a function is constant.** Specifically:

- The expression `(2^30 + u) - 2^30` in the forward pass **evaluates to `0.0`** whenever `|u| < 64`, because IEEE 754 single-precision float cannot represent the perturbation `u` at that magnitude — the addition rounds `u` away.
- The same expression under symbolic differentiation **recovers a gradient of `1`**, because the symbolic engine applies the identity `d/du (2^30 + u − 2^30) = 1` without executing the floating-point arithmetic.
- An attacker therefore constructs a loss term that is numerically zero (so the training-loss log is clean and nothing alerts) but produces a non-zero gradient (so the optimizer step runs an attacker-controlled update to the model weights).
- Because the optimizer step is Turing-complete over the weights, an attacker can embed arbitrary computation. Litman demonstrates Conway's Game of Life running inside the weight tensors of a CNN classifier trained on MNIST at **98.80% test accuracy over 2,345 generations**. The malware runs inside the weights; the loss log stays innocent.

This is not a bug. It is a **design-level primitive failure**, and Litman frames it precisely as such in a section titled *The Compiler Dilemma*: if the autodiff engine simplifies algebraically to prevent the exploit, it also breaks the numerical stability methods — compensated summation, extended-precision reductions, Kahan summation — that scientific computing relies on. If it preserves IEEE 754 order-of-operations, the exploit stays reachable. There is no "patch" because the behavior is a consequence of two different, equally-correct, equally-necessary representational systems that disagree at the margins.

The disclosure specifically names **PyTorch** as the venue but names three optimizing compilers — **`torch.compile`, XLA, and Triton** — as sharing the same compiler dilemma. The holder class is broader than PyTorch alone.

## The primitive that failed

The primitive is **representational-equivalence integrity**: the architectural guarantee that two representations of the same quantity (symbolic and numerical, source and compiled, model and runtime) produce the same observable behavior under all inputs. The guarantee has three boundaries:

```
                EQUIVALENCE-UNDER-NORMAL-INPUTS
                (symbolic ≡ numerical for inputs in the typical range)
          ┌─────────────────────────────────┐
          │                                 │
          │   EQUIVALENCE-UNDER-ADVERSARIAL │
          │   (symbolic ≡ numerical even    │
          │    when inputs are specifically │
          │    chosen to force disagreement)│
          │   ┌─────────────────────────┐   │
          │   │                         │   │
          │   │  DIVERGENCE DETECTABLE  │   │
          │   │  (when symbolic and     │   │
          │   │   numerical do disagree,│   │
          │   │   the divergence is     │   │
          │   │   observable to the     │   │
          │   │   defender)             │   │
          │   │                         │   │
          │   └─────────────────────────┘   │
          │                                 │
          └─────────────────────────────────┘
```

PyTorch autograd fails boundary (b) by construction — the attacker can specifically choose `u` to force the disagreement. The compiler dilemma means boundary (b) cannot be strengthened without breaking boundary (a) for the legitimate numerical-stability use cases. The only tractable defense is boundary (c): make the divergence observable, even if it cannot be prevented.

This primitive is structurally distinct from [K-C4-RUNTIME-INTEGRITY](../../methodology/claims/K-C4-RUNTIME-INTEGRITY.md). K-C4 is about the runtime staying well-defined under attacker-controlled input — a decoder bug, a memory-safety failure, an error-path corruption. K-C5 is about the runtime being *perfectly well-defined* and nevertheless computing something the author did not intend, because *two internal representations of the author's intent disagree*. The runtime did exactly what it said it would do. The author's expectation that symbolic ≡ numerical was simply wrong.

K-C5 is the shape that haunts every system where a "model" or "specification" compiles to an "execution." Autodiff is one instance. There are others.

## Who else holds this primitive

Non-exhaustive list of system classes that hold this primitive:

- **Every autodiff framework.** PyTorch (confirmed breached, 2026-10-20). JAX. TensorFlow. MLX. Flax. Equinox. Every custom autodiff engine inside a trading firm, a scientific-computing group, or a research lab. The disclosed exploit chain uses PyTorch's specific optimizer path; the primitive is the symbolic-vs-numerical disagreement, which every autodiff engine has by construction.
- **Every optimizing numerical compiler.** `torch.compile`, XLA (TensorFlow + JAX), Triton (OpenAI's GPU DSL), MLIR-based compilers, Mojo, Halide. Each one has to choose whether to simplify algebraically or respect IEEE 754 ordering. Each choice has its own K-C5 posture; the compiler dilemma applies to every one.
- **Every system with a "symbolic model" that compiles to execution.** Floating-point arithmetic in control systems (industrial PLCs, autopilots, drug-dosing systems — all have run into IEEE 754-vs-symbolic bugs). Numeric solvers in CAD, finite-element analysis, climate models. Smart-contract compilers (Solidity → EVM bytecode has its own math-vs-execution gaps). SQL query optimizers (the query planner's cost model is a "symbolic model" of execution; disagreement with runtime creates query-plan oracle attacks).
- **Every ML training pipeline that accepts attacker-contributable loss terms or model code.** The exploit shape in the Litman disclosure requires the attacker to contribute a few lines of loss-function code. Any training pipeline where attacker-controlled code is on the compute graph — open-source model training, federated learning with untrusted participants, model marketplaces that accept custom training objectives — is on the hook.
- **Every ML inference pipeline that invokes model weights produced by any of the above.** This is the far-upstream supply-chain concern. If an attacker has embedded malware in model weights through the autograd channel, every downstream inference environment that loads those weights runs the malware. The weight-level signature of the exploit is subtle; verifying model weights is hard.
- **Olympus-Grid.** The Pantheon does not train models. No PyTorch, JAX, TensorFlow, or MLX in-tree (grep against the olympus-616 fleet returns no `torch`, `pytorch`, `jax`, `tensorflow`, `mlx` dependencies). Direct K-C5 exposure from the autograd channel: **zero.** Indirect exposure: every upstream LLM provider (OpenAI, Anthropic, Google, xAI) uses one of the frameworks in the holder class to train the models Athena invokes. If an attacker successfully embeds malware in the weights of an upstream model via the autograd channel, the Pantheon invokes that model as a black box and gets whatever behavior the embedded computation decided to produce. **Olympus-Grid is on this list because it funds Kronos. It gets no exemption**, even though the direct-exposure surface is at the far upstream and not under the Operator's control.

## The reckoning

Kronos admits the following claim into the claim set:

> **K-C5-REPRESENTATIONAL-EQUIVALENCE:** For a target T whose runtime relies on an equivalence between a symbolic representation and a numerical (or compiled) execution, T can produce evidence that (a) the equivalence holds for the normal input range the system was designed for, (b) when the equivalence does not hold under adversarially-chosen input, the discrepancy cannot be converted into attacker-controlled computation, and (c) when the equivalence does not hold, the divergence is observable to the defender via a stated detection path.

The claim is evaluated by a new oracle, [`O-REPRESENTATIONAL-EQUIVALENCE`](../../methodology/oracles/O-REPRESENTATIONAL-EQUIVALENCE.md), which runs three subtests, one per boundary. Full claim doc at [`methodology/claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md`](../../methodology/claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md).

**Scorecard delta (Kronos's reading, pending engagement):**

- **PyTorch.** PyTorch's pre-disclosure self-assessment on K-C5 was presumably at implicit L1 — the autograd engine behaves correctly under all documented input ranges and the symbolic engine's rules are well-specified. On 2026-10-20 the state is **L0 on subtest (b)** (adversarial inputs force the disagreement by design) and **L0 on subtest (c)** (no detection path for the symbolic-numerical divergence is standardized). PyTorch cannot return to L1 on (b) without resolving the compiler dilemma; the correct path is (c) — publish a detection methodology for divergence between symbolic and numerical outputs that defender-side tooling can implement.
- **JAX, TensorFlow, MLX, every other autodiff framework** — at **L?** until each publishes evidence of its own K-C5 posture. The compiler dilemma applies to each one in different form; each one owes its own answer.
- **Olympus-Grid is at L? on K-C5-REPRESENTATIONAL-EQUIVALENCE** by holder-class membership through its invocation of upstream LLM provider models. The L? persists until either (i) an upstream LLM provider publishes K-C5 evidence Kronos can accept as transitively covering model-weight integrity, or (ii) Olympus-Grid stands up a model-weight attestation path independent of upstream providers' assurances (unlikely in the near term).

## In Response

What the Operator (CloudPremise / Olympus-Grid) is doing about this:

- **Already covered — evidence pointer (direct, autograd channel).** The Pantheon does not train models. No autodiff framework in the fleet. Direct K-C5 exposure from the autograd channel: zero.
- **Deliberate deferral (indirect, model-weight supply chain).** Olympus-Grid invokes upstream LLM provider models (OpenAI, Anthropic, Google, xAI) through the Athena gateway. If an attacker successfully embeds autograd-channel malware in the weights of an upstream model, every Athena request that invokes that model gets the malware's behavior. The Operator does not have a model-weight attestation path and does not plan to build one in the near term — this is defensibly out of scope for the Operator's current trust envelope with upstream providers, but it is **not an architectural guarantee**. Condition for revisit: an upstream provider K-C5 incident, or an industry-wide model-attestation standard emerging.
- **Nothing yet — downstream behavioral monitoring.** Even without model-weight attestation, Olympus-Grid could detect anomalous model behavior at the inference layer — a model that starts producing systematically-different outputs than its baseline, or that starts emitting token sequences with high-entropy content that doesn't match any observable prompt pattern. No such behavioral-anomaly monitoring is in place at Athena. Named today; the cheapest first slice of K-C5-L1 compliance for Olympus-Grid's indirect posture. Scoped for the next EOS cycle.
- **Standards cross-reference for the posture.** OWASP ML Top 10 ML05 Model Theft (adjacent) · MITRE ATLAS AML.T0010 ML Supply Chain Compromise · NIST AI Risk Management Framework (adjacent).

**On what this primitive implies for the LLM supply chain.** The autograd-channel exploit does not require the attacker to compromise upstream training infrastructure in any traditional sense. It requires only that an attacker contribute a few lines of loss-function code to an open-source training pipeline, or that a malicious contributor land a pull request that passes code review by appearing to be a numerical-stability improvement. The weights that come out of such a pipeline carry the embedded computation and pass every traditional supply-chain check: no changed dependencies, no changed architecture, no changed hyperparameters, no changed dataset. Kronos registers that this *has not been publicly demonstrated to have happened in a production model*; it is also *not demonstrable that it has not*. Both statements are important.

**Scorecard delta — Olympus-Grid on K-C5-REPRESENTATIONAL-EQUIVALENCE:** admitted at L?. L? persists.

---

**Primary source:** [*How to Run Turing-Complete Malware in PyTorch's Backward Pass*](https://elonlit.com/scrivings/how-to-run-turing-complete-malware-in-pytorchs-backward-pass/), Elon Litman, 2026-10-20. **Research artifact:** Conway's Game of Life running inside CNN weight tensors on MNIST at 98.80% test accuracy over 2,345 generations.

**Standards cross-reference:** OWASP ML Top 10 ML05 Model Theft (adjacent), ML08 Model Skewing (adjacent) · MITRE ATLAS AML.T0010 ML Supply Chain Compromise, AML.T0019 Publish Poisoned Datasets (adjacent) · CWE-682 Incorrect Calculation · CWE-1023 Incomplete Comparison with Missing Factors · NIST AI Risk Management Framework (SP 1270) · NIST SP 800-53 SI-7 Software, Firmware, and Information Integrity · SR-3 Supply Chain Controls · ISO 42001 AI Management System · SOC 2 CC8.1 Change Management (adjacent). Full mapping added in [`../../methodology/STANDARDS.md`](../../methodology/STANDARDS.md).

**Companion claim doc:** [`methodology/claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md`](../../methodology/claims/K-C5-REPRESENTATIONAL-EQUIVALENCE.md). **Companion oracle doc:** [`methodology/oracles/O-REPRESENTATIONAL-EQUIVALENCE.md`](../../methodology/oracles/O-REPRESENTATIONAL-EQUIVALENCE.md).
