import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { authoredCatalog } from "../app/content/catalog.ts";

const offlineHtml = await readFile(
  new URL("../Stewie-个人学习站-离线版.html", import.meta.url),
  "utf8",
);

const dataMatch = offlineHtml.match(
  /<script id="course-data" type="application\/json">([\s\S]*?)<\/script>/,
);

test("离线文件内嵌完整课程与参考答案", () => {
  assert.ok(dataMatch, "应包含内嵌课程 JSON");
  const course = JSON.parse(dataMatch[1]);
  assert.deepEqual(
    course.tracks.map(({ id, currentLessonId, lessons }) => ({
      id,
      currentLessonId,
      lessonIds: lessons.map((lesson) => lesson.id),
    })),
    authoredCatalog.tracks.map(({ id, currentLessonId, lessons }) => ({
      id,
      currentLessonId,
      lessonIds: lessons.map((lesson) => lesson.id),
    })),
  );
  for (const track of course.tracks) {
    for (const lesson of track.lessons) {
      assert.ok(lesson.guide.length >= 2);
      assert.ok(lesson.exercise.prompt);
      assert.ok(lesson.exercise.starterCode);
      assert.ok(lesson.exercise.solution);
    }
  }
});

test("离线版使用统一学习站品牌并明确排除本地服务功能", () => {
  assert.match(offlineHtml, /Stewie 的个人学习站/);
  assert.match(offlineHtml, /三条学习路线/);
  assert.doesNotMatch(offlineHtml, />模型设置<|>课程导师<|127\.0\.0\.1:4318/);
});

test("离线文件没有外部加载资源或联网执行入口", () => {
  assert.match(offlineHtml, /connect-src 'none'/);
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
  assert.deepEqual(
    JSON.parse(dataMatch[1]).tracks.map((track) => track.lessons.length),
    authoredCatalog.tracks.map((track) => track.lessons.length),
  );
});
