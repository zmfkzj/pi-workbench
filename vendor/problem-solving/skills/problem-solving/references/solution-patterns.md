# Solution patterns and option generation

Do not jump from symptom to the first plausible fix. Generate alternatives from
different intervention classes, then discard those that violate hard
constraints.

## Intervention classes

| Class | Central move |
|---|---|
| Eliminate | remove the cause or invalid state |
| Remove demand | eliminate the requirement or repeated work |
| Reduce exposure | narrow scope, frequency, or vulnerable population |
| Contain | limit propagation or impact |
| Work around | restore function without claiming root repair |
| Compensate | add a safeguard around an unavoidable weakness |
| Redesign | change architecture, interface, ownership, or incentives |
| Automate | make a well-defined repeated operation deterministic |
| Standardize | replace repeated judgment with a tested default |
| Observe | add measurement or feedback before committing |
| Transfer | delegate responsibility or risk to a better owner |
| Delay | preserve optionality until decisive information arrives |
| Accept | bound and monitor a risk whose mitigation costs more |
| Do nothing | avoid an intervention with negative expected value |

## Time horizons

- **Immediate:** stop harm or create useful progress.
- **Durable:** resolve the demonstrated mechanism.
- **Systemic:** prevent recurrence or reduce future resolution cost.

Include only horizons that improve the actual decision.

## Requirement challenge

Ask whether the requested mechanism can become unnecessary. Prefer a canonical
identifier over perpetual reconciliation, an idempotent operation over retries
everywhere, reusable structured evidence over repeated interpretation, and a
direct metric over a report whose only purpose is exposing that metric.

Do not pursue novelty for its own sake. Reuse existing capabilities when they
satisfy the outcome with less state, maintenance, trust, and failure surface.
