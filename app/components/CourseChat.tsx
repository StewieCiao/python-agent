"use client";

import { useEffect, useState } from "react";
import type { CourseLesson, CourseTrack } from "../content/schema";
import {
  clearCourseHistory,
  listModelProfiles,
  loadCourseHistory,
  sendCourseChat,
  sendTutorChat,
  answerWithRag,
  evaluateRag,
  listRagEvaluations,
  selectRagDocuments,
  saveRagDocuments,
  listRagDocuments,
} from "../lib/platformBridge";
import {
  type ChatMessage,
  type ModelProfile,
} from "../lib/localServiceClient";

export function CourseChat({ track, lesson, onClose }: {
  track: CourseTrack;
  lesson: CourseLesson;
  onClose: () => void;
}) {
  const [profiles, setProfiles] = useState<ModelProfile[]>([]);
  const [profileId, setProfileId] = useState("");
  const [mode, setMode] = useState<"lesson" | "general">("lesson");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("正在读取本节聊天记录…");
  const [busy, setBusy] = useState(false);
  const [ragText, setRagText] = useState("");
  const [ragSource, setRagSource] = useState("本地资料");
  const [ragDocuments, setRagDocuments] = useState<Array<{ id: string; text: string; source: string }>>([]);
  const [ragQuery, setRagQuery] = useState("");
  const [ragResult, setRagResult] = useState<{ answer: string; sources: string[]; matches: Array<{ source: string; score: number }> } | null>(null);
  const [ragEvaluationInput, setRagEvaluationInput] = useState('[{"query":"请概括资料的核心概念","expectedSources":["本地资料"]}]');
  const [ragEvaluationResult, setRagEvaluationResult] = useState<Awaited<ReturnType<typeof evaluateRag>> | null>(null);
  const [ragEvaluationHistory, setRagEvaluationHistory] = useState<Awaited<ReturnType<typeof listRagEvaluations>>>([]);

  useEffect(() => {
    Promise.all([
      listModelProfiles(),
      loadCourseHistory(track.id, lesson.id),
    ]).then(([profileResult, historyResult]) => {
      setProfiles(profileResult);
      setProfileId(profileResult.find((profile) => profile.active)?.id ?? profileResult[0]?.id ?? "");
      setHistory(historyResult.messages);
      setStatus(profileResult.length === 0
        ? "请先在模型设置中保存一个配置。"
        : historyResult.persisted ? "" : "本次桌面对话仅保留在当前会话中。");
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

  function currentRagDocuments() {
    return ragDocuments.length > 0 ? ragDocuments : [{ id: "local-1", text: ragText, source: ragSource || "本地资料" }];
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

        {mode === "lesson" && <details className="rag-panel">
          <summary>用本地资料做一次 RAG 检索</summary>
          <p>资料只在本次桌面请求中使用，不会写入聊天历史；API Key 仍由桌面安全存储管理。</p>
          <textarea aria-label="RAG 本地资料" placeholder="粘贴一段本地 Markdown 或纯文本…" value={ragText} onChange={(event) => setRagText(event.target.value)} />
          <input aria-label="RAG 资料来源" placeholder="来源名称或文件名" value={ragSource} onChange={(event) => setRagSource(event.target.value)} />
          <button type="button" disabled={busy} onClick={() => void perform(async () => setRagDocuments(await selectRagDocuments()))}>选择本地资料（TXT / Markdown / CSV / PDF）</button>
          <div className="rag-library-actions">
            <button type="button" disabled={busy || ragDocuments.length === 0} onClick={() => void perform(async () => {
              const result = await saveRagDocuments(ragDocuments);
              setStatus(`已保存 ${result.saved} 个新资料片段到本地资料库。`);
            })}>保存到本地资料库</button>
            <button type="button" disabled={busy} onClick={() => void perform(async () => setRagDocuments(await listRagDocuments()))}>读取已保存资料</button>
          </div>
          <input aria-label="RAG 问题" placeholder="要从资料中回答的问题" value={ragQuery} onChange={(event) => setRagQuery(event.target.value)} />
          <button disabled={busy || !profileId || (!ragText.trim() && ragDocuments.length === 0) || !ragQuery.trim()} onClick={() => void perform(async () => {
            const result = await answerWithRag({ profileId, query: ragQuery, documents: currentRagDocuments() });
            setRagResult(result);
          })} type="button">检索并回答</button>
          {ragResult && <div className="rag-result"><strong>{ragResult.answer}</strong><small>来源：{ragResult.matches.map(({ source, score }) => `${source}（相似度 ${score.toFixed(2)}）`).join("、") || "无"}</small></div>}
          <details className="rag-evaluation">
            <summary>评测这批资料</summary>
            <p>输入 JSON 数组，每项包含 query 和 expectedSources；系统会逐条真实检索，不会把模型回答当成准确率真值。</p>
            <textarea aria-label="RAG 评测问答集" value={ragEvaluationInput} onChange={(event) => setRagEvaluationInput(event.target.value)} />
            <button disabled={busy || !profileId || (!ragText.trim() && ragDocuments.length === 0)} onClick={() => void perform(async () => {
              const cases = JSON.parse(ragEvaluationInput) as Array<{ query: string; expectedSources: string[] }>;
              setRagEvaluationResult(await evaluateRag({ profileId, cases, documents: currentRagDocuments() }));
            })} type="button">运行评测</button>
            {ragEvaluationResult && <div className="rag-evaluation-result">
              <small>recall@k：{ragEvaluationResult.recallAtK.toFixed(2)} · MRR：{ragEvaluationResult.mrr.toFixed(2)} · 引用覆盖：{ragEvaluationResult.citationCoverage.toFixed(2)} · 引用一致性代理：{ragEvaluationResult.faithfulnessProxy.toFixed(2)} · 总耗时：{Math.round(ragEvaluationResult.latencyMs)} ms</small>
              <small>{ragEvaluationResult.tokenUsage.reason}</small>
            </div>}
            <button disabled={busy} onClick={() => void perform(async () => setRagEvaluationHistory(await listRagEvaluations()))} type="button">查看已保存评测</button>
            {ragEvaluationHistory.length > 0 && <div className="rag-evaluation-result"><small>最近 {ragEvaluationHistory.length} 次评测：{ragEvaluationHistory.slice(0, 3).map((item) => `${item.recordedAt.slice(0, 16)} · recall ${item.recallAtK.toFixed(2)} · ${item.embeddingModel}`).join("；")}</small></div>}
          </details>
        </details>}

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
            const reply = mode === "lesson"
              ? await sendTutorChat({ profileId, courseId: track.id, lessonId: lesson.id, lessonContext: { courseId: track.id, lesson }, history, message: question })
              : await sendCourseChat({ profileId, mode, courseId: track.id, lessonId: lesson.id, history, message: question });
            setHistory((current) => [...current, { role: "user", content: question }, { role: "assistant", content: reply }]);
            setMessage("");
          });
        }}>
          <textarea aria-label="向课程导师提问" placeholder="输入你没理解的概念或代码问题…" value={message} onChange={(event) => setMessage(event.target.value)} />
          <div><button disabled={busy || history.length === 0} onClick={() => void perform(async () => {
            await clearCourseHistory(track.id, lesson.id);
            setHistory([]);
          })} type="button">清除本节记录</button><button className="primary-action" disabled={busy || !profileId || !message.trim()} type="submit">{busy ? "等待真实回复…" : "发送"}</button></div>
        </form>
      </aside>
    </div>
  );
}
