import {
  parseStoredProfile,
  redactProfile,
  redactSecrets,
  validateProfile,
  type ModelProfileInput,
  type PublicModelProfile,
  type StoredModelProfile,
} from "../../app/lib/modelConfig.ts";

type PythonProfileStore = {
  request(method: string, params: Record<string, unknown>, timeoutMs?: number): Promise<unknown>;
};

type SafeStorage = {
  isAsyncEncryptionAvailable(): Promise<boolean>;
  getSelectedStorageBackend(): string;
  encryptStringAsync(value: string): Promise<Buffer>;
  decryptStringAsync(value: Buffer): Promise<{ result: string; shouldReEncrypt: boolean }>;
};

export class SecureStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecureStorageError";
  }
}

function profileForStorage(profile: ReturnType<typeof validateProfile>) {
  return {
    id: profile.id,
    name: profile.name,
    baseUrl: profile.baseUrl,
    origin: profile.origin,
    model: profile.model,
    embeddingModel: profile.embeddingModel,
    temperature: profile.temperature,
    maxTokens: profile.maxTokens,
    timeoutMs: profile.timeoutMs,
  };
}

function apiKeyEnvelope(origin: string, apiKey: string): string {
  return JSON.stringify({ version: 1, origin, apiKey });
}

function readApiKeyEnvelope(value: string, expectedOrigin: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new SecureStorageError("保存的 API Key 密文内容已损坏。");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SecureStorageError("保存的 API Key 密文内容已损坏。");
  }
  const record = parsed as Record<string, unknown>;
  if (
    Object.keys(record).length !== 3 ||
    record.version !== 1 ||
    record.origin !== expectedOrigin ||
    typeof record.apiKey !== "string" ||
    !record.apiKey
  ) {
    if (record.origin !== expectedOrigin) {
      throw new SecureStorageError("API Key 与当前模型服务地址不一致，已拒绝使用。");
    }
    throw new SecureStorageError("保存的 API Key 密文内容已损坏。");
  }
  return record.apiKey;
}

export function createModelProfileService({
  store,
  safeStorage,
  platform,
}: {
  store: PythonProfileStore;
  safeStorage: SafeStorage;
  platform: string;
}) {
  async function requireSecureStorage() {
    if (!await safeStorage.isAsyncEncryptionAvailable()) {
      throw new SecureStorageError("系统安全存储不可用；API Key 未保存，也没有写入其他位置。");
    }
    if (platform === "linux") {
      const backend = safeStorage.getSelectedStorageBackend();
      if (backend === "basic_text" || backend === "unknown") {
        throw new SecureStorageError("Linux 未提供可用的系统密钥服务；拒绝使用明文后端。");
      }
    }
  }

  async function storedProfile(profileId: string): Promise<StoredModelProfile> {
    return parseStoredProfile(await store.request("profile.get", { profileId }));
  }

  return {
    async list(): Promise<PublicModelProfile[]> {
      const result = await store.request("profile.list", {});
      if (!Array.isArray(result)) throw new Error("Python 返回的模型配置列表无效");
      return result.map((item) => {
        const profile = parseStoredProfile(item);
        return redactProfile(profile, Boolean(profile.apiKeyCiphertext));
      });
    },

    async save(input: {
      profile: ModelProfileInput;
      apiKey?: string;
      makeActive: boolean;
    }): Promise<PublicModelProfile> {
      if (!input || typeof input !== "object" || typeof input.makeActive !== "boolean") {
        throw new Error("保存模型配置的请求无效");
      }
      const profile = validateProfile(input.profile);
      let apiKeyCiphertext: string | null = null;
      if (input.apiKey !== undefined) {
        if (typeof input.apiKey !== "string" || !input.apiKey.trim() || input.apiKey.length > 8192) {
          throw new Error("API Key 必须是 1–8192 字符的非空字符串");
        }
        await requireSecureStorage();
        try {
          apiKeyCiphertext = (
            await safeStorage.encryptStringAsync(apiKeyEnvelope(profile.origin, input.apiKey))
          ).toString("base64");
        } catch (error) {
          throw new SecureStorageError(
            `系统安全存储写入失败：${redactSecrets(error instanceof Error ? error.message : error, [input.apiKey])}`,
          );
        }
      }
      const saved = parseStoredProfile(await store.request("profile.upsert", {
        profile: profileForStorage(profile),
        apiKeyCiphertext,
        makeActive: input.makeActive,
      }));
      return redactProfile(saved, Boolean(saved.apiKeyCiphertext));
    },

    async activate(profileId: string): Promise<PublicModelProfile> {
      const saved = parseStoredProfile(await store.request("profile.activate", { profileId }));
      return redactProfile(saved, Boolean(saved.apiKeyCiphertext));
    },

    async delete(profileId: string): Promise<{ deleted: true }> {
      const result = await store.request("profile.delete", { profileId });
      if (!result || typeof result !== "object" || (result as { deleted?: unknown }).deleted !== true) {
        throw new Error("Python 返回的删除结果无效");
      }
      return { deleted: true };
    },

    async getProfileForRequest(profileId: string) {
      const profile = await storedProfile(profileId);
      if (!profile.apiKeyCiphertext) throw new SecureStorageError("该模型配置尚未保存 API Key。");
      await requireSecureStorage();
      const ciphertext = Buffer.from(profile.apiKeyCiphertext, "base64");
      if (!ciphertext.length || ciphertext.toString("base64") !== profile.apiKeyCiphertext) {
        throw new SecureStorageError("保存的 API Key 密文已损坏。");
      }
      const decrypted = await safeStorage.decryptStringAsync(ciphertext);
      const apiKey = readApiKeyEnvelope(decrypted.result, profile.origin);
      if (decrypted.shouldReEncrypt) {
        const refreshed = await safeStorage.encryptStringAsync(apiKeyEnvelope(profile.origin, apiKey));
        await store.request("profile.upsert", {
          profile: profileForStorage(profile),
          apiKeyCiphertext: refreshed.toString("base64"),
          makeActive: profile.active,
        });
      }
      return { profile, apiKey };
    },
  };
}

export type ModelProfileService = ReturnType<typeof createModelProfileService>;
