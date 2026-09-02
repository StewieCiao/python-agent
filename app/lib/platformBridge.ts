import { buildChatMessages } from "./chatPrompt.mjs";
import {
  LOCAL_SERVICE_URL,
  localServiceRequest,
  type ChatMessage,
  type ModelProfile,
} from "./localServiceClient.ts";
import type { ModelProfileInput } from "./modelConfig.ts";

declare const __STEWIE_DESKTOP__: boolean;

export function pythonWorkerUrl(): string {
  return new URL("python-worker.js", document.baseURI).toString();
}

export class PlatformRequestError extends Error {
  status: number | null;
  code: string;

  constructor(status: number | null, code: string, message: string) {
    super(message);
    this.name = "PlatformRequestError";
    this.status = status;
    this.code = code;
  }
}

function isDesktopBuild(): boolean {
  return typeof __STEWIE_DESKTOP__ !== "undefined" && __STEWIE_DESKTOP__;
}

function desktopBridge() {
  const bridge = typeof window === "undefined" ? null : window.stewie ?? null;
  if (!bridge && isDesktopBuild()) {
    throw new PlatformRequestError(
      null,
      "DESKTOP_BRIDGE_UNAVAILABLE",
      "桌面安全桥接未加载；已停止本次操作，不会改用浏览器模型服务。",
    );
  }
  return bridge;
}

function unwrapDesktop<T>(result: unknown): T {
  const value = result as {
    ok?: unknown;
    value?: unknown;
    error?: { status?: unknown; code?: unknown; message?: unknown };
  };
  if (value?.ok === true) return value.value as T;
  if (value?.ok === false && value.error && typeof value.error.message === "string") {
    throw new PlatformRequestError(
      typeof value.error.status === "number" ? value.error.status : null,
      typeof value.error.code === "string" ? value.error.code : "DESKTOP_OPERATION_ERROR",
      value.error.message,
    );
  }
  throw new PlatformRequestError(null, "INVALID_DESKTOP_RESPONSE", "桌面主进程返回了无效响应");
}

export async function listModelProfiles(): Promise<ModelProfile[]> {
  const desktop = desktopBridge();
  if (desktop) return unwrapDesktop(await desktop.listModelProfiles());
  return (await localServiceRequest<{ profiles: ModelProfile[] }>("/profiles")).profiles;
}

export async function saveModelProfile(
  profile: ModelProfileInput,
  apiKey?: string,
): Promise<ModelProfile> {
  const desktop = desktopBridge();
  if (desktop) {
    return unwrapDesktop(await desktop.saveModelProfile({ profile, ...(apiKey ? { apiKey } : {}), makeActive: true }));
  }
  const result = await localServiceRequest<{ profile: ModelProfile }>(`/profiles/${profile.id}`, {
    method: "PUT",
    body: JSON.stringify({ profile, ...(apiKey ? { apiKey } : {}) }),
  });
  return result.profile;
}

export async function deleteModelProfile(profileId: string): Promise<void> {
  const desktop = desktopBridge();
  if (desktop) {
    unwrapDesktop(await desktop.deleteModelProfile(profileId));
    return;
  }
  await localServiceRequest(`/profiles/${profileId}`, { method: "DELETE" });
}

export async function testModelProfile(profileId: string): Promise<string> {
  const desktop = desktopBridge();
  if (desktop) return unwrapDesktop<{ reply: string }>(await desktop.testModelProfile(profileId)).reply;
  return (await localServiceRequest<{ reply: string }>(`/profiles/${profileId}/test`, { method: "POST" })).reply;
}

export async function loadCourseHistory(courseId: string, lessonId: string): Promise<{
  messages: ChatMessage[];
  persisted: boolean;
}> {
  const desktop = desktopBridge();
  if (desktop) {
    return {
      messages: unwrapDesktop(await desktop.listChatMessages(courseId, lessonId)),
      persisted: true,
    };
  }
  const result = await localServiceRequest<{ messages: ChatMessage[] }>(
    `/chat-history?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`,
  );
  return { messages: result.messages, persisted: true };
}

export async function clearCourseHistory(courseId: string, lessonId: string): Promise<void> {
  const desktop = desktopBridge();
  if (desktop) {
    unwrapDesktop(await desktop.clearChatMessages(courseId, lessonId));
    return;
  }
  await localServiceRequest(
    `/chat-history?courseId=${encodeURIComponent(courseId)}&lessonId=${encodeURIComponent(lessonId)}`,
    { method: "DELETE" },
  );
}

export async function sendCourseChat(input: {
  profileId: string;
  mode: "lesson" | "general";
  courseId: string;
  lessonId: string;
  lessonContext?: unknown;
  history: ChatMessage[];
  message: string;
}): Promise<string> {
  const desktop = desktopBridge();
  if (desktop) {
    const messages = buildChatMessages({
      mode: input.mode,
      lessonContext: input.lessonContext,
      history: input.history,
      message: input.message,
    });
    const reply = unwrapDesktop<{ reply: string }>(await desktop.chatWithModel({
      profileId: input.profileId,
      messages,
    })).reply;
    unwrapDesktop(await desktop.appendChatMessages(input.courseId, input.lessonId, [
      { role: "user", content: input.message, createdAt: new Date().toISOString() },
      { role: "assistant", content: reply, createdAt: new Date().toISOString() },
    ]));
    return reply;
  }
  return (await localServiceRequest<{ reply: string }>("/chat", {
    method: "POST",
    body: JSON.stringify({
      profileId: input.profileId,
      mode: input.mode,
      courseId: input.courseId,
      lessonId: input.lessonId,
      lessonContext: input.lessonContext,
      message: input.message,
    }),
  })).reply;
}

export async function modelStorageInfo(): Promise<{
  nonSecretPath: string;
  secretStorage: string;
  historyPath: string | null;
}> {
  const desktop = desktopBridge();
  if (desktop) {
    const info = await desktop.appInfo();
    return {
      nonSecretPath: info.storagePath,
      secretStorage: info.platform === "win32"
        ? "Windows DPAPI（Electron safeStorage）"
        : "macOS 钥匙串（Electron safeStorage）",
      historyPath: null,
    };
  }
  const health = await localServiceRequest<{
    configPath: string;
    historyPath: string;
    keychainService: string;
  }>("/health");
  return {
    nonSecretPath: health.configPath,
    secretStorage: `macOS 钥匙串 · service：${health.keychainService}`,
    historyPath: health.historyPath,
  };
}

export async function exportLearningData(): Promise<{ status: "cancelled" } | { status: "saved"; path: string }> {
  const desktop = desktopBridge();
  if (!desktop) throw new PlatformRequestError(null, "DESKTOP_ONLY", "学习数据导出仅在桌面版可用。");
  return unwrapDesktop(await desktop.exportLearningData());
}

export async function importLearningData(): Promise<{ status: "cancelled" } | { status: "imported"; counts: Record<string, number> }> {
  const desktop = desktopBridge();
  if (!desktop) throw new PlatformRequestError(null, "DESKTOP_ONLY", "学习数据导入仅在桌面版可用。");
  return unwrapDesktop(await desktop.importLearningData());
}

export function platformServiceLabel(): string {
  if (typeof window !== "undefined" && window.stewie) return "内置桌面服务";
  return isDesktopBuild() ? "桌面安全桥接不可用" : LOCAL_SERVICE_URL;
}
