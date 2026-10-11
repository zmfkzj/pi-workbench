---
name: wb-manufacturing
description: "제조업 SW 분석. 발생 원인·검출 실패·측정 신뢰성·현장 개선. Use for the manufacturing workflow; select only relevant bundled skills and their references."
---

# 제조업 SW 분석

Read the manufacturing and comparison sections of docs/WORKFLOWS.ko.md. Separate occurrence from escape and process/sensor/software failures. Verify timestamps, units, calibration and measurement reliability before causal claims. Scale 8D/DMAIC to the task.

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
| [8D Problem Solving](../../vendor/quality-engineering/skills/problem-solving/8d-problem-solving/SKILL.md) | 제조 문제의 발생 원인·검출 실패·임시 조치·영구 조치를 분리 |
| [DMAIC](../../vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md) | 측정 체계와 기준선을 확인하고 개선 실험·관리 계획을 수립 |

## Integration notes

- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **8d-problem-solving**: 현물 격리·고객 통지·승인·현장 검증을 수행한 것처럼 보고하지 않는다. 프로세스·센서·SW 문제를 증거로 분리하고 작업 규모에 맞춰 8D를 축약한다.
- **dmaic**: Cpk·GRR·표본 수·기간의 예시 기준을 일반 SW에 그대로 적용하지 않는다. 측정 불확실성과 공정 조건을 먼저 검증한다.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use manufacturing` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
