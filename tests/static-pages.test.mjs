import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const root = new URL("..", import.meta.url);
const outputPath = new URL("../dist-pages/index.html", import.meta.url);

test("静态发布构建产出可直接部署的自包含 index.html", async () => {
  await run("node", ["scripts/build-pages.mjs"], { cwd: root });
  await access(outputPath);
  const html = await readFile(outputPath, "utf8");
  assert.match(html, /<title>Stewie 的个人学习站 · 离线版<\/title>/);
  assert.match(html, /<script id="course-data" type="application\/json">/);
  assert.doesNotMatch(html, /<(?:script|img|link)[^>]+(?:src|href)=/i);
  assert.doesNotMatch(html, /\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\s*\(/);
});
