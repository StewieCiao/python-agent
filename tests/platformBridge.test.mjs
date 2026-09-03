import assert from "node:assert/strict";
import { test } from "node:test";
import {
  clearCourseHistory,
  answerWithRag,
  listModelProfiles,
  loadCourseHistory,
  PlatformRequestError,
  sendCourseChat,
  sendTutorChat,
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

test("RAG 回答必须经过 Tutor Graph 的真实引用校验", async () => {
  globalThis.__STEWIE_DESKTOP__ = true;
  const calls = [];
  globalThis.window = {
    stewie: {
      async answerWithRag(input) {
        calls.push(["rag", input]);
        return { ok: true, value: { answer: "答案", sources: ["notes.md"], matches: [{ source: "notes.md", score: 0.8 }] } };
      },
      async validateTutorTurn(state) {
        calls.push(["validate", state]);
        return { ok: true, value: { ...state, response: { ...state.response, status: "ok" }, turn_ready: true } };
      },
    },
  };
  try {
    const result = await answerWithRag({
      profileId: "primary",
      query: "问题",
      documents: [{ id: "d1", text: "资料", source: "notes.md" }],
    });
    assert.equal(result.answer, "答案");
    assert.equal(calls[1][0], "validate");
    assert.deepEqual(calls[1][1].response.citations, [{ source: "notes.md" }]);
  } finally {
    delete globalThis.window;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});

test("课程模式只展示经过 Graph 校验的结构化导师回答", async () => {
  globalThis.__STEWIE_DESKTOP__ = true;
  const calls = [];
  globalThis.window = {
    stewie: {
      async chatWithModel(input) {
        calls.push(["model", input]);
        return { ok: true, value: { reply: JSON.stringify({ answer: "最小提示", citations: [{ source: "python/functions" }] }) } };
      },
      async validateTutorTurn(state) {
        calls.push(["validate", state]);
        return { ok: true, value: { ...state, response: { status: "ok", ...state.response }, turn_ready: true } };
      },
      async appendChatMessages(courseId, lessonId, messages) {
        calls.push(["append", courseId, lessonId, messages]);
        return { ok: true, value: messages };
      },
    },
  };
  try {
    const answer = await sendTutorChat({
      profileId: "primary",
      courseId: "python",
      lessonId: "functions",
      lessonContext: { title: "函数" },
      history: [],
      message: "为什么 return？",
    });
    assert.equal(answer, "最小提示");
    assert.equal(calls[0][0], "model");
    assert.equal(calls[1][0], "validate");
    assert.equal(calls[2][0], "append");
  } finally {
    delete globalThis.window;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});
