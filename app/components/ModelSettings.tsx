"use client";

import { useEffect, useRef, useState } from "react";
import type { ModelProfile } from "../lib/localServiceClient";
import {
  listModelProfiles,
  modelStorageInfo,
  platformServiceLabel,
  saveModelProfile,
  testModelProfile,
  exportLearningData,
  importLearningData,
} from "../lib/platformBridge";

const EMPTY_PROFILE = {
  id: "my-model",
  name: "我的模型",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-5-mini",
  embeddingModel: "",
  temperature: 0.2,
  maxTokens: 2048,
  timeoutMs: 30000,
};

type StorageInfo = {
  nonSecretPath: string;
  secretStorage: string;
  historyPath: string | null;
};

export function ModelSettings() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const apiKeyRef = useRef<HTMLInputElement>(null);
  const [savedProfiles, setSavedProfiles] = useState<ModelProfile[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("正在连接本地服务…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    Promise.all([
      modelStorageInfo(),
      listModelProfiles(),
    ]).then(([nextStorageInfo, profiles]) => {
      setStorageInfo(nextStorageInfo);
      setSavedProfiles(profiles);
      setMessage("安全模型服务已连接");
      setIsError(false);
    }).catch((error) => {
      setMessage(`本地服务连接失败：${error instanceof Error ? error.message : String(error)}`);
      setIsError(true);
    });
  }, []);

  async function perform(action: () => Promise<string>) {
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error));
      setIsError(true);
    } finally {
      setBusy(false);
    }
  }

  function editProfile(field: keyof typeof EMPTY_PROFILE, value: string) {
    setProfile((current) => ({
      ...current,
      [field]: field === "temperature" || field === "maxTokens" || field === "timeoutMs"
        ? Number(value)
        : value,
    }));
  }

  async function refreshProfiles() {
    setSavedProfiles(await listModelProfiles());
  }

  async function exportData() {
    await perform(async () => {
      const result = await exportLearningData();
      return result.status === "cancelled" ? "已取消导出。" : `学习数据已保存：${result.path}`;
    });
  }

  async function importData() {
    await perform(async () => {
      const result = await importLearningData();
      return result.status === "cancelled" ? "已取消导入。" : `学习数据已导入：${result.counts.messages} 条聊天消息。`;
    });
  }

  return (
    <section className="settings-view">
      <div className="page-intro">
        <span>LOCAL MODEL SETTINGS</span>
        <h2>模型配置只在这台电脑上生效。</h2>
        <p>云端 OpenAI、通义兼容接口和本机 Ollama 都使用同一个 OpenAI-compatible 配置格式。</p>
      </div>

      <div className={`service-state ${isError ? "error" : "ready"}`} role="status">
        <strong>{message}</strong>
        <span>服务：{platformServiceLabel()}</span>
      </div>

      <div className="settings-layout">
        <form className="settings-form" onSubmit={(event) => {
          event.preventDefault();
          void perform(async () => {
            const apiKey = apiKeyRef.current?.value ?? "";
            if (apiKeyRef.current) apiKeyRef.current.value = "";
            const result = await saveModelProfile(profile, apiKey || undefined);
            await refreshProfiles();
            return result.hasApiKey
              ? "配置已保存；API Key 已写入系统安全存储。"
              : "非敏感配置已保存；尚未设置 API Key。";
          });
        }}>
          <div className="form-heading">
            <h3>OpenAI-compatible 配置</h3>
            <p>API Key 保存后不会回显，也不会写入浏览器或配置 JSON。</p>
            <p>仅桌面完整版提供系统安全存储；浏览器和离线版不会接收或保存 API Key。</p>
          </div>
          <div className="form-grid">
            <label>配置 ID<input value={profile.id} onChange={(event) => editProfile("id", event.target.value)} /></label>
            <label>显示名称<input value={profile.name} onChange={(event) => editProfile("name", event.target.value)} /></label>
            <label className="wide">Base URL<input value={profile.baseUrl} onChange={(event) => editProfile("baseUrl", event.target.value)} /></label>
            <label className="wide">模型名称<input value={profile.model} onChange={(event) => editProfile("model", event.target.value)} /></label>
            <label className="wide">Embedding 模型（可选）<input value={profile.embeddingModel} onChange={(event) => editProfile("embeddingModel", event.target.value)} /></label>
            <label>Temperature<input min="0" max="2" step="0.1" type="number" value={profile.temperature} onChange={(event) => editProfile("temperature", event.target.value)} /></label>
            <label>Max tokens<input min="1" type="number" value={profile.maxTokens} onChange={(event) => editProfile("maxTokens", event.target.value)} /></label>
            <label>超时（毫秒）<input min="1000" max="120000" type="number" value={profile.timeoutMs} onChange={(event) => editProfile("timeoutMs", event.target.value)} /></label>
            <label>API Key<input autoComplete="new-password" placeholder="提交后立即清空且不回显" ref={apiKeyRef} type="password" /></label>
          </div>
          <div className="form-actions">
            <button className="primary-action" disabled={busy} type="submit">保存配置</button>
            <button disabled={busy} onClick={() => void perform(async () => {
              const reply = await testModelProfile(profile.id);
              return `连接测试成功：${reply}`;
            })} type="button">测试连接</button>
          </div>
        </form>

        <aside className="settings-notes">
          <h3>配置实际保存在哪里？</h3>
          {storageInfo ? <dl>
            <div><dt>非敏感参数与密文</dt><dd>{storageInfo.nonSecretPath}</dd></div>
            <div><dt>API Key 加密</dt><dd>{storageInfo.secretStorage}</dd></div>
            <div><dt>聊天历史</dt><dd>{storageInfo.historyPath ?? "当前浏览器会话"}</dd></div>
          </dl> : <p>连接本地服务后显示准确路径。</p>}
          <h3>已保存配置</h3>
          {savedProfiles.length === 0 ? <p>尚无配置。</p> : savedProfiles.map((item) => (
            <button className="saved-profile" key={item.id} onClick={() => setProfile({
              id: item.id,
              name: item.name,
              baseUrl: item.baseUrl,
              model: item.model,
              embeddingModel: item.embeddingModel ?? "",
              temperature: item.temperature,
              maxTokens: item.maxTokens,
              timeoutMs: item.timeoutMs,
            })} type="button">
              <strong>{item.name}</strong>
              <span>{item.model} · {item.hasApiKey ? "已配置 Key" : "无 Key"}</span>
            </button>
          ))}
          <h3>学习数据</h3>
          <p>导出不包含 API Key、模型密文或系统路径。</p>
          <div className="form-actions">
            <button disabled={busy} onClick={() => void exportData()} type="button">导出学习数据</button>
            <button disabled={busy} onClick={() => void importData()} type="button">导入学习数据</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
