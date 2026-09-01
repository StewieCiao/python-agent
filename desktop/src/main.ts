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
import { pathToFileURL } from "node:url";
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
import { startPythonService, type PythonServiceClient } from "./pythonService.mjs";
import {
  createDesktopSecurityPolicy,
  createWindowOptions,
  resolveAppAsset,
} from "./securityPolicy.mjs";
import { createStartupBoundary } from "./startupBoundary.mjs";

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
const runStartupTask = createStartupBoundary({
  showError(message) {
    dialog.showErrorBox("Stewie LearnOS 启动失败", message);
  },
  quit() {
    app.quit();
  },
});

async function createWindow(): Promise<BrowserWindow> {
  const window = new BrowserWindow(
    createWindowOptions(join(__dirname, "preload.js"), app.isPackaged),
  );

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
    modelProfiles = createModelProfileService({
      store: pythonService,
      safeStorage,
      platform: process.platform,
    });
    modelClient = createModelClient({
      getProfileForRequest: (profileId) => activeProfiles().getProfileForRequest(profileId),
    });
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

app.on("before-quit", () => {
  pythonService?.stop();
});
