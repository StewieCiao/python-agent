"use client";

import { useEffect, useState } from "react";
import {
  LOCAL_SERVICE_URL,
  localServiceRequest,
  type ModelProfile,
} from "../lib/localServiceClient";

const EMPTY_PROFILE = {
  id: "my-model",
  name: "我的模型",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-5-mini",
  temperature: 0.2,
  maxTokens: 2048,
  timeoutMs: 30000,
};

type Health = {
  ready: true;
  configPath: string;
  historyPath: string;
  keychainService: string;
};

export function ModelSettings() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [apiKey, setApiKey] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<ModelProfile[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("正在连接本地服务…");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    Promise.all([
      localServiceRequest<Health>("/health"),
      localServiceRequest<{ profiles: ModelProfile[] }>("/profiles"),
    ]).then(([nextHealth, result]) => {
      setHealth(nextHealth);
      setSavedProfiles(result.profiles);
      setMessage("本地服务已连接");
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
    const result = await localServiceRequest<{ profiles: ModelProfile[] }>("/profiles");
    setSavedProfiles(result.profiles);
  }

  return (
    <section className="settings-view">
      <div className="page-intro">
        <span>LOCAL MODEL SETTINGS</span>
        <h2>模型配置只在这台 Mac 上生效。</h2>
        <p>云端 OpenAI、通义兼容接口和本机 Ollama 都使用同一个 OpenAI-compatible 配置格式。</p>
      </div>

      <div className={`service-state ${isError ? "error" : "ready"}`} role="status">
        <strong>{message}</strong>
        <span>本地服务地址：{LOCAL_SERVICE_URL}</span>
      </div>

      <div className="settings-layout">
        <form className="settings-form" onSubmit={(event) => {
          event.preventDefault();
          void perform(async () => {
            const result = await localServiceRequest<{ profile: ModelProfile }>(`/profiles/${profile.id}`, {
              method: "PUT",
              body: JSON.stringify({ profile, ...(apiKey ? { apiKey } : {}) }),
            });
            setApiKey("");
            await refreshProfiles();
            return result.profile.hasApiKey
              ? "配置已保存；API Key 已写入 macOS 钥匙串。"
              : "非敏感配置已保存；尚未设置 API Key。";
          });
        }}>
          <div className="form-heading">
            <h3>OpenAI-compatible 配置</h3>
            <p>API Key 保存后不会回显，也不会写入浏览器或配置 JSON。</p>
          </div>
          <div className="form-grid">
            <label>配置 ID<input value={profile.id} onChange={(event) => editProfile("id", event.target.value)} /></label>
            <label>显示名称<input value={profile.name} onChange={(event) => editProfile("name", event.target.value)} /></label>
            <label className="wide">Base URL<input value={profile.baseUrl} onChange={(event) => editProfile("baseUrl", event.target.value)} /></label>
            <label className="wide">模型名称<input value={profile.model} onChange={(event) => editProfile("model", event.target.value)} /></label>
            <label>Temperature<input min="0" max="2" step="0.1" type="number" value={profile.temperature} onChange={(event) => editProfile("temperature", event.target.value)} /></label>
            <label>Max tokens<input min="1" type="number" value={profile.maxTokens} onChange={(event) => editProfile("maxTokens", event.target.value)} /></label>
            <label>超时（毫秒）<input min="1000" max="120000" type="number" value={profile.timeoutMs} onChange={(event) => editProfile("timeoutMs", event.target.value)} /></label>
            <label>API Key<input autoComplete="new-password" placeholder="保存后清空且不回显" type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-action" disabled={busy} type="submit">保存配置</button>
            <button disabled={busy} onClick={() => void perform(async () => {
              const result = await localServiceRequest<{ reply: string }>(`/profiles/${profile.id}/test`, { method: "POST" });
              return `连接测试成功：${result.reply}`;
            })} type="button">测试连接</button>
          </div>
        </form>

        <aside className="settings-notes">
          <h3>配置实际保存在哪里？</h3>
          {health ? <dl>
            <div><dt>非敏感参数</dt><dd>{health.configPath}</dd></div>
            <div><dt>API Key</dt><dd>macOS 钥匙串 · service：{health.keychainService}</dd></div>
            <div><dt>聊天历史</dt><dd>{health.historyPath}</dd></div>
          </dl> : <p>连接本地服务后显示准确路径。</p>}
          <h3>已保存配置</h3>
          {savedProfiles.length === 0 ? <p>尚无配置。</p> : savedProfiles.map((item) => (
            <button className="saved-profile" key={item.id} onClick={() => setProfile({
              id: item.id,
              name: item.name,
              baseUrl: item.baseUrl,
              model: item.model,
              temperature: item.temperature,
              maxTokens: item.maxTokens,
              timeoutMs: item.timeoutMs,
            })} type="button">
              <strong>{item.name}</strong>
              <span>{item.model} · {item.hasApiKey ? "已配置 Key" : "无 Key"}</span>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
