import { buildChatMessages, ChatInputError } from "../app/lib/chatPrompt.mjs";
import { ProfileValidationError, redactProfile, redactSecrets, validateProfile } from "./modelProfile.mjs";
import { StorageError, createStorage } from "./storage.mjs";

const ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);
const MAX_BODY_BYTES = 256 * 1024;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.code = code;
  }
}

class UpstreamError extends HttpError {
  constructor(status, message) {
    super(status, "UPSTREAM_ERROR", message);
    this.name = "UpstreamError";
  }
}

function sendJson(response, status, payload, origin) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
  });
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
      throw new HttpError(413, "BODY_TOO_LARGE", "请求内容超过 256 KB");
    }
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new HttpError(400, "INVALID_JSON", `请求 JSON 无法解析：${error.message}`);
  }
}

function providerMessage(payload, rawText) {
  if (typeof payload?.error?.message === "string") return payload.error.message;
  if (typeof payload?.message === "string") return payload.message;
  return rawText || "上游模型返回错误";
}

async function callOpenAICompatible(profile, apiKey, messages) {
  const safeText = (value) => redactSecrets(value, [apiKey]);
  const response = await fetch(`${profile.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: profile.model,
      messages,
      temperature: profile.temperature,
      max_tokens: profile.maxTokens,
      stream: false,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(profile.timeoutMs),
  });
  const rawText = await response.text();
  let payload;
  try {
    payload = JSON.parse(rawText);
  } catch (error) {
    throw new UpstreamError(
      response.ok ? 502 : response.status,
      safeText(rawText || `模型返回无效 JSON：${error.message}`),
    );
  }
  if (!response.ok) {
    throw new UpstreamError(response.status, safeText(providerMessage(payload, rawText)));
  }
  const reply = payload?.choices?.[0]?.message?.content;
  if (typeof reply !== "string" || reply.length === 0) {
    throw new UpstreamError(502, "模型响应缺少 assistant content");
  }
  return reply;
}

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, "INVALID_INPUT", `${field} 不能为空`);
  }
  return value.trim();
}

export function createLocalService({ storageDirectory, keychain }) {
  const storage = createStorage(storageDirectory);

  async function findProfile(profileId) {
    const profile = (await storage.getProfiles()).find((item) => item.id === profileId);
    if (!profile) throw new HttpError(404, "PROFILE_NOT_FOUND", "模型配置不存在");
    return profile;
  }

  return async function localService(request, response) {
    const origin = request.headers.origin;
    try {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        throw new HttpError(403, "ORIGIN_FORBIDDEN", "只允许本地学习站访问模型服务");
      }
      if (request.method === "OPTIONS") {
        response.writeHead(204, {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          Vary: "Origin",
        });
        response.end();
        return;
      }

      const url = new URL(request.url, "http://127.0.0.1:4318");
      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, {
          ready: true,
          configPath: storage.profilesPath,
          historyPath: storage.historyPath,
          keychainService: "Stewie Learning Site",
        }, origin);
        return;
      }
      if (request.method === "GET" && url.pathname === "/profiles") {
        const profiles = await storage.getProfiles();
        const redacted = await Promise.all(profiles.map(async (profile) =>
          redactProfile(profile, Boolean(await keychain.get(profile.id)))
        ));
        sendJson(response, 200, { profiles: redacted }, origin);
        return;
      }

      const profileMatch = url.pathname.match(/^\/profiles\/([^/]+)$/);
      if (profileMatch && request.method === "PUT") {
        const body = await readJsonBody(request);
        const wrapperFields = Object.keys(body);
        if (wrapperFields.some((field) => field !== "profile" && field !== "apiKey")) {
          throw new HttpError(400, "INVALID_INPUT", "配置请求包含未知字段");
        }
        const profile = validateProfile(body.profile);
        if (profile.id !== profileMatch[1]) {
          throw new HttpError(400, "INVALID_INPUT", "路径与配置 id 不一致");
        }
        const profiles = await storage.getProfiles();
        const nextProfiles = [...profiles.filter((item) => item.id !== profile.id), profile];
        await storage.saveProfiles(nextProfiles);
        if (body.apiKey !== undefined) {
          const apiKey = requiredText(body.apiKey, "apiKey");
          await keychain.set(profile.id, apiKey);
        }
        sendJson(response, 200, {
          profile: redactProfile(profile, Boolean(await keychain.get(profile.id))),
        }, origin);
        return;
      }
      if (profileMatch && request.method === "DELETE") {
        const profileId = profileMatch[1];
        const profiles = await storage.getProfiles();
        if (!profiles.some((item) => item.id === profileId)) {
          throw new HttpError(404, "PROFILE_NOT_FOUND", "模型配置不存在");
        }
        await keychain.delete(profileId);
        await storage.saveProfiles(profiles.filter((item) => item.id !== profileId));
        sendJson(response, 200, { deleted: true }, origin);
        return;
      }

      const testMatch = url.pathname.match(/^\/profiles\/([^/]+)\/test$/);
      if (testMatch && request.method === "POST") {
        const profile = await findProfile(testMatch[1]);
        const apiKey = await keychain.get(profile.id);
        if (!apiKey) throw new HttpError(400, "API_KEY_MISSING", "该配置尚未保存 API Key");
        const reply = await callOpenAICompatible(profile, apiKey, [
          { role: "user", content: "请只回复 OK" },
        ]);
        sendJson(response, 200, { reply }, origin);
        return;
      }

      if (request.method === "POST" && url.pathname === "/chat") {
        const body = await readJsonBody(request);
        const profile = await findProfile(requiredText(body.profileId, "profileId"));
        const apiKey = await keychain.get(profile.id);
        if (!apiKey) throw new HttpError(400, "API_KEY_MISSING", "该配置尚未保存 API Key");
        const courseId = requiredText(body.courseId, "courseId");
        const lessonId = requiredText(body.lessonId, "lessonId");
        const history = await storage.getHistory(courseId, lessonId);
        const messages = buildChatMessages({
          mode: body.mode,
          lessonContext: body.lessonContext,
          history,
          message: body.message,
        });
        const reply = await callOpenAICompatible(profile, apiKey, messages);
        await storage.appendHistory(courseId, lessonId, [
          { role: "user", content: body.message.trim() },
          { role: "assistant", content: reply },
        ]);
        sendJson(response, 200, { reply }, origin);
        return;
      }

      if (url.pathname === "/chat-history" && (request.method === "GET" || request.method === "DELETE")) {
        const courseId = requiredText(url.searchParams.get("courseId"), "courseId");
        const lessonId = requiredText(url.searchParams.get("lessonId"), "lessonId");
        if (request.method === "GET") {
          sendJson(response, 200, { messages: await storage.getHistory(courseId, lessonId) }, origin);
        } else {
          await storage.clearHistory(courseId, lessonId);
          sendJson(response, 200, { cleared: true }, origin);
        }
        return;
      }

      throw new HttpError(404, "NOT_FOUND", "本地服务接口不存在");
    } catch (error) {
      const knownInputError = error instanceof ProfileValidationError || error instanceof ChatInputError;
      const status = error instanceof HttpError
        ? error.status
        : knownInputError
          ? 400
          : error?.name === "TimeoutError"
            ? 504
            : 500;
      const code = error instanceof HttpError
        ? error.code
        : knownInputError
          ? "INVALID_INPUT"
          : error instanceof StorageError
            ? "LOCAL_STORAGE_ERROR"
            : error?.name === "TimeoutError"
              ? "UPSTREAM_TIMEOUT"
              : "LOCAL_SERVICE_ERROR";
      sendJson(response, status, { code, message: error.message }, origin && ALLOWED_ORIGINS.has(origin) ? origin : undefined);
    }
  };
}
