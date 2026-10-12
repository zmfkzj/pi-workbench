# Workbench 선택 정책 파일럿 (2026-10-12)

감사에서 "실험 후 결정"으로 남긴 네 권고를 실제 모델 실행으로 비교한 작은 파일럿이다. 운영 catalog·라우터·vendor 기본값은 바꾸지 않았다. 변형은 모두 이 디렉터리의 실험 전용 사본에만 적용했다.

1. **R1** Ponytail full/ECC search-first 기본 경로 축소
2. **R2** Verification Before Completion을 독립 선택 대상에서 빼고 공통 원칙으로 대체
3. **R3** 도구·환경 의존 스킬의 수동 전용화(R3a)와 조건부 추천 강화(R3b)
4. **R4** 전문 문서의 선택 단위 분할. DMAIC로 시험했다.

**결론:** 계획한 90회가 모두 실행되어 수용 기준을 통과했다(실패·중단·재시도 0). 네 변형 모두 수용 기준상의 품질 차이는 관측되지 않았다. 이 과제들은 두 모델에 쉬웠기 때문에(천장 효과) 품질 개선이나 저하를 판별할 힘이 없었다.

판정에 쓸 수 있는 근거는 품질이 아니라 **노출과 비용**이다.
- 자연 auto 탐색에서 모델은 라우터까지만 읽었다. Ponytail·ECC·Verification·ast-grep·Context7·DMAIC 원문은 한 번도 열지 않았다.
- 패키지는 opus 코딩 과제에서 실행당 입력 토큰을 약 2만~4.7만 늘렸다. 정가 환산 비용으로는 $0.01~0.10이다.

## 기준과 통제

| 항목 | 값 |
|---|---|
| 기준 스냅샷 | `pi-workbench` `3016176fe38ea3b51bc5654c083d56f211525de0` (콘텐츠 교정 6패치 포함). `git archive`로 추출한 사본 |
| 주 모델 | `cliproxyapi/claude-opus-5-5`, thinking `high` (요청 세션과 같은 모델) |
| 민감도 모델 | `cliproxyapi/claude-haiku-5-5`, thinking `high` (2단계) |
| Pi | 1.1.0, print 모드 `--mode json` |
| 도구 | `read,bash,edit,write` (모든 비교군 동일) |
| 발견 차단 | `--no-extensions --no-skills --no-context-files --no-prompt-templates --no-themes --no-mcp`. provider 확장과(off 제외) 실행별 Workbench 사본의 `index.js`·`skills/`만 명시해 로드 |
| 격리 | 실행마다 새 agent dir(settings에 패키지 없음, provider 설정은 링크, 모델 카탈로그는 복사), 새 HOME·TMPDIR·npm/pip/cargo 경로, 과제 저장소 사본, 최소 환경 변수(호출 세션의 `PI_*` 없음). 세션·요약·워커 상속·orche 위임은 없다 |
| 상한 | 실행당 900초, 도구 호출 80회, 정가 환산 $4. 1단계 총 $60, 2단계 총 $40. 동시 실행 4 |
| 순서 | 고정 seed로 섞은 1회차 뒤에 2회차를 역순으로 실행 (`make_plan.mjs`) |

off 대조군에는 Workbench 확장, 라우터, 명시 선택, 과거 스킬 본문이 없다. 시스템 프롬프트의 skills 절이 비어 있는 것을 smoke로 확인했다. 대신 Pi 기본 시스템 프롬프트(Pi 문서 안내 포함)는 모든 비교군에 같다. 모델이 이미 "작은 변경·검증·출처" 같은 습관을 갖고 있으면 Workbench 지침의 효과는 그만큼 가려진다. 이 점은 한계로 본다.

## 비교 구성

정확한 변경은 `variants/<이름>.diff`에, 내용 hash는 `variants/hashes.json`에 있다. 변형은 `harness/make_variants.py`가 기준 사본에 단언된 문자열 치환만 적용해 만든다.

| 구성 | 의미 |
|---|---|
| `off` | Workbench 없음 |
| `current` | 3016176 그대로, 자연 auto 발견 |
| `r1` | wb-coding 라우터 설명·첫 문단·ponytail 노트, WORKFLOWS coding 1–2, ADAPTERS, catalog coding guidance에서 "기본 Ponytail full/ECC search-first"를 제거. 두 스킬은 표에 남아 선택 가능 |
| `r2` | wb-coding·wb-analysis 라우터와 catalog에서 Verification Before Completion 제거. WORKFLOWS 공통 운용에 검증 원칙 한 줄 추가. 정직한 보고·권한·기존 검증 문장은 유지 |
| `r3a` (수동 전용) | Context7, ast-grep(+outline), UI UX Pro Max, Frontend Design, PBT, FiftyOne, imagegen, ElevenLabs 2종, Video Director, VFX를 모든 라우터 표·노트에서 제거하고 "`/workbench skill <id>`로만 선택"이라고 표기. catalog에는 남아 명시 선택은 가능 |
| `r3b` (조건부 추천) | 같은 스킬을 표에 두고 "조건: <도구·환경>이 이미 있을 때만", "먼저 확인하고, 아니면 읽지 말고 설치하지 않는다"는 게이트를 추가 |
| `r4` | DMAIC `SKILL.md`를 진입 파일과 단계별 참조 6개로 분할. 교정된 본문과 예제는 문장 그대로 옮겼다 |
| `*-profile`, `*-mfg` | 요청 전에 `/workbench use coding` 또는 `manufacturing`을 실행하는 프로필 모드. 2단계, opus만 |
| `*-select` | 요청에 `/workbench skill dmaic`를 붙이는 강제 노출. 자연 발견과 분리해 보고한다 |

## 과제와 수용 기준

과제 저장소는 `tasks/*/repo`에 있다. 모델에는 `prompt.md`만 주었다. 채점기 `tasks/*/hidden`은 실행이 끝난 최종 상태를 채점하며, 실행 결과를 본 뒤에 바꾸지 않았다. 각 채점기는 시작 상태를 거부하고 `reference.diff`를 적용한 답을 통과시킨다(`harness/self_check.test.mjs`).

| 과제 | 관련 권고 | 수용 기준 |
|---|---|---|
| T1 CSV 내보내기 | R1·R2 | RFC 4180 인용, null/falsy 처리, 열 순서, `--csv`의 앞/뒤 위치, 기존 JSON 출력 유지, 의존성 추가 없음 |
| T2 기간 파서 버그 | R1·R2 | 버그는 src에 있지만 CLI는 생성된 `lib/`를 읽는다. 재빌드 없이 src만 고치면 원래 증상이 남는다. src 값·검증 회귀·CLI 증상·`lib`이 빌드 결과와 같은지 확인 |
| T3 호출 이전 | R3 (ast-grep 미설치) | 별칭·namespace·여러 줄 호출까지 이전, 주석·문자열·변수·다른 객체의 메서드는 유지. 요청 결과가 원본과 같아야 하고, `oldFetch`를 throw로 바꾼 사본에서도 동작. 미사용 import 정리 |
| T4 냉각유 채택 판단 | R4 (DMAIC) | Welch t·df·p·CI·평균·SD·실제 USL 초과 수가 데이터에서 계산한 값과 일치, 추천이 `pilot_before_adopt` 또는 `insufficient_data`, 위협 요인에 소재 로트 포함, 보고서 존재. 데이터는 냉각유와 소재 로트·기간이 완전히 겹치도록 설계한 고정 fixture다(정규 난수 seed 20261012, A 평균 1.45/SD 0.16, B 1.39/0.15, 각 80개; 표본값 p≈0.0006) |

T4 보고서는 사전에 정한 5개 루브릭(교락 인식, 인과 단정 없음, 판별 가능한 다음 단계, 관측값과 모형 추정의 구분, 측정 시스템 언급)으로 다시 채점했다. 채점자는 다른 계열 모델 `cliproxyapi/gpt-6.1-sol`이며, 구성명을 가린 무작위 라벨로 채점했다(`harness/judge_t4.mjs`). 이 채점은 보조 지표다.

## 실행 규모와 사용량

| 단계 | 계획 | 실행 | 수용 통과 | 실패·중단 | 입력(비캐시) | 캐시 읽기 | 출력 | 정가 환산 비용 |
|---|---|---|---|---|---|---|---|---|
| 1 (opus, 자연 auto + 강제 선택) | 34 | 34 | 34 | 0 | 0.50M | 2.66M | 0.22M | $6.29 |
| 2 (opus 프로필 22 + haiku 민감도 34) | 56 | 56 | 56 | 0 | 1.11M | 7.40M | 0.54M | $4.53 |
| T4 블라인드 채점 | 24 | 24 | 24/24 만점 | 0 | – | – | – | $0.25 |

비용은 Pi가 provider 모델 카탈로그의 단가로 계산한 값이다(`usage.cost`). 청구서 값이 아니다. 실행별 원자료는 `results/runs-stage*.jsonl`, 집계는 `results/summary.md`에 있다. 원자료에는 모델·설정·구성 hash·과제·반복·종료 상태·검사별 결과·벽시계 시간·도구 호출과 인자·토큰·실제로 읽은 Workbench 파일이 들어 있다.

## 노출 (실제로 읽은 Workbench 파일)

| 모델, 모드 | 실행 수 | 라우터 | Ponytail | ECC | Verification | ast-grep/Context7 | DMAIC 원문·참조 |
|---|---|---|---|---|---|---|---|
| opus, 자연 auto | 22 | 21 | 0 | 0 | 0 | 0 | 0 |
| haiku, 자연 auto | 22 | 4 (모두 T4의 wb-manufacturing) | 0 | 0 | 0 | 0 | 0 |
| opus, 프로필 | 22 | – (가이드 주입) | 5 (current 3/6, r2 2/6, r1 0/6) | 0 | 0 | 0 | 2/4 |
| opus/haiku, 강제 선택 | 8 | – | – | – | – | – | 본문 첨부 8, 참조 추가 열람 6 |

## 권고별 판단

**R1 Ponytail/ECC 기본 경로 축소 → 조건부 채택 가능 (보류 아님, 단 품질 근거 없음).**
- 자연 auto에서는 현재판도 Ponytail·ECC 원문을 열지 않았다(0/22). 기본값의 실제 비용은 라우터 문구뿐이었다.
- 프로필 모드에서는 현재판이 Ponytail을 3/6회 열었고, r1은 0/6이었다.
- r1-profile과 current-profile의 짝 차이는 입력 토큰 −0.96만~−2.4만(T1·T2 4쌍)이고, 수용은 4/4 대 4/4였다. 추가 행 수의 차이는 +0~+1이었다.
- 따라서 "기본값 제거가 품질을 떨어뜨린다"는 신호는 없고, 토큰은 줄어든다.
- 다만 이 작업들은 Ponytail 없이도 작은 변경이 쉬운 과제였다. 큰 변경에서의 과잉 설계 억제 효과는 측정하지 못했다.

**R2 Verification 독립 선택 제외 → 조건부 채택 가능.**
- Verification 원문은 90회 중 한 번도 열리지 않았다.
- 마지막 수정 뒤 테스트 실행 비율은 다음과 같았다.

  | 모델 | current | r2 | off |
  |---|---|---|---|
  | opus | 4/4 | 4/4 | 4/4 |
  | haiku | 3/4 | 4/4 | 4/4 |

- T2의 재빌드 함정도 모든 실행이 통과했다. 거짓 완료 주장은 0이었다.
- 현재 라우터의 Verification 행은 이 과제들에서 행동을 바꾸지 않았다. 공통 원칙 한 줄로도 검증 누락이 늘지 않았다.
- 단, 검증 누락이 실제로 일어나는 더 어려운 과제나 약한 모델에서는 확인하지 못했다. 명시 선택용으로 catalog에 남기는 것도 동등하게 타당하다.

**R3 수동 전용(r3a) 대 조건부 추천(r3b) → 판단 보류. 근거는 "도구 부재 조건"에 한정된다.**
- T3에서 어떤 구성도 ast-grep·Context7 스킬을 열지 않았고 설치도 시도하지 않았다(0/22).
- r3b는 1회 `ast-grep --version`으로 존재를 확인했다. 게이트대로의 행동이다.
- 수용은 모두 통과했다. 비용 차이는 짝 사이 변동보다 작았다.
- 두 안 모두 관측상 해가 없다. 도구가 실제로 설치된 환경에서 발견 가능성이 줄어드는지(r3a의 위험)는 이 파일럿으로 판단할 수 없다.
- 미디어·FiftyOne 스킬은 과제가 없어서 일반화하지 않는다.

**R4 DMAIC 분할 → 보류.**
- 자연 auto와 haiku에서는 DMAIC 원문까지 가지 않았다(0/16). 분할은 이 경로에 영향이 없다.
- 프로필 모드와 강제 선택에서는 분할판이 단계 참조만 골라 읽었다. 그러나 짝별 입력 토큰은 다음처럼 방향이 엇갈렸다.

  | 비교 | 짝별 입력 토큰 차이 |
  |---|---|
  | opus 강제 선택 | −29만, +13만 |
  | opus 프로필 | −7만, +18만 |
  | haiku 강제 선택 | +2만, +20만 |

- 일관된 절감은 보이지 않았다. 품질(수용 및 블라인드 루브릭 5/5)은 같았다.
- 분할은 강제 노출에서 읽는 양을 줄일 수 있지만, 그만큼 왕복이 늘 수 있다. 이 크기의 표본으로는 순효과의 부호도 확정할 수 없다.

**참고: 패키지 자체.**
- opus 코딩 과제에서 current는 off보다 입력 토큰이 짝당 +2.0만~+4.7만이었다. 정가 환산 비용으로는 +$0.01~0.10이고, 대부분 캐시 읽기다.
- 수용 결과는 같았다. 이 과제들에서 Workbench는 품질 이득 없이 소폭의 비용을 더했다.

## 한계

- **천장 효과:** 90/90 통과. 품질 차이를 판별하려면 더 어렵거나 모호한 과제, 또는 실패가 실제로 나는 모델이 필요하다.
- **표본:** 구성×과제당 2회. 통계 검정을 하지 않았다. 짝 차이는 provider 캐시(동시 실행과 순서에 따라 캐시 적중이 달라 비용이 크게 변동)와 응답 변동에 민감하다.
- **노출:** 자연 auto에서 vendor 원문이 열리지 않아, R1–R4의 원문 효과는 프로필·강제 선택 모드에서만 일부 관측되었다.
- **공유 /tmp:** 여러 실행이 TMPDIR 대신 하드코딩한 `/tmp/<이름>`에 비교용 스냅샷·로그를 썼다(T2–T4. 예: `/tmp/before.json`, `/tmp/ra_venv`). 동시 실행끼리 이름이 겹쳤을 수 있다. 채점은 저장소 최종 상태로 했고 실패는 없었다. 그래도 재실행할 때는 동시 실행 1 또는 실행별 mount namespace(bwrap 등)를 권한다.
- **haiku T4:** 8/10 실행이 scipy 설치를 시도했다(off 포함 모든 구성에서 비슷함). HOME 격리로 사용자 환경에는 설치되지 않았다.
- **범위:** 같은 Pi 기본 시스템 프롬프트와 모델 자체의 습관이 Workbench 지침과 겹친다. orche 위임·워커 경로·OMP·TUI는 실험하지 않았다. 실험자는 과제 프롬프트 외의 시스템 지침을 추가하지 않았다.

## 재실행

`pi-workbench` 루트 기준, 실제 모델 호출 비용이 든다.

```bash
S=<scratch dir>
mkdir -p $S/snapshot && git archive 3016176fe38ea3b51bc5654c083d56f211525de0 | tar -x -C $S/snapshot
python3 experiments/policy-pilot/harness/make_variants.py $S/snapshot $S/variants
node experiments/policy-pilot/harness/make_plan.mjs $S/variants $S/plan1.json 1
node experiments/policy-pilot/harness/make_plan.mjs $S/variants $S/plan2.json 2
node experiments/policy-pilot/harness/run.mjs --plan $S/plan1.json --variants $S/variants --scratch $S --out $S/results1
node experiments/policy-pilot/harness/run.mjs --plan $S/plan2.json --variants $S/variants --scratch $S --out $S/results2
node experiments/policy-pilot/harness/judge_t4.mjs --scratch $S --ledgers $S/results1/runs.jsonl,$S/results2/runs.jsonl --out $S/judgements.jsonl
python3 experiments/policy-pilot/harness/analyze.py $S/results1/runs.jsonl,$S/results2/runs.jsonl $S/plan1.json,$S/plan2.json
```

모델 없이 하는 검사는 다음과 같다. 채점기의 음성·양성 대조, 변형 hash·diff 재현, 계획 재현을 확인한다.

```bash
node --test experiments/policy-pilot/harness/self_check.test.mjs
```

`run.mjs`는 `~/.pi/agent`의 CLIProxyAPI provider 확장과 설정 파일을 링크해서 사용한다. 결과 파일에는 자격 증명이 없다(키 문자열 검색으로 확인). 경로는 `<scratch>`로 바꿔 두었다.
