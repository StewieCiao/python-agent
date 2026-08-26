import test from "node:test";
import assert from "node:assert/strict";
import { runProcesses } from "../scripts/run-local.mjs";

test("任一子进程失败时停止另一进程并保留失败退出码", async () => {
  const startedAt = Date.now();
  const exitCode = await runProcesses([
    {
      command: process.execPath,
      args: ["-e", "setTimeout(() => process.exit(7), 50)"],
      label: "failing child",
    },
    {
      command: process.execPath,
      args: ["-e", "setInterval(() => {}, 1000)"],
      label: "long child",
    },
  ]);

  assert.equal(exitCode, 7);
  assert.ok(Date.now() - startedAt < 2000, "另一子进程应被及时停止");
});
