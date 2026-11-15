# 라우팅 선택 측정 (2026-11-15)

`wb-*` 라우팅 스킬의 설명문 변경과 Quality-Engineering 하위 스킬 4개의 카탈로그 등록이 실제 모델의 스킬 선택을 바꾸는지 확인한 소규모 측정이다. 패키지에 포함되지 않는다(`package.json`의 `files`에 `experiments/`가 없다).

이 문서는 두 차례 측정을 담는다. [2차 측정](#2차-측정-후속-개선)은 고친 측정 하네스로 연구 색인 경로 명확화, statistical-power wrapper, Archify 다이어그램 문구를 차례로 평가했다. 그 아래의 1차 측정 결과(`results/haiku.jsonl`, `results/sonnet.jsonl`)는 read를 시작 시점에 집계한 옛 하네스로 만든 것이라 2차 결과와 섞지 않는다.

## 2차 측정 (후속 개선)

**결론:**
- **연구 색인 경로 명확화(A)는 채택했다.** 라우터를 연 실행에서 색인 오경로 시도가 2회에서 0회로 줄었고, 색인 사용(read 또는 색인 줄을 돌려준 grep)이 4/10에서 7/8로 늘었으며, 실행당 도구 호출이 4.9회에서 3.9회로 줄었다. 사전에 정한 기준 중 라우터 감소 기준은 걸렸지만, r2와 A의 라우팅 설명문은 바이트 단위로 같아 첫 단계 선택에 영향을 줄 수 없다. 그래서 라우터를 연 실행만 비교하는 사후 확장(3회 추가)을 했고 이를 밝혀 둔다.
- **statistical-power wrapper는 채택하지 않았다.** 표본 수 요청 5개에서 도달이 0/15에서 15/15로 늘었고, 프롬프트 증가는 약 234 토큰, 블라인드 품질 검토는 75/75 동점이었다. 그러나 회귀 요청 20개 × 2회에서 5개 요청이 2회 중 1회씩 스킬·라우터 도달을 잃었다(하위 스킬 19/40 → 16/40, 늘어난 요청 0개). 사전 기준(요청별 1/3 초과 감소 없음)을 충족하지 못했다. 후보 파일은 `candidates/statistical-power-wrapper/SKILL.md`에만 둔다.
- **Archify 다이어그램 문구 후보(D)는 채택하지 않았다.** 쓰기·실행 도구와 결제 코드 fixture가 있는 조건에서는 현재 문구도 단독 HTML 요청에서 Archify를 3/3 열었다. Mermaid만 원하는 요청과 설명만 원하는 반대 사례에서는 두 변형 모두 0/6이었다. 바꿀 근거가 없다. 후보 차이는 `candidates/diagram-wording.diff`에 있다.
- **측정 중 발견해 고친 것:** 새로 넣은 Archify snap 우회 주의사항 때문에, 정상 브라우저가 주어진 sandbox에서도 모델이 `ARCHIFY_CHROME`을 snap Chromium으로 덮어쓰거나 `TMPDIR`를 바꿨다. 그 결과 6회 중 2회의 browser-check가 실패했다. 주의사항을 "이미 설정된 `ARCHIFY_CHROME`은 바꾸지 않고, snap 실행 오류일 때만 한 번 재시도"로 고친 뒤 3회 모두 Archify를 열었고, 마지막 finalize receipt도 3/3 통과했다.

**하네스 변경:** `observe.mjs`가 이벤트를 집계하고, `observe.test.mjs`가 이를 회귀 검사한다(`npm run test:measurement`).
- read는 `tool_execution_end`에서 `toolCallId`로 시작 이벤트와 짝지은 성공 결과만 센다. 실패한 read·ls·grep·find는 잘못된 경로 시도(`invalidPaths`)로 센다.
- 연구 색인은 성공한 read, 또는 색인 줄을 실제로 돌려준 grep만 사용으로 센다. grep 사용과 파일 열기는 따로 기록한다(`researchIndexRead`, `researchIndexGrep`).
- 첫 모델 호출의 프롬프트 토큰을 기록한다(`usage.firstPromptTokens` = input + cacheRead + cacheWrite). 누적 input, cacheRead, cacheWrite, output은 따로 기록한다. 비용이 없는 메시지는 `costMissing`으로 표시하고 무료로 치지 않는다.
- 요청별 `scenario`(tests/routing-requests.json `scenarios`)로 도구, fixture 작업 디렉터리, 브라우저, 한도를 정한다. 다이어그램 시나리오는 `read,bash,edit,write,grep,find,ls`와 `fixtures/payments`를 쓴다.
- 브라우저가 필요한 시나리오에서는 `--chrome`으로 받은 Chrome for Testing을 읽기 전용으로 bind하고 `ARCHIFY_CHROME`으로 넘긴다. sandbox 안에서는 Chrome sandbox용 user namespace를 쓸 수 없으므로, 명시 플래그 `--chrome-no-sandbox`가 있을 때만 그 시나리오에 `ARCHIFY_CHROME_NO_SANDBOX=1`을 준다. 측정용 bubblewrap 안에서만 쓰며 사용자 환경에는 쓰지 않는다.
- Archify 결과는 생성된 `*.finalize-summary.json` receipt 중 마지막 것으로 판정한다. 생성 파일은 `--artifacts`에 보존한다.
- 패키지 사본은 내용 hash로 주소를 정하고, run ID에는 패키지 hash와 요청·시나리오 hash를 넣는다. 그래서 바뀐 후보가 옛 사본이나 옛 기록으로 평가되지 않는다.
- 모든 단계와 모델의 비용은 하나의 원장(`--ledger`)에 쌓는다. 새 실행은 원장 합계에 진행 중 실행의 상한 예약을 더해도 `--cost-cap` 안일 때만 시작한다. 하네스 오류로 끝난 실행은 상한액으로 계산한다.
- 최종 답변 텍스트(`finalText`)를 저장한다. `analyze.mjs`는 전체 시도, 중단, 실패, 반대 사례의 오탐을 따로 보고한다.

**요청 확장 (`round: 2`, 모두 held-out, cue 없음):**
- 이름으로 짐작하기 어려운 전문 스킬 요청 4개: phylo-tree→etetoolkit, msms-spectra→matchms, mri-layout→bids, censored-survival→scikit-survival
- 표본 수 요청 4개: 한국어·영어, 명시적·간접적, 군집 무작위 포함
- 다이어그램 요청 3개: 단독 HTML 1개, 반대 사례(Mermaid만, 설명만) 2개

**방법과 예산:**
- 판정 기준과 품질 검토 rubric은 각 단계 결과를 보기 전에 `results/round2/PREREG.md`에 적었다. 사후 확장은 그 파일의 addendum에 있다.
- Sonnet 5.5(thinking medium)로 채택을 판단하고, Haiku 5.5(thinking low)는 1단계 보조로만 썼다. Haiku는 연구 요청 36회 모두 라우터를 열지 않았다.
- 비용은 Pi가 카탈로그 단가로 계산한 값이다. 사용자 승인 상한은 $25였고 하네스 상한은 $23으로 걸었다. 실제로는 250회, $15.38을 썼다. 단계별로는 1단계 $3.53(Haiku $0.07 포함), 2단계 $7.30, 3단계 $4.54다. 비용이 누락된 실행은 0회였다.

**단계별 결과** (Sonnet; `node analyze.mjs results/round2/<file>`):

| 단계 | 비교 | 핵심 수치 |
|---|---|---|
| 1. 색인 경로 | r2(이전 작업 트리) vs A, 연구 요청 6개 × 3–6회 | 라우터를 연 실행에서 전문 스킬 도달 9/10 vs 7/8, 색인 사용 4/10 vs 7/8, 색인 오경로 2 vs 0. 전체 라우터 13/33 vs 11/33(설명문 동일, 첫 단계 잡음). phylo-tree·censored-survival은 두 변형 모두 0/6 |
| 2. 표본 수 wrapper | cur vs W(cur + `skills/statistical-power`) | 표본 수 도달 0/15 vs 15/15. 회귀 20개 × 2회: wrapper 오열람 0, 하위 스킬 19/40 vs 16/40, 라우터 34/40 vs 33/40. 첫 프롬프트 5,343 vs 5,577 토큰. 표본 수 요청당 비용 $0.028 vs $0.064 |
| 2. 품질 검토 | 같은 rep끼리 짝지은 15쌍, 변형명 가림 | 5점 rubric 합계 75 vs 75. 질적 메모: 동물 실험 3쌍에서는 W 쪽이 효과 크기 과대추정을 더 경고했다. 작은 계산 실수 2건은 cur 쪽이었다 |
| 3. 다이어그램 | cur vs D, 쓰기 가능한 fixture 조건 | 단독 HTML 요청의 Archify 3/3 vs 3/3, 반대 사례 오열람 0/6 vs 0/6, 회귀 4개 × 2회는 동일. 마지막 finalize receipt 통과 2/3 vs 3/3이었고, 실패는 모두 위 snap 주의사항의 오적용 때문이었다. 주의사항을 고친 cur2는 3/3 |

**2차 측정의 한계:**
- 요청마다 반복이 3–6회뿐이고, 한 요청 안의 반복은 독립 표본이 아니다. 회귀 기준은 2회 반복이라 거칠다. wrapper 회귀 감소(5개 요청, 늘어난 요청 0개)가 우연인지는 판정할 수 없다. 반복을 늘려 다시 판단하려면 약 $6이 더 든다(추정).
- 품질 검토는 이 작업자(LLM) 한 명이 rubric으로 채점했다. 사람 전문가 검토가 아니고, 검증된 품질 척도도 아니다. 15쌍 모두 핵심 수치는 기준값 ±10% 안이었다.
- 파일을 열었다는 것은 경로를 골랐다는 증거일 뿐이다. 답변이 좋다는 증거는 아니다. 자동 finalize 통과도 사람이 눈으로 검토했다는 뜻이 아니다.
- 다이어그램 측정은 bubblewrap 안의 Chrome for Testing(`--no-sandbox`)으로 했다. 사용자 환경의 snap Chromium 경로는 별도의 수동 smoke로만 확인했다(docs/VALIDATION.md).
- 1단계 사후 확장과 전문 스킬 기준의 해석(횟수가 아니라 놓친 수로 비교)은 사전 계획에서 벗어난 것이다.

재현 예:

```bash
node experiments/routing-selection/run.mjs --scratch /scratch/r2 --stage s3 --variant cur=$PWD --requests diagram-html,diagram-mermaid,diagram-prose \
  --model cliproxyapi/claude-sonnet-5-5 --thinking medium --reps 3 --ledger /scratch/r2/ledger.jsonl --cost-cap 23 \
  --chrome /path/to/chrome-linux64/chrome --chrome-no-sandbox --artifacts /scratch/r2/artifacts --out /scratch/r2/s3.jsonl
```

## 1차 측정 (옛 하네스, read를 시작 시점에 집계)

**결론 (1차):**
- **Sonnet 5.5에서는 변경 후 라우터와 하위 스킬을 더 자주 열었다.** 12개 조정용 요청에서 적절한 하위 스킬을 연 실행은 변경 전 6/36, 1차(r1) 23/36, 최종(r2) 23/36이었다. 같은 요청에서 적절한 라우터를 연 실행은 25/36, 32/36, 33/36이었다.
- **조정에 쓰지 않은 요청 5개(held-out)에서는 효과가 작고 불확실하다.** Sonnet 기준 라우터는 2/15 → 6/15 → 9/15, 하위 스킬은 0/15 → 0/15 → 2/15였다.
- **Haiku 5.5(thinking low)는 대부분 스킬 없이 바로 답했다.** 라우터를 연 실행은 27/85 → 37/85 → 37/85였고, 하위 스킬을 연 실행은 3/85 → 7/85 → 3/85로 변화가 없거나 불안정했다.
- **반복적으로 놓친 요청이 있다.**
  - `sample-size`(검정력 계산)는 두 모델, 모든 변형에서 라우터를 열지 않았다.
  - `sequence-diagram`은 Archify를 한 번도 열지 않았다.
  - `camera-swap`·`label-boundaries`는 `wb-vision`만 읽고 답했다.
  - 이 실행들에서 모델은 라우터 안내만으로, 또는 스킬 없이 답했다. 직접 wrapper가 이를 바꾼다는 근거는 없으므로 wrapper는 보류했다.
- **선택 정확도가 개선되었다고 일반화할 수는 없다.** 요청 수와 반복 수가 작고, 한 요청의 반복은 서로 독립이 아니다. r2 문구는 r1 결과를 본 뒤 정했다.

### 비교한 변형

라우팅 파일의 SHA-256(8개 `wb-*/SKILL.md`를 이은 값)은 각 레코드의 `routingHash`에 있다.

| 변형 | 내용 | `routingHash` 앞 12자리 |
|---|---|---|
| `before` | 커밋 `a4ca6b3`의 패키지. 짧은 설명문, 카탈로그 52개 | `54c8f9c7cbef` |
| `r1` | 프로필 `routing` 한국어 문구 추가, QE 하위 스킬 4개 등록(카탈로그 56개) | `ad098913afbc` |
| `r2` | r1에 짧은 영어 단서 목록을 덧붙임. coding에는 "라이브러리 없이 표준 HTML·CSS·브라우저 API로 구현하는 방법"을 추가. 현재 작업 트리의 상태 | `408f3eb955b3` |

- r2는 r1 측정에서 영어 웹 플랫폼 질문(`light-dismiss`)과 영어 연구 요청이 라우터를 놓친 것을 보고 정했다.
- held-out 요청 5개(`tests/routing-requests.json`의 `heldOut: true`)는 r2 문구를 정한 뒤 추가했다.

### 방법

- **요청:** `tests/routing-requests.json`의 17개를 썼다. 조정용 12개와 held-out 5개이고, 한국어 9개와 영어 8개다. 어느 요청도 스킬 이름을 직접 말하지 않는다.
- **실행:** `run.mjs`가 요청마다 새 Pi 1.5.2 print 세션(JSON 이벤트)을 시작한다.
  - 도구는 `read,grep,find,ls`뿐이다.
  - 확장은 provider와 해당 변형의 Workbench뿐이다. 스킬은 그 변형의 `skills/` 8개뿐이다.
  - context file, prompt template, MCP는 끄고, 작업 디렉터리는 비어 있다.
  - 프롬프트는 요청 문장 그대로다.
- **격리:** bubblewrap을 쓴다.
  - 호스트는 읽기 전용이고, HOME과 scratch 루트는 가린다.
  - 보이는 쓰기 경로는 실행 디렉터리뿐이다. 패키지 사본은 변형 이름이 드러나지 않는 hash 경로에 읽기 전용으로 둔다.
  - provider 키는 파일로 쓰지 않고 `CLIPROXYAPI_API_KEY` 환경 변수로만 전달한다.
- **판정:** `read` 호출의 경로로 판정하고, 모델 judge는 쓰지 않는다. 1차 하네스는 `tool_execution_start` 시점에 분류했으므로 실패한 read도 셀 수 있었다(경로가 정확히 일치해야 분류되므로 영향은 작다고 추정). 이 문서의 이전 판은 "성공한 read"라고 잘못 적었다. 2차 측정부터는 성공한 결과만 센다.
  - `routerHit`: 요청의 허용 프로필 중 하나의 `wb-*/SKILL.md`를 열었다.
  - `skillHit`: 허용 카탈로그 스킬 중 하나의 원본 `SKILL.md`를 열었다. 카탈로그 밖의 vendor `SKILL.md`는 디렉터리 이름으로 센다.
  - `specialistHit`: 연구 전문 스킬 `SKILL.md`를 열었다.
  - 답변의 품질은 평가하지 않았다.
- **모델과 비용:** 비용은 Pi가 카탈로그 단가로 계산한 값이며 실제 청구액이 아니다.
  - `cliproxyapi/claude-haiku-5-5`(thinking low): 변형별 5회, 255회, $0.49.
  - `cliproxyapi/claude-sonnet-5-5`(thinking medium): 변형별 3회, 153회, $9.03.
  - 408회 모두 정상 종료했다(exit 0, 오류·시간 제한·도구 상한 0).

### 결과

`node experiments/routing-selection/analyze.mjs experiments/routing-selection/results/*.jsonl`의 요약이다.

| 모델 | 변형 | 조정용 12개: 라우터 / 하위 스킬 | held-out 5개: 라우터 / 하위 스킬 |
|---|---|---|---|
| Sonnet 5.5 | before | 25/36 / 6/36 | 2/15 / 0/15 |
| Sonnet 5.5 | r1 | 32/36 / 23/36 | 6/15 / 0/15 |
| Sonnet 5.5 | r2 | 33/36 / 23/36 | 9/15 / 2/15 |
| Haiku 5.5 | before | 26/60 / 3/60 | 1/25 / 0/25 |
| Haiku 5.5 | r1 | 33/60 / 7/60 | 4/25 / 0/25 |
| Haiku 5.5 | r2 | 35/60 / 3/60 | 2/25 / 0/25 |

요청별로 본 내용(Sonnet, before → r2):

- **QE 관련 요청:** `oem-report`, `cause-categories`, `lot-escape`, `why-chain`은 라우터를 3/3 열었다. 하위 스킬은 0/3에서 2–3/3으로 늘었다.
  - 열린 스킬은 각각 8D Report Writing, Fishbone, Is/Is-Not·8D, 5-Why였다.
  - 이 변화는 설명문 변경과 카탈로그 등록이 함께 만든 효과다. 둘을 따로 측정하지 않았다.
- **웹 요청:** `mv3-worker`는 0/3 → 3/3(Chrome Extensions)이었다. `light-dismiss`는 r1까지 0/3이었고 r2에서 3/3(Modern Web Guidance)이었다.
  - held-out인 `scroll-progress`도 r2에서 라우터 3/3, 하위 스킬 1/3이었다.
- **연구 요청:** `single-cell`은 라우터 0/3 → 3/3이었고, 세 번 모두 색인을 거쳐 `scanpy` 전문 스킬을 읽었다. `reviewer-response`는 모든 변형에서 3/3이었다.
- **반대 방향으로 움직인 요청:**
  - held-out `gauge-grr`: r1 3/3이 r2 0/3이 되었다. 하위 스킬은 어느 변형에서도 0이었다.
  - `sequence-diagram`: 라우터 1/3 → 2/3 → 0/3이었다.
  - Haiku `reviewer-response`: 3/5 → 0/5 → 0/5였다.
  - 세 실행 수준의 차이라 우연과 구분할 수 없다.

### 한계

- 요청 17개와 반복 3–5회는 작다. 한 요청의 반복은 서로 독립 표본이 아니므로 비율은 기술 통계로만 읽는다.
- 라우터·스킬을 연 것은 적절한 경로를 고른 증거일 뿐이다. 답변이 더 정확하다는 증거는 아니다.
- r2 문구는 r1의 조정용 결과를 보고 정했다. held-out도 5개뿐이고, r1 → r2 차이는 요청 일부에서만 나타났다.
- 모델은 두 개(Haiku·Sonnet 5.5)만 썼고 OMP는 측정하지 않았다. 대화 맥락이 있는 실제 세션, 프로젝트 파일이 있는 작업 디렉터리, `/workbench use` 같은 프로필 고정은 측정 범위 밖이다.
- 원래 파일을 놓친 실행의 일부는 모델이 경로를 잘못 적은 `read`(예: `pi-workbench` 디렉터리 누락)를 포함한다. 이런 호출은 집계하지 않았다.

### 재현

```bash
git archive a4ca6b3 index.js lib skills catalog.json docs vendor package.json | tar -x -C /scratch/base
node experiments/routing-selection/run.mjs --scratch /scratch/sel --variant before=/scratch/base --variant r2=$PWD \
  --model cliproxyapi/claude-sonnet-5-5 --thinking medium --reps 3 --concurrency 6 --out /scratch/sel/sonnet.jsonl --cost-cap 12
node experiments/routing-selection/analyze.mjs /scratch/sel/sonnet.jsonl
```

현재 `run.mjs`에서는 run ID에 패키지 hash와 요청 hash가 들어가므로 1차 기록과 run ID가 겹치지 않는다. 같은 run ID의 레코드가 이미 있으면 그 실행은 건너뛴다. 실행마다 시나리오의 상한(`runCostCap`, 읽기 전용은 $0.5)을 예약해 두고, 원장(`--ledger`)에 기록된 비용과 예약을 더한 값이 `--cost-cap`을 넘으면 새 실행을 시작하지 않는다. 한 실행은 상한을 넘긴 메시지에서 멈추므로, 실제 지출은 상한보다 메시지 하나만큼 넘을 수 있다. 필요한 것:
- bubblewrap
- CLIProxyAPI provider(`~/.pi/agent/git/github.com/zmfkzj/oh-my-pi-extensions/cliproxyapi`)와 그 설정·키
- provider의 모델 캐시(`~/.cache/pi-cliproxyapi-provider`)
