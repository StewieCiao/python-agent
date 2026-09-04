"use client";

import { useState } from "react";
import type { CourseLesson, CourseTrack } from "../content/schema";
import { learningTracks } from "../content/publicCatalog";
import { loadPersonalizedExercise } from "../lib/platformBridge";

export function CatalogLesson({ track, lesson, onOpenChat, completed, onComplete }: {
  track: CourseTrack;
  lesson: CourseLesson;
  onOpenChat: () => void;
  completed: boolean;
  onComplete: () => void;
}) {
  const [code, setCode] = useState(lesson.exercise.starterCode);
  const [showSolution, setShowSolution] = useState(false);
  const [personalized, setPersonalized] = useState<{ prompt: string; starterCode: string; hints: string[]; recommendation: string } | null>(null);
  const [personalizedStatus, setPersonalizedStatus] = useState("");
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const prerequisiteTitles = (lesson.prerequisites ?? []).map((id) => {
    const prerequisiteTrack = learningTracks.find((candidateTrack) => candidateTrack.lessons.some((item) => item.id === id));
    const title = prerequisiteTrack?.lessons.find((item) => item.id === id)?.title ?? id;
    return prerequisiteTrack && prerequisiteTrack.id !== track.id ? `${prerequisiteTrack.shortTitle} · ${title}` : title;
  });

  async function requestPersonalized() {
    if (!lesson.familyId) return;
    setPersonalizedLoading(true);
    setPersonalizedStatus("");
    try {
      const result = await loadPersonalizedExercise(lesson.id, Date.now());
      setPersonalized({
        prompt: result.exercise.prompt,
        starterCode: result.exercise.starterCode,
        hints: result.exercise.hints,
        recommendation: result.recommendation.mistakeCodes.length > 0
          ? `根据错题模式：${result.recommendation.mistakeCodes.join("、")}`
          : "根据当前练习 family 推荐",
      });
    } catch (error) {
      setPersonalized(null);
      setPersonalizedStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setPersonalizedLoading(false);
    }
  }

  return (
    <div className="catalog-grid">
      <article className="catalog-content">
        <div className="lesson-meta">
          <span>{track.shortTitle}</span>
          <span>约 {lesson.minutes} 分钟</span>
          <span>{prerequisiteTitles.length > 0 ? `建议先学：${prerequisiteTitles.join("、")}` : "建议从本节开始"}</span>
        </div>
        <p className="lesson-kicker">CURRENT LEARNING MODULE</p>
        <h2>{lesson.title}</h2>
        <p className="lesson-goal">{lesson.summary}</p>
        <button className="lesson-complete" onClick={onComplete} type="button">{completed ? "已标记完成" : "标记本节完成"}</button>
        <div className="source-row">
          {lesson.officialSources.map((source) => <a href={source.url} key={source.url} rel="noreferrer" target="_blank">{source.label} ↗</a>)}
        </div>

        <section className="concept-section">
          <div className="section-heading"><span>01</span><div><h3>知识模块</h3><p>先建立概念边界，再跟着例子理解。</p></div></div>
          <div className="guide-list">
            {lesson.guide.map((guide, index) => (
              <article className="guide-card" key={guide.title}>
                <div className="guide-marker"><span>{String(index + 1).padStart(2, "0")}</span><strong>核心概念</strong></div>
                <div className="guide-content"><h4>{guide.title}</h4><p>{guide.body}</p><ul>{guide.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul><pre><code>{guide.example}</code></pre></div>
              </article>
            ))}
          </div>
        </section>

        {lesson.migrations.length > 0 && <section className="migration-section">
          <div className="section-heading"><span>02</span><div><h3>新版迁移卡</h3><p>旧课程写法与当前官方语义逐项对照。</p></div></div>
          {lesson.migrations.map((migration) => <article className="migration-card" key={migration.title}>
            <div className="migration-title"><span>{migration.status}</span><h4>{migration.title}</h4></div>
            <p>{migration.explanation}</p>
            <div className="migration-code"><div><span>课程写法</span><pre>{migration.beforeCode}</pre></div><div><span>当前写法</span><pre>{migration.afterCode}</pre></div></div>
            <footer><span>核验：{migration.verifiedAt} · LangChain {migration.verifiedVersions.langchain} / LangGraph {migration.verifiedVersions.langgraph}</span>{migration.officialSources.map((source) => <a href={source.url} key={source.url} rel="noreferrer" target="_blank">{source.label} ↗</a>)}</footer>
          </article>)}
        </section>}

        <section className="video-section">
          <div className="section-heading"><span>{lesson.migrations.length > 0 ? "03" : "02"}</span><div><h3>配套视频</h3><p>主线中文课程与高质量官方补充。</p></div></div>
          <div className="video-grid">{lesson.videos.map((video) => <a className="video-card" href={video.url} key={video.url} rel="noreferrer" target="_blank"><span>{video.provider} · {video.language}</span><h4>{video.title}</h4><p>{video.note}</p><footer>{video.duration}<strong>打开视频 ↗</strong></footer></a>)}</div>
        </section>
      </article>

      <aside className="catalog-practice">
        <div className="practice-card">
          <span className="practice-label">PRACTICE</span>
          <h3>本节练习</h3>
          <p>{lesson.exercise.prompt}</p>
          <textarea aria-label="课程代码编辑器" onChange={(event) => setCode(event.target.value)} spellCheck={false} value={code} />
          <div className="practice-actions"><button onClick={() => setCode(lesson.exercise.starterCode)} type="button">重置</button><button className="primary-action" onClick={() => setShowSolution((current) => !current)} type="button">{showSolution ? "隐藏参考答案" : "查看参考答案"}</button></div>
          {showSolution && <pre className="solution-block"><code>{lesson.exercise.solution}</code></pre>}
          <p className="practice-note">此编辑器用于整理练习；涉及 LangChain/LangGraph 依赖的代码请在你的项目环境运行，本站不会伪造执行结果。</p>
          {lesson.familyId && <div className="catalog-personalized">
            <div><strong>根据错题生成一题</strong><small>仅使用本机错误模式，不发送代码或 API Key。</small></div>
            <button disabled={personalizedLoading} onClick={() => void requestPersonalized()} type="button">{personalizedLoading ? "生成中…" : "生成个性题"}</button>
            {personalizedStatus && <p role="alert">个性题生成失败：{personalizedStatus}</p>}
            {personalized && <div className="catalog-personalized-result">
              <span>{personalized.recommendation}</span>
              <strong>{personalized.prompt}</strong>
              <pre><code>{personalized.starterCode}</code></pre>
              {personalized.hints.map((hint) => <small key={hint}>提示：{hint}</small>)}
              <button onClick={() => { setCode(personalized.starterCode); setShowSolution(false); }} type="button">载入编辑器</button>
            </div>}
          </div>}
        </div>
        <button className="chat-launch" onClick={onOpenChat} type="button"><span>AI</span><div><strong>问课程导师</strong><small>携带当前课程上下文</small></div>→</button>
      </aside>
    </div>
  );
}
