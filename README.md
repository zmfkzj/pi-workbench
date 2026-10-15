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

특정 스킬을 다음 요청 한 번에만 적용하려면:

```text
/workbench skill ponytail
이 변경을 구현해줘.
```

선택한 스킬은 바로 다음 사용자 요청 한 번에 붙는다. 그 요청 앞에 Pi의 `/skill:` 형식 블록(대화 화면에서는 접힌 `[skill]` 항목)으로 원본 스킬·위치·주의사항을 넣고, 같은 메시지의 그 요청과 그 요청이 시작한 작업에만 적용하며 이후 요청에는 적용하지 않는다고 밝힌다. 이 텍스트는 대화 이력에 남지만 적용 범위는 그 요청 하나다. 모델 턴을 자동 시작하지 않고 프로필도 바꾸지 않는다.

- **다음 사용자 요청:** idle 상태에서 보낸 요청, 에이전트가 작업하는 동안 입력한 steering·follow-up 메시지, RPC 입력, 확장이 사용자 대신 보내는 요청(`/orche single` 등, 보류됐다 다시 보내지는 follow-up, session-bus 작업 큐)이다. 작업 중에도 선택할 수 있다.
- 다른 확장이 스스로 보내는 메시지(작업 결과, 다른 세션의 메시지 등. `triggerTurn` 포함)는 사용자 요청이 아니므로 선택을 가져가지 않는다. Pi 1.2.0부터는 idle 상태에서 이런 메시지가 시작한 실행에도 `before_agent_start`가 오지만(`messageType: "custom"`), 그 실행에는 선택을 붙이지 않는다. 아직 사용자 요청이 가져가지 않은 선택은 다음 사용자 요청을 계속 기다린다.
- 같은 스킬을 다시 고르면 한 번만 붙는다. 서로 다른 스킬 여러 개는 선택한 순서대로 한 블록에 붙는다.
- `/workbench status`로 대기 중인 선택을 확인하고 `/workbench cancel [id]`로 하나 또는 전부 취소한다.
- `/reload`, 분기 이동(`/tree`), 새 세션·세션 전환·fork 때 대기 중인 선택은 알림과 함께 취소된다. 다른 분기나 세션의 요청으로 넘어가지 않는다. 분기 이동이 취소되면 유지된다.
- `/skill:이름`이나 프롬프트 템플릿으로 시작하는 요청은 Pi가 직접 펼치므로 앞에 붙이지 않는다. idle 상태에서 보낸 이런 요청에는 그 요청 바로 뒤 메시지로 붙는다("바로 앞 사용자 요청에만 적용").
- **지원하지 않는 경우:** 작업 중 대기열에 넣는 `/skill:`·프롬프트 템플릿 요청에는 붙일 수 없다. Pi가 입력 이벤트 직후 이를 펼쳐 대기열에 넣고, 모델에 전달하기 전에 확장 hook을 다시 부르지 않기 때문이다(요청 문자열을 바꾸면 템플릿 인수나 스킬 명령의 요청이 달라진다). 이때 선택은 알림과 함께 취소되고 이후 요청으로 넘어가지 않는다. 필요하면 작업이 끝난 뒤 다시 선택해 보내거나, 다시 선택한 뒤 일반 문장으로 steering·follow-up을 보낸다.
- idle 요청이 모델 실행 전에 멈추면(예: 모델 없음, 다른 확장이 입력을 처리함) 그 요청이 가져간 선택도 알림과 함께 취소된다: 다음 입력 때, 또는 그보다 먼저 다른 확장의 메시지가 실행을 시작하면 그때(Pi 1.2.0+). 어느 쪽에도 붙지 않고 이후 요청으로 넘어가지 않는다. 스킬을 읽는 중에 들어온 요청은 읽기를 기다린 뒤 그 선택을 받는다.

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
| `/workbench skill ponytail-review` | 다음 사용자 요청 한 번에 원본 스킬과 적용 조건 전달(작업 중 steering·follow-up 포함) |
| `/workbench cancel [id]` | 대기 중인 스킬 선택 취소(id를 빼면 전부) |
| `/workbench status` | 현재 프로필과 대기 중인 스킬 선택 확인 |
| `/workbench doctor` | 패키지 파일과 선택 스킬용 로컬 도구·환경변수 점검, 비정상 항목마다 조치 안내 |
| `/workbench install-deps` | 권한 없이 설치할 수 있는 선택 도구(ast-grep, uv)만 설치하고 나머지는 정확한 수동 조치로 안내 |

Pi 입력창에서 `/workbench ` 뒤에 Tab을 누르면 하위 명령을, `use `·`list `·`skill `·`cancel ` 뒤에서는 `catalog.json`의 프로필(`use`는 `auto`·`off` 포함)·스킬 ID·대기 중인 선택을 입력한 prefix에 맞춰 제안한다(예: `/workbench use co` → `use coding`, `/workbench skill ponytail-r` → `skill ponytail-review`). 후보 목록이 닫힌 상태에서 Tab을 눌러도(Pi의 강제 완성) 같은 후보가 나오며 파일 목록으로 빠지지 않는다. 확장이 세션 시작 때 `ctx.ui.addAutocompleteProvider`로 `/workbench` 인수 위치에만 작용하는 wrapper를 등록하고, 다른 명령·파일 경로·입력 중 자동 제안은 Pi의 기본 동작 그대로다. 후보가 하나면 Tab이 바로 적용하고, 목록이 열린 상태의 Enter는 고른 후보를 적용만 하며 실행은 다음 Enter로 한다. `ponytail`처럼 다른 ID(`ponytail-review`)의 prefix인 ID를 끝까지 입력하면 두 후보가 모두 나오고 Enter는 입력한 ID를 그대로 둔다. 완성은 catalog만 읽고 스킬 본문을 열거나 프로필·세션 상태를 바꾸지 않는다. 이미 완성된 인수 뒤나 인수가 없는 하위 명령 뒤에는 후보를 내지 않는다. print·JSON·RPC 모드에는 입력창 자동완성이 없다.

설치된 Pi의 native skill 명령으로 `/skill:wb-requirements`, `/skill:wb-game`, `/skill:wb-analysis`, `/skill:wb-vision`, `/skill:wb-manufacturing`, `/skill:wb-coding`, `/skill:wb-promo`를 직접 선택할 수도 있다.

`list`·`status`·`doctor`·`install-deps`·도움말의 출력은 세션 기록(custom entry `pi-workbench.command-output`)으로 남긴다. 대화형(TUI)에서는 이 기록이 대화 화면에 표시되어 다음 알림에 덮이지 않고, 세션을 다시 열어도 보인다. 이 기록은 모델 요청과 압축 요약에 들어가지 않는다(Pi는 custom entry를 모델 컨텍스트에서 제외한다). 단, Pi는 사용자·assistant 메시지가 하나도 없는 세션을 파일로 저장하지 않으므로, 명령만 실행한 새 세션의 기록은 첫 대화가 생기기 전에는 디스크에 남지 않는다. 다른 모드(Pi 1.1.0 CLI로 확인): RPC(`--mode rpc`)는 `extension_ui_request`의 `notify` 알림과 `entry_appended` 이벤트를 모두 보내고, JSON 모드(`--mode json`)는 `entry_appended` 이벤트의 `entry.data.text`로만 보낸다. 텍스트 print 모드(`pi -p`)는 확장 알림과 세션 기록을 출력하지 않아 아무것도 보이지 않는다. 짧은 확인(`use`·`skill`·`cancel`)은 알림으로만 보여 준다. TUI 밖에서 `doctor`·`install-deps` 알림은 보고서 수준(info·warning·error)으로 보낸다.

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

### 의존성 점검과 설치 (`doctor`, `install-deps`)

Workbench 자체는 Pi와 Node.js 내장 모듈만 쓰므로 npm 설치가 필요 없다. 아래 도구·환경변수는 프로필별 선택 스킬용이라, 없어도 패키지는 정상 동작하고 항목은 `warn (optional)`로 표시된다. 두 명령은 umbrella 패키지(oh-my-pi-extensions)의 `pi.events` 채널 `oh-my-pi-extensions:dependencies`에도 같은 provider(id `pi-workbench`)로 응답하므로 `/oh-my-pi doctor`·`install-deps`에서 한꺼번에 실행된다.

`/workbench doctor`가 점검하는 항목(읽기 전용, 프로그램을 실행하거나 네트워크에 접속하지 않음):

- 필수: `catalog.json`을 읽을 수 있고 모든 번들 SKILL.md가 패키지 안에 있는지(`bundled catalog and skills`). 깨졌으면 `error`와 재설치(`pi update --extensions`) 또는 git checkout 복원 명령을 안내한다.
- 선택(PATH에 있는지만): `git`, `rg`, `node`, `python3`/`python`(둘 중 하나면 충분), `uv`, `ffmpeg`, `ffprobe`, `blender`, `godot`, `ast-grep`. 없으면 어떤 스킬·프로필에 필요한지와 플랫폼별 설치 명령(Linux: apt/dnf, macOS: brew, Windows: winget 등)을 보여 준다.
- 선택(비어 있지 않은지만, 값은 표시하지 않음): `OPENAI_API_KEY`, `ELEVENLABS_API_KEY`, `SCENARIO_API_KEY`, `CONTEXT7_API_KEY`, `LAYER_API_KEY`. 없으면 Pi를 시작하는 환경에 설정하는 방법과 키 발급 위치를 안내한다.
- 버전·인증·구독·MCP·Python 모듈(NumPy·Pillow·fonttools·brotli·openai·fiftyone)·생성 성공 여부는 검증하지 않으며, 보고서 첫 줄(note)에 Python 모듈을 직접 확인·설치하는 명령을 적는다. 생성 도구가 없으면 브리프·프롬프트·스토리보드·검증 계획까지 작성하고 실제 제작은 미완료로 구분한다.

`/workbench install-deps`가 자동으로 설치하는 것은 권한 없이 확실한 방법이 있는 두 가지뿐이다.

- `ast-grep`: npm이 PATH에 있고 npm 전역 prefix(`npm prefix -g`)에 현재 사용자가 쓸 수 있을 때만 `npm install -g @ast-grep/cli`. prefix에 권한이 필요하면 설치하지 않고 사용자 prefix 설정(`npm config set prefix ~/.npm-global`) 등 수동 조치를 안내한다.
- `uv`: `pipx`가 PATH에 있을 때만 `pipx install uv`.
- 설치 후 다시 찾아 PATH에서 보일 때만 `installed`로 보고한다. 설치는 됐지만 PATH 밖이면 `manual`(PATH 추가 방법), 실패하면 `failed`(오류 마지막 줄과 직접 실행할 명령)다. 이미 있으면 `ok`(already available)라 반복 실행해도 안전하고, 같은 세션에서 겹친 실행은 진행 중인 설치를 공유한다.
- 그 밖의 도구(시스템 패키지·다운로드), API 키, Python 모듈은 설치하지 않고 `manual`과 정확한 명령으로 안내한다. sudo를 실행하지 않고 환경변수·자격 증명·설정 파일을 바꾸지 않는다.

지원 범위: Linux·macOS·Windows에서 PATH 탐색(Windows는 PATHEXT)과 플랫폼별 안내를 제공한다. 자동 설치는 npm·pipx가 있는 환경에서만 시도하며, 실제 설치 동작은 가짜 실행기로만 테스트했다(테스트는 아무것도 내려받지 않는다).

## 검증과 유지보수

```bash
node scripts/check.mjs
node --test tests/runtime.test.mjs tests/dependencies.test.mjs tests/vendor-corrections.test.mjs
```

첫 명령은 구성, 프로필↔스킬 소속의 양방향 일치, 라이선스 포함 여부, 모든 vendor 파일의 Git blob/SHA-256, 별칭 파일, 교정 패치(역적용 시 upstream 원본 digest 재현), 로컬 Markdown 참조를 검사한다. `vendor-corrections.test.mjs`는 교정한 vendor CLI(TAO 누수·전처리 parity, asset_report)를 실제로 실행하고, Vercel 예제를 rules와 컴파일된 `AGENTS.md`에서 추출해 실행하며, DMAIC·8D 문서의 통계값을 입력값에서 다시 계산한다. 교정 전 원본(패치 역적용)으로 같은 오류가 재현되는 음성 대조도 포함한다. Python CLI 검사는 NumPy·Pillow가 있는 `python3`가 필요하며, 없으면 실패한다(`PI_WORKBENCH_SKIP_PYTHON_TESTS=1`이면 건너뜀으로 보고). `runtime.test.mjs`는 상태·명령·인수 자동완성(강제 Tab wrapper 포함)·요청별 프로필 안내·one-shot 선택(다음 사용자 입력 연결, 중복·취소·분기/reload, 대기열 `/skill:`·템플릿 취소, 읽기 중 경합)·명령 출력 기록과 렌더러·호스트 호환·doctor·install-deps 명령과 umbrella 채널 응답을 검증한다. `dependencies.test.mjs`는 의존성 계약(상태·형식), 정상·누락·패키지 손상 점검, 가짜 실행기로 설치 성공·실패·권한 없는 prefix·PATH 밖 설치·반복 실행·겹친 실행을 검사한다.

별도로 설치된 Pi로 실제 리소스 로딩과 세션·입력창 동작을 확인할 수 있다. `pi-session.mjs`는 스크립트 모델(faux)로 연속 요청·분기 전환·reload·auto/off, 다른 확장의 `triggerTurn` 실행 중 steering·follow-up에 붙는 선택, 대기열 `/skill:`·템플릿의 취소, 명령 출력 기록의 재열기에서 모델이 받는 내용을 검사하며 네트워크나 유료 모델을 쓰지 않는다. `pi-editor.mjs`는 Pi 입력창 편집기(pi-tui `Editor`)에 키를 입력해 Tab·Enter 동작을 확인한다(터미널 화면은 그리지 않음).

```bash
PI_WORKBENCH_HOST_MODULE=/path/to/pi/dist/index.js node tests/pi-loader.mjs
PI_WORKBENCH_HOST_MODULE=/path/to/pi/dist/index.js node tests/pi-session.mjs
PI_WORKBENCH_HOST_MODULE=/path/to/pi/dist/index.js node tests/pi-editor.mjs
```

실제 확인 범위와 미검증 항목은 [검증 기록](docs/VALIDATION.md)에 있다. API 비용이 드는 이미지·음악 생성이나 모델 학습을 테스트 과정에서 호출하지 않았다.

원본 버전은 `sources.lock.json`으로 고정한다. 업데이트할 때는 해당 commit과 라이선스·참조를 먼저 검토하고, `python3 scripts/vendor_sources.py`, `python3 scripts/build_catalog.py`, 위 검증을 순서대로 실행한다. 스크립트는 선택한 원본을 다운로드하며 실행하지 않는다. 다운로드한 파일의 Git blob을 확인한 뒤 `sources.json`의 `patches`(검증된 오류 교정, `patches/`의 unified diff)를 오차 없이 엄격 적용하고, 교정 파일은 `vendor-integrity.json`에 배포 digest와 upstream digest를 함께 기록한다. lock을 올려 패치가 맞지 않으면 실패하므로 upstream 수정 여부를 확인해 패치를 다시 만들거나 제거한다. 교정 파일과 그 사유는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md#corrected-upstream-files)에 있다. 제거한 source의 잔여 파일은 무결성 검사에서 검출되므로 검토 후 삭제한다.

## 출처와 라이선스

확장 코드·라우팅 지침은 MIT다. `vendor/`의 원본은 각자의 MIT, Apache-2.0 또는 CC-BY-SA-4.0 조건을 유지한다. 교정한 파일은 `Modified by pi-workbench` 표기와 원래 저작권·라이선스 표기를 함께 유지하며, 교정분은 해당 파일의 라이선스를 따른다. 특히 Trail of Bits 자료를 MIT로 재표시하지 않았다. 전체 목록과 정확한 commit, 재배포하지 않은 참고 후보는 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)에 있다.

공식 호스트 문서: [Pi packages](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/packages.md), [Pi extensions](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md), [Pi skills](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/skills.md).
