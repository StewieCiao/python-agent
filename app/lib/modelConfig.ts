const PROFILE_FIELDS = new Set([
  "id",
  "name",
  "baseUrl",
  "model",
  "embeddingModel",
  "temperature",
  "maxTokens",
  "timeoutMs",
]);

export type ModelProfileInput = {
  id: string;
  name: string;
  baseUrl: string;
  model: string;
  embeddingModel?: string | null;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
};

export type ValidatedModelProfile = Omit<ModelProfileInput, "embeddingModel"> & {
  embeddingModel: string | null;
  origin: string;
};

export type PublicModelProfile = Omit<ValidatedModelProfile, "origin"> & {
  active: boolean;
  hasApiKey: boolean;
};

export type StoredModelProfile = ValidatedModelProfile & {
  apiKeyCiphertext: string | null;
  active: boolean;
};

export class ProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

function invalid(message: string): never {
  throw new ProfileValidationError(message);
}

function requiredText(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`${field} 不能为空`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) invalid(`${field} 过长`);
  return normalized;
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") invalid(`${field} 必须是字符串`);
  const normalized = value.trim();
  if (!normalized) return null;
  if (normalized.length > maxLength) invalid(`${field} 过长`);
  return normalized;
}

function normalizeBaseUrl(value: unknown): { baseUrl: string; origin: string } {
  const raw = requiredText(value, "baseUrl", 500);
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    invalid("baseUrl 不是有效 URL");
  }
  if (url.username || url.password) invalid("baseUrl 不能包含用户名或密码");
  if (url.search || url.hash) invalid("baseUrl 不能包含查询参数或片段");

  const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if (url.protocol === "http:" && !loopbackHosts.has(url.hostname)) {
    invalid("云端地址必须使用 HTTPS");
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    invalid("baseUrl 只支持 HTTPS 或本机 HTTP");
  }
  return {
    baseUrl: url.toString().replace(/\/$/, ""),
    origin: url.origin,
  };
}

export function validateProfile(input: unknown): ValidatedModelProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    invalid("模型配置必须是对象");
  }
  const record = input as Record<string, unknown>;
  for (const field of Object.keys(record)) {
    if (!PROFILE_FIELDS.has(field)) invalid(`未知配置字段 ${field}`);
  }

  const id = requiredText(record.id, "id", 64);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    invalid("id 只能包含小写字母、数字和连字符");
  }
  if (typeof record.temperature !== "number" || record.temperature < 0 || record.temperature > 2) {
    invalid("temperature 必须在 0 到 2 之间");
  }
  if (!Number.isInteger(record.maxTokens) || (record.maxTokens as number) < 1 || (record.maxTokens as number) > 200000) {
    invalid("maxTokens 必须是 1 到 200000 的整数");
  }
  if (!Number.isInteger(record.timeoutMs) || (record.timeoutMs as number) < 1000 || (record.timeoutMs as number) > 120000) {
    invalid("timeoutMs 必须是 1000 到 120000 的整数");
  }
  const endpoint = normalizeBaseUrl(record.baseUrl);
  return {
    id,
    name: requiredText(record.name, "name", 80),
    ...endpoint,
    model: requiredText(record.model, "model", 160),
    embeddingModel: optionalText(record.embeddingModel, "embeddingModel", 160),
    temperature: record.temperature,
    maxTokens: record.maxTokens as number,
    timeoutMs: record.timeoutMs as number,
  };
}

export function redactProfile(
  profile: ValidatedModelProfile & { active?: boolean },
  hasApiKey: boolean,
): PublicModelProfile {
  return {
    id: profile.id,
    name: profile.name,
    baseUrl: profile.baseUrl,
    model: profile.model,
    embeddingModel: profile.embeddingModel,
    temperature: profile.temperature,
    maxTokens: profile.maxTokens,
    timeoutMs: profile.timeoutMs,
    active: Boolean(profile.active),
    hasApiKey: Boolean(hasApiKey),
  };
}

export function parseStoredProfile(input: unknown): StoredModelProfile {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    invalid("Python 返回的模型配置必须是对象");
  }
  const record = input as Record<string, unknown>;
  const expected = new Set([...PROFILE_FIELDS, "origin", "apiKeyCiphertext", "active"]);
  if (Object.keys(record).some((field) => !expected.has(field)) || Object.keys(record).length !== expected.size) {
    invalid("Python 返回的模型配置字段无效");
  }
  const profile = validateProfile({
    id: record.id,
    name: record.name,
    baseUrl: record.baseUrl,
    model: record.model,
    embeddingModel: record.embeddingModel,
    temperature: record.temperature,
    maxTokens: record.maxTokens,
    timeoutMs: record.timeoutMs,
  });
  if (record.origin !== profile.origin) invalid("Python 返回的 provider origin 与 baseUrl 不一致");
  if (record.apiKeyCiphertext !== null && typeof record.apiKeyCiphertext !== "string") {
    invalid("Python 返回的 API Key 密文无效");
  }
  if (typeof record.active !== "boolean") invalid("Python 返回的 active 状态无效");
  return {
    ...profile,
    apiKeyCiphertext: record.apiKeyCiphertext,
    active: record.active,
  };
}

export function redactSecrets(message: unknown, secrets: readonly string[]): string {
  let safe = String(message);
  for (const secret of secrets.filter(Boolean).sort((left, right) => right.length - left.length)) {
    safe = safe.replaceAll(secret, "[REDACTED]");
  }
  return safe.replace(
    /authorization\s*:\s*(?:bearer\s+)?\[REDACTED\]/gi,
    "Authorization: [REDACTED]",
  );
}
