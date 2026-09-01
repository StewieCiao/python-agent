import type { PythonHealth } from "./pythonService.mjs";

export type DesktopAppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
  python: PythonHealth | null;
};

export type StewieDesktopBridge = {
  appInfo(): Promise<DesktopAppInfo>;
};

declare global {
  interface Window {
    stewie: StewieDesktopBridge;
  }
}
