---
name: statistical-power
description: "표본 수·검정력 계산 (sample size and power analysis): how many participants, animals, samples or users per group, a priori power, minimum detectable effect, A/B test duration, cluster-randomized designs (ICC, design effect), and justifying a sample size in a protocol, ethics review or grant."
---

# Statistical Power (Workbench wrapper)

Read the original skill [Statistical Power](../../vendor/research-agent-skills/skills/statistical-power/SKILL.md) (package path `vendor/research-agent-skills/skills/statistical-power/SKILL.md`) and resolve its scripts and references relative to that file, not this wrapper or the project directory.

- State where the effect size comes from (prior study, pilot, minimal important difference). Do not fix a sample size on an unfounded effect size.
- Its examples need Python 3.10+ with statsmodels, scipy, pingouin and numpy. If you cannot run them, give the formula-based result and say it was not executed.
- For laying out the study use experimental-design, and for the wider research workflow wb-research.
