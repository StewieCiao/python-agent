"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CatalogLesson } from "./CatalogLesson";
import { CourseChat } from "./CourseChat";
import { ModelSettings } from "./ModelSettings";
import { lessons, lessonsByModule, learningTracks } from "../content/publicCatalog";
import type { LessonTest } from "../content/python/curriculum";
import type { LearningTrack } from "../content/learningCatalog";
import { loadMastery, loadPersonalizedExercise, pythonWorkerUrl, recordMasteryAttempt } from "../lib/platformBridge";
import {
  buildGptHelpPrompt,
  type GptHelpPromptInput,
  type PromptException,
  type PromptTestResult,
} from "../lib/gptPrompt.mjs";
import {
  createRunSnapshot,
  snapshotMatches,
  type RunSnapshot,
} from "../lib/runSnapshot.mjs";
import { loadLearningState, saveLearningState } from "../lib/desktopState.ts";

const PYODIDE_VERSION = "314.0.3";
const EXECUTION_TIMEOUT_MS = 4_000;

type TestResult = PromptTestResult;

type ExecutionResult = {
  output: string;
  stderr: string;
  exception: PromptException | null;
  tests: TestResult[];
  executionFailure?: {
    type: "ExecutionTimeout";
    message: string;
  };
};

type RunRecord = {
  snapshot: RunSnapshot;
  result: ExecutionResult;
};

type PendingRun = {
  token: string;
  timeoutId: ReturnType<typeof setTimeout>;
  resolve: (result: ExecutionResult) => void;
  reject: (error: Error) => void;
};

type WorkerMessage =
  | { type: "ready"; version: string }
  | { type: "initialization-error"; message: string }
  | { type: "run-result"; token: string; result: ExecutionResult }
  | { type: "run-error"; token: string; message: string };

type Mistake = {
  id: string;
  lessonId: string;
  createdAt: string;
  code: string;
  output: string;
  stderr: string;
  exception: PromptException | null;
  tests: TestResult[];
};

type StoredProgress = {
  completed: string[];
  drafts: Record<string, string>;
  mistakes: Mistake[];
};

type RuntimeState = "loading" | "ready" | "error";
type ViewMode = "learn" | "review" | "projects" | "settings";

const EMPTY_PROGRESS: StoredProgress = {
  completed: [],
  drafts: {},
  mistakes: [],
};

class ExecutionTimeoutError extends Error {
  constructor() {
    super(`代码执行超过 ${EXECUTION_TIMEOUT_MS / 1000} 秒，已终止本次运行。`);
    this.name = "ExecutionTimeoutError";
  }
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function feedbackTitle(result: ExecutionResult) {
  if (result.executionFailure) return "执行超时 · 本次运行已终止";
  if (result.exception) return `${result.exception.type} · 第 ${result.exception.line ?? "?"} 行`;
  const failed = result.tests.filter((test) => !test.passed).length;
  if (failed > 0) return `代码已运行 · ${failed} 项测试未通过`;
  return "全部通过 · 可以进入下一关";
}

function exceptionGuidance(exception: PromptException) {
  const guidance: Record<string, string> = {
    SyntaxError: "Python 无法解析这段代码。先查看标出的行和它上一行，检查冒号、括号与缩进。",
    IndentationError: "代码块缩进不一致。检查标出行是否与同一层级的语句对齐。",
    NameError: "程序使用了当前作用域中不存在的名字。对照异常消息检查变量定义与拼写。",
    TypeError: "某个操作收到不兼容的值类型。沿 traceback 定位调用，并检查参与运算的实际类型。",
    ValueError: "值的类型可接受，但内容不符合该操作要求。查看异常消息中的具体值。",
    IndexError: "列表索引超出当前范围。检查长度以及索引边界。",
    KeyError: "字典中不存在异常消息所示的键。检查键名或先明确判断键是否存在。",
    ZeroDivisionError: "除数为 0。回到标出行检查除数从哪里产生，并处理这个输入边界。",
  };
  return guidance[exception.type] ?? "已保留真实 traceback，但未能定位更多原因。请从最后一个 <learner> 行号向上检查调用链。";
}

function combinedOutput(result: ExecutionResult | null) {
  if (!result) return "";
  if (result.executionFailure) {
    return `【执行状态】\n${result.executionFailure.message}`;
  }
  return [
    "【标准输出】",
    result.output,
    "【标准错误】",
    result.stderr,
  ].join("\n");
}

export function LearningApp() {
  const [activeTrackId, setActiveTrackId] = useState<LearningTrack["id"]>("langchain-rag");
  const [activeLearningLessonId, setActiveLearningLessonId] = useState("memory-modernization");
  const [currentLessonId, setCurrentLessonId] = useState(lessons[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>("learn");
  const [progress, setProgress] = useState<StoredProgress>(EMPTY_PROGRESS);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceEnabled, setPersistenceEnabled] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [code, setCode] = useState(lessons[0].starterCode);
  const [runRecord, setRunRecord] = useState<RunRecord | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [runtimeState, setRuntimeState] = useState<RuntimeState>("loading");
  const [runtimeError, setRuntimeError] = useState("");
  const [revealedHints, setRevealedHints] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [personalized, setPersonalized] = useState<{ prompt: string; starterCode: string; hints: string[]; recommendation: string } | null>(null);
  const [personalizedStatus, setPersonalizedStatus] = useState("");
  const [personalizedLoading, setPersonalizedLoading] = useState(false);
  const [reviewQueueCount, setReviewQueueCount] = useState<number | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingRunRef = useRef<PendingRun | null>(null);
  const runLockRef = useRef(false);
  const progressRef = useRef(progress);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveVersionRef = useRef(0);
  const saveChainRef = useRef(Promise.resolve());
  const flushProgressSaveRef = useRef<() => Promise<void>>(() => Promise.resolve());
  const currentLessonIdRef = useRef(currentLessonId);
  const codeRef = useRef(code);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  progressRef.current = progress;

  const currentIndex = lessons.findIndex((lesson) => lesson.id === currentLessonId);
  const lesson = lessons[currentIndex];
  const activeTrack = learningTracks.find((track) => track.id === activeTrackId)!;
  const activeCatalogLesson = activeTrack.lessons.find((item) =>
    item.id === (activeTrackId === "python" ? currentLessonId : activeLearningLessonId)
  )!;
  const result = runRecord?.result ?? null;
  const completedPercent = Math.round((progress.completed.length / lessons.length) * 100);
  const visibleHintCount = revealedHints[lesson.id] ?? 0;
  const latestMistakes = useMemo(() => progress.mistakes.slice(0, 30), [progress.mistakes]);

  async function requestPersonalizedExercise() {
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
      setPersonalizedStatus(`暂时无法生成个性题：${errorMessage(error)}`);
    } finally {
      setPersonalizedLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    void loadLearningState(lessons.map((item) => item.id)).then((loaded) => {
      if (!active) return;
      const initialCode = loaded.state.drafts[lessons[0].id] ?? lessons[0].starterCode;
      codeRef.current = initialCode;
      setProgress(loaded.state);
      setCode(initialCode);
      setPersistenceEnabled(!loaded.migrationError);
      if (loaded.migrationError) setStorageError(loaded.migrationError);
      setHydrated(true);
    }).catch((error) => {
      if (!active) return;
      setStorageError(`本地学习记录无法读取：${errorMessage(error)}。已使用空白进度。`);
      setPersistenceEnabled(false);
      setHydrated(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.stewie) return;
    void loadMastery().then((mastery) => setReviewQueueCount(mastery.reviewQueue.length)).catch((error) => {
      setStorageError(`复习队列无法读取：${errorMessage(error)}`);
    });
  }, [progress.mistakes.length]);

  useEffect(() => {
    if (!hydrated || !persistenceEnabled) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const version = ++saveVersionRef.current;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      enqueueProgressSave(progress, version);
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [hydrated, persistenceEnabled, progress]);

  function enqueueProgressSave(snapshot: StoredProgress, version: number): Promise<void> {
    const task = saveChainRef.current.then(() => saveLearningState(snapshot));
    saveChainRef.current = task.then(() => undefined, () => undefined);
    void task.catch((error) => {
      if (version === saveVersionRef.current) {
        setStorageError(`本地学习记录保存失败：${errorMessage(error)}`);
      }
    });
    return task;
  }

  function flushProgressSave(): Promise<void> {
    if (!hydrated || !persistenceEnabled) return Promise.resolve();
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    const version = ++saveVersionRef.current;
    return enqueueProgressSave(progressRef.current, version);
  }

  flushProgressSaveRef.current = flushProgressSave;

  useEffect(() => {
    const desktop = typeof window === "undefined" ? null : window.stewie;
    if (!desktop) return;
    return desktop.onBeforeClose(() => {
      void flushProgressSaveRef.current().then(
        () => desktop.confirmClose(),
        (error) => setStorageError(`关闭前保存学习记录失败：${errorMessage(error)}`),
      );
    });
  }, [persistenceEnabled]);

  useEffect(() => {
    initializeWorker();
    return () => {
      const pending = pendingRunRef.current;
      if (pending) {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error("页面已关闭，运行已取消。"));
      }
      workerRef.current?.terminate();
      pendingRunRef.current = null;
      workerRef.current = null;
    };
  }, []);

  function initializeWorker() {
    setRuntimeState("loading");
    setRuntimeError("");
    workerRef.current?.terminate();
    workerRef.current = null;

    try {
      const worker = new Worker(pythonWorkerUrl(), { type: "module" });
      workerRef.current = worker;
      worker.addEventListener("message", (event: MessageEvent) => {
        const message = event.data as WorkerMessage;

        if (message.type === "ready") {
          setRuntimeState("ready");
          return;
        }
        if (message.type === "initialization-error") {
          setRuntimeState("error");
          setRuntimeError(message.message);
          return;
        }

        const pending = pendingRunRef.current;
        if (!pending || message.token !== pending.token) return;
        clearTimeout(pending.timeoutId);
        pendingRunRef.current = null;

        if (message.type === "run-result") {
          pending.resolve(message.result);
          return;
        }
        pending.reject(new Error(message.message));
      });
      worker.addEventListener("error", (event) => {
        const message = event.message || "Python Worker 发生未知错误。";
        const pending = pendingRunRef.current;
        if (pending) {
          clearTimeout(pending.timeoutId);
          pendingRunRef.current = null;
          pending.reject(new Error(message));
        }
        setRuntimeState("error");
        setRuntimeError(message);
      });
      worker.postMessage({ type: "initialize" });
    } catch (error) {
      setRuntimeState("error");
      setRuntimeError(errorMessage(error));
    }
  }

  function runInWorker(
    token: string,
    sourceCode: string,
    tests: LessonTest[],
  ): Promise<ExecutionResult> {
    const worker = workerRef.current;
    if (!worker || runtimeState !== "ready") {
      return Promise.reject(new Error("Python Worker 尚未就绪。"));
    }

    return new Promise<ExecutionResult>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const pending = pendingRunRef.current;
        if (!pending || pending.token !== token) return;
        pendingRunRef.current = null;
        worker.terminate();
        workerRef.current = null;
        pending.reject(new ExecutionTimeoutError());
        initializeWorker();
      }, EXECUTION_TIMEOUT_MS);

      pendingRunRef.current = { token, timeoutId, resolve, reject };
      worker.postMessage({ type: "run", token, code: sourceCode, tests });
    });
  }

  function openLesson(index: number, restoredCode?: string) {
    if (runLockRef.current) return;
    flushProgressSave();
    const nextLesson = lessons[index];
    const nextCode = restoredCode ?? progress.drafts[nextLesson.id] ?? nextLesson.starterCode;
    currentLessonIdRef.current = nextLesson.id;
    codeRef.current = nextCode;
    setCurrentLessonId(nextLesson.id);
    setCode(nextCode);
    setRunRecord(null);
    setNotice("");
    setViewMode("learn");
  }

  function selectTrack(track: LearningTrack) {
    if (runLockRef.current) return;
    setActiveTrackId(track.id);
    setActiveLearningLessonId(track.currentLessonId);
    setViewMode("learn");
    setNotice("");
  }

  function selectLearningLesson(lessonId: string) {
    if (runLockRef.current) return;
    if (activeTrackId === "python") {
      openLesson(lessons.findIndex((item) => item.id === lessonId));
      return;
    }
    setActiveLearningLessonId(lessonId);
    setViewMode("learn");
  }

  function updateCode(nextCode: string) {
    if (runLockRef.current) return;
    codeRef.current = nextCode;
    setCode(nextCode);
    setProgress((current) => ({
      ...current,
      drafts: { ...current.drafts, [lesson.id]: nextCode },
    }));
    if (runRecord) setRunRecord(null);
  }

  async function handleRun() {
    if (runLockRef.current || runtimeState !== "ready") return;
    flushProgressSave();
    runLockRef.current = true;
    const token = crypto.randomUUID();
    const snapshot = createRunSnapshot({
      token,
      lesson,
      code,
      attemptedHints: lesson.hints.slice(0, visibleHintCount),
    });
    setIsRunning(true);
    setNotice("");

    try {
      const execution = await runInWorker(token, snapshot.code, lesson.tests);
      if (!snapshotMatches(snapshot, currentLessonIdRef.current, codeRef.current)) {
        setNotice("运行完成，但当前关卡或代码已改变；旧结果未显示。");
        return;
      }
      setRunRecord({ snapshot, result: execution });
      const passed =
        execution.exception === null &&
        execution.tests.length > 0 &&
        execution.tests.every((test) => test.passed);

      if (lesson.familyId) {
        await recordMasteryAttempt({
          lessonId: snapshot.lessonId,
          familyId: lesson.familyId,
          outcome: passed ? "pass" : "fail",
          mistakeCodes: execution.tests.filter((test) => !test.passed).map((test) => test.name),
          createdAt: new Date().toISOString(),
        });
      }

      if (passed) {
        setProgress((current) => ({
          ...current,
          completed: current.completed.includes(snapshot.lessonId)
            ? current.completed
            : [...current.completed, snapshot.lessonId],
          drafts: { ...current.drafts, [snapshot.lessonId]: snapshot.code },
        }));
      } else {
        const mistake: Mistake = {
          id: `${snapshot.lessonId}-${Date.now()}`,
          lessonId: snapshot.lessonId,
          createdAt: new Date().toISOString(),
          code: snapshot.code,
          output: execution.output,
          stderr: execution.stderr,
          exception: execution.exception,
          tests: execution.tests,
        };
        setProgress((current) => ({
          ...current,
          drafts: { ...current.drafts, [snapshot.lessonId]: snapshot.code },
          mistakes: [mistake, ...current.mistakes].slice(0, 30),
        }));
      }
    } catch (error) {
      if (
        error instanceof ExecutionTimeoutError &&
        snapshotMatches(snapshot, currentLessonIdRef.current, codeRef.current)
      ) {
        setRunRecord({
          snapshot,
          result: {
            output: "",
            stderr: "",
            exception: null,
            tests: [],
            executionFailure: {
              type: "ExecutionTimeout",
              message: error.message,
            },
          },
        });
      } else if (!(error instanceof ExecutionTimeoutError)) {
        setRuntimeState("error");
        setRuntimeError(`Python 运行环境执行失败：${errorMessage(error)}`);
        workerRef.current?.terminate();
        workerRef.current = null;
      }
    } finally {
      runLockRef.current = false;
      setIsRunning(false);
    }
  }

  function revealHint() {
    setRevealedHints((current) => ({
      ...current,
      [lesson.id]: Math.min((current[lesson.id] ?? 0) + 1, lesson.hints.length),
    }));
  }

  async function copyGptHelp() {
    if (!runRecord) return;
    const promptInput: GptHelpPromptInput = {
      lessonTitle: runRecord.snapshot.lessonTitle,
      goal: runRecord.snapshot.goal,
      requirements: runRecord.snapshot.requirements,
      code: runRecord.snapshot.code,
      output: combinedOutput(runRecord.result),
      executionFailure: runRecord.result.executionFailure ?? null,
      exception: runRecord.result.exception,
      tests: runRecord.result.tests,
      attemptedHints: runRecord.snapshot.attemptedHints,
    };
    try {
      await navigator.clipboard.writeText(buildGptHelpPrompt(promptInput));
      setNotice("已复制求助内容");
    } catch (error) {
      setNotice(`复制失败：${errorMessage(error)}`);
    }
  }

  function restoreMistake(mistake: Mistake) {
    const index = lessons.findIndex((item) => item.id === mistake.lessonId);
    openLesson(index, mistake.code);
  }

  const runPassed =
    result !== null &&
    !result.executionFailure &&
    result.exception === null &&
    result.tests.length > 0 &&
    result.tests.every((test) => test.passed);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">S</div>
          <div>
            <strong>Stewie 的个人学习站</strong>
            <span>Python · LangChain · LangGraph</span>
          </div>
        </div>

        <div className="sidebar-progress">
          <div className="progress-copy">
            <span>Python 练习进度</span>
            <strong>{completedPercent}%</strong>
          </div>
          <div className="progress-track" aria-label={`学习进度 ${completedPercent}%`}>
            <span style={{ width: `${completedPercent}%` }} />
          </div>
          <small>{progress.completed.length} / {lessons.length} 个练习完成 · 不锁定顺序</small>
          {reviewQueueCount !== null && <small>待复习 {reviewQueueCount} 项</small>}
        </div>

        <nav className="course-nav" aria-label="个人学习课程">
          <div className="track-list">
            {learningTracks.map((track) => (
              <button className={`track-switch ${track.id === activeTrackId ? "active" : ""}`} disabled={isRunning} key={track.id} onClick={() => selectTrack(track)} type="button">
                <span style={{ background: track.accent }} />
                <div><strong>{track.shortTitle}</strong><small>{track.lessons.length} 节课程</small></div>
              </button>
            ))}
          </div>

          {activeTrackId === "python" ? lessonsByModule.map((group, moduleIndex) => (
            <section className="module-group" key={group.module}>
              <div className="module-title"><span>0{moduleIndex + 1}</span><strong>{group.module}</strong></div>
              {group.lessons.map((item) => {
                const completed = progress.completed.includes(item.id);
                return <button className={`lesson-link ${item.id === lesson.id && viewMode === "learn" ? "active" : ""}`} disabled={isRunning} key={item.id} onClick={() => selectLearningLesson(item.id)} type="button">
                  <span className={`lesson-state ${completed ? "complete" : ""}`}>{completed ? "✓" : item.number}</span>
                  <span><strong>{item.title}</strong><small>{item.minutes} 分钟</small></span>
                </button>;
              })}
            </section>
          )) : (
            <section className="module-group">
              <div className="module-title"><span>NOW</span><strong>{activeTrack.title}</strong></div>
              {activeTrack.lessons.map((item, index) => <button className={`lesson-link ${item.id === activeCatalogLesson.id && viewMode === "learn" ? "active" : ""}`} disabled={isRunning} key={item.id} onClick={() => selectLearningLesson(item.id)} type="button">
                <span className="lesson-state">{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{item.title}</strong><small>{item.minutes} 分钟</small></span>
              </button>)}
            </section>
          )}
        </nav>

        <div className="sidebar-foot">
          <span className={`runtime-dot ${runtimeState}`} />
          <div>
            <strong>
              {runtimeState === "ready"
                ? `Python ${PYODIDE_VERSION} 就绪`
                : runtimeState === "loading"
                  ? "正在准备 Python"
                  : "Python 加载失败"}
            </strong>
            <small>浏览器内真实运行</small>
          </div>
        </div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">STEWIE LEARNING DESK</span>
            <h1>{viewMode === "settings" ? "模型与本地数据设置" : activeTrack.title}</h1>
          </div>
          <nav className="view-tabs" aria-label="学习视图">
            <button
              className={viewMode === "learn" ? "active" : ""}
              disabled={isRunning}
              onClick={() => setViewMode("learn")}
              type="button"
            >
              课程
            </button>
            <button
              className={viewMode === "review" ? "active" : ""}
              disabled={isRunning}
              onClick={() => setViewMode("review")}
              type="button"
            >
              错题本 <span>{progress.mistakes.length}</span>
            </button>
            <button
              className={viewMode === "projects" ? "active" : ""}
              disabled={isRunning}
              onClick={() => setViewMode("projects")}
              type="button"
            >
              Agent 项目
            </button>
            <button
              className={viewMode === "settings" ? "active" : ""}
              disabled={isRunning}
              onClick={() => setViewMode("settings")}
              type="button"
            >
              模型设置
            </button>
            <button disabled={isRunning} onClick={() => setChatOpen(true)} type="button">
              课程导师
            </button>
          </nav>
        </header>

        {storageError && (
          <div className="storage-alert" role="alert">
            <strong>本地记录提示</strong>
            <span>{storageError}</span>
          </div>
        )}

        {viewMode === "learn" && (activeTrackId === "python" ? (
          <div className="learning-grid">
            <article className="lesson-pane">
              <div className="lesson-meta">
                <span>{lesson.module}</span>
                <span>关卡 {String(lesson.number).padStart(2, "0")}</span>
                <span>约 {lesson.minutes} 分钟</span>
              </div>
              <p className="lesson-kicker">{lesson.kicker}</p>
              <h2>{lesson.title}</h2>
              <p className="lesson-goal">{lesson.goal}</p>
              {lesson.source && (
                <a
                  className="lesson-source"
                  href={lesson.source.url}
                  rel="noreferrer"
                  target="_blank"
                >
                  路线参考 · {lesson.source.label} ↗
                </a>
              )}

              <section className="concept-section">
                <div className="section-heading">
                  <span>01</span>
                  <div>
                    <h3>知识讲解</h3>
                    <p>按“概念 → 拆解 → 避坑”的顺序阅读，再开始写代码。</p>
                  </div>
                </div>
                <div className="guide-list">
                  {lesson.concepts.map((guide, index) => (
                    <article className="guide-card" key={guide.title}>
                      <div className="guide-marker">
                        <span>{String(index + 1).padStart(2, "0")}</span>
                        <strong>{guide.kind}</strong>
                      </div>
                      <div className="guide-content">
                        <h4>{guide.title}</h4>
                        <p>{guide.body}</p>
                        <ul>
                          {guide.bullets.map((bullet) => (
                            <li key={bullet}>{bullet}</li>
                          ))}
                        </ul>
                        <pre><code>{guide.example}</code></pre>
                      </div>
                    </article>
                  ))}
                </div>
              </section>

              <section className="task-section">
                <div className="section-heading">
                  <span>02</span>
                  <h3>再动手</h3>
                </div>
                <div className="task-card">
                  <div className="task-topline">
                    <strong>{lesson.project ? "项目任务" : "本关任务"}</strong>
                    <span>{lesson.tests.length} 个自动测试</span>
                  </div>
                  <ul>
                    {lesson.requirements.map((requirement) => (
                      <li key={requirement}>{requirement}</li>
                    ))}
                  </ul>
                  <div className="personalized-practice">
                    <div>
                      <strong>根据错题生成一题</strong>
                      <p>只使用本机保存的错误模式，不发送代码或 API Key。</p>
                    </div>
                    <button disabled={personalizedLoading || isRunning} onClick={() => void requestPersonalizedExercise()} type="button">
                      {personalizedLoading ? "生成中…" : "生成个性题"}
                    </button>
                    {personalizedStatus && <p className="personalized-status" role="alert">{personalizedStatus}</p>}
                    {personalized && <div className="personalized-result">
                      <span>{personalized.recommendation}</span>
                      <strong>{personalized.prompt}</strong>
                      <pre><code>{personalized.starterCode}</code></pre>
                      {personalized.hints.map((hint) => <p key={hint}>提示：{hint}</p>)}
                    </div>}
                  </div>
                </div>
              </section>

              <section className="hint-section">
                <button
                  disabled={isRunning || visibleHintCount >= lesson.hints.length}
                  onClick={revealHint}
                  type="button"
                >
                  {visibleHintCount === 0 ? "给我一个提示" : "再给一个提示"}
                  <span>{visibleHintCount}/{lesson.hints.length}</span>
                </button>
                {lesson.hints.slice(0, visibleHintCount).map((hint, index) => (
                  <p key={hint}><strong>提示 {index + 1}</strong>{hint}</p>
                ))}
              </section>
            </article>

            <section className="code-pane">
              <div className="editor-card">
                <div className="editor-toolbar">
                  <div className="file-tab">
                    <span className="python-glyph">Py</span>
                    main.py
                  </div>
                  <div className="editor-actions">
                    <button
                      disabled={isRunning}
                      onClick={() => updateCode(lesson.starterCode)}
                      type="button"
                    >
                      重置
                    </button>
                    <button
                      className="run-button"
                      data-testid="run-code"
                      disabled={runtimeState !== "ready" || isRunning}
                      onClick={handleRun}
                      type="button"
                    >
                      {isRunning ? "运行中…" : "▶ 运行代码"}
                    </button>
                  </div>
                </div>
                <div className="editor-wrap">
                  <div className="line-numbers" ref={lineNumbersRef} aria-hidden="true">
                    {code.split("\n").map((_, index) => (
                      <span key={index}>{index + 1}</span>
                    ))}
                  </div>
                  <textarea
                    aria-label="Python 代码编辑器"
                    data-testid="code-editor"
                    onChange={(event) => updateCode(event.target.value)}
                    onBlur={flushProgressSave}
                    onKeyDown={(event) => {
                      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                        event.preventDefault();
                        void handleRun();
                      }
                      if (event.key === "Tab") {
                        event.preventDefault();
                        const target = event.currentTarget;
                        const next =
                          code.slice(0, target.selectionStart) +
                          "    " +
                          code.slice(target.selectionEnd);
                        const caret = target.selectionStart + 4;
                        updateCode(next);
                        requestAnimationFrame(() => target.setSelectionRange(caret, caret));
                      }
                    }}
                    onScroll={(event) => {
                      if (lineNumbersRef.current) {
                        lineNumbersRef.current.scrollTop = event.currentTarget.scrollTop;
                      }
                    }}
                    readOnly={isRunning}
                    spellCheck={false}
                    value={code}
                  />
                </div>
                <div className="editor-status">
                  <span>Python · UTF-8</span>
                  <span>⌘ / Ctrl + Enter 运行</span>
                </div>
              </div>

              <div className={`feedback-card ${runPassed ? "passed" : result ? "has-result" : ""}`}>
                <div className="feedback-header">
                  <div>
                    <span>03</span>
                    <strong>运行与反馈</strong>
                  </div>
                  <button
                    disabled={!result}
                    onClick={copyGptHelp}
                    type="button"
                  >
                    复制求助内容
                  </button>
                </div>

                {runtimeState === "error" && !result ? (
                  <div className="runtime-error" role="alert">
                    <strong>Python 环境未能加载</strong>
                    <p>{runtimeError}</p>
                    <p>代码和测试尚未执行，也没有生成模拟结果。</p>
                    <button onClick={initializeWorker} type="button">
                      重试加载同一版本
                    </button>
                  </div>
                ) : !result ? (
                  <div className="empty-feedback">
                    <div className="empty-icon">›_</div>
                    <strong>{runtimeState === "loading" ? "正在准备 Python…" : "写好后，运行一次看看"}</strong>
                    <p>这里会显示真实输出、异常行号、traceback 与逐项测试结果。</p>
                  </div>
                ) : (
                  <div className="feedback-content" data-testid="feedback-result">
                    <div className="result-summary">
                      <span className={runPassed ? "ok" : "issue"}>{runPassed ? "✓" : "!"}</span>
                      <div>
                        <strong>{feedbackTitle(result)}</strong>
                        <p>
                          {result.executionFailure
                            ? "本次执行已超时，测试未运行；Python Worker 正在从同一锁定版本重新加载。"
                            : result.exception
                            ? exceptionGuidance(result.exception)
                            : runPassed
                              ? "你的代码满足本关全部要求，进度已保存在本机。"
                              : "Python 已正常执行。请对照下面的实际结果、期望结果与判定规则逐项修正。"}
                        </p>
                      </div>
                    </div>

                    {!result.executionFailure && (
                      <>
                        <div className="output-block">
                          <div className="block-label">标准输出</div>
                          <pre>{result.output || "（程序没有标准输出）"}</pre>
                        </div>
                        {result.stderr && (
                          <div className="output-block stderr">
                            <div className="block-label">标准错误</div>
                            <pre>{result.stderr}</pre>
                          </div>
                        )}
                      </>
                    )}
                    {result.executionFailure && (
                      <div className="execution-timeout" role="alert">
                        <strong>执行超时</strong>
                        <p>{result.executionFailure.message}</p>
                        <p>没有继续运行测试，也没有生成模拟结果。请检查无限循环或过大的计算量。</p>
                      </div>
                    )}
                    {result.exception && (
                      <details className="traceback-block" open>
                        <summary>真实 traceback</summary>
                        <pre>{result.exception.traceback}</pre>
                      </details>
                    )}

                    {result.tests.length > 0 && (
                      <div className="test-results">
                        <div className="block-label">练习测试</div>
                        {result.tests.map((test) => (
                          <div className={test.passed ? "test-pass" : "test-fail"} key={test.name}>
                            <span>{test.passed ? "✓" : "×"}</span>
                            <div className="test-copy">
                              <strong>{test.name}</strong>
                              {test.detail && <p>{test.detail}</p>}
                              {test.rule && (
                                <div className="test-rule">
                                  <span>{test.kind === "structure" ? "教学构造" : "行为规则"}</span>
                                  {test.rule}
                                </div>
                              )}
                              {!test.passed && test.expected && (
                                <div className="test-comparison">
                                  <div>
                                    <span>实际结果</span>
                                    <code>{test.actual || "（测试未得到可比较结果）"}</code>
                                  </div>
                                  <div>
                                    <span>期望结果</span>
                                    <code>{test.expected}</code>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="feedback-footer">
                      <span aria-live="polite">{notice}</span>
                      {runPassed && currentIndex < lessons.length - 1 && (
                        <button onClick={() => openLesson(currentIndex + 1)} type="button">
                          下一关 →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        ) : (
          <CatalogLesson
            key={`${activeTrack.id}/${activeCatalogLesson.id}`}
            lesson={activeCatalogLesson}
            onOpenChat={() => setChatOpen(true)}
            track={activeTrack}
          />
        ))}

        {viewMode === "review" && (
          <section className="library-view">
            <div className="library-heading">
              <span>REVIEW LOOP</span>
              <h2>错题不是存档，是下一次练习。</h2>
              <p>每次未通过都会保留当时的代码、真实异常与测试结果。载入旧代码，修正后重新运行。</p>
            </div>
            {latestMistakes.length === 0 ? (
              <div className="empty-library">
                <strong>错题本还是空的</strong>
                <p>运行未通过的代码后，这里会自动出现一条可复习记录。</p>
                <button onClick={() => setViewMode("learn")} type="button">回到学习</button>
              </div>
            ) : (
              <div className="mistake-grid">
                {latestMistakes.map((mistake) => {
                  const item = lessons.find((candidate) => candidate.id === mistake.lessonId);
                  const failedCount = mistake.tests.filter((test) => !test.passed).length;
                  return (
                    <article className="mistake-card" key={mistake.id}>
                      <div className="mistake-meta">
                        <span>{item?.module}</span>
                        <time>{new Date(mistake.createdAt).toLocaleString("zh-CN")}</time>
                      </div>
                      <h3>{item?.title}</h3>
                      <p>
                        {mistake.exception
                          ? `${mistake.exception.type} · 第 ${mistake.exception.line ?? "?"} 行`
                          : `${failedCount} 项测试未通过`}
                      </p>
                      <pre>{mistake.code}</pre>
                      <button disabled={isRunning} onClick={() => restoreMistake(mistake)} type="button">
                        载入这次代码 →
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {viewMode === "projects" && (
          <section className="library-view">
            <div className="library-heading">
              <span>BUILD TO LEARN</span>
              <h2>把知识变成真正可交付的项目。</h2>
              <p>从 Python 工具到 RAG 与 LangGraph 工作流：读契约、做最小实现、看真实反馈，再整理测试和演示。</p>
            </div>
            <div className="project-grid">
              {learningTracks.flatMap((track) => track.lessons.filter((item) => item.project).map((item) => ({ track, item }))).map(({ track, item }) => {
                const completed = progress.completed.includes(item.id);
                return (
                  <article className="project-card" key={`${track.id}/${item.id}`}>
                    <div className="project-number">{track.shortTitle} · PROJECT</div>
                    <h3>{item.title}</h3>
                    <p>{item.summary}</p>
                    <div className="project-tags">
                      <span>{item.minutes} 分钟</span>
                      <span>{(item.browserChecks ?? []).length} 项验收</span>
                    </div>
                    <ol className="project-milestones">
                      <li>写清目标与输入输出</li>
                      <li>完成最小可运行版本</li>
                      <li>补边界测试并记录失败</li>
                      <li>整理 README 与演示步骤</li>
                    </ol>
                    <button disabled={isRunning} onClick={() => {
                      setActiveTrackId(track.id);
                      setActiveLearningLessonId(item.id);
                      setViewMode("learn");
                    }} type="button">
                      {completed ? "重新查看" : "开始项目"} →
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {viewMode === "settings" && <ModelSettings />}
      </section>
      {chatOpen && (
        <CourseChat
          key={`${activeTrack.id}/${activeCatalogLesson.id}`}
          lesson={activeCatalogLesson}
          onClose={() => setChatOpen(false)}
          track={activeTrack}
        />
      )}
    </main>
  );
}
