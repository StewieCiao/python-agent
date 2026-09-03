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

const PYTHON_OFFICIAL_SOURCES: Record<string, { label: string; url: string }> = {
  "first-output": { label: "Python 教程：介绍", url: "https://docs.python.org/3/tutorial/introduction.html" },
  variables: { label: "Python 教程：数字与文本", url: "https://docs.python.org/3/tutorial/introduction.html" },
  strings: { label: "Python 教程：字符串", url: "https://docs.python.org/3/tutorial/introduction.html#strings" },
  branches: { label: "Python 教程：控制流工具", url: "https://docs.python.org/3/tutorial/controlflow.html" },
  loops: { label: "Python 教程：for 语句", url: "https://docs.python.org/3/tutorial/controlflow.html#for-statements" },
  functions: { label: "Python 教程：定义函数", url: "https://docs.python.org/3/tutorial/controlflow.html#defining-functions" },
  lists: { label: "Python 教程：数据结构", url: "https://docs.python.org/3/tutorial/datastructures.html" },
  dictionaries: { label: "Python 教程：字典", url: "https://docs.python.org/3/tutorial/datastructures.html#dictionaries" },
  exceptions: { label: "Python 教程：错误和异常", url: "https://docs.python.org/3/tutorial/errors.html" },
  classes: { label: "Python 教程：类", url: "https://docs.python.org/3/tutorial/classes.html" },
  generators: { label: "Python 教程：生成器", url: "https://docs.python.org/3/howto/functional.html#generators" },
  decorators: { label: "Python 术语表：装饰器", url: "https://docs.python.org/3/glossary.html#term-decorator" },
  "project-text": { label: "Python 教程：字符串方法", url: "https://docs.python.org/3/library/stdtypes.html#text-sequence-type-str" },
  "project-expense": { label: "Python 教程：读取与写入文件", url: "https://docs.python.org/3/tutorial/inputoutput.html#reading-and-writing-files" },
  "project-tasks": { label: "Python 教程：数据结构", url: "https://docs.python.org/3/tutorial/datastructures.html" },
};

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
  prerequisites: lesson.number === 1 ? [] : [lessons[lesson.number - 2].id],
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
  officialSources: [{ ...(lesson.source ?? PYTHON_OFFICIAL_SOURCES[lesson.id]), kind: sourceKind((lesson.source ?? PYTHON_OFFICIAL_SOURCES[lesson.id]).url), verifiedAt: "2026-09-02" }],
  migrations: [],
  project: lesson.project ?? false,
  projectLinks: [],
  exercise: {
    prompt: lesson.requirements.join("\n"),
    starterCode: lesson.starterCode,
    hints: lesson.hints.length === 2 ? [...lesson.hints, lessonGuides[lesson.id][2].bullets[0]] : lesson.hints,
    solution: lessonSolutions[lesson.id],
  },
  browserChecks: lesson.tests.map(browserCheck),
}));
