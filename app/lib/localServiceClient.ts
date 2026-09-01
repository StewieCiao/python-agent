import type { PublicModelProfile } from "./modelConfig.ts";

export const LOCAL_SERVICE_URL = "http://127.0.0.1:4318";

export type ModelProfile = PublicModelProfile;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

export class LocalServiceError extends Error {
  status: number;
  code: string;

  constructor(
    status: number,
    code: string,
    message: string,
  ) {
    super(message);
    this.name = "LocalServiceError";
    this.status = status;
    this.code = code;
  }
}

export async function localServiceRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${LOCAL_SERVICE_URL}${path}`, {
    ...init,
    headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    signal: AbortSignal.timeout(125_000),
  });
  const raw = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new LocalServiceError(
      response.status || 502,
      "INVALID_LOCAL_RESPONSE",
      `本地服务返回的 JSON 无法解析：${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) {
    const failure = payload as { code?: unknown; message?: unknown };
    throw new LocalServiceError(
      response.status,
      typeof failure.code === "string" ? failure.code : "LOCAL_SERVICE_ERROR",
      typeof failure.message === "string" ? failure.message : `本地服务请求失败（HTTP ${response.status}）`,
    );
  }
  return payload as T;
}
