import type { AuthoredCatalog, CourseTrack } from "./schema.ts";
import { CATALOG_SCHEMA_VERSION, RUNTIME_VERSIONS, validateAuthoredCatalog } from "./schema.ts";
import { pythonLessons, pythonStages } from "./python/index.ts";
import { langchainRagTrack } from "./langchain-rag/index.ts";
import { langgraphTrack } from "./langgraph/index.ts";

const pythonTrack: CourseTrack = {
  id: "python",
  title: "Python 基础与工程",
  shortTitle: "Python",
  description: "从第一行代码到可测试的 Agent 基础组件。",
  accent: "#d58a42",
  currentLessonId: pythonLessons[0].id,
  stages: pythonStages,
  lessons: pythonLessons,
};

const catalog: AuthoredCatalog = {
  schemaVersion: CATALOG_SCHEMA_VERSION,
  verifiedAt: "2026-09-02",
  runtimeVersions: RUNTIME_VERSIONS,
  tracks: [pythonTrack, langchainRagTrack, langgraphTrack],
};

export const authoredCatalog = validateAuthoredCatalog(catalog);

