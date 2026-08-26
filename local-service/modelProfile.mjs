const PROFILE_FIELDS = new Set([
  "id",
  "name",
  "baseUrl",
  "model",
  "temperature",
  "maxTokens",
  "timeoutMs",
]);

export class ProfileValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ProfileValidationError";
  }
}

function invalid(message) {
  throw new ProfileValidationError(message);
}

function requiredText(value, field, maxLength) {
  if (typeof value !== "string" || value.trim().length === 0) {
    invalid(`${field} 不能为空`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) invalid(`${field} 过长`);
  return normalized;
}

function normalizedBaseUrl(value) {
  const raw = requiredText(value, "baseUrl", 500);
  let url;
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
  return url.toString().replace(/\/$/, "");
}

export function validateProfile(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    invalid("模型配置必须是对象");
  }
  for (const field of Object.keys(input)) {
    if (!PROFILE_FIELDS.has(field)) invalid(`未知配置字段 ${field}`);
  }

  const id = requiredText(input.id, "id", 64);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) {
    invalid("id 只能包含小写字母、数字和连字符");
  }
  const temperature = input.temperature;
  if (typeof temperature !== "number" || temperature < 0 || temperature > 2) {
    invalid("temperature 必须在 0 到 2 之间");
  }
  if (!Number.isInteger(input.maxTokens) || input.maxTokens < 1 || input.maxTokens > 200000) {
    invalid("maxTokens 必须是 1 到 200000 的整数");
  }
  if (!Number.isInteger(input.timeoutMs) || input.timeoutMs < 1000 || input.timeoutMs > 120000) {
    invalid("timeoutMs 必须是 1000 到 120000 的整数");
  }

  return {
    id,
    name: requiredText(input.name, "name", 80),
    baseUrl: normalizedBaseUrl(input.baseUrl),
    model: requiredText(input.model, "model", 160),
    temperature,
    maxTokens: input.maxTokens,
    timeoutMs: input.timeoutMs,
  };
}

export function redactProfile(profile, hasApiKey) {
  return { ...profile, hasApiKey: Boolean(hasApiKey) };
}
