######## sample-size#1
==== X ====
**Short answer: about 64 participants per group (128 total).** This assumes a two-sided independent-samples t-test, Cohen's d = 0.5 (medium), α = 0.05, power = 0.80 and a 1:1 allocation ratio. The exact calculation gives 63.8, which rounds up to 64.

**Adjustments**
- **Attrition:** divide by the retention rate. With 15% dropout, 64 / 0.85 ≈ 76 per group. With 20% dropout, 64 / 0.80 = 80 per group.
- **One-sided test:** about 51 per group. Reviewers rarely accept this unless you pre-specify direction and justify it.
- **Non-parametric test (Mann-Whitney):** add about 15%, so about 67 per group.
- **Binary outcome:** Cohen's h = 0.5 gives about 63 per group.
- **Unequal allocation:** the total sample size goes up. A 2:1 ratio needs about 96 and 48, or 144 total.
- **Cluster or repeated measures:** inflate by the design effect, 1 + (m − 1)·ICC, for clustering. For ANCOVA with baseline adjustment, multiply by (1 − ρ²).

**How to justify it in the protocol**

1. **Don't rely on "medium" alone.** Cohen's benchmark is a convention. Reviewers prefer an effect size anchored to one of these:
   - the minimal clinically or practically important difference (MCID)
   - a meta-analysis or pilot study. If you use a pilot, take the lower bound of its CI or apply a safeguard correction, because pilot estimates are inflated.
   - a smallest effect size of interest (SESOI)
2. **State every input:** test, α, sidedness, power, effect size, SD (if using raw units), allocation ratio, and the software and version (G*Power 3.1, R `pwr` or `pwr.t.test`, or PASS).
3. **Account for attrition and missing data.** Give the expected rate with a source, and state the final enrolled N.
4. **Tie the calculation to the primary outcome and primary analysis only.** Say how multiplicity is handled for secondary outcomes.
5. **Report the sensitivity:** for example, "With 64 per group, we have 80% power for d ≥ 0.50, and 90% power for d ≥ 0.58."

**Template wording**

> The primary outcome is [outcome], analyzed with a two-sided independent-samples t-test at α = 0.05. A sample of 64 participants per group provides 80% power to detect a standardized mean difference of d = 0.50 [justification: MCID of X units with SD = Y, from Ref Z]. Allowing for 20% attrition, we will enroll 80 participants per group (N = 160). Calculations were performed using G*Power 3.1.9.7.

To check the number in R:
```r
power.t.test(delta = 0.5, sd = 1, sig.level = 0.05, power = 0.80)  # n ≈ 63.77
```

If you tell me your outcome type, design (parallel, clustered, repeated measures), and expected dropout, I can tailor the numbers and the wording.
==== Y ====
**Short answer:** for a medium effect (Cohen's d = 0.5), a two-sided α of .05, 80% power and a two-sample t-test with 1:1 allocation, you need **64 participants per group** (128 total) who provide analyzable data.

I couldn't execute code in this session, so I did not run `scripts/power.py`. These figures come from the standard formula and the well-known G*Power/statsmodels values. Please re-run them before you submit. Check with `sample_size(test="t_ind", effect_size=0.5, power=0.80, alpha=0.05)`.

**Adjustments**
- **Dropout:** 64 is the number you need *analyzed*. With 20% attrition, enrol ⌈64 / 0.8⌉ = **80 per group** (160 total).
- **Other designs:** this applies only to a simple two-group comparison of means. It needs more participants if you have unequal allocation, clustering (design effect = 1 + (m−1)·ICC), several primary endpoints with a corrected α, or a non-t-test analysis such as a mixed model or logistic regression. Those cases usually need simulation.

**Sensitivity range** (80% power, α = .05, per group, analyzed):

| d | n per group |
|---|---|
| 0.3 | ~176 |
| 0.4 | ~100 |
| 0.5 | 64 |
| 0.6 | ~45 |
| 0.7 | ~33 |

**How to justify it in the protocol**

1. **Say where the effect size comes from.** "Medium" is Cohen's convention, which reviewers treat as a last resort. A stronger basis is the smallest effect of interest, meaning the minimal important difference. The next best is a prior or pilot estimate shrunk for inflation. If you only have the convention, say so explicitly.
2. **State every input** so a reader can reproduce the result: the test, α and whether it is two-sided, power, allocation ratio, effect size, software and version, dropout rate and the enrolled n.
3. **Include the sensitivity analysis** in the table above, or as a power curve.
4. **Don't report post-hoc (observed) power.** Report the minimum detectable effect at your achieved n, or the confidence interval.

**Template wording**

> A priori power analysis was conducted to determine the sample size needed to detect a between-group difference of Cohen's d = 0.50 [which we considered the smallest effect of clinical/scientific interest, or: a conventional medium effect, in the absence of prior data]. With α = .05 (two-sided) and power = .80, a two-sample t-test requires n = 64 per group (128 total; computed with [software, version]). Allowing for 20% attrition, we will enrol 80 per group (160 total). A sensitivity analysis showed that required n ranges from about 45 to 100 per group across plausible effects of d = 0.4–0.6.

To tailor this, I need to know:
- Is your outcome continuous and analyzed with a t-test?
- Do you have a basis for the effect size beyond "medium"?
- What dropout rate do you expect?
- Do you have more than one primary endpoint?

######## sample-size#2
==== X ====
**Short answer: 64 per group (128 total)** for a medium effect (Cohen's d = 0.5), two-sided α = 0.05, 80% power, and an independent two-sample t-test with equal allocation. This is the standard G*Power/Cohen value, which is about 63.8 before rounding up. I didn't run any code, so it comes from the formula and the published tables, not from a script I executed.

**Check before you commit to it**

- **Effect size source.** "Medium" is Cohen's convention, which is the weakest justification. Reviewers prefer a smallest effect size of interest (the minimal important difference), or a pilot or prior-study estimate shrunk for inflation. If you only have the convention, say so openly.
- **Dropout.** 64 is the number you need analysed. With 15% attrition, enrol ceil(64 / 0.85) = 76 per group. With 20%, enrol 80 per group.
- **Sensitivity.** The required n per group changes a lot with the effect size:

| d | n per group (analysed) |
|---|---|
| 0.4 | about 100 |
| 0.5 | 64 |
| 0.6 | about 45 |

- **Other design features.** Clustering, unequal allocation, multiple primary endpoints, or a non-t-test analysis (such as a mixed model or logistic regression) all change the number. Clustering needs a design-effect inflation, 1 + (m−1)·ICC. The others usually need a simulation-based calculation.

**Protocol wording (adapt the bracketed parts)**

> A priori power analysis was conducted to determine the sample size needed to detect a between-group difference of Cohen's d = 0.50 **[state basis: smallest effect of clinical interest / minimal important difference of X units with SD Y / conventional medium effect]**. With a two-sided α = 0.05 and 80% power, a two-sample t-test requires 64 participants per group (128 total) **[software and version, e.g. G*Power 3.1 or statsmodels 0.14]**. Allowing for **[20]%** attrition, we will enrol **[80]** per group (**[160]** total). A sensitivity analysis showed the required n ranges from about 45 to 100 per group across plausible effects of d = 0.6 to 0.4. The primary analysis will be **[the exact test planned]**.

**Pitfalls to avoid**

- Don't present one n with no sensitivity range.
- Don't report post-hoc (observed) power.
- If the study is already fixed at a given n, report the minimum detectable effect instead. At 64 per group that is d ≈ 0.5.

If you tell me the outcome type, the SD or minimal important difference, the expected dropout, and whether there is any clustering, I can tailor the numbers and the justification. I can also write a short script that produces the sensitivity table and power curve.
==== Y ====
**Short answer:** about **64 participants per group (128 total)**. This assumes a two-sided independent-samples t-test, Cohen's d = 0.5 (medium), α = 0.05, power = 0.80, and a 1:1 allocation. The exact calculation gives 63.8 per group, which rounds up to 64.

**Adjustments**
- **Attrition:** divide by the retention rate. With 15% dropout, 64 / 0.85 ≈ 76 per group. With 20% dropout, 64 / 0.80 = 80 per group.
- **Non-parametric test (Mann–Whitney):** add about 15%, which gives roughly 74 per group.
- **One-sided test:** about 51 per group. Reviewers rarely accept this unless you can justify it strongly.
- **Other outcomes or designs:** a binary outcome, a clustered design, or a covariate-adjusted (ANCOVA) analysis needs a different calculation.

**How to justify it in the protocol**

1. **State all the inputs.** Give the test, α, power, the effect size and its source, the allocation ratio, the attrition assumption, and the software used (for example G*Power 3.1 or R `pwr::pwr.t.test`).
2. **Say where the effect size comes from.** "Medium" by Cohen's convention is the weakest justification. Stronger options, in order of preference:
   - the minimal clinically or practically important difference (MCID), divided by the expected SD
   - pilot data or a meta-analysis, ideally with a conservative lower confidence bound rather than the point estimate
   - Cohen's benchmark, stated as a fallback with a reason it is plausible for your field
3. **Report the enrolled and analysed numbers separately.**
4. **Add a sensitivity statement** for what the study can detect with the achievable sample, for example "With 64 per group, the study has 80% power for d ≥ 0.5 and about 50% power for d = 0.4."
5. **Address multiplicity.** If there are several primary outcomes or comparisons, say how α is adjusted and whether the sample size reflects that.

**Template wording**

> The primary outcome is [outcome], compared between arms using a two-sided independent-samples t-test at α = 0.05. Assuming a standardized effect of d = 0.5 [based on MCID of X with SD of Y / pilot data / Cohen's convention], 64 participants per group provide 80% power (G*Power 3.1.9.7). Allowing for 20% attrition, we will randomize 80 participants per group (160 total) in a 1:1 ratio.

If you tell me the outcome type, the analysis, the expected dropout and whether you have pilot data, I can adjust the numbers and wording.

######## sample-size#3
==== X ====
**Short answer:** about **64 participants per group (128 total)**. This assumes an independent two-sample t-test, a two-sided α = 0.05, 80% power, and a medium effect of Cohen's d = 0.5.

**Calculation**
- Normal approximation: n ≈ 2(1.96 + 0.84)² / d² = 2(7.85) / 0.25 ≈ 63
- The exact noncentral-t calculation (G*Power, R `pwr.t.test(d=0.5, power=0.8, sig.level=0.05)`) gives 63.77, which rounds up to 64 per group.
- For two proportions, a medium effect of Cohen's h = 0.5 gives about 63 per group.
- If you expect dropout, divide by the retention rate. With 15% attrition, 64 / 0.85 ≈ 76 per group.

**How to justify it in the protocol**
1. **Primary outcome and test.** Name the single primary endpoint and the analysis, for example "difference in mean change in X at week 12, two-sided independent t-test".
2. **Effect size and its source.** Cohen's "medium" is only a convention, and reviewers often push back on it. Better sources are:
   - the minimal clinically important difference (MCID),
   - a pilot study or meta-analysis, with the estimate shrunk conservatively,
   - the SD and the raw difference, stated in outcome units (for example, "a 5-point difference with SD 10 gives d = 0.5").
3. **Error rates.** State α = 0.05 (two-sided) and power = 80%, or 90% if the study is confirmatory.
4. **Software and inputs.** Name the tool and version, and list every input so the calculation can be reproduced.
5. **Attrition and non-compliance.** Give the assumed rate, its source, and the inflated sample size.
6. **Adjustments.** Explain how the plan handles multiple primary outcomes, unequal allocation, clustering, or covariate adjustment. Adjusting for a baseline covariate can reduce the required n.
7. **Sensitivity statement.** For example: "With 64 per group, the study has 80% power for d ≥ 0.5. With 76 per group after attrition, it keeps ≥80% power for d ≥ 0.5 if 15% drop out, and about 80% power for d = 0.45 with full retention."

**Sample protocol text**

> "Sample size was calculated for the primary outcome using a two-sided independent-samples t-test (α = 0.05, power = 0.80). Assuming a standardized effect of d = 0.5 (a mean difference of X with SD Y, based on [reference/MCID]), 64 participants per group are required. Allowing for 15% attrition, we will recruit 76 per group (152 total). Calculations used G*Power 3.1."

If you tell me your outcome type (continuous, binary, or time-to-event), the design (for example clustered, paired, or non-inferiority), and the expected attrition, I can tailor the numbers and the wording.
==== Y ====
**You need about 64 participants per group (128 total)** for a medium effect, assuming the following:

- Cohen's d = 0.5, the conventional "medium" effect.
- A two-sample t-test, two-sided, α = 0.05, 80% power.
- Equal 1:1 allocation.

I couldn't run code here (no shell tool), so this comes from the standard formula, n ≈ 2·(1.96 + 0.84)² / d² plus a small t-correction. It matches the usual G*Power and statsmodels result of 63.77, rounded up. The skill's `scripts/power.py` would reproduce it with `sample_size(test="t_ind", effect_size=0.5, power=0.80)`. I haven't executed it.

**Sensitivity range (n per group, same settings):**

| d | n per group |
|---|---|
| 0.3 | ~176 |
| 0.4 | ~100 |
| 0.5 | ~64 |
| 0.6 | ~45 |
| 0.7 | ~33 |

**Adjustments:**
- **Attrition:** enrol n_analysed / (1 − dropout). With 20% dropout that is 64 / 0.8 = 80 per group, or 160 total.
- **Multiple primary endpoints:** power each test at the corrected α (for example α/m), which raises n.
- **Clustered data** (patients within clinics, for example): multiply n by the design effect, 1 + (m − 1)·ICC. For cluster-randomised designs, simulate instead.
- **Unequal allocation:** if allocation isn't 1:1, the formula needs the allocation ratio.
- **Different analysis:** if you'll use a mixed model, logistic regression or similar, the t-test number doesn't apply. Match the power method to the planned analysis.

**Justifying it in the protocol**

1. **Don't rest the justification on "medium".** Reviewers dislike Cohen's convention as the sole basis. Use it only as a last resort, and say so if you do. Better bases, in order:
   - the smallest effect of clinical or scientific interest (the minimal important difference), converted to d using the expected SD;
   - a prior study or pilot estimate, shrunk, because published and pilot effects tend to be inflated.
2. **Include the sensitivity analysis.** Show how n changes across plausible effect sizes, ideally with a power curve.
3. **Don't report post-hoc power.** If asked later what the study could detect, report the minimum detectable effect at the achieved n, or the confidence interval.

**Template text (edit the bracketed parts):**

> A priori power analysis was conducted to determine the sample size needed to detect a between-group difference of Cohen's d = 0.50 **[state the basis: e.g. the minimal clinically important difference of X units with SD Y, or prior study Z]**. With α = 0.05 (two-sided) and power = 0.80, a two-sample t-test requires n = 64 per group (128 total). Allowing for **[20]%** attrition, we will enrol **[80] per group (160 total)**. A sensitivity analysis showed that the required n ranges from 45 to 100 per group across plausible effects of d = 0.4–0.6. **[If applicable: this accounts for k primary endpoints using α = 0.05/k.]**

To tailor this, I need to know:
- the outcome type: continuous, binary or time-to-event;
- the expected dropout rate;
- how many primary endpoints you have;
- where the effect size comes from.

If the outcome is binary, "medium" would be h = 0.5, which gives about 63 per group. The justification is the same, but the inputs differ.

######## ss-two-group-ko#1
==== X ====
**집단당 133명(총 266명)이 필요합니다.** 이 값은 직접 실행한 결과가 아니라 공식으로 계산한 것입니다. 이 환경에서는 Python을 실행할 수 없어서 statsmodels로 검증하지 못했습니다. 제출 전에 아래 코드로 한 번 확인해 주세요.

## 계산
- 가정: 독립 두 집단 t-검정, 양측, d = 0.4, α = 0.05, 검정력 = 0.90, 1:1 배정
- 정규근사: n = 2(1.960 + 1.282)² / 0.4² ≈ 131.3
- t분포로 보정하면 집단당 약 133명입니다. G*Power 같은 표준 도구도 같은 값을 냅니다.
- 탈락을 고려한 모집 인원: 탈락률 15%면 집단당 157명, 20%면 167명입니다. 계산식은 n/(1−탈락률)이고 올림합니다.

검증 코드:
```python
from statsmodels.stats.power import TTestIndPower
TTestIndPower().solve_power(effect_size=0.4, alpha=0.05, power=0.90, ratio=1.0, alternative='two-sided')
```

## 민감도 분석 (근사치, 집단당)
| d | 0.3 | 0.35 | 0.4 | 0.5 |
|---|---|---|---|---|
| n | ~235 | ~173 | 133 | ~86 |

실제 효과가 0.4보다 작으면 필요한 인원이 크게 늘어납니다. 그래서 IRB 계획서에는 d = 0.4를 고른 근거를 꼭 적어야 합니다. "중간 효과 크기라서"라는 관례만으로는 약합니다. 선행연구나 예비연구의 추정치를 쓰려면 출판 편향 때문에 부풀려졌을 가능성을 감안해 낮춰 잡는 편이 안전합니다. 가장 좋은 근거는 "의미 있다고 볼 수 있는 최소 차이"입니다.

## IRB 계획서용 문단 (초안)
> **표본 크기 산출 근거.** 본 연구의 일차 분석은 두 독립 집단 간 [결과변수] 평균 차이를 비교하는 양측 독립표본 t-검정이다. 표본 크기는 사전 검정력 분석으로 산출하였다. 검출하고자 하는 효과 크기는 Cohen's d = 0.4로 설정하였으며, 이는 [선행연구(저자, 연도)에서 보고된 효과 크기를 보수적으로 조정한 값 / 임상적·실질적으로 의미 있는 최소 차이(○○ 단위, 표준편차 ○○에 해당)]에 근거한다. 유의수준 α = 0.05(양측), 검정력 90%, 집단 간 1:1 배정을 가정하면 집단당 133명(총 266명)이 필요하다. 연구 도중 탈락이나 분석에 쓸 수 없는 자료가 [15]% 발생할 것으로 예상하여 집단당 [157]명(총 [314]명)을 모집할 계획이다. 효과 크기가 d = 0.3~0.5 범위일 때 필요한 표본은 집단당 약 86~235명으로, 이 범위를 민감도 분석으로 검토하였다. 불필요하게 많은 참여자가 연구에 노출되지 않도록 하면서 의미 있는 효과를 충분한 검정력으로 검출할 수 있는 최소 규모로 표본 크기를 정하였다.

대괄호 부분은 직접 채워 주세요. 특히 d = 0.4의 근거와 예상 탈락률은 제가 알 수 없는 값입니다. 둘을 알려 주시면 문단을 맞춰 다시 써 드리겠습니다. 이차 평가변수를 여러 개 검정하거나 반복측정, 군집 설계를 쓴다면 별도 보정이나 시뮬레이션이 필요합니다.
==== Y ====
**집단당 133명**(총 266명)이 필요합니다.

**가정:** 독립표본 t-검정, 양측 검정, 두 집단 크기 동일(1:1), 등분산, Cohen's d = 0.4, α = 0.05, 검정력 = 0.90.

**계산:**
- 정규근사식은 n = 2(z₀.₉₇₅ + z₀.₉₀)² / d² = 2(1.960 + 1.282)² / 0.4² ≈ 131.3입니다. 올림하면 132명입니다.
- 비중심 t분포로 정확히 계산하면 집단당 133명입니다(G*Power와 같은 결과). 계획서에는 이 값을 쓰세요.
- 탈락을 고려한 값은 탈락률이 15%라면 133 / 0.85 ≈ 156.5, 즉 집단당 157명(총 314명)입니다. 탈락률은 연구에 맞게 바꾸세요.

**IRB 계획서 근거 문단 (예시):**

> **표본 크기 산정 근거.** 본 연구의 일차 평가변수는 두 집단 간 평균 차이이며, 독립표본 t-검정(양측)으로 분석할 예정이다. 표본 크기는 G*Power(버전 3.1)를 사용하여 산출하였다. 효과 크기는 Cohen's d = 0.4(소~중간 수준)로 가정하였으며, 이는 [선행연구 인용 또는 임상적으로 의미 있는 최소 차이에 근거한 설정 이유]에 따른 것이다. 유의수준(α) 0.05, 검정력(1–β) 90%, 집단 간 1:1 배정 조건에서 필요한 표본 크기는 집단당 133명(총 266명)으로 산출되었다. 연구 참여 도중 동의 철회 및 탈락이 약 15%로 예상되므로 이를 보정하여 집단당 157명(총 314명)을 목표 대상자 수로 설정하였다. 이는 연구의 과학적 타당성을 확보하는 데 필요한 최소한의 인원이며, 불필요하게 많은 대상자에게 연구 참여 부담이 돌아가지 않도록 검정력 90% 수준에서 산정하였다.

**확인할 점:**
- 효과 크기 0.4의 근거를 대는 것이 IRB에서 가장 자주 지적됩니다. 선행연구의 평균과 표준편차, 또는 최소 임상적 의의 차이(MCID)를 인용해 두세요.
- 단측 검정, 집단 크기 불균등, 비모수 검정(Mann-Whitney 등), 다중 비교를 쓸 경우 필요 인원이 달라집니다. 해당되면 알려주세요. 다시 계산해 드리겠습니다.
- 탈락률 15%는 임의로 넣은 값입니다. 실제 예상치로 바꾸세요.

######## ss-two-group-ko#2
==== X ====
**집단당 133명(총 266명)**이 필요합니다.

**가정:** 독립표본 t-검정, 양측 검정, α = 0.05, 검정력 0.90, Cohen's d = 0.4, 집단 크기 동일, 등분산.

**계산 근거**
- 정규근사식은 n = 2(z₀.₉₇₅ + z₀.₉₀)² / d² = 2(1.960 + 1.282)² / 0.16 ≈ 131.3입니다.
- t분포 보정을 하면 정확해로 약 132.3이 되고, 올림하면 **133명/집단**입니다. 이 값은 G*Power의 결과와 같을 것으로 보지만, 계획서에 넣기 전에 직접 돌려서 확인하세요.

**탈락을 고려한 모집 인원** (계산값 ÷ (1 − 탈락률), 올림)

| 예상 탈락률 | 집단당 | 총 인원 |
|---|---|---|
| 10% | 148 | 296 |
| 15% | 157 | 314 |
| 20% | 167 | 334 |

**IRB 계획서용 문단 (예시)**

> **표본 크기 산출 근거.** 본 연구의 일차 평가변수는 두 집단 간 평균 차이이며, 독립표본 t-검정(양측)으로 분석한다. 효과 크기는 Cohen's d = 0.4(소~중간 효과)로 설정하였다. 이는 [선행연구 인용 또는 임상적으로 의미 있는 최소 차이: 평균 차이 __ , 표준편차 __ 에 근거]에 따른 것이다. 유의수준 α = 0.05(양측), 검정력 90%(1−β = 0.90), 집단 간 1:1 배정을 가정하고 G*Power 3.1로 산출한 결과, 집단당 133명(총 266명)이 필요하였다. 연구 기간 중 약 [10]%의 탈락 또는 자료 결측을 예상하여 집단당 [148]명(총 [296]명)을 모집할 계획이다. 이 표본 크기는 통계적 검정력을 확보하면서도 불필요하게 많은 대상자가 연구에 노출되지 않도록 하는 최소한의 규모이다.

**확인할 점**
- d = 0.4를 선택한 이유를 선행연구나 최소 임상적 의미 차이로 대야 합니다. IRB와 심사위원이 가장 자주 묻는 부분입니다.
- 비정규 분포이거나 Mann-Whitney 검정을 쓸 계획이면 표본 수가 약 5~15% 늘어납니다.
- 다중 비교, 공변량 보정(ANCOVA), 군집 설계가 있으면 계산을 다시 해야 합니다.

탈락률, 분석 방법, 선행연구 정보를 알려주시면 문단을 그에 맞게 고쳐 드리겠습니다.
==== Y ====
**집단당 약 133명(총 266명)이 필요합니다.** 이 값은 직접 실행한 결과가 아니라 공식으로 계산한 값입니다. 이 환경에서는 Python을 실행할 수 없었습니다.

## 계산

독립 두 집단 평균 비교(양측 t-검정, 1:1 배정, d = 0.4, α = 0.05, 검정력 0.90)를 가정했습니다.

- 정규근사식은 n = 2(z₀.₉₇₅ + z₀.₉₀)² / d² = 2(1.960 + 1.282)² / 0.16 ≈ 131.3이므로 132명입니다.
- t분포를 반영하면 보통 1명 정도 늘어 133명이 됩니다. 이 133은 제가 알고 있는 G*Power류 결과에 따른 값입니다.
- 계획서에 넣기 전에 아래 명령으로 확인하세요.

```python
from statsmodels.stats.power import TTestIndPower
TTestIndPower().solve_power(effect_size=0.4, alpha=0.05, power=0.9, ratio=1.0, alternative='two-sided')
```

탈락률 15%를 가정하면 모집 인원은 ⌈133 / 0.85⌉ = 157명(총 314명)입니다. 탈락률은 연구에 맞게 바꾸세요.

## 민감도 분석 (정규근사 기준, 실제로는 1명 안팎 더 클 수 있음)

| 효과 크기 d | 집단당 n |
|---|---|
| 0.30 | 약 234 |
| 0.35 | 약 172 |
| 0.40 | 약 133 |
| 0.50 | 약 85~86 |

## IRB 계획서용 근거 문단

> 표본 크기는 사전 검정력 분석(a priori power analysis)으로 산출하였다. 주요 평가변수는 [변수명]의 집단 간 평균 차이이며, 효과 크기는 Cohen's d = 0.40으로 설정하였다. 이는 [선행연구(인용) / 임상적·실무적으로 의미 있는 최소 차이(MID) / 예비연구 결과를 보수적으로 조정한 값]에 근거한다. 유의수준 α = 0.05(양측), 검정력 90%, 1:1 배정, 독립표본 t-검정을 가정할 때 집단당 133명(총 266명)이 필요하다. 예상 탈락률 [15]%를 고려하여 집단당 [157]명(총 [314]명)을 모집할 계획이다. 효과 크기 추정의 불확실성을 고려하여 d = 0.30~0.50 범위에서 민감도 분석을 수행하였으며, 이 경우 필요 표본은 집단당 약 86명에서 약 235명이다. 본 연구는 연구 대상자를 불필요하게 많이 모집하지 않으면서도 의미 있는 효과를 검출할 수 있는 최소한의 규모로 설계되었다. (산출 도구: [statsmodels x.x / G*Power 3.1])

## 확인할 점

- **효과 크기 d = 0.4의 근거:** 대괄호 부분은 반드시 채워야 합니다. 근거 없이 "중간 정도"라고만 쓰면 심의에서 지적받기 쉽습니다. Cohen의 관례값은 마지막 수단으로만 쓰고, 그렇게 했다면 문단에 명시하세요.
- **분석 방법:** 실제 분석이 t-검정이 아니라 공변량 보정(ANCOVA), 혼합모형, 비모수 검정이라면 계산이 달라질 수 있습니다.
- **다중 비교:** 평가변수가 여러 개라면 보정한 α로 다시 계산해야 합니다.
- **군집 구조:** 반이나 병원처럼 군집이 있으면 설계효과(DEFF)를 곱해야 합니다.

탈락률, 효과 크기의 출처, 분석 방법을 알려주시면 문단을 그에 맞게 고치겠습니다.

######## ss-two-group-ko#3
==== X ====
**집단당 133명 (총 266명)** 이 필요합니다.

**가정:** 독립 두 집단, 양측 검정, 등분산, 1:1 배정, Cohen's d = 0.4, α = 0.05, 검정력 90%.

**계산:** 정규근사로 n = 2(z₀.₀₂₅ + z₀.₁₀)² / d² = 2(1.960 + 1.282)² / 0.4² ≈ 131.3입니다. t분포 보정으로 약 2명이 늘어 133명이 됩니다. 이 133명은 G*Power의 알려진 결과와도 일치합니다. 다만 이번 환경에서는 코드를 실행하지 못했습니다. 위 수치는 공식으로 계산한 값이며 statsmodels로 재확인한 것이 아닙니다. 제출 전에 `sample_size(test="t_ind", effect_size=0.4, power=0.90, alpha=0.05)`로 확인하세요.

**탈락을 반영한 모집 인원** (n ÷ (1 − 탈락률)):

| 탈락률 | 집단당 모집 | 총 모집 |
|---|---|---|
| 10% | 148 | 296 |
| 15% | 157 | 314 |
| 20% | 167 | 334 |

**민감도 분석** (집단당 분석 대상 수, 근사치):

| d | 0.30 | 0.35 | 0.40 | 0.45 | 0.50 |
|---|---|---|---|---|---|
| n | ~235 | ~173 | 133 | ~105 | ~86 |

---

## IRB 계획서용 근거 문단 (초안)

> 본 연구의 표본 크기는 두 독립 집단 간 평균 차이를 검정하는 독립표본 t-검정(양측)을 기준으로 사전 검정력 분석을 통해 산정하였다. 효과 크기는 [근거 기재: 선행연구 OOO(연도)의 결과 / 임상적·실무적으로 의미 있는 최소 차이(MCID) / 예비연구 결과를 보수적으로 조정한 값]에 따라 Cohen's d = 0.4로 설정하였다. 유의수준 α = 0.05(양측), 검정력 90%(1 − β = 0.90), 집단 간 배정비 1:1을 가정하였을 때, 집단당 133명(총 266명)이 분석에 필요하다. 연구 기간 중 예상되는 탈락률 [15]%를 반영하여 집단당 [157]명, 총 [314]명을 모집할 계획이다. 효과 크기가 d = 0.3~0.5 범위에서 달라질 경우 집단당 필요 인원은 약 86~235명이며, 본 연구는 d = 0.4 이상의 효과를 90% 검정력으로 검출하도록 설계되었다. 표본 수 산정에는 [G*Power 3.1 / Python statsmodels]를 사용하였다. 불필요한 대상자 노출을 최소화하면서도 연구 결과의 과학적 타당성을 확보할 수 있는 수준으로 표본 크기를 정하였다.

**제출 전에 확인할 것:**
- **효과 크기 근거:** d = 0.4를 어떻게 정했는지 대괄호 부분을 채워야 합니다. 근거 없이 "중간 정도 효과"라고만 쓰면 심사에서 지적받기 쉽습니다. 선행연구나 예비연구 값을 쓴다면 출판 편향 때문에 과대추정되기 쉬우니 줄여서 적용하는 편이 안전합니다.
- **탈락률:** 15%는 예시값입니다. 연구 특성에 맞게 바꿔 주세요.
- **분석 방법이 다를 때:** 공변량 보정(ANCOVA), 반복측정, 군집 배정, 다중 비교 보정을 쓴다면 위 계산이 맞지 않습니다. 계획된 분석 방법을 알려 주시면 그에 맞춰 다시 계산하겠습니다.
==== Y ====
## 결론

**집단당 133명 (총 266명)** 이 필요합니다.

가정은 독립 두 표본 t-검정, 양측 검정, 1:1 배정, Cohen's d = 0.4, α = 0.05, 검정력 90%입니다.

- 정규근사 공식은 n = 2(z₁₋α/₂ + z₁₋β)² / d² = 2(1.960 + 1.282)² / 0.4² ≈ 131.3이고, 올림하면 132명입니다.
- 비중심 t분포로 정확히 계산하면 집단당 133명입니다. G*Power의 결과도 같습니다.
- 탈락이 예상되면 n / (1 − 탈락률)로 보정합니다. 탈락률 15%이면 133 / 0.85 ≈ 156.5, 즉 **집단당 157명 (총 314명)** 입니다.

재현 코드(R)는 `power.t.test(delta = 0.4, sd = 1, sig.level = 0.05, power = 0.90)`이고, 결과는 n ≈ 132.3입니다. 올림하면 133명입니다.

## IRB 계획서용 근거 문단

> **표본 수 산정 근거.** 본 연구의 일차 평가변수는 두 독립 집단 간 평균 차이이며, 독립 두 표본 t-검정(양측)으로 분석할 계획이다. 표본 수는 효과 크기(Cohen's d) 0.4, 유의수준(α) 0.05, 검정력(1−β) 90%, 집단 간 1:1 배정을 가정하여 산정하였다. 효과 크기 0.4는 [선행연구 인용 또는 임상적·실질적으로 의미 있다고 판단되는 최소 차이에 대한 근거 기재]를 바탕으로 설정하였다. G*Power 3.1(또는 R의 `power.t.test`)로 계산한 결과, 집단당 최소 133명(총 266명)이 필요하였다. 연구 기간 중 약 15%의 탈락 또는 분석 제외를 예상하여 집단당 157명(총 314명)을 모집할 계획이다. 이는 통계적 목적을 달성하는 데 필요한 최소한의 인원으로, 불필요하게 많은 참여자가 연구에 노출되지 않도록 하면서도 의미 있는 차이를 검출할 수 있는 충분한 검정력을 확보하기 위한 것이다.

## 제출 전 확인할 점

- **효과 크기 d = 0.4의 출처**를 꼭 적으세요. IRB와 심사위원이 가장 자주 묻는 부분입니다. 선행연구의 평균·표준편차나 최소 임상적 의미 차이(MCID)로 뒷받침하면 좋습니다.
- **탈락률 15%는 예시**입니다. 연구 특성에 맞게 바꾸세요.
- 다중 비교, 비모수 검정, 군집 설계, 비균등 배정을 쓴다면 계산이 달라지니 알려주세요. 다시 계산해 드리겠습니다.

######## ss-animal-ko#1
==== X ====
**결론: 군당 17마리, 총 34마리**입니다. 효과크기가 d = 1(평균 차이 = 1 SD)일 때 독립 두 표본 t-검정 기준입니다.

**계산 근거**
- 가정: 양측 검정, α = 0.05, 검정력 80%, 군당 동일 마릿수
- 정규근사 공식 n = 2(Z₁₋α/₂ + Z₁₋β)² / d² = 2(1.96 + 0.84)² / 1 ≈ 15.7
- t분포로 보정하면 군당 17마리(실제 검정력 약 0.81)입니다.

**조건별 마릿수 (군당)**

| 조건 | 군당 마릿수 |
|---|---|
| d = 1, 검정력 80% | **17** |
| d = 1, 검정력 90% | 23 |
| d = 0.8, 검정력 80% (보수적 가정) | 26 |
| d = 1, 검정력 80%, 탈락 10% 보정 | 19 (17 / 0.9) |

**위원회에 함께 적으면 좋은 점**
1. **효과크기의 출처**: 선행 연구의 d = 1은 과대추정일 가능성이 큽니다. 선행 연구가 소규모였거나 유의한 결과만 보고됐다면 특히 그렇습니다. 그래서 d = 0.8 같은 보수적 가정을 병기하면 설득력이 올라갑니다.
2. **탈락 보정**: 폐사나 제외가 예상되면 n / (1 − 탈락률)로 늘립니다.
3. **3R 원칙(감소)**: 검정력 분석을 근거로 필요한 최소 마릿수를 산정했다고 명시합니다.
4. **분석 방법**: 주 평가변수, 검정 방법(t-검정 등), α와 검정력, 사용한 소프트웨어(G*Power, R `pwr` 패키지 등)를 적습니다.
5. **설계가 다르면 계산도 달라집니다**: 군이 3개 이상이거나 반복측정, 짝지은 설계, 비모수 검정이면 다시 계산해야 합니다.

R로 재현하려면 `power.t.test(delta = 1, sd = 1, sig.level = 0.05, power = 0.8)`을 실행하면 됩니다.

주 평가변수와 군 수를 알려주시면 그 설계에 맞춰 다시 계산해 드리겠습니다.
==== Y ====
**결론:** 선행 연구의 효과 크기(d ≈ 1.0)를 그대로 쓰면 군당 약 17마리(총 34마리)입니다. 다만 이 값을 그대로 제출하지 않는 편이 안전합니다. 아래 근거를 참고하세요.

**계산 가정**
- 효과 크기는 선행 연구의 평균 차이가 SD 1배이므로 Cohen's d = 1.0입니다.
- 검정은 양측 독립 2표본 t-검정, α = 0.05입니다.
- 두 군의 마릿수는 같게 잡았습니다.
- 계산은 공식과 표준 표(정규 근사에 t 보정)를 기준으로 했습니다. 이 환경에서는 코드를 실행하지 못했으므로 statsmodels로 실행한 값이 아닙니다. 제출 전에 `NormalIndPower`/`TTestIndPower` 또는 G*Power로 한 번 재확인하세요.

**민감도 분석 (군당 마릿수, 근사값)**

| 가정하는 d | 검정력 80% | 검정력 90% |
|---|---|---|
| 1.0 (선행 연구 그대로) | 17 | 23 |
| 0.8 | 26 | 34 |
| 0.7 | 33 | 44 |
| 0.6 | 45 | 59 |

**d = 1.0을 그대로 쓰면 안 되는 이유**
- 발표된 효과 크기는 출판 편향 때문에 실제보다 부풀려져 있는 경우가 많습니다.
- 선행 연구의 표본이 작았다면 d의 불확실성도 큽니다.
- 그래서 d를 0.8 정도로 낮춰 잡거나, 선행 연구 d의 신뢰구간 하한을 쓰는 것을 권합니다. 이렇게 하면 군당 약 26마리(80% 검정력)가 됩니다.
- 더 좋은 기준은 "생물학적으로 의미 있는 최소 차이"입니다. 그 차이를 근거로 d를 정할 수 있으면 그 값을 쓰세요.

**탈락 보정**
- 위 값은 분석에 들어가는 마릿수입니다. 실제 입수 마릿수는 `n / (1 − 탈락률)`로 늘려야 합니다.
- 예를 들어 d = 0.8, 검정력 80%에서 탈락률이 10%라면 26 ÷ 0.9 ≈ 29마리입니다.
- 동물실험윤리위원회는 3R 중 감소(Reduction) 원칙을 보므로, 탈락률 가정도 근거와 함께 적는 게 좋습니다.

**위원회 제출용 문장 예시**
> 선행 연구(출처)에서 두 군의 차이가 약 1 SD였으나, 효과 크기 과대추정 가능성을 고려해 보수적으로 d = 0.8을 가정하였다. 양측 α = 0.05, 검정력 80%에서 독립 2표본 t-검정에 필요한 마릿수는 군당 26마리이며, 예상 탈락률 10%를 반영해 군당 29마리(총 58마리)를 사용한다.

**확인이 필요한 사항**
1. 주요 평가변수 하나가 연속형이고 대략 정규분포를 따르나요? 비율이나 생존 같은 결과라면 계산이 달라집니다.
2. 비교가 처리군과 대조군 두 군뿐인가요? 용량군이 여러 개이거나 평가변수가 여러 개면 다중비교 보정으로 마릿수가 늘어납니다.
3. 케이지 단위로 처리하거나 한 마리에서 여러 번 측정하나요? 그렇다면 개체나 케이지를 실험 단위로 잡아야 하고, 군집 보정이 필요합니다.
4. 예상 탈락률이 있나요?

이 네 가지를 알려주시면 최종 마릿수를 확정하고, 검정력 곡선 코드도 만들어 드리겠습니다.

######## ss-animal-ko#2
==== X ====
**결론: 선행 연구 효과크기(d = 1.0)를 그대로 쓰면 군당 약 17마리(총 34마리)입니다. 다만 이 값은 과대추정일 가능성이 커서, 위원회 제출용으로는 군당 20~26마리 정도를 권합니다.**

이 값들은 공식(정규근사 후 t분포 보정)과 G*Power에서 흔히 나오는 값으로 정리한 것이고, 이 환경에서 코드를 실행해 확인한 것은 아닙니다. 제출 전에 `statsmodels`의 `power.py`로 한 번 재현해 보세요.

**가정**
- 효과크기: 평균 차이 ÷ SD = Cohen's d = 1.0 (선행 연구 기준)
- 양측 검정, α = 0.05, 독립 두 군 t-검정, 군당 동일 마릿수

| 효과크기 d | 검정력 80% (군당) | 검정력 90% (군당) |
|---|---|---|
| 1.0 (선행 연구 그대로) | 17 | 23 |
| 0.8 | 26 | 34 |
| 0.7 | 33 | 44 |
| 0.6 | 45 | 60 |

**d를 낮춰 보는 이유**
- 발표된 효과크기는 출판 편향 때문에 부풀려지는 경향이 있습니다. 선행 연구의 d = 1.0을 그대로 쓰면 실제 연구는 검정력이 부족해질 수 있습니다.
- 그래서 d = 0.8 정도로 보수적으로 잡아 군당 약 26마리로 하거나, 최소한 d = 1.0에 검정력 90%를 적용한 군당 23마리를 고려해 보세요.
- 가능하면 "생물학적으로 의미 있는 최소 차이"를 근거로 삼는 것이 가장 방어적입니다.

**탈락 보정**
계산값은 분석에 쓸 수 있는 마릿수입니다. 사망·탈락·시료 불량이 예상되면 `n ÷ (1 − 탈락률)`로 늘려야 합니다. 예를 들어 군당 17마리에 10% 탈락이면 19마리, 군당 26마리에 10% 탈락이면 29마리입니다.

**위원회 제출용 문장 예시**
> 선행 연구에서 두 군의 평균 차이는 표준편차 정도(d ≈ 1.0)였다. 효과크기 과대추정 가능성을 고려해 d = 0.8로 보수적으로 가정하고, 양측 α = 0.05, 검정력 80%에서 독립 t-검정으로 계산한 결과 군당 26마리가 필요했다. 탈락률 10%를 감안해 군당 29마리(총 58마리)를 사용한다. 민감도 분석상 d = 1.0이면 군당 17마리, d = 0.6이면 45마리가 필요하다.

이 문장에는 선행 연구의 출처(저자, 연도, 지표)를 같이 적으세요. 위원회는 효과크기의 근거를 가장 먼저 봅니다.

**정확도를 높이려면 아래 내용을 알려 주세요.**
1. 평가 지표가 연속형 평균 비교가 맞나요? 비율(발생률)이나 반복측정이라면 계산법이 달라집니다.
2. 군이 2개뿐인가요, 아니면 용량군이 더 있나요? 여러 군이면 다중비교 보정이 필요합니다.
3. 예상 탈락·사망률은 얼마인가요?
4. 한 마리에서 여러 측정값(세포, 조직 절편 등)을 얻나요? 이 경우 마릿수가 아니라 측정 수를 표본 수로 세면 안 됩니다.
5. 암수를 모두 쓰나요?
==== Y ====
**권장: 군당 17마리(총 34마리)**

**계산 근거**
- 효과크기: Cohen's d = 1.0 (평균 차이 ÷ 표준편차)
- 검정: 양측 독립 2표본 t-검정, α = 0.05
- 검정력 80%일 때 군당 약 17마리 (정규근사 15.7에 t분포 보정을 적용)
- 검정력 90%일 때 군당 약 23마리

**위원회 제출용 문구 예시**
> 선행연구에서 관찰된 효과크기(d = 1.0)를 가정하고, 유의수준 0.05(양측), 검정력 80%로 독립 2표본 t-검정을 시행할 때 필요한 표본 수는 군당 17마리이다. 탈락률 10%를 고려해 군당 19마리, 총 38마리를 신청한다.

**조정할 점**
- **탈락·이상 개체:** 예상 탈락률이 10%면 17÷0.9 ≈ 19마리, 15%면 20마리로 늘립니다.
- **효과크기 과대추정:** 선행연구의 효과크기는 대개 실제보다 크게 나옵니다(winner's curse). 위원회가 이를 지적하면 d = 0.8을 가정해 군당 26마리로 보수적으로 잡는 방법도 있습니다.
- **비모수 검정:** Mann-Whitney 검정을 쓸 계획이면 약 15%를 더합니다(군당 약 20마리).
- **다군 비교나 반복측정:** 군이 3개 이상이거나 반복측정이면 계산이 달라지니 알려 주세요.
- **계산 도구:** G*Power(t tests → Means: difference between two independent means)나 R의 `power.t.test(delta=1, sd=1, power=0.8)`로 재현해 근거 자료로 첨부할 수 있습니다.

주 평가변수가 연속형이고 정규분포에 가깝다고 가정했습니다. 비율이나 생존율이 평가변수라면 계산이 달라집니다.

######## ss-animal-ko#3
==== X ====
**결론:** 선행 연구 효과를 그대로 쓰면 군당 약 17마리가 필요하고, 효과가 과대추정됐을 가능성을 반영하면 군당 약 26마리(탈락 포함 약 29마리)를 권합니다. 코드는 실행하지 못해 공식과 표준 표 값으로 계산했습니다. 최종 제출 전에 `statsmodels`나 G*Power로 한 번 재확인해 주세요.

**전제 조건**
- 평균 차이가 SD 정도이므로 Cohen's d = 1.0입니다.
- 두 독립군을 양측 t-검정으로 비교하고, α = 0.05, 검정력 80%를 가정했습니다.
- 군당 필요한 분석 대상 수는 다음과 같습니다.

| 가정한 d | 검정력 80% | 검정력 90% |
|---|---|---|
| 1.0 (선행 연구 그대로) | 17 | 23 |
| 0.8 (효과를 줄여 반영) | 26 | 34 |
| 0.7 | 34 | 45 |
| 0.6 | 45 | 60 |

**d = 1.0을 그대로 쓰지 않는 이유**
- 발표된 선행 연구의 효과는 출판 편향 때문에 대개 실제보다 큽니다.
- 그래서 d를 0.7~0.8 정도로 줄여 잡는 편이 방어하기 좋습니다.
- 위원회에는 d = 0.8, 검정력 80%, 군당 26마리를 주 근거로 쓰고, 표의 나머지 값은 민감도 분석으로 함께 제시하는 구성을 권합니다.

**탈락·제외 보정**
- 등록 마릿수는 분석 대상 수 ÷ (1 − 탈락률)로 계산합니다.
- 탈락률 10%를 가정하면 d = 0.8일 때 군당 29마리입니다.
- 탈락률 20%를 가정하면 군당 33마리입니다.
- 실제 탈락률은 과거 실험이나 처치의 독성에 맞춰 정하세요.

**윤리위 문서에 넣을 내용**
- 효과 크기의 출처(선행 연구 인용)와 이를 줄여 잡은 이유
- α, 검정력, 양측 검정 여부, 사용할 검정 방법
- 탈락 보정과 최종 등록 마릿수
- 민감도 표(위 표)

**확인이 필요한 사항**
1. 결과변수가 연속형이고 t-검정으로 분석하나요? 비율이나 생존 같은 변수면 계산이 달라집니다.
2. 군이 2개뿐인가요? 처리군이 여러 개면 다중비교 보정으로 마릿수가 늘어납니다.
3. 한 케이지에 여러 마리를 같이 키우고 처리가 케이지 단위로 들어가나요? 그렇다면 케이지가 실험 단위가 되어 마릿수 계산이 달라집니다.
4. 한 마리에서 여러 번 측정하나요? 이 경우에도 개체 수 계산이 달라질 수 있습니다.

위 정보를 알려주시면 이에 맞춰 근거 문단을 작성해 드리겠습니다.
==== Y ====
**결론: 군당 17마리, 총 34마리**가 기본값입니다. 탈락을 감안하면 군당 19마리 정도로 신청하면 됩니다.

**계산 근거**
- 효과크기: Cohen's d = 평균 차이 ÷ SD = 1.0
- 검정: 두 독립집단 비교(양측 t-검정), α = 0.05
- 검정력 80%: 군당 약 **17마리**. 정규근사 공식 n ≈ 2(1.96+0.84)²/d² ≈ 15.7에 t분포 보정을 하면 17입니다.
- 검정력 90%: 군당 약 **23마리**

**위원회 제출용 문장 예시**
> 선행 연구에서 관찰된 효과크기(d = 1.0)를 기준으로, 양측 α = 0.05, 검정력 80%의 독립표본 t-검정에 필요한 표본 수를 G*Power로 산출한 결과 군당 17마리였다. 실험 중 탈락률 10%를 고려하여 군당 19마리(총 38마리)를 사용한다.

**탈락 보정:** n ÷ (1 − 탈락률)로 계산합니다. 탈락률 10%이면 17 ÷ 0.9 ≈ 19입니다.

**주의할 점**
- 선행 연구의 효과크기는 과대추정된 경우가 많습니다. 위원회가 보수적 근거를 요구하면 d = 0.8을 쓰세요. 이 경우 군당 약 26마리입니다.
- 종속변수가 비정규이거나 비모수 검정(Mann-Whitney)을 쓸 계획이면 약 5~15% 더 필요합니다.
- 비교 군이나 측정 시점이 늘어나면(ANOVA, 반복측정, 다중비교 보정) 계산이 달라집니다.
- 3R 원칙(감소)에 맞추려면 위 근거와 함께, 무작위 배정과 눈가림을 하고 더 줄일 수 없는 이유를 적으세요.

탈락률, 군 수, 검정 방법을 알려주시면 그 조건에 맞춰 다시 계산해 드리겠습니다.

######## ss-ab-test#1
==== X ====
**Short answer:** the arithmetic needs only about 2 to 3 days, but run it for at least 14 days (two full weekly cycles). If you want to detect a smaller lift than 3 points, plan for about 5 days (14%) or about 17 days (13%).

**Assumptions:** two-sided α = 0.05, 80% power, two-proportion test, 1:1 split, and all 2,000 daily visitors enter the test. I calculated this by hand with the standard formula and did not execute any code, so treat the numbers as approximate.

**Main calculation (12% → 15%)**
- Cohen's h ≈ 0.088.
- That needs about 2,040 visitors per arm, or about 4,080 in total.
- At 2,000 visitors a day (1,000 per arm), that is about 2.1 days.

**Why not stop after 3 days**
- **Weekly cycles:** weekday and weekend visitors often convert differently. Run whole weeks so both are represented equally. That gives a minimum of 7 days, and 14 is safer.
- **Novelty effects:** new flows often look different in the first few days. Two weeks lets you check whether the lift holds.
- **Fixed duration:** commit to the duration up front. Stopping the moment p < 0.05 inflates false positives.

**Sensitivity to the true lift**

| True conversion | Per arm | Total | Days at 2,000/day |
|---|---|---|---|
| 15% (your target) | ~2,040 | ~4,100 | ~2 |
| 14% | ~4,400 | ~8,900 | ~4.5 |
| 13% | ~17,200 | ~34,300 | ~17 |

Is a 3-point lift your smallest effect worth acting on, or just what you hope for? If a 1-point gain would still justify shipping, the test needs about 17 days. Size it to the smallest lift you'd act on, not the best case. With 14 days you have about 28,000 visitors, which can detect a lift to roughly 13.3% at 80% power.

**Things to check**
- **Conversion definition:** the 12% should be measured on the same population and window as the test.
- **Dropout and exclusions:** bots, repeat visitors and visitors who are not assigned to an arm reduce the usable sample. Inflate the numbers if that's significant.
- **Secondary metrics:** if you'll also test several secondary metrics, correct α for them, which raises the required n.

If you'd like exact figures, I can write a short script using `statsmodels` and the skill's `power.py`. I can't run code in this session, so you'd need to run it.
==== Y ====
**Run it for 7 days.** The sample size only requires about 2–3 days, but a full week covers weekday and weekend behavior.

**Assumptions:** two-sided test, α = 0.05, 80% power, baseline 12%, target 15% (a 3-point absolute lift).

**Sample size:** you need about 2,040 visitors per arm, or about 4,070 in total. At 2,000 visitors a day (1,000 per arm), that is about 2.04 days, so 3 days at the very least.

**Why 7 days:**
- Conversion usually varies by day of week, so a test shorter than a week can be biased.
- It gives you some buffer if traffic dips.
- Fix the duration in advance and don't stop early when the result first looks significant. Peeking inflates false positives.

**Sensitivity to the lift you expect:**

| True lift | Per arm | Total days at 2k/day |
|---|---|---|
| 12% → 15% | ~2,040 | ~2.1 |
| 12% → 14% | ~4,440 | ~4.4 |
| 12% → 13% | ~16,000 | ~16 |

Going from 80% to 90% power at the 12% → 15% lift raises the requirement to about 2,725 per arm, or about 2.7 days.

A 3-point lift is a large effect for an onboarding change. If you'd still care about a 1–2 point improvement, plan for 1–2 weeks (14 days is a safe choice). Then a null result at 7 days wouldn't leave you unsure whether the change did nothing or the test was underpowered.

Also check that the 2,000 daily visitors are all eligible for onboarding, meaning new users. If only a fraction reach the flow, use that smaller number to compute duration.

######## ss-ab-test#2
==== X ====
**Short answer:** the sample size needs only about 2–3 days of traffic, but I'd run the test for **at least 7 days, ideally 14**, to cover weekly cycles. I couldn't execute code here, so these are formula-based numbers (normal approximation, two-proportion test) and I haven't run them.

**Inputs**
- Baseline is 12% and the target is 15%, an absolute lift of 3 points (25% relative).
- The test is two-sided with α = 0.05 and 80% power, split 50/50.
- I'm assuming all 2,000 daily visitors are eligible to enter the onboarding flow. If only new users or signups count, use that number instead.

**Result**
- Required sample is about **2,030 per arm**, or about **4,060 total**.
- At 2,000 visitors a day, that is about **2 days**.

**Sensitivity**

The 15% target is what you hope for, not the smallest lift that would matter to the business. If a smaller lift would still justify shipping, power for that instead.

| True rate for new flow | Per arm | Total | Days at 2,000/day |
|---|---|---|---|
| 15% (80% power) | ~2,030 | ~4,060 | ~2 |
| 15% (90% power) | ~2,720 | ~5,440 | ~2.7 |
| 14% (80% power) | ~4,440 | ~8,870 | ~4.5 |
| 13% (80% power) | ~17,170 | ~34,300 | ~17 |

Required n grows quickly as the effect shrinks. If the real lift is 1 point rather than 3, a 2-day test would probably miss it.

**Recommendation**
1. **Run for 14 days.** That's about 28,000 visitors, which covers weekday and weekend behavior and gives you power to detect a lift of roughly 1.5 points or more.
2. **Fix the duration in advance.** Don't stop early when the result first looks significant, because that inflates false positives.
3. **Adjust if your conversion event lags.** If users convert days after onboarding, add that window to the run time.
4. **Account for multiple metrics.** If you'll judge the test on secondary metrics or segments, those need more traffic or a stricter α.

If you tell me which metric defines "conversion" and the smallest lift you'd act on, I can tighten these numbers.
==== Y ====
**Recommendation: run it for 14 days.** The sample size alone is met in about 3 days, but you should still cover full weekly cycles.

**Sample size** (two-sided two-proportion test, α = 0.05, 80% power, 12% → 15%):

- You need about 2,040 visitors per arm, or about 4,080 in total.
- At 1,000 visitors per arm per day, that takes about 2.1 days.
- With 90% power you need about 2,730 per arm, which takes about 2.7 days.

**Why 14 days rather than 3:**
- Conversion usually differs between weekdays and weekends. A test that covers only part of a week can be biased.
- Two full weeks also reduces novelty effects and gives you a buffer.
- 14 days is about 28,000 visitors, or 14,000 per arm. That is enough to detect a smaller lift of about 1.2 percentage points (12% → ~13.2%) at 80% power. That matters because a real lift is likely to be smaller than the 3-point target.

**Caveats:**
- Decide the duration up front and don't stop early when the result first looks significant. Peeking inflates false positives. If you need interim looks, use a sequential testing method.
- The calculation assumes the 12% baseline is accurate and that "visitors" are unique users randomized once. If a visitor can return and be counted several times, the effective sample is smaller.
- If you also care about downstream metrics such as activation or retention, those need their own sample size calculation. They will probably need a longer test.

######## ss-ab-test#3
==== X ====
**Run it for at least 7 days, and 14 is safer.** The sample size only needs about 2 days of traffic. The extra time is for weekly cycles and for the chance that the true lift is smaller than 3 points.

**Inputs**
- Baseline conversion is 12%, and the target is 15%, a lift of 3 percentage points.
- It's a two-sided test of two proportions, with α = 0.05 and 80% power.
- Traffic is 2,000 visitors a day split 50/50, so 1,000 per arm per day.
- The 15% is what you hope to reach, not a minimum effect that matters to the business. I used it as the effect size anyway, and the sensitivity table below shows what happens if the lift is smaller.

**Result**
- Cohen's h is about 0.088.
- That needs about 2,030 visitors per arm, or about 4,060 in total.
- At 2,000 visitors a day, that's about 2 days.

I calculated this by hand from the formula. I had no way to run code here, so the `scripts/power.py` check from the skill was not executed.

**Sensitivity**

| True conversion in the new flow | Visitors per arm | Days at 1,000 per arm per day |
|---|---|---|
| 15% (+3 points), 80% power | ~2,030 | ~2 |
| 15% (+3 points), 90% power | ~2,720 | ~2.7 |
| 14% (+2 points), 80% power | ~4,440 | ~4.4 |
| 13% (+1 point), 80% power | ~17,200 | ~17 |

**Recommendation**
- **Duration:** Run for 14 days, or 7 at minimum. Conversion usually differs between weekdays and weekends, so use whole weeks. Two weeks gives about 28,000 visitors, which is enough to detect a lift of roughly 1.2 points or more at 80% power.
- **Stopping rule:** Fix the duration before you start. Don't stop early when the result first looks significant, because that inflates false positives.
- **Novelty effect:** A new flow can look better at first just because it's new. Two weeks gives you a chance to see that fade.
- **Counting visitors:** Make sure "visitors" means the people who actually enter the onboarding flow. If only part of your 2,000 a day does, the timeline stretches in proportion.
- **Secondary metrics:** If you also test secondary metrics or segments, each one needs a larger sample.

If you tell me the smallest lift that would justify shipping the new flow, I can rerun this with that number.
==== Y ====
**Short answer: about 2–3 days of traffic is enough statistically, but run it for at least 7 days, and 14 is better.**

**Sample size**

I assumed a two-sided test at α = 0.05 with 80% power, detecting 12% → 15%:

- You need about 2,040 visitors per arm, or about 4,070 in total.
- At 1,000 visitors per arm per day, that takes about 2.1 days.
- With 90% power you need about 2,725 per arm, which takes about 2.7 days.

**Why run longer than 3 days**

- **Weekly cycles:** Behavior differs between weekdays and weekends. Run whole weeks so both arms see the same mix.
- **Novelty effects:** A new flow can look better or worse in the first few days. A second week helps you see whether the lift holds.
- **Smaller effects:** The calculation only has power to detect a lift of 3 points or more. If the true lift is 1 point (12% → 13%), you need about 17,000 per arm, or about 17 days. If a smaller lift would still matter to you, plan for 2–3 weeks.
- **Peeking:** Don't stop early when the result first looks significant. Fix the duration up front, or use a sequential testing method.

**Assumptions to check**

- The 2,000 per day are unique visitors who actually enter the onboarding flow. If only a fraction do, scale the timeline up by that fraction.
- Conversion is measured per visitor, not per session.
- The 12% baseline is stable and recent.

If you give me your preferred power, significance level, or the smallest lift you care about, I can rerun the numbers.

######## ss-cluster#1
==== X ====
**Short answer:** with 20 schools (10 per arm) and ICC = 0.05, no number of students per school gives 80% power for 0.25 SD. I did this by hand with the formulas and did not run any code.

**Assumptions:** two-sided α = 0.05, 80% power, equal arms, and a simple school-level comparison with no covariates. I'm treating 0.25 SD as your smallest effect of interest. Tell me if it comes from a pilot or prior study, because those estimates tend to be inflated.

**Why not**
- With k schools per arm and m students per school, the standard error of the difference (in SD units) is √[2·(ρ + (1−ρ)/m) / k].
- Adding students only shrinks the (1−ρ)/m term. The ρ term stays, so the standard error has a floor.
- With k = 10 and ρ = 0.05, that floor is √(2·0.05/10) = 0.10. The minimum detectable effect (MDE) is therefore about 0.28 SD, or about 0.30 with t-based critical values at 18 df.

| Students per school | MDE (approx., SD) |
|---|---|
| 25 | ~0.41 |
| 50 | ~0.35 |
| 100 | ~0.32 |
| ∞ | ~0.30 |

**What 0.25 SD would take**

Schools needed per arm ≈ 251 × (0.05 + 0.95/m), plus a small t-correction.

| Students per school | Schools per arm | Total schools |
|---|---|---|
| 25 | ~23–24 | ~47 |
| 50 | ~18–19 | ~37 |
| 100 | ~16 | ~32 |
| ∞ (floor) | ~14 | ~28 |

So you need at least about 28 schools. A practical target is about 32–36 schools with 50–100 students each.

**Options if you're stuck at 20 schools**
1. **Add a baseline covariate.** A pretest reading score is the usual choice. If it explains about 50% of the school-level variance, the MDE drops substantially. With m ≈ 50 and 10 schools per arm, the MDE would be about 0.25–0.27. That is a plausible route, but only if the pretest–posttest correlation is high.
2. **Stratify or pair schools** on prior achievement. This has a similar effect to the covariate.
3. **Accept a larger MDE** of about 0.30–0.35 SD and say so in the protocol.
4. **Add schools.** This is the only lever that fully fixes the problem.

For the protocol, round up for student attrition and report a sensitivity range, for example ICC 0.03–0.15. Real school ICCs for reading are often above 0.05, and a higher ICC makes the shortfall worse.

If you can give me the pretest–posttest correlation and a realistic ICC range, I can work out the covariate-adjusted numbers. I can also write a simulation script using the skill's `simulate_power.py` harness.
==== Y ====
**With 20 schools, no number of students per school gives 80% power for 0.25 SD at ICC = 0.05.**

**Assumptions:** 10 schools per arm, two-sided α = 0.05, 80% power, and equal cluster sizes. I didn't use a power-analysis tool. This is a hand calculation with a t-distribution at df = 18, so check it in software before relying on it.

**Variance of the effect estimate (in SD units):**
Var = 2·[ρ + (1−ρ)/m] / 10, where m is students per school.

**Why it can't be done:** Even with m → ∞, the variance floor is 2(0.05)/10 = 0.01, so SE ≈ 0.10. The minimum detectable effect is then about 2.96 × 0.10 ≈ **0.30 SD**. At 0.25 SD, power tops out at roughly 70–75%.

| Students/school | Approx. MDES (80% power) | Approx. power for 0.25 SD |
|---|---|---|
| 25 | 0.39 | ~0.35 |
| 50 | 0.35 | ~0.50 |
| 100 | 0.32 | ~0.60 |
| 200 | 0.31 | ~0.65 |
| ∞ | 0.30 | ~0.73 |

Gains flatten quickly beyond about 50 students per school, because the school-level variance dominates.

**Ways to reach 0.25 SD:**
1. **Add schools.** This is the most effective option. With about 30 schools (15 per arm) and about 50 students each, MDES is roughly 0.27 SD. With about 36 schools it is roughly 0.25 SD.
2. **Use a school-level pretest covariate.** A pretest with school-level R² of about 0.5–0.7 cuts the between-school variance substantially. With 20 schools and about 50 students each, MDES could fall to about 0.22–0.25 SD. This is often the cheapest fix.
3. **Stratify or pair schools** on prior achievement, which has a similar effect to a covariate.
4. **Accept a larger target effect.** Aim for about 0.30–0.35 SD, or state that the study is powered only for effects of that size.

If you give me the expected pretest–posttest correlation (school-level and student-level) and the realistic school size, I can refine this. I can also script it in R or Python, for example with `PowerUpR` or `statsmodels`.

######## ss-cluster#2
==== X ====
**Short answer:** with 20 schools (10 per arm), no number of students per school gives 80% power for a 0.25 SD effect at ICC = 0.05. I worked this out from formulas and did not run any code.

**Assumptions:** two-sided α = 0.05, 80% power, equal arms, and a simple school-level analysis with no covariates. I took 0.25 SD and ICC = 0.05 from your question. I haven't checked whether 0.25 SD is the smallest effect you'd care about.

**Calculation**
- An individually randomized trial needs about 2(1.96 + 0.84)² / 0.25² ≈ 251 students per arm.
- Clustering inflates that by the design effect, DEFF = 1 + (m − 1)·ICC, where m is students per school.
- With k = 10 schools per arm, you need 10m ≥ 251·[1 + 0.05(m − 1)]. This has no solution.
- The most you can get from 10 schools is an effective sample of k/ICC = 200 students per arm, which is below the 251 you need.

**Power with 20 schools (normal approximation)**

| Students per school | Approx. power for d = 0.25 |
|---|---|
| 25 | ~50% |
| 50 | ~57% |
| 100 | ~63% |
| ∞ (ceiling) | ~70% |

With a t-test on 18 df, power is a few points lower. The smallest effect you could detect at 80% power is about 0.30 SD even with unlimited students per school. At 30 students per school it is about 0.38 SD.

**Options**
1. **Add schools.** Schools per arm needed, with a small t-correction on top:

   | Students per school | Schools per arm |
   |---|---|
   | 25 | ~25 |
   | 50 | ~18 |
   | 100 | ~15 |

   Even at 100 students per school you need about 30 schools in total, and going from 50 to 100 students per school saves little.
2. **Adjust for a baseline reading score.** A school-level pretest that explains 50–70% of between-school variance cuts the effective ICC a lot. This is often the cheapest fix. It could make 20 schools workable, but it needs a defensible R² from prior data. Tell me the R² and I'll recompute.
3. **Accept lower power or a larger MDE.** For example, power the study for 0.30–0.35 SD, or state that it is about 60% powered for 0.25 SD.
4. **Use a stratified or matched-pair design.** Matching schools on prior achievement acts like a covariate and also helps.

Please also add attrition (inflate enrolment by 1/(1 − dropout)). If you tell me the dropout rate, the available pretest, and whether 0.25 SD is your smallest effect of interest, I can give a firm number. If you'd like a simulation-based check, I can write the script, but I can't run it in this session.
==== Y ====
**Short answer:** with 20 schools (10 per arm) and ICC = 0.05, no number of students per school gives 80% power for a 0.25 SD effect. This is a hand calculation, assuming a two-sided α = 0.05, 80% power, and equal-sized schools.

**Why**

The variance of the treatment effect is Var = 2(1 + (m−1)ρ) / (k·m), in SD units. Here k is schools per arm and m is students per school. As m grows, this levels off at 2ρ/k.

- With k = 10 and ρ = 0.05, the floor is SE = √(2 × 0.05 / 10) = 0.10.
- The minimum detectable effect is then about 2.8 × 0.10 = 0.28 SD, or about 0.30 SD with a t-correction for 18 df. This is the best case, with unlimited students.
- Power for a 0.25 SD effect:

| Students per school | Approx. power |
|---|---|
| 30 | ~50% |
| 50 | ~57% |
| 100 | ~64% |
| ∞ | ~70% |

**Options that work**

1. **Add a pretest covariate.** A baseline reading score is the most practical fix. If it explains about 50% of the variance at both the student and school level, you need about 35–45 students per school with 20 schools. Check the R² against prior data from your district.
2. **Add more schools.** With no covariate:

| Students per school | Schools needed (total) |
|---|---|
| 25 | ~44 |
| 50 | ~36 |

3. **Accept a larger detectable effect.** With 20 schools, the minimum detectable effect is about 0.30 SD or more, before covariates.

Adding students past about 50 per school gains very little. Adding schools or a good covariate helps far more.

If you tell me your expected pretest correlation, the school-size variability, or whether you can stratify or block the randomization, I can refine this. I can also script it in R or Python.

######## ss-cluster#3
==== X ====
**With 20 schools (10 per arm), no number of students per school gives 80% power for 0.25 SD under your assumptions.**

**Assumptions:** two-arm cluster randomized trial, equal allocation, two-sided α = 0.05, 80% power, ICC = 0.05, no covariates, and an outcome standardized to SD = 1.

**Why:** the variance of the effect estimate is

Var = (4/J) · [ρ + (1−ρ)/m]

Here J = 20 schools and m is students per school. Adding students only shrinks the (1−ρ)/m term. The between-school term stays at ρ = 0.05, so the best possible SE is √(0.2 × 0.05) = 0.10. With about 18 df, 80% power needs an effect of about 2.96 × SE. That gives a minimum detectable effect of about 0.30 SD even with unlimited students per school.

| Students/school | Approx. MDES (SD) | Approx. power for 0.25 SD |
|---|---|---|
| 25 | 0.39 | ~42% |
| 50 | 0.35 | ~50% |
| 100 | 0.32 | ~57% |
| ∞ | 0.30 | ~65% |

These figures use a t-approximation, so treat them as approximate.

**Options to reach 0.25 SD:**
1. **Add a pretest covariate.** This is usually the most practical fix. Suppose a school-level pretest explains about 60% of between-school variance (R²₂ = 0.6) and a student-level pretest explains about 50% of within-school variance (R²₁ = 0.5). Then the variance is 0.2 × [0.05(0.4) + 0.95(0.5)/m]. That reaches 80% power at about **m ≈ 30 students per school**. The assumed R² values are optimistic but plausible for reading, where prior reading scores are strong predictors.
2. **Recruit more schools.** With no covariates, you need roughly 28–30 schools or more, with a moderate m of 30–50.
3. **Accept a larger MDES.** Powering for about 0.30–0.35 SD may be more realistic with 20 schools.

I can run this in R or Python with `pwr`, `PowerUpR` or `statsmodels` if you'd like. It would help to know your expected pretest correlation and whether you'll stratify or block schools. Blocking would also improve precision.
==== Y ====
**Short answer:** with 20 schools (10 per arm), no number of students per school gives 80% power for 0.25 SD. I did this by hand with the formula, not by running code, because I have no execution tool here.

**Assumptions** (please confirm):
- α = 0.05, two-sided.
- 80% power.
- 10 schools per arm.
- Equal cluster sizes.
- Analysis at the school or student level with no covariates.
- ICC = 0.05.
- 0.25 SD is the smallest effect you care about. If it comes from a pilot, treat it as probably inflated.

**Why it's infeasible**
- A student-level trial needs about 2(1.96+0.84)²/0.25² ≈ 251 students per arm.
- Clustering shrinks the effective sample by the design effect, DEFF = 1 + (m−1)·ICC.
- Even with infinitely many students per school, the effective sample per arm is capped at k/ICC = 10/0.05 = 200. That is below the 251 you need.

**Minimum detectable effect (MDE) with 10 schools per arm**

This uses MDE ≈ (t₁₋α/₂ + t₁₋β) · √(2·[ICC + (1−ICC)/m] / k), with about 2.96 for the t multiplier at df = 18.

| Students per school (m) | MDE (SD) |
|---|---|
| 25 | ~0.39 |
| 50 | ~0.35 |
| 100 | ~0.32 |
| 200 | ~0.31 |
| ∞ | ~0.30 |

Adding students past about 50 per school gains very little. The number of schools is what drives power.

**Options**
1. **Add schools.** For 0.25 SD with m ≈ 50, you need about 18–19 schools per arm, so roughly 38–40 in total. This is the most direct fix.
2. **Use a strong baseline covariate.** A school-level pretest reading score with R² around 0.5–0.7 cuts the between-school variance a lot. It could bring 0.25 SD within reach of about 20–25 schools. You would need a defensible R² from prior data.
3. **Stratify or match schools** before randomizing. This has a similar effect to a covariate.
4. **Accept a larger MDE.** With 20 schools, plan around 0.30–0.35 SD, and say so in the protocol.

Two other things to check:
- If the ICC is really 0.10–0.15, which is common for reading outcomes, every figure above gets worse.
- Inflate enrollment for student attrition.

If you give me the pretest correlation, the realistic ICC range, and whether school sizes vary, I can produce a sensitivity table. I can also write a simulation for it if you want one.
