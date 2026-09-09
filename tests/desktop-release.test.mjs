import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const smoke = await readFile(new URL("../.github/workflows/desktop-smoke.yml", import.meta.url), "utf8");
const release = await readFile(new URL("../.github/workflows/desktop-release.yml", import.meta.url), "utf8");

test("Windows ARM64 smoke skips only unsupported workerd install scripts", () => {
  assert.match(smoke, /npm ci --ignore-scripts/);
  assert.match(smoke, /windows-11-arm/);
  assert.match(smoke, /npm rebuild electron --workspace @stewie\/desktop/);
  assert.match(smoke, /npm run desktop:package/);
});

test("Windows x64 和 ARM64 仍保留在正式发布矩阵", () => {
  assert.match(release, /target: Windows arm64[\s\S]*runner: windows-11-arm/);
  assert.match(release, /target: Windows x64[\s\S]*runner: windows-2025/);
  assert.match(release, /path: desktop\/out\/make\/\*\*/);
  assert.match(release, /actions\/download-artifact@v4/);
  assert.match(release, /stewie-learnos-1\.0\.0-offline\.html/);
  assert.match(release, /gh release create/);
});
