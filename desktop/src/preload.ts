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
  getLearningState: () => ipcRenderer.invoke("learning:get"),
  saveLearningState: (state) => ipcRenderer.invoke("learning:save", state),
  importLegacyLearningState: (state, rawSource) => ipcRenderer.invoke("learning:import-legacy", state, rawSource),
  listChatMessages: (courseId, lessonId) => ipcRenderer.invoke("chat:list", courseId, lessonId),
  appendChatMessages: (courseId, lessonId, messages) => ipcRenderer.invoke("chat:append", courseId, lessonId, messages),
  clearChatMessages: (courseId, lessonId) => ipcRenderer.invoke("chat:clear", courseId, lessonId),
  importLegacyDesktopData: (input) => ipcRenderer.invoke("legacy:import", input),
  recordLegacyDesktopFailure: (input) => ipcRenderer.invoke("legacy:record-failure", input),
  exportLearningData: () => ipcRenderer.invoke("learning:export"),
  importLearningData: () => ipcRenderer.invoke("learning:import-export"),
  onBeforeClose: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("app:prepare-close", listener);
    return () => ipcRenderer.removeListener("app:prepare-close", listener);
  },
  confirmClose: () => ipcRenderer.invoke("app:close-ready"),
});

contextBridge.exposeInMainWorld("stewie", bridge);
