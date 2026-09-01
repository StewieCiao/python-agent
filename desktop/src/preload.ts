import { contextBridge, ipcRenderer } from "electron";
import type { StewieDesktopBridge } from "./bridge";

const bridge: StewieDesktopBridge = Object.freeze({
  appInfo: () => ipcRenderer.invoke("app:info"),
  listModelProfiles: () => ipcRenderer.invoke("profiles:list"),
  saveModelProfile: (input) => ipcRenderer.invoke("profiles:save", input),
  activateModelProfile: (profileId) => ipcRenderer.invoke("profiles:activate", profileId),
  deleteModelProfile: (profileId) => ipcRenderer.invoke("profiles:delete", profileId),
  testModelProfile: (profileId) => ipcRenderer.invoke("models:test", profileId),
  chatWithModel: (input) => ipcRenderer.invoke("models:chat", input),
});

contextBridge.exposeInMainWorld("stewie", bridge);
