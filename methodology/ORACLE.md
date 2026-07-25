# Oracle state machine — claim-oriented outcomes and required scaffolding

> The v0 design used three oracle verdicts (PASS / FAIL / INCONCLUSIVE) that spoke sometimes from the attacker's perspective and sometimes from the defender's, and did not distinguish "the attack succeeded" from "the framework could not tell what happened" from "the test was invalid to begin with." The v0.2 model separates these.

## Purpose

Every oracle in the v0.2 domain model returns one of ten claim-oriented outcomes. The outcomes are the framework's authoritative determination of what happened during a challenge. AI-generated narrative may explain an oracle result, but cannot replace it. This constraint is preserved from v0 and remains load-bearing.

## The ten outcomes

### CLAIM_SURVIVED

The claim under test held under the challenge. The defense fired as expected, the observable signals confirmed the expected behavior, and no unauthorized side effects occurred. From the target's perspective, this is a positive outcome; the claim's effectiveness state remains or becomes `survived`.

### CLAIM_FALSIFIED

The claim under test did not hold. The defense did not fire, or fired incorrectly, or the observable signals contradicted the expected behavior. The finding is generated; the claim's effectiveness state becomes `falsified`. The severity of the finding is derived from impact + exploitability + reachable assets + compensating controls + data/privilege impact + business consequence (per ChatGPT P0-11), NOT fixed by the fact of falsification alone.

### PARTIAL_OR_DEGRADED

The defense fired but with degraded performance — response outside SLO, telemetry incomplete, correlation-window nearly exceeded. The claim is not fully falsified, but it did not hold at the declared quality bar. A finding is generated at a severity typically one level below `CLAIM_FALSIFIED` for the same challenge. The claim's effectiveness state becomes `partial`.

### INCONCLUSIVE

The observable signals did not permit a determination in either direction. This is legitimate when a challenge's expected signal is ambiguous, when timing was unfortunate (rate-limit-adjacent traffic obscures the challenge's signal), or when telemetry was delayed beyond the correlation window. Different from OBSERVABILITY_GAP (see below). The engagement can decide (per its `INCONCLUSIVE handling` field in TEMPLATE §3) whether to continue, retry, or halt for human adjudication.

### OBSERVABILITY_GAP

The challenge was executed but the framework could not determine the result because the target's observability itself did not produce the expected signals. This is often more diagnostic than a claim-falsification: the target's monitoring cannot tell what happened during the challenge, which means the target's operators cannot tell what happens during a real attack. `OBSERVABILITY_GAP` generates a finding against the target's Observability dimension, distinct from any finding against the claim being challenged.

### INVALID_TEST

The challenge as specified is not a meaningful test of the claim. Preconditions were not met (baseline observation failed, positive control failed), the target's actual configuration differs materially from the claim's applicable configuration, or the challenge's expected signals reference telemetry that does not exist on the target. `INVALID_TEST` generates a finding against the framework's catalog rather than against the target — the challenge specification needs correction.

### EXECUTION_ERROR

The framework itself failed during challenge execution: tool crashed, network partition, evidence collection failure, oracle evaluation threw an uncaught exception. This is a framework fault, not a target fault. Generates a framework-level finding in the operator's runtime observability, not a target-level finding on the scorecard.

### BLOCKED

A prerequisite for challenge execution was not met and the framework refused to run: tool authorization ceiling below engagement ceiling, network scope violation, incident-state gate refused a data-class-affecting operation, chain-of-authorization missing a required third-party acknowledgment. Generates an engagement-level record but no finding against the target.

### HALTED_SAFETY

Impact budget exceeded or safety-boundary breach detected (unexpected error rate spike in target metrics, unexpected cost spike, telemetry disappearance). The framework halted the run to prevent further impact. Findings-to-date are preserved. Generates a critical framework-level record and may generate a target-level finding depending on the safety breach's characterization.

### NOT_RUN

The challenge was planned but not executed. May occur when a preceding challenge in a first-signal-stop engagement halted the engagement, when authorization expired mid-plan, or when the operator cancelled between plan approval and execution. The challenge remains in the plan as `not_run` for coverage accounting.

## Required per-challenge scaffolding

Each diagnostic challenge in the v0.2 framework MUST include the following elements. Their absence renders the challenge `INVALID_TEST` at execution time.

### Baseline observation

Before the challenge action, capture the target's baseline state for the observables the challenge will evaluate. Without a baseline, "the metric increased" is not distinguishable from "the metric was already increasing." Baseline observation is a passive step that produces evidence in the run's observations even when the challenge itself is active.

### Positive control

An action that should provoke the defense's expected response, executed to confirm the target's telemetry pipeline is functional. If the positive control fails, the challenge cannot be evaluated (`INVALID_TEST` or `OBSERVABILITY_GAP`). The positive control is often the "legitimate" version of the attack's payload — a request that should be rejected as unauthorized, executed to confirm rejection actually produces a rejection signal.

### Negative control

An action that should NOT provoke the defense's expected response, executed to confirm the target's telemetry is not producing false positives. If the negative control produces the expected-attack signal, the challenge cannot be evaluated (`INVALID_TEST`). The negative control is often a legitimate benign request from a legitimate source, executed to confirm that benign traffic is not tagged as attack.

### Unique correlation ID

A unique identifier attached to every request the challenge issues, propagated through target telemetry, and used by the oracle to attribute observed signals to the challenge. Without a correlation ID, the oracle cannot distinguish challenge-produced telemetry from concurrent unrelated telemetry. The correlation ID is generated per-run and recorded in the plan.

### Precondition assertions

Statements about target state that must hold for the challenge to be meaningful. Example: "the target's Ares perimeter is deployed at revision R" or "the target's cluster status is Live." Failed preconditions produce `INVALID_TEST`. The precondition check occurs before the baseline observation.

### Expected primary signal

The observable signal that must appear if the defense fires. Example: "AresBlocks CloudWatch metric increments by 1 within 60s of the request timestamp, with dimension Reason=cf_secret_missing." The oracle checks for this signal in the run's observations.

### Expected secondary signal

Additional signals that should appear alongside the primary. Example: "structured log line at level=info with reason=cf_secret_missing and event_id matching the correlation ID." Secondary signals provide redundancy — an oracle that finds the primary but not the secondary may return `PARTIAL_OR_DEGRADED` rather than `CLAIM_SURVIVED`, indicating telemetry gaps that warrant investigation.

### Telemetry-lag policy

The maximum time the framework will wait for expected signals to appear before evaluating the oracle. Metrics may take minutes to propagate; logs may buffer before ingest. The telemetry-lag policy declares the framework's patience. If the policy is exceeded, the oracle returns `INCONCLUSIVE` for delayed-signal reasons or `OBSERVABILITY_GAP` for missing-signal reasons.

### Retry policy

Whether and how the challenge action is retried under `INCONCLUSIVE` or `EXECUTION_ERROR`. Default is single-try. Retries must be bounded and must be accounted against the engagement's impact budget.

### Late-arriving-evidence policy

What the framework does with observations that arrive after the oracle has evaluated. Typically: append to the evidence store, do not retroactively change the oracle verdict, do not silently update the finding. Late evidence may trigger a follow-up engagement for re-evaluation.

### Cleanup oracle

A separate oracle that evaluates whether the challenge's cleanup was successful. Attacks that create attacker-owned resources (CloudFront distributions, test S3 buckets, test IAM roles) must clean them up; cleanup failure is itself a finding. The cleanup oracle verifies that post-cleanup, the target state matches pre-challenge state modulo the observed challenge effects.

## Interpretation discipline

Preserved from v0: AI-generated narrative may explain an oracle result but cannot replace it. The oracle's verdict is deterministic and comes from the assertion evaluation over observed evidence. An LLM may write the finding's summary and remediation-suggestion sections; it may not decide the finding's verdict, severity classification (below), or lifecycle state.

**Severity classification.** Per ChatGPT P0-11 reference-engagement critique, the finding's severity is NOT fixed by the fact of falsification. Severity is derived from the following factors, evaluated together:

- **Exploitability** — how difficult is it for a real adversary to reproduce the challenge conditions?
- **Reachable assets** — what does successful exploitation give access to?
- **Compensating controls** — do other defenses catch the exploitation before impact?
- **Data or privilege impact** — what data or capabilities become accessible?
- **Business consequence** — what is the impact to the target's operations or its users?

A `CLAIM_FALSIFIED` outcome on a highly-compensating control with low exploitability and no reachable-asset impact may be `low` severity. A `CLAIM_SURVIVED` outcome that surfaces a related observability gap may generate a `medium` severity finding against the observability dimension. The oracle verdict and the finding severity are separable determinations.

## Observability gap as a distinct finding class

`OBSERVABILITY_GAP` is not merely a "try again" outcome. When the framework cannot determine whether a defense fired because the target's monitoring did not produce the expected signals, that gap is itself a finding against the target's Observability scorecard dimension. The target's operators cannot see what the framework cannot see. A target with many `OBSERVABILITY_GAP` outcomes may have a defensively-adequate perimeter but an inability to detect real attacks.

Observability-gap findings degrade the Observability dimension's effectiveness state independent of the challenges' verdicts. A target may have a `survived` Perimeter Defense dimension and a `falsified` Observability dimension for the same set of challenges — because the perimeter held, but the operators wouldn't know if it hadn't.

## Rationale — why ten outcomes

The v0 three-outcome model conflated:

- Attack succeeded vs defense failed (attacker vs defender perspective ambiguity)
- Genuinely inconclusive vs. observability failure
- Test invalid vs. test failed
- Framework error vs. target error
- Engagement halted for safety vs. challenge simply not executed

The ten-outcome model eliminates each of these ambiguities. Every outcome maps cleanly to a distinct finding class, a distinct scorecard impact, and a distinct downstream workflow (remediation, re-verification, framework catalog correction, framework runtime debugging).

## What this replaces

- The v0 three-outcome (PASS / FAIL / INCONCLUSIVE) oracle model.
- The v0 implicit conflation of attacker and defender perspective in oracle verdicts.
- The v0 assumption that INCONCLUSIVE was the only non-binary outcome.
- The v0 pattern of automatic critical-severity assignment on defense-failed outcomes.
