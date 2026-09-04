import { spawn } from "node:child_process";
import { access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const executable = process.platform === "win32"
  ? join(projectRoot, "desktop", ".runtime", "python", "python.exe")
  : join(projectRoot, "desktop", ".runtime", "python", "bin", "python3.13");

try {
  await access(executable);
} catch {
  throw new Error("未找到项目内置 Python 运行时，请先运行 npm run prepare:python-runtime");
}

const exitCode = await new Promise((resolveExit, reject) => {
  const child = spawn(executable, ["-m", "unittest", "discover", "-s", "python-runtime/tests", "-v"], { stdio: "inherit" });
  child.once("error", reject);
  child.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
});

process.exitCode = exitCode;
