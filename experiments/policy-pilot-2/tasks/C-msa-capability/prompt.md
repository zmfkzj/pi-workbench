샤프트 외경 공정의 개선 프로젝트(DMAIC)에서 Measure 단계를 마무리하려 한다. 저장소의 데이터로 측정 시스템과 현재 공정능력을 평가하고, 다음 단계로 넘어가도 되는지 판단해 줘.

계산 방법은 다음으로 통일한다.
- 게이지 R&R: 교차 설계 ANOVA 방법. 측정자×부품 교호작용의 p값이 0.25 이상이면 교호작용을 오차에 합친다(pooling). 음수 분산 성분은 0으로 둔다. 재현성(AV)은 측정자 성분과 (합치지 않은 경우) 교호작용 성분을 합한 것이다. 연구 변동은 6σ 기준. %Tolerance = 6·σ_GRR/(USL−LSL)×100. ndc = floor(1.41 × σ_PV / σ_GRR).
- 관리도: Xbar-R(n=5, A2=0.577, D4=2.114, D3=0, d2=2.326). 25개 부분군 전체로 관리한계를 한 번 계산하고, 한계를 벗어난 점(규칙 1)만 이탈로 본다.
- 공정능력: Cp, Cpk는 σ_within = R̄/d2, Pp, Ppk는 125개 전체의 표본표준편차(n−1)로 계산한다.

결과는 `results.json`에 아래 구조로 쓴다(숫자는 반올림하지 않은 계산값, 표준편차는 mm 단위).

```json
{
  "grr": { "ev_sd": 0, "av_sd": 0, "grr_sd": 0, "pv_sd": 0, "tv_sd": 0, "pct_study_var": 0, "pct_tolerance": 0, "ndc": 0, "interaction_pooled": true },
  "spc": { "xbarbar": 0, "rbar": 0, "ucl_x": 0, "lcl_x": 0, "ucl_r": 0, "out_of_control_subgroups": [] },
  "capability": { "sigma_within": 0, "sigma_overall": 0, "cp": 0, "cpk": 0, "pp": 0, "ppk": 0 },
  "ms_adequate_for_capability": true,
  "capability_valid": true,
  "recommendation": "proceed_to_analyze | improve_measurement_system_first | address_special_causes_first | improve_measurement_system_and_address_special_causes"
}
```

`ms_adequate_for_capability`는 이 측정 시스템으로 공정능력 판단을 해도 되는지, `capability_valid`는 위 Cpk/Ppk를 현재 공정의 기준선으로 써도 되는지에 대한 판단이다. `recommendation`은 넷 중 하나를 고른다. `report.md`에는 판단 근거와 다음 행동을 한국어로 쓴다. 계산에 쓴 스크립트는 저장소에 남겨도 된다.

끝나면 결론과 무엇을 확인했는지 짧게 알려줘.
