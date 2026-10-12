# 후속 파일럿 사전 계획 (2026-10-12, calibration 전에 작성)

이 계획은 calibration을 실행하기 전에 작성했다. 결과를 본 뒤 바꾼 내용은 이 문서 끝의 "변경 기록"에만 추가한다.

## 왜 후속 실험인가

첫 파일럿(`../policy-pilot`, 130회)에는 두 가지 한계가 있었다.
- 모든 과제를 통과해 결과가 상한(ceiling)에 몰렸다.
- 자연 auto에서 대상 원문이 거의 노출되지 않았다. Verification은 0/130이다.

그래서 네 권고(R1 Ponytail/ECC 기본 경로, R2 Verification 독립 스킬, R3 도구 의존 스킬의 수동 전용 vs 조건부 추천, R4 DMAIC 분할)를 판정할 근거가 없었다.

이번 실험은 반복 수를 늘리는 대신 두 가지를 바꾼다.
- 실패할 수 있는 과제를 쓴다.
- 원문 노출을 실험 요인으로 둔다.

추가하려는 판정 근거는 다음과 같다.

| 권고 | 가설과 비교 |
|---|---|
| R1 | Ponytail full + ECC search-first 본문(첨부)이 과잉 변경·요구 누락·재사용 실패를 줄이는가(`sel-pe` vs `current`). 기본 경로 문구를 빼면(r1) profile 모드에서 그 본문을 읽는 비율과 결과가 달라지는가(`r1-prof` vs `cur-prof`) |
| R2 | Verification 원문 첨부가 공통 원칙 한 단락 첨부와 비교해 원래 증상 확인·허위 완료·수용률에서 차이를 내는가(`sel-ver` vs `sel-prin`). 둘 다 같은 `/workbench skill` 방식으로 첨부한다. 첨부 없음(`current`)과도 비교한다. 라우터·profile에서 빼는 효과는 `r2-prof` vs `cur-prof`로 본다 |
| R3 | ast-grep이 **실제로 설치된** 환경에서, 라우터·profile 표기 방식(현재 / 수동 전용 / 조건부)이 도구 발견·사용, 정확성, 비용을 바꾸는가 |
| R4 | DMAIC 본문이 실제로 제공될 때(첨부·profile), 단일 파일 대 단계별 분할이 MSA·안정성 판단과 비용을 바꾸는가. 자연 auto의 발견성은 따로 기록한다 |

## 고정 조건

- **기준:** pi-workbench `44aeb2d`. 운영 파일은 교정판 `3016176`과 같다.
- **변형:** 실행 패키지는 운영 파일만 허용 목록으로 복사한다(`harness/make_variants2.py`). experiments·tests·scripts·patches·.git·채점기 이름이 없음을 단언한다. 변형의 hash와 diff는 `variants/`에 있다.
- **모델:**
  - 주 모델은 `cliproxyapi/claude-opus-5-5`, thinking high.
  - 민감도 arm은 `cliproxyapi/claude-haiku-5-5`, high. 별도로 분석하며 모델 간 차이를 정책 효과로 섞지 않는다.
- **실행 환경:**
  - Pi 1.1.0, print/json 모드. 도구는 read, bash, edit, write.
  - discovery를 모두 끄고 provider 확장과 실행별 Workbench 사본만 명시해 로드한다.
  - orche 위임은 쓰지 않는다. 따라서 결과를 워커 운용 전체로 일반화하지 않는다.
- **접근 경계(모든 실행):** `harness/sandbox2.mjs`(bubblewrap)를 쓴다.
  - 호스트는 읽기 전용이다. 실제 HOME 전체를 빈 tmpfs로 가리고, Pi·node·provider 확장·설정만 읽기 전용으로 다시 연결한다.
  - `/tmp`는 실행별 tmpfs이고, 쓰기 가능한 경로는 실행 디렉터리뿐이다.
  - ast-grep 0.50.0 바이너리만 든 도구 디렉터리를 모든 실행·과제의 PATH에 읽기 전용으로 둔다. 도구 권한은 비교군 사이에 같다.
- **기록과 상한:**
  - 실행별 원자료는 `run2.mjs`가 기록한다. 기록 항목: 계획·시도·오류·timeout·cap, 실제로 연 Workbench 파일(성공한 read/shell 읽기), 첨부 본문 hash, 도구 사용, 마지막 수정 뒤 검증, 수용 결과, 허용 밖 파일 변경, 시간, 토큰, 비용.
  - 비용은 Pi가 단가로 계산한 값(list price)이다. 청구액이 아니다.
  - 동시 실행 중인 run의 비용 상한을 예약해 총 상한을 넘지 않게 한다. 다만 한 응답이 실행당 상한을 넘을 수는 있으며, 넘으면 `overCap`으로 기록한다.

## 과제 (`tasks/*`, 모델에는 `repo/`와 `prompt.md`만 제공)

| 과제 | 내용 | 실패 위험 | 수용 기준(숨김) |
|---|---|---|---|
| A ledger `--min-amount` | CLI와 API에 최소 금액 필터 추가 | 임계값을 파일 locale 표기(`1.234,50`, 통화 접두어)로 해석해야 함. 기존 `parseAmount` 재사용 여부, 오류 보고 규약, 옵션 위치, 합계, 무옵션 출력 불변, 과잉 변경 | 9개 테스트. 원본 테스트를 최종 코드에 대해 실행 |
| B logger 이전 | 24개 모듈, deprecated `log(level, …)` → `logger.<level>(…)` | 별칭·namespace import, 계산된 레벨, 여러 줄 호출, 매개변수·지역 변수·다른 객체의 `log`, 주석·문자열 | deprecated `log`가 throw하는 사본에서 이벤트·반환값이 원본과 같음. 보존할 줄, import 정리 |
| C MSA·공정능력 | 게이지 R&R(ANOVA)·Xbar-R·Cp/Cpk/Pp/Ppk 계산과 Measure 단계 판단 | %GRR은 30% 미만(27.4%)이지만 ndc=4. 부분군 17이 관리 이탈인데 Cpk는 1.41로 좋아 보임 | 수치는 코드로 다시 계산해 비교. 이탈 부분군, `capability_valid=false`, 특수 원인 대응 추천. MS 판단(ndc<5)은 `ms_judgment_strict`로 따로 채점 |
| D probe 재시도 버그 | 보고된 명령이 4회 시도 | 원인이 둘(`retries || 3`, 줄 끝 주석 미처리). 따옴표 안 `#`, `tag: a#b`, 이스케이프를 보존해야 함 | 6개 테스트 |

채점기는 시작 상태를 거부하고 참조 해답(`reference.diff`)을 통과시킨다. 대표적인 부분 수정도 거부한다. 이 대조는 `harness/self_check2.test.mjs`가 확인한다.

- 스킬 사용 자체는 점수가 아니다.
- C의 계산 방법은 prompt에 모두 명시했다. 판단 기준(ndc ≥ 5, 안정성이 먼저)은 AIAG MSA와 SPC의 일반 지식이며, DMAIC 참조에도 들어 있다.

## 비교 구성과 규모

`harness/make_plan2.mjs`가 정의한다.
- A·D: `off, current, cur-prof, r1-prof, r2-prof, sel-pe, sel-ver, sel-prin`
- B: `off, current, r3a, r3b, cur-prof, r3a-prof, r3b-prof`
- C: `off, current, sel-dmaic, r4-sel-dmaic, cur-mfg, r4-mfg`

29개 셀을 3회 반복하며, 반복마다 다른 seed로 순서를 섞는다.

| 단계 | 실행 수 | 상한 |
|---|---|---|
| opus 본실험 | 87 | 총 $70, 실행당 $3·1200초·도구 120회 |
| haiku 민감도 | 87 | 총 $8, 실행당 $0.5 |

## Calibration 규칙 (본실험과 분리해 보고)

1. **실행:** 과제마다 opus `off`, opus profile(`cur-prof`, C는 `cur-mfg`), haiku `off`를 1회씩, 총 12회. 상한은 $12다.
2. **너무 쉬움:** 한 과제에서 세 실행이 모두 수용 기준을 통과하면 "상한 위험"으로 표시한다.
   - 그 과제는 **한 번만** 고칠 수 있다. 현실적인 요구사항을 추가하는 방식만 허용하며, 숨긴 함정이나 정보 누락은 넣지 않는다.
   - 고친 버전은 다시 calibration하지 않고 그대로 동결한다.
   - 고치지 않기로 하면 상한 위험을 결과에 명시한다.
3. **불가능·채점 오류:** 세 실행이 모두 실패하면 실패 원인을 본다.
   - 채점기 버그이거나 prompt가 모호하면 고치고 기록한다.
   - 모델 능력 때문이면 그대로 둔다.
4. **예산·시간:** 실행이 timeout이나 도구 상한에 걸리면 그 상한을 한 번만 조정한다.
5. **동결:** calibration 뒤 과제·채점기·참조·변형·계획의 hash를 동결한다(`results/plan-main.json`의 `taskHashes`·`variantHashes`). 본실험이 다시 상한에 몰리면 반복을 늘리지 않고 한계로 보고한다.

## 분석 (사전 정의)

- **비교 단위:** 같은 모델·과제·반복의 짝 비교다. 수용 통과 수, 실패 검사 항목, 원래 증상 확인 여부, 허위 완료(성공 주장 + 수용 실패), 허용 밖 파일 변경, 추가 행 수, ast-grep 사용, 실제로 연 원문(분할 참조별), 토큰, 시간, 비용을 비교한다.
- **유효성:**
  - 하네스 오류, API 오류, timeout, cap 중단은 오류로 따로 센다. 실패한 정상 실행은 유효한 실패다.
  - C의 `ms_judgment_strict`와 같은 보조 판단도 코드로 채점한다. 모델 judge는 쓰지 않는다.
- **해석:**
  - 원문을 읽지 않은 실행으로 그 원문의 효과를 판정하지 않는다.
  - 3회 반복이므로 통계적 유의성은 주장하지 않는다.

## 변경 기록

### calibration 결과와 결정 (본실험 전, 2026-10-12)

- 12회가 모두 실행되어 모두 수용 기준을 통과했다. 비용은 $1.66이다(`results/runs-calibration.jsonl`).
  - 네 과제 모두 opus off·opus profile·haiku off가 통과했으므로 규칙 2의 "상한 위험"에 해당한다.
  - C의 `ms_judgment_strict`만 갈렸다. opus off·opus cur-mfg는 false("측정 시스템 적정" 판단), haiku off는 true였다.
- **과제는 고치지 않는다.** 남은 개정 기회는 현실적인 요구 추가 한 번뿐이다. 그런데 opus가 이미 별칭·shadowing·locale·두 원인·ANOVA 계산까지 처리했다. 그래서 수용률을 낮추려면 인위적 함정이 필요하다고 판단했고, 이는 사전 규칙상 금지다.
  - 수용률은 그대로 보고한다.
  - 판별 지표는 아래 "주 판별 지표"로 고정한다. 이 지표들은 원래 분석 목록에 있던 것을 구체화한 것이고, 본실험 결과를 보기 전에 정했다.
- **하네스 수정** (calibration 뒤, 본실험 전):
  - 실행 디렉터리 이름을 run ID의 hash로 바꿨다. calibration에서는 작업 경로에 `cal-o-B-off` 같은 구성명이 보였다.
  - 같은 bash 명령 안에서 수정 뒤 검증한 경우를 "마지막 수정 뒤 검증"으로 센다.
  - 최종 diff 본문을 원자료에 저장한다.
  - B 채점기에서 모듈 import 오류를 모듈별 실패로 기록하게 했다. 이전에는 파일 전체가 실패했다. 판정 결과는 바뀌지 않는다.
  - calibration은 이 수정 전 하네스로 실행했으며 분석에 쓰지 않는다.

### 주 판별 지표 (본실험 전 고정)

| 과제 | 권고 | 지표 |
|---|---|---|
| A | R1 | 추가·삭제 행 수, 허용 밖 파일 변경, 기존 `parseAmount` 재사용(최종 diff의 추가 행이 `parseAmount`를 호출하는지), 별도 금액 파서 추가(추가 행의 `parseFloat`/`Number(`+정규식) |
| A·D | R2 | 마지막 수정 뒤 검증(A: 테스트·`--min-amount` CLI 실행, D: 보고된 명령·테스트)과 성공 여부, 허위 완료(성공 주장 + 수용 실패) |
| B | R3 | ast-grep 호출과 성공 호출 수, ast-grep·관련 스킬 원문 열람, 도구 호출 수, 토큰, 시간, 비용 |
| C | R4 | `ms_judgment_strict`(ndc<5 → 측정 시스템 부적합 + 둘 다 대응 추천), DMAIC 원문과 분할 참조별 열람(특히 `statistical-tools.md`, `phase-2-measure.md`), 토큰, 비용 |
| 공통 | – | 수용률(상한 예상), 오류·중단 |

### 본실험 중 하네스 장애와 조치

- 본실험 시작 약 10분 뒤 scratch 디스크 quota(EDQUOT)로 두 runner 프로세스가 기록 중에 종료됐다.
  - 그때 진행 중이던 6개 실행(opus 4, haiku 2)은 `results/crashed-*.jsonl`에 하네스 오류로 기록했다. 부분 비용은 opus $0.28, haiku $0.03이다.
  - 같은 run ID로 다시 실행했다. 모델 실패가 아니라 기록 장애였기 때문이다.
- 재시작 전에 저장 방식을 바꿨다. 모델 행동과 채점에는 영향이 없다.
  - 누적 스트리밍 이벤트(`message_update`)는 저장하지 않는다.
  - 실행이 끝나면 패키지 사본·캐시·중복 세션 파일을 지운다.
- 재시작 뒤 haiku runner의 동시 실행 수는 3이다. 계획은 4였고, 첫 시작은 2였다.
