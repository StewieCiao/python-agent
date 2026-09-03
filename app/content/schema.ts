export const CATALOG_SCHEMA_VERSION = "stewie-catalog-v1" as const;

export type CourseId = "python" | "langchain-rag" | "langgraph";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type SourceKind = "official-doc" | "official-repo" | "reference-course";

export type RuntimeVersions = {
  python: "3.13.15";
  pyodide: "314.0.3";
  langchain: "1.2.12";
  langgraph: "1.1.2";
  langgraphCheckpointSqlite: "2.0.6";
};

export type CourseSource = {
  kind: SourceKind;
  label: string;
  url: string;
  verifiedAt: string;
};

export type CourseVideo = {
  title: string;
  url: string;
  provider: "黑马程序员" | "LangChain Academy" | "DeepLearning.AI";
  language: "中文" | "英文";
  duration: string;
  note: string;
};

export type MigrationCard = {
  title: string;
  status: "legacy" | "renamed" | "replaced";
  explanation: string;
  beforeCode: string;
  afterCode: string;
  officialSources: CourseSource[];
  verifiedAt: string;
  verifiedVersions: Pick<RuntimeVersions, "langchain" | "langgraph">;
};

export type GuideSection = {
  kind: "概念入门" | "逐步拆解" | "常见误区";
  title: string;
  body: string;
  bullets: string[];
  example: string;
};

export type PublicExercise = {
  prompt: string;
  starterCode: string;
  hints: string[];
  solution: string;
};

export type BrowserCheck = {
  name: string;
  expression: string;
  failure: string;
  kind: "behavior" | "structure";
  feedback?: {
    expected: string;
    actualLine?: number;
    actualExpression?: string;
    rule: string;
  };
};

export type CourseLesson = {
  id: string;
  familyId?: string;
  stageId: string;
  order: number;
  title: string;
  kicker: string;
  summary: string;
  minutes: number;
  prerequisites: string[];
  difficulty: Difficulty;
  tags: string[];
  guide: GuideSection[];
  videos: CourseVideo[];
  officialSources: CourseSource[];
  migrations: MigrationCard[];
  project: boolean;
  projectLinks: string[];
  exercise: PublicExercise;
  browserChecks: BrowserCheck[];
};

export type CourseStage = {
  id: string;
  order: number;
  title: string;
  description: string;
  lessonIds: string[];
};

export type CourseTrack = {
  id: CourseId;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  currentLessonId: string;
  stages: CourseStage[];
  lessons: CourseLesson[];
};

export type AuthoredCatalog = {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  verifiedAt: string;
  runtimeVersions: RuntimeVersions;
  tracks: CourseTrack[];
};

const COURSE_IDS: readonly CourseId[] = ["python", "langchain-rag", "langgraph"];
const VIDEO_HOSTS: Record<CourseVideo["provider"], string> = {
  "黑马程序员": "www.bilibili.com",
  "LangChain Academy": "academy.langchain.com",
  "DeepLearning.AI": "www.deeplearning.ai",
};
const RUNTIME_VERSIONS: RuntimeVersions = {
  python: "3.13.15",
  pyodide: "314.0.3",
  langchain: "1.2.12",
  langgraph: "1.1.2",
  langgraphCheckpointSqlite: "2.0.6",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${path} 必须是非空字符串`);
  }
}

function requireStringArray(value: unknown, path: string): asserts value is string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.trim() === "")) {
    throw new Error(`${path} 必须是非空字符串数组`);
  }
}

function requireUnique(values: readonly string[], path: string): void {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) throw new Error(`重复 ${path}：${value}`);
    seen.add(value);
  }
}

function validateSource(value: unknown, path: string): asserts value is CourseSource {
  if (!isRecord(value)) throw new Error(`${path} 必须是对象`);
  requireString(value.kind, `${path}.kind`);
  if (!["official-doc", "official-repo", "reference-course"].includes(value.kind)) {
    throw new Error(`${path}.kind 无效`);
  }
  requireString(value.label, `${path}.label`);
  requireString(value.url, `${path}.url`);
  requireString(value.verifiedAt, `${path}.verifiedAt`);
  let url: URL;
  try {
    url = new URL(value.url);
  } catch {
    throw new Error(`${path}.url 必须是 HTTPS URL`);
  }
  if (url.protocol !== "https:") throw new Error(`${path}.url 必须是 HTTPS URL`);
}

function validateLesson(value: unknown, path: string, stageIds: Set<string>, lessonIds: Set<string>): CourseLesson {
  if (!isRecord(value)) throw new Error(`${path} 必须是对象`);
  for (const field of ["id", "stageId", "title", "kicker", "summary"]) requireString(value[field], `${path}.${field}`);
  const id = value.id as string;
  const stageId = value.stageId as string;
  if (lessonIds.has(id)) throw new Error(`重复 lesson id：${id}`);
  lessonIds.add(id);
  if (!stageIds.has(stageId)) throw new Error(`${path}.stageId 引用了未知阶段：${stageId}`);
  if (!Number.isInteger(value.order) || (value.order as number) < 1) throw new Error(`${path}.order 必须是正整数`);
  if (!Number.isInteger(value.minutes) || (value.minutes as number) < 1) throw new Error(`${path}.minutes 必须是正整数`);
  if (!["beginner", "intermediate", "advanced"].includes(value.difficulty as string)) throw new Error(`${path}.difficulty 无效`);
  requireStringArray(value.prerequisites, `${path}.prerequisites`);
  requireStringArray(value.tags, `${path}.tags`);
  if (!Array.isArray(value.guide) || value.guide.length !== 3) throw new Error(`${path}.guide 必须正好包含三张讲解卡`);
  if (new Set(value.guide.map((item) => isRecord(item) ? item.kind : "")).size !== 3) throw new Error(`${path}.guide 的 kind 必须各不相同`);
  if (!Array.isArray(value.videos) || !Array.isArray(value.officialSources) || !Array.isArray(value.migrations)) {
    throw new Error(`${path} 缺少来源或资源数组`);
  }
  if (value.officialSources.length === 0) throw new Error(`${path} 必须至少包含一个官方来源`);
  if (typeof value.project !== "boolean") throw new Error(`${path}.project 必须是布尔值`);
  requireStringArray(value.projectLinks, `${path}.projectLinks`);
  if (!isRecord(value.exercise)) throw new Error(`${path}.exercise 必须是对象`);
  requireString(value.exercise.prompt, `${path}.exercise.prompt`);
  requireString(value.exercise.starterCode, `${path}.exercise.starterCode`);
  requireStringArray(value.exercise.hints, `${path}.exercise.hints`);
  if (value.exercise.hints.length !== 3 || new Set(value.exercise.hints).size !== 3) throw new Error(`${path}.exercise.hints 必须是三层不重复提示`);
  requireString(value.exercise.solution, `${path}.exercise.solution`);
  if (!Array.isArray(value.browserChecks)) throw new Error(`${path}.browserChecks 必须是数组`);
  for (const [index, source] of value.officialSources.entries()) validateSource(source, `${path}.officialSources[${index}]`);
  for (const [index, source] of value.migrations.entries()) {
    if (!isRecord(source) || !Array.isArray(source.officialSources) || source.officialSources.length === 0) {
      throw new Error(`${path}.migrations[${index}] 缺少官方来源`);
    }
    for (const [sourceIndex, item] of source.officialSources.entries()) validateSource(item, `${path}.migrations[${index}].officialSources[${sourceIndex}]`);
  }
  for (const [index, video] of value.videos.entries()) {
    if (!isRecord(video)) throw new Error(`${path}.videos[${index}] 必须是对象`);
    requireString(video.provider, `${path}.videos[${index}].provider`);
    requireString(video.url, `${path}.videos[${index}].url`);
    const host = VIDEO_HOSTS[video.provider as CourseVideo["provider"]];
    let url: URL;
    try {
      url = new URL(video.url);
    } catch {
      throw new Error(`${path}.videos[${index}].url 无效`);
    }
    if (!host || url.protocol !== "https:" || url.hostname !== host) throw new Error(`不允许的视频域名：${url.hostname}`);
  }
  for (const [index, check] of value.browserChecks.entries()) {
    if (!isRecord(check)) throw new Error(`${path}.browserChecks[${index}] 必须是对象`);
    for (const field of ["name", "expression", "failure", "kind"]) requireString(check[field], `${path}.browserChecks[${index}].${field}`);
    if (!["behavior", "structure"].includes(check.kind as string)) throw new Error(`${path}.browserChecks[${index}].kind 无效`);
  }
  return value as CourseLesson;
}

export function validateAuthoredCatalog(value: unknown): AuthoredCatalog {
  if (!isRecord(value)) throw new Error("课程目录必须是对象");
  if (value.schemaVersion !== CATALOG_SCHEMA_VERSION) throw new Error("课程目录 schema version 无效");
  requireString(value.verifiedAt, "verifiedAt");
  if (JSON.stringify(value.runtimeVersions) !== JSON.stringify(RUNTIME_VERSIONS)) throw new Error("runtimeVersions 与锁定运行时不一致");
  if (!Array.isArray(value.tracks) || value.tracks.length !== COURSE_IDS.length) throw new Error("课程必须包含三条路线");
  const trackIds = value.tracks.map((track) => isRecord(track) && typeof track.id === "string" ? track.id : "");
  requireUnique(trackIds, "track id");
  if (JSON.stringify(trackIds) !== JSON.stringify(COURSE_IDS)) throw new Error("课程路线顺序或 id 无效");
  const allLessonIds = new Set<string>();
  for (const [trackIndex, track] of value.tracks.entries()) {
    const path = `tracks[${trackIndex}]`;
    if (!isRecord(track) || track.id !== COURSE_IDS[trackIndex]) throw new Error(`${path} 无效`);
    for (const field of ["title", "shortTitle", "description", "accent", "currentLessonId"]) requireString(track[field], `${path}.${field}`);
    if (!Array.isArray(track.stages) || track.stages.length === 0 || !Array.isArray(track.lessons) || track.lessons.length === 0) throw new Error(`${path} 缺少 stages 或 lessons`);
    const stageIds = new Set<string>();
    for (const [stageIndex, stage] of track.stages.entries()) {
      const stagePath = `${path}.stages[${stageIndex}]`;
      if (!isRecord(stage)) throw new Error(`${stagePath} 必须是对象`);
      for (const field of ["id", "title", "description"]) requireString(stage[field], `${stagePath}.${field}`);
      if (!Number.isInteger(stage.order) || stage.order !== stageIndex + 1) throw new Error(`${stagePath}.order 必须连续`);
      const stageId = stage.id as string;
      if (stageIds.has(stageId)) throw new Error(`重复 stage id：${stageId}`);
      stageIds.add(stageId);
      requireStringArray(stage.lessonIds, `${stagePath}.lessonIds`);
    }
    const priorGlobalLessonIds = new Set(allLessonIds);
    const trackLessonIds = new Set<string>();
    const lessons = track.lessons.map((lesson, lessonIndex) => validateLesson(lesson, `${path}.lessons[${lessonIndex}]`, stageIds, allLessonIds));
    for (const [lessonIndex, lesson] of lessons.entries()) {
      if (lesson.order !== lessonIndex + 1) throw new Error(`${path}.lessons[${lessonIndex}].课程 order 必须连续`);
    }
    const seenLessonIds = new Set<string>();
    for (const lesson of lessons) {
      for (const prerequisite of lesson.prerequisites) {
        if (!priorGlobalLessonIds.has(prerequisite) && !seenLessonIds.has(prerequisite)) {
          throw new Error(`${path}.lessons[${lesson.order - 1}].先修课程必须存在且早于当前课程：${prerequisite}`);
        }
      }
      seenLessonIds.add(lesson.id);
      trackLessonIds.add(lesson.id);
      if (lesson.projectLinks.some((id) => !lessons.some((item) => item.id === id && item.project))) throw new Error(`${path}.lessons[${lesson.order - 1}].projectLinks 引用了无效项目`);
    }
    for (const stage of track.stages) {
      const stageId = stage.id as string;
      const stageLessonIds = stage.lessonIds as string[];
      if (stageLessonIds.some((id) => !trackLessonIds.has(id))) throw new Error(`${path}.stages.${stageId}.lessonIds 引用了未知课程`);
      const expectedLessonIds = lessons.filter((item) => item.stageId === stageId).map((lesson) => lesson.id);
      if (JSON.stringify(stageLessonIds) !== JSON.stringify(expectedLessonIds)) throw new Error(`${path}.stages.${stageId} 未收录课程或顺序不一致`);
    }
    if (!trackLessonIds.has(track.currentLessonId as string)) throw new Error(`${path}.currentLessonId 引用了未知课程`);
  }
  return value as AuthoredCatalog;
}

export { RUNTIME_VERSIONS };
