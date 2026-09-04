import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const projects = [
  ["private-rag-study-assistant", /资料不足/, /recall@k/],
  ["recoverable-research-graph", /thread_id/, /interrupt/],
  ["adaptive-python-coach", /mistake code/, /4 秒超时/],
  ["rag-quality-workbench", /引用覆盖/, /no_results/],
  ["supervisor-research-graph", /角色路由/, /未知角色/],
  ["agentic-rag-router", /检索工具/, /资料不足/],
  ["mini-agent-framework", /工具注册/, /max_steps/],
];

test("简历项目都有可复现 README 和成功/失败演示", async () => {
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

test("RAG Quality Workbench 的演示包含重排与 top_k 验收", async () => {
  const readme = await readFile(new URL("../projects/rag-quality-workbench/README.md", import.meta.url), "utf8");
  assert.match(readme, /重排/);
  assert.match(readme, /top_k/);
  assert.match(readme, /retrieve → threshold → rerank → cite → evaluate/);
});

test("需要 LangGraph 的项目明确使用随仓库提供的运行时", async () => {
  const readme = await readFile(new URL("../projects/recoverable-research-graph/README.md", import.meta.url), "utf8");
  assert.match(readme, /npm run prepare:python-runtime/);
  assert.match(readme, /desktop\/\.runtime\/python\/bin\/python3\.13/);
  assert.match(readme, /不需要另外安装 LangGraph/);
});

test("零部署指南明确离线、Pages 与桌面版的安全边界", async () => {
  const guide = await readFile(new URL("../docs/zero-deploy.md", import.meta.url), "utf8");
  assert.match(guide, /双击打开/);
  assert.match(guide, /不加载外部脚本/);
  assert.match(guide, /不会请求或保存 API Key/);
  assert.match(guide, /macOS 使用钥匙串/);
  assert.match(guide, /Windows 使用 DPAPI/);
  assert.match(guide, /prepare:python-runtime/);
  assert.match(guide, /desktop\/\.runtime\/python\/bin\/python3\.13/);
});
