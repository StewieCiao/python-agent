import { access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const executable = process.platform === "win32"
  ? join(root, "desktop", ".runtime", "python", "python.exe")
  : join(root, "desktop", ".runtime", "python", "bin", "python3.13");

try {
  await access(executable);
} catch (error) {
  if (error?.code === "ENOENT") {
    throw new Error("未找到项目内置 Python 运行时，请先运行 npm run prepare:python-runtime");
  }
  throw error;
}

const projects = [
  "adaptive-python-coach",
  "agentic-rag-router",
  "mini-agent-framework",
  "private-rag-study-assistant",
  "rag-quality-workbench",
  "recoverable-research-graph",
  "supervisor-research-graph",
];

for (const project of projects) {
  const exitCode = await new Promise((resolveExit, reject) => {
    const child = spawn(executable, [join(root, "projects", project, "demo.py")], { stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
  if (exitCode !== 0) process.exit(exitCode);
}
