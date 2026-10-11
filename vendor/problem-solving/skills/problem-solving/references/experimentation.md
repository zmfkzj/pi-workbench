# Experimentation

Use an experiment when uncertainty is material, competing explanations predict
different outcomes, and a bounded test is cheaper or safer than commitment.

## Minimal experiment contract

```text
Hypothesis: mechanism or effect under test
Intervention: single controlled change
Baseline: current or comparison condition
Expected observation: discriminating result if true
Success threshold: evidence sufficient to proceed
Failure threshold: evidence sufficient to stop or switch
Duration/sample: enough to observe the effect
Guardrails: harm, cost, privacy, reliability, or rollback limits
Decision: action for success, failure, and inconclusive result
```

Select the cheapest test that separates the leading alternatives. Do not build
a production system merely to learn whether the premise is sound.

## Design checks

- Change one causal factor or preserve a defensible comparison.
- Measure the outcome the decision actually depends on.
- Define thresholds before observing results when confirmation bias matters.
- Include enough duration to cover delays, seasonality, or failure modes.
- Protect users and systems with stop conditions and rollback.
- Distinguish exploratory evidence from confirmatory evidence.
- Record negative and inconclusive results.

If observation is unsafe or impossible, use simulation, shadow mode, a dry run,
historical backtest, prototype, or staged rollout while stating the evidence
limits.

An experiment is complete only when the result changes or confirms the next
decision. A metric without a predeclared decision rule merely creates more
information.
