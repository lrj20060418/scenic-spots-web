import fs from "node:fs";
import path from "node:path";

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function isFiniteNumber(v) {
  return typeof v === "number" && Number.isFinite(v);
}

const repoRoot = process.cwd();
const jsonPath = fs.existsSync(path.join(repoRoot, "src", "spots.json"))
  ? path.join(repoRoot, "src", "spots.json")
  : path.join(repoRoot, "spots.json");

if (!fs.existsSync(jsonPath)) {
  fail(`找不到 spots.json：${jsonPath}`);
  process.exit(1);
}

let raw = "";
try {
  raw = fs.readFileSync(jsonPath, "utf8");
} catch (e) {
  fail(`读取 spots.json 失败：${e?.message ?? e}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  fail(`spots.json 不是合法 JSON：${e?.message ?? e}`);
  process.exit(1);
}

const spots = data?.spots;
if (!Array.isArray(spots)) {
  fail("spots.json 结构不符合预期：缺少 spots 数组");
  process.exit(1);
}

ok(`读取 spots.json 成功，共 ${spots.length} 条`);

const ids = new Set();
for (let i = 0; i < spots.length; i++) {
  const s = spots[i];
  const prefix = `spots[${i}]`;

  if (!isNonEmptyString(s?.id)) fail(`${prefix}.id 缺失或为空`);
  if (!isNonEmptyString(s?.name)) fail(`${prefix}.name 缺失或为空`);
  if (!isNonEmptyString(s?.city)) fail(`${prefix}.city 缺失或为空`);
  if (!Array.isArray(s?.tags)) fail(`${prefix}.tags 不是数组`);
  if (!isFiniteNumber(s?.rating)) fail(`${prefix}.rating 不是数字`);
  if (!isFiniteNumber(s?.price)) fail(`${prefix}.price 不是数字`);
  if (!isNonEmptyString(s?.open_time)) fail(`${prefix}.open_time 缺失或为空`);
  if (!isFiniteNumber(s?.visit_minutes)) fail(`${prefix}.visit_minutes 不是数字`);
  if (!isNonEmptyString(s?.description)) fail(`${prefix}.description 缺失或为空`);
  if (!isNonEmptyString(s?.image)) fail(`${prefix}.image 缺失或为空`);

  if (isNonEmptyString(s?.id)) {
    if (ids.has(s.id)) fail(`${prefix}.id 重复：${s.id}`);
    ids.add(s.id);
  }

  if (isNonEmptyString(s?.image)) {
    const imgPath = path.join(repoRoot, s.image);
    if (!fs.existsSync(imgPath)) fail(`${prefix}.image 文件不存在：${s.image}`);
  }
}

if (process.exitCode === 1) {
  fail("校验未通过：请修复 spots.json 或缺失的图片资源");
} else {
  ok("校验通过：spots.json 字段与图片路径基本正常");
}

