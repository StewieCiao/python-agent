import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  safeStorage,
  session,
  type IpcMainInvokeEvent,
} from "electron";
import started from "electron-squirrel-startup";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import type { DesktopAppInfo } from "./bridge";
import type { DesktopIpcError, DesktopIpcResult } from "./bridge";
import {
  ModelRequestError,
  createModelClient,
  type ModelClient,
  type ModelMessage,
} from "./modelClient.mjs";
import {
  SecureStorageError,
  createModelProfileService,
  type ModelProfileService,
} from "./modelProfileService.mjs";
import {
  startPythonService,
  type LegacyConversation,
  type PythonChatMessage,
  type PythonLearningState,
  type MasteryEvent,
  type PythonServiceClient,
} from "./pythonService.mjs";
import {
  createDesktopSecurityPolicy,
  createWindowOptions,
  resolveAppAsset,
} from "./securityPolicy.mjs";
import { createStartupBoundary } from "./startupBoundary.mjs";
import { migrateLegacyDesktopFiles } from "./legacyMigration.mjs";
import { learningTracks } from "../../app/content/publicCatalog.ts";
import { parseLearningExport } from "../../app/lib/learningExport.ts";
import { assertCatalogHashes } from "./catalogBundle.mts";
import { createRagService } from "./ragService.mjs";
import { evaluateRag } from "./ragEvaluation.mjs";

const ALL_LESSON_IDS = learningTracks.flatMap((track) => track.lessons.map((lesson) => lesson.id));

protocol.registerSchemesAsPrivileged([
  {
    scheme: "stewie",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);
app.enableSandbox();

if (started) {
  app.quit();
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
}

const devServerUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL || undefined;
const securityPolicy = createDesktopSecurityPolicy(devServerUrl);
let pythonService: PythonServiceClient | undefined;
let modelProfiles: ModelProfileService | undefined;
let modelClient: ModelClient | undefined;
const closingWindows = new WeakSet<BrowserWindow>();
const runStartupTask = createStartupBoundary({
  showError(message) {
    dialog.showErrorBox("Stewie LearnOS 启动失败", message);
  },
  quit() {
    for (const window of BrowserWindow.getAllWindows()) closingWindows.add(window);
    app.quit();
  },
});

async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow(
    createWindowOptions(join(__dirname, "preload.js"), app.isPackaged),
  );
  let rendererReady = false;
  window.webContents.once("did-finish-load", () => {
    rendererReady = true;
  });
  window.on("close", (event) => {
    if (closingWindows.has(window) || !rendererReady) return;
    event.preventDefault();
    window.webContents.send("app:prepare-close");
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!securityPolicy.allowsRendererUrl(url)) event.preventDefault();
  });
  window.once("ready-to-show", () => window.show());

  if (devServerUrl) {
    await window.loadURL(devServerUrl);
  } else {
    await window.loadURL("stewie://app/index.html");
  }
  return window;
}

function assertTrustedIpc(event: IpcMainInvokeEvent): void {
  const frameUrl = event.senderFrame?.url ?? "";
  const owner = BrowserWindow.fromWebContents(event.sender);
  const isMainFrame = event.senderFrame === event.sender.mainFrame;
  if (!owner || !securityPolicy.allowsIpcSender(frameUrl, isMainFrame)) {
    throw new Error("不可信的桌面页面不能调用应用能力");
  }
}

function ipcFailure(error: unknown): DesktopIpcError {
  if (error instanceof ModelRequestError) {
    return { code: error.code, message: error.message, status: error.status };
  }
  if (error instanceof SecureStorageError) {
    return { code: "SECURE_STORAGE_ERROR", message: error.message, status: null };
  }
  return {
    code: "DESKTOP_OPERATION_ERROR",
    message: error instanceof Error ? error.message : String(error),
    status: null,
  };
}

function trustedIpc<TInput extends unknown[], TResult>(
  action: (...input: TInput) => Promise<TResult>,
) {
  return async (event: IpcMainInvokeEvent, ...input: TInput): Promise<DesktopIpcResult<TResult>> => {
    assertTrustedIpc(event);
    try {
      return { ok: true, value: await action(...input) };
    } catch (error) {
      return { ok: false, error: ipcFailure(error) };
    }
  };
}

function activeProfiles(): ModelProfileService {
  if (!modelProfiles) throw new Error("桌面模型配置服务尚未就绪");
  return modelProfiles;
}

function activeModelClient(): ModelClient {
  if (!modelClient) throw new Error("桌面模型客户端尚未就绪");
  return modelClient;
}

function activePythonService(): PythonServiceClient {
  if (!pythonService) throw new Error("Python 服务尚未就绪");
  return pythonService;
}

void runStartupTask(app.whenReady().then(async () => {
  session.defaultSession.setPermissionCheckHandler(securityPolicy.permissionCheckHandler);
  session.defaultSession.setPermissionRequestHandler(securityPolicy.permissionRequestHandler);

  if (!devServerUrl) {
    const rendererRoot = join(__dirname, "..", "renderer", MAIN_WINDOW_VITE_NAME);
    protocol.handle("stewie", async (request) => {
      try {
        return await net.fetch(pathToFileURL(resolveAppAsset(rendererRoot, request.url)).toString());
      } catch (error) {
        return new Response(error instanceof Error ? error.message : "应用资源读取失败", {
          status: 404,
        });
      }
    });

    pythonService = await startPythonService({
      resourcesPath: process.resourcesPath,
      platform: process.platform,
      databasePath: join(app.getPath("userData"), "stewie.db"),
      onFailure(error) {
        void runStartupTask(Promise.reject(error));
      },
    });
    assertCatalogHashes(pythonService.health.catalog);
    modelProfiles = createModelProfileService({
      store: pythonService,
      safeStorage,
      platform: process.platform,
    });
    modelClient = createModelClient({
      getProfileForRequest: (profileId) => activeProfiles().getProfileForRequest(profileId),
    });
    const migrationFailures = await migrateLegacyDesktopFiles({ service: pythonService });
    if (migrationFailures.length > 0) {
      dialog.showErrorBox("旧桌面数据未完全迁移", migrationFailures.join("\n"));
    }
  }

  ipcMain.handle("app:info", (event): DesktopAppInfo => {
    assertTrustedIpc(event);
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      architecture: process.arch,
      python: pythonService?.health ?? null,
      storagePath: join(app.getPath("userData"), "stewie.db"),
    };
  });
  ipcMain.handle("profiles:list", trustedIpc(() => activeProfiles().list()));
  ipcMain.handle("profiles:save", trustedIpc((input) => activeProfiles().save(input)));
  ipcMain.handle("profiles:activate", trustedIpc((profileId: string) => activeProfiles().activate(profileId)));
  ipcMain.handle("profiles:delete", trustedIpc((profileId: string) => activeProfiles().delete(profileId)));
  ipcMain.handle("models:test", trustedIpc(async (profileId: string) => ({
    reply: await activeModelClient().chat(profileId, [{ role: "user", content: "请只回复 OK" }]),
  })));
  ipcMain.handle("models:chat", trustedIpc(async (input: { profileId: string; messages: ModelMessage[] }) => ({
    reply: await activeModelClient().chat(input.profileId, input.messages),
  })));
  ipcMain.handle("models:rag", trustedIpc(async (input: { profileId: string; query: string; documents: Array<{ id: string; text: string; source: string }> }) => createRagService(activeModelClient()).answer(input.profileId, input.query, input.documents)));
  ipcMain.handle("models:rag-evaluate", trustedIpc(async (input: { profileId: string; cases: Array<{ query: string; expectedSources: string[] }>; documents: Array<{ id: string; text: string; source: string }> }) => {
    const rag = createRagService(activeModelClient());
    const result = await evaluateRag(rag, input.profileId, input.cases, input.documents);
    const profile = (await activeProfiles().list()).find((item) => item.id === input.profileId);
    if (!profile?.embeddingModel) throw new Error("评测完成但无法确定当前 Embedding 模型，结果未保存");
    const documentHash = createHash("sha256").update(JSON.stringify(input.documents), "utf8").digest("hex");
    await activePythonService().recordRagEvaluation({
      catalogHash: activePythonService().health.catalog.catalogHash,
      documentHash,
      embeddingModel: profile.embeddingModel,
      recordedAt: new Date().toISOString(),
      caseCount: result.caseResults.length,
      recallAtK: result.recallAtK,
      mrr: result.mrr,
      citationCoverage: result.citationCoverage,
      faithfulnessProxy: result.faithfulnessProxy,
      latencyMs: result.latencyMs,
    });
    return result;
  }));
  ipcMain.handle("models:rag-evaluation-list", trustedIpc(() => activePythonService().listRagEvaluations()));
  ipcMain.handle("documents:select", trustedIpc(async () => {
    const selection = await dialog.showOpenDialog({
      title: "选择 RAG 本地资料",
      properties: ["openFile", "multiSelections"],
      filters: [{ name: "学习资料", extensions: ["txt", "md", "markdown", "csv", "pdf"] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return [];
    return activePythonService().parseDocuments(selection.filePaths);
  }));
  ipcMain.handle("documents:save", trustedIpc((documents: Array<{ id: string; text: string; source: string }>) => activePythonService().saveRagDocuments(documents)));
  ipcMain.handle("documents:list", trustedIpc(() => activePythonService().listRagDocuments()));
  ipcMain.handle("documents:clear", trustedIpc(() => activePythonService().clearRagDocuments()));
  ipcMain.handle("learning:get", trustedIpc(() => activePythonService().getLearningState()));
  ipcMain.handle("learning:save", trustedIpc((state: PythonLearningState) => activePythonService().saveLearningState(state)));
  ipcMain.handle("mastery:record", trustedIpc((event: MasteryEvent) => activePythonService().recordMasteryAttempt(event)));
  ipcMain.handle("mastery:get", trustedIpc((now: string) => activePythonService().getMastery(now)));
  ipcMain.handle("tutor:plan", trustedIpc((now: string) => activePythonService().getTutorPlan(now)));
  ipcMain.handle("tutor:validate", trustedIpc((state) => activePythonService().validateTutorTurn(state)));
  ipcMain.handle("personalization:next", trustedIpc((lessonId: string, seed: number) => activePythonService().getPersonalizedExercise(lessonId, seed)));
  ipcMain.handle("learning:import-legacy", trustedIpc((state: PythonLearningState, rawSource: string) => {
    const sourceHash = createHash("sha256").update(rawSource, "utf8").digest("hex");
    return activePythonService().importLegacyLearningState(state, sourceHash);
  }));
  ipcMain.handle("chat:list", trustedIpc((courseId: string, lessonId: string) => activePythonService().listChatMessages(courseId, lessonId)));
  ipcMain.handle("chat:append", trustedIpc((courseId: string, lessonId: string, messages: readonly PythonChatMessage[]) => activePythonService().appendChatMessages(courseId, lessonId, messages)));
  ipcMain.handle("chat:clear", trustedIpc((courseId: string, lessonId: string) => activePythonService().clearChatMessages(courseId, lessonId)));
  ipcMain.handle("legacy:import", trustedIpc((input: { sourceKind: "model-profiles" | "chat-history"; sourceHash: string; profiles: unknown[] | null; conversations: LegacyConversation[] | null }) => activePythonService().importLegacy(input.sourceKind, input.sourceHash, input.profiles, input.conversations)));
  ipcMain.handle("legacy:record-failure", trustedIpc((input: { sourceKind: "model-profiles" | "chat-history"; sourceHash: string; errorMessage: string }) => activePythonService().recordLegacyFailure(input.sourceKind, input.sourceHash, input.errorMessage)));
  ipcMain.handle("learning:export", trustedIpc(async () => {
    const target = await dialog.showSaveDialog({
      title: "导出 Stewie 学习数据",
      defaultPath: join(app.getPath("documents"), "stewie-learning-export.json"),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (target.canceled || !target.filePath) return { status: "cancelled" as const };
    const document = await activePythonService().exportLearning();
    await writeFile(target.filePath, `${JSON.stringify(document)}\n`, { encoding: "utf8", flag: "w" });
    return { status: "saved" as const, path: target.filePath };
  }));
  ipcMain.handle("learning:import-export", trustedIpc(async () => {
    const selection = await dialog.showOpenDialog({
      title: "导入 Stewie 学习数据",
      properties: ["openFile"],
      filters: [{ name: "JSON", extensions: ["json"] }],
    });
    if (selection.canceled || selection.filePaths.length === 0) return { status: "cancelled" as const };
    const raw = await readFile(selection.filePaths[0], "utf8");
    const document = parseLearningExport(raw, ALL_LESSON_IDS);
    const result = await activePythonService().importLearningExport(document as unknown as Record<string, unknown>);
    return { status: "imported" as const, counts: result.counts };
  }));
  ipcMain.handle("app:close-ready", trustedIpc(async () => {
    for (const window of BrowserWindow.getAllWindows()) closingWindows.add(window);
    app.quit();
    return { closed: true as const };
  }));

  await createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void runStartupTask(createWindow());
    }
  });
}));

app.on("second-instance", () => {
  const window = BrowserWindow.getAllWindows()[0];
  if (!window) return;
  if (window.isMinimized()) window.restore();
  window.focus();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  pythonService?.stop();
});
