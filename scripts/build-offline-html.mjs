import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { lessons } from "../app/lib/curriculum.ts";
import { lessonGuides } from "../app/lib/lessonGuides.ts";
import { lessonSolutions } from "../app/lib/solutions.ts";
import { learningTracks } from "../app/lib/learningCatalog.ts";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const templatePath = join(projectRoot, "offline", "template.html");
const outputPath = join(projectRoot, "Stewie-个人学习站-离线版.html");

const missingSolutions = lessons
  .filter((lesson) => typeof lessonSolutions[lesson.id] !== "string")
  .map((lesson) => lesson.id);

if (missingSolutions.length > 0) {
  throw new Error(`以下关卡缺少参考答案：${missingSolutions.join(", ")}`);
}

const missingGuides = lessons
  .filter((lesson) => !Array.isArray(lessonGuides[lesson.id]))
  .map((lesson) => lesson.id);

if (missingGuides.length > 0) {
  throw new Error(`以下关卡缺少知识讲解：${missingGuides.join(", ")}`);
}

const course = {
  tracks: learningTracks,
};

const template = await readFile(templatePath, "utf8");
const placeholder = "__COURSE_DATA__";
if (template.split(placeholder).length !== 2) {
  throw new Error("离线模板必须且只能包含一个课程数据占位符。");
}

const serializedCourse = JSON.stringify(course).replaceAll("<", "\\u003c");
const output = template.replace(placeholder, serializedCourse);
await writeFile(outputPath, output, "utf8");

console.log(`已生成：${outputPath}`);
