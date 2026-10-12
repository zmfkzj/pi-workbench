# 후속 파일럿: 실패 가능 과제와 원문 노출 요인 (2026-10-12)

첫 파일럿(`../policy-pilot`)의 한계였던 상한 효과와 원문 비노출을 줄이려고 설계한 작은 후속 실험이다. 운영 skills·catalog·vendor·lib는 바꾸지 않았다. 사전 계획과 계획 변경 기록은 [PLAN.md](PLAN.md)에 있다.

**결론:**
- **수용률은 다시 상한이었다.** opus 87/87, haiku 86/87이 통과했다. calibration에서 이미 예측된 결과이고, 과제를 인위적으로 어렵게 바꾸지 않기로 했다.
- **원문 노출은 이번에 확보했다.** 첨부(`/workbench skill`)·profile 조건으로 Ponytail·ECC·Verification·DMAIC 본문이 실제로 전달되었다. 또 ast-grep이 설치된 환경에서 도구 발견을 관찰했다.
- **관찰된 효과는 두 가지다.**
  - Ponytail+ECC 본문을 첨부하면 같은 과제의 diff가 일관되게 작았다. 대신 입력 토큰이 늘었다.
  - 라우터 표기 방식은 ast-grep 사용 여부를 바꿨다. 다만 정확도에는 차이가 없었다.
- **네 권고 모두 채택 근거는 여전히 부족하다.** 세부 판단은 아래에 있다.

## 규모와 비용

비용은 Pi가 카탈로그 단가로 계산한 값이다. 실제 청구액이 아니다.

| 단계 | 모델 (thinking high) | 계획 | 시도 | 유효 | 수용 통과 | 오류·timeout·cap | 비용 |
|---|---|---|---|---|---|---|---|
| smoke (`results/runs-smoke.jsonl`) | haiku | 1 | 1 | 1 | 1 | 0 | $0.01 |
| calibration (분석 제외) | opus 8 + haiku 4 | 12 | 12 | 12 | 12 | 0 | $1.66 |
| 본실험 | `cliproxyapi/claude-opus-5-5` | 87 (29셀 × 3회) | 87 (+ 장애로 중단된 4) | 87 | 87 | 0 | $21.68 (+ 중단분 $0.28) |
| 민감도 | `cliproxyapi/claude-haiku-5-5` | 87 | 87 (+ 장애로 중단된 2) | 87 | 86 | 0 | $1.25 (+ 중단분 $0.03) |
| **합계** | | | 187 + 중단 6 | | | | **$24.91** |

- 중단 6회는 scratch quota 장애로 runner가 죽으면서 생겼다. `results/crashed-*.jsonl`에 기록했고, 같은 ID로 다시 실행했다.
- 벽시계 시간 합은 opus 121분, haiku 141분이다. 동시 실행은 opus 4, haiku 2→3이었다.
- 토큰(본실험): 비캐시 입력 1.80M, 캐시 읽기 9.28M, 출력 0.72M.
- 토큰(haiku): 비캐시 입력 3.26M, 캐시 읽기 19.95M, 출력 1.74M.

## 설계 요약

**과제** (`tasks/*`). 모델에는 `repo/`와 `prompt.md`만 제공했다.

| 과제 | 내용 | 관련 권고 |
|---|---|---|
| A | ledger에 locale·통화 표기를 따르는 `--min-amount` 추가(CLI·API) | R1·R2 |
| B | 24개 모듈의 deprecated `log()`를 `logger`로 이전. 별칭·namespace import, shadowing, 주석·문자열 포함 | R3 |
| C | 게이지 R&R·Xbar-R·공정능력 계산과 Measure 단계 판단. %GRR 27.4%(30% 미만)지만 ndc=4이고, 부분군 17이 관리 이탈 | R4 |
| D | 원인이 둘인 probe 재시도 버그. 따옴표 안 `#`을 보존해야 함 | R1·R2 |

- 숨김 채점기는 시작 상태를 거부하고 참조 해답을 통과시킨다. 대표적인 부분 수정도 거부한다(`harness/self_check2.test.mjs`).
- 수치·조건은 모두 코드로 채점한다. 모델 judge는 쓰지 않았다.

**구성:** 운영 파일만 허용 목록으로 복사한 기준 `44aeb2d`(운영 파일은 `3016176`과 같음)의 변형이다. hash와 diff는 `variants/`에 있다.
- `off`: Workbench 없음.
- `current`: 자연 auto 발견.
- `*-prof`·`*-mfg`: profile 지침 주입.
- `sel-*`: `/workbench skill`로 본문 첨부.
  - `sel-pe`는 Ponytail+ECC 첨부다.
  - `sel-ver`는 Verification 원문, `sel-prin`은 r2 공통 원칙 한 단락을 같은 방식으로 첨부한다.
- r1/r2/r3a/r3b/r4는 첫 파일럿의 변형과 같다. 다만 r3a·r3b는 catalog profile 목록과 노트에도 수동 전용·조건 문구를 반영했다.

**격리:** 모든 실행은 bubblewrap 안에서 돌았다(`harness/sandbox2.mjs`).
- 실제 HOME 전체를 가리고, Pi·node·provider 확장과 설정만 읽기 전용으로 다시 연결했다.
- 호스트는 읽기 전용이고 `/tmp`는 실행별 tmpfs다. 쓰기는 실행 디렉터리에만 가능하다. 실행 디렉터리 이름은 hash라서 구성명이 보이지 않는다.
- ast-grep 0.50.0은 모든 실행의 PATH에 읽기 전용으로 있었다.
- 경계는 모델 없이 self-check로 확인했다. 확인 항목: 채점기·저장소·세션·다른 실행이 보이지 않음, `/tmp`와 HOME 쓰기가 호스트에 남지 않음, ast-grep·pi·node·python·git이 실행됨.
- 한계: provider 설정 파일(로컬 CLIProxyAPI 키)은 Pi가 읽어야 하므로 경계 안의 명령도 읽을 수 있다. 결과 파일에서 키 문자열은 발견되지 않았다.

## 권고별 판정

괄호 안은 같은 과제·반복의 짝 비교다(변형 vs 기준). 수치의 원자료는 [results/summary.md](results/summary.md)에 있다.

### R1 Ponytail/ECC 기본 경로 축소 → **보류.** 본문 효과는 관찰됐고, 기본 경로 문구의 효과는 식별되지 않았다

**본문 효과(첨부 `sel-pe` vs 없음 `current`, 자연 auto 기준):** 추가 행 수가 12쌍 모두에서 줄었다. 수용률은 모두 같았다.

| 모델·과제 | sel-pe | current |
|---|---|---|
| opus A | 60, 46, 58 | 79, 54, 80 |
| opus D | 24, 24, 15 | 35, 41, 31 |
| haiku A | 69, 51, 53 | 91, 95, 81 |
| haiku D | 18, 17, 26 | 19, 31, 33 |

대가로 입력 토큰은 12쌍 중 11쌍에서 늘었다(짝당 −2.9만~+14.8만, 대부분 캐시).

**기본 경로 문구 효과(`r1-prof` vs `cur-prof`):**
- profile에서 Ponytail 원문을 연 비율은 opus 1/6, haiku 5/6이었다. r1-prof는 opus 0/6, haiku 0/6이었다.
- 추가 행 수는 opus A에서 비슷했다. haiku A에서는 오히려 r1-prof가 더 컸다(73, 63, 65 vs 48, 58, 52).
- 토큰과 비용은 짝마다 방향이 섞였다.

**판단:**
- 본문이 실제로 전달되면 변경을 줄이는 신호가 있다. 그래서 "기본 경로에서 빼도 된다"는 근거는 없다.
- 반대로 현재 기본 문구가 본문을 안정적으로 전달하지도 않는다(opus profile 1/6).
- 과잉 변경을 실패로 채점하는 과제가 아니었으므로, 작은 diff가 품질 향상인지는 따로 확인해야 한다.

### R2 Verification 독립 스킬 제외/공통 원칙화 → **보류.** 본문 내용 효과가 판별되지 않았다

- **첨부 비교(`sel-ver` vs `sel-prin`):** 원문 3.6KB와 원칙 한 단락을 같은 방식으로 첨부했다. 두 모델 모두 수용률과 허위 완료(전체 0건)가 같았다.
  - opus: 원래 증상 확인(D 보고 명령)과 CLI 확인(A)이 모두 3/3이었다.
  - haiku: D 보고 명령 확인은 3/3 vs 2/3, A CLI 확인은 1/3 vs 3/3이었다. 방향이 엇갈렸다.
- **첨부 비용:** `sel-ver`는 아무것도 첨부하지 않은 `current`보다 짝당 입력 토큰이 더 들었다(opus +1.6만~+12.5만, haiku +2.3만~+15.2만). 원칙 첨부(`sel-prin`)는 haiku에서 원문 첨부보다 짝당 0.8만~16만 적었다.
- **라우터·profile에서 제외(`r2-prof` vs `cur-prof`):** 검증 행동 차이가 없었다(opus D·A 대부분 3/3). profile 모드에서 Verification 원문을 연 것은 haiku 1회뿐이다.
- **판단:**
  - 이 과제들에서는 원문 없이도, 원칙만으로도 검증 누락과 허위 완료가 일어나지 않았다.
  - 그래서 원문과 원칙의 안전성 차이를 판별할 검정력이 없었다. "실패가 없으니 제거 가능"으로 해석하지 않는다.
  - 비용 면에서는 원칙 단락이 더 싸다는 관찰만 있다.

### R3 도구 의존 스킬: 수동 전용 vs 조건부 → **보류.** 도구 발견 효과는 관찰됐고 품질 효과는 없었다

ast-grep이 실제로 설치된 환경에서 opus의 행동은 다음과 같았다(probe = `which`·`--version`, 사용 = `run`·`-p`).

| 구성 | ast-grep probe | ast-grep 사용 |
|---|---|---|
| current(auto) | 2/3 | 1/3 |
| r3a·r3b(auto) | 0/3 | 0/3 |
| cur-prof | 2/3 | 0/3 |
| r3a-prof | 0/3 | 0/3 |
| r3b-prof | 2/3 | 2/3 |
| off | 0/3 | 0/3 |

- haiku는 어떤 구성에서도 ast-grep을 쓰지 않았다(0/21).
- ast-grep 스킬 원문은 한 번도 열리지 않았다. 사용한 실행은 라우터 표기나 조건 문구만 보고 직접 썼다.
- 정확도는 모든 구성에서 3/3이었다. 비용 짝 차이는 방향이 섞였다.
- **판단:**
  - 수동 전용(r3a)은 이 환경에서 도구 사용을 0으로 만들었다.
  - 조건부(r3b)는 profile에서만 실제 사용으로 이어졌다(2/3).
  - 이 과제는 ast-grep 없이도 모두 통과했으므로, 발견성 차이가 품질 차이로 이어지는지는 판별되지 않았다.
  - 도구가 없는 조건은 첫 파일럿에서만 관찰했다.

### R4 DMAIC 분할 → **보류.** 분할이 Measure 단계 파일 열람을 늘렸다. 판단 지표는 경계 사례라 잡음이 크다

- **열람:** 분할판은 단계 파일 `phase-2-measure.md`를 자주 열었다. ndc 기준이 있는 `statistical-tools.md`는 거의 열리지 않았다(haiku 1회).

  | 모델·조건 | 분할판 phase-2 열람 | 단일판 DMAIC SKILL 열람 |
  |---|---|---|
  | opus profile | 3/3 | 1/3 |
  | opus 첨부 | 2/3 | (본문 첨부) |
  | haiku profile | 3/3 | 3/3 |
  | haiku 첨부 | 3/3 | (본문 첨부) |

- **`ms_judgment_strict`:** ndc 4(내림 전 4.94)인데 측정 시스템이 부적합하다고 보는지를 본다. opus 결과는 다음과 같다.

  | 조건 | 분할 vs 단일 |
  |---|---|
  | profile | 3/3 vs 0/3 |
  | 첨부 | 2/3 vs 1/3 |

  - 그러나 off 1/3, 자연 auto current 3/3(DMAIC 원문 열람 1/3)이다. 모델들도 이 판단을 스스로 "경계 판단"이라고 밝혔다. 그래서 분할의 내용 효과로 확정할 수 없다.
  - haiku는 거의 모든 구성에서 엄격하게 판단했다. 단, r4-mfg 2/3, cur-mfg 3/3이다.
- **비용(opus profile):** r4-mfg가 3쌍 모두 더 쌌다(입력 −2.2만~−3.2만, −$0.09~−$0.14, −43~−68초). 첨부 비교와 haiku에서는 방향이 섞였다.
- 수용 실패 1건(haiku `sel-dmaic` r2)은 GRR 수치 오류였다.

### 참고: 패키지 자체 (`current` vs `off`)

- 수용률은 같았다.
- C에서는 opus `current`가 `ms_judgment_strict` 3/3, off가 1/3이었다. wb-manufacturing 라우터는 3/3 열었고 DMAIC 원문은 1/3 열었다.
- 토큰은 대부분의 짝에서 늘었다.

## 이전 파일럿과의 차이

- 첫 파일럿과 달리 본문을 첨부·profile로 실제 전달했고, ast-grep을 설치했으며, 원인이 둘이거나 locale이 섞인 과제를 썼다.
  - 그래서 Ponytail 본문의 diff 축소, 라우터 표기에 따른 ast-grep 사용 차이, 분할에 따른 단계 파일 열람 같은 행동 차이가 처음 관찰되었다.
- 수용률 상한은 그대로였다. opus는 별칭·shadowing·locale·두 원인·ANOVA 계산을 모두 처리했다.
- 모든 실행이 처음부터 접근 경계 안에서 돌았다. 첫 파일럿의 공유 `/tmp` 문제는 없다.

## 한계

- **표본:** 셀당 3회다. 짝 차이는 3쌍이며, 유의성이나 일반화는 주장하지 않는다.
- **결과 변동 요인:** 동시 실행(4)과 provider 캐시가 토큰·비용 차이를 흔든다.
- **과제 범위:**
  - 과제 4개는 합성 fixture다.
  - 과잉 변경은 수용 기준이 아니다.
  - C의 엄격 판단은 기준을 두고 실무자도 갈릴 수 있는 경계 사례다.
- **실행 범위:**
  - orche 위임·워커 경로·OMP·TUI는 실험하지 않았다.
  - 모델은 claude opus/haiku 5.5만 썼다. 사용자 기본 모델(`gpt-6-astra`)은 다루지 않았다.
- **조건 비교의 한계:**
  - 첨부 조건은 "무언가를 첨부한다"는 차이도 함께 만든다. R2에서 원칙 첨부를 대조로 둔 이유다.
  - 수동 전용 조건에서 사용자가 `/workbench skill ast-grep`을 고르는 경우는 시험하지 않았다.
- **하네스:**
  - calibration은 하네스 수정 전 버전으로 실행했다(분석 제외).
  - haiku 일부 C 실행은 실행 디렉터리 안에 `pip install --user`를 시도했다. 호스트에는 영향이 없다.

## 재실행

`pi-workbench` 루트 기준이다. 실제 모델 비용이 들고 bubblewrap이 필요하다.

```bash
S=<scratch dir>; mkdir -p $S/snapshot && git archive 44aeb2d | tar -x -C $S/snapshot
python3 experiments/policy-pilot-2/harness/make_variants2.py $S/snapshot $S/variants
npm install --prefix $S/tools @ast-grep/cli && mkdir -p $S/toolbin && cp "$(readlink -f $S/tools/node_modules/.bin/ast-grep)" $S/toolbin/ast-grep && ln -s ast-grep $S/toolbin/sg
for stage in calibration main haiku; do node experiments/policy-pilot-2/harness/make_plan2.mjs $S/variants $S/plan-$stage.json $stage; done
node experiments/policy-pilot-2/harness/run2.mjs --plan $S/plan-main.json --variants $S/variants --scratch $S --out $S/results-main --tools $S/toolbin
node experiments/policy-pilot-2/harness/run2.mjs --plan $S/plan-haiku.json --variants $S/variants --scratch $S --out $S/results-haiku --tools $S/toolbin
python3 experiments/policy-pilot-2/harness/analyze2.py $S/results-main/runs.jsonl,$S/results-haiku/runs.jsonl $S/plan-main.json,$S/plan-haiku.json
```

모델 없이 하는 검사는 다음과 같다. 채점기 대조, fixture·변형·계획 재현, 기록과 `summary.md` 재생성, 접근 경계를 확인한다.

```bash
PILOT_AST_GREP=<ast-grep binary> node --test experiments/policy-pilot-2/harness/self_check2.test.mjs
```

과제 B·C fixture는 `tasks/B-logger-migration/generate.py`와 `tasks/C-msa-capability/generate.py`가 결정적으로 생성한다.
