import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ProfileValidationError, validateProfile } from "./modelProfile.mjs";

export class StorageError extends Error {
  constructor(message, cause) {
    super(message, { cause });
    this.name = "StorageError";
  }
}

function validId(value, label) {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > 160) {
    throw new StorageError(`${label} 无效`);
  }
  return value;
}

export function createStorage(directory) {
  const profilesPath = join(directory, "model-profiles.json");
  const historyPath = join(directory, "chat-history.json");

  async function readJson(path, emptyValue, label) {
    try {
      const raw = await readFile(path, "utf8");
      return JSON.parse(raw);
    } catch (error) {
      if (error?.code === "ENOENT") return emptyValue;
      throw new StorageError(`${label}无法读取：${error.message}`, error);
    }
  }

  async function writeJson(path, value, label) {
    try {
      await mkdir(directory, { recursive: true, mode: 0o700 });
      await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    } catch (error) {
      throw new StorageError(`${label}无法保存：${error.message}`, error);
    }
  }

  async function readHistoryFile() {
    const value = await readJson(historyPath, { version: 1, conversations: {} }, "聊天历史");
    if (value?.version !== 1 || !value.conversations || typeof value.conversations !== "object" || Array.isArray(value.conversations)) {
      throw new StorageError("聊天历史结构损坏");
    }
    for (const messages of Object.values(value.conversations)) {
      if (!Array.isArray(messages) || messages.some((item) =>
        !item ||
        (item.role !== "user" && item.role !== "assistant") ||
        typeof item.content !== "string" ||
        typeof item.createdAt !== "string"
      )) {
        throw new StorageError("聊天历史结构损坏");
      }
    }
    return value;
  }

  function conversationKey(courseId, lessonId) {
    return JSON.stringify([validId(courseId, "courseId"), validId(lessonId, "lessonId")]);
  }

  return {
    profilesPath,
    historyPath,

    async getProfiles() {
      const value = await readJson(profilesPath, [], "模型配置");
      if (!Array.isArray(value)) throw new StorageError("模型配置结构损坏");
      try {
        return value.map((profile) => validateProfile(profile));
      } catch (error) {
        if (error instanceof ProfileValidationError) {
          throw new StorageError(`模型配置结构损坏：${error.message}`, error);
        }
        throw error;
      }
    },

    async saveProfiles(profiles) {
      const validProfiles = profiles.map((profile) => {
        const validated = validateProfile({
          id: profile.id,
          name: profile.name,
          baseUrl: profile.baseUrl,
          model: profile.model,
          embeddingModel: profile.embeddingModel,
          temperature: profile.temperature,
          maxTokens: profile.maxTokens,
          timeoutMs: profile.timeoutMs,
        });
        return {
          id: validated.id,
          name: validated.name,
          baseUrl: validated.baseUrl,
          model: validated.model,
          embeddingModel: validated.embeddingModel,
          temperature: validated.temperature,
          maxTokens: validated.maxTokens,
          timeoutMs: validated.timeoutMs,
        };
      });
      await writeJson(profilesPath, validProfiles, "模型配置");
    },

    async getHistory(courseId, lessonId) {
      const history = await readHistoryFile();
      return history.conversations[conversationKey(courseId, lessonId)] ?? [];
    },

    async appendHistory(courseId, lessonId, messages) {
      const history = await readHistoryFile();
      const key = conversationKey(courseId, lessonId);
      const createdAt = new Date().toISOString();
      history.conversations[key] = [
        ...(history.conversations[key] ?? []),
        ...messages.map(({ role, content }) => ({ role, content, createdAt })),
      ];
      await writeJson(historyPath, history, "聊天历史");
    },

    async clearHistory(courseId, lessonId) {
      const history = await readHistoryFile();
      delete history.conversations[conversationKey(courseId, lessonId)];
      await writeJson(historyPath, history, "聊天历史");
    },
  };
}
