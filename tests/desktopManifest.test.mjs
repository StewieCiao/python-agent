import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const ROOT_MANIFEST_URL = new URL("../package.json", import.meta.url);
const DESKTOP_MANIFEST_URL = new URL("../desktop/package.json", import.meta.url);
const FORGE_CONFIG_URL = new URL("../desktop/forge.config.ts", import.meta.url);
const ESLINT_CONFIG_URL = new URL("../eslint.config.mjs", import.meta.url);

async function readJsonOrNull(url) {
  try {
    return JSON.parse(await readFile(url, "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

test("桌面工作区固定发行依赖，最终用户不需要运行安装脚本", async () => {
  const rootManifest = await readJsonOrNull(ROOT_MANIFEST_URL);
  const desktopManifest = await readJsonOrNull(DESKTOP_MANIFEST_URL);

  assert.ok(desktopManifest, "desktop/package.json 尚未建立");
  assert.equal(desktopManifest.author, "Stewie");
  assert.deepEqual(rootManifest.workspaces, ["desktop"]);
  assert.equal(desktopManifest.main, ".vite/build/main.js");
  assert.equal(desktopManifest.scripts.start, "electron-forge start");
  assert.equal(desktopManifest.scripts.package, "electron-forge package");
  assert.equal(desktopManifest.scripts.make, "electron-forge make");
  assert.equal(desktopManifest.scripts.postinstall, undefined);

  const expectedPinned = {
    electron: "44.1.0",
    "@electron/fuses": "1.8.0",
    "@electron-forge/cli": "7.11.2",
    "@electron-forge/maker-dmg": "7.11.2",
    "@electron-forge/maker-squirrel": "7.11.2",
    "@electron-forge/plugin-fuses": "7.11.2",
    "@electron-forge/plugin-vite": "7.11.2",
  };

  for (const [name, version] of Object.entries(expectedPinned)) {
    assert.equal(desktopManifest.devDependencies[name], version, `${name} 必须锁定为 ${version}`);
  }
});

test("桌面渲染入口会进入 Forge 的生产资源目录", async () => {
  const rootEntryUrl = new URL("../desktop/index.html", import.meta.url);
  const nestedEntryUrl = new URL("../desktop/src/index.html", import.meta.url);

  const rootEntry = await readFile(rootEntryUrl, "utf8");
  assert.match(rootEntry, /src="\/src\/renderer\.tsx"/);
  await assert.rejects(access(nestedEntryUrl), { code: "ENOENT" });
});

test("发行包覆盖 Windows/macOS 并关闭 file 协议额外权限", async () => {
  const forgeConfig = await readFile(FORGE_CONFIG_URL, "utf8");
  assert.match(forgeConfig, /new MakerSquirrel\(/);
  assert.match(forgeConfig, /new MakerDMG\(/);
  assert.match(forgeConfig, /FuseV1Options\.GrantFileProtocolExtraPrivileges\]: false/);
});

test("lint 忽略 Forge 生成物但继续检查桌面业务源码", async () => {
  const eslintConfig = await readFile(ESLINT_CONFIG_URL, "utf8");
  assert.match(eslintConfig, /desktop\/\.vite\/\*\*/);
  assert.match(eslintConfig, /desktop\/src\/\.vite\/\*\*/);
  assert.doesNotMatch(eslintConfig, /desktop\/\*\*/);
});
