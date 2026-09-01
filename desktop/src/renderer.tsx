import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import type { DesktopAppInfo } from "./bridge";
import "./styles.css";

function DesktopShell() {
  const [appInfo, setAppInfo] = useState<DesktopAppInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    window.stewie.appInfo().then(setAppInfo, (reason) => {
      setError(reason instanceof Error ? reason.message : "应用信息读取失败");
    });
  }, []);

  return (
    <main className="shell">
      <section className="brand-card" aria-labelledby="app-title">
        <span className="eyebrow">LOCAL-FIRST LEARNING DESKTOP</span>
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">S</span>
          <div>
            <h1 id="app-title">Stewie LearnOS</h1>
            <p>Python · LangChain / RAG · LangGraph</p>
          </div>
        </div>
        <p className="intro">
          桌面运行基础已就绪。课程、个性化练习和本地 RAG 会在后续阶段接入同一个安全壳。
        </p>
        {appInfo ? (
          <p className="status" role="status">
            <span aria-hidden="true" />
            本地静态界面已加载 · {appInfo.platform} / {appInfo.architecture} · v{appInfo.version}
          </p>
        ) : error ? (
          <p className="error" role="alert">{error}</p>
        ) : (
          <p className="status" role="status">正在读取桌面环境…</p>
        )}
      </section>
    </main>
  );
}

const root = document.getElementById("root");
if (!root) throw new Error("桌面页面缺少 root 容器");

createRoot(root).render(
  <StrictMode>
    <DesktopShell />
  </StrictMode>,
);
