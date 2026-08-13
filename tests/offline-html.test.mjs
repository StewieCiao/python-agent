import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { lessons, MODULE_ORDER } from "../app/lib/curriculum.ts";
import { lessonSolutions } from "../app/lib/solutions.ts";

const offlineHtml = await readFile(
  new URL("../Python-Agent-离线学习.html", import.meta.url),
  "utf8",
);

const dataMatch = offlineHtml.match(
  /<script id="course-data" type="application\/json">([\s\S]*?)<\/script>/,
);

test("离线文件内嵌完整课程与参考答案", () => {
  assert.ok(dataMatch, "应包含内嵌课程 JSON");
  const course = JSON.parse(dataMatch[1]);
  assert.deepEqual(course.modules, MODULE_ORDER);
  assert.deepEqual(
    course.lessons.map(({ id, number }) => ({ id, number })),
    lessons.map(({ id, number }) => ({ id, number })),
  );
  for (const lesson of course.lessons) {
    assert.equal(lesson.solution, lessonSolutions[lesson.id]);
    assert.ok(lesson.requirements.length > 0);
    assert.ok(lesson.tests.length > 0);
  }
});

test("离线文件没有外部资源或联网执行入口", () => {
  assert.match(offlineHtml, /connect-src 'none'/);
  assert.doesNotMatch(offlineHtml, /https?:\/\//i);
  assert.doesNotMatch(offlineHtml, /<(?:script|img|link)[^>]+(?:src|href)=/i);
  assert.doesNotMatch(
    offlineHtml,
    /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\s*\(/,
  );
  assert.doesNotMatch(offlineHtml, /pyodide|WebAssembly/i);
});

test("课程 JSON 使用脚本安全序列化", () => {
  assert.ok(dataMatch);
  assert.doesNotMatch(dataMatch[1], /<\/script/i);
  assert.equal(JSON.parse(dataMatch[1]).lessons.length, 25);
});
