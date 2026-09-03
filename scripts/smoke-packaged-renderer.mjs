import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer as createHttpServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { packagedExecutablePath } from "./desktopPackagePaths.mjs";

const READY_TIMEOUT_MS = 30_000;
const RUN_TIMEOUT_MS = 12_000;
// Windows packaged Electron may spend several seconds loading the bundled
// renderer before its first Runtime.evaluate response; keep the overall
// readiness deadline separate while allowing one real probe to finish.
const IO_TIMEOUT_MS = 20_000;

function withTimeout(promise, label, timeoutMs = IO_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}（等待 ${timeoutMs / 1000} 秒后超时）`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function reservePort() {
  const server = createNetServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("无法分配 renderer smoke 调试端口");
  }
  await new Promise((resolve) => server.close(resolve));
  return address.port;
}

async function startModelServer() {
  const requests = [];
  const server = createHttpServer(async (request, response) => {
    let body = "";
    for await (const chunk of request) body += chunk;
    requests.push({
      url: request.url,
      authorization: request.headers.authorization,
      body: JSON.parse(body),
    });
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [{ message: { role: "assistant", content: "PACKAGED_OK" } }],
    }));
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("无法启动模型 smoke 服务");
  }
  return {
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
    requests,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

async function waitFor(probe, label, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await withTimeout(
      Promise.resolve().then(probe),
      `${label}的状态检查未返回`,
      Math.min(IO_TIMEOUT_MS, deadline - Date.now()),
    );
    if (value) return value;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${label}（等待 ${timeoutMs / 1000} 秒后超时）`);
}

function createCdpClient(socket) {
  let nextId = 1;
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    let message;
    try {
      message = JSON.parse(String(event.data));
    } catch (error) {
      for (const request of pending.values()) {
        clearTimeout(request.timer);
        request.reject(new Error(`CDP 返回了无效 JSON：${error instanceof Error ? error.message : String(error)}`));
      }
      pending.clear();
      return;
    }
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  socket.addEventListener("close", () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error("CDP 连接在响应前关闭"));
    }
    pending.clear();
  });

  return function send(method, params = {}) {
    const id = nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP ${method} 未返回（等待 ${IO_TIMEOUT_MS / 1000} 秒后超时）`));
      }, IO_TIMEOUT_MS);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });
  };
}

function setCodeExpression(code) {
  return `(() => {
    const editor = document.querySelector('[aria-label="Python 代码编辑器"]');
    if (!(editor instanceof HTMLTextAreaElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(editor, ${JSON.stringify(code)});
    editor.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`;
}

function clickButtonExpression(label) {
  return `(() => {
    const button = [...document.querySelectorAll('button')]
      .find((item) => item.textContent.trim().includes(${JSON.stringify(label)}));
    if (!button || button.disabled) return false;
    button.click();
    return true;
  })()`;
}

function setLabeledInputExpression(label, value) {
  return `(() => {
    const field = [...document.querySelectorAll('label')]
      .find((item) => item.textContent.trim().startsWith(${JSON.stringify(label)}))
      ?.querySelector('input');
    if (!(field instanceof HTMLInputElement)) return false;
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(field, ${JSON.stringify(value)});
    field.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`;
}

const executable = process.env.STEWIE_PACKAGED_EXECUTABLE || resolve(packagedExecutablePath(process.platform, process.arch));
const port = await reservePort();
const modelServer = await startModelServer();
const userDataDirectory = await mkdtemp(join(tmpdir(), "stewie-renderer-smoke-"));
const stderr = [];
let child;
let childFailure = null;
let childExitState = null;
let childStopped;

function launchChild() {
  childFailure = null;
  childExitState = null;
  child = spawn(executable, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDirectory}`,
    "--no-first-run",
  ], { stdio: ["ignore", "ignore", "pipe"] });
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => stderr.push(chunk));
  childStopped = new Promise((resolve) => {
    child.once("error", (error) => {
      childFailure = error;
      resolve();
    });
    child.once("exit", (code, signal) => {
      childExitState = { code, signal };
      resolve();
    });
  });
}

launchChild();

let socket;
try {
  async function connectRenderer() {
    const page = await waitFor(async () => {
    if (childFailure) throw new Error(`打包应用无法启动：${childFailure.message}`);
    if (childExitState) {
      throw new Error(`打包应用提前退出：code=${childExitState.code}, signal=${childExitState.signal ?? "none"}`);
    }
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`, {
        signal: AbortSignal.timeout(IO_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const targets = await response.json();
      return targets.find((target) => target.type === "page" && target.url === "stewie://app/index.html") ?? null;
    } catch {
      return null;
    }
    }, "未找到打包后的 stewie://app 页面", READY_TIMEOUT_MS);

    socket = new WebSocket(page.webSocketDebuggerUrl);
    await withTimeout(
      new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      }),
      "CDP WebSocket 未连接",
    );
    const cdpSend = createCdpClient(socket);
    await cdpSend("Runtime.enable");
    return cdpSend;
  }

  let send = await connectRenderer();

  let evaluate = async function evaluateExpression(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  }

  async function waitForText(text, timeoutMs = RUN_TIMEOUT_MS) {
    return waitFor(
      () => evaluate(`document.body?.textContent.includes(${JSON.stringify(text)}) ?? false`),
      `页面没有出现“${text}”`,
      timeoutMs,
    );
  }

  async function setCodeAndRun(code) {
    if (!await evaluate(setCodeExpression(code))) throw new Error("找不到 Python 代码编辑器");
    if (!await evaluate(clickButtonExpression("运行代码"))) throw new Error("Python 运行按钮不可用");
  }

  await waitForText("Python 314.0.3 就绪", READY_TIMEOUT_MS);
  if (!await evaluate(clickButtonExpression("Python"))) throw new Error("无法切换到 Python 课程");
  if (!await evaluate(clickButtonExpression("让 Python 开口"))) throw new Error("无法打开第一节 Python 课程");

  await setCodeAndRun('print("我的第一段 Python")\nprint(8 * 7)');
  await waitForText("全部通过 · 可以进入下一关");
  await new Promise((resolve) => setTimeout(resolve, 500));

  const persistedAfterRun = await evaluate(`window.stewie.getLearningState()`);
  if (!persistedAfterRun?.ok || !persistedAfterRun.value?.completed?.includes("first-output")) {
    throw new Error(`打包应用没有把完成进度写入 SQLite：${JSON.stringify(persistedAfterRun)}`);
  }
  if (!await evaluate(setCodeExpression("draft-first"))) throw new Error("无法写入第一版草稿");
  if (!await evaluate(setCodeExpression("draft-latest"))) throw new Error("无法写入最新草稿");

  void send("Browser.close").catch(() => undefined);
  await withTimeout(childStopped, "打包应用关闭握手未完成", READY_TIMEOUT_MS);
  socket?.close();
  socket = null;
  launchChild();
  send = await connectRenderer();
  evaluate = async function evaluateAfterRestart(expression) {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };
  await waitForText("Python 314.0.3 就绪", READY_TIMEOUT_MS);
  const restoredState = await evaluate(`window.stewie.getLearningState()`);
  if (
    !restoredState?.ok ||
    !restoredState.value?.completed?.includes("first-output") ||
    restoredState.value?.drafts?.["first-output"] !== "draft-latest"
  ) {
    throw new Error(`重启后未恢复 SQLite 学习状态：${JSON.stringify(restoredState)}`);
  }
  if (!await evaluate(clickButtonExpression("Python"))) throw new Error("重启后无法切换到 Python 课程");
  if (!await evaluate(clickButtonExpression("让 Python 开口"))) throw new Error("重启后无法打开第一节 Python 课程");

  const chatMessage = { role: "user", content: "smoke", createdAt: new Date().toISOString() };
  const unrelatedMessage = { role: "assistant", content: "unrelated", createdAt: new Date().toISOString() };
  const appendCurrent = await evaluate(`window.stewie.appendChatMessages("python", "chat-smoke", [${JSON.stringify(chatMessage)}])`);
  const appendUnrelated = await evaluate(`window.stewie.appendChatMessages("python", "other-lesson", [${JSON.stringify(unrelatedMessage)}])`);
  if (!appendCurrent?.ok || !appendUnrelated?.ok) throw new Error("打包应用聊天写入失败");
  const unrelatedBeforeClear = await evaluate(`window.stewie.listChatMessages("python", "other-lesson")`);
  if (!unrelatedBeforeClear?.ok || unrelatedBeforeClear.value.length !== 1 || unrelatedBeforeClear.value[0].content !== "unrelated") {
    throw new Error(`聊天记录未按关卡隔离：${JSON.stringify(unrelatedBeforeClear)}`);
  }
  const cleared = await evaluate(`window.stewie.clearChatMessages("python", "chat-smoke")`);
  if (!cleared?.ok || !cleared.value?.cleared) throw new Error(`聊天记录清除失败：${JSON.stringify(cleared)}`);
  const currentAfterClear = await evaluate(`window.stewie.listChatMessages("python", "chat-smoke")`);
  const unrelatedAfterClear = await evaluate(`window.stewie.listChatMessages("python", "other-lesson")`);
  if (!currentAfterClear?.ok || currentAfterClear.value.length !== 0) throw new Error(`当前聊天记录未清空：${JSON.stringify(currentAfterClear)}`);
  if (!unrelatedAfterClear?.ok || unrelatedAfterClear.value.length !== 1 || unrelatedAfterClear.value[0].content !== "unrelated") {
    throw new Error(`清除聊天记录影响了其他关卡：${JSON.stringify(unrelatedAfterClear)}`);
  }

  await setCodeAndRun("if True");
  await waitForText("SyntaxError · 第 1 行");

  await setCodeAndRun('print("x")');
  await waitForText("项测试未通过");

  await setCodeAndRun("while True:\n    pass");
  await waitForText("执行超时", RUN_TIMEOUT_MS);
  await waitForText("Python 314.0.3 就绪", READY_TIMEOUT_MS);

  await setCodeAndRun('print("我的第一段 Python")\nprint(8 * 7)');
  await waitForText("全部通过 · 可以进入下一关");

  if (!await evaluate(clickButtonExpression("模型设置"))) throw new Error("无法打开模型设置");
  await waitForText("OpenAI-compatible 配置");
  for (const [label, value] of [
    ["配置 ID", "renderer-smoke"],
    ["显示名称", "Renderer Smoke"],
    ["Base URL", modelServer.baseUrl],
    ["模型名称", "mock-model"],
    ["Temperature", "0"],
    ["Max tokens", "64"],
    ["超时（毫秒）", "5000"],
    ["API Key", "sk-renderer-smoke"],
  ]) {
    if (!await evaluate(setLabeledInputExpression(label, value))) {
      throw new Error(`找不到模型配置字段：${label}`);
    }
  }
  if (!await evaluate(clickButtonExpression("保存配置"))) throw new Error("模型配置保存按钮不可用");
  await waitFor(
    () => evaluate(`document.body.textContent.includes("配置已保存") || document.body.textContent.includes("系统安全存储写入失败")`),
    "模型配置没有返回明确结果",
    RUN_TIMEOUT_MS,
  );
  const passwordValue = await evaluate(`([...document.querySelectorAll('label')]
    .find((item) => item.textContent.trim().startsWith("API Key"))
    ?.querySelector('input')?.value) ?? null`);
  if (passwordValue !== "") throw new Error("API Key 输入框在提交后没有立即清空");

  const profileList = await evaluate(`window.stewie.listModelProfiles()`);
  if (profileList?.ok && profileList.value.some((profile) => profile.id === "renderer-smoke")) {
    if (/sk-renderer-smoke|apiKeyCiphertext/.test(JSON.stringify(profileList))) {
      throw new Error("打包应用把 API Key 或密文返回给了 renderer");
    }
    const modelReply = await evaluate(`window.stewie.testModelProfile("renderer-smoke")`);
    if (!modelReply?.ok || modelReply.value?.reply !== "PACKAGED_OK") {
      throw new Error(`打包应用模型请求失败：${JSON.stringify(modelReply)}`);
    }
    if (
      modelServer.requests.length !== 1 ||
      modelServer.requests[0].authorization !== "Bearer sk-renderer-smoke" ||
      modelServer.requests[0].url !== "/v1/chat/completions"
    ) {
      throw new Error(`打包应用模型请求合同不符：${JSON.stringify(modelServer.requests)}`);
    }
    process.stdout.write("packaged renderer smoke: Python execution/recovery and secure model request passed\n");
  } else {
    const visibleFailure = await evaluate(`document.body.textContent.includes("系统安全存储写入失败")`);
    if (!visibleFailure || modelServer.requests.length !== 0 || profileList?.value?.some((profile) => profile.id === "renderer-smoke")) {
      throw new Error(`打包应用模型配置失败路径不明确：${JSON.stringify(profileList)}`);
    }
    process.stdout.write("packaged renderer smoke: Python passed; secure storage failure is visible and leaves no partial profile\n");
  }
} catch (error) {
  const processError = stderr.join("").trim();
  throw new Error(`${error instanceof Error ? error.message : String(error)}${processError ? `\nElectron stderr:\n${processError}` : ""}`);
} finally {
  socket?.close();
  if (child.pid && child.exitCode === null && child.signalCode === null) {
    child.kill();
    const stoppedGracefully = await Promise.race([
      childStopped.then(() => true),
      new Promise((resolve) => setTimeout(() => resolve(false), 2_000)),
    ]);
    if (!stoppedGracefully) {
      child.kill("SIGKILL");
      await withTimeout(childStopped, "无法强制终止打包应用");
    }
  }
  await withTimeout(
    rm(userDataDirectory, { recursive: true, force: true }),
    "无法清理 renderer smoke 临时目录",
  );
  await withTimeout(modelServer.close(), "无法停止模型 smoke 服务");
}
