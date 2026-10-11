# Specialist, tool, and agent routing

Route only after the shared objective and success criteria are clear.

## Ownership boundaries

| Capability | Owns |
|---|---|
| Domain skill | terminology, facts, conventions, domain constraints, failure modes, interpretation |
| Mathematics skill | formalization, proof, quantitative models, optimization, estimation, numerics |
| Research capability | current sources, freshness, conflict reconciliation, citations |
| Implementation skill | code, configuration, migrations, tests, deployment mechanics, artifacts |
| Problem-solving skill | outcome, effort, orchestration, option choice, authority, integration, overall verification |

Inspect available skills and tools before naming them. Do not invent a
specialist, tool, model, credential, or capability. Use live tools for facts
that can drift; use durable skills for repeatable methods.

## Routing sequence

1. State the shared problem brief and success criteria.
2. Identify the narrow expertise or live evidence required.
3. Give each specialist only the inputs, output contract, and authority needed.
4. Keep independent workstreams genuinely independent.
5. Name dependencies, integration points, and one synthesis owner.
6. Reconcile conflicts; a domain constraint can invalidate an elegant generic
   option.
7. Verify the integrated outcome, not merely each returned answer.

## Parallel work test

Parallelize only when workstreams do not depend on each other's unresolved
decisions and their outputs can be integrated through explicit contracts. Do
not parallelize before framing, for trivial tasks, or when one observation will
determine all later work.

Tool availability is capability, not authority. Least privilege applies to
external services, edits, terminal commands, credentials, and irreversible
operations.
