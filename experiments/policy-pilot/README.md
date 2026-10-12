# Workbench 선택 정책 파일럿 (2026-10-12)

감사에서 "실험 후 결정"으로 남긴 네 권고를 실제 모델 실행으로 비교한 작은 파일럿이다. 운영 catalog·라우터·vendor 기본값은 바꾸지 않았다. 변형은 모두 이 디렉터리의 실험 전용 사본에만 적용했다.

1. **R1** Ponytail full/ECC search-first 기본 경로 축소
2. **R2** Verification Before Completion을 독립 선택 대상에서 빼고 공통 원칙으로 대체
3. **R3** 도구·환경 의존 스킬의 수동 전용화(R3a)와 조건부 추천 강화(R3b)
4. **R4** 전문 문서의 선택 단위 분할. DMAIC로 시험했다.

**결론:** 원 실행 90회와 3단계 교체 실행 40회가 모두 수용 기준을 통과했다(실패·중단·재시도 0). 과제가 두 모델에 쉬워서(천장 효과) 네 권고 모두 품질 차이를 판별할 힘이 없었다. 원문 노출도 거의 없었다.
- 자연 auto 탐색에서는 라우터까지만 읽었다. Ponytail·ECC·Verification·ast-grep·Context7·DMAIC 원문은 한 번도 열지 않았다.
- Verification 원문은 130회 전부에서 열리지 않았다. 따라서 그 본문을 빼는 것의 품질 영향이나 안전성은 측정되지 않았다.

그래서 네 권고 모두 **채택 근거 없음, 보류**로 판단한다. 판정의 세부와 관측된 노출·토큰 차이는 [권고별 판단](#권고별-판단)에 있다.

1·2단계 실행은 일부가 공유 호스트 `/tmp`를 썼다. 해당 짝 그룹은 접근 경계 안에서 다시 실행해 교체했다([공유 /tmp와 교체 실행](#공유-tmp와-교체-실행)). 판단은 교체 전과 후에 같다.

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

| 단계 | 계획 | 실행 | 오류·중단 | 수용 통과 | 교정 보기에서 유효 | 교정 보기에서 제외 | 입력(비캐시) | 캐시 읽기 | 출력 | 정가 환산 비용 |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 (opus, 자연 auto + 강제 선택) | 34 | 34 | 0 | 34 | 26 | 8 (T3 짝 그룹) | 0.50M | 2.66M | 0.22M | $6.29 |
| 2 (opus 프로필 22 + haiku 민감도 34) | 56 | 56 | 0 | 56 | 24 | 32 | 1.11M | 7.40M | 0.54M | $4.53 |
| 3 (교체, 접근 경계 안) | 40 | 40 | 0 | 40 | 40 | 0 | 0.76M | 5.20M | 0.38M | $2.11 |
| **모델 실행 합계** | 130 | 130 | 0 | 130 | 90 | 40 | 2.37M | 15.26M | 1.14M | **$12.92** |
| T4 블라인드 채점(gpt-6.1-sol) | 34 | 34 | 0 | 34/34 만점 | – | – | – | – | – | $0.35 |

- 비용은 Pi가 provider 모델 카탈로그의 단가로 계산한 값이다(`usage.cost`). 청구서 값이 아니다.
- 제외된 실행의 비용도 합계에 포함했다.
- 3단계 계획(`results/plan-stage3.json`, 상한: 실행당 $4·900초·도구 80회, 단계 총 $8)은 실행 전에 기록했다.
- 실행별 원자료는 `results/runs-stage{1,2,3}.jsonl`에 있다. 모델·설정·구성 hash·과제·반복·종료 상태·검사별 결과·벽시계 시간·도구 호출·토큰·실제로 읽은 Workbench 파일을 담는다. 3단계 원자료에는 `isolation`과 `replaces`도 기록했다.
- 집계 `results/summary.md`는 두 보기를 같은 형식으로 보여 준다.
  - **기록 그대로:** 원 90회.
  - **교정:** 교체된 그룹을 빼고 3단계를 넣은 것.
  - 셀은 모델×모드×과제×구성이다. 열은 계획·시도·유효·수용(유효 분모)·제외·오류와 노출 분모다.
  - 짝 차이는 두 실행이 모두 유효한 짝만 쓴다.

## 노출 (실제로 읽은 Workbench 파일, 교정 보기)

분모는 해당 모드에서 off를 뺀 유효 실행 수다. 괄호는 기록 그대로 보기의 값이며, 다를 때만 적었다.

| 모델, 모드 | 실행 | 라우터 | Ponytail | ECC | Verification | ast-grep/Context7 | DMAIC 원문·참조 열람 |
|---|---|---|---|---|---|---|---|
| opus, 자연 auto | 22 | 20/22 (21/22) | 0/22 | 0/22 | 0/22 | 0/22 | 0/4 (T4) |
| haiku, 자연 auto | 22 | 4/22 (모두 T4의 wb-manufacturing) | 0/22 | 0/22 | 0/22 | 0/22 | 0/4 (T4) |
| opus, 프로필 | 22 | – (가이드 주입) | 5/22 | 0/22 | 0/22 | 0/22 | 2/4 (T4) |
| opus, 강제 선택 | 4 | – | – | – | – | – | 4/4 (본문은 요청에 첨부) |
| haiku, 강제 선택 | 4 | – | – | – | – | – | 1/4 (2/4) (본문은 요청에 첨부) |

프로필 모드의 Ponytail 열람 5/22를 비교 단위별로 나누면 다음과 같다.
- **R1 비교(T1·T2):** current-profile 2/4, r1-profile 0/4, r2-profile 2/4.
- **R3 비교(T3):** current-profile 0/2(기록 그대로 1/2), r3a-profile 1/2, r3b-profile 0/2.

## 권고별 판단

공통 사항:
- 모든 셀에서 수용은 유효 분모 전부였다(예: 2/2). 그래서 품질 차이는 판별할 수 없다.
- 짝 차이는 2쌍뿐이다. 유의성 검정이나 일반화는 하지 않는다.

**R1 Ponytail/ECC 기본 경로 제거 → 보류 (일반 기본값 제거의 효익은 근거 없음).**
- 자연 auto에서는 current도 Ponytail·ECC 원문을 열지 않았다(opus 0/22, haiku 0/22). 이 경로에서는 바뀐 것이 라우터·가이드 문구뿐이다.
- 자연 auto의 r1−current 입력 토큰 짝 차이는 방향이 섞였다.
  - opus: T1 +730/−8,949, T2 −26,997/−183.
  - haiku: T1 −11,663/−19,175, T2 −9,795/+5,465.
- 관찰된 것은 **opus 프로필 모드의 T1·T2(4쌍)** 한정이다.
  - Ponytail 열람: current-profile 2/4, r1-profile 0/4.
  - 입력 토큰 짝 차이: 4쌍 모두 감소(−22,398, −9,618, −24,083, −20,593).
  - 정가 비용 짝 차이: −$0.031, −$0.011, +$0.084, −$0.028로 방향이 섞였다.
- 이 관찰은 프로필 모드의 특정 작은 과제에 한정된다. 품질이 같다는 것을 보인 것도 아니다(천장). 큰 변경에서의 과잉 설계 억제처럼 Ponytail 기본값의 원래 목적은 측정하지 못했다.

**R2 Verification 독립 선택 대상 제외 → 보류 (본문 효과 미측정).**
- **기준선의 노출 부재:** Verification 원문은 current를 포함한 130회 전부에서 열리지 않았다. 따라서 이 실험은 본문을 제거했을 때의 품질 영향이나 안전성을 전혀 측정하지 못했다.
- **라우터 변경 자체의 관측:** r2는 라우터 행과 catalog 항목을 빼고 공통 원칙 한 줄을 더했다. r2−current 입력 토큰 짝 차이는 방향이 섞였다.
  - opus auto: T1 +981/−9,655, T2 −27,106/−566.
  - opus 프로필: T1 +8,608/−5,194, T2 −22,304/−537.
  - haiku auto: T1 +21,867/+12,985, T2 −9,508/+4,907.
- **검증 행동:** 마지막 수정 뒤 테스트 실행 비율(T1·T2, 교정 보기)은 아래와 같다. 차이는 1회뿐이다.

  | 모델·모드 | current | r2 | off |
  |---|---|---|---|
  | opus auto | 4/4 | 4/4 | 4/4 |
  | opus 프로필 | 4/4 | 4/4 | – |
  | haiku auto | 3/4 | 4/4 | 4/4 |

- 위 비율과 T2 재빌드 함정 통과(전부)는 Verification 본문이 읽히지 않은 상태의 결과다. 본문 제거가 안전하다는 근거가 아니다.

**R3 수동 전용(r3a) 대 조건부 추천(r3b) → 보류 (도구 부재 조건만 관측).**
- T3에서 어떤 구성도 ast-grep·Context7 스킬을 열지 않았다(교정 보기에서 off 포함 T3 22회 모두 0). ast-grep 설치 시도도 없었다.
- r3b는 `ast-grep --version`으로 1회 존재를 확인했다(T3-r3b-r1).
- 비용은 판단 근거가 될 수 없다. r3a·r3b−current 입력 토큰 짝 차이는 교체 전에는 감소였지만, 접근 경계 안의 재실행에서는 섞이거나 증가했다.

  | 비교 | 기록 그대로 | 교정(재실행) |
  |---|---|---|
  | opus auto r3a−current | −16,233, −14,837 | +4,845, −21,291 |
  | opus auto r3b−current | −5,895, −6,166 | +914, −22,068 |
  | haiku auto r3a−current | −33,617, −7,076 | +2,215, +17,969 |
  | haiku auto r3b−current | −27,367, −8,262 | +19,770, +18,565 |

  부호가 뒤집힌 것은 이 크기의 짝 차이가 변동 수준이라는 뜻이다.
- 도구가 설치된 환경에서 r3a가 발견 가능성을 줄이는지, 미디어·FiftyOne 스킬에서는 어떤지는 판단할 수 없다.

**R4 DMAIC 선택 단위 분할 → 보류.**
- 자연 auto에서는 DMAIC 원문까지 가지 않았다(T4의 current·r4 실행 opus 0/4, haiku 0/4). 그런데도 haiku auto r4−current 입력 토큰은 +182,383/+40,720였다. 노출이 없는 변형의 차이도 이만큼 흔들리므로, 이 크기의 차이는 변동으로 봐야 한다.
- 원문이 노출된 프로필·강제 선택 모드의 짝 차이도 방향이 엇갈리거나, 노출 없이 증가했다.

  | 비교 | 입력 토큰 짝 차이 | 비고 |
  |---|---|---|
  | opus 강제 선택 | −292,523, +128,906 | |
  | opus 프로필 | −72,225, +175,720 | |
  | haiku 강제 선택 | +106,331, +116,078 | 교정 보기. 참조 열람은 1/2 |

- 수용과 블라인드 루브릭(34건 모두 5/5)은 같았다.

**참고: 패키지 자체(current − off, 교정 보기).**
- opus 자연 auto의 입력 토큰 짝 차이는 다음과 같다. 대부분 캐시 읽기다.

  | 과제 | 입력 토큰 짝 차이 |
  |---|---|
  | T1 | +30,200, +31,261 |
  | T2 | +47,448, +20,573 |
  | T3 | +34,487, +28,878 |
  | T4 | +30,338, −22,251 |

- 정가 비용 짝 차이는 −$0.041~+$0.130이었다.
- 수용은 같았다. 이 과제들에서 품질 이득은 관측되지 않았다.

## 공유 /tmp와 교체 실행

1·2단계 실행에는 실행별 TMPDIR이 있었지만 접근 경계는 없었다. 모델의 bash 명령은 같은 사용자 권한으로 호스트 `/tmp`, 저장소(숨김 채점기 포함), 다른 실행의 디렉터리를 읽고 쓸 수 있었다.

`harness/trace_shared_tmp.py`는 보존된 전체 이벤트 로그를 분석했다. 이벤트 로그에는 write·edit 본문과 도구 결과까지 남아 있다. 결과는 `results/shared-tmp-trace.json`에 있다.

| 항목 | 실행 수 | 실행 |
|---|---|---|
| 호스트 `/tmp` 경로를 직접 쓴 실행 | 33/90 | T3 22개 전부, haiku T2 3, haiku T4 7, opus T4 강제 선택 1 |
| 같은 자원(경로 접두 관계 포함)을 다른 실행과 공유 | 22 | 예: `/tmp/cmp.mjs` 7개 실행, `/tmp/ra_venv` 3개 실행(venv 재사용), `/tmp/orig` 3개 실행 |
| 다른 실행이 먼저 또는 동시에 쓰거나 실행한 자원을 사용 ('가능한 선행·동시 writer') | 17 | |
| 실행 구간이 겹친 다른 사용자가 있음 | 4 | T3-off-r1, T3-r3b-r1, S2-T3-current-profile-r1, S2-T3-r3a-profile-r1 |
| 첫 접근이 쓰기가 아님(남아 있던 다른 실행의 파일을 읽었을 수 있음) | 3 | T3-r3a-r2·S2h-T3-r3b-r1(`/tmp/orig`), T3-r3b-r2(`/tmp/oldsrc`) |
| `cd /tmp` 뒤 상대 경로 등 해석할 수 없는 사용 | 8 | haiku T4 |

- 이벤트 로그로는 명령이 어느 버전의 파일을 읽었는지 확정할 수 없다. 그래서 위 항목은 **가능성**이다.
- 실패가 없었다는 사실은 오염이 없었다는 근거가 아니다.
- 숨김 채점기·참조 답안·judge 기록·저장소·다른 실행 디렉터리를 직접 지목한 도구 호출은 이벤트 로그에 **기록되지 않았다**(0건). 다만 1·2단계에서는 접근이 **불가능하지 않았다**. 문자열로 조합한 경로는 이 검사에서 놓칠 수 있다.

**교체 규칙**(실행 전에 `make_plan.mjs` 3단계로 고정했다):
- 공유 자원을 쓴 22개 실행과 해석 불가 사용 8개 실행이 속한 **짝 그룹 전체**(모델·과제·노출 모드·반복)를 같은 모델·설정·구성으로 다시 실행했다.
- 해당 그룹은 12개, 원 실행은 40개다(opus T3 auto·프로필, haiku T2·T3·T4 auto, haiku T4 강제 선택).
- 교정 보기에서는 원 40회를 제외하고 3단계 40회를 쓴다.
- 교체되지 않고 호스트 `/tmp`를 쓴 실행은 T4-current-select-r1 하나다. 다른 실행이 쓰지 않은 `/tmp/r_before.json`을 먼저 쓰고 읽었다. 그래서 유효로 남겼다.

**3단계 접근 경계**(`harness/sandbox.mjs`, bubblewrap):
- 호스트 파일 시스템은 읽기 전용이고, `/tmp`는 실행별 tmpfs다.
- 쓰기 가능한 경로는 그 실행의 디렉터리뿐이다.
- `~/Code`(저장소와 숨김 채점기)와 `~/.pi/agent`(세션 기록 등)는 빈 tmpfs로 가렸다. provider 확장과 설정, Pi 보조 바이너리만 읽기 전용으로 다시 연결했다.
- 모델 없이 하는 fixture 검사(`self_check.test.mjs`의 sandbox 테스트)가 다음을 확인한다: 채점기가 보이지 않음, 다른 실행이 보이지 않음, 저장소와 HOME에 쓸 수 없음, 경계 안의 `/tmp` 쓰기가 호스트에 나타나지 않음, 자기 실행 디렉터리에는 쓸 수 있음, Pi가 실행됨.
- 3단계에서도 29회가 `/tmp/...` 이름을 썼다(`results/shared-tmp-trace-stage3.json`). 이것은 각 실행의 사설 tmpfs 안이다. 실행 후 호스트 `/tmp` 최상위에 이 실행들이 만든 항목은 없었다.

**교정 전후 차이:**
- 수용은 기록 그대로와 교정 보기 모두 전부 통과했다.
- Verification 0 노출, 자연 auto의 원문 비노출, R1 프로필 관찰(T1·T2는 교체 대상이 아님)은 그대로다.
- 바뀐 것은 교체된 그룹의 토큰·시간 짝 차이다. R3의 부호 반전, haiku 강제 선택 DMAIC 열람 2/4→1/4가 그 예다.
- 네 판단(모두 보류)은 두 보기에서 같다.

## 한계

- **천장 효과:** 130/130 통과. 품질 차이를 판별하려면 더 어렵거나 모호한 과제, 또는 실패가 실제로 나는 모델이 필요하다.
- **표본:** 구성×과제당 2회. 통계 검정을 하지 않았다. 짝 차이는 provider 캐시(동시 실행과 순서에 따라 캐시 적중이 달라짐)와 응답 변동에 민감하다.
- **노출:** 자연 auto에서 vendor 원문이 열리지 않았다. R1·R4 원문 효과는 프로필·강제 선택 모드에서만 일부 관측했고, R2는 전혀 관측하지 못했다.
- **환경 차이:** 3단계는 읽기 전용 호스트와 사설 `/tmp` 안에서 실행했다. 1·2단계의 남은 50회는 경계 없이 실행했다. 두 환경이 섞인 비교는 하지 않았다(짝 그룹 단위로 교체).
- **haiku T4:** 대부분의 실행이 scipy 설치를 시도했다(off 포함). 1·2단계에서는 HOME 격리로, 3단계에서는 읽기 전용 호스트로 사용자 환경에 설치되지 않았다.
- **범위:** 같은 Pi 기본 시스템 프롬프트와 모델 자체의 습관이 Workbench 지침과 겹친다. orche 위임·워커 경로·OMP·TUI는 실험하지 않았다. 실험자는 과제 프롬프트 외의 시스템 지침을 추가하지 않았다.
- **남은 파일:** 1·2단계 실행이 호스트 `/tmp`에 남긴 파일(예: `/tmp/cmp.mjs`, `/tmp/orig`, `/tmp/ra_venv`)은 소유와 범위를 확정할 수 없어 지우지 않았다.

## 재실행

`pi-workbench` 루트 기준이며, 실제 모델 호출 비용이 든다. 3단계에는 bubblewrap이 필요하다.

```bash
S=<scratch dir>
mkdir -p $S/snapshot && git archive 3016176fe38ea3b51bc5654c083d56f211525de0 | tar -x -C $S/snapshot
python3 experiments/policy-pilot/harness/make_variants.py $S/snapshot $S/variants
node experiments/policy-pilot/harness/make_plan.mjs $S/variants $S/plan1.json 1
node experiments/policy-pilot/harness/make_plan.mjs $S/variants $S/plan2.json 2
node experiments/policy-pilot/harness/run.mjs --plan $S/plan1.json --variants $S/variants --scratch $S --out $S/results1
node experiments/policy-pilot/harness/run.mjs --plan $S/plan2.json --variants $S/variants --scratch $S --out $S/results2
python3 experiments/policy-pilot/harness/trace_shared_tmp.py $S $S/results1/runs.jsonl,$S/results2/runs.jsonl > $S/trace.json
node experiments/policy-pilot/harness/make_plan.mjs $S/variants $S/plan3.json 3 $S/trace.json $S/results1/runs.jsonl,$S/results2/runs.jsonl
node experiments/policy-pilot/harness/run.mjs --plan $S/plan3.json --variants $S/variants --scratch $S --out $S/results3
node experiments/policy-pilot/harness/judge_t4.mjs --scratch $S --ledgers $S/results1/runs.jsonl,$S/results2/runs.jsonl,$S/results3/runs.jsonl --out $S/judgements.jsonl
python3 experiments/policy-pilot/harness/analyze.py $S/results1/runs.jsonl,$S/results2/runs.jsonl,$S/results3/runs.jsonl $S/plan1.json,$S/plan2.json,$S/plan3.json $S/judgements.jsonl
```

새로 1·2단계를 실행할 때는 처음부터 접근 경계 안에서 돌리는 것을 권한다. 계획 JSON에 `"isolation"`(`sandbox.mjs`의 `DEFAULT_ISOLATION`)을 넣으면 된다. 다만 기록된 1·2단계 계획에는 이 항목이 없다.

모델 없이 하는 검사는 다음 명령으로 실행한다.

```bash
node --test experiments/policy-pilot/harness/self_check.test.mjs
```

검사 항목:
- 채점기의 음성·양성 대조
- 변형 hash·diff 재현
- 1–3단계 계획 재현
- 교체가 짝 그룹 단위인지, 3단계가 경계 안에서 실행되었는지
- `summary.md`가 원자료에서 다시 생성되는지
- `/tmp` 추적기의 fixture
- sandbox 경계

`run.mjs`는 `~/.pi/agent`의 CLIProxyAPI provider 확장과 설정 파일을 링크해서 사용한다. 결과 파일에는 자격 증명이 없다(키 문자열 검색으로 확인). 경로는 `<scratch>`로 바꿔 두었다.
