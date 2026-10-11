# Verification and red-team review

Verification asks whether the implementation meets its defined requirements.
Validation asks whether the resulting system satisfies the user's actual
outcome. Perform both when their answers can differ.

## Verification ladder

Choose the lowest-cost method that can falsify the claim:

1. inspect the actual artifact or state;
2. run deterministic checks;
3. test negative and boundary cases;
4. compare before and after measurements;
5. reproduce independently or with an alternative method;
6. test integration and realistic load;
7. pilot, canary, or observe in operation.

Do not use the same assumption to create and validate the result. For
consequential work, use a fresh context, independent reviewer, alternative
calculation, or adversarial case.

## Falsification questions

- Which assumption could make the result appear successful when it is not?
- What boundary or input would break it?
- What important behavior could regress?
- Could the observed change have occurred without the intervention?
- Is the check measuring a proxy rather than the desired outcome?
- Does the result persist across realistic conditions and time?
- What evidence would reverse the conclusion?

## Result states

- `IMPLEMENTED`: change or artifact exists.
- `TESTED`: named checks executed successfully.
- `PARTIALLY_VERIFIED`: some success criteria pass; material checks remain.
- `VERIFIED`: all defined criteria pass in the tested scope.
- `OBSERVED_IN_OPERATION`: desired result persists in the live context.
- `BLOCKED`: a named dependency, authority boundary, or unavailable check
  prevents a stronger state.

Report the strongest state actually evidenced. Keep `NOT_RUN` visible.
