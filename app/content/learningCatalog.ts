import { lessons as pythonLessons } from "./python/curriculum.ts";
import { lessonGuides } from "./python/lessonGuides.ts";
import { lessonSolutions } from "./python/solutions.ts";
import type { LearningTrack } from "./authoring/types.ts";
import { langchainTrack } from "./langchain-rag/source.ts";
import { langgraphTrack } from "./langgraph/source.ts";

export type { LearningLesson, LearningTrack } from "./authoring/types.ts";


const pythonTrack: LearningTrack = {
  id: "python",
  title: "Python 基础与工程",
  shortTitle: "Python",
  description: "从第一行代码到可测试的 Agent 基础组件。练习、真实运行反馈和错题记录全部保留，但不再锁定学习顺序。",
  accent: "#d58a42",
  currentLessonId: pythonLessons[0].id,
  lessons: pythonLessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.goal,
    minutes: lesson.minutes,
    prerequisites: [],
    difficulty: lesson.module.startsWith("Agent") ? "advanced" : "beginner",
    tags: [lesson.kicker],
    guide: lessonGuides[lesson.id].map(({ title, body, bullets, example }) => ({
      title,
      body,
      bullets,
      example,
    })),
    videos: [],
    officialSources: lesson.source ? [lesson.source] : [],
    migrations: [],
    project: lesson.project ?? false,
    projectLinks: [],
    pythonLessonId: lesson.id,
    exercise: {
      prompt: lesson.requirements.join("\n"),
      starterCode: lesson.starterCode,
      hints: lesson.hints,
      solution: lessonSolutions[lesson.id],
    },
    browserChecks: lesson.tests.map((test) => ({
      name: test.name,
      expression: test.expression,
      failure: test.failure,
      kind: test.kind ?? "behavior",
    })),
  })),
};

export const learningTracks: LearningTrack[] = [pythonTrack, langchainTrack, langgraphTrack];

const ALLOWED_VIDEO_HOSTS = new Set([
  "www.bilibili.com",
  "academy.langchain.com",
  "www.deeplearning.ai",
]);

export function validateLearningCatalog(catalog: readonly LearningTrack[]) {
  const trackIds = new Set<string>();
  for (const track of catalog) {
    if (trackIds.has(track.id)) throw new Error(`重复课程路线 ${track.id}`);
    trackIds.add(track.id);
    if (track.lessons.length === 0) throw new Error(`课程路线 ${track.id} 没有课程`);

    const lessonIds = new Set<string>();
    for (const lesson of track.lessons) {
      if (lessonIds.has(lesson.id)) throw new Error(`重复课程 ${track.id}/${lesson.id}`);
      lessonIds.add(lesson.id);
      if (lesson.guide.length < 2) throw new Error(`课程讲解不足 ${track.id}/${lesson.id}`);
      if (track.id !== "python" && lesson.videos.length === 0) {
        throw new Error(`课程缺少视频 ${track.id}/${lesson.id}`);
      }
      if (!lesson.exercise) throw new Error(`课程缺少练习 ${track.id}/${lesson.id}`);
      if (!lesson.browserChecks || lesson.browserChecks.length < 2) throw new Error(`课程反馈检查不足 ${track.id}/${lesson.id}`);
      for (const video of lesson.videos) {
        const host = new URL(video.url).hostname;
        if (!ALLOWED_VIDEO_HOSTS.has(host)) throw new Error(`不允许的视频域名 ${host}`);
      }
      for (const source of lesson.officialSources) {
        if (new URL(source.url).protocol !== "https:") {
          throw new Error(`官方来源必须使用 HTTPS ${track.id}/${lesson.id}`);
        }
      }
      for (const migration of lesson.migrations) {
        if (migration.officialSources.length === 0) {
          throw new Error(`迁移说明缺少官方来源 ${track.id}/${lesson.id}`);
        }
        if (!migration.beforeCode.trim() || !migration.afterCode.trim()) {
          throw new Error(`迁移说明缺少代码 ${track.id}/${lesson.id}`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(migration.verifiedAt)) {
          throw new Error(`迁移说明核验日期无效 ${track.id}/${lesson.id}`);
        }
        if (!migration.verifiedVersions.langchain || !migration.verifiedVersions.langgraph) {
          throw new Error(`迁移说明缺少核验版本 ${track.id}/${lesson.id}`);
        }
      }
    }
    if (!lessonIds.has(track.currentLessonId)) {
      throw new Error(`当前课程不存在 ${track.id}/${track.currentLessonId}`);
    }
  }
}

validateLearningCatalog(learningTracks);

export function findLearningLesson(courseId: string, lessonId: string) {
  const track = learningTracks.find((item) => item.id === courseId);
  return track?.lessons.find((item) => item.id === lessonId) ?? null;
}
