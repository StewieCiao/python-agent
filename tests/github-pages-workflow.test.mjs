import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const workflow = await readFile(new URL("../.github/workflows/pages.yml", import.meta.url), "utf8");

test("GitHub Pages 工作流发布确定性的静态目录", () => {
  assert.match(workflow, /actions\/checkout@v4/);
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run build:pages/);
  assert.match(workflow, /actions\/upload-pages-artifact@v3/);
  assert.match(workflow, /path: dist-pages/);
  assert.match(workflow, /actions\/deploy-pages@v4/);
  assert.match(workflow, /permissions:[\s\S]*pages: write/);
  assert.doesNotMatch(workflow, /npm run dev|npm run start|wrangler deploy/);
});
