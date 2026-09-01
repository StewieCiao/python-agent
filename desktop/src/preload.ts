import { contextBridge, ipcRenderer } from "electron";
import type { StewieDesktopBridge } from "./bridge";

const bridge: StewieDesktopBridge = Object.freeze({
  appInfo: () => ipcRenderer.invoke("app:info"),
});

contextBridge.exposeInMainWorld("stewie", bridge);
