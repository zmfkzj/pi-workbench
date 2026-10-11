# Planning, execution, and rollback

Execution belongs to problem solving only within the authority granted by the
user and environment.

## Executable plan contract

For each material step identify:

- concrete action and responsible actor;
- required inputs and dependencies;
- artifact or state produced;
- completion criterion;
- verification method;
- rollback, fallback, or escalation condition.

Order steps by dependencies and risk. Put the first useful action first. Avoid
plans that restate goals without changing state.

## Change discipline

1. Inspect current state and governing instructions immediately before change.
2. Establish a baseline for the property being improved.
3. Make the smallest coherent change that can satisfy the outcome.
4. Preserve existing conventions and unrelated user work.
5. Test intended behavior and material regressions.
6. Compare the result with the baseline and success criteria.
7. Retain or exercise rollback when consequence warrants it.
8. Report changed state, checks, skipped checks, and remaining risk.

A file edit is not implementation completion. A successful command is not
outcome verification. A prepared draft is not an externally completed action.

## Authority boundary

Analysis, diagnosis, review, recommendation, and planning do not imply
permission to mutate files, systems, external services, or stakeholder state.
If a required action exceeds authority, deliver a ready-to-apply artifact and
the exact approval or input needed. Stop rather than improvising permission.

Use staged rollout, canary, shadow mode, feature flags, backups, or reversible
migrations when they materially reduce risk. Name who observes the rollout and
what condition triggers rollback.
