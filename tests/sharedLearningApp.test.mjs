import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("Web 与桌面入口使用同一个学习应用和同一份 Python 运行资产", async () => {
  const [webEntry, desktopEntry, desktopVite, desktopHtml] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../desktop/src/renderer.tsx", import.meta.url), "utf8"),
    readFile(new URL("../desktop/vite.renderer.config.ts", import.meta.url), "utf8"),
    readFile(new URL("../desktop/index.html", import.meta.url), "utf8"),
  ]);

  assert.match(webEntry, /components\/LearningApp/);
  assert.match(desktopEntry, /app\/components\/LearningApp/);
  assert.match(desktopEntry, /app\/globals\.css/);
  assert.match(desktopVite, /publicDir:\s*["']\.\.\/public["']/);
  assert.match(desktopHtml, /script-src 'self' 'wasm-unsafe-eval'/);
  assert.match(desktopHtml, /worker-src 'self'/);
});
