---
name: wb-research
description: "연구·학술. 가설·문헌·실험 설계·통계·논문 작성·인용 검증·심사 대응과 280개 분야별 연구 스킬. Use for the research workflow; select only relevant bundled skills and their references."
---

# 연구·학술

Read the research section of docs/WORKFLOWS.ko.md. Start from the listed workflow skills; for domain tools (biology, chemistry, medicine, physics, ML and more) choose specialists from the Research Agent Skills index (references/catalog.md) and read vendor/research-agent-skills/skills/<name>/SKILL.md in this package, the sibling directories of the index. Tie claims and citations to checked sources, separate executed analyses from plans, and start no autonomous loop, paid API, upload or submission unless asked.

## Start here

1. Read the applicable sections of [workflow guidance](../../docs/WORKFLOWS.ko.md) and [Pi adapters](../../docs/ADAPTERS.md).
2. Choose only the skills needed for this request from the table below; do not read every skill.
3. Read the original skill from its linked path. Resolve its scripts and references relative to that original file, not this routing skill or the project directory.
4. Apply the integration notes below and the user's scope. Existing authorization and the user's language take precedence over upstream generic process examples.
5. Report what was actually researched, changed, generated and verified. A missing provider does not become an available tool by reading a skill.

## Available skills

| Skill | Use |
|---|---|
| [Research Agent Skills Index](../../vendor/research-agent-skills/skills/research-agent-skills/SKILL.md) | 280개 전문 연구 스킬 색인에서 분야·산출물에 맞는 최소 스킬 조합을 선택 |
| [Hypothesis Generation](../../vendor/research-agent-skills/skills/hypothesis-generation/SKILL.md) | 관찰에서 검증 가능한 가설·경쟁 설명·판별 예측·사전등록 계획을 도출 |
| [Scientific Brainstorming](../../vendor/research-agent-skills/skills/scientific-brainstorming/SKILL.md) | 가정·평가 기준·반론을 드러내는 연구 아이디어 발상과 우선순위 결정 |
| [Scientific Critical Thinking](../../vendor/research-agent-skills/skills/scientific-critical-thinking/SKILL.md) | 연구 주장과 근거 품질, 편향·교란·근거 등급(GRADE 등) 평가 |
| [Literature Review](../../vendor/research-agent-skills/skills/literature-review/SKILL.md) | PubMed·arXiv 등 검색, 선별, 종합, 인용 검증을 거친 체계적·범위 문헌고찰 |
| [Paper Lookup](../../vendor/research-agent-skills/skills/paper-lookup/SKILL.md) | 18개 학술 API로 논문·인용·오픈액세스 원문을 재현 가능한 출처와 함께 조회 |
| [Systematic Review (PRISMA 2020)](../../vendor/research-agent-skills/skills/systematic-review-prisma/SKILL.md) | PRISMA 2020 프로토콜·검색식·중복 제거·선별·비뚤림 평가·흐름도 작성 |
| [Database Lookup](../../vendor/research-agent-skills/skills/database-lookup/SKILL.md) | 공개 데이터베이스 API를 명시한 엔드포인트·필터·출처로 재현 가능하게 조회 |
| [Experimental Design](../../vendor/research-agent-skills/skills/experimental-design/SKILL.md) | 데이터 수집 전 무작위화·블록화·요인 설계·DOE 배치 설계 |
| [Statistical Power](../../vendor/research-agent-skills/skills/statistical-power/SKILL.md) | 표본 수·검정력·최소 검출 효과 크기 계산과 시뮬레이션 검정력 |
| [Statistical Analysis](../../vendor/research-agent-skills/skills/statistical-analysis/SKILL.md) | 검정 선택·가정 점검·효과 크기·베이즈 대안·APA 형식 보고 |
| [Scientific Writing](../../vendor/research-agent-skills/skills/scientific-writing/SKILL.md) | 근거 출처·보고 지침·저자 책임을 추적하는 원고 작성·수정·점검 |
| [Scientific Visualization](../../vendor/research-agent-skills/skills/scientific-visualization/SKILL.md) | 정확하고 접근성 있는 출판용 그림 설계·불확실성 표시·색 대비·내보내기 점검 |
| [Unslop Academic Writing](../../vendor/research-agent-skills/skills/unslop-academic-writing/SKILL.md) | 학술 문장의 상투어·과잉 수식·모호한 주장 제거 |
| [Citation Verification](../../vendor/research-agent-skills/skills/citation-verification/SKILL.md) | Crossref·OpenAlex·arXiv로 참고문헌의 실재와 메타데이터 일치를 검증 |
| [Reproducibility Statement](../../vendor/research-agent-skills/skills/reproducibility-statement/SKILL.md) | 데이터·코드 공개, 재현성 체크리스트, CRediT·이해 상충·AI 사용 고지 작성 |
| [Venue Templates](../../vendor/research-agent-skills/skills/venue-templates/SKILL.md) | 학술지·학회·포스터·연구비 양식과 번들 LaTeX 템플릿으로 투고 형식 준비 |
| [arXiv Submission](../../vendor/research-agent-skills/skills/arxiv-submission/SKILL.md) | arXiv 투고용 TeX 소스 정리·비공개 주석 제거·분류·버전 관리 준비 |
| [Research Grants](../../vendor/research-agent-skills/skills/research-grants/SKILL.md) | NSF·NIH·DOE·DARPA·NSTC 연구비 제안서의 목표·의의·예산·일정 작성 |
| [Peer Review](../../vendor/research-agent-skills/skills/peer-review/SKILL.md) | 근거 기반 동료 심사 초안, 방법·통계·재현성·윤리·인용 점검 |
| [Rebuttal and Response to Reviewers](../../vendor/research-agent-skills/skills/rebuttal-and-response-to-reviewers/SKILL.md) | 심사 의견 분류와 항목별 답변·반박·수정 추적 |
| [Autoresearch](../../vendor/research-agent-skills/skills/autoresearch/SKILL.md) | 내부·외부 두 루프로 실험 반복과 연구 방향 조정을 관리하는 자율 연구 운영 |

## Integration notes

- **research-agent-skills**: references/catalog.md에서 고른 전문 스킬은 이 패키지의 vendor/research-agent-skills/skills/<name>/SKILL.md(이 색인 디렉터리의 형제 폴더)에 함께 번들되어 있다. 원문의 설치 안내 대신 그 SKILL.md를 읽는다. /workbench skill로 직접 고를 수 있는 것은 research 프로필의 핵심 항목뿐이다. 나머지 전문 스킬은 이 색인으로 찾아 그 경로를 읽는다.
- **hypothesis-generation**: 가설을 사실로 쓰지 않는다. 판별 예측과 기각 조건을 함께 남긴다.
  Required when executing: Python 3.11+ (번들 CLI 실행 시, 표준 라이브러리).
- **scientific-brainstorming**: 실증 검증·윤리·임상 판단은 해당 전문가나 스킬로 넘긴다.
  Required when executing: Python 3.11+ (번들 CLI 실행 시, 표준 라이브러리).
- **scientific-critical-thinking**: 근거 등급은 판단이며 측정값이 아니다. 확인한 출처만 인용한다.
  Required when executing: 선택: scientific-schematics 그림 생성에는 OPENROUTER_API_KEY·OpenRouter 네트워크 접근(유료 API).
- **literature-review**: parallel-cli·OpenRouter 경로는 사용자가 연결한 경우에만 쓴다. 없으면 현재 호스트의 검색·문서 도구와 공개 API로 진행하고 검색 범위를 밝힌다. 검색 문자열·날짜·결과 수를 기록한다. 읽지 않은 논문을 읽었다고 쓰지 않는다.
  Required when executing: 네트워크; Python 3 스크립트; 선택: parallel-cli(PARALLEL_API_KEY), OPENROUTER_API_KEY, PDF 출력 도구.
- **paper-lookup**: 조회 실패·속도 제한을 결과 없음으로 보고하지 않는다. API 키 값은 출력하지 않는다.
  Required when executing: 네트워크·curl; Python 3.11+; 선택: NCBI_API_KEY, S2_API_KEY, CORE_API_KEY, OPENALEX_API_KEY.
- **systematic-review-prisma**: 실제로 수행한 검색·선별 단계와 계획 단계를 구분한다. 등록(PROSPERO/OSF)은 사용자가 수행한다.
  Required when executing: Python 3.9+ (번들 스크립트); 선택: Graphviz.
- **database-lookup**: 일반 지식으로 추정한 값을 조회 결과처럼 쓰지 않는다. 조회 시점·버전·쿼리를 남긴다.
  Required when executing: 네트워크; 데이터베이스별 선택 API 키(예: NCBI_API_KEY, FRED_API_KEY).
- **experimental-design**: 실험 수행·윤리 승인·측정 결과를 만들어내지 않는다. 설계의 가정과 제약을 밝힌다.
  Required when executing: Python 3.10+, numpy, pandas, pyDOE3 (프로젝트 환경에 설치).
- **statistical-power**: 효과 크기 가정의 출처를 밝힌다. 근거 없는 효과 크기로 표본 수를 확정하지 않는다.
  Required when executing: Python 3.10+, statsmodels, scipy, pingouin, numpy, matplotlib; 선택: lifelines.
- **statistical-analysis**: 실제 데이터로 실행한 분석과 예시·계획을 구분한다. 유의성을 인과의 증거로 쓰지 않는다.
  Required when executing: Python 3, pingouin, scipy, statsmodels, pandas (uv pip install 등 프로젝트 환경); 선택: pymc, arviz.
- **scientific-writing**: 확인하지 않은 결과·인용을 만들지 않는다. 사용자의 원고 언어와 투고처 규칙을 우선한다.
  Required when executing: Python 3.11+ (번들 CLI 실행 시, 표준 라이브러리).
- **scientific-visualization**: 렌더링한 그림을 실제로 열어 확인하지 않았다면 시각 검수를 미완료로 보고한다.
  Required when executing: Python 3.11+, uv; 필요 시 Matplotlib, Pillow, pypdf; Plotly 정적 내보내기는 Chrome/Chromium.
- **unslop-academic-writing**: 문체 교정이 내용·수치·인용을 바꾸지 않게 한다.
  Required when executing: Python 3.9+ (scripts/slop_check.py).
- **citation-verification**: 조회하지 못한 항목은 검증 실패가 아니라 미확인으로 구분한다.
  Required when executing: Python 3.9+; api.crossref.org·api.openalex.org·export.arxiv.org 네트워크 접근.
- **reproducibility-statement**: 실제로 공개·보관하지 않은 데이터·코드·DOI를 공개했다고 쓰지 않는다.
- **venue-templates**: 번들 출판사·학회 템플릿은 각자의 조건을 따른다. 현재 페이지·익명화 규칙은 투고처의 최신 공식 안내로 확인한다.
  Required when executing: Python 3.11+ (보조 스크립트); 선택: LaTeX, Poppler.
- **arxiv-submission**: 실제 업로드·공개는 사용자가 요청하고 수행한다. 준비 결과와 게시를 구분한다.
  Required when executing: Python 3.9+ (점검 스크립트); .bbl 생성용 TeX.
- **research-grants**: 기관 규정은 현재 공모 안내로 확인한다. 예비 결과·협력 확약을 만들어내지 않는다.
  Required when executing: 선택: scientific-schematics 그림 생성에는 OPENROUTER_API_KEY·OpenRouter 네트워크 접근(유료 API).
- **peer-review**: 권한 있는 심사에만 사용하고 기밀 원고를 외부 서비스에 보내지 않는다.
  Required when executing: Python 3.11+ (번들 CLI 실행 시, 표준 라이브러리).
- **rebuttal-and-response-to-reviewers**: 수행하지 않은 추가 실험이나 수정을 완료했다고 쓰지 않는다.
- **autoresearch**: Pi에는 Claude Code /loop나 OpenClaw cron이 없다. 반복 실행·정기 호출·git commit·외부 공개는 사용자가 명시하고 호스트가 허용할 때만 한다. 'never stop' 지시는 사용자 범위와 중단 요청보다 우선하지 않는다. 원본 Claude·OpenClaw·Codex 전용 명령·설치 안내는 Pi에서 실행 가능한 기능으로 간주하지 않는다.
  Required when executing: 실험 대상 런타임·데이터·연산 자원; 선택: arxiv, semanticscholar Python 패키지.

Use `/workbench skill <id>` for an explicit one-request selection, or `/workbench use research` for a session-branch profile. The default `auto` mode relies on normal Pi skill discovery.
