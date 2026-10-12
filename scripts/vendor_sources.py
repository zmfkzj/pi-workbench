#!/usr/bin/env python3
"""Fetch the explicitly selected, licensed upstream files at locked Git commits.

No downloaded script is executed. Git symlinks are rejected unless the source
spec explicitly maps them to a real subtree. Existing locks are never advanced
automatically; edit sources.lock.json deliberately after reviewing an update.

After every upstream file has been verified against its Git blob, the reviewed
corrections listed as `patches` in sources.json are applied strictly (no fuzz)
with scripts/vendor_patches.mjs. The integrity manifest then records the
distributed bytes and, for each corrected file, the upstream digests and patch.
"""
import concurrent.futures
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import stat
import sys
import time
import subprocess
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CACHE = Path(os.environ.get("PI_WORKBENCH_BUILD_CACHE", str(ROOT.parent / ".pi-workbench-cache")))
HEADERS = {"User-Agent": "pi-workbench-vendor/0.1", "Accept": "application/vnd.github+json"}


def get_bytes(url):
    error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=HEADERS), timeout=45) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError) as exc:
            error = exc
            if isinstance(exc, urllib.error.HTTPError) and exc.code in (401, 403, 404):
                raise
            if attempt < 2:
                time.sleep(attempt + 1)
    raise error


def safe_relative(path):
    parsed = PurePosixPath(path)
    if parsed.is_absolute() or ".." in parsed.parts or not parsed.parts:
        raise ValueError(f"Unsafe source path: {path}")
    return parsed


def included(path, selections):
    return any(path == prefix.rstrip("/") or path.startswith(prefix.rstrip("/") + "/") for prefix in selections)


def fetch_repo(source, lock):
    repo = source["repository"]
    slug = source["id"]
    commit = lock["commit"]
    tree_cache = CACHE / f"{slug}-{commit}.tree.json"
    if tree_cache.exists():
        tree = json.loads(tree_cache.read_text())
    else:
        tree = json.loads(get_bytes(f"https://api.github.com/repos/{repo}/git/trees/{commit}?recursive=1"))
        tree_cache.write_text(json.dumps(tree))
    if tree.get("truncated"):
        raise ValueError(f"GitHub truncated the tree for {repo}; do not produce an incomplete vendor.")
    selections = source["include"] + source["licenseFiles"]
    candidates = [item for item in tree["tree"] if item["type"] == "blob" and included(item["path"], selections)]
    selected_paths = {item["path"] for item in candidates}
    for path in selections:
        safe_relative(path)
        if not any(p == path.rstrip("/") or p.startswith(path.rstrip("/") + "/") for p in selected_paths):
            raise ValueError(f"Missing selected source {repo}:{path}")
    results = []

    def fetch_file(item):
        path = item["path"]
        safe_relative(path)
        if item.get("mode") == "120000":
            raise ValueError(f"Unresolved upstream symlink {repo}:{path}; add an explicit mapping.")
        if item.get("size", 0) > 12 * 1024 * 1024:
            raise ValueError(f"Oversized file needs deliberate review: {repo}:{path}")
        cached = CACHE / "blobs" / item["sha"]
        if cached.exists():
            data = cached.read_bytes()
        else:
            url = f"https://raw.githubusercontent.com/{repo}/{commit}/{urllib.parse.quote(path, safe='/')}"
            data = get_bytes(url)
            cached.write_bytes(data)
        actual = hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest()
        if actual != item["sha"]:
            raise ValueError(f"Git blob integrity mismatch: {repo}:{path}")
        target = ROOT / "vendor" / slug / path
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
        if item.get("mode") == "100755":
            target.chmod(target.stat().st_mode | stat.S_IXUSR | stat.S_IXGRP | stat.S_IXOTH)
        return {"path": target.relative_to(ROOT).as_posix(), "sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data), "gitBlob": item["sha"]}

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        for result in pool.map(fetch_file, candidates):
            results.append(result)
    by_path = {item["path"]: item for item in results}
    for entry in source.get("patches", []):
        safe_relative(entry["file"])
        applied = subprocess.run(
            ["node", str(ROOT / "scripts" / "vendor_patches.mjs"), "apply", str(ROOT / "vendor" / slug), str(ROOT / entry["file"])],
            check=True, capture_output=True, text=True)
        for path in json.loads(applied.stdout):
            record = by_path.get(f"vendor/{slug}/{path}")
            if record is None or "patch" in record:
                raise ValueError(f"{entry['file']} changes {path}, which is not a selected file or is already patched")
            data = (ROOT / record["path"]).read_bytes()
            upstream = {key: record[key] for key in ("sha256", "bytes", "gitBlob")}
            record.update({"sha256": hashlib.sha256(data).hexdigest(), "bytes": len(data),
                           "gitBlob": hashlib.sha1(f"blob {len(data)}\0".encode() + data).hexdigest(),
                           "upstream": upstream, "patch": entry["file"]})
    for alias in source.get("aliases", []):
        safe_relative(alias["from"])
        safe_relative(alias["to"])
        source_path = f"vendor/{slug}/{alias['from']}"
        source_record = next((item for item in results if item["path"] == source_path), None)
        if source_record is None or alias["to"] in selected_paths or "patch" in source_record:
            raise ValueError(f"Invalid compatibility alias for {repo} (missing, shadowing or patched source): {alias}")
        target = ROOT / "vendor" / slug / alias["to"]
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes((ROOT / source_path).read_bytes())
        results.append({**source_record, "path": target.relative_to(ROOT).as_posix(), "aliasOf": source_path})
    print(f"{slug}: {len(results)} files at {commit[:12]}", flush=True)
    return results


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / "blobs").mkdir(exist_ok=True)
    sources = json.loads((ROOT / "sources.json").read_text())["sources"]
    lock_path = ROOT / "sources.lock.json"
    lock = json.loads(lock_path.read_text()) if lock_path.exists() else {"schemaVersion": 1, "sources": {}}
    for source in sources:
        if source["id"] in lock["sources"]:
            continue
        branch = source.get("branch", "main")
        info = json.loads(get_bytes(f"https://api.github.com/repos/{source['repository']}/git/ref/heads/{urllib.parse.quote(branch, safe='')}"))
        commit = info["object"]["sha"]
        if info["object"]["type"] != "commit" or len(commit) != 40:
            raise ValueError(f"Expected a commit ref for {source['repository']}")
        lock["sources"][source["id"]] = {"repository": source["repository"], "branch": branch, "commit": commit}
        lock_path.write_text(json.dumps(lock, indent=2) + "\n")
        print(f"Locked {source['id']}: {commit[:12]}", flush=True)
    files = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(fetch_repo, source, lock["sources"][source["id"]]) for source in sources]
        for future in concurrent.futures.as_completed(futures):
            files.extend(future.result())
    manifest = {"schemaVersion": 1, "files": sorted(files, key=lambda item: item["path"])}
    (ROOT / "vendor-integrity.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Verified {len(files)} upstream files, {sum(f['bytes'] for f in files):,} bytes.", flush=True)


if __name__ == "__main__":
    main()
