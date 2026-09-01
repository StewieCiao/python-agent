import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createRunSnapshot,
  snapshotMatches,
} from "../app/lib/runSnapshot.mjs";

test("运行快照复制关卡数据，不随原对象变化", () => {
  const lesson = {
    id: "lesson-1",
    title: "变量",
    goal: "理解变量",
    requirements: ["创建 name"],
  };
  const snapshot = createRunSnapshot({
    token: "run-1",
    lesson,
    code: 'name = "小派"',
    attemptedHints: ["字符串需要引号"],
  });
  lesson.requirements[0] = "被外部修改";
  assert.equal(snapshot.requirements[0], "创建 name");
  assert.equal(snapshot.attemptedHints[0], "字符串需要引号");
  assert.equal(snapshotMatches(snapshot, "lesson-1", 'name = "小派"'), true);
  assert.equal(snapshotMatches(snapshot, "lesson-2", 'name = "小派"'), false);
  assert.equal(snapshotMatches(snapshot, "lesson-1", 'name = "其他"'), false);
});

test("Python 只在 Worker 中执行，并使用单一锁定来源", async () => {
  const workerSource = await readFile(
    new URL("../public/python-worker.js", import.meta.url),
    "utf8",
  );
  const learningAppSource = await readFile(
    new URL("../app/components/LearningApp.tsx", import.meta.url),
    "utf8",
  );
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const prepareSource = await readFile(
    new URL("../scripts/prepare-pyodide.mjs", import.meta.url),
    "utf8",
  );

  assert.equal(packageJson.dependencies.pyodide, "314.0.3");
  assert.match(workerSource, /const PYODIDE_VERSION = "314\.0\.3"/);
  assert.match(workerSource, /from "\/pyodide\/pyodide\.mjs"/);
  assert.match(workerSource, /new URL\("\/pyodide\/", self\.location\.origin\)/);
  assert.doesNotMatch(workerSource, /https?:\/\/|unpkg|cdnjs|jsdelivr|fallback/i);
  assert.match(workerSource, /runtime\.runPythonAsync\(PYTHON_HARNESS\)/);
  assert.doesNotMatch(learningAppSource, /\.runPythonAsync\(/);
  assert.match(learningAppSource, /new Worker\(pythonWorkerUrl\(\), \{ type: "module" \}\)/);
  assert.match(learningAppSource, /const EXECUTION_TIMEOUT_MS = 4_000/);
  assert.match(learningAppSource, /worker\.terminate\(\)/);
  assert.match(learningAppSource, /ExecutionTimeout/);
  assert.match(prepareSource, /const EXPECTED_VERSION = "314\.0\.3"/);
  assert.match(prepareSource, /pyodide\.asm\.wasm/);
  assert.match(prepareSource, /python_stdlib\.zip/);
});

test("可信测试辅助名仅在学习者代码执行后注入独立命名空间", async () => {
  const workerSource = await readFile(
    new URL("../public/python-worker.js", import.meta.url),
    "utf8",
  );
  const learnerNamespace = workerSource.indexOf(
    '_learner_namespace = {"__name__": "__main__"}',
  );
  const learnerExec = workerSource.indexOf(
    "exec(_compiled, _learner_namespace, _learner_namespace)",
  );
  const testNamespace = workerSource.indexOf(
    "_test_namespace = _learner_namespace.copy()",
  );
  const trustedInjection = workerSource.indexOf("_test_namespace.update({");

  assert.ok(learnerNamespace >= 0);
  assert.ok(learnerExec > learnerNamespace);
  assert.ok(testNamespace > learnerExec);
  assert.ok(trustedInjection > testNamespace);
});

test("页面没有旧执行入口，超时文案不会伪装成测试失败", async () => {
  const learningAppSource = await readFile(
    new URL("../app/components/LearningApp.tsx", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(learningAppSource, /initializeRuntime/);
  assert.match(
    learningAppSource,
    /本次执行已超时，测试未运行；Python Worker 正在从同一锁定版本重新加载。/,
  );
  assert.match(learningAppSource, /snapshotMatches\(snapshot, currentLessonIdRef\.current, codeRef\.current\)/);
});
