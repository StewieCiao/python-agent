import type { PythonHealth } from "./pythonService.mjs";
import type { ModelProfileInput, PublicModelProfile } from "../../app/lib/modelConfig.ts";
import type { ModelMessage } from "./modelClient.mjs";

export type DesktopAppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
  python: PythonHealth | null;
  storagePath: string;
};

export type DesktopIpcError = {
  code: string;
  message: string;
  status: number | null;
};

export type DesktopIpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DesktopIpcError };

export type SaveModelProfileInput = {
  profile: ModelProfileInput;
  apiKey?: string;
  makeActive: boolean;
};

export type StewieDesktopBridge = {
  appInfo(): Promise<DesktopAppInfo>;
  listModelProfiles(): Promise<DesktopIpcResult<PublicModelProfile[]>>;
  saveModelProfile(input: SaveModelProfileInput): Promise<DesktopIpcResult<PublicModelProfile>>;
  activateModelProfile(profileId: string): Promise<DesktopIpcResult<PublicModelProfile>>;
  deleteModelProfile(profileId: string): Promise<DesktopIpcResult<{ deleted: true }>>;
  testModelProfile(profileId: string): Promise<DesktopIpcResult<{ reply: string }>>;
  chatWithModel(input: { profileId: string; messages: ModelMessage[] }): Promise<DesktopIpcResult<{ reply: string }>>;
};

declare global {
  interface Window {
    stewie: StewieDesktopBridge;
  }
}
