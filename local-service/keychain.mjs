import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const SERVICE_NAME = "Stewie Learning Site";

export class KeychainError extends Error {
  constructor(operation, exitCode, reason) {
    super(`macOS 钥匙串${operation}失败：${reason}`);
    this.name = "KeychainError";
    this.operation = operation;
    this.exitCode = exitCode;
  }
}

export function createKeychain(run = execFileAsync) {
  async function execute(operation, args, { secret = "", missingIsNull = false } = {}) {
    try {
      return await run("security", args, { encoding: "utf8" });
    } catch (error) {
      if (missingIsNull && error?.code === 44) return null;
      const rawReason = String(error?.stderr || error?.message || "未知错误");
      const reason = secret ? rawReason.replaceAll(secret, "[REDACTED]") : rawReason;
      throw new KeychainError(operation, error?.code, reason.trim());
    }
  }

  return {
    async set(profileId, apiKey) {
      await execute(
        "写入",
        ["add-generic-password", "-U", "-a", profileId, "-s", SERVICE_NAME, "-w", apiKey],
        { secret: apiKey },
      );
    },

    async get(profileId) {
      const result = await execute(
        "读取",
        ["find-generic-password", "-a", profileId, "-s", SERVICE_NAME, "-w"],
        { missingIsNull: true },
      );
      if (!result) return null;
      const value = String(result.stdout).replace(/\r?\n$/, "");
      return value || null;
    },

    async delete(profileId) {
      const result = await execute(
        "删除",
        ["delete-generic-password", "-a", profileId, "-s", SERVICE_NAME],
        { missingIsNull: true },
      );
      return result !== null;
    },
  };
}
