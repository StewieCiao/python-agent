import type { LearningLesson, LearningTrack } from "./learningCatalog.ts";
import type { CourseLesson, CourseSource, CourseStage } from "./schema.ts";

function source(value: { label: string; url: string }): CourseSource {
  return {
    ...value,
    kind: value.url.includes("github.com") ? "official-repo" : "official-doc",
    verifiedAt: "2026-09-02",
  };
}

function lesson(value: LearningLesson, index: number, trackId: LearningTrack["id"]): CourseLesson {
  const stageId = `${trackId}-stage-${value.id}`;
  return {
    id: value.id,
    stageId,
    order: index + 1,
    title: value.title,
    kicker: `${trackId} 学习`,
    summary: value.summary,
    minutes: value.minutes,
    prerequisites: value.prerequisites ?? [],
    difficulty: value.difficulty ?? "beginner",
    tags: value.tags ?? [],
    guide: value.guide.map((item, guideIndex) => ({
      kind: guideIndex === 0 ? "概念入门" : guideIndex === 1 ? "逐步拆解" : "常见误区",
      ...item,
    })),
    videos: value.videos,
    officialSources: value.officialSources.map(source),
    migrations: value.migrations.map((item) => ({
      ...item,
      officialSources: item.officialSources.map(source),
      verifiedAt: "2026-09-02",
      verifiedVersions: { langchain: "1.2.12", langgraph: "1.1.2" },
    })),
    project: false,
    projectLinks: [],
    exercise: {
      ...value.exercise,
      hints: value.exercise.hints ?? ["先运行示例", "定位失败步骤", "用边界输入复测"],
    },
    browserChecks: value.browserChecks ?? [],
    project: value.project ?? false,
    projectLinks: value.projectLinks ?? [],
  };
}

export function adaptLegacyTrack(track: LearningTrack): { stages: CourseStage[]; lessons: CourseLesson[] } {
  const lessons = track.lessons.map((value, index) => lesson(value, index, track.id));
  return {
    lessons,
    stages: lessons.map((item, index) => ({
      id: item.stageId,
      order: index + 1,
      title: item.title,
      description: item.summary,
      lessonIds: [item.id],
    })),
  };
}
