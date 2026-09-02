import { learningTracks } from "../../lib/learningCatalog.ts";
import type { CourseTrack } from "../schema.ts";
import { adaptLegacyTrack } from "../legacyTrackAdapter.ts";

const legacyTrack = learningTracks.find(({ id }) => id === "langgraph");
if (!legacyTrack) throw new Error("缺少 LangGraph 课程路线");
const adapted = adaptLegacyTrack(legacyTrack);

export const langgraphTrack: CourseTrack = {
  id: "langgraph",
  title: legacyTrack.title,
  shortTitle: legacyTrack.shortTitle,
  description: legacyTrack.description,
  accent: legacyTrack.accent,
  currentLessonId: legacyTrack.currentLessonId,
  stages: adapted.stages,
  lessons: adapted.lessons,
};

