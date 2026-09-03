import type { CourseTrack } from "../schema.ts";
import { authorTrackFromLessons } from "../formalizeTrack.ts";
import { learningTracks } from "../learningCatalog.ts";

const legacyTrack = learningTracks.find(({ id }) => id === "langchain-rag");
if (!legacyTrack) throw new Error("缺少 LangChain/RAG 课程路线");
const authored = authorTrackFromLessons(legacyTrack, [
  { id: "langchain-rag-stage-1", title: "模型与提示", description: "建立模型输入输出与结构化交互。" },
  { id: "langchain-rag-stage-2", title: "Runnable", description: "把调用组合为可观察的数据流。" },
  { id: "langchain-rag-stage-3", title: "文档处理", description: "加载、切分并保留文档来源。" },
  { id: "langchain-rag-stage-4", title: "向量检索", description: "用相似度找到相关上下文。" },
  { id: "langchain-rag-stage-5", title: "RAG 生成", description: "把检索结果交给生成与引用。" },
  { id: "langchain-rag-stage-6", title: "评估与观测", description: "用固定样本观察质量和失败边界。" },
  { id: "langchain-rag-stage-7", title: "RAG 项目", description: "组合能力完成可演示的知识助手。" },
]);

export const langchainRagTrack: CourseTrack = {
  id: "langchain-rag",
  title: legacyTrack.title,
  shortTitle: legacyTrack.shortTitle,
  description: legacyTrack.description,
  accent: legacyTrack.accent,
  currentLessonId: legacyTrack.currentLessonId,
  stages: authored.stages,
  lessons: authored.lessons,
};
