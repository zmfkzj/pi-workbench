`data/ra_measurements.csv`는 기존 냉각유 A와 새 냉각유 B로 가공한 부품의 표면 거칠기(Ra) 측정값이다. 규격은 Ra ≤ 1.6 µm이다. 공정 개선 회의에서 냉각유 B를 표준으로 채택할지 결정하려 한다. 데이터를 분석해서 판단 자료를 만들어 줘.

1. `results.json`에 다음 필드를 채운다(숫자는 계산값 그대로, 반올림하지 않아도 된다).
   - `n_a`, `n_b`, `mean_a`, `mean_b`, `sd_a`, `sd_b` (표본 표준편차)
   - `welch_t`, `welch_df`, `p_two_sided`: A − B에 대한 Welch 2표본 t 검정
   - `diff_ci95_low`, `diff_ci95_high`: 평균 차이(A − B)의 95% 신뢰구간(Welch)
   - `over_usl_a`, `over_usl_b`: 실제로 1.6 µm를 넘은 부품 수
   - `recommendation`: `"adopt"`(데이터가 B의 효과를 충분히 뒷받침하므로 바로 표준화), `"pilot_before_adopt"`(가능성은 있으나 추가 확인 후 결정), `"reject"`, `"insufficient_data"` 중 하나
   - `threats_to_validity`: 이 결론을 흔들 수 있는 요인을 짧은 문자열 배열로
2. `report.md`에 회의용 판단 근거를 한국어로 쓴다. 결론, 근거, 한계, 다음 단계를 포함한다.

분석에 쓴 스크립트는 저장소 안에 남겨 둬도 된다. 끝나면 결론과 무엇을 확인했는지 짧게 알려줘.
