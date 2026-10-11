# Pi Workbench

**요구사항 도출, 게임 제작, 원인·솔루션·대안 비교, 비전 AI, 제조업 SW, 코딩, 홍보 제작을 하나로 묶은 Pi extension 패키지.**

7개 작업 프로필에서 27개 원본 스킬을 필요한 때 선택한다. Ponytail full을 기본 코딩 방식으로 두고, ECC Search First·Anthropic Frontend Design·UI UX Pro Max·Vercel React·Context7·ast-grep·Superpowers 검증·Trail of Bits 테스트를 함께 제공한다.

원본 스킬의 참고 문서·스크립트·데이터·라이선스도 포함한다. 설치 과정에서 외부 서비스를 연결하거나 생성 API를 호출하지 않는다. 이미지·음원·영상 제작에 필요한 도구는 해당 작업을 수행할 때 사용자의 환경에 연결해야 한다.

## 설치

Pi가 설치된 환경에서 GitHub 저장소로부터 설치한다.

```bash
pi install git:github.com/zmfkzj/pi-workbench
```

해당 프로젝트에만 등록하려면 다음을 사용한다.

```bash
pi install --local git:github.com/zmfkzj/pi-workbench
```

실행 중인 Pi에서는 `/reload`로 다시 읽거나 새 세션을 연다.

### 로컬 폴더 또는 압축 파일에서 설치

다운로드한 파일을 보관할 위치로 이동한 뒤 실행한다.

```bash
mkdir pi-workbench
tar -xzf pi-workbench-0.1.0.tgz -C pi-workbench --strip-components=1
pi install ./pi-workbench
```

**로컬 설치는 디렉터리 경로를 등록하므로 압축을 푼 폴더를 유지해야 한다.** 작업 프로젝트 폴더 안에 둔다면 저장소의 배포 대상에 포함되지 않도록 프로젝트 정책에 맞게 관리한다.

해당 프로젝트에만 등록하려면 마지막 명령 대신 다음을 사용한다.

```bash
pi install --local ./pi-workbench
```

등록 없이 한 번 실행하려면 패키지 디렉터리를 넘긴다.

```bash
pi -e ./pi-workbench
```

이미 이 소스 폴더를 갖고 있다면 압축 단계 없이 `pi install /absolute/path/to/pi-workbench`를 실행하면 된다. 별도 `npm install`이나 TypeScript 빌드는 필요 없다. 확장은 Node.js 표준 라이브러리만 사용하며, Pi 자체의 실행 환경 요구사항은 설치된 Pi 버전을 따른다.

Oh My Pi용 manifest도 제공한다.

```bash
omp plugin link /absolute/path/to/pi-workbench
```

Pi 1.1.0의 실제 리소스 로더에서 확장과 스킬 발견을 검증했다. OMP는 공통 API 계약과 배열형 system prompt를 테스트했으며 실제 OMP 설치·실행 검증은 수행하지 않았다.

## 바로 사용하기

기본값 `auto`에서는 일반 Pi 스킬 탐색을 통해 필요한 `wb-*` 프로필을 선택한다. 자연어로 요청하면 된다. 자동 선택은 모델의 판단이므로 특정 경로를 확실히 쓰려면 프로필을 지정한다.

```text
/workbench use requirements
검사 결과 조회 기능을 만들고 싶어. 기능·비기능 요구사항과 수용 기준을 도출해줘.
```

```text
/workbench use vision
조명이 바뀐 뒤 미탐이 늘었어. 가능한 원인과 확인 순서, 조명 보정·데이터 추가·모델 교체를 비교해줘.
```

```text
/workbench use coding
이 기능을 기존 코드 패턴에 맞춰 가장 작은 완결된 변경으로 구현해줘.
```

```text
/workbench use promo
이 게임 플레이 영상으로 15초 세로 트레일러와 가로 배너를 만들어줘. 연결된 도구로 제작하고 실제 확인한 항목을 알려줘.
```

특정 스킬을 다음 요청에만 적용하려면:

```text
/workbench skill ponytail
이 변경을 구현해줘.
```

해당 명령은 원본 스킬과 주의사항을 다음 사용자 요청에 전달한다. 모델 턴을 자동 시작하지 않으며, 기존 프로필 선택도 바꾸지 않는다. **에이전트가 작업 중일 때는 선택을 거부한다.** 작업 중에 보내는 steering·follow-up 요청에는 적용할 수 없고, 나중의 무관한 요청에 붙는 것을 막기 위해서다. 작업이 끝난 뒤 다시 선택하고 요청을 보낸다.

## 프로필 구성

| 프로필 | 목적 | 주요 스킬 |
|---|---|---|
| `requirements` | 기능·비기능 요구사항, 업무 규칙, 충돌, 수용 기준 | Requirements Elicitation, Problem Solving, ECC Search First |
| `game` | 레퍼런스 판단, 게임 설계·밸런스·에셋·VFX·UI·소리 | Game Design, Create Game Assets, Game Feel, Game UI/UX, Fire & Smoke VFX, Imagegen, ElevenLabs, Ponytail |
| `analysis` | 원인·해결책·대안 비교 | Problem Solving, Structured Root Cause Research, 분야별 진단, Verification Before Completion |
| `vision` | 촬영·라벨·분할·전처리·모델·평가·배포 분석 | NVIDIA TAO Recipe Transfer, FiftyOne Model Evaluation, Context7, Property-Based Testing |
| `manufacturing` | 발생 원인과 검출 실패, 측정 신뢰성, 개선·관리 | 8D Problem Solving, DMAIC, 공통 원인 분석 |
| `coding` | 구현·리뷰·재사용·문서 조회·UI·구조 검색·검증 | Ponytail/Review, ECC, Frontend Design, UI UX Pro Max, Vercel React, Context7, ast-grep/Outline, Superpowers, Trail of Bits |
| `promo` | 홍보 스틸컷·배너·음향·영상 | Imagegen, Create Game Assets, Frontend Design, UI UX Pro Max, ElevenLabs, Video Director |

Game UI/UX는 플레이 화면의 HUD·메뉴·입력 설계용이라 `game`에만 속한다. 홍보 시안의 화면 구성은 `promo`의 Frontend Design·UI UX Pro Max가 담당한다. `scripts/check.mjs`는 스킬의 `profiles`와 프로필의 `skills` 목록이 양방향으로 일치하는지 검사한다.

`comparison`은 별도 모드가 아니라 `analysis`와 분야별 프로필이 함께 사용하는 대안 비교 절차다. 게임 엔진이 정해지지 않았으므로 기본 구성은 범용이고, Three.js 전용 VFX는 적합한 프로젝트에서만 선택한다.

## 명령

| 명령 | 동작 |
|---|---|
| `/workbench` | 도움말 |
| `/workbench list` | 27개 선택 가능한 원본 스킬 목록 |
| `/workbench list game` | 프로필별 스킬 목록 |
| `/workbench use coding` | 현재 대화 분기의 프로필 선택 |
| `/workbench use auto` | 기본 Pi 스킬 탐색 사용 |
| `/workbench use off` | 확장이 추가하는 프로필 안내 중지 |
| `/workbench skill ponytail-review` | 다음 요청에 원본 스킬과 적용 조건 전달(작업이 끝난 뒤에만) |
| `/workbench status` | 현재 프로필 확인 |
| `/workbench doctor` | 로컬 도구·환경변수의 존재 여부 확인 |

Pi 입력창에서 `/workbench ` 뒤에 Tab을 누르면 하위 명령을, `use `·`list `·`skill ` 뒤에서는 `catalog.json`의 프로필(`use`는 `auto`·`off` 포함)과 스킬 ID를 입력한 prefix에 맞춰 제안한다(예: `/workbench use co` → `use coding`, `/workbench skill ponytail-r` → `skill ponytail-review`). 완성은 catalog만 읽고 스킬 본문을 열거나 프로필·세션 상태를 바꾸지 않는다. 이미 완성된 인수 뒤나 인수가 없는 하위 명령 뒤에는 후보를 내지 않는다.

설치된 Pi의 native skill 명령으로 `/skill:wb-requirements`, `/skill:wb-game`, `/skill:wb-analysis`, `/skill:wb-vision`, `/skill:wb-manufacturing`, `/skill:wb-coding`, `/skill:wb-promo`를 직접 선택할 수도 있다.

`list`·`status`·`doctor`·도움말의 출력은 화면 알림으로만 보여 주며 세션에 저장하거나 모델에 보내지 않는다. 대화형(TUI)과 RPC에서 보이며, UI가 없는 print/JSON 모드에서는 표시되지 않는다.

프로필 안내는 요청마다 현재 대화 분기의 프로필로 다시 만들어 모델 요청에만 하나 넣고, 세션에는 저장하지 않는다(Pi의 `context` 이벤트). 이전 버전이 저장한 프로필 안내·명령 출력 메시지도 요청에서 제외한다. 세션 파일의 기존 기록이나 이미 만든 압축 요약을 지우지는 않는다. `off`는 스킬을 제거하거나 지난 대화를 지우지 않는다.

스킬 자체를 더 이상 노출하지 않으려면 Pi에서 이 패키지를 비활성화하거나, 설치할 때 쓴 source로 등록을 해제한다.

```bash
# Git으로 설치한 경우 (`--local`로 설치했다면 같은 옵션을 붙인다)
pi remove git:github.com/zmfkzj/pi-workbench

# 로컬 폴더를 등록한 경우: 설치할 때 지정한 경로
pi remove /absolute/path/to/pi-workbench
```

Git 설치본의 내려받은 디렉터리 경로는 등록된 source가 아니므로 `pi remove`에 쓸 수 없다. `pi -e`로 한 번 실행한 경우는 등록되지 않았으므로 제거할 것이 없다.

## 작업에서 기대할 동작

- **요구사항:** 기능·품질·제약·가정을 분리하고 출처와 상태를 기록한다. 합의하지 않은 성능·정확도 수치를 만들지 않는다. 기술 스택 선정은 별도 요청일 때 진행한다.
- **레퍼런스:** 실제로 확인한 이미지·플레이·음원에서 채택할 요소와 피할 요소, 현재 작업에 맞는 이유를 제시한다. 검색 결과만 본 경우 확인 범위를 밝힌다.
- **원인 분석:** 관찰과 추론을 구분하고 경쟁 가설을 세운 뒤, 이를 구분하는 검증을 선택한다.
- **대안 비교:** 필수 조건으로 후보를 먼저 걸러내고 효과·근거·도입 및 유지 비용·가역성·불확실성을 비교한다. 추천이 달라지는 조건도 설명한다.
- **제작 품질:** 대표 결과물을 먼저 만들고 실제 표시 크기·엔진·움직임·소리로 검수한 뒤 확장한다. 수행하지 않은 재생·청취·생성을 완료했다고 보고하지 않는다.
- **코딩:** 기존 코드와 의존성을 우선하고 가장 작은 완결된 변경을 만든다. 검증은 실제 위험에 맞춰 수행한다.

세부 기준은 [작업 지침](docs/WORKFLOWS.ko.md), 호스트·원본 스킬 차이는 [Pi 적용 지침](docs/ADAPTERS.md)에 있다.

## 제작 도구 연결

스킬은 제작 방법과 품질 기준이다. 모델·API·엔진·계정 자체를 제공하지 않는다.

| 기능 | 실제 실행에 필요한 조건 |
|---|---|
| 요구사항·설계·원인·대안 분석 | Pi 모델과 필요한 자료; 최신 외부 근거에는 검색·문서 조회 수단 |
| 이미지·스프라이트·스틸컷·배너 | 연결된 이미지 생성 도구 또는 선택한 OpenAI API 경로 |
| 효과음·음악 | ElevenLabs 도구/CLI/SDK, 인증, 해당 기능을 지원하는 계정 |
| 영상 편집·렌더링 | 실제 footage, Node 22+, FFmpeg/ffprobe, Python 패키지, 별도 HyperFrames 환경 |
| 3D 에셋 | 사용자가 연결한 3D 생성 도구·Blender·엔진 등; 이 패키지에 3D 생성 서비스가 내장되지는 않음 |
| 웹·게임 UI | 대상 프로젝트 런타임, 실제 화면을 확인할 환경 |
| 비전 실행·평가 | 실제 데이터·모델·프레임워크; 사용 경로에 따라 FiftyOne/NumPy/Pillow 등 |
| 구조 검색·문서 조회 | ast-grep CLI, Context7 MCP 또는 CLI 등 선택한 경로 |

`doctor`는 PATH와 환경변수의 비어 있지 않음만 검사한다. 버전·인증·구독·MCP·Python 모듈·생성 성공 여부는 검증하지 않는다. 생성 도구가 없으면 브리프·프롬프트·스토리보드·검증 계획까지 작성하고 실제 제작은 미완료로 구분한다.

## 검증과 유지보수

```bash
node scripts/check.mjs
node --test tests/runtime.test.mjs
```

첫 명령은 구성, 프로필↔스킬 소속의 양방향 일치, 라이선스 포함 여부, 모든 원본 파일의 Git blob/SHA-256, 별칭 파일, 로컬 Markdown 참조를 검사한다. 두 번째는 상태·명령·인수 자동완성·요청별 프로필 안내·작업 중 선택 거부·로딩 경계·호스트 호환·doctor를 검증한다.

별도로 설치된 Pi로 실제 리소스 로딩과 세션 동작을 확인할 수 있다. 두 번째는 스크립트 모델(faux)로 연속 요청·분기 전환·reload·auto/off·작업 중 선택에서 모델이 받는 내용을 검사하며 네트워크나 유료 모델을 쓰지 않는다.

```bash
PI_WORKBENCH_HOST_MODULE=/path/to/pi/dist/index.js node tests/pi-loader.mjs
PI_WORKBENCH_HOST_MODULE=/path/to/pi/dist/index.js node tests/pi-session.mjs
```

실제 확인 범위와 미검증 항목은 [검증 기록](docs/VALIDATION.md)에 있다. API 비용이 드는 이미지·음악 생성이나 모델 학습을 테스트 과정에서 호출하지 않았다.

원본 버전은 `sources.lock.json`으로 고정한다. 업데이트할 때는 해당 commit과 라이선스·참조를 먼저 검토하고, `python3 scripts/vendor_sources.py`, `python3 scripts/build_catalog.py`, 위 검증을 순서대로 실행한다. 스크립트는 선택한 원본을 다운로드하며 실행하지 않는다. 제거한 source의 잔여 파일은 무결성 검사에서 검출되므로 검토 후 삭제한다.

## 출처와 라이선스

확장 코드·라우팅 지침은 MIT다. `vendor/`의 원본은 각자의 MIT, Apache-2.0 또는 CC-BY-SA-4.0 조건을 유지한다. 특히 Trail of Bits 자료를 MIT로 재표시하지 않았다. 전체 목록과 정확한 commit, 재배포하지 않은 참고 후보는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있다.

공식 호스트 문서: [Pi packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md), [Pi extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md), [Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md).
