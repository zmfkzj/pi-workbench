---
name: wb-coding
description: "코딩·리뷰·검증. Ponytail 중심의 재사용·문서 조회·UI·구조 검색·테스트. Use for the coding workflow; select only relevant bundled skills and their references."
---

# 코딩·리뷰·검증

Read the coding section of docs/WORKFLOWS.ko.md. Default to Ponytail full and lightweight ECC search-first. Read current callers and tests, honor the existing stack, make the smallest complete change, and verify concrete risks. Load specialized skills only when relevant.

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
| [Vercel React Best Practices](../../vendor/vercel/skills/react-best-practices/SKILL.md) | React·Next.js의 성능·데이터 로딩·렌더링 패턴 검토 |
| [ast-grep](../../vendor/ast-grep/ast-grep/skills/ast-grep/SKILL.md) | 구문 트리 패턴으로 코드 구조를 검색·검증 |
| [ast-grep Outline](../../vendor/ast-grep/ast-grep/skills/outline/SKILL.md) | 큰 파일의 구조를 압축해서 살피고 필요한 코드만 선택 |
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
- **vercel-react-best-practices**: React/Next.js 프로젝트에만 적용한다. 실제 버전·측정 결과·현재 패턴과 맞는 규칙을 선택한다.
- **ast-grep**: 타입 분석·호출 그래프를 제공한다고 가정하지 않는다. 제안한 구조 규칙을 작은 예제에서 확인한다.
  Required when executing: ast-grep CLI.
- **ast-grep-outline**: 설치된 CLI의 outline 지원을 먼저 확인한다. 미지원이면 기존 검색·읽기로 진행한다.
  Required when executing: outline 명령을 지원하는 ast-grep CLI.
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **verification-before-completion**: 의미 있는 검증을 선택하고 결과의 실행 여부를 구분한다. 사소한 변경마다 전체 테스트를 강제하지 않는다.
- **property-based-testing**: 원본은 CC-BY-SA-4.0이며 이 번들의 MIT 코드와 별도다. 불변식이 실질적인 위험을 줄이는 경우 선택한다. 기존 테스트 도구를 존중한다.
  Required when executing: 대상 언어의 속성 기반 테스트 라이브러리 (예: Hypothesis, fast-check).

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use coding` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
