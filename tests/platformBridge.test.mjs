import assert from "node:assert/strict";
import { test } from "node:test";
import { listModelProfiles, PlatformRequestError } from "../app/lib/platformBridge.ts";

test("桌面构建缺少 preload bridge 时明确失败，不请求 legacy HTTP 服务", async () => {
  globalThis.__STEWIE_DESKTOP__ = true;
  globalThis.window = {};
  try {
    await assert.rejects(
      listModelProfiles(),
      (error) => {
        assert.ok(error instanceof PlatformRequestError);
        assert.equal(error.code, "DESKTOP_BRIDGE_UNAVAILABLE");
        return true;
      },
    );
  } finally {
    delete globalThis.window;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});
