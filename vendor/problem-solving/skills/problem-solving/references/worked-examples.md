# Worked examples

These examples show routing and evidence states, not fixed output wording.

## Direct answer

**Request:** “What is 18% of 250?”

**Route:** Level 0. Calculate 45, sanity-check, answer. Do not expose the full
operating loop.

## Ambiguous problem

**Request:** “Add caching.”

**Route:** Establish whether the outcome is lower latency, lower upstream load,
or outage tolerance. Measure the baseline. If the target is p95 below 500 ms,
compare request coalescing, query repair, and caching rather than treating the
requested mechanism as the objective.

## Diagnosis

**Symptom:** Deployments began failing after Tuesday.

**Route:** Preserve logs; reconstruct the timeline; compare environment,
dependency, configuration, and credential changes. For each cause, name a
prediction. Recreate from committed configuration to test configuration drift.

## Architecture decision

**Choice:** Add a service or extend the existing process.

**Route:** Apply latency, reliability, ownership, and compatibility constraints
before scoring. Recommend the existing process when it meets the objective
without a new deployment and state the load threshold that would justify a
service later.

## Process improvement

**Symptom:** Manual reconciliation repeatedly consumes Friday afternoon.

**Route:** Inspect causes before automating the same workflow. If missing shared
identifiers create most ambiguity, establish the identifier at ingestion and
retain reconciliation only for exceptions.

## Implementation

**Request:** Fix duplicate processing under retries.

**Route:** Inspect the repository and tests, establish a failing repeated-call
case, implement the smallest idempotency boundary, run focused and regression
tests, then report `TESTED`. Do not claim production observation.

## Recovery

**Incident:** A release is corrupting new writes.

**Route:** Stop or isolate writes, preserve failing inputs and logs, restore the
last safe path, then diagnose. Label rollback as restoration; add a repair and a
test that reproduces the corrupting condition.

## No action

**Request:** Replace a stable tool because a new framework is popular.

**Route:** If no material gap exists and migration cost introduces risk,
recommend no change. Monitor a concrete threshold such as unsupported security
updates or an unmet scaling requirement.
