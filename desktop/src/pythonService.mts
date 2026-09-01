import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { pythonExecutableRelativePath } from "../../scripts/python-runtime-manifest.mjs";

const PACKAGE_NAMES = [
  "langchain",
  "langgraph",
  "langgraph-checkpoint-sqlite",
  "pypdf",
] as const;

export type PythonHealth = {
  pythonVersion: string;
  packages: Record<(typeof PACKAGE_NAMES)[number], string>;
  sqlite: {
    version: string;
    transaction: boolean;
    fts5: boolean;
  };
};

export type PythonServiceFrame =
  | { id: string; ok: true; result: unknown }
  | { id: string; ok: false; error: { type: string; message: string } };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hasStringFields(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return hasExactKeys(value, keys) && keys.every((key) => typeof value[key] === "string");
}

function isHealth(value: unknown): value is PythonHealth {
  if (!isRecord(value) || !hasExactKeys(value, ["pythonVersion", "packages", "sqlite"])) return false;
  if (typeof value.pythonVersion !== "string" || !isRecord(value.packages) || !isRecord(value.sqlite)) {
    return false;
  }
  return (
    hasStringFields(value.packages, PACKAGE_NAMES) &&
    hasExactKeys(value.sqlite, ["version", "transaction", "fts5"]) &&
    typeof value.sqlite.version === "string" &&
    typeof value.sqlite.transaction === "boolean" &&
    typeof value.sqlite.fts5 === "boolean"
  );
}

export function resolvePythonServicePaths(resourcesPath: string, platform: string) {
  const runtimeRoot = join(resourcesPath, "python");
  return {
    executable: join(runtimeRoot, pythonExecutableRelativePath(platform)),
    service: join(runtimeRoot, "service", "service.py"),
  };
}

function parsePythonServiceEnvelope(line: string): PythonServiceFrame {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error("Python 服务响应不是有效 JSON");
  }

  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Python 服务响应缺少有效请求 ID");
  }
  if (value.ok === true && hasExactKeys(value, ["id", "ok", "result"])) {
    return value as PythonServiceFrame;
  }
  if (
    value.ok === false &&
    hasExactKeys(value, ["id", "ok", "error"]) &&
    isRecord(value.error) &&
    hasStringFields(value.error, ["type", "message"])
  ) {
    return value as PythonServiceFrame;
  }
  throw new Error("Python 服务响应结构无效");
}

export function parsePythonServiceFrame(line: string): PythonServiceFrame {
  const frame = parsePythonServiceEnvelope(line);
  if (frame.ok && !isHealth(frame.result)) {
    throw new Error("Python 服务响应结构无效");
  }
  return frame;
}

type SpawnProcess = (
  executable: string,
  args: readonly string[],
  options: { stdio: ["pipe", "pipe", "pipe"]; windowsHide: true },
) => ChildProcessWithoutNullStreams;

type PendingRequest = {
  timer: ReturnType<typeof setTimeout>;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

export class PythonServiceClient {
  health!: PythonHealth;
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #pending = new Map<string, PendingRequest>();
  #stderr = "";
  #stopped = false;
  #ready = false;
  #failureReported = false;
  readonly #onFailure: (error: Error) => void;

  private constructor(child: ChildProcessWithoutNullStreams, onFailure: (error: Error) => void) {
    this.#child = child;
    this.#onFailure = onFailure;
    createInterface({ input: child.stdout }).on("line", (line) => this.#receive(line));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this.#stderr += chunk;
    });
    child.once("error", (error) => this.#fail(error));
    child.once("exit", (code, signal) => {
      if (this.#stopped) return;
      const detail = this.#stderr.trim();
      this.#fail(new Error(`Python 服务退出（code=${code}, signal=${signal}）${detail ? `：${detail}` : ""}`));
    });
  }

  static async start(
    child: ChildProcessWithoutNullStreams,
    timeoutMs: number,
    onFailure: (error: Error) => void,
  ): Promise<PythonServiceClient> {
    const client = new PythonServiceClient(child, onFailure);
    client.health = await client.#requestHealth(timeoutMs);
    if (!client.health.sqlite.transaction || !client.health.sqlite.fts5) {
      throw new Error("Python 服务健康检查失败：SQLite 事务或 FTS5 不可用");
    }
    client.#ready = true;
    return client;
  }

  stop(): void {
    if (this.#stopped) return;
    this.#stopped = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Python 服务已停止"));
    }
    this.#pending.clear();
    if (!this.#child.killed) this.#child.kill();
  }

  request(method: string, params: Record<string, unknown>, timeoutMs = 10_000): Promise<unknown> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Python 服务请求 ${method} 超时（${timeoutMs}ms）`));
      }, timeoutMs);
      this.#pending.set(id, { timer, resolve, reject });
      this.#child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    });
  }

  async #requestHealth(timeoutMs: number): Promise<PythonHealth> {
    const result = await this.request("health", {}, timeoutMs);
    if (!isHealth(result)) throw new Error("Python 服务健康响应结构无效");
    return result;
  }

  #receive(line: string): void {
    let frame: PythonServiceFrame;
    try {
      frame = parsePythonServiceEnvelope(line);
    } catch (error) {
      this.#fail(error instanceof Error ? error : new Error("Python 服务响应解析失败"));
      return;
    }
    const pending = this.#pending.get(frame.id);
    if (!pending) {
      this.#fail(new Error(`Python 服务响应使用了未知请求 ID：${frame.id}`));
      return;
    }
    clearTimeout(pending.timer);
    this.#pending.delete(frame.id);
    if (frame.ok) pending.resolve(frame.result);
    else pending.reject(new Error(`${frame.error.type}: ${frame.error.message}`));
  }

  #fail(error: Error): void {
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.#pending.clear();
    if (this.#ready && !this.#stopped && !this.#failureReported) {
      this.#failureReported = true;
      this.#onFailure(error);
    }
  }
}

export type StartPythonServiceOptions = {
  resourcesPath: string;
  platform: string;
  databasePath: string;
  timeoutMs?: number;
  spawnProcess?: SpawnProcess;
  onFailure: (error: Error) => void;
};

export async function startPythonService({
  resourcesPath,
  platform,
  databasePath,
  timeoutMs = 10_000,
  spawnProcess = spawn,
  onFailure,
}: StartPythonServiceOptions): Promise<PythonServiceClient> {
  const paths = resolvePythonServicePaths(resourcesPath, platform);
  const child = spawnProcess(paths.executable, [paths.service, "--database", databasePath], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    return await PythonServiceClient.start(child, timeoutMs, onFailure);
  } catch (error) {
    if (!child.killed) child.kill();
    throw error;
  }
}
