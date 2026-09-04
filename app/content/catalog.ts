import type { AuthoredCatalog, CourseTrack } from "./schema.ts";
import { CATALOG_SCHEMA_VERSION, RUNTIME_VERSIONS, validateAuthoredCatalog } from "./schema.ts";
import { pythonLessons, pythonStages } from "./python/index.ts";
import { langchainRagTrack } from "./langchain-rag/index.ts";
import { langgraphTrack } from "./langgraph/index.ts";
import { expandCourseTrack } from "./lessonExpansion.ts";

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
  tracks: [
    expandCourseTrack(pythonTrack, { targetLessons: 64, stageCount: 8, projectCount: 6, stageTitles: ["起步", "数据与控制", "函数与模块", "工程基础", "Agent 基础", "Agent 系统", "综合项目", "毕业项目"] }),
    expandCourseTrack(langchainRagTrack, { targetLessons: 48, stageCount: 7, projectCount: 4, stageTitles: ["模型与提示", "Runnable", "文档处理", "向量检索", "RAG 生成", "评估与观测", "RAG 项目"], familyIds: { "langchain-rag-lesson-20": "langchain-tool-assistant-v1", "langchain-rag-lesson-27": "langchain-rag-observability-v1" } }),
    expandCourseTrack(langgraphTrack, { targetLessons: 42, stageCount: 7, projectCount: 4, stageTitles: ["图基础", "状态与路由", "持久化", "记忆", "中断与恢复", "多 Agent", "Graph 项目"], familyIds: { "langgraph-lesson-11": "langgraph-review-project-v1", "langgraph-lesson-17": "langgraph-dispatch-project-v1", "langgraph-lesson-23": "langgraph-memory-project-v1" } }),
  ],
};

export const authoredCatalog = validateAuthoredCatalog(catalog);
