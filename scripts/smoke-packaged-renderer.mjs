import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { packagedExecutablePath } from "./desktopPackagePaths.mjs";

const READY_TIMEOUT_MS = 30_000;
const RUN_TIMEOUT_MS = 12_000;
const IO_TIMEOUT_MS = 5_000;

function withTimeout(promise, label, timeoutMs = IO_TIMEOUT_MS) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}（等待 ${timeoutMs / 1000} 秒后超时）`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function reservePort() {
  const server = createServer();
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

const executable = packagedExecutablePath(process.platform, process.arch);
const port = await reservePort();
const userDataDirectory = await mkdtemp(join(tmpdir(), "stewie-renderer-smoke-"));
const stderr = [];
const child = spawn(executable, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDirectory}`,
  "--no-first-run",
], { stdio: ["ignore", "ignore", "pipe"] });
child.stderr.setEncoding("utf8");
child.stderr.on("data", (chunk) => stderr.push(chunk));
let childFailure = null;
let childExitState = null;
const childStopped = new Promise((resolve) => {
  child.once("error", (error) => {
    childFailure = error;
    resolve();
  });
  child.once("exit", (code, signal) => {
    childExitState = { code, signal };
    resolve();
  });
});

let socket;
try {
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
  const send = createCdpClient(socket);
  await send("Runtime.enable");

  async function evaluate(expression) {
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

  await setCodeAndRun("if True");
  await waitForText("SyntaxError · 第 1 行");

  await setCodeAndRun('print("x")');
  await waitForText("项测试未通过");

  await setCodeAndRun("while True:\n    pass");
  await waitForText("执行超时", RUN_TIMEOUT_MS);
  await waitForText("Python 314.0.3 就绪", READY_TIMEOUT_MS);

  await setCodeAndRun('print("我的第一段 Python")\nprint(8 * 7)');
  await waitForText("全部通过 · 可以进入下一关");
  process.stdout.write("packaged renderer smoke: success, syntax, failed tests, timeout recovery\n");
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
}
