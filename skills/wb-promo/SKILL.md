---
name: wb-promo
description: "홍보 스틸·배너·영상. 실제 게임의 장점을 전달하는 이미지·음향·영상 제작. Use for the promo workflow; select only relevant bundled skills and their references."
---

# 홍보 스틸·배너·영상

Read the promo section of docs/WORKFLOWS.ko.md and provider adapters. Establish audience, channel, dimensions, safe areas, message and rights. Use actual gameplay for gameplay claims. Render, inspect and listen when tools exist; clearly label brief-only or unverified outputs.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Create Game Assets](../../vendor/gamedev/skills/disciplines/create-game-assets/SKILL.md) | 아트 방향부터 대표 에셋·일관된 묶음·엔진 import와 시각 검수 |
| [OpenAI Image Generation](../../vendor/codex-imagegen/codex-rs/skills/src/assets/samples/imagegen/SKILL.md) | 컨셉·스프라이트·텍스처·홍보 스틸컷·배너 제작 |
| [Anthropic Frontend Design](../../vendor/anthropic-skills/skills/frontend-design/SKILL.md) | 분명한 미술 방향과 타이포·레이아웃·인터랙션을 갖춘 웹 UI |
| [UI UX Pro Max](../../vendor/ui-ux-pro-max/.claude/skills/ui-ux-pro-max/SKILL.md) | 로컬 디자인 데이터에서 스타일·색상·폰트·UX 가이드를 검색 |
| [ElevenLabs Sound Effects](../../vendor/elevenlabs/sound-effects/SKILL.md) | 타격음·환경음·UI 음향·루프 SFX 제작 |
| [ElevenLabs Music](../../vendor/elevenlabs/music/SKILL.md) | 게임 BGM·루프·구간별 구성·홍보 음악 제작 |
| [Video Director](../../vendor/video-director/video-director/SKILL.md) | 게임 footage를 트레일러·가로/세로 홍보 영상으로 편집·렌더링 |

## Integration notes

- **create-game-assets**: 레퍼런스 출처와 사용 권리, 생성/수정 이력을 기록한다. 실제 표시 크기와 엔진 화면으로 검수한다.
  Required when executing: 이미지·3D 생성 도구는 별도 연결; 래스터 검수 스크립트: Python 3.10+, Pillow.
- **imagegen**: Pi에는 Codex image_gen이 자동으로 생기지 않는다. 사용자가 연결한 생성 도구 또는 선택한 API 경로만 쓴다. 미설정이면 브리프·프롬프트를 완성하고 실제 생성 여부를 명확히 표시한다. 임의 API 비용을 발생시키지 않는다.
  Required when executing: 호스트의 이미지 생성 도구 또는 Python openai SDK·OPENAI_API_KEY (API 경로 선택 시).
- **frontend-design**: 실제 UI 런타임·기존 디자인 시스템·접근성을 우선한다. 시각 검수가 없으면 미검증으로 보고한다.
  Required when executing: 대상 프런트엔드 런타임·가능하면 브라우저 캡처.
- **ui-ux-pro-max**: CLAUDE_PLUGIN_ROOT가 있다고 가정하지 않는다. 이 스킬의 Base directory/scripts/search.py를 실행한다. 로컬 CSV 검색은 최신 외부 레퍼런스 조사를 대신하지 않는다.
  Required when executing: Python 3 (검색 스크립트는 표준 라이브러리).
- **sound-effects**: 스킬의 shell 설치 예제를 자동 실행하지 않는다. 가능하면 이미 설치한 CLI/SDK를 이용한다. 파형·파일 생성만으로 청취 검수를 대체하지 않는다.
  Required when executing: ElevenLabs CLI/SDK·인증·사용 가능한 계정 한도.
- **music**: 서비스 플랜·권리 조건과 프로젝트 예산을 확인한다. 사용 가능한 인증을 선택하며 비밀값을 출력하지 않는다.
  Required when executing: ElevenLabs 음악 기능이 가능한 계정·CLI/SDK·인증.
- **video-director**: 실제 영상 소스의 편집·렌더링 워크플로다. 텍스트만으로 영상 생성 모델이 연결되는 것은 아니다. HyperFrames 및 관련 스킬을 자동 설치하지 않는다. 예제 미디어는 번들에 포함하지 않는다.
  Required when executing: Node 22+, FFmpeg/ffprobe; Python: numpy, fonttools, brotli; HyperFrames와 해당 제작·렌더링 환경 (별도 설정).

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use promo` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
