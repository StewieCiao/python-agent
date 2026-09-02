import { learningTracks } from "../learningCatalog.ts";
import type { CourseTrack } from "../schema.ts";
import { adaptLegacyTrack } from "../courseTrackAdapter.ts";

const legacyTrack = learningTracks.find(({ id }) => id === "langchain-rag");
if (!legacyTrack) throw new Error("缺少 LangChain/RAG 课程路线");
const adapted = adaptLegacyTrack(legacyTrack);

export const langchainRagTrack: CourseTrack = {
  id: "langchain-rag",
  title: legacyTrack.title,
  shortTitle: legacyTrack.shortTitle,
  description: legacyTrack.description,
  accent: legacyTrack.accent,
  currentLessonId: legacyTrack.currentLessonId,
  stages: adapted.stages,
  lessons: adapted.lessons,
};
