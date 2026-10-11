---
name: wb-vision
description: "비전 AI 분석. 데이터·라벨·모델·평가·배포를 잇는 진단과 비교. Use for the vision workflow; select only relevant bundled skills and their references."
---

# 비전 AI 분석

Read the vision and comparison sections of docs/WORKFLOWS.ko.md. Check capture, labels, split leakage, preprocessing, model, threshold and deployment parity. Compare FP/FN slices on locked evaluation data under equal conditions before recommending retraining.

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
| [NVIDIA TAO Recipe Transfer](../../vendor/tao/skills/applications/tao-validate-recipe-transfer/SKILL.md) | 비전 모델의 데이터·전처리·학습·평가·배포 차이를 진단 |
| [FiftyOne Model Evaluation](../../vendor/fiftyone/skills/fiftyone-model-evaluation/SKILL.md) | FP/FN·오류 구간과 모델 간 차이를 실제 데이터에서 확인 |
| [Context7 Find Docs](../../vendor/context7/skills/find-docs/SKILL.md) | 사용 중인 라이브러리와 버전에 맞는 문서·예제를 조회 |
| [Trail of Bits Property-Based Testing](../../vendor/property-testing/plugins/property-based-testing/skills/property-based-testing/SKILL.md) | 좌표 변환·파서·직렬화·경계 조건의 불변식과 반례를 검사 |

## Integration notes

- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **tao-validate-recipe-transfer**: 고정 정확도 차이·표본 수·한 배치 과적합 기준을 모든 모델의 합격선으로 적용하지 않는다. 분석만 요청했다면 학습·GPU 작업을 자동 시작하지 않는다.
  Required when executing: 진단 스크립트: Python 3, NumPy, Pillow; 실제 모델 실행: 대상 프로젝트의 프레임워크·모델·데이터·연산 환경.
- **fiftyone-model-evaluation**: GT·prediction 필드와 평가 조건을 확인한다. 오류 상관관계만으로 원인을 확정하지 않는다. MCP/plugin 설치 및 앱 시작·종료를 확장 설치 단계에서 실행하지 않는다.
  Required when executing: FiftyOne SDK와 데이터셋 또는 사용 가능한 FiftyOne MCP/evaluation 플러그인.
- **find-docs**: Pi 전용 Context7 도구를 자동 제공하지 않는다. 실제 사용 가능한 MCP 또는 CLI 경로를 이용한다. 이미 설치한 CLI를 우선한다. 네트워크 조회 실패를 성공처럼 보고하지 않는다.
  Required when executing: Context7 MCP 또는 ctx7 CLI/Node·네트워크; 인증은 구성에 따라 필요.
- **property-based-testing**: 원본은 CC-BY-SA-4.0이며 이 번들의 MIT 코드와 별도다. 불변식이 실질적인 위험을 줄이는 경우 선택한다. 기존 테스트 도구를 존중한다.
  Required when executing: 대상 언어의 속성 기반 테스트 라이브러리 (예: Hypothesis, fast-check).

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use vision` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
