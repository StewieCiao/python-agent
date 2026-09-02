import assert from "node:assert/strict";
import { test } from "node:test";

const lessonIds = ["lesson-1"];
const legacyProgress = JSON.stringify({
  completed: ["lesson-1"],
  drafts: { "lesson-1": "print(1)" },
  mistakes: [],
});

function installDesktopBridge() {
  const calls = [];
  globalThis.__STEWIE_DESKTOP__ = true;
  globalThis.localStorage = {
    getItem(key) {
      assert.equal(key, "python-agent-path-progress-v2");
      return legacyProgress;
    },
    setItem() {
      throw new Error("desktop must not write legacy localStorage");
    },
  };
  globalThis.window = {
    stewie: {
      async getLearningState() {
        calls.push(["get"]);
        return { ok: true, value: { completed: [], drafts: {}, mistakes: [] } };
      },
      async importLegacyLearningState(state, rawSource) {
        calls.push(["import", state, rawSource]);
        return { ok: true, value: { imported: true, state } };
      },
      async saveLearningState(state) {
        calls.push(["save", state]);
        return { ok: true, value: state };
      },
    },
  };
  return calls;
}

test("桌面进度从 SQLite 读取并只迁移一次旧 localStorage", async () => {
  const { loadLearningState, saveLearningState } = await import("../app/lib/desktopState.ts");
  const calls = installDesktopBridge();
  try {
    const loaded = await loadLearningState(lessonIds);
    const state = JSON.parse(legacyProgress);
    assert.deepEqual(loaded, { state, imported: true, migrationError: null });
    assert.equal(calls[0][0], "get");
    assert.equal(calls[1][0], "import");
    assert.equal(calls[1][2], legacyProgress);
    await saveLearningState(state);
    assert.deepEqual(calls.at(-1), ["save", state]);
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});

test("桌面旧进度损坏时保留 SQLite 状态并停止自动保存", async () => {
  globalThis.__STEWIE_DESKTOP__ = true;
  globalThis.localStorage = { getItem: () => "{not-json" };
  globalThis.window = {
    stewie: {
      async getLearningState() {
        return { ok: true, value: { completed: ["lesson-1"], drafts: {}, mistakes: [] } };
      },
    },
  };
  try {
    const { loadLearningState } = await import("../app/lib/desktopState.ts");
    const loaded = await loadLearningState(lessonIds);
    assert.deepEqual(loaded.state, { completed: ["lesson-1"], drafts: {}, mistakes: [] });
    assert.match(loaded.migrationError, /旧版本地进度迁移失败/);
    assert.equal(loaded.imported, false);
  } finally {
    delete globalThis.window;
    delete globalThis.localStorage;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});

test("浏览器路径继续读取现有 localStorage，不调用桌面桥", async () => {
  globalThis.__STEWIE_DESKTOP__ = false;
  globalThis.localStorage = { getItem: () => legacyProgress };
  delete globalThis.window;
  try {
    const { loadLearningState } = await import("../app/lib/desktopState.ts");
    assert.deepEqual(await loadLearningState(lessonIds), {
      state: JSON.parse(legacyProgress),
      migrationError: null,
      imported: false,
    });
  } finally {
    delete globalThis.localStorage;
    delete globalThis.__STEWIE_DESKTOP__;
  }
});
