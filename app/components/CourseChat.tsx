"use client";

import { useEffect, useState } from "react";
import type { LearningLesson, LearningTrack } from "../lib/learningCatalog";
import {
  localServiceRequest,
  type ChatMessage,
  type ModelProfile,
} from "../lib/localServiceClient";

export function CourseChat({ track, lesson, onClose }: {
  track: LearningTrack;
  lesson: LearningLesson;
  onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<ModelProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [mode, setMode] = useState<"lesson" | "general">("lesson");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("正在读取本节聊天记录…");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      localServiceRequest<{ profiles: ModelProfile[] }>("/profiles"),
      localServiceRequest<{ messages: ChatMessage[] }>(`/chat-history?courseId=${encodeURIComponent(track.id)}&lessonId=${encodeURIComponent(lesson.id)}`),
    ]).then(([profileResult, historyResult]) => {
      setProfiles(profileResult.profiles);
      setProfileId(profileResult.profiles[0]?.id ?? "");
      setHistory(historyResult.messages);
      setStatus(profileResult.profiles.length === 0 ? "请先在模型设置中保存一个配置。" : "");
    }).catch((error) => {
      setStatus(`无法读取本地聊天数据：${error instanceof Error ? error.message : String(error)}`);
    });
  }, [lesson.id, track.id]);

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setStatus("");
    try {
      await action();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <aside aria-label="课程导师对话框" className="chat-drawer">
        <header>
          <div><span>STEWIE TUTOR</span><h2>课程导师</h2><p>{track.shortTitle} · {lesson.title}</p></div>
          <button aria-label="关闭课程导师" onClick={onClose} type="button">×</button>
        </header>

        <div className="chat-controls">
          <label>模型配置<select value={profileId} onChange={(event) => setProfileId(event.target.value)}>{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.model}</option>)}</select></label>
          <div className="mode-switch"><button className={mode === "lesson" ? "active" : ""} onClick={() => setMode("lesson")} type="button">课程模式</button><button className={mode === "general" ? "active" : ""} onClick={() => setMode("general")} type="button">普通模式</button></div>
        </div>

        <div className="chat-messages">
          {history.length === 0 && !status && <div className="chat-empty"><strong>从当前知识点开始提问</strong><p>课程模式会把本节讲义作为 JSON 数据发送给模型，不会把讲义中的文本当成指令。</p></div>}
          {history.map((item, index) => <div className={`chat-message ${item.role}`} key={`${item.createdAt ?? index}-${index}`}><span>{item.role === "user" ? "你" : "导师"}</span><p>{item.content}</p></div>)}
        </div>

        {status && <div className="chat-status" role="status">{status}</div>}
        <form className="chat-compose" onSubmit={(event) => {
          event.preventDefault();
          const question = message.trim();
          if (!question || !profileId) return;
          void perform(async () => {
            const result = await localServiceRequest<{ reply: string }>("/chat", {
              method: "POST",
              body: JSON.stringify({
                profileId,
                mode,
                courseId: track.id,
                lessonId: lesson.id,
                lessonContext: mode === "lesson" ? { courseId: track.id, lesson } : undefined,
                message: question,
              }),
            });
            setHistory((current) => [...current, { role: "user", content: question }, { role: "assistant", content: result.reply }]);
            setMessage("");
          });
        }}>
          <textarea aria-label="向课程导师提问" placeholder="输入你没理解的概念或代码问题…" value={message} onChange={(event) => setMessage(event.target.value)} />
          <div><button disabled={busy || history.length === 0} onClick={() => void perform(async () => {
            await localServiceRequest(`/chat-history?courseId=${encodeURIComponent(track.id)}&lessonId=${encodeURIComponent(lesson.id)}`, { method: "DELETE" });
            setHistory([]);
          })} type="button">清除本节记录</button><button className="primary-action" disabled={busy || !profileId || !message.trim()} type="submit">{busy ? "等待真实回复…" : "发送"}</button></div>
        </form>
      </aside>
    </div>
  );
}
