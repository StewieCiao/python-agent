import { learningTracks } from "../learningCatalog.ts";
import type { CourseTrack } from "../schema.ts";
import { authorTrackFromLessons } from "../formalizeTrack.ts";

const legacyTrack = learningTracks.find(({ id }) => id === "langgraph");
if (!legacyTrack) throw new Error("缺少 LangGraph 课程路线");
const authored = authorTrackFromLessons(legacyTrack, [
  { id: "langgraph-stage-1", title: "图基础", description: "认识状态图、节点和边。" },
  { id: "langgraph-stage-2", title: "状态与路由", description: "合并状态并决定下一步。" },
  { id: "langgraph-stage-3", title: "持久化", description: "保存线程状态并支持恢复。" },
  { id: "langgraph-stage-4", title: "记忆", description: "区分线程状态与跨线程 Store。" },
  { id: "langgraph-stage-5", title: "中断与恢复", description: "把人工确认纳入执行路径。" },
  { id: "langgraph-stage-6", title: "多 Agent", description: "组合子图、并行和 supervisor。" },
  { id: "langgraph-stage-7", title: "Graph 项目", description: "完成可恢复、可观测的图系统。" },
]);

export const langgraphTrack: CourseTrack = {
  id: "langgraph",
  title: legacyTrack.title,
  shortTitle: legacyTrack.shortTitle,
  description: legacyTrack.description,
  accent: legacyTrack.accent,
  currentLessonId: legacyTrack.currentLessonId,
  stages: authored.stages,
  lessons: authored.lessons,
};
