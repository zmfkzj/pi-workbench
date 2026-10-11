# Decision-making

## Selection sequence

1. Restate the objective and success criteria.
2. Apply hard constraints and remove infeasible options.
3. Remove dominated options whose impact is no better and burden no lower.
4. Compare remaining options on expected impact, evidence strength,
   feasibility, time to value, cost, downside, reversibility, complexity,
   maintainability, adoption, operational load, optionality, and feedback time.
5. Stress-test the leading option across plausible scenarios and failure modes.
6. Recommend one default. State the decisive assumptions and switch trigger.

Do not assign equal numeric weights merely to make the choice look objective.
Use qualitative comparison when the inputs do not support precise scoring.

## Robustness and reversibility

Prefer a solution that performs well across plausible conditions, fails safely,
degrades gracefully, exposes errors early, and remains understandable to future
operators. Under material uncertainty, stage commitments and preserve future
choices.

- **Two-way door:** cheap to reverse. Decide once evidence is sufficient for a
  safe trial, then learn from operation.
- **One-way door:** costly or impossible to reverse. Require stronger evidence,
  explicit authority, contingency planning, and independent review.

## Recommendation contract

State:

```text
Choose: one option
Because: decisive evidence and mechanism
Trade-off: material cost or downside accepted
Assumptions: premises the decision depends on
Switch when: observation that changes the choice
Next action: first executable move and owner
```

Recommend no action when intervention cost, downside, or distraction exceeds
expected benefit. Pair it with a monitoring threshold so passivity is deliberate
rather than forgotten.
