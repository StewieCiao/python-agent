import { redactSecrets, type StoredModelProfile } from "../../app/lib/modelConfig.ts";

export type ModelMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ProfileForRequest = {
  profile: StoredModelProfile;
  apiKey: string;
};

export class ModelRequestError extends Error {
  status: number | null;
  code: string;

  constructor(
    status: number | null,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "ModelRequestError";
    this.status = status;
    this.code = code;
  }
}

function validateMessages(messages: unknown): ModelMessage[] {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
    throw new ModelRequestError(null, "INVALID_MESSAGES", "模型消息必须包含 1–100 条记录");
  }
  let totalLength = 0;
  const validated = messages.map((message) => {
    if (!message || typeof message !== "object" || Array.isArray(message)) {
      throw new ModelRequestError(null, "INVALID_MESSAGES", "模型消息结构无效");
    }
    const value = message as Record<string, unknown>;
    if (
      Object.keys(value).length !== 2 ||
      !Object.hasOwn(value, "role") ||
      !Object.hasOwn(value, "content") ||
      (value.role !== "system" && value.role !== "user" && value.role !== "assistant") ||
      typeof value.content !== "string" ||
      !value.content.trim()
    ) {
      throw new ModelRequestError(null, "INVALID_MESSAGES", "模型消息字段无效");
    }
    totalLength += value.content.length;
    return { role: value.role as ModelMessage["role"], content: value.content };
  });
  if (totalLength > 256 * 1024) {
    throw new ModelRequestError(null, "INVALID_MESSAGES", "模型消息总长度超过 256 KB");
  }
  return validated;
}

function upstreamMessage(payload: unknown, raw: string): string {
  if (payload && typeof payload === "object") {
    const record = payload as { error?: unknown; message?: unknown };
    if (record.error && typeof record.error === "object") {
      const message = (record.error as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
    if (typeof record.message === "string") return record.message;
  }
  return raw || "上游模型返回错误";
}

export function createModelClient({
  getProfileForRequest,
  fetchImpl = fetch,
}: {
  getProfileForRequest(profileId: string): Promise<ProfileForRequest>;
  fetchImpl?: typeof fetch;
}) {
  async function requestJson(
    credentials: ProfileForRequest,
    path: string,
    body: Record<string, unknown>,
  ): Promise<unknown> {
    try {
      const response = await fetchImpl(`${credentials.profile.baseUrl}/${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credentials.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(credentials.profile.timeoutMs),
      });
      const raw = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch (error) {
        throw new ModelRequestError(
          response.ok ? 502 : response.status,
          "INVALID_UPSTREAM_RESPONSE",
          redactSecrets(raw || `模型返回无效 JSON：${error instanceof Error ? error.message : String(error)}`, [credentials.apiKey]),
        );
      }
      if (!response.ok) {
        throw new ModelRequestError(
          response.status,
          "UPSTREAM_ERROR",
          redactSecrets(upstreamMessage(payload, raw), [credentials.apiKey]),
        );
      }
      return payload;
    } catch (error) {
      if (error instanceof ModelRequestError) throw error;
      const timeout = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
      throw new ModelRequestError(
        timeout ? 504 : null,
        timeout ? "UPSTREAM_TIMEOUT" : "UPSTREAM_NETWORK_ERROR",
        redactSecrets(error instanceof Error ? error.message : error, [credentials.apiKey]),
      );
    }
  }

  async function withCredentials<T>(
    profileId: string,
    action: (credentials: ProfileForRequest) => Promise<T>,
  ): Promise<T> {
    const credentials = await getProfileForRequest(profileId);
    try {
      return await action(credentials);
    } finally {
      credentials.apiKey = "";
    }
  }

  return {
    async chat(profileId: string, messages: ModelMessage[]): Promise<string> {
      const validatedMessages = validateMessages(messages);
      return withCredentials(profileId, async (credentials) => {
        const payload = await requestJson(credentials, "chat/completions", {
          model: credentials.profile.model,
          messages: validatedMessages,
          temperature: credentials.profile.temperature,
          max_tokens: credentials.profile.maxTokens,
          stream: false,
        });
        const reply = (payload as { choices?: Array<{ message?: { content?: unknown } }> })
          ?.choices?.[0]?.message?.content;
        if (typeof reply !== "string" || !reply) {
          throw new ModelRequestError(502, "INVALID_UPSTREAM_RESPONSE", "模型响应缺少 assistant content");
        }
        return redactSecrets(reply, [credentials.apiKey]);
      });
    },

    async embeddings(profileId: string, inputs: string[]): Promise<number[][]> {
      if (!Array.isArray(inputs) || inputs.length === 0 || inputs.some((item) => typeof item !== "string" || !item)) {
        throw new ModelRequestError(null, "INVALID_EMBEDDING_INPUT", "Embedding 输入不能为空");
      }
      return withCredentials(profileId, async (credentials) => {
        if (!credentials.profile.embeddingModel) {
          throw new ModelRequestError(null, "EMBEDDING_MODEL_MISSING", "该配置尚未设置 Embedding 模型");
        }
        const payload = await requestJson(credentials, "embeddings", {
          model: credentials.profile.embeddingModel,
          input: inputs,
        });
        const data = (payload as { data?: Array<{ embedding?: unknown }> })?.data;
        if (!Array.isArray(data) || data.length !== inputs.length) {
          throw new ModelRequestError(502, "INVALID_UPSTREAM_RESPONSE", "Embedding 响应数量不匹配");
        }
        const vectors = data.map((item) => item.embedding);
        if (vectors.some((vector) => !Array.isArray(vector) || vector.some((value) => typeof value !== "number"))) {
          throw new ModelRequestError(502, "INVALID_UPSTREAM_RESPONSE", "Embedding 响应向量无效");
        }
        return vectors as number[][];
      });
    },
  };
}

export type ModelClient = ReturnType<typeof createModelClient>;
