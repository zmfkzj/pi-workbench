"""Trace use of the shared host /tmp in the recorded pilot runs (no model calls).

Usage: python3 trace_shared_tmp.py <scratch dir> <runs.jsonl>[,<runs.jsonl>...] > shared-tmp-trace.json

Input: the full Pi event streams kept in <scratch>/runs/<runId>/events.jsonl (complete tool arguments including the
text of write/edit calls, tool results, timestamps). The committed runs-*.jsonl keep only shortened tool logs, so
this trace needs the scratch copy; its output is committed instead.

Each run had a private TMPDIR inside the scratch directory, but a command can still spell /tmp/<name> directly. For
every tool call that mentions the host /tmp outside the scratch (/tmp/pi-orche/...), the trace records the call
index, timestamp, tool, access class and whether the call failed. The classes are heuristic:
  - write: redirect/tee/cp/mv/mkdir/venv/pip --target/install target, a write or edit tool, open(..., "w") in code
  - exec: running an interpreter or tool below the path (for example /tmp/x/bin/python)
  - unresolved: `cd /tmp` (later relative paths cannot be resolved), or /tmp built at run time (variables, joins)
  - read/other: everything else (reads, listings, diff arguments)
Paths are related by prefix, so /tmp/ra_venv and /tmp/ra_venv/bin/python are the same resource.

For each resource used by more than one run the trace lists the users in time order with their access classes and
whether another run had written or executed from it (exec counts, since running a shared venv can change it) before
or during this run ("possible earlier or concurrent writer"). That is a
possibility, not a confirmed dependency: the event log does not show which version of a file a command read.
It also records any tool call that names the task graders, reference solutions, judge records, the repository or
another run's directory ("recorded direct access"); the absence of such calls is not proof that access was impossible.
"""
import json
import re
import sys
from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path

scratch = Path(sys.argv[1])
ledger = [json.loads(line) for file in sys.argv[2].split(",") for line in open(file) if line.strip()]
SCRATCH_PREFIX = "/tmp/pi-orche/"
TMP_PATH = re.compile(r"(?<![\w.-])/tmp(/(?!pi-orche)[A-Za-z0-9_.+\-]+)+")
CD_TMP = re.compile(r"\bcd\s+[\"']?/tmp/?[\"']?(\s|;|&|$)|\bcd\s+[\"']?/tmp/(?!pi-orche)")
DYNAMIC = re.compile(r"[\"']/tmp[\"']\s*[,+)]|join\([\"']/tmp[\"']|\$\{?TMP\b(?!DIR)|gettempdir\(\)\s*==|/tmp\$|/tmp/\$")
WRITE_BEFORE = re.compile(r"(>>?\s*[\"']?|\btee\s+(-a\s+)?[\"']?|\bmkdir\s+(-p\s+)?[\"']?|\bvenv\s+[\"']?|\bcp\s+(-[a-zA-Z]+\s+)*\S+\s+[\"']?|\bmv\s+\S+\s+[\"']?|--target[= ][\"']?|\bgit\s+worktree\s+add\s+[\"']?|\bwriteFileSync\([\"']|\bopen\([\"'])$")
EXEC_AFTER = re.compile(r"^/bin/(python3?|pip3?)\b")
FORBIDDEN = re.compile(r"hidden/|acceptance\.test|grade\.py|reference\.diff|policy-pilot|oh-my-pi-extensions|judge_t4|judgements|/exp/runs/(?!<self>)")


def classify(text, match, tool):
    if tool in ("write", "edit"):
        return "write"
    before = text[max(0, match.start() - 60):match.start()]
    after = text[match.end():match.end() + 20]
    if EXEC_AFTER.match(match.group(0)[len(root_of(match.group(0))):]) or EXEC_AFTER.match(after):
        return "exec"
    if WRITE_BEFORE.search(before):
        return "write"
    window = text[match.end():match.end() + 40]
    if re.match(r"[\"']?\s*,\s*[\"']w", window):
        return "write"
    return "read/other"


def root_of(path):
    parts = path.split("/")
    return "/".join(parts[:3])


def call_texts(tool, args):
    if tool == "bash":
        return [str(args.get("command", ""))]
    if tool == "write":
        return [str(args.get("path", "")), str(args.get("content", ""))]
    if tool == "edit":
        return [str(args.get("path", ""))] + [str(edit.get("newText", edit.get("new_text", edit.get("text", "")))) for edit in (args.get("edits") or []) if isinstance(edit, dict)]
    return [json.dumps(args)]


def trace_run(run):
    events = scratch / "runs" / run["runId"] / "events.jsonl"
    calls = []
    starts = {}
    ends = {}
    if not events.exists():
        return None
    for line in events.open():
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if event.get("type") == "tool_execution_start":
            starts[event["toolCallId"]] = (len(starts), event)
        elif event.get("type") == "tool_execution_end":
            ends[event["toolCallId"]] = event
        elif event.get("type") == "message_end" and event["message"].get("role") == "toolResult":
            ends.setdefault(event["message"].get("toolCallId"), {}).setdefault("timestamp", event["message"].get("timestamp"))
    accesses = []
    unresolved = []
    forbidden = []
    for call_id, (index, start) in sorted(starts.items(), key=lambda item: item[1][0]):
        tool, args = start["toolName"], start.get("args") or {}
        end = ends.get(call_id, {})
        failed = end.get("isError") if "isError" in end else None
        stamp = end.get("timestamp")
        for position, text in enumerate(call_texts(tool, args)):
            own = text.replace(f"/exp/runs/{run['runId']}/", "/exp/runs/<self>/").replace(f"/exp/runs/{run['runId']}", "/exp/runs/<self>")
            if FORBIDDEN.search(own):
                forbidden.append({"call": index, "tool": tool, "text": own[:300]})
            for match in TMP_PATH.finditer(text):
                path = match.group(0).rstrip("/.")
                kind = "write" if tool in ("write", "edit") and position == 0 else classify(text, match, tool if position == 0 else "bash")
                accesses.append({"call": index, "tool": tool, "path": path, "resource": root_of(path), "kind": kind, "failed": failed, "timestamp": stamp})
            if CD_TMP.search(text) or DYNAMIC.search(text):
                unresolved.append({"call": index, "tool": tool, "text": text[:200]})
    return {"accesses": accesses, "unresolved": unresolved, "forbidden": forbidden}


def window(run):
    start = datetime.fromisoformat(run["startedAt"].replace("Z", "+00:00"))
    return start, start + timedelta(seconds=run["wallSeconds"])


mode = lambda config: "select" if "select" in config else "profile" if ("profile" in config or "mfg" in config) else "auto"
traces = {run["runId"]: trace_run(run) for run in ledger}
by_resource = defaultdict(list)
for run in ledger:
    trace = traces[run["runId"]]
    if not trace:
        continue
    for resource in sorted({a["resource"] for a in trace["accesses"]}):
        by_resource[resource].append(run)

resources = []
for resource, users in sorted(by_resource.items()):
    users = sorted(users, key=lambda r: r["startedAt"])
    entries = []
    for run in users:
        start, end = window(run)
        mine = [a for a in traces[run["runId"]]["accesses"] if a["resource"] == resource]
        writers = [o["runId"] for o in users if o is not run and window(o)[0] < end and any(a["kind"] in ("write", "exec") for a in traces[o["runId"]]["accesses"] if a["resource"] == resource)]
        concurrent = [o["runId"] for o in users if o is not run and window(o)[0] < end and start < window(o)[1]]
        entries.append({
            "runId": run["runId"], "model": run["model"]["id"], "task": run["task"], "config": run["config"], "mode": mode(run["config"]), "rep": run["rep"],
            "accepted": run["grade"]["checks"].get("acceptance"), "costListPrice": run["usage"]["costListPrice"],
            "accesses": [{k: a[k] for k in ("call", "tool", "path", "kind", "failed")} for a in mine],
            "firstKind": mine[0]["kind"], "possibleEarlierOrConcurrentWriters": writers, "concurrentUsers": concurrent,
        })
    resources.append({"resource": resource, "users": len(users), "entries": entries})

shared_users = sorted({e["runId"] for r in resources if r["users"] > 1 for e in r["entries"]})
print(json.dumps({
    "source": "full event streams (scratch)",
    "runsInspected": len(ledger),
    "eventStreamsMissing": sorted(r for r, t in traces.items() if t is None),
    "runsNamingHostTmp": sorted(r for r, t in traces.items() if t and t["accesses"]),
    "runsWithUnresolvedTmpUse": {r: t["unresolved"] for r, t in traces.items() if t and t["unresolved"]},
    "runsSharingAResourceWithAnotherRun": shared_users,
    "runsWithPossibleEarlierOrConcurrentWriter": sorted({e["runId"] for r in resources if r["users"] > 1 for e in r["entries"] if e["possibleEarlierOrConcurrentWriters"]}),
    "runsConcurrentWithAnotherUser": sorted({e["runId"] for r in resources if r["users"] > 1 for e in r["entries"] if e["concurrentUsers"]}),
    "recordedDirectAccessToGradersRepoOrOtherRuns": {r: t["forbidden"] for r, t in traces.items() if t and t["forbidden"]},
    "resources": resources,
}, indent=1))
