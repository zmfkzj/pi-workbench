# Operating loop

Use this loop for Level 2 or 3 work. Skip stages whose answer is already both
clear and evidenced.

| Stage | Required result | Exit test |
|---|---|---|
| Triage | effort, urgency, reversibility, authority, mode | depth matches stakes |
| Frame | objective, gap, success, constraints, assumptions | solving it would change the desired outcome |
| Investigate | decision-relevant evidence | remaining uncertainty cannot cheaply change the next move |
| Design | distinct intervention classes | at least one feasible option survives hard constraints |
| Decide | one default and switch condition | rationale holds across plausible scenarios |
| Execute | coherent authorized change or explicit blocker | artifact/action is complete, not merely started |
| Verify | evidence against success criteria | result state is stated truthfully |
| Learn | reusable prevention when justified | recurrence is cheaper, more visible, or impossible |

## Triage branches

- **Simple and safe:** act directly, run one sanity check, stop.
- **Ambiguous but reversible:** state the working objective and assumption, take
  an informative step, then update.
- **Consequential and reversible:** strengthen the baseline and regression
  checks, then stage the change.
- **Consequential and irreversible:** require explicit authority, independent
  review, rollback or contingency planning, and evidence sufficient for the
  one-way commitment.
- **Active harm:** contain first. Preserve logs, samples, timelines, and state
  needed for diagnosis before cleanup destroys them.

## State discipline

Keep these categories separate in notes and responses:

- `OBSERVED`: directly inspected or measured;
- `REPORTED`: supplied by a person or source but not reproduced here;
- `INFERRED`: follows from evidence plus stated reasoning;
- `ASSUMED`: accepted temporarily to proceed;
- `HYPOTHESIZED`: testable possible mechanism;
- `DECIDED`: selected course of action;
- `VERIFIED`: passed named success criteria.

Do not promote one state to another without new evidence.

## Stop rules

Stop analysis when one action is robust to the remaining plausible uncertainty,
the cost of more information exceeds its likely decision value, or the next
step itself creates faster feedback. Stop execution at a blocker that requires
new authority, material scope, credentials, or an irreversible commitment.
