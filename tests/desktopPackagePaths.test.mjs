import assert from "node:assert/strict";
import { test } from "node:test";
import {
  packagedExecutablePath,
  packagedResourcesPath,
} from "../scripts/desktopPackagePaths.mjs";

test("四种发行目标共用 Forge 的可执行文件名与资源目录合同", () => {
  const cases = [
    ["darwin", "arm64", "Stewie LearnOS-darwin-arm64"],
    ["darwin", "x64", "Stewie LearnOS-darwin-x64"],
    ["win32", "arm64", "Stewie LearnOS-win32-arm64"],
    ["win32", "x64", "Stewie LearnOS-win32-x64"],
  ];

  for (const [platform, arch, target] of cases) {
    const executable = packagedExecutablePath(platform, arch);
    const resources = packagedResourcesPath(platform, arch);
    assert.match(executable, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(resources, new RegExp(target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    if (platform === "darwin") {
      assert.match(executable, /Stewie LearnOS\.app[/\\]Contents[/\\]MacOS[/\\]stewie-learnos$/);
      assert.match(resources, /Stewie LearnOS\.app[/\\]Contents[/\\]Resources$/);
    } else {
      assert.match(executable, /stewie-learnos\.exe$/);
      assert.match(resources, /resources$/);
    }
  }
});
