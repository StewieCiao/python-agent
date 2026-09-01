export type DesktopAppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
};

export type StewieDesktopBridge = {
  appInfo(): Promise<DesktopAppInfo>;
};

declare global {
  interface Window {
    stewie: StewieDesktopBridge;
  }
}
