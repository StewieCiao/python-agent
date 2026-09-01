import type { BrowserWindowConstructorOptions } from "electron";
import { isAbsolute, relative, resolve } from "node:path";

const APP_PROTOCOL = "stewie:";
const APP_HOST = "app";

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

export function createDesktopSecurityPolicy(devServerUrl?: string) {
  const devUrl = devServerUrl ? parseUrl(devServerUrl) : null;
  const devOrigin = devUrl?.origin ?? null;

  function allowsRendererUrl(rawUrl: string): boolean {
    const url = parseUrl(rawUrl);
    if (!url) return false;
    if (url.protocol === APP_PROTOCOL && url.host === APP_HOST) return true;
    return devOrigin !== null && url.origin === devOrigin;
  }

  return {
    allowsRendererUrl,
    allowsIpcSender(rawUrl: string, isMainFrame: boolean): boolean {
      return isMainFrame && allowsRendererUrl(rawUrl);
    },
    permissionCheckHandler(): false {
      return false;
    },
    permissionRequestHandler(
      _webContents: unknown,
      _permission: unknown,
      callback: (allowed: boolean) => void,
    ): void {
      callback(false);
    },
  };
}

export function createWindowOptions(
  preloadPath: string,
  packaged: boolean,
): BrowserWindowConstructorOptions {
  return {
    width: 1440,
    height: 900,
    minWidth: 920,
    minHeight: 640,
    show: false,
    backgroundColor: "#f4f4ee",
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      devTools: !packaged,
      navigateOnDragDrop: false,
    },
  };
}

export function resolveAppAsset(rendererRoot: string, rawUrl: string): string {
  const url = parseUrl(rawUrl);
  if (!url || url.protocol !== APP_PROTOCOL || url.host !== APP_HOST) {
    throw new Error("应用资源地址无效");
  }
  if (/%2e/i.test(rawUrl)) {
    throw new Error("应用资源路径无效");
  }

  let pathname: string;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error("应用资源路径无效");
  }

  const relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const root = resolve(rendererRoot);
  const asset = resolve(root, relativePath);
  const fromRoot = relative(root, asset);
  if (fromRoot.startsWith("..") || isAbsolute(fromRoot)) {
    throw new Error("应用资源路径无效");
  }
  return asset;
}
