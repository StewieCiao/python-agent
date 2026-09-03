import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projects = [
  ["private-rag-study-assistant", /资料不足/, /recall@k/],
  ["recoverable-research-graph", /thread_id/, /interrupt/],
  ["adaptive-python-coach", /mistake code/, /4 秒超时/],
];

test("三项简历项目都有可复现 README 和成功/失败演示", async () => {
  for (const [directory, userStory, evidence] of projects) {
    const path = new URL(`../projects/${directory}/README.md`, import.meta.url);
    await access(path);
    const readme = await readFile(path, "utf8");
    assert.match(readme, /## 用户故事/);
    assert.match(readme, /## 演示脚本/);
    assert.match(readme, /## 已知限制/);
    assert.match(readme, userStory);
    assert.match(readme, evidence);
  }
});
