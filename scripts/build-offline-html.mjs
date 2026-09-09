import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = dirname(scriptDirectory);
const templatePath = join(projectRoot, "offline", "template.html");
const outputPath = join(projectRoot, "Stewie-个人学习站-离线版.html");

const publicSnapshot = JSON.parse(await readFile(join(projectRoot, "generated", "course-public.json"), "utf8"));
const highlightSource = (await readFile(join(projectRoot, "app/lib/editor/pythonHighlight.mjs"), "utf8")).replace(/^export /m, "");

const course = {
  tracks: publicSnapshot.catalog.tracks,
};

const template = await readFile(templatePath, "utf8");
const placeholder = "__COURSE_DATA__";
if (template.split(placeholder).length !== 2) {
  throw new Error("离线模板必须且只能包含一个课程数据占位符。");
}

const serializedCourse = JSON.stringify(course).replaceAll("<", "\\u003c");
const output = template.replace(placeholder, serializedCourse).replace("__PYTHON_HIGHLIGHT__", highlightSource);
await writeFile(outputPath, output, "utf8");

console.log(`已生成：${outputPath}`);
