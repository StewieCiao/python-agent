import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadPyodide } from "pyodide";
import { lessons } from "../app/lib/curriculum.ts";

const workerSource = await readFile(
  new URL("../public/python-worker.js", import.meta.url),
  "utf8",
);
const harnessMatch = workerSource.match(
  /const PYTHON_HARNESS = String\.raw`([\s\S]*?)`;/,
);
assert.ok(harnessMatch, "应能读取 Worker 使用的真实 Python harness");

const harness = harnessMatch[1];
const runtime = await loadPyodide();
const firstLesson = lessons[0];

async function execute(code) {
  runtime.globals.set("__learner_code", code);
  runtime.globals.set(
    "__lesson_tests_json",
    JSON.stringify(firstLesson.tests),
  );
  return JSON.parse(await runtime.runPythonAsync(harness));
}

test("第一关接受无中英文空格与 8*7 紧凑写法", async () => {
  const result = await execute(
    'print("我的第一段Python")\nprint(8*7)\n',
  );
  assert.equal(result.exception, null);
  assert.deepEqual(
    result.tests.map((item) => item.passed),
    [true, true],
  );
});

test("第一关接受中英文空格与 7*8 交换乘数写法", async () => {
  const result = await execute(
    'print("我的第一段 Python")\nprint(7 * 8)\n',
  );
  assert.deepEqual(
    result.tests.map((item) => item.passed),
    [true, true],
  );
});

test("文字模糊规则只忽略 Python 前的空格，不吞掉其他文字错误", async () => {
  const result = await execute(
    'print("我的 第 一段Python")\nprint(8 * 7)\n',
  );
  assert.equal(result.tests[0].passed, false);
  assert.equal(result.tests[0].actual, "我的 第 一段Python");
  assert.equal(result.tests[0].expected, "我的第一段 Python");
  assert.equal(result.tests[0].rule, "只忽略中文与 Python 之间的空格");
});

test("直接打印 56 不冒充乘法练习，并返回清晰的实际与期望", async () => {
  const result = await execute(
    'print("我的第一段Python")\nprint(56)\n',
  );
  assert.equal(result.tests[1].passed, false);
  assert.equal(result.tests[1].actual, "56");
  assert.equal(result.tests[1].expected, "56（由乘法表达式计算）");
  assert.match(result.tests[1].detail, /乘法/);
});

test("乘法结果错误时反馈精确到第二行输出", async () => {
  const result = await execute(
    'print("我的第一段 Python")\nprint(6*9)\n',
  );
  assert.equal(result.tests[1].passed, false);
  assert.equal(result.tests[1].actual, "54");
  assert.equal(result.tests[1].expected, "56（由乘法表达式计算）");
  assert.match(result.tests[1].rule, /8\*7、7\*8/);
});
