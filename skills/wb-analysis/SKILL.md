---
name: wb-analysis
description: "원인·솔루션·대안 비교. 경쟁 가설·판별 검증·해결책·추천이 바뀌는 조건. Use for the analysis workflow; select only relevant bundled skills and their references."
---

# 원인·솔루션·대안 비교

Read the analysis and comparison sections of docs/WORKFLOWS.ko.md. Separate facts, hypotheses and conclusions. Seek a discriminating check, compare distinct interventions after hard constraints, and state evidence gaps and conditions that change the recommendation.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Problem Solving](../../vendor/problem-solving/skills/problem-solving/SKILL.md) | 문제 정의, 근거 수집, 원인과 해결책·대안 비교 |
| [Structured Root Cause Research](../../vendor/root-cause/SKILL.md) | 증거와 반증 가능한 경쟁 가설로 재발·간헐 문제를 진단 |
| [Game Design](../../vendor/game-design/skills/productivity/game-design/SKILL.md) | 게임 루프·시스템·UX·밸런스 방향을 비평하고 대안을 설계 |
| [NVIDIA TAO Recipe Transfer](../../vendor/tao/skills/applications/tao-validate-recipe-transfer/SKILL.md) | 비전 모델의 데이터·전처리·학습·평가·배포 차이를 진단 |
| [8D Problem Solving](../../vendor/quality-engineering/skills/problem-solving/8d-problem-solving/SKILL.md) | 제조 문제의 발생 원인·검출 실패·임시 조치·영구 조치를 분리 |
| [Superpowers Verification Before Completion](../../vendor/superpowers/skills/verification-before-completion/SKILL.md) | 완료·수정 성공 주장에 대응하는 실제 검증 근거 확인 |

## Integration notes

- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **game-design**: Claude 전용 wire/hook 설정은 Pi에 적용하지 않는다. 저자의 디자인 선호를 보편 법칙으로 취급하지 않는다. 최신 게임 레퍼런스는 별도 검색·열람이 필요하다.
- **tao-validate-recipe-transfer**: 고정 정확도 차이·표본 수·한 배치 과적합 기준을 모든 모델의 합격선으로 적용하지 않는다. 분석만 요청했다면 학습·GPU 작업을 자동 시작하지 않는다.
  Required when executing: 진단 스크립트: Python 3, NumPy, Pillow; 실제 모델 실행: 대상 프로젝트의 프레임워크·모델·데이터·연산 환경.
- **8d-problem-solving**: 현물 격리·고객 통지·승인·현장 검증을 수행한 것처럼 보고하지 않는다. 프로세스·센서·SW 문제를 증거로 분리하고 작업 규모에 맞춰 8D를 축약한다.
- **verification-before-completion**: 의미 있는 검증을 선택하고 결과의 실행 여부를 구분한다. 사소한 변경마다 전체 테스트를 강제하지 않는다.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use analysis` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
