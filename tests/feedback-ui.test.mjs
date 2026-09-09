import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/components/LearningApp.tsx", import.meta.url), "utf8");

test("运行反馈标明来源、严重程度、可确定行号并提示旧结果过期", () => {
  assert.match(source, /来源：\{result\.executionFailure/);
  assert.match(source, /严重程度：\{result\.executionFailure/);
  assert.match(source, /位置：第 \$\{result\.exception\.line\} 行/);
  assert.match(source, /代码已修改，上一次运行结果已过期/);
});
