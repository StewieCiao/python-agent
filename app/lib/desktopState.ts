import { parseStoredProgress, type ValidatedProgress } from "./storageState.mjs";
import { PlatformRequestError } from "./platformBridge.ts";

const STORAGE_KEY = "python-agent-path-progress-v2";

declare const __STEWIE_DESKTOP__: boolean;

type DesktopResult<T> = {
  ok: boolean;
  value?: T;
  error?: { code?: unknown; message?: unknown; status?: unknown };
};

export type LearningLoadResult = {
  state: ValidatedProgress;
  migrationError: string | null;
  imported: boolean;
};

function isDesktopBuild() {
  return typeof __STEWIE_DESKTOP__ !== "undefined" && __STEWIE_DESKTOP__;
}

function requireDesktopBridge() {
  const bridge = typeof window === "undefined" ? undefined : window.stewie;
  if (!bridge && isDesktopBuild()) {
    throw new PlatformRequestError(
      null,
      "DESKTOP_BRIDGE_UNAVAILABLE",
      "桌面安全桥接未加载；已停止本次操作。",
    );
  }
  return bridge;
}

function unwrap<T>(result: DesktopResult<T>): T {
  if (result.ok === true && "value" in result) return result.value as T;
  if (result.ok === false && result.error && typeof result.error.message === "string") {
    throw new PlatformRequestError(
      typeof result.error.status === "number" ? result.error.status : null,
      typeof result.error.code === "string" ? result.error.code : "DESKTOP_OPERATION_ERROR",
      result.error.message,
    );
  }
  throw new PlatformRequestError(null, "INVALID_DESKTOP_RESPONSE", "桌面主进程返回了无效响应");
}

export async function importLegacyLearningState(
  raw: string,
  lessonIds: readonly string[],
): Promise<{ imported: boolean; state: ValidatedProgress }> {
  const bridge = requireDesktopBridge();
  if (!bridge) throw new PlatformRequestError(null, "DESKTOP_BRIDGE_UNAVAILABLE", "桌面安全桥接未加载；已停止本次操作。");
  const legacy = parseStoredProgress(raw, lessonIds);
  const result = unwrap(await bridge.importLegacyLearningState(legacy, raw));
  return {
    imported: result.imported,
    state: parseStoredProgress(JSON.stringify(result.state), lessonIds),
  };
}

export async function loadLearningState(lessonIds: readonly string[]): Promise<LearningLoadResult> {
  const bridge = requireDesktopBridge();
  if (bridge) {
    const state = parseStoredProgress(JSON.stringify(unwrap(await bridge.getLearningState())), lessonIds);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { state, migrationError: null, imported: false };
    try {
      const migration = await importLegacyLearningState(raw, lessonIds);
      return { ...migration, migrationError: null };
    } catch (error) {
      return {
        state,
        imported: false,
        migrationError: `旧版本地进度迁移失败：${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  return {
    state: raw ? parseStoredProgress(raw, lessonIds) : { completed: [], drafts: {}, mistakes: [] },
    migrationError: null,
    imported: false,
  };
}

export async function saveLearningState(state: ValidatedProgress): Promise<void> {
  const bridge = requireDesktopBridge();
  if (bridge) {
    unwrap(await bridge.saveLearningState(state));
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
