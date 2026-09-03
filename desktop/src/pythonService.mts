import { randomUUID } from "node:crypto";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { pythonExecutableRelativePath } from "../../scripts/python-runtime-manifest.mjs";
import type { ValidatedMistake, ValidatedProgress } from "../../app/lib/storageState.mjs";
import type { PromptException, PromptTestResult } from "../../app/lib/gptPrompt.mjs";

const PACKAGE_NAMES = [
  "langchain",
  "langgraph",
  "langgraph-checkpoint-sqlite",
  "pypdf",
] as const;

export type PythonHealth = {
  pythonVersion: string;
  packages: Record<(typeof PACKAGE_NAMES)[number], string>;
  sqlite: {
    version: string;
    transaction: boolean;
    fts5: boolean;
  };
  catalog: {
    schemaVersion: "stewie-catalog-v1";
    catalogHash: string;
    familyHash: string;
  };
};

export type PythonServiceFrame =
  | { id: string; ok: true; result: unknown }
  | { id: string; ok: false; error: { type: string; message: string } };

export type PythonLearningState = ValidatedProgress;

export type PythonChatMessage = {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type MasteryEvent = {
  lessonId: string;
  familyId: string;
  outcome: "pass" | "fail";
  mistakeCodes: string[];
  createdAt: string;
};

export type MasteryResult = {
  mastery: Record<string, { familyId: string; score: number; attempts: number; mistakeCodes: string[]; lastAttemptAt: string }>;
  reviewQueue: string[];
};

export type TutorPlan = {
  status: "review" | "start";
  steps: Array<{ lessonId: string; title: string; reason: string; actions: string[] }>;
};

export type TutorGraphState = {
  course_id: string;
  lesson_id: string;
  user_question: string;
  mastery_snapshot: Record<string, unknown>;
  retrieved_chunks: Array<{ id: string; source: string; text: string }>;
  response: { answer: string; citations: Array<{ source: string }> };
  citations: Array<{ source: string }>;
  next_action: string;
  thread_id: string;
};

export type PersonalizedExerciseResult = {
  exercise: { familyId: string; validatorVersion: string; prompt: string; starterCode: string; hints: string[]; parameters: Record<string, unknown>; tests: Array<{ name: string; expression: string; failure: string; kind: "behavior" | "structure" }> };
  recommendation: { lessonId: string; familyId: string; mistakeCodes: string[]; difficulty: string };
};

export type ParsedRagDocument = { id: string; text: string; source: string };

export type RagEvaluationRecord = {
  id: number;
  catalogHash: string;
  documentHash: string;
  embeddingModel: string;
  recordedAt: string;
  caseCount: number;
  recallAtK: number;
  mrr: number;
  citationCoverage: number;
  faithfulnessProxy: number;
  latencyMs: number;
};

export type LegacyConversation = { courseId: string; lessonId: string; messages: PythonChatMessage[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hasStringFields(value: Record<string, unknown>, keys: readonly string[]): boolean {
  return hasExactKeys(value, keys) && keys.every((key) => typeof value[key] === "string");
}

function isHealth(value: unknown): value is PythonHealth {
  if (!isRecord(value) || !hasExactKeys(value, ["pythonVersion", "packages", "sqlite", "catalog"])) return false;
  if (typeof value.pythonVersion !== "string" || !isRecord(value.packages) || !isRecord(value.sqlite)) {
    return false;
  }
  return (
    hasStringFields(value.packages, PACKAGE_NAMES) &&
    hasExactKeys(value.sqlite, ["version", "transaction", "fts5"]) &&
    typeof value.sqlite.version === "string" &&
    typeof value.sqlite.transaction === "boolean" &&
    typeof value.sqlite.fts5 === "boolean" &&
    isRecord(value.catalog) &&
    hasExactKeys(value.catalog, ["schemaVersion", "catalogHash", "familyHash"]) &&
    value.catalog.schemaVersion === "stewie-catalog-v1" &&
    typeof value.catalog.catalogHash === "string" && /^[0-9a-f]{64}$/.test(value.catalog.catalogHash) &&
    typeof value.catalog.familyHash === "string" && /^[0-9a-f]{64}$/.test(value.catalog.familyHash)
  );
}

function isLearningState(value: unknown): value is PythonLearningState {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["completed", "drafts", "mistakes"]) &&
    Array.isArray(value.completed) &&
    value.completed.every((item) => typeof item === "string") &&
    isRecord(value.drafts) &&
    Object.values(value.drafts).every((item) => typeof item === "string") &&
    Array.isArray(value.mistakes) && value.mistakes.every(isMistake)
  );
}

function isMasteryResult(value: unknown): value is MasteryResult {
  if (!isRecord(value) || !hasExactKeys(value, ["mastery", "reviewQueue"]) || !isRecord(value.mastery) || !Array.isArray(value.reviewQueue)) return false;
  if (!value.reviewQueue.every((id) => typeof id === "string")) return false;
  return Object.values(value.mastery).every((item) => {
    if (!isRecord(item) || !hasExactKeys(item, ["familyId", "score", "attempts", "mistakeCodes", "lastAttemptAt"])) return false;
    return typeof item.familyId === "string" && typeof item.score === "number" && Number.isFinite(item.score) && typeof item.attempts === "number" && Number.isInteger(item.attempts) && item.attempts >= 1 && Array.isArray(item.mistakeCodes) && item.mistakeCodes.every((code) => typeof code === "string") && typeof item.lastAttemptAt === "string";
  });
}

function isTutorPlan(value: unknown): value is TutorPlan {
  return isRecord(value) && hasExactKeys(value, ["status", "steps"]) && (value.status === "review" || value.status === "start") && Array.isArray(value.steps) && value.steps.every((step) => isRecord(step) && hasExactKeys(step, ["lessonId", "title", "reason", "actions"]) && typeof step.lessonId === "string" && typeof step.title === "string" && typeof step.reason === "string" && Array.isArray(step.actions) && step.actions.length === 3 && step.actions.every((action) => typeof action === "string"));
}

function isTutorGraphState(value: unknown): value is TutorGraphState {
  if (!isRecord(value) || !hasExactKeys(value, ["course_id", "lesson_id", "user_question", "mastery_snapshot", "retrieved_chunks", "response", "citations", "next_action", "thread_id", "turn_ready"])) return false;
  if (["course_id", "lesson_id", "user_question", "next_action", "thread_id"].some((key) => typeof value[key] !== "string")) return false;
  if (!isRecord(value.mastery_snapshot) || !Array.isArray(value.retrieved_chunks) || !Array.isArray(value.citations) || !isRecord(value.response) || value.response.status !== "ok" && value.response.status !== "insufficient_context" || typeof value.response.answer !== "string" || !Array.isArray(value.response.citations) || value.turn_ready !== true) return false;
  const validCitation = (citation: unknown): citation is { source: string } => isRecord(citation) && hasExactKeys(citation, ["source"]) && typeof citation.source === "string";
  return value.retrieved_chunks.every((chunk) => isRecord(chunk) && hasExactKeys(chunk, ["id", "source", "text"]) && typeof chunk.id === "string" && typeof chunk.source === "string" && typeof chunk.text === "string") && value.citations.every(validCitation) && value.response.citations.every(validCitation);
}

function isPersonalizedExerciseResult(value: unknown): value is PersonalizedExerciseResult {
  if (!isRecord(value) || !hasExactKeys(value, ["exercise", "recommendation"]) || !isRecord(value.exercise) || !isRecord(value.recommendation)) return false;
  return hasExactKeys(value.exercise, ["familyId", "validatorVersion", "prompt", "starterCode", "hints", "parameters", "tests"]) && typeof value.exercise.familyId === "string" && typeof value.exercise.validatorVersion === "string" && typeof value.exercise.prompt === "string" && typeof value.exercise.starterCode === "string" && Array.isArray(value.exercise.hints) && value.exercise.hints.every((hint) => typeof hint === "string") && isRecord(value.exercise.parameters) && Array.isArray(value.exercise.tests) && value.exercise.tests.length >= 2 && value.exercise.tests.every((item) => isRecord(item) && hasExactKeys(item, ["name", "expression", "failure", "kind"]) && typeof item.name === "string" && typeof item.expression === "string" && typeof item.failure === "string" && (item.kind === "behavior" || item.kind === "structure")) && hasExactKeys(value.recommendation, ["lessonId", "familyId", "mistakeCodes", "difficulty"]) && typeof value.recommendation.lessonId === "string" && typeof value.recommendation.familyId === "string" && Array.isArray(value.recommendation.mistakeCodes) && value.recommendation.mistakeCodes.every((code) => typeof code === "string") && typeof value.recommendation.difficulty === "string";
}

function isParsedRagDocuments(value: unknown): value is ParsedRagDocument[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && hasExactKeys(item, ["id", "text", "source"]) && typeof item.id === "string" && typeof item.text === "string" && item.text.trim().length > 0 && typeof item.source === "string" && item.source.trim().length > 0);
}

function isRagEvaluationRecord(value: unknown): value is RagEvaluationRecord {
  if (!isRecord(value) || !hasExactKeys(value, ["id", "catalogHash", "documentHash", "embeddingModel", "recordedAt", "caseCount", "recallAtK", "mrr", "citationCoverage", "faithfulnessProxy", "latencyMs"])) return false;
  return typeof value.id === "number" && Number.isInteger(value.id) && value.id > 0 && typeof value.catalogHash === "string" && /^[0-9a-f]{64}$/.test(value.catalogHash) && typeof value.documentHash === "string" && /^[0-9a-f]{64}$/.test(value.documentHash) && typeof value.embeddingModel === "string" && typeof value.recordedAt === "string" && typeof value.caseCount === "number" && Number.isInteger(value.caseCount) && value.caseCount > 0 && ["recallAtK", "mrr", "citationCoverage", "faithfulnessProxy"].every((key) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 && value[key] <= 1) && typeof value.latencyMs === "number" && Number.isFinite(value.latencyMs) && value.latencyMs >= 0;
}

function isRagEvaluationRecords(value: unknown): value is RagEvaluationRecord[] {
  return Array.isArray(value) && value.every(isRagEvaluationRecord);
}

function isPromptException(value: unknown): value is PromptException {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["type", "message", "traceback", "line"]) &&
    typeof value.type === "string" &&
    typeof value.message === "string" &&
    typeof value.traceback === "string" &&
    (value.line === null || typeof value.line === "number")
  );
}

function isTestResult(value: unknown): value is PromptTestResult {
  if (!isRecord(value)) return false;
  const allowed = ["name", "passed", "detail", "expected", "actual", "rule", "kind"];
  return (
    ["name", "passed", "detail"].every((key) => key in value) &&
    Object.keys(value).every((key) => allowed.includes(key)) &&
    typeof value.name === "string" &&
    typeof value.passed === "boolean" &&
    typeof value.detail === "string" &&
    (value.expected === undefined || typeof value.expected === "string") &&
    (value.actual === undefined || typeof value.actual === "string") &&
    (value.rule === undefined || typeof value.rule === "string") &&
    (value.kind === undefined || value.kind === "behavior" || value.kind === "structure")
  );
}

function isMistake(value: unknown): value is ValidatedMistake {
  return (
    isRecord(value) &&
    hasExactKeys(value, ["id", "lessonId", "createdAt", "code", "output", "stderr", "exception", "tests"]) &&
    ["id", "lessonId", "createdAt", "code", "output", "stderr"].every(
      (key) => typeof value[key] === "string",
    ) &&
    (value.exception === null || isPromptException(value.exception)) &&
    Array.isArray(value.tests) &&
    value.tests.every(isTestResult)
  );
}

function isChatMessages(value: unknown): value is PythonChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (message) =>
        isRecord(message) &&
        hasExactKeys(message, ["role", "content", "createdAt"]) &&
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        typeof message.createdAt === "string",
    )
  );
}

function isImportResult(value: unknown): value is { imported: boolean; state: PythonLearningState } {
  return isRecord(value) && hasExactKeys(value, ["imported", "state"]) &&
    typeof value.imported === "boolean" && isLearningState(value.state);
}

function isClearedResult(value: unknown): value is { cleared: true } {
  return isRecord(value) && hasExactKeys(value, ["cleared"]) && value.cleared === true;
}

function isImportedResult(value: unknown): value is { imported: boolean } {
  return isRecord(value) && hasExactKeys(value, ["imported"]) && typeof value.imported === "boolean";
}

function isRecordedResult(value: unknown): value is { recorded: true } {
  return isRecord(value) && hasExactKeys(value, ["recorded"]) && value.recorded === true;
}

function isLearningExport(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value) || !hasExactKeys(value, ["schema", "exportedAt", "learning", "chats"]) || value.schema !== "stewie-learning-export-v1" || typeof value.exportedAt !== "string" || !isLearningState(value.learning) || !Array.isArray(value.chats)) return false;
  return value.chats.every((item) => {
    if (!isRecord(item) || !hasExactKeys(item, ["courseId", "lessonId", "messages"]) || typeof item.courseId !== "string" || typeof item.lessonId !== "string" || !Array.isArray(item.messages)) return false;
    return item.messages.every((message) => isRecord(message) && hasExactKeys(message, ["role", "content", "createdAt"]) && (message.role === "user" || message.role === "assistant") && typeof message.content === "string" && message.content.length > 0 && typeof message.createdAt === "string");
  });
}

function isImportExportResult(value: unknown): value is { imported: true; counts: Record<string, number> } {
  if (!isRecord(value) || value.imported !== true || !isRecord(value.counts)) return false;
  const counts = value.counts;
  return ["completed", "drafts", "mistakes", "threads", "messages"].every((key) => Number.isInteger(counts[key]) && (counts[key] as number) >= 0);
}

export function resolvePythonServicePaths(resourcesPath: string, platform: string) {
  const runtimeRoot = join(resourcesPath, "python");
  return {
    executable: join(runtimeRoot, pythonExecutableRelativePath(platform)),
    service: join(runtimeRoot, "service", "service.py"),
    catalog: join(runtimeRoot, "service", "learning-service.json"),
  };
}

function parsePythonServiceEnvelope(line: string): PythonServiceFrame {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    throw new Error("Python 服务响应不是有效 JSON");
  }

  if (!isRecord(value) || typeof value.id !== "string" || value.id.length === 0) {
    throw new Error("Python 服务响应缺少有效请求 ID");
  }
  if (value.ok === true && hasExactKeys(value, ["id", "ok", "result"])) {
    return value as PythonServiceFrame;
  }
  if (
    value.ok === false &&
    hasExactKeys(value, ["id", "ok", "error"]) &&
    isRecord(value.error) &&
    hasStringFields(value.error, ["type", "message"])
  ) {
    return value as PythonServiceFrame;
  }
  throw new Error("Python 服务响应结构无效");
}

export function parsePythonServiceFrame(line: string): PythonServiceFrame {
  const frame = parsePythonServiceEnvelope(line);
  if (frame.ok && !isHealth(frame.result)) {
    throw new Error("Python 服务响应结构无效");
  }
  return frame;
}

type SpawnProcess = (
  executable: string,
  args: readonly string[],
  options: { stdio: ["pipe", "pipe", "pipe"]; windowsHide: true },
) => ChildProcessWithoutNullStreams;

type PendingRequest = {
  timer: ReturnType<typeof setTimeout>;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
};

export class PythonServiceClient {
  health!: PythonHealth;
  readonly #child: ChildProcessWithoutNullStreams;
  readonly #pending = new Map<string, PendingRequest>();
  #stderr = "";
  #stopped = false;
  #ready = false;
  #failureReported = false;
  readonly #onFailure: (error: Error) => void;

  private constructor(child: ChildProcessWithoutNullStreams, onFailure: (error: Error) => void) {
    this.#child = child;
    this.#onFailure = onFailure;
    createInterface({ input: child.stdout }).on("line", (line) => this.#receive(line));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk: string) => {
      this.#stderr += chunk;
    });
    child.once("error", (error) => this.#fail(error));
    child.once("exit", (code, signal) => {
      if (this.#stopped) return;
      const detail = this.#stderr.trim();
      this.#fail(new Error(`Python 服务退出（code=${code}, signal=${signal}）${detail ? `：${detail}` : ""}`));
    });
  }

  static async start(
    child: ChildProcessWithoutNullStreams,
    timeoutMs: number,
    onFailure: (error: Error) => void,
  ): Promise<PythonServiceClient> {
    const client = new PythonServiceClient(child, onFailure);
    client.health = await client.#requestHealth(timeoutMs);
    if (!client.health.sqlite.transaction || !client.health.sqlite.fts5) {
      throw new Error("Python 服务健康检查失败：SQLite 事务或 FTS5 不可用");
    }
    client.#ready = true;
    return client;
  }

  stop(): void {
    if (this.#stopped) return;
    this.#stopped = true;
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(new Error("Python 服务已停止"));
    }
    this.#pending.clear();
    if (!this.#child.killed) this.#child.kill();
  }

  request(method: string, params: Record<string, unknown>, timeoutMs = 10_000): Promise<unknown> {
    const id = randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Python 服务请求 ${method} 超时（${timeoutMs}ms）`));
      }, timeoutMs);
      this.#pending.set(id, { timer, resolve, reject });
      this.#child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
    });
  }

  getLearningState(): Promise<PythonLearningState> {
    return this.#requestChecked(
      "learning.get",
      {},
      isLearningState,
      "学习状态响应结构无效",
    );
  }

  saveLearningState(state: PythonLearningState): Promise<PythonLearningState> {
    return this.#requestChecked(
      "learning.save",
      { state },
      isLearningState,
      "学习状态响应结构无效",
    );
  }

  recordMasteryAttempt(event: MasteryEvent): Promise<{ recorded: true }> {
    return this.#requestChecked("mastery.record", { event }, (value): value is { recorded: true } => isRecord(value) && hasExactKeys(value, ["recorded"]) && value.recorded === true, "掌握度记录响应结构无效");
  }

  getMastery(now: string): Promise<MasteryResult> {
    return this.#requestChecked("mastery.get", { now }, isMasteryResult, "掌握度响应结构无效");
  }

  getTutorPlan(now: string): Promise<TutorPlan> {
    return this.#requestChecked("tutor.plan", { now }, isTutorPlan, "导师计划响应结构无效");
  }

  validateTutorTurn(state: TutorGraphState): Promise<TutorGraphState> {
    return this.#requestChecked("tutor.validate", { state }, isTutorGraphState, "导师 Graph 响应结构无效");
  }

  getPersonalizedExercise(lessonId: string, seed: number): Promise<PersonalizedExerciseResult> {
    return this.#requestChecked("personalization.next", { lessonId, seed }, isPersonalizedExerciseResult, "个性题响应结构无效");
  }

  parseDocuments(paths: string[]): Promise<ParsedRagDocument[]> {
    return this.#requestChecked("documents.parse", { paths }, isParsedRagDocuments, "本地资料解析响应结构无效");
  }

  recordRagEvaluation(record: Omit<RagEvaluationRecord, "id">): Promise<{ recorded: true }> {
    return this.#requestChecked("rag.evaluation.record", { record }, isRecordedResult, "RAG 评测保存响应结构无效");
  }

  listRagEvaluations(): Promise<RagEvaluationRecord[]> {
    return this.#requestChecked("rag.evaluation.list", {}, isRagEvaluationRecords, "RAG 评测历史响应结构无效");
  }

  importLegacyLearningState(
    state: PythonLearningState,
    sourceHash: string,
  ): Promise<{ imported: boolean; state: PythonLearningState }> {
    return this.#requestChecked(
      "learning.importLegacy",
      { state, sourceHash },
      isImportResult,
      "学习状态迁移响应结构无效",
    );
  }

  listChatMessages(courseId: string, lessonId: string): Promise<PythonChatMessage[]> {
    return this.#requestChecked(
      "chat.list",
      { courseId, lessonId },
      isChatMessages,
      "聊天历史响应结构无效",
    );
  }

  appendChatMessages(
    courseId: string,
    lessonId: string,
    messages: readonly PythonChatMessage[],
  ): Promise<PythonChatMessage[]> {
    return this.#requestChecked(
      "chat.append",
      { courseId, lessonId, messages },
      isChatMessages,
      "聊天历史响应结构无效",
    );
  }

  clearChatMessages(courseId: string, lessonId: string): Promise<{ cleared: true }> {
    return this.#requestChecked(
      "chat.clear",
      { courseId, lessonId },
      isClearedResult,
      "清除聊天响应结构无效",
    );
  }

  importLegacy(sourceKind: "model-profiles" | "chat-history", sourceHash: string, profiles: unknown[] | null, conversations: LegacyConversation[] | null): Promise<{ imported: boolean }> {
    return this.#requestChecked(
      "legacy.import",
      { sourceKind, sourceHash, profiles, conversations },
      isImportedResult,
      "旧桌面数据迁移响应结构无效",
    );
  }

  recordLegacyFailure(sourceKind: "model-profiles" | "chat-history", sourceHash: string, errorMessage: string): Promise<{ recorded: true }> {
    return this.#requestChecked(
      "legacy.recordFailure",
      { sourceKind, sourceHash, errorMessage },
      isRecordedResult,
      "旧桌面数据失败记录响应结构无效",
    );
  }

  exportLearning(): Promise<Record<string, unknown>> {
    return this.#requestChecked("learning.export", {}, isLearningExport, "学习导出响应结构无效");
  }

  importLearningExport(document: Record<string, unknown>): Promise<{ imported: true; counts: Record<string, number> }> {
    return this.#requestChecked("learning.importExport", { document }, isImportExportResult, "学习导入响应结构无效");
  }

  async #requestChecked<T>(
    method: string,
    params: Record<string, unknown>,
    isValid: (value: unknown) => value is T,
    errorMessage: string,
  ): Promise<T> {
    const result = await this.request(method, params);
    if (!isValid(result)) {
      const error = new Error(errorMessage);
      this.#fail(error);
      throw error;
    }
    return result;
  }

  async #requestHealth(timeoutMs: number): Promise<PythonHealth> {
    const result = await this.request("health", {}, timeoutMs);
    if (!isHealth(result)) throw new Error("Python 服务健康响应结构无效");
    return result;
  }

  #receive(line: string): void {
    let frame: PythonServiceFrame;
    try {
      frame = parsePythonServiceEnvelope(line);
    } catch (error) {
      this.#fail(error instanceof Error ? error : new Error("Python 服务响应解析失败"));
      return;
    }
    const pending = this.#pending.get(frame.id);
    if (!pending) {
      this.#fail(new Error(`Python 服务响应使用了未知请求 ID：${frame.id}`));
      return;
    }
    clearTimeout(pending.timer);
    this.#pending.delete(frame.id);
    if (frame.ok) pending.resolve(frame.result);
    else pending.reject(new Error(`${frame.error.type}: ${frame.error.message}`));
  }

  #fail(error: Error): void {
    for (const pending of this.#pending.values()) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.#pending.clear();
    if (this.#ready && !this.#stopped && !this.#failureReported) {
      this.#failureReported = true;
      this.#onFailure(error);
    }
  }
}

export type StartPythonServiceOptions = {
  resourcesPath: string;
  platform: string;
  databasePath: string;
  timeoutMs?: number;
  spawnProcess?: SpawnProcess;
  onFailure: (error: Error) => void;
};

export async function startPythonService({
  resourcesPath,
  platform,
  databasePath,
  timeoutMs = 10_000,
  spawnProcess = spawn,
  onFailure,
}: StartPythonServiceOptions): Promise<PythonServiceClient> {
  const paths = resolvePythonServicePaths(resourcesPath, platform);
  const child = spawnProcess(paths.executable, [paths.service, "--catalog", paths.catalog, "--database", databasePath], {
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  try {
    return await PythonServiceClient.start(child, timeoutMs, onFailure);
  } catch (error) {
    if (!child.killed) child.kill();
    throw error;
  }
}
