import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";

export function runProcesses(commands) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const children = commands.map(({ command, args, label }) => {
      const child = spawn(command, args, { stdio: "inherit", env: process.env });
      child.once("error", (error) => {
        if (settled) return;
        settled = true;
        for (const peer of children) {
          if (peer !== child && !peer.killed) peer.kill("SIGTERM");
        }
        error.message = `${label} 启动失败：${error.message}`;
        reject(error);
      });
      child.once("exit", (code, signal) => {
        if (settled) return;
        settled = true;
        for (const peer of children) {
          if (peer !== child && !peer.killed) peer.kill("SIGTERM");
        }
        resolve(code ?? (signal ? 1 : 0));
      });
      return child;
    });
  });
}

function siteCommand(mode) {
  const script = mode === "dev" ? "dev:site" : mode === "start" ? "start:site" : null;
  if (!script) throw new Error("启动模式只支持 dev 或 start");
  const npmEntry = process.env.npm_execpath;
  return npmEntry
    ? { command: process.execPath, args: [npmEntry, "run", script], label: "学习站" }
    : { command: "npm", args: ["run", script], label: "学习站" };
}

async function main() {
  const mode = process.argv[2];
  const exitCode = await runProcesses([
    { command: process.execPath, args: ["--experimental-strip-types", "local-service/index.mjs"], label: "本地模型服务" },
    siteCommand(mode),
  ]);
  process.exitCode = exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
