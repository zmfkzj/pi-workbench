---
name: wb-game
description: "게임 제작·분석. 레퍼런스 판단, 게임 설계·밸런스·에셋·VFX·사운드·UI. Use for the game workflow; select only relevant bundled skills and their references."
---

# 게임 제작·분석

Read the game section of docs/WORKFLOWS.ko.md and applicable adapter notes. Inspect relevant references and explain what to adopt/avoid. Use the current engine. Validate representative assets at native scale and effects/audio in motion or playback. For implementation start with Ponytail full.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Game Design](../../vendor/game-design/skills/productivity/game-design/SKILL.md) | 게임 루프·시스템·UX·밸런스 방향을 비평하고 대안을 설계 |
| [Problem Solving](../../vendor/problem-solving/skills/problem-solving/SKILL.md) | 문제 정의, 근거 수집, 원인과 해결책·대안 비교 |
| [Create Game Assets](../../vendor/gamedev/skills/disciplines/create-game-assets/SKILL.md) | 아트 방향부터 대표 에셋·일관된 묶음·엔진 import와 시각 검수 |
| [Game Feel](../../vendor/gamedev/skills/disciplines/game-feel/SKILL.md) | 히트스톱·카메라·타격·전환·소리 피드백 설계 및 튜닝 |
| [Game UI/UX](../../vendor/gamedev/skills/disciplines/game-ui-ux/SKILL.md) | HUD·메뉴·입력 탐색·가독성·접근성·반응형 게임 UI |
| [Fire & Smoke VFX](../../vendor/vfx/agent-skills/game-combat/fire-smoke-skill-vfx/SKILL.md) | 화염·연기·열왜곡·블룸의 구현 모듈·데모·품질 기준 |
| [OpenAI Image Generation](../../vendor/codex-imagegen/codex-rs/skills/src/assets/samples/imagegen/SKILL.md) | 컨셉·스프라이트·텍스처·홍보 스틸컷·배너 제작 |
| [ElevenLabs Sound Effects](../../vendor/elevenlabs/sound-effects/SKILL.md) | 타격음·환경음·UI 음향·루프 SFX 제작 |
| [ElevenLabs Music](../../vendor/elevenlabs/music/SKILL.md) | 게임 BGM·루프·구간별 구성·홍보 음악 제작 |
| [Anthropic Frontend Design](../../vendor/anthropic-skills/skills/frontend-design/SKILL.md) | 분명한 미술 방향과 타이포·레이아웃·인터랙션을 갖춘 웹 UI |
| [UI UX Pro Max](../../vendor/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/SKILL.md) | 로컬 디자인 데이터에서 스타일·색상·폰트·UX 가이드를 검색 |
| [Ponytail 5 — Full](../../vendor/ponytail/skills/ponytail/SKILL.md) | 기존 패턴·플랫폼·의존성을 활용해 가장 작은 완결된 코드 변경 |
| [ECC Search First](../../vendor/ecc/skills/search-first/SKILL.md) | 기존 코드·표준 기능·설치된 패키지·오픈소스를 먼저 조사 |

## Integration notes

- **game-design**: Claude 전용 wire/hook 설정은 Pi에 적용하지 않는다. 저자의 디자인 선호를 보편 법칙으로 취급하지 않는다. 최신 게임 레퍼런스는 별도 검색·열람이 필요하다.
- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **create-game-assets**: 레퍼런스 출처와 사용 권리, 생성/수정 이력을 기록한다. 실제 표시 크기와 엔진 화면으로 검수한다.
  Required when executing: 이미지·3D 생성 도구는 별도 연결; 래스터 검수 스크립트: Python 3.10+, Pillow.
- **game-feel**: 실제 엔진의 프레임·물리·입력 특성을 따른다. 정지 이미지로 움직임 품질을 검증했다고 하지 않는다.
  Required when executing: 대상 게임 엔진과 플레이·화면 캡처 환경.
- **game-ui-ux**: 해상도·안전 영역·패드/키보드 입력을 실제 런타임에서 확인한다.
  Required when executing: 대상 엔진 또는 UI 런타임.
- **fire-smoke-skill-vfx**: Three.js r170/WebGL2/GLSL에 특화됐다. Unity·Godot·Unreal에는 구현을 그대로 복사하지 않는다.
  Required when executing: Three.js·WebGL2 런타임 (적합한 프로젝트에서만).
- **imagegen**: Pi에는 Codex image_gen이 자동으로 생기지 않는다. 사용자가 연결한 생성 도구 또는 선택한 API 경로만 쓴다. 미설정이면 브리프·프롬프트를 완성하고 실제 생성 여부를 명확히 표시한다. 임의 API 비용을 발생시키지 않는다.
  Required when executing: 호스트의 이미지 생성 도구 또는 Python openai SDK·OPENAI_API_KEY (API 경로 선택 시).
- **sound-effects**: 스킬의 shell 설치 예제를 자동 실행하지 않는다. 가능하면 이미 설치한 CLI/SDK를 이용한다. 파형·파일 생성만으로 청취 검수를 대체하지 않는다.
  Required when executing: ElevenLabs CLI/SDK·인증·사용 가능한 계정 한도.
- **music**: 서비스 플랜·권리 조건과 프로젝트 예산을 확인한다. 사용 가능한 인증을 선택하며 비밀값을 출력하지 않는다.
  Required when executing: ElevenLabs 음악 기능이 가능한 계정·CLI/SDK·인증.
- **frontend-design**: 실제 UI 런타임·기존 디자인 시스템·접근성을 우선한다. 시각 검수가 없으면 미검증으로 보고한다.
  Required when executing: 대상 프런트엔드 런타임·가능하면 브라우저 캡처.
- **ui-ux-pro-max**: CLAUDE_PLUGIN_ROOT가 있다고 가정하지 않는다. 이 스킬의 Base directory/scripts/search.py를 실행한다. 로컬 CSV 검색은 최신 외부 레퍼런스 조사를 대신하지 않는다.
  Required when executing: Python 3 (검색 스크립트는 표준 라이브러리).
- **ponytail**: full을 기본으로 한다. 기존 동작·검증·접근성·보안·사용자 요구를 보존한다. 활성 범위는 Workbench 프로필 또는 명시한 다음 요청이다. 원문의 세션 지속 규칙이 선택 범위를 확장하지 않는다.
- **search-first**: 현재 호스트에 실제로 있는 검색·서브에이전트 도구와 경로만 사용한다. 작은 변경에는 가벼운 검색만 한다. 패키지 채택 시 유지보수·라이선스·추가 의존성을 함께 판단한다.
  Required when executing: 최신 외부 조사에는 웹/문서 검색 수단·네트워크.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use game` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
