"""Build the follow-up configurations from a clean snapshot of the operational package.

Usage: python3 make_variants2.py <snapshot dir (git archive of the baseline commit)> <output dir>

Only operational files are copied into each variant (allowlist below); experiments, tests, scripts, patches and any
.git directory are excluded, and their absence is asserted, so no grader or reference solution can reach a model.
The variant edits reuse ../../policy-pilot/harness/make_variants.py and extend two of them:
  r3a2 (manual-only): the tool-dependent skills also leave the catalog profiles (profile guidance no longer lists them);
        they stay in the catalog, so `/workbench skill <id>` still attaches them.
  r3b2 (conditional): the same skills stay listed; their catalog notes and router rows carry the use-only-when gate.
  r2 also gains an experiment-only catalog skill `verification-principle` (not in any profile or router) whose SKILL.md is
        exactly the common principle r2 adds to WORKFLOWS.ko.md, so the principle can be attached the same way as the
        Verification skill.
Writes <out>/<variant>.diff against the allowlisted snapshot and <out>/hashes.json.
"""
import hashlib
import importlib.util
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SNAPSHOT, OUT = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
ALLOW = ["index.js", "lib", "skills", "vendor", "docs", "catalog.json", "package.json", "LICENSE", "THIRD_PARTY_NOTICES.md", "SKILL.md", "README.md"]
# Top-level directories that must not reach a model, and grader/reference names anywhere.
FORBIDDEN = re.compile(r"^(experiments|tests|scripts|patches|\.git)(/|$)|(^|/)(hidden|\.git)(/|$)|reference\.diff$|acceptance\.test\.mjs$|grade\.py$")

spec = importlib.util.spec_from_file_location("v1", HERE.parent.parent / "policy-pilot" / "harness" / "make_variants.py")
v1 = importlib.util.module_from_spec(spec)
saved = sys.argv
sys.argv = [saved[0], str(SNAPSHOT), str(OUT)]
spec.loader.exec_module(v1)
sys.argv = saved

PRINCIPLE = "완료·수정 성공·통과를 주장하기 전에 최종 상태에서 그 주장을 직접 확인하는 검증(원래 증상 재현 포함)을 실행하고 결과를 읽는다. 실행하지 못한 검증은 미검증으로 보고한다."


def clean_copy(name):
    target = OUT / name
    if target.exists():
        shutil.rmtree(target)
    target.mkdir(parents=True)
    for entry in ALLOW:
        source = SNAPSHOT / entry
        if source.is_dir():
            shutil.copytree(source, target / entry, symlinks=True)
        elif source.exists():
            shutil.copy2(source, target / entry)
    bad = [p.relative_to(target).as_posix() for p in target.rglob("*") if FORBIDDEN.search(p.relative_to(target).as_posix())]
    assert not bad, bad
    return target


def catalog_edit(root, change):
    path = root / "catalog.json"
    catalog = json.loads(path.read_text())
    change(catalog)
    path.write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n")


def r2(root):
    v1.verification_principle(root)
    skill = root / "experiment" / "verification-principle" / "SKILL.md"
    skill.parent.mkdir(parents=True)
    skill.write_text("---\nname: verification-principle\ndescription: 완료 주장 전 검증 원칙 (r2 공통 원칙)\n---\n\n# 검증 원칙\n\n" + PRINCIPLE + "\n")

    def add(catalog):
        catalog["skills"].append({"id": "verification-principle", "name": "Verification principle (experiment)", "description": "r2 공통 검증 원칙",
                                  "profiles": [], "path": "experiment/verification-principle/SKILL.md", "notes": [], "dependencies": []})
    catalog_edit(root, add)


def r3a2(root):
    v1.manual_only(root)
    ids = set(v1.CONDITIONAL)

    def drop(catalog):
        for profile in catalog["profiles"]:
            profile["skills"] = [s for s in profile["skills"] if s not in ids]
        for skill in catalog["skills"]:
            if skill["id"] in ids:
                skill["profiles"] = []
                skill["notes"] = ["수동 전용: 자동 추천하지 않는다. 사용자가 /workbench skill로 선택했을 때만 사용한다."] + skill.get("notes", [])
    catalog_edit(root, drop)


def r3b2(root):
    v1.conditional(root)

    def gate(catalog):
        for skill in catalog["skills"]:
            if skill["id"] in v1.CONDITIONAL:
                skill["notes"] = [f"Use only when: {v1.CONDITIONAL[skill['id']]}. 먼저 확인하고, 조건이 맞지 않으면 읽지 말고 기존 도구로 진행한다. 이 스킬을 쓰려고 도구를 새로 설치하지 않는다."] + skill.get("notes", [])
    catalog_edit(root, gate)


VARIANTS = {
    "current": None,
    "r1": v1.no_default_ponytail_ecc,
    "r2": r2,
    "r3a2": r3a2,
    "r3b2": r3b2,
    "r4": v1.split_dmaic,
}


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    base = clean_copy(".base")
    hashes = {}
    for name, build in VARIANTS.items():
        root = clean_copy(name)
        if build:
            build(root)
        diff = subprocess.run(["diff", "-ruN", str(base), str(root)], capture_output=True, text=True).stdout
        diff = re.sub(r"^((?:---|\+\+\+) [^\t\n]+)\t[^\n]*$", r"\1", diff.replace(str(base), "a").replace(str(root), "b"), flags=re.M)
        (OUT / f"{name}.diff").write_text(diff)
        hashes[name] = v1.tree_hash(root)
    shutil.rmtree(base)
    (OUT / "hashes.json").write_text(json.dumps(hashes, indent=2) + "\n")
    print(json.dumps(hashes, indent=2))
