// Regression tests for the reviewed corrections in patches/: they run the corrected vendor CLIs, evaluate the
// distributed code examples and recompute the statistics stated in the corrected documents. Where useful, the
// upstream original (reconstructed by reversing the patch) is run as a negative control to show that the test
// detects the original error.
//
// The Python CLIs need python3 with NumPy and Pillow. Without them these tests fail; set
// PI_WORKBENCH_SKIP_PYTHON_TESTS=1 to report them as skipped instead.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { after, before, describe, test } from "node:test";
import { fileURLToPath } from "node:url";
import { applyFilePatch, parsePatch, readPatches, verifyPatches } from "../scripts/vendor_patches.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (path) => readFile(join(root, path), "utf8");
const sources = JSON.parse(await read("sources.json")).sources;
const integrity = JSON.parse(await read("vendor-integrity.json"));
const patches = await readPatches(root, sources);

const TAO = "vendor/tao/skills/applications/tao-validate-recipe-transfer";
const LEAKAGE = join(root, TAO, "scripts/split_leakage_check.py");
const PARITY = join(root, TAO, "scripts/preprocess_parity.py");
const ASSET = join(root, "vendor/gamedev/skills/disciplines/create-game-assets/scripts/asset_report.py");
const VERCEL = "vendor/vercel/skills/react-best-practices";
const QUALITY = "vendor/quality-engineering/skills/problem-solving";

/** The upstream text of a corrected vendor file, reconstructed by reversing its patch. */
async function upstreamText(vendorPath) {
  const file = patches.flatMap((p) => p.files).find((f) => f.vendorPath === vendorPath);
  assert(file, `No patch changes ${vendorPath}`);
  return applyFilePatch(await read(vendorPath), file, { reverse: true });
}

const python = spawnSync("python3", ["-c", "import numpy, PIL; print('ok')"], { encoding: "utf8" });
const pythonReady = python.status === 0;
const skipPython = !pythonReady && process.env.PI_WORKBENCH_SKIP_PYTHON_TESTS === "1"
  ? "python3 with NumPy and Pillow is not available (PI_WORKBENCH_SKIP_PYTHON_TESTS=1)" : false;
function requirePython() {
  assert(pythonReady, `python3 with NumPy and Pillow is required for the vendor CLI tests (${(python.stderr || python.error?.message || "").trim()}); set PI_WORKBENCH_SKIP_PYTHON_TESTS=1 to skip them`);
}
function run(args, options = {}) {
  const result = spawnSync("python3", args, { encoding: "utf8", ...options, env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1", ...options.env } });
  return { code: result.status, out: result.stdout, err: result.stderr };
}

let scratch;
before(async () => { scratch = await mkdtemp(join(tmpdir(), "pi-workbench-corrections-")); });
after(async () => { if (scratch) await rm(scratch, { recursive: true, force: true }); });

// Writes PNG images with Pillow. Noise images with different seeds have dHash distances far above the
// leakage threshold, unlike flat colours, which all hash to the same 64 zero bits.
function makeImages(specs) {
  const code = `
import json, sys
import numpy as np
from PIL import Image
for spec in json.loads(sys.argv[1]):
    if "noise" in spec:
        data = np.random.default_rng(spec["noise"]).integers(0, 256, (64, 64, 3), dtype=np.uint8)
        Image.fromarray(data).save(spec["path"])
    else:
        colors = spec["colors"]
        mode = spec.get("mode", "RGB")
        image = Image.new(mode, (len(colors), 1))
        image.putdata([tuple(c) for c in colors])
        image.save(spec["path"])
`;
  const result = run(["-c", code, JSON.stringify(specs)]);
  assert.equal(result.code, 0, result.err);
}

async function splitDirs(name, files) {
  const base = join(scratch, name);
  for (const split of Object.keys(files)) await mkdir(join(base, split), { recursive: true });
  makeImages(Object.entries(files).flatMap(([split, list]) => list.map(([file, seed]) => ({ path: join(base, split, file), noise: seed }))));
  return base;
}

describe("TAO split_leakage_check.py", { skip: skipPython }, () => {
  before(requirePython);

  test("different images with purely numeric names are not one leaked group (former false positive)", async () => {
    const base = await splitDirs("numeric", { train: [["0001.png", 1], ["0002.png", 2]], val: [["0003.png", 3]] });
    const args = [LEAKAGE, "--splits", `train=${join(base, "train")}`, `val=${join(base, "val")}`];
    const result = run(args);
    assert.equal(result.code, 0, result.out + result.err);
    assert.match(result.out, /\*\*train vs val\*\*: clean/);
    assert.match(result.out, /No filename groups span multiple splits/);
    assert.match(result.out, /3 image\(s\) have purely numeric names/);
    assert.doesNotMatch(result.out, /LEAKAGE DETECTED/);

    // Negative control: the upstream script groups every numeric stem under "" and fails the same splits.
    const upstream = join(scratch, "split_leakage_check.upstream.py");
    await writeFile(upstream, await upstreamText(`${TAO}/scripts/split_leakage_check.py`));
    const original = run([upstream, ...args.slice(1)]);
    assert.equal(original.code, 1);
    assert.match(original.out, /\| `` \| train, val \|/);
  });

  test("a near-duplicate image across splits is still confirmed leakage", async () => {
    const base = await splitDirs("duplicate", { train: [["0001.png", 7], ["0002.png", 8]], val: [["0009.png", 7]] });
    const result = run([LEAKAGE, "--splits", `train=${join(base, "train")}`, `val=${join(base, "val")}`]);
    assert.equal(result.code, 1);
    assert.match(result.out, /1 near-duplicate pairs/);
    assert.match(result.out, /LEAKAGE DETECTED/);
  });

  test("shared filename stems are a suspicion unless the gate is requested", async () => {
    const base = await splitDirs("frames", { train: [["frame_0001.png", 11]], val: [["frame_0002.png", 12]] });
    const args = [LEAKAGE, "--splits", `train=${join(base, "train")}`, `val=${join(base, "val")}`];
    const suspected = run(args);
    assert.equal(suspected.code, 0);
    assert.match(suspected.out, /1 filename group\(s\) span multiple splits \(suspected\)/);
    assert.match(suspected.out, /\| `frame` \| train, val \|/);
    assert.match(suspected.out, /No confirmed leakage; filename groups span splits \(SUSPECTED\)/);
    const gated = run([...args, "--fail-on-filename-groups"]);
    assert.equal(gated.code, 1);
    assert.match(gated.out, /LEAKAGE DETECTED/);
  });

  test("verified groups across splits are confirmed leakage; separate groups are clean", async () => {
    const base = await splitDirs("groups", { train: [["a.png", 21]], val: [["b.png", 22]] });
    const args = [LEAKAGE, "--splits", `train=${join(base, "train")}`, `val=${join(base, "val")}`, "--groups"];
    await writeFile(join(base, "same.csv"), "path,group\na.png,video-1\nb.png,video-1\n");
    await writeFile(join(base, "separate.csv"), `path,group\na.png,video-1\n${join(base, "val", "b.png")},video-2\n`);
    await writeFile(join(base, "bad.csv"), "file,group\na.png,video-1\n");
    const same = run([...args, join(base, "same.csv")]);
    assert.equal(same.code, 1);
    assert.match(same.out, /1 verified group\(s\) span multiple splits/);
    assert.match(same.out, /\| `video-1` \| train, val \|/);
    const separate = run([...args, join(base, "separate.csv")]);
    assert.equal(separate.code, 0, separate.out);
    assert.match(separate.out, /No verified group spans multiple splits/);
    const bad = run([...args, join(base, "bad.csv")]);
    assert.equal(bad.code, 1);
    assert.match(bad.err, /needs a header with the columns path,group/);
  });
});

describe("TAO preprocess_parity.py", { skip: skipPython }, () => {
  let base;
  let image;
  let spec;
  const env = () => ({ env: { PYTHONPATH: [base, process.env.PYTHONPATH].filter(Boolean).join(":") } });
  before(async () => {
    requirePython();
    base = join(scratch, "parity");
    await mkdir(base, { recursive: true });
    image = join(base, "sample.png");
    makeImages([{ path: image, noise: 5 }]);
    spec = join(base, "spec.json");
    await writeFile(spec, JSON.stringify({ resize: "stretch", size: [32, 32], scale: 255, mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225] }));
    await writeFile(join(base, "prep.py"), [
      "import numpy as np",
      "from PIL import Image",
      "def train(path):",
      "    return np.asarray(Image.open(path).convert('RGB').resize((32, 32)), dtype=np.float32) / 255.0",
      "def same(path):",
      "    return train(path).copy()",
      "def bgr(path):",
      "    return train(path)[:, :, ::-1].copy()",
      "def small(path):",
      "    return np.asarray(Image.open(path).convert('RGB').resize((16, 16)), dtype=np.float32) / 255.0",
      "",
    ].join("\n"));
  });

  test("spec-only success does not claim that paths agree", () => {
    const result = run([PARITY, "--spec", spec, "--image", image]);
    assert.equal(result.code, 0, result.out + result.err);
    assert.match(result.out, /RESULT: spec self-checks passed\. No train\/eval\/export path comparison was run/);
    assert.doesNotMatch(result.out, /paths agree/);
    assert.doesNotMatch(result.out, /Parity comparison/);
  });

  test("compare mode passes for equal paths and fails for value or shape mismatch", () => {
    const ok = run([PARITY, "--image", image, "--path", "train=prep:train", "--path", "eval=prep:same", "--path", "export=prep:same"], env());
    assert.equal(ok.code, 0, ok.out + ok.err);
    assert.match(ok.out, /\[PASS\] train vs eval/);
    assert.match(ok.out, /\[PASS\] train vs export/);
    assert.match(ok.out, /RESULT: paths agree \(train, eval, export\)/);
    const swapped = run([PARITY, "--image", image, "--path", "train=prep:train", "--path", "export=prep:bgr"], env());
    assert.equal(swapped.code, 1);
    assert.match(swapped.out, /\[FAIL\] train vs export: max abs diff/);
    assert.match(swapped.out, /RGB\/BGR swap/);
    const shape = run([PARITY, "--image", image, "--path", "train=prep:train", "--path", "export=prep:small"], env());
    assert.equal(shape.code, 1);
    assert.match(shape.out, /\[FAIL\] train vs export: shape/);
    const withSpec = run([PARITY, "--spec", spec, "--image", image, "--path", "train=prep:train"], env());
    assert.equal(withSpec.code, 1, "the spec normalizes, the callable does not");
    assert.match(withSpec.out, /\[FAIL\] spec vs train/);
  });

  test("invalid input is rejected instead of comparing fewer paths", () => {
    /** @type {Array<[string[], RegExp]>} */
    const cases = [
      [["--path", "train=prep:train"], /supply --spec, or at least two --path entries/],
      [["--path", "train=prep:train", "--path", "train=prep:same"], /--path names must be non-empty and unique/],
      [["--spec", spec, "--path", "spec=prep:train"], /"spec" is reserved/],
      [["--path", "train=prep:train", "--path", "export"], /must be name=module:attribute/],
      [["--path", "train=prep:train", "--path", "export=missing_module:fn"], /cannot import 'missing_module'/],
    ];
    for (const [args, message] of cases) {
      const result = run([PARITY, "--image", image, ...args], env());
      assert.equal(result.code, 1, args.join(" "));
      assert.match(result.err, message);
    }
  });

  test("every option in the SKILL.md commands exists in the scripts' CLIs", async () => {
    const skill = await read(`${TAO}/SKILL.md`);
    const blocks = [...skill.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1].replace(/\\\n\s*/g, " "));
    let checked = 0;
    for (const [script, path] of [["preprocess_parity.py", PARITY], ["split_leakage_check.py", LEAKAGE]]) {
      const help = run([path, "--help"]).out;
      for (const command of blocks.filter((b) => b.includes(script))) {
        for (const option of command.match(/--[a-z][a-z-]*/g)) {
          assert(help.includes(option), `${script} has no ${option} (SKILL.md: ${command.trim()})`);
          checked++;
        }
      }
    }
    assert(checked >= 6, `only ${checked} options checked`);
    assert.doesNotMatch(skill, /--config|--paths/);
  });
});

describe("Gamedev asset_report.py --max-colors", { skip: skipPython }, () => {
  before(requirePython);
  const palette = (n) => Array.from({ length: n }, (_, i) => [i * 10, 255 - i * 10, (i * 37) % 256]);

  test("limit, limit+1 and more colours are judged correctly; alpha and size checks unchanged", async () => {
    const base = join(scratch, "assets");
    await mkdir(base, { recursive: true });
    makeImages([
      { path: join(base, "four.png"), colors: palette(4) },
      { path: join(base, "five.png"), colors: palette(5) },
      { path: join(base, "seven.png"), colors: palette(7) },
      { path: join(base, "alpha.png"), colors: palette(3).map((c) => [...c, 128]), mode: "RGBA" },
    ]);
    const report = (...args) => {
      const result = run([ASSET, ...args, "--json"]);
      return { code: result.code, json: JSON.parse(result.out) };
    };
    const four = report(join(base, "four.png"), "--max-colors", "4");
    assert.equal(four.code, 0);
    assert.deepEqual([four.json.assets[0].color_count, four.json.assets[0].problems], [4, []]);
    const five = report(join(base, "five.png"), "--max-colors", "4");
    assert.equal(five.code, 1, "exactly limit+1 colours must fail");
    assert.deepEqual([five.json.assets[0].color_count, five.json.assets[0].problems], [5, ["image has more than 4 colors"]]);
    const seven = report(join(base, "seven.png"), "--max-colors", "4");
    assert.equal(seven.code, 1);
    assert.deepEqual([seven.json.assets[0].color_count, seven.json.assets[0].problems], [">4", ["image has more than 4 colors"]]);
    const unlimited = report(join(base, "seven.png"));
    assert.equal(unlimited.code, 0);
    assert.equal(unlimited.json.assets[0].color_count, 7);
    const alpha = report(join(base, "alpha.png"), join(base, "four.png"), "--require-alpha", "--expect-size", "3x1");
    assert.equal(alpha.code, 1);
    assert.deepEqual(alpha.json.assets.map((a) => [a.has_alpha, a.problems]), [[true, []], [false, ["size is 4x1; expected 3x1", "image has no alpha channel"]]]);

    // Negative control: the upstream script passes the limit+1 image.
    const upstream = join(scratch, "asset_report.upstream.py");
    await writeFile(upstream, await upstreamText("vendor/gamedev/skills/disciplines/create-game-assets/scripts/asset_report.py"));
    assert.equal(run([upstream, join(base, "five.png"), "--max-colors", "4"]).code, 0);
  });
});

// ---- Vercel examples: extracted from both the rule files and the compiled AGENTS.md ----

const codeBlocks = (markdown) => [...markdown.matchAll(/```typescript\n([\s\S]*?)```/g)].map((m) => m[1]);
function section(markdown, heading) {
  const start = markdown.indexOf(`\n${heading}\n`);
  assert(start >= 0, `Missing section ${heading}`);
  const end = markdown.indexOf("\n### ", start + heading.length + 2);
  return markdown.slice(start, end < 0 ? undefined : end);
}
const js = (code) => stripTypeScriptTypes(code);

/** Split the "More examples" block into [before, after] pairs and evaluate each with the same inputs. */
function evaluatePairs(block, inputs) {
  const chunks = [];
  let current = null;
  for (const line of block.split("\n")) {
    if (line === "// Before" || line === "// After") chunks.push((current = { kind: line.slice(3), lines: [] }));
    else if (current && !line.startsWith("// ")) current.lines.push(line);
  }
  const results = chunks.map(({ kind, lines }) => {
    const code = lines.join("\n");
    const name = /const (\w+) =/.exec(code)[1];
    return { kind, name, value: new Function(...Object.keys(inputs), `${js(code)}\nreturn ${name}`)(...Object.values(inputs)) };
  });
  return results;
}

async function flatMapDocuments() {
  return [
    ["rules/js-flatmap-filter.md", await read(`${VERCEL}/rules/js-flatmap-filter.md`)],
    ["AGENTS.md 7.11", section(await read(`${VERCEL}/AGENTS.md`), "### 7.11 Use flatMap to Map and Filter in One Pass")],
  ];
}

describe("Vercel flatMap examples", () => {
  const users = [{ isActive: true, name: "Ann" }, { isActive: true, name: "" }, { isActive: false, name: "Bo" }, { isActive: true, name: undefined }, { isActive: true, name: "Cy" }];
  const inputs = {
    users,
    responses: [{ success: true, data: { email: "a@x.test" } }, { success: true, data: { email: "" } }, { success: false, data: { email: "b@x.test" } }, { success: true, data: { email: null } }],
    strings: ["1", "x", "", "3.5", " 7", "0"],
  };

  test("rules and compiled AGENTS.md carry the same corrected code", async () => {
    const [[, rule], [, agents]] = await flatMapDocuments();
    assert.deepEqual(codeBlocks(agents), codeBlocks(rule));
    assert.equal(codeBlocks(rule).length, 3);
  });

  for (const index of [0, 1]) {
    test(`flatMap keeps .filter(Boolean) semantics, including falsy names (${["rule", "AGENTS.md"][index]})`, async () => {
      const [, markdown] = (await flatMapDocuments())[index];
      const [incorrect, correct, more] = codeBlocks(markdown);
      const evaluate = (code) => new Function("users", `${js(code)}\nreturn userNames`)(users);
      assert.deepEqual(evaluate(correct), evaluate(incorrect));
      assert.deepEqual(evaluate(correct), ["Ann", "Cy"]);
      const pairs = evaluatePairs(more, inputs);
      assert.deepEqual(pairs.map((p) => `${p.kind}:${p.name}`), ["Before:emails", "After:emails", "Before:numbers", "After:numbers"]);
      for (let i = 0; i < pairs.length; i += 2) assert.deepEqual(pairs[i + 1].value, pairs[i].value, pairs[i].name);
    });
  }

  test("negative control: the upstream flatMap example keeps an empty name", async () => {
    const [, correct] = codeBlocks(await upstreamText(`${VERCEL}/rules/js-flatmap-filter.md`));
    assert.deepEqual(new Function("users", `${js(correct)}\nreturn userNames`)(users), ["Ann", "", undefined, "Cy"]);
  });
});

function fakeStorage(initial, failures = {}) {
  const data = new Map(Object.entries(initial));
  const fail = (method, key) => {
    const rule = failures[method];
    if (rule === true || (typeof rule === "string" && rule === key)) throw new Error(`${method} failed`);
  };
  return {
    data,
    getItem(key) { fail("getItem", key); return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { fail("setItem", key); data.set(key, String(value)); },
    removeItem(key) { fail("removeItem", key); data.delete(key); },
  };
}

async function storageDocuments() {
  return [
    ["rules/client-localstorage-schema.md", await read(`${VERCEL}/rules/client-localstorage-schema.md`)],
    ["AGENTS.md 4.4", section(await read(`${VERCEL}/AGENTS.md`), "### 4.4 Version and Minimize localStorage Data")],
  ];
}
const migrationBlock = (markdown) => codeBlocks(markdown).find((code) => code.includes("function migrate()"));
const loadMigration = (code, storage) => new Function("localStorage", `${js(code)}\nreturn { saveConfig, loadConfig, migrate }`)(storage);

describe("Vercel localStorage migration", () => {
  const v1 = JSON.stringify({ darkMode: true, lang: "ko" });

  test("rules and compiled AGENTS.md carry the same corrected code", async () => {
    const [[, rule], [, agents]] = await storageDocuments();
    assert.deepEqual(codeBlocks(agents), codeBlocks(rule));
  });

  for (const index of [0, 1]) {
    test(`v1 is removed only after v2 is stored (${["rule", "AGENTS.md"][index]})`, async () => {
      const code = migrationBlock((await storageDocuments())[index][1]);
      const ok = fakeStorage({ "userConfig:v1": v1 });
      loadMigration(code, ok).migrate();
      assert.deepEqual([...ok.data], [["userConfig:v2", JSON.stringify({ theme: "dark", language: "ko" })]]);
      assert.deepEqual(loadMigration(code, ok).loadConfig(), { theme: "dark", language: "ko" });

      /** @type {Array<[string, ReturnType<typeof fakeStorage>, string[][]]>} */
      const failures = [
        ["setItem fails (quota, private mode)", fakeStorage({ "userConfig:v1": v1 }, { setItem: true }), [["userConfig:v1", v1]]],
        ["getItem fails", fakeStorage({ "userConfig:v1": v1 }, { getItem: true }), [["userConfig:v1", v1]]],
        ["v1 is not JSON", fakeStorage({ "userConfig:v1": "{broken" }), [["userConfig:v1", "{broken"]]],
        ["removeItem fails after the v2 write", fakeStorage({ "userConfig:v1": v1 }, { removeItem: true }), [["userConfig:v1", v1], ["userConfig:v2", JSON.stringify({ theme: "dark", language: "ko" })]]],
        ["no v1 data", fakeStorage({}), []],
      ];
      for (const [label, storage, expected] of failures) {
        assert.doesNotThrow(() => loadMigration(code, storage).migrate(), label);
        assert.deepEqual([...storage.data], expected, label);
      }
      assert.equal(loadMigration(code, fakeStorage({}, { setItem: true })).saveConfig({ theme: "dark", language: "ko" }), false);
      assert.equal(loadMigration(code, fakeStorage({})).saveConfig({ theme: "dark", language: "ko" }), true);
    });
  }

  test("negative control: the upstream migration loses v1 when the v2 write fails", async () => {
    const code = migrationBlock(await upstreamText(`${VERCEL}/rules/client-localstorage-schema.md`));
    const storage = fakeStorage({ "userConfig:v1": v1 }, { setItem: true });
    loadMigration(code, storage).migrate();
    assert.deepEqual([...storage.data], []);
  });
});

// ---- Statistics: recomputed from the inputs stated in the corrected documents ----

function betacf(a, b, x) {
  const tiny = 1e-300;
  let c = 1;
  let d = 1 - ((a + b) * x) / (a + 1);
  d = 1 / (Math.abs(d) < tiny ? tiny : d);
  let h = d;
  for (let m = 1; m < 500; m++) {
    const m2 = 2 * m;
    for (const aa of [(m * (b - m) * x) / ((a - 1 + m2) * (a + m2)), (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2))]) {
      d = 1 + aa * d; d = 1 / (Math.abs(d) < tiny ? tiny : d);
      c = 1 + aa / c; c = Math.abs(c) < tiny ? tiny : c;
      h *= d * c;
    }
    if (Math.abs(d * c - 1) < 1e-15) break;
  }
  return h;
}
function lgamma(z) {
  const g = [676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.abs(Math.sin(Math.PI * z))) - lgamma(1 - z);
  z -= 1;
  let x = 0.99999999999980993;
  g.forEach((value, i) => { x += value / (z + i + 1); });
  const t = z + g.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function ibeta(a, b, x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (front * betacf(a, b, x)) / a : 1 - (front * betacf(b, a, 1 - x)) / b;
}
const twoSidedT = (t, df) => ibeta(df / 2, 0.5, df / (df + t * t));
function tQuantile(p, df) {
  let lo = 0;
  let hi = 50;
  for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (twoSidedT(mid, df) > p) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
function erfc(x) {
  // Numerical Recipes erfc approximation, relative error < 1.2e-7.
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return x >= 0 ? r : 2 - r;
}
const upperTail = (z) => 0.5 * erfc(z / Math.SQRT2);
const near = (stated, actual, tolerance, label) => assert(Math.abs(stated - actual) <= tolerance, `${label}: stated ${stated}, computed ${actual}`);
const number = (text, pattern, label) => {
  const match = pattern.exec(text);
  assert(match, `${label} not found`);
  return match.slice(1).map(Number);
};

describe("DMAIC statistical-tools worked example", () => {
  test("Welch t, df, two-sided p, CI, Cohen's d, Ppk and normal tail match the stated inputs", async () => {
    const doc = await read(`${QUALITY}/dmaic/references/statistical-tools.md`);
    const example = doc.slice(doc.indexOf("### Worked example"), doc.indexOf("### Decision rules"));
    const [usl] = number(example, /Ra ≤ ([\d.]+) µm/, "USL");
    const [m1, s1, n1] = number(example, /Current process: Ra mean = ([\d.]+) µm, s = ([\d.]+) µm, n = (\d+)/, "current process");
    const [m2, s2, n2] = number(example, /New coolant: Ra mean = ([\d.]+) µm, s = ([\d.]+) µm, n = (\d+)/, "new coolant");
    const v1 = (s1 * s1) / n1;
    const v2 = (s2 * s2) / n2;
    const se = Math.sqrt(v1 + v2);
    const t = (m1 - m2) / se;
    const df = (v1 + v2) ** 2 / (v1 ** 2 / (n1 - 1) + v2 ** 2 / (n2 - 1));
    const p = twoSidedT(t, df);
    const q = tQuantile(0.05, df);
    assert(p > 0.0228 && p < 0.0229, `computed p ${p}`);

    const [statedSe, statedT, statedDf, statedP] = number(example, /SE = .*?≈ ([\d.]+) µm, t ≈ ([\d.]+), df ≈ ([\d.]+), two-sided p ≈ ([\d.]+)/, "Welch result");
    near(statedSe, se, 0.00005, "SE");
    near(statedT, t, 0.0005, "t");
    near(statedDf, df, 0.05, "df");
    near(statedP, p, 0.0005, "p");
    assert(statedP < 0.05 && /statistically significant at α = 0\.05/.test(example));
    const [quantile, low, high] = number(example, /0\.04 ± ([\d.]+) × [\d.]+ ≈ \[([\d.]+), ([\d.]+)\]/, "95% CI");
    near(quantile, q, 0.0005, "t quantile");
    near(low, m1 - m2 - q * se, 0.0005, "CI low");
    near(high, m1 - m2 + q * se, 0.0005, "CI high");
    const [d] = number(example, /Cohen's d = .*≈ ([\d.]+) —/, "Cohen's d");
    near(d, (m1 - m2) / Math.sqrt((s1 * s1 + s2 * s2) / 2), 0.005, "d");
    const [ppk1, ppk2] = number(example, /Ppk ≈ .*?≈ ([\d.]+) → ([\d.]+)/, "Ppk");
    near(ppk1, (usl - m1) / (3 * s1), 0.005, "Ppk before");
    near(ppk2, (usl - m2) / (3 * s2), 0.005, "Ppk after");
    const [tail1, z1, tail2, z2] = number(example, /from ≈ ([\d.]+)% \(z = ([\d.]+)\) to ≈ ([\d.]+)% \(z ≈ ([\d.]+)\)/, "normal tails");
    near(z1, (usl - m1) / s1, 0.005, "z before");
    near(z2, (usl - m2) / s2, 0.005, "z after");
    near(tail1, 100 * upperTail((usl - m1) / s1), 0.05, "tail before");
    near(tail2, 100 * upperTail((usl - m2) / s2), 0.05, "tail after");
    assert.match(example, /These are model estimates, not observed defect rates/);
    assert.doesNotMatch(doc, /does not change conformance rate|well within specification at 1\.42/);
  });

  test("negative control: the upstream example states p = 0.003", async () => {
    const original = await upstreamText(`${QUALITY}/dmaic/references/statistical-tools.md`);
    const [statedP] = number(original, /n = 200 per group; p = ([\d.]+)/, "upstream p");
    const se = Math.sqrt(0.18 ** 2 / 200 + 0.17 ** 2 / 200);
    assert(Math.abs(statedP - twoSidedT(0.04 / se, 396.7)) > 0.01);
  });

  test("decision rules separate association, practical size and uncertainty", async () => {
    const doc = await read(`${QUALITY}/dmaic/references/statistical-tools.md`);
    const rules = doc.slice(doc.indexOf("### Decision rules"));
    assert.doesNotMatch(rules, /Confirmed: this X is a key driver|Confirmed non-significant; eliminate this X/);
    assert.match(rules, /confirm cause with a controlled change \(DOE or pilot\)/);
    assert.match(rules, /Not demonstrated, not disproven/);
    const skill = await read(`${QUALITY}/dmaic/SKILL.md`);
    assert.doesNotMatch(skill, /Confirm or reject hypotheses statistically/);
    assert.match(skill, /shows an association, not a cause/);
  });
});

describe("8D verification sample", () => {
  const minimum = (p, alpha) => Math.ceil(Math.log(alpha) / Math.log(1 - p));

  test("stated sample sizes are the smallest n with (1-p)^n ≤ α, and fall as p rises", async () => {
    const skill = await read(`${QUALITY}/8d-problem-solving/SKILL.md`);
    const guide = await read(`${QUALITY}/8d-problem-solving/references/d0-d8-guide.md`);
    const pairs = (text) => [...text.matchAll(/(\d+)% → (\d+)/g)].map((m) => /** @type {[number, number]} */ ([Number(m[1]) / 100, Number(m[2])]));
    const stated = pairs(skill);
    stated.push(...pairs(guide));
    const [guideRaw, guideRounded] = number(guide, /defect rate 2% \(p = 0\.02\), α = 0\.05 → n ≥ ([\d.]+), rounded up to (\d+)/, "guide example");
    stated.push([0.02, guideRounded]);
    near(guideRaw, Math.log(0.05) / Math.log(0.98), 0.05, "unrounded n");
    assert(stated.length >= 8, `found ${stated.length} stated sample sizes`);
    for (const [p, n] of stated) {
      assert.equal(n, minimum(p, 0.05), `p = ${p}`);
      assert((1 - p) ** n <= 0.05 && (1 - p) ** (n - 1) > 0.05, `p = ${p}, n = ${n}`);
    }
    const ordered = [...new Map(stated)].sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < ordered.length; i++) assert(ordered[i][1] < ordered[i - 1][1], "higher p needs fewer units");
    for (const text of [skill, guide]) assert.doesNotMatch(text, /higher defect rate[^.]*→ larger sample|Higher defect rate or safety-related failure mode requires a larger/i);
  });

  test("zero recurrence is a one-sided upper bound, not proof of elimination", async () => {
    const skill = await read(`${QUALITY}/8d-problem-solving/SKILL.md`);
    const guide = await read(`${QUALITY}/8d-problem-solving/references/d0-d8-guide.md`);
    const [n, bound] = number(skill, /one-sided 95% upper bound 1 − 0\.05\^\(1\/n\) ≈ 3\/n; 0\/(\d+) → about ([\d.]+)%/, "upper bound");
    near(bound, 100 * (1 - 0.05 ** (1 / n)), 0.005, "0/n upper bound");
    assert.match(guide, /one-sided 95% upper bound of about 3\/n/);
    assert.doesNotMatch(skill, /data confirms the defect is eliminated|verification data confirms zero recurrence/);
    assert.doesNotMatch(guide, /Verification data confirms zero recurrence/);
  });

  test("negative control: the upstream guide states 148 units for p = 2%", async () => {
    const original = await upstreamText(`${QUALITY}/8d-problem-solving/references/d0-d8-guide.md`);
    const [n] = number(original, /α = 0\.05 → n ≥ (\d+) units minimum/, "upstream n");
    assert.notEqual(n, minimum(0.02, 0.05));
    assert(0.98 ** n > 0.05);
  });
});

describe("Root-cause reasoning examples", () => {
  test("an escape at outgoing inspection does not eliminate the gauge hypothesis", async () => {
    const skill = await read(`${QUALITY}/is-is-not-scoping/SKILL.md`);
    assert.doesNotMatch(skill, /if we measure 100%, our gauge would catch it/);
    assert.match(skill, /Not found at our outgoing inspection → \*\*consistent\*\*/);
    assert.match(skill, /seeded defective samples/);
    const reference = await read(`${QUALITY}/is-is-not-scoping/references/hypothesis-elimination.md`);
    const h3 = reference.split("\n").find((line) => line.startsWith("| H3 | Outgoing inspection gauge failure |"));
    assert.match(h3, /\*\*OPEN \(escape cause\)\*\*/);
    assert.doesNotMatch(reference, /Eliminated: \(H3\)|we would not have shipped 0 defectives/);
  });

  test("5-Why reversibility runs from cause to effect and promises no permanent prevention", async () => {
    const skill = await read(`${QUALITY}/5why-root-cause/SKILL.md`);
    assert.match(skill, /"Because \[Why N\+1\], therefore \[Why N\]"/);
    assert.match(skill, /"Because \[Why 5\], therefore \[Why 4\]/);
    assert.doesNotMatch(skill, /Because \[Why N\], therefore \[Why N\+1\]|prevent the defect from ever recurring/);
  });

  test("a single-shift pattern stays a hypothesis", async () => {
    const skill = await read(`${QUALITY}/fishbone-analysis/SKILL.md`);
    assert.doesNotMatch(skill, /single-shift → operator-specific\)/);
    assert.match(skill, /single-shift → a shift-related hypothesis, not yet an operator cause/);
  });
});

// ---- Patch mechanics ----

describe("Vendor patches", () => {
  test("every corrected file reverses to its recorded upstream bytes", async () => {
    assert.deepEqual(await verifyPatches(root, sources, integrity.files), []);
    assert.equal(integrity.files.filter((f) => f.patch).length, patches.flatMap((p) => p.files).length);
    for (const file of patches.flatMap((p) => p.files)) {
      const text = await read(file.vendorPath);
      assert.match(text, /Modified by pi-workbench/, file.vendorPath);
    }
    for (const path of ["scripts/split_leakage_check.py", "scripts/preprocess_parity.py"]) {
      assert.match(await read(`${TAO}/${path}`), /SPDX-License-Identifier: Apache-2.0\n# Modified by pi-workbench/);
    }
  });

  test("the apply CLI reproduces the corrected files and refuses a second application", async () => {
    const base = join(scratch, "apply");
    for (const { sourceId, patch, files } of patches) {
      const directory = join(base, sourceId);
      for (const file of files) {
        await mkdir(dirname(join(directory, file.path)), { recursive: true });
        await writeFile(join(directory, file.path), await upstreamText(file.vendorPath));
      }
      const first = spawnSync("node", [join(root, "scripts/vendor_patches.mjs"), "apply", directory, join(root, patch)], { encoding: "utf8" });
      assert.equal(first.status, 0, first.stderr);
      assert.deepEqual(JSON.parse(first.stdout).sort(), files.map((f) => f.path).sort());
      for (const file of files) assert.equal(await readFile(join(directory, file.path), "utf8"), await read(file.vendorPath));
      const again = spawnSync("node", [join(root, "scripts/vendor_patches.mjs"), "apply", directory, join(root, patch)], { encoding: "utf8" });
      assert.notEqual(again.status, 0, `${patch} applied twice`);
    }
  });

  test("tampered files, manifests or patches fail verification", async () => {
    const base = join(scratch, "tamper");
    await cp(join(root, "patches"), join(base, "patches"), { recursive: true });
    for (const file of patches.flatMap((p) => p.files)) await cp(join(root, file.vendorPath), join(base, file.vendorPath));
    const entries = () => integrity.files.map((f) => structuredClone(f));
    assert.deepEqual(await verifyPatches(base, sources, entries()), []);

    const target = "vendor/gamedev/skills/disciplines/create-game-assets/scripts/asset_report.py";
    const original = await readFile(join(base, target), "utf8");
    await writeFile(join(base, target), original.replace("def parse_size", "def parse_size_"));
    assert.match((await verifyPatches(base, sources, entries())).join("\n"), /asset_report\.py: reversing .* upstream sha256/);
    await writeFile(join(base, target), original.replace("or report[\"color_count\"] > args.max_colors", "or True"));
    assert.match((await verifyPatches(base, sources, entries())).join("\n"), /asset_report\.py: Hunk @@ \d+ does not match/);
    await writeFile(join(base, target), original);

    const wrongUpstream = entries();
    wrongUpstream.find((f) => f.path === target).upstream.gitBlob = "0".repeat(40);
    assert.match((await verifyPatches(base, sources, wrongUpstream)).join("\n"), /upstream gitBlob/);
    const unlisted = entries();
    delete unlisted.find((f) => f.path === target).patch;
    assert.match((await verifyPatches(base, sources, unlisted)).join("\n"), /must record patch/);
    const stray = entries();
    Object.assign(stray.find((f) => f.path.endsWith("asset_report.py") === false && !f.patch), { patch: "patches/x.patch", upstream: {} });
    assert.match((await verifyPatches(base, sources, stray)).join("\n"), /records a patch that no listed patch changes/);

    const patchPath = join(base, "patches/gamedev/0001-asset-report-max-colors-boundary.patch");
    const patchText = await readFile(patchPath, "utf8");
    await writeFile(patchPath, patchText.replace(/\n@@ -100,7 \+103,9 @@[\s\S]*$/, "\n"));
    assert.match((await verifyPatches(base, sources, entries())).join("\n"), /asset_report\.py: reversing .* upstream/);
  });

  test("the parser rejects malformed or unsafe patches", () => {
    assert.throws(() => parsePatch("--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n a\n"), /Truncated hunk/);
    assert.throws(() => parsePatch("--- a/../x\n+++ b/../x\n@@ -1 +1 @@\n-a\n+b\n"), /Unsafe patch path/);
    assert.throws(() => parsePatch("--- a/x\n+++ b/y\n@@ -1 +1 @@\n-a\n+b\n"), /Renames are not supported/);
    const [file] = parsePatch("--- a/x\n+++ b/x\n@@ -1,2 +1,2 @@\n a\n-b\n+c\n\\ No newline at end of file\n");
    assert.equal(applyFilePatch("a\nb\n", file), "a\nc");
    assert.equal(applyFilePatch("a\nc", file, { reverse: true }), "a\nb\n");
    assert.throws(() => applyFilePatch("a\nc", file), /does not match/);
    assert.throws(() => applyFilePatch("z\nb\n", file), /does not match/);
  });
});
