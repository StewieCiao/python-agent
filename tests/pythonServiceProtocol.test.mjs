import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { join } from "node:path";
import { PassThrough } from "node:stream";
import { test } from "node:test";

async function loadPythonService() {
  try {
    return await import("../desktop/src/pythonService.mts");
  } catch (error) {
    assert.fail(`桌面 Python 服务客户端尚未实现：${error?.code || error?.message}`);
  }
}

const HEALTH_RESULT = {
  pythonVersion: "3.13.15",
  packages: {
    langchain: "1.2.12",
    langgraph: "1.1.2",
    "langgraph-checkpoint-sqlite": "2.0.6",
    pypdf: "6.16.2",
  },
  sqlite: { version: "3.50.4", transaction: true, fts5: true },
  catalog: {
    schemaVersion: "stewie-catalog-v1",
    catalogHash: "f0c4890684ad7f0b960b4c476a0f0d12d3382ef74efc4641b99937c5c1b80af2",
    familyHash: "d027066a7cc1caf17663ae84138d42f40a914de9b87f1bf071f4d1b3a71e6ef6",
  },
};
const DATABASE_PATH = join("Library", "Application Support", "Stewie LearnOS", "stewie.db");

test("桌面只从 process.resourcesPath 下解析内置服务", async () => {
  const { resolvePythonServicePaths } = await loadPythonService();
  const resources = join("Applications", "Stewie LearnOS", "Resources");

  assert.deepEqual(resolvePythonServicePaths(resources, "darwin"), {
    executable: join(resources, "python", "bin", "python3"),
    service: join(resources, "python", "service", "service.py"),
    catalog: join(resources, "python", "service", "learning-service.json"),
  });
  assert.deepEqual(resolvePythonServicePaths(resources, "win32"), {
    executable: join(resources, "python", "python.exe"),
    service: join(resources, "python", "service", "service.py"),
    catalog: join(resources, "python", "service", "learning-service.json"),
  });
});

test("健康响应保留版本、依赖和 SQLite 证明", async () => {
  const { parsePythonServiceFrame } = await loadPythonService();
  const frame = JSON.stringify({ id: "health-1", ok: true, result: HEALTH_RESULT });

  assert.deepEqual(parsePythonServiceFrame(frame), {
    id: "health-1",
    ok: true,
    result: HEALTH_RESULT,
  });
});

test("服务错误保留真实类型和原因，畸形响应明确失败", async () => {
  const { parsePythonServiceFrame } = await loadPythonService();

  assert.deepEqual(
    parsePythonServiceFrame(
      '{"id":"health-1","ok":false,"error":{"type":"OperationalError","message":"FTS5 不可用"}}',
    ),
    {
      id: "health-1",
      ok: false,
      error: { type: "OperationalError", message: "FTS5 不可用" },
    },
  );

  const malformed = [
    "not-json",
    '{"id":"health-1","ok":true,"result":{}}',
    JSON.stringify({ id: "health-1", ok: true, result: HEALTH_RESULT, extra: true }),
  ];
  for (const frame of malformed) {
    assert.throws(() => parsePythonServiceFrame(frame), /Python 服务响应/);
  }
});

function createChild(onRequest) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.killed = false;
  child.kill = () => {
    child.killed = true;
    return true;
  };
  child.stdin.on("data", (chunk) => onRequest?.(chunk.toString(), child));
  return child;
}

test("启动唯一服务后先完成真实健康握手", async () => {
  const { startPythonService } = await loadPythonService();
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result: HEALTH_RESULT })}\n`);
  });
  const spawnCalls = [];

  const client = await startPythonService({
    resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
    platform: "darwin",
    databasePath: DATABASE_PATH,
    timeoutMs: 100,
    onFailure(error) {
      assert.fail(error.message);
    },
    spawnProcess(executable, args, options) {
      spawnCalls.push({ executable, args, options });
      return child;
    },
  });

  assert.equal(client.health.pythonVersion, "3.13.15");
  assert.equal(spawnCalls.length, 1);
  assert.match(spawnCalls[0].executable, /Resources\/python\/bin\/python3$/);
  assert.deepEqual(spawnCalls[0].args, [
    join("Applications", "Stewie LearnOS", "Resources", "python", "service", "service.py"),
    "--catalog",
    join("Applications", "Stewie LearnOS", "Resources", "python", "service", "learning-service.json"),
    "--database",
    DATABASE_PATH,
  ]);
  assert.deepEqual(spawnCalls[0].options, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  client.stop();
  assert.equal(child.killed, true);
});

test("健康握手超时会明确失败并终止服务，不自动重试", async () => {
  const { startPythonService } = await loadPythonService();
  const child = createChild();
  let spawnCount = 0;

  await assert.rejects(
    startPythonService({
      resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
      platform: "darwin",
      databasePath: DATABASE_PATH,
      timeoutMs: 5,
      onFailure(error) {
        assert.fail(error.message);
      },
      spawnProcess() {
        spawnCount += 1;
        return child;
      },
    }),
    /Python 服务请求 health 超时/,
  );

  assert.equal(spawnCount, 1);
  assert.equal(child.killed, true);
});

test("桌面客户端暴露学习与聊天的严格服务调用", async () => {
  const { startPythonService } = await loadPythonService();
  const requests = [];
  const state = { completed: ["lesson-1"], drafts: {}, mistakes: [] };
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    requests.push(request);
    const result = request.method === "health"
      ? HEALTH_RESULT
      : request.method === "learning.get" || request.method === "learning.save"
        ? state
        : request.method === "learning.importLegacy"
          ? { imported: true, state }
          : request.method === "chat.clear"
            ? { cleared: true }
            : [];
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result })}\n`);
  });
  const client = await startPythonService({
    resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
    platform: "darwin",
    databasePath: DATABASE_PATH,
    timeoutMs: 100,
    spawnProcess: () => child,
    onFailure(error) {
      assert.fail(error.message);
    },
  });

  assert.deepEqual(await client.getLearningState(), state);
  assert.deepEqual(await client.saveLearningState(state), state);
  assert.deepEqual(await client.importLegacyLearningState(state, "hash-1"), { imported: true, state });
  assert.deepEqual(await client.listChatMessages("python", "lesson-1"), []);
  assert.deepEqual(await client.appendChatMessages("python", "lesson-1", []), []);
  assert.deepEqual(await client.clearChatMessages("python", "lesson-1"), { cleared: true });
  assert.deepEqual(
    requests.slice(1).map(({ method, params }) => ({ method, params })),
    [
      { method: "learning.get", params: {} },
      { method: "learning.save", params: { state } },
      { method: "learning.importLegacy", params: { state, sourceHash: "hash-1" } },
      { method: "chat.list", params: { courseId: "python", lessonId: "lesson-1" } },
      { method: "chat.append", params: { courseId: "python", lessonId: "lesson-1", messages: [] } },
      { method: "chat.clear", params: { courseId: "python", lessonId: "lesson-1" } },
    ],
  );
  client.stop();
});

test("客户端拒绝畸形学习成功结果并通知故障边界", async () => {
  const { startPythonService } = await loadPythonService();
  const failures = [];
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    const result = request.method === "health" ? HEALTH_RESULT : {};
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result })}\n`);
  });
  const client = await startPythonService({
    resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
    platform: "darwin",
    databasePath: DATABASE_PATH,
    timeoutMs: 100,
    spawnProcess: () => child,
    onFailure: (error) => failures.push(error.message),
  });

  await assert.rejects(client.getLearningState(), /学习状态响应结构无效/);
  assert.deepEqual(failures, ["学习状态响应结构无效"]);
  client.stop();
});

test("客户端拒绝字段不完整的错题响应", async () => {
  const { startPythonService } = await loadPythonService();
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    const result = request.method === "health"
      ? HEALTH_RESULT
      : { completed: [], drafts: {}, mistakes: [{}] };
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result })}\n`);
  });
  const client = await startPythonService({
    resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
    platform: "darwin",
    databasePath: DATABASE_PATH,
    timeoutMs: 100,
    spawnProcess: () => child,
    onFailure() {},
  });
  await assert.rejects(client.getLearningState(), /学习状态响应结构无效/);
  client.stop();
});

test("客户端拒绝带密文或畸形聊天的学习导出响应", async () => {
  const { startPythonService } = await loadPythonService();
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    const result = request.method === "health" ? HEALTH_RESULT : {
      schema: "stewie-learning-export-v1", exportedAt: "2026-09-02T00:00:00Z",
      learning: { completed: [], drafts: {}, mistakes: [] }, chats: [], apiKeyCiphertext: "secret",
    };
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result })}\n`);
  });
  const client = await startPythonService({ resourcesPath: join("Applications", "Stewie LearnOS", "Resources"), platform: "darwin", databasePath: DATABASE_PATH, timeoutMs: 100, spawnProcess: () => child, onFailure() {} });
  await assert.rejects(client.exportLearning(), /学习导出响应结构无效/);
  client.stop();
});

test("SQLite 事务或 FTS5 探针失败时拒绝就绪", async () => {
  const { startPythonService } = await loadPythonService();

  for (const sqlite of [
    { version: "3.50.4", transaction: false, fts5: true },
    { version: "3.50.4", transaction: true, fts5: false },
  ]) {
    const child = createChild((requestLine, process) => {
      const request = JSON.parse(requestLine);
      process.stdout.write(`${JSON.stringify({
        id: request.id,
        ok: true,
        result: { ...HEALTH_RESULT, sqlite },
      })}\n`);
    });
    await assert.rejects(
      startPythonService({
        resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
        platform: "darwin",
        databasePath: DATABASE_PATH,
        timeoutMs: 100,
        spawnProcess: () => child,
        onFailure(error) {
          assert.fail(error.message);
        },
      }),
      /Python 服务健康检查失败/,
    );
    assert.equal(child.killed, true);
  }
});

test("服务就绪后异常退出会保留 stderr 并通知唯一故障边界", async () => {
  const { startPythonService } = await loadPythonService();
  const child = createChild((requestLine, process) => {
    const request = JSON.parse(requestLine);
    process.stdout.write(`${JSON.stringify({ id: request.id, ok: true, result: HEALTH_RESULT })}\n`);
  });
  const failures = [];
  await startPythonService({
    resourcesPath: join("Applications", "Stewie LearnOS", "Resources"),
    platform: "darwin",
    databasePath: DATABASE_PATH,
    timeoutMs: 100,
    spawnProcess: () => child,
    onFailure: (error) => failures.push(error.message),
  });

  child.stderr.write("数据库文件不可读");
  child.emit("exit", 2, null);
  child.emit("error", new Error("后续重复事件"));

  assert.deepEqual(failures, ["Python 服务退出（code=2, signal=null）：数据库文件不可读"]);
});
