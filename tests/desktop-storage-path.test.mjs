import test from "node:test";
import assert from "node:assert/strict";

globalThis.__STEWIE_DESKTOP__ = true;
globalThis.window = {
  stewie: {
    appInfo: async () => ({
      name: "Stewie",
      version: "1",
      platform: "darwin",
      architecture: "arm64",
      python: null,
      storagePath: "/Users/test/Library/Application Support/stewie.db",
    }),
  },
};

const { modelStorageInfo } = await import("../app/lib/platformBridge.ts");

test("桌面设置的聊天历史路径与 SQLite 存储路径一致", async () => {
  const info = await modelStorageInfo();
  assert.equal(info.historyPath, info.nonSecretPath);
});
