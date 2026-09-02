import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { validateProfile } from "../../app/lib/modelConfig.ts";
import type { LegacyConversation, PythonChatMessage, PythonServiceClient } from "./pythonService.mjs";

const DATA_ROOT = ["Library", "Application Support", "Stewie Learning Site"] as const;
const FILES = {
  "model-profiles": "model-profiles.json",
  "chat-history": "chat-history.json",
} as const;

function sourcePath(homeDirectory: string, sourceKind: keyof typeof FILES): string {
  return join(homeDirectory, ...DATA_ROOT, FILES[sourceKind]);
}

function hashSource(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function parseProfiles(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) throw new Error("旧模型配置必须是数组");
  return value.map((item) => {
    const profile = validateProfile(item);
    return profile;
  });
}

function parseHistory(value: unknown): LegacyConversation[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("旧聊天历史结构损坏");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 2 || record.version !== 1 || !record.conversations || typeof record.conversations !== "object" || Array.isArray(record.conversations)) {
    throw new Error("旧聊天历史版本或结构无效");
  }
  return Object.entries(record.conversations as Record<string, unknown>).map(([key, messages]) => {
    let ids: unknown;
    try { ids = JSON.parse(key); } catch { throw new Error("旧聊天历史关卡键无效"); }
    if (!Array.isArray(ids) || ids.length !== 2 || typeof ids[0] !== "string" || typeof ids[1] !== "string") {
      throw new Error("旧聊天历史关卡键无效");
    }
    if (!Array.isArray(messages)) throw new Error("旧聊天历史消息无效");
    const parsed: PythonChatMessage[] = messages.map((message) => {
      if (!message || typeof message !== "object" || Array.isArray(message)) throw new Error("旧聊天消息字段无效");
      const item = message as Record<string, unknown>;
      if (Object.keys(item).length !== 3 || (item.role !== "user" && item.role !== "assistant") || typeof item.content !== "string" || !item.content || typeof item.createdAt !== "string" || !item.createdAt) {
        throw new Error("旧聊天消息字段无效");
      }
      return { role: item.role, content: item.content, createdAt: item.createdAt } as PythonChatMessage;
    });
    return { courseId: ids[0], lessonId: ids[1], messages: parsed };
  });
}

export async function migrateLegacyDesktopFiles({
  service,
  homeDirectory = homedir(),
  read = readFile,
}: {
  service: PythonServiceClient;
  homeDirectory?: string;
  read?: typeof readFile;
}): Promise<string[]> {
  const failures: string[] = [];
  for (const sourceKind of ["model-profiles", "chat-history"] as const) {
    const path = sourcePath(homeDirectory, sourceKind);
    let raw: string;
    try {
      raw = await read(path, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "ENOENT") continue;
      failures.push(`${sourceKind}：${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const sourceHash = hashSource(raw);
    try {
      const parsed = JSON.parse(raw);
      if (sourceKind === "model-profiles") {
        await service.importLegacy(sourceKind, sourceHash, parseProfiles(parsed), null);
      } else {
        await service.importLegacy(sourceKind, sourceHash, null, parseHistory(parsed));
      }
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      failures.push(`${sourceKind}：${reason}`);
      await service.recordLegacyFailure(sourceKind, sourceHash, reason);
    }
  }
  return failures;
}

export { sourcePath, hashSource, parseProfiles, parseHistory };
