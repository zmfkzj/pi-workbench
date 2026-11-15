---
name: wb-manufacturing
description: "제조업 SW 분석. 발생 원인·검출 실패·측정 신뢰성·현장 개선. 불량·고객 클레임·품질 유출(escape), 특정 로트·라인·교대에서만 생기는 문제, 발생 원인과 검출 실패 구분, 5-Why·Is/Is-Not·Fishbone(6M) 원인 분석, 8D·G8D 조사와 고객 8D 보고서, DMAIC·Six Sigma, 게이지 R&R·공정능력·SPC, 검사 장비·센서·SW 문제 (defects, quality escapes, customer complaints, 8D reports, gauge R&R, SPC). Use for the manufacturing workflow; select only relevant bundled skills and their references."
---

# 제조업 SW 분석

Read the manufacturing and comparison sections of docs/WORKFLOWS.ko.md. Separate occurrence from escape and process/sensor/software failures. Verify timestamps, units, calibration and measurement reliability before causal claims. Scale 8D/DMAIC to the task. Use Is/Is-Not, 5-Why and Fishbone as evidence tools rather than mandatory forms, and 8D Report Writing only for a customer-facing report draft.

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
| [Is/Is-Not Scoping](../../vendor/quality-engineering/skills/problem-solving/is-is-not-scoping/SKILL.md) | Is/Is-Not 비교로 문제 범위(제품·로트·라인·시점·위치·정도)를 정하고 맞지 않는 가설을 제거 |
| [5-Why Root Cause](../../vendor/quality-engineering/skills/problem-solving/5why-root-cause/SKILL.md) | 증상에서 계통 원인까지 각 단계를 근거로 검증하는 5-Why 원인 체인과 순환 논리 점검 |
| [Fishbone Analysis](../../vendor/quality-engineering/skills/problem-solving/fishbone-analysis/SKILL.md) | Ishikawa 특성요인도(6M)로 원인 후보를 빠짐없이 분류하고 검증할 후보를 고름 |
| [8D Report Writing](../../vendor/quality-engineering/skills/documentation/8d-report-writing/SKILL.md) | 고객 제출용 8D 보고서(Ford 8D·BMW G8D·VW 등 OEM 양식)의 형식·근거·D0–D8 서술 점검 |
| [DMAIC](../../vendor/quality-engineering/skills/problem-solving/dmaic/SKILL.md) | 측정 체계와 기준선을 확인하고 개선 실험·관리 계획을 수립 |

## Integration notes

- **problem-solving**: 난이도에 맞는 참조만 읽는다. 필수 제약을 먼저 걸러내고 효과·비용·가역성·불확실성을 비교한다.
- **structured-root-cause-research**: 관찰·가정·추론을 구분한다. 5 Why의 단계 수나 단일 원인을 강제하지 않는다.
- **8d-problem-solving**: 현물 격리·고객 통지·승인·현장 검증을 수행한 것처럼 보고하지 않는다. 프로세스·센서·SW 문제를 증거로 분리하고 작업 규모에 맞춰 8D를 축약한다.
- **is-is-not-scoping**: 확인하지 못한 Is/Is-Not 칸은 사실로 채우지 않고 확인할 데이터로 남긴다. 가설은 관찰된 차이를 설명하는지로 판단한다. 검사·측정 장비 가설을 그 장비가 만든 데이터만으로 배제하지 않는다.
- **5why-root-cause**: 각 Why 단계를 데이터·현물·로그 근거로 확인하고, 확인하지 못한 단계는 가설로 표시한다. 다섯 단계나 단일 원인을 강제하지 않는다. 발생 원인과 검출 실패(유출) 원인은 별도 체인으로 분석한다.
- **fishbone-analysis**: Fishbone의 항목은 원인 후보다. 확정 원인으로 보고하지 않고 판별 검증으로 좁힌다. 특정 교대·작업자 패턴은 가설로 다루고, 방법·설비·측정·SW 조건을 같은 기준으로 검토한다.
- **8d-report-writing**: 확인되지 않은 격리·검증·승인·고객 통지를 완료형으로 쓰지 않고, 근거가 없는 항목은 확인 필요로 표시한다. 보고서 초안과 점검까지만 한다. 고객 포털 제출·서명·통지는 사용자가 직접 수행한다. 원문의 OEM 양식 요건은 예시다. 실제 고객의 현행 양식과 필수 항목을 우선한다.
- **dmaic**: Cpk·GRR·표본 수·기간의 예시 기준을 일반 SW에 그대로 적용하지 않는다. 측정 불확실성과 공정 조건을 먼저 검증한다.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use manufacturing` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
