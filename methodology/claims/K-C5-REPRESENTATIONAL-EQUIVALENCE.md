# K-C5-REPRESENTATIONAL-EQUIVALENCE

**Admitted:** 2026-10-22 · [PyTorch's autograd disagrees with IEEE 754](../../docs/blog/posts/2026-10-22-pytorch-autograd-representational-equivalence-admission.md)
**Oracle:** [O-REPRESENTATIONAL-EQUIVALENCE](../oracles/O-REPRESENTATIONAL-EQUIVALENCE.md)
**Holder class:** any target whose runtime relies on an equivalence between a symbolic representation and a numerical or compiled execution

## Statement

> For a target T whose runtime relies on an equivalence between a symbolic representation and a numerical (or compiled) execution, T can produce evidence that:
>
> **(a) Equivalence under normal inputs.** The symbolic representation and the executing form produce the same observable behavior for inputs in the system's documented normal range.
>
> **(b) Equivalence under adversarial inputs.** When an attacker specifically chooses input to force disagreement between the symbolic and the executing form, the discrepancy cannot be converted into attacker-controlled computation, data exfiltration, or integrity violation.
>
> **(c) Divergence detectable.** When the symbolic and the executing form do disagree (for any reason — adversarial input, implementation bug, compiler optimization), the divergence is observable to the defender via a stated detection path with a stated time budget.

## The primitive

Every system that uses two different internal representations of the same quantity relies on their equivalence being an architectural invariant. The specific instance named by this claim's admission incident is autodiff — PyTorch's symbolic differentiation engine disagrees with IEEE 754 floating-point arithmetic for inputs chosen to exploit the margin of double rounding. An attacker's loss term that evaluates to zero numerically can produce a non-zero gradient symbolically; the gradient becomes attacker-controlled computation during the backward pass. Litman demonstrated Conway's Game of Life running inside the weight tensors of an MNIST CNN at 98.80% test accuracy.

The primitive is broader than autodiff. Any time a system computes using one representation and reasons using another, the mismatch is a surface:

- **Autodiff**: symbolic differentiation vs IEEE 754 execution. The admitting incident.
- **SQL query optimizers**: query-plan cost model (symbolic) vs runtime execution. Query-plan oracle attacks exploit the mismatch.
- **Smart contracts**: Solidity source (symbolic) vs EVM bytecode execution. Compilation bugs become economic vulnerabilities.
- **Control systems**: real-arithmetic analysis vs IEEE 754 execution. Patriot missile 1991 clock-drift incident is the classic non-security instance.
- **Verifier-prover gaps**: formal verification tools reason about one model; the executed system is another.
- **JIT-cached code**: interpreted path symbolically correct; JITted path has a different observable behavior.

Litman's framing of the autodiff case — *The Compiler Dilemma* — generalizes: any system that tries to simplify algebraically breaks numerical-stability methods that rely on IEEE 754 ordering; any system that preserves IEEE 754 ordering leaves the exploit reachable. There is no "patch" for the primitive; the only defense is boundary (c), making the divergence observable.

## Scoring ladder

| Level | Evidence required |
|---|---|
| **L0** | No evidence. Default. Also mandatory for any target whose representational-equivalence envelope was publicly demonstrated to fail (e.g., PyTorch autograd on subtest (b) as of 2026-10-20). |
| **L1** | Documented posture: (i) which pairs of representations are in use, (ii) the normal-input range for each pair, (iii) known divergence conditions, (iv) a stated detection path for divergence outside the stated range. No active oracle evaluation. |
| **L2** | Passes `O-REPRESENTATIONAL-EQUIVALENCE` subtests (a), (b), (c) in a time-boxed engagement with Kronos. Includes a fuzz corpus of adversarial inputs chosen to force disagreement at known mismatch points. |
| **L3** | Maintains L2 continuously, with the fuzz corpus re-run on a stated cadence, divergence-detection monitors in production emitting observable signals, and documented remediation when divergence occurs. |

## Holder class

- **Every autodiff framework**: PyTorch (confirmed breached), JAX, TensorFlow, MLX, Flax, Equinox, custom in-house autodiff engines.
- **Every optimizing numerical compiler**: `torch.compile`, XLA, Triton, MLIR-based compilers, Mojo, Halide.
- **Every system with a "symbolic model" that compiles to execution**: industrial PLC floating-point, autopilot software, drug-dosing systems, CAD numeric solvers, climate models, smart-contract compilers, SQL query optimizers.
- **Every ML training pipeline that accepts attacker-contributable loss terms or model code**: open-source model training, federated learning with untrusted participants, model marketplaces.
- **Every ML inference pipeline that invokes model weights produced by any of the above** — including every LLM gateway that invokes upstream provider models.
- **Olympus-Grid**: no direct autodiff surface (Pantheon does not train); indirect exposure via upstream LLM provider model weights invoked through Athena. Posture: honest-L? on indirect surface.

## Related claims

- [K-C4-RUNTIME-INTEGRITY](K-C4-RUNTIME-INTEGRITY.md) — adjacent. K-C4 is about runtime staying well-defined under attacker input. K-C5 is about the runtime being *perfectly well-defined* and nevertheless computing something unintended because two representations disagree. A target failing K-C5 may still be at L2 on K-C4; conversely, a target at L2 on K-C4 may still fail K-C5.
- [K-C8-SUPPLY-CHAIN-INTEGRITY](K-C8-SUPPLY-CHAIN-INTEGRITY.md) — adjacent, downstream. If K-C5 lets an attacker embed computation in model weights, K-C8 is the delivery mechanism from the training pipeline to the inference environment.

## Posts that touch this claim

- [PyTorch's autograd disagrees with IEEE 754](../../docs/blog/posts/2026-10-22-pytorch-autograd-representational-equivalence-admission.md) — admission post
