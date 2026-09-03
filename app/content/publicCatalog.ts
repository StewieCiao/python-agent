import snapshot from "../../generated/course-public.json";
import type { Lesson, LessonTest } from "./python/curriculum.ts";
import type { CourseTrack } from "./schema.ts";

const publicSnapshot = snapshot as {
  schemaVersion: string;
  catalogHash: string;
  familyHash: string;
  catalog: { tracks: CourseTrack[] };
};

if (publicSnapshot.schemaVersion !== "stewie-catalog-v1") throw new Error("公开课程快照 schema version 无效");
if (!/^[0-9a-f]{64}$/.test(publicSnapshot.catalogHash) || !/^[0-9a-f]{64}$/.test(publicSnapshot.familyHash)) {
  throw new Error("公开课程快照哈希格式无效");
}

export const publicCatalog = publicSnapshot;
export const learningTracks = publicSnapshot.catalog.tracks as CourseTrack[];

const pythonTrack = publicSnapshot.catalog.tracks.find(({ id }) => id === "python");
if (!pythonTrack) throw new Error("公开课程快照缺少 Python 路线");

type PublicLesson = Omit<Lesson, "concepts"> & {
  concepts: Array<{ kind: string; title: string; body: string; bullets: string[]; example: string }>;
};

export const lessons: PublicLesson[] = pythonTrack.lessons.map((lesson) => ({
  id: lesson.id,
  familyId: lesson.familyId,
  module: pythonTrack.stages.find(({ id }) => id === lesson.stageId)?.title as Lesson["module"],
  number: lesson.order,
  title: lesson.title,
  kicker: lesson.kicker,
  minutes: lesson.minutes,
  goal: lesson.summary,
  concepts: lesson.guide.map(({ kind, title, body, bullets, example }) => ({ kind, title, body, bullets, example })),
  requirements: lesson.exercise.prompt.split("\n"),
  starterCode: lesson.exercise.starterCode,
  hints: lesson.exercise.hints,
  tests: lesson.browserChecks as LessonTest[],
  project: lesson.project,
  source: lesson.officialSources[0] ? { label: lesson.officialSources[0].label, url: lesson.officialSources[0].url } : undefined,
}));

export const lessonsByModule = pythonTrack.stages.map((stage) => ({
  module: stage.title as Lesson["module"],
  lessons: lessons.filter((lesson) => lesson.module === stage.title),
}));
