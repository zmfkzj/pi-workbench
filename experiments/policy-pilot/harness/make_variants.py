"""Build the experiment-only Workbench configurations from one clean snapshot.

Usage: python3 make_variants.py <clean pi-workbench snapshot dir> <output dir>

Every variant is a full copy of the snapshot with exact, asserted text edits (no regeneration). The operational
repository, catalog defaults and vendor files are never changed by this script. A diff of each variant against the
snapshot is written to <output dir>/<variant>.diff, and a content hash of each variant to <output dir>/hashes.json.
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

SNAPSHOT, OUT = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()


def replace(root, path, pairs):
    file = root / path
    text = file.read_text()
    for old, new in pairs:
        assert text.count(old) == 1, (path, old[:80])
        text = text.replace(old, new)
    file.write_text(text)


def copy(name):
    target = OUT / name
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(SNAPSHOT, target, symlinks=True)
    return target


# ---- R1: no default Ponytail full / ECC search-first in the coding path (both remain listed and selectable) ----
def no_default_ponytail_ecc(root):
    replace(root, "skills/wb-coding/SKILL.md", [
        ('description: "코딩·리뷰·검증. Ponytail 중심의 재사용·문서 조회·UI·구조 검색·테스트.',
         'description: "코딩·리뷰·검증. 재사용·문서 조회·UI·구조 검색·테스트.'),
        ("Read the coding section of docs/WORKFLOWS.ko.md. Default to Ponytail full and lightweight ECC search-first. Read current callers",
         "Read the coding section of docs/WORKFLOWS.ko.md. Read current callers"),
        ("- **ponytail**: full을 기본으로 한다. 기존 동작", "- **ponytail**: 구현 방식 지침이 필요할 때 full을 사용한다. 기존 동작"),
    ])
    replace(root, "docs/WORKFLOWS.ko.md", [
        ("1. Ponytail full을 기본 구현 태도로 삼아 요청을 완수하는 가장 작은 일관된 변경을 목표로 한다.\n2. ECC search-first로 호출부·테스트·설정·기존 구현·설치된 의존성을 먼저 찾는다.",
         "1. 요청을 완수하는 가장 작은 일관된 변경을 목표로 한다.\n2. 호출부·테스트·설정·기존 구현·설치된 의존성을 먼저 찾는다."),
    ])
    replace(root, "docs/ADAPTERS.md", [
        ("Use **Ponytail full** by default for implementation. Reuse", "Use **Ponytail full** when its implementation guidance is relevant. Reuse"),
        ("Use ECC Search First as a lightweight preflight for small tasks and a deeper comparison",
         "Use ECC Search First when a task needs a search for existing solutions, with a deeper comparison"),
    ])
    replace(root, "catalog.json", [
        ('"description": "Ponytail 중심의 재사용·문서 조회·UI·구조 검색·테스트"', '"description": "재사용·문서 조회·UI·구조 검색·테스트"'),
        ("Read the coding section of docs/WORKFLOWS.ko.md. Default to Ponytail full and lightweight ECC search-first. Read current callers",
         "Read the coding section of docs/WORKFLOWS.ko.md. Read current callers"),
    ])


# ---- R2: Verification Before Completion removed from routers/catalog; a short common principle instead ----
VERIFICATION_ROW = "| [Superpowers Verification Before Completion](../../vendor/superpowers/skills/verification-before-completion/SKILL.md) | 완료·수정 성공 주장에 대응하는 실제 검증 근거 확인 |\n"
VERIFICATION_NOTE = "- **verification-before-completion**: 의미 있는 검증을 선택하고 결과의 실행 여부를 구분한다. 사소한 변경마다 전체 테스트를 강제하지 않는다.\n"


def verification_principle(root):
    for router in ("skills/wb-coding/SKILL.md", "skills/wb-analysis/SKILL.md"):
        replace(root, router, [(VERIFICATION_ROW, ""), (VERIFICATION_NOTE, "")])
    replace(root, "docs/WORKFLOWS.ko.md", [
        ("- 완료 시 결과, 수행한 검증, 남은 한계를 간결하게 보고한다.",
         "- 완료·수정 성공·통과를 주장하기 전에 최종 상태에서 그 주장을 직접 확인하는 검증(원래 증상 재현 포함)을 실행하고 결과를 읽는다. 실행하지 못한 검증은 미검증으로 보고한다.\n- 완료 시 결과, 수행한 검증, 남은 한계를 간결하게 보고한다."),
    ])
    catalog = json.loads((root / "catalog.json").read_text())
    for profile in catalog["profiles"]:
        profile["skills"] = [s for s in profile["skills"] if s != "verification-before-completion"]
    catalog["skills"] = [s for s in catalog["skills"] if s["id"] != "verification-before-completion"]
    (root / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")


# ---- R3: tool/environment-dependent skills. (a) manual-only, (b) explicit conditional recommendation ----
CONDITIONAL = {
    "find-docs": "Context7 MCP 도구 또는 `ctx7` CLI가 이 호스트에 이미 있을 때",
    "ast-grep": "`ast-grep --version`(또는 `sg --version`)이 이미 성공할 때",
    "ast-grep-outline": "outline을 지원하는 ast-grep CLI가 이미 있을 때",
    "ui-ux-pro-max": "웹·앱 UI의 스타일·색상·폰트를 새로 정해야 하고 Python 3가 있을 때",
    "frontend-design": "실행 가능한 프런트엔드 런타임에서 UI를 새로 디자인할 때",
    "property-based-testing": "프로젝트에 속성 기반 테스트 라이브러리가 이미 있거나 사용자가 도입을 원할 때",
    "fiftyone-model-evaluation": "FiftyOne 앱·Python 패키지와 대상 데이터셋이 이미 있을 때",
    "imagegen": "이미 구성된 이미지 생성 도구나 사용자가 고른 API 경로와 자격 증명이 있을 때",
    "sound-effects": "구성된 ElevenLabs 도구·계정이 있을 때",
    "music": "구성된 ElevenLabs 도구·계정이 있을 때",
    "video-director": "HyperFrames 등 영상 렌더 도구가 이미 있을 때",
    "fire-smoke-skill-vfx": "Three.js 기반 실행 환경이 있을 때",
}


def router_rows(root):
    catalog = json.loads((root / "catalog.json").read_text())
    return {s["id"]: s for s in catalog["skills"] if s["id"] in CONDITIONAL}


def iter_routers(root):
    return sorted((root / "skills").glob("wb-*/SKILL.md"))


def manual_only(root):
    skills = router_rows(root)
    for router in iter_routers(root):
        text = router.read_text()
        removed = []
        for skill_id, skill in skills.items():
            row = re.search(rf"^\| \[[^\]]+\]\(\.\./\.\./{re.escape(skill['path'])}\) \| .*\|\n", text, re.M)
            if not row:
                continue
            text = text.replace(row.group(0), "")
            note = re.search(rf"^- \*\*{re.escape(skill_id)}\*\*: .*\n(?:  Required when executing: .*\n)?", text, re.M)
            assert note, (router, skill_id)
            text = text.replace(note.group(0), "")
            removed.append(skill_id)
        if removed:
            marker = "\nUse `/workbench skill <id>`"
            assert text.count(marker) == 1
            text = text.replace(marker, f"\nManual-only skills (not recommended automatically; available only when the user selects them with `/workbench skill <id>`): {', '.join(removed)}.\n{marker}")
            router.write_text(text)
    replace(root, "docs/WORKFLOWS.ko.md", [
        ("4. Context7을 사용할 수 있으면 실제 설치 버전에 맞는 문서를 찾는다. 사용할 수 없으면 공식 문서와 로컬 코드를 확인한다.",
         "4. 실제 설치 버전에 맞는 공식 문서와 로컬 코드를 확인한다."),
    ])


def conditional(root):
    skills = router_rows(root)
    for router in iter_routers(root):
        text = router.read_text()
        changed = False
        for skill_id, skill in skills.items():
            row = re.search(rf"^(\| \[[^\]]+\]\(\.\./\.\./{re.escape(skill['path'])}\) \| )(.*)( \|)\n", text, re.M)
            if not row:
                continue
            condition = CONDITIONAL[skill_id]
            text = text.replace(row.group(0), f"{row.group(1)}**조건:** {condition}만. {row.group(2)}{row.group(3)}\n")
            note = re.search(rf"^(- \*\*{re.escape(skill_id)}\*\*: .*\n)(  Required when executing: .*\n)?", text, re.M)
            assert note, (router, skill_id)
            gate = f"  Use only when: {condition}. 먼저 확인하고, 조건이 맞지 않으면 이 스킬을 읽지 말고 기존 검색·읽기·테스트 도구로 진행한다. 이 스킬을 쓰려고 도구를 새로 설치하지 않는다.\n"
            text = text.replace(note.group(0), note.group(1) + (note.group(2) or "") + gate)
            changed = True
        if changed:
            router.write_text(text)


# ---- R4: DMAIC split into an entry file plus one reference per phase (text moved verbatim) ----
DMAIC = "vendor/quality-engineering/skills/problem-solving/dmaic"
PHASES = [
    ("### Phase 1 — DEFINE", "phase-1-define.md", "문제·범위·CTQ·목표·팀 정의"),
    ("### Phase 2 — MEASURE", "phase-2-measure.md", "측정 체계(MSA) 확인과 기준선 데이터"),
    ("### Phase 3 — ANALYZE", "phase-3-analyze.md", "원인 후보와 가설 검정·통계 도구 선택"),
    ("### Phase 4 — IMPROVE", "phase-4-improve.md", "개선안 선정·실험·파일럿"),
    ("### Phase 5 — CONTROL", "phase-5-control.md", "관리 계획·지속 관측·종료"),
    ("### DMAIC vs. 8D — quick reference", "dmaic-vs-8d.md", "DMAIC와 8D 선택 비교"),
]


def split_dmaic(root):
    skill = root / DMAIC / "SKILL.md"
    text = skill.read_text()
    start = text.index(PHASES[0][0])
    end = text.index("## Validation criteria")
    body = text[start:end]
    positions = [body.index(heading) for heading, _, _ in PHASES] + [len(body)]
    index = ["The workflow is split into one reference per phase. Read only the phases this task needs:", ""]
    for i, (heading, name, summary) in enumerate(PHASES):
        section = body[positions[i]:positions[i + 1]].rstrip() + "\n"
        section = section.replace("](references/", "](")
        note = f"<!-- Experiment variant (policy pilot): moved verbatim from ../SKILL.md. -->\n\n"
        (root / DMAIC / "references" / name).write_text(note + section.replace("### ", "# ", 1))
        index.append(f"- [{heading.removeprefix('### ')}](references/{name}) — {summary}")
    skill.write_text(text[:start] + "\n".join(index) + "\n\n" + text[end:])


VARIANTS = {
    "current": None,
    "r1-no-default-ponytail-ecc": no_default_ponytail_ecc,
    "r2-verification-principle": verification_principle,
    "r3a-manual-only": manual_only,
    "r3b-conditional": conditional,
    "r4-split-dmaic": split_dmaic,
}


def tree_hash(root):
    digest = hashlib.sha256()
    for file in sorted(p for p in root.rglob("*") if p.is_file()):
        digest.update(file.relative_to(root).as_posix().encode() + b"\0" + file.read_bytes() + b"\0")
    return digest.hexdigest()


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    hashes = {}
    for name, build in VARIANTS.items():
        root = copy(name)
        if build:
            build(root)
        diff = subprocess.run(["diff", "-ruN", str(SNAPSHOT), str(root)], capture_output=True, text=True).stdout
        diff = re.sub(r"^((?:---|\+\+\+) [^\t\n]+)\t[^\n]*$", r"\1", diff.replace(str(SNAPSHOT), "a").replace(str(root), "b"), flags=re.M)
        (OUT / f"{name}.diff").write_text(diff)
        hashes[name] = tree_hash(root)
    (OUT / "hashes.json").write_text(json.dumps(hashes, indent=2) + "\n")
    print(json.dumps(hashes, indent=2))
