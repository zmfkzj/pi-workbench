# Diagnosis, causality, and recovery

## Build testable mechanisms

Separate:

- symptom: observed undesirable state;
- trigger: event that exposed the failure;
- contributing conditions: factors that increased likelihood or severity;
- mechanism: how the conditions produced the symptom;
- systemic cause: design or process that allowed recurrence;
- detection or containment failure: why harm was not caught or limited sooner.

Do not force one root cause. A useful model is `trigger + latent weakness +
missing safeguard -> failure`.

For every leading hypothesis, write one prediction that would be observable if
it were true and one observation that would weaken it. Rank tests by
discrimination, cost, time, and risk.

## Method selection

- Use expected-versus-actual comparison for contract violations.
- Use timeline and change analysis when a previously healthy system regressed.
- Use differential diagnosis when several mechanisms fit the symptom.
- Use divide-and-conquer or binary isolation across a broad failure surface.
- Use invariant checks when expected properties are clearer than causes.
- Use dependency tracing for propagation across components.
- Use causal graphs or counterfactuals when confounding and feedback matter.
- Use a controlled experiment when one safe intervention can separate causes.

“Five whys” is not a default; use it only when the causal chain is genuinely
linear and evidence supports each link.

## Urgent recovery

1. Contain ongoing harm.
2. Preserve logs, inputs, state, timing, and configuration needed for diagnosis.
3. Restore the smallest essential function through a reversible workaround.
4. Diagnose using preserved evidence.
5. Repair the demonstrated mechanism.
6. Add prevention, detection, or containment controls.

Label workaround, repair, and prevention separately. Verify restored service
and durable correction independently.
