---
name: wb-requirements
description: "요구사항 도출. 사용자의 목적에서 기능·비기능 요구사항과 수용 기준을 만든다. Use for the requirements workflow; select only relevant bundled skills and their references."
---

# 요구사항 도출

Read the requirements section of docs/WORKFLOWS.ko.md. Elicit user outcomes, functional and nonfunctional requirements, sources, conflicts and acceptance criteria. Unknown metrics remain TBD; do not choose a technology stack unless asked.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Requirements Elicitation](../../vendor/requirements/skills/by-role/business-analyst/requirements-elicitation/SKILL.md) | 사용자 목적에서 기능·비기능 요구사항, 충돌, 수용 기준을 도출 |
| [Problem Solving](../../vendor/problem-solving/skills/problem-solving/SKILL.md) | 문제 정의, 근거 수집, 원인과 해결책·대안 비교 |
| [ECC Search First](../../vendor/ecc/skills/search-first/SKILL.md) | 기존 코드·표준 기능·설치된 패키지·오픈소스를 먼저 조사 |

## Integration notes

- **requirements-elicitation**: 기술 스택 선정은 별도 요청일 때만 한다. NFR 목표값은 출처가 없으면 TBD로 둔다. 원문의 최소 3개 기법·24시간·워크숍 절차는 작업 규모와 이미 받은 정보에 맞춘다.
- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **search-first**: 현재 호스트에 실제로 있는 검색·서브에이전트 도구와 경로만 사용한다. 작은 변경에는 가벼운 검색만 한다. 패키지 채택 시 유지보수·라이선스·추가 의존성을 함께 판단한다.
  Required when executing: 최신 외부 조사에는 웹/문서 검색 수단·네트워크.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use requirements` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
