import {
  lessons,
  type LessonTest,
} from "./curriculum.ts";
import { lessonGuides } from "./lessonGuides.ts";
import { lessonSolutions } from "./solutions.ts";
import type { CourseLesson, CourseStage } from "../schema.ts";
import { exerciseFamilies } from "../../exercises/families.ts";

const stageNames = [
  "Python 起步",
  "Python 工程能力",
  "Python 综合训练",
  "Agent 核心范式",
  "Agent 系统能力",
  "Agent 案例实战",
] as const;

const stageIds = new Map(stageNames.map((name) => [name, `python-${name}`]));

function sourceKind(url: string): "official-doc" | "official-repo" {
  return url.includes("github.com") ? "official-repo" : "official-doc";
}

function browserCheck(test: LessonTest) {
  return {
    name: test.name,
    expression: test.expression,
    failure: test.failure,
    kind: test.kind ?? "behavior",
    ...(test.feedback ? { feedback: test.feedback } : {}),
  } as CourseLesson["browserChecks"][number];
}

export const pythonStages: CourseStage[] = stageNames.map((name, index) => ({
  id: stageIds.get(name)!,
  order: index + 1,
  title: name,
  description: `沿用现有 ${name} 学习模块。`,
  lessonIds: lessons.filter((lesson) => lesson.module === name).map(({ id }) => id),
}));

export const pythonLessons: CourseLesson[] = lessons.map((lesson) => ({
  id: lesson.id,
  ...(exerciseFamilies.find((family) => family.lessonIds[0] === lesson.id)?.id ? { familyId: exerciseFamilies.find((family) => family.lessonIds[0] === lesson.id)?.id } : {}),
  stageId: stageIds.get(lesson.module)!,
  order: lesson.number,
  title: lesson.title,
  kicker: lesson.kicker,
  summary: lesson.goal,
  minutes: lesson.minutes,
  prerequisites: [],
  difficulty: lesson.module.startsWith("Agent") ? "advanced" : "beginner",
  tags: [lesson.kicker],
  guide: lessonGuides[lesson.id].map(({ kind, title, body, bullets, example }) => ({
    kind,
    title,
    body,
    bullets,
    example,
  })),
  videos: [],
  officialSources: lesson.source ? [{ ...lesson.source, kind: sourceKind(lesson.source.url), verifiedAt: "2026-09-02" }] : [],
  migrations: [],
  project: lesson.project ?? false,
  projectLinks: [],
  exercise: {
    prompt: lesson.requirements.join("\n"),
    starterCode: lesson.starterCode,
    hints: lesson.hints,
    solution: lessonSolutions[lesson.id],
  },
  browserChecks: lesson.tests.map(browserCheck),
}));
