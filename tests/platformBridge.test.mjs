import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearCourseHistory,
  listModelProfiles,
  loadCourseHistory,
  PlatformRequestError,
  sendCourseChat,
} from "../app/lib/platformBridge.ts";

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

test("桌面聊天从 SQLite 读取、追加并清除，不回退到 legacy HTTP", async () => {
  globalThis.__STEWIE_DESKTOP__ = true;
  const calls = [];
  globalThis.window = {
    stewie: {
      async listChatMessages(courseId, lessonId) {
        calls.push(["list", courseId, lessonId]);
        return { ok: true, value: [{ role: "user", content: "旧问题", createdAt: "2026-09-02T10:00:00+00:00" }] };
      },
      async clearChatMessages(courseId, lessonId) {
        calls.push(["clear", courseId, lessonId]);
        return { ok: true, value: { cleared: true } };
      },
      async chatWithModel() {
        calls.push(["model"]);
        return { ok: true, value: { reply: "回答" } };
      },
      async appendChatMessages(courseId, lessonId, messages) {
        calls.push(["append", courseId, lessonId, messages]);
        return { ok: true, value: messages };
      },
    },
  };
  try {
    assert.deepEqual(await loadCourseHistory("python", "lesson-1"), {
      messages: [{ role: "user", content: "旧问题", createdAt: "2026-09-02T10:00:00+00:00" }],
      persisted: true,
    });
    assert.equal(
      await sendCourseChat({
        profileId: "primary",
        mode: "general",
        courseId: "python",
        lessonId: "lesson-1",
        history: [],
        message: "新问题",
      }),
      "回答",
    );
    await clearCourseHistory("python", "lesson-1");
    assert.equal(calls[0][0], "list");
    assert.equal(calls[1][0], "model");
    assert.equal(calls[2][0], "append");
    assert.deepEqual(calls[2][3].map(({ role, content }) => ({ role, content })), [
      { role: "user", content: "新问题" },
      { role: "assistant", content: "回答" },
    ]);
    assert.equal(calls[3][0], "clear");
  } finally {
    delete globalThis.window;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});
