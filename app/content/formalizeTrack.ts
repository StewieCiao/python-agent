import type { LearningLesson, LearningTrack } from "./learningCatalog.ts";
import type { CourseLesson, CourseSource, CourseStage } from "./schema.ts";

type StageSpec = { id: string; title: string; description: string };

function source(value: { label: string; url: string }): CourseSource {
  return {
    ...value,
    kind: value.url.includes("github.com") ? "official-repo" : "official-doc",
    verifiedAt: "2026-09-02",
  };
}

function toLesson(value: LearningLesson, index: number, stage: StageSpec, trackId: LearningTrack["id"]): CourseLesson {
  const guide = value.guide.map((item, guideIndex) => ({
    kind: guideIndex === 0 ? "概念入门" : guideIndex === 1 ? "逐步拆解" : "常见误区",
    ...item,
  })) as CourseLesson["guide"];
  if (guide.length !== 3) throw new Error(`${value.id} 必须正好包含三张讲解卡`);
  return {
    id: value.id,
    ...(value.familyId ? { familyId: value.familyId } : {}),
    stageId: stage.id,
    order: index + 1,
    title: value.title,
    kicker: `${trackId} 学习`,
    summary: value.summary,
    minutes: value.minutes,
    prerequisites: value.prerequisites ?? [],
    difficulty: value.difficulty ?? "beginner",
    tags: value.tags ?? [],
    guide,
    videos: value.videos,
    officialSources: value.officialSources.map(source),
    migrations: value.migrations.map((item) => ({
      ...item,
      officialSources: item.officialSources.map(source),
      verifiedAt: "2026-09-02",
      verifiedVersions: { langchain: "1.2.12", langgraph: "1.1.2" },
    })),
    project: value.project ?? false,
    projectLinks: value.projectLinks ?? [],
    exercise: {
      prompt: value.exercise.prompt,
      starterCode: value.exercise.starterCode,
      hints: value.exercise.hints,
      solution: value.exercise.solution,
    },
    browserChecks: value.browserChecks ?? [],
  };
}

export function authorTrackFromLessons(
  track: LearningTrack,
  stageSpecs: readonly StageSpec[],
): { stages: CourseStage[]; lessons: CourseLesson[] } {
  if (stageSpecs.length === 0) throw new Error(`课程路线缺少阶段：${track.id}`);
  const stages = stageSpecs.map((stage, index) => ({ ...stage, order: index + 1, lessonIds: [] as string[] }));
  const lessons = track.lessons.map((value, index) => {
    const stage = stages[index % stages.length];
    const lesson = toLesson(value, index, stage, track.id);
    stage.lessonIds.push(lesson.id);
    return lesson;
  });
  return { stages, lessons };
}
