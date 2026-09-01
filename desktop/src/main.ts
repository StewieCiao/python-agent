import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  net,
  protocol,
  session,
} from "electron";
import started from "electron-squirrel-startup";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { DesktopAppInfo } from "./bridge";
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
      onFailure(error) {
        void runStartupTask(Promise.reject(error));
      },
    });
  }

  ipcMain.handle("app:info", (event): DesktopAppInfo => {
    const frameUrl = event.senderFrame?.url ?? "";
    const owner = BrowserWindow.fromWebContents(event.sender);
    const isMainFrame = event.senderFrame === event.sender.mainFrame;
    if (!owner || !securityPolicy.allowsIpcSender(frameUrl, isMainFrame)) {
      throw new Error("不可信的桌面页面不能读取应用信息");
    }
    return {
      name: app.getName(),
      version: app.getVersion(),
      platform: process.platform,
      architecture: process.arch,
      python: pythonService?.health ?? null,
    };
  });

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
