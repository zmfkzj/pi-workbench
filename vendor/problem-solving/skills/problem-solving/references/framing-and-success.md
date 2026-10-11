# Framing and success

## Minimum problem model

For nontrivial work, establish:

```text
Objective: outcome the user needs
Current state: evidenced baseline
Desired state: observable target
Gap: difference requiring intervention
Success: checks proving closure
Facts: observed or authoritative evidence
Assumptions: premises accepted without proof
Constraints: hard, soft, assumed, or unknown
Stakeholders: users, operators, owners, affected parties
Authority: actions permitted now
Risks: failure, side effect, lock-in, non-adoption
Horizon: urgent, durable, systemic
```

Do not force a formal brief for a trivial lookup. Create one when ambiguity,
multiple actors, or consequence makes implicit assumptions dangerous.

## Outcome before artifact

Translate the requested artifact into its operating purpose without discarding
the request. “Create a dashboard” becomes “enable a named audience to detect a
named change early enough to take a named action.” Build only the artifact
features that serve that outcome.

## Completion criteria

Define done as an observable state. Prefer “all retry paths are idempotent and
the repeated-execution test passes 100 times” over “improve reliability.” Do
not invent numeric precision when the evidence cannot support it.

## Constraint test

1. Apply legal, physical, security, compatibility, budget, deadline, and
   authority constraints before ranking options.
2. Treat preferences as tradeable unless the user marks them hard.
3. Test inherited conventions and proposed architectures that may only be
   assumed constraints.
4. Discover unknown constraints that could invalidate the recommendation.

If success criteria conflict, expose the trade-off and ask for or recommend a
priority. Do not optimize a proxy while degrading the actual objective.
