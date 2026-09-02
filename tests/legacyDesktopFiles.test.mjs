import assert from "node:assert/strict";
import test from "node:test";
import { migrateLegacyDesktopFiles } from "../desktop/src/legacyMigration.mts";

test("只读取两个精确旧文件并按源独立导入", async () => {
  const files = new Map([
    ["/home/Library/Application Support/Stewie Learning Site/model-profiles.json", JSON.stringify([{
      id: "legacy", name: "Legacy", baseUrl: "https://example.com/v1", model: "model", embeddingModel: null,
      temperature: 0, maxTokens: 10, timeoutMs: 1000,
    }])],
    ["/home/Library/Application Support/Stewie Learning Site/chat-history.json", JSON.stringify({ version: 1, conversations: {
      '["python","lesson-1"]': [{ role: "user", content: "hello", createdAt: "2026-09-02T00:00:00Z" }],
    } })],
  ]);
  const calls = [];
  const service = {
    async importLegacy(...args) { calls.push(["import", ...args]); return { imported: true }; },
    async recordLegacyFailure(...args) { calls.push(["failure", ...args]); return { recorded: true }; },
  };
  const failures = await migrateLegacyDesktopFiles({
    service,
    homeDirectory: "/home",
    read: async (path) => {
      if (!files.has(path)) { const error = new Error("missing"); error.code = "ENOENT"; throw error; }
      return files.get(path);
    },
  });
  assert.deepEqual(failures, []);
  assert.equal(calls.filter(([kind]) => kind === "import").length, 2);
  assert.equal(calls[0][1], "model-profiles");
  assert.equal(calls[1][1], "chat-history");
  assert.equal(calls[0][2].length, 64);
});

test("损坏旧文件记录真实失败，不猜测其他格式", async () => {
  const calls = [];
  const service = {
    async importLegacy() { throw new Error("should not import"); },
    async recordLegacyFailure(...args) { calls.push(args); return { recorded: true }; },
  };
  const failures = await migrateLegacyDesktopFiles({
    service,
    homeDirectory: "/home",
    read: async (path) => path.endsWith("model-profiles.json") ? "not json" : (() => { const error = new Error("missing"); error.code = "ENOENT"; throw error; })(),
  });
  assert.equal(failures.length, 1);
  assert.equal(calls[0][0], "model-profiles");
  assert.match(calls[0][2], /JSON|json/);
});
