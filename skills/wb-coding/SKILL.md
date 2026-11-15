---
name: wb-coding
description: "코딩·리뷰·검증. Ponytail 중심의 재사용·문서 조회·웹 플랫폼·UI·구조 검색·다이어그램·테스트. 코드 구현·수정·리팩터링·버그 수정·코드 리뷰, 라이브러리 문서와 버전 확인, React·Next.js, 라이브러리 없이 표준 HTML·CSS·브라우저 API로 구현하는 방법과 접근성, Chrome 확장(Manifest V3), 구문 기반 코드 검색·대량 변경, 아키텍처 다이어그램, property-based 테스트와 완료 전 검증 (implementation, code review, library docs, current web platform how-to questions, Chrome extensions, structural search, diagrams, tests). Use for the coding workflow; select only relevant bundled skills and their references."
---

# 코딩·리뷰·검증

Read the coding section of docs/WORKFLOWS.ko.md. Default to Ponytail full and lightweight ECC search-first. Read current callers and tests, honor the existing stack, make the smallest complete change, and verify concrete risks. Load specialized skills only when relevant: Modern Web Guidance for HTML/CSS/client-side JS, Chrome Extensions for Manifest V3 extensions, Archify for requested architecture or flow diagrams.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Ponytail 5 — Full](../../vendor/ponytail/skills/ponytail/SKILL.md) | 기존 패턴·플랫폼·의존성을 활용해 가장 작은 완결된 코드 변경 |
| [ECC Search First](../../vendor/ecc/skills/search-first/SKILL.md) | 기존 코드·표준 기능·설치된 패키지·오픈소스를 먼저 조사 |
| [Context7 Find Docs](../../vendor/context7/skills/find-docs/SKILL.md) | 사용 중인 라이브러리와 버전에 맞는 문서·예제를 조회 |
| [Ponytail Review](../../vendor/ponytail/skills/ponytail-review/SKILL.md) | 코드 변경 없이 불필요한 복잡성·간소화 가능성과 위험을 리뷰 |
| [Anthropic Frontend Design](../../vendor/anthropic-skills/skills/frontend-design/SKILL.md) | 분명한 미술 방향과 타이포·레이아웃·인터랙션을 갖춘 웹 UI |
| [UI UX Pro Max](../../vendor/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/SKILL.md) | 로컬 디자인 데이터에서 스타일·색상·폰트·UX 가이드를 검색 |
| [Modern Web Guidance](../../vendor/modern-web-guidance/skills/modern-web-guidance/SKILL.md) | HTML·CSS·클라이언트 JS 작업 전에 최신 웹 플랫폼 패턴·접근성·성능·보안 가이드와 Baseline 대체 전략을 조회 |
| [Chrome Extensions](../../vendor/modern-web-guidance/skills/chrome-extensions/SKILL.md) | Manifest V3 확장 프로그램 구현·디버깅과 Chrome Web Store 게시 준비(권한 사유·개인정보처리방침·심사 대응) |
| [Vercel React Best Practices](../../vendor/vercel/skills/react-best-practices/SKILL.md) | React·Next.js의 성능·데이터 로딩·렌더링 패턴 검토 |
| [ast-grep](../../vendor/ast-grep/ast-grep/skills/ast-grep/SKILL.md) | 구문 트리 패턴으로 코드 구조를 검색·검증 |
| [ast-grep Outline](../../vendor/ast-grep/ast-grep/skills/outline/SKILL.md) | 큰 파일의 구조를 압축해서 살피고 필요한 코드만 선택 |
| [Archify](../../vendor/archify/archify/SKILL.md) | 저장소 근거·요구사항·Mermaid로 아키텍처·워크플로·시퀀스·데이터 흐름·상태·ERD·클래스·트리·타임라인·워터폴 다이어그램과 한 페이지 설명서를 검증된 단독 HTML로 생성 |
| [Structured Root Cause Research](../../vendor/root-cause/SKILL.md) | 증거와 반증 가능한 경쟁 가설로 재발·간헐 문제를 진단 |
| [Superpowers Verification Before Completion](../../vendor/superpowers/skills/verification-before-completion/SKILL.md) | 완료·수정 성공 주장에 대응하는 실제 검증 근거 확인 |
| [Trail of Bits Property-Based Testing](../../vendor/property-testing/plugins/property-based-testing/skills/property-based-testing/SKILL.md) | 좌표 변환·파서·직렬화·경계 조건의 불변식과 반례를 검사 |

## Integration notes

- **ponytail**: full을 기본으로 한다. 기존 동작·검증·접근성·보안·사용자 요구를 보존한다. 활성 범위는 Workbench 프로필 또는 명시한 다음 요청이다. 원문의 세션 지속 규칙이 선택 범위를 확장하지 않는다.
- **search-first**: 현재 호스트에 실제로 있는 검색·서브에이전트 도구와 경로만 사용한다. 작은 변경에는 가벼운 검색만 한다. 패키지 채택 시 유지보수·라이선스·추가 의존성을 함께 판단한다.
  Required when executing: 최신 외부 조사에는 웹/문서 검색 수단·네트워크.
- **find-docs**: Pi 전용 Context7 도구를 자동 제공하지 않는다. 실제 사용 가능한 MCP 또는 CLI 경로를 이용한다. 이미 설치한 CLI를 우선한다. 네트워크 조회 실패를 성공처럼 보고하지 않는다.
  Required when executing: Context7 MCP 또는 ctx7 CLI/Node·네트워크; 인증은 구성에 따라 필요.
- **ponytail-review**: 사용자가 요구한 언어로 보고한다. 리뷰 요청을 코드 수정 권한으로 해석하지 않는다.
- **frontend-design**: 실제 UI 런타임·기존 디자인 시스템·접근성을 우선한다. 시각 검수가 없으면 미검증으로 보고한다.
  Required when executing: 대상 프런트엔드 런타임·가능하면 브라우저 캡처.
- **ui-ux-pro-max**: CLAUDE_PLUGIN_ROOT가 있다고 가정하지 않는다. 이 스킬의 Base directory/scripts/search.py를 실행한다. 로컬 CSV 검색은 최신 외부 레퍼런스 조사를 대신하지 않는다.
  Required when executing: Python 3 (검색 스크립트는 표준 라이브러리).
- **modern-web-guidance**: 원문 경로는 `npx -y modern-web-guidance@latest search`/`retrieve`다. 실행 때 npm 레지스트리에서 최신 CLI를 받아 실행하므로 네트워크·Node 22+·호스트 권한이 필요하고, 결과가 번들 사본(1.0.0)보다 새로울 수 있다. CLI는 기본으로 검색어·가이드 ID·에이전트 이름을 Google에 텔레메트리로 보내므로 사용자가 허용하지 않았다면 `DISABLE_TELEMETRY=1`로 실행한다. CLI를 쓸 수 없으면 이 스킬 디렉터리의 `guides/<분류>/<id>.md`(잠긴 commit의 원문, npm 1.0.0과 동일)를 파일명·제목으로 찾아 읽고, 원본 README(`../../README.md`)의 가이드 목록을 색인으로 쓴다. 이 경우 CLI 검색·조회를 실행했다고 쓰지 않고 번들 버전임을 밝힌다. CLI가 Origin Trial·volatile 기능 가이드에 거는 `.mwgrc` 동의 게이트를 로컬 파일 열람으로 우회하지 않는다(해당 가이드 목록은 docs/ADAPTERS.md). `install`·`legacy-scan`·`set-allow-*`·`set-baseline`(.mwgrc 작성)과 AGENTS.md·CLAUDE.md 정책 추가는 사용자가 요청할 때만 한다.
  Required when executing: CLI 경로: Node 22+·npx 또는 pnpx·npm 레지스트리 네트워크; 번들 가이드 열람은 추가 도구 불필요.
- **chrome-extensions**: Chrome 확장 작업에만 적용한다. 압축 해제 확장으로 실제 Chrome에 로드해 확인하지 않았다면 동작을 미검증으로 보고한다. Web Store 제출·게시·심사 답변 발송과 OAuth 클라이언트 변경은 사용자가 요청할 때만 한다. 개인정보처리방침·권한 사유는 실제 데이터 처리와 대조한 초안으로 제공한다. 원문이 일반 Prompt API 패턴을 맡기는 `modern-web-guidance` 스킬은 이 패키지의 vendor/modern-web-guidance/skills/modern-web-guidance/SKILL.md다.
  Required when executing: 확장 로드·검증: Chrome 또는 Chromium.
- **vercel-react-best-practices**: React/Next.js 프로젝트에만 적용한다. 실제 버전·측정 결과·현재 패턴과 맞는 규칙을 선택한다.
- **ast-grep**: 타입 분석·호출 그래프를 제공한다고 가정하지 않는다. 제안한 구조 규칙을 작은 예제에서 확인한다.
  Required when executing: ast-grep CLI.
- **ast-grep-outline**: 설치된 CLI의 outline 지원을 먼저 확인한다. 미지원이면 기존 검색·읽기로 진행한다.
  Required when executing: outline 명령을 지원하는 ast-grep CLI.
- **archify**: 명령의 `bin/archify.mjs`는 이 스킬 디렉터리의 절대 경로로 바꿔 작업 디렉터리에서 실행한다(npm install 불필요). 산출물(`.archify/...`)은 사용자 프로젝트나 지정 위치에 두고 패키지 디렉터리에 쓰지 않는다. `finalize`의 browser-check는 실제 Chrome/Chromium(`ARCHIFY_CHROME` 또는 PATH의 google-chrome·chromium·chromium-browser)이 있어야 통과한다. 0이 아닌 종료는 실패로 보고하고 자동 검사 통과와 캡처·실제 시각 검토를 구분한다. `ARCHIFY_CHROME`가 이미 설정돼 있으면 그 값을 바꾸거나 다른 브라우저로 덮어쓰지 않는다. 설정이 없고 browser-check 오류가 `/snap/bin/chromium` 실행에서 임시 프로필(SingletonLock Permission denied)이나 페이지(ERR_FILE_NOT_FOUND)를 열지 못한 경우에만 snap 제한(비공개 /tmp와 홈의 숨김이 아닌 파일만 보임) 때문이므로, `mkdir -p "$HOME/snap/chromium/common/archify-tmp"` 뒤 같은 명령 앞에 `TMPDIR="$HOME/snap/chromium/common/archify-tmp"`를 붙여 한 번 다시 실행한다. 이 조건은 `/workbench doctor`가 점검한다. `ARCHIFY_CHROME_NO_SANDBOX=1`(브라우저 sandbox 해제)은 사용자가 명시적으로 원할 때만 쓴다. finalize·deliver는 GitHub Pages의 업데이트 매니페스트를 조회한다(`ARCHIFY_UPDATE_CHECK_DISABLED=1`로 끔). 번들 사본은 sources.lock.json의 commit에 고정되어 있으므로 업데이트 알림이 와도 skills CLI로 설치·갱신하지 않고 Workbench 원본 갱신 대상으로만 알린다. 원문의 explainer 모드 제안과 전역 규칙 파일(~/.claude/CLAUDE.md 등) 수정은 하지 않는다. 사용자가 명시적으로 원할 때만 Pi가 읽는 AGENTS.md 위치를 확인해 그 줄을 넣는다. 브랜드 마크는 요청된 것만 쓰고 개별 라이선스·상표 조건을 따른다.
  Required when executing: Node 18+ (번들 CLI); finalize·browser-check: Chrome·Chromium·Edge(`ARCHIFY_CHROME` 또는 Archify 탐색 위치; snap 브라우저는 홈 아래 TMPDIR); 업데이트 확인: 네트워크(선택).
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **verification-before-completion**: 의미 있는 검증을 선택하고 결과의 실행 여부를 구분한다. 사소한 변경마다 전체 테스트를 강제하지 않는다.
- **property-based-testing**: 원본은 CC-BY-SA-4.0이며 이 번들의 MIT 코드와 별도다. 불변식이 실질적인 위험을 줄이는 경우 선택한다. 기존 테스트 도구를 존중한다.
  Required when executing: 대상 언어의 속성 기반 테스트 라이브러리 (예: Hypothesis, fast-check).

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use coding` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
