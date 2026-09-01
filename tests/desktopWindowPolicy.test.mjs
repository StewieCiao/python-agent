import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { test } from "node:test";

async function loadPolicy() {
  try {
    return await import("../desktop/src/securityPolicy.mts");
  } catch (error) {
    assert.fail(`桌面安全策略尚未实现：${error?.code || error?.message}`);
  }
}

test("桌面只信任应用协议和当前 Vite 开发源", async () => {
  const { createDesktopSecurityPolicy } = await loadPolicy();
  const production = createDesktopSecurityPolicy();
  const development = createDesktopSecurityPolicy("http://127.0.0.1:5173");

  assert.equal(production.allowsRendererUrl("stewie://app/index.html"), true);
  assert.equal(production.allowsRendererUrl("stewie://app/assets/main.js"), true);
  assert.equal(production.allowsRendererUrl("stewie://other/index.html"), false);
  assert.equal(production.allowsRendererUrl("file:///Users/example/.ssh/id_rsa"), false);
  assert.equal(production.allowsRendererUrl("https://example.com/"), false);

  assert.equal(development.allowsRendererUrl("http://127.0.0.1:5173/src/renderer.tsx"), true);
  assert.equal(development.allowsRendererUrl("http://127.0.0.1:5174/"), false);
  assert.equal(development.allowsRendererUrl("http://localhost:5173/"), false);
});

test("IPC 只接受可信主框架，子框架和远程页面不能调用桌面能力", async () => {
  const { createDesktopSecurityPolicy } = await loadPolicy();
  const policy = createDesktopSecurityPolicy();

  assert.equal(policy.allowsIpcSender("stewie://app/index.html", true), true);
  assert.equal(policy.allowsIpcSender("stewie://app/index.html", false), false);
  assert.equal(policy.allowsIpcSender("https://example.com/", true), false);
});

test("权限预检查和权限请求都被明确拒绝", async () => {
  const { createDesktopSecurityPolicy } = await loadPolicy();
  const policy = createDesktopSecurityPolicy();
  let requestDecision = null;

  assert.equal(policy.permissionCheckHandler(), false);
  policy.permissionRequestHandler(null, null, (allowed) => {
    requestDecision = allowed;
  });
  assert.equal(requestDecision, false);
});

test("生产窗口关闭 Node 能力并启用上下文隔离和沙箱", async () => {
  const { createWindowOptions } = await loadPolicy();
  const options = createWindowOptions("/Applications/Stewie LearnOS/preload.js", true);

  assert.equal(options.webPreferences.preload, "/Applications/Stewie LearnOS/preload.js");
  assert.equal(options.webPreferences.nodeIntegration, false);
  assert.equal(options.webPreferences.nodeIntegrationInWorker, false);
  assert.equal(options.webPreferences.contextIsolation, true);
  assert.equal(options.webPreferences.sandbox, true);
  assert.equal(options.webPreferences.webviewTag, false);
  assert.equal(options.webPreferences.webSecurity, true);
  assert.equal(options.webPreferences.allowRunningInsecureContent, false);
  assert.equal(options.webPreferences.devTools, false);
});

test("应用协议只能解析 renderer 根目录内的文件", async () => {
  const { resolveAppAsset } = await loadPolicy();
  const root = resolve("virtual-renderer");

  assert.equal(resolveAppAsset(root, "stewie://app/"), join(root, "index.html"));
  assert.equal(resolveAppAsset(root, "stewie://app/assets/main.js"), join(root, "assets", "main.js"));
  assert.throws(
    () => resolveAppAsset(root, "stewie://app/%2e%2e/secrets.txt"),
    /应用资源路径无效/,
  );
  assert.throws(
    () => resolveAppAsset(root, "stewie://other/index.html"),
    /应用资源地址无效/,
  );
});
