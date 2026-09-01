import assert from "node:assert/strict";
import { test } from "node:test";

async function loadBoundary() {
  try {
    return await import("../desktop/src/startupBoundary.mts");
  } catch (error) {
    assert.fail(`桌面启动错误边界尚未实现：${error?.code || error?.message}`);
  }
}

test("桌面启动失败显示真实原因并退出，不重试或伪装成功", async () => {
  const { createStartupBoundary } = await loadBoundary();
  const messages = [];
  let quitCount = 0;
  let attempts = 0;
  const runStartupTask = createStartupBoundary({
    showError(message) {
      messages.push(message);
    },
    quit() {
      quitCount += 1;
    },
  });

  await runStartupTask(
    Promise.reject(new Error("stewie://app/index.html 读取失败")).finally(() => {
      attempts += 1;
    }),
  );

  assert.deepEqual(messages, ["stewie://app/index.html 读取失败"]);
  assert.equal(quitCount, 1);
  assert.equal(attempts, 1);
});

test("桌面启动成功不显示错误也不退出", async () => {
  const { createStartupBoundary } = await loadBoundary();
  let reported = false;
  let quitCount = 0;
  const runStartupTask = createStartupBoundary({
    showError() {
      reported = true;
    },
    quit() {
      quitCount += 1;
    },
  });

  await runStartupTask(Promise.resolve());

  assert.equal(reported, false);
  assert.equal(quitCount, 0);
});
