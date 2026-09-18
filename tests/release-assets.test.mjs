import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const script = fileURLToPath(new URL("../scripts/prepare-release-assets.mjs", import.meta.url));
const targets = ["macos-arm64", "macos-x64", "windows-arm64", "windows-x64"];

test("发行文件具有版本/系统/架构名称，校验清单对应真实文件字节", async () => {
  const directory = await mkdtemp(join(tmpdir(), "stewie-release-"));
  try {
    for (const target of targets) {
      const folder = join(directory, "artifacts", `stewie-learnos-${target}`, "nested");
      await mkdir(folder, { recursive: true });
      await writeFile(join(folder, target.startsWith("macos") ? "Stewie-LearnOS.dmg" : "Stewie-LearnOS-Setup.exe"), target);
      await writeFile(join(folder, "ancillary.nupkg"), "not an installer");
    }
    await writeFile(join(directory, "offline.html"), "课程正文");
    await writeFile(join(directory, "pages.tar.gz"), "pages fixture");
    const result = spawnSync(process.execPath, [script, join(directory, "artifacts"), join(directory, "upload"), "1.0.0", join(directory, "offline.html"), join(directory, "pages.tar.gz")], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const expected = [
      "stewie-learnos-1.0.0-macos-arm64.dmg", "stewie-learnos-1.0.0-macos-x64.dmg",
      "stewie-learnos-1.0.0-windows-arm64-setup.exe", "stewie-learnos-1.0.0-windows-x64-setup.exe",
      "stewie-learnos-1.0.0-offline.html", "stewie-learnos-1.0.0-pages.tar.gz",
    ].sort();
    assert.deepEqual((await readdir(join(directory, "upload"))).sort(), ["SHA256SUMS.txt", ...expected].sort());
    const checksums = (await readFile(join(directory, "upload", "SHA256SUMS.txt"), "utf8")).trim().split("\n");
    assert.equal(checksums.length, expected.length);
    for (const [index, name] of expected.entries()) {
      const bytes = await readFile(join(directory, "upload", name));
      assert.equal(checksums[index], `${createHash("sha256").update(bytes).digest("hex")}  ${name}`);
    }
    assert.equal(await readFile(join(directory, "upload", expected.find((name) => name.endsWith("offline.html"))), "utf8"), "课程正文");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("缺失平台安装器时发行准备失败，不生成成功校验清单", async () => {
  const directory = await mkdtemp(join(tmpdir(), "stewie-release-missing-"));
  try {
    const result = spawnSync(process.execPath, [script, join(directory, "artifacts"), join(directory, "upload"), "1.0.0", "offline.html", "pages.tar.gz"], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /macos-arm64/);
    await assert.rejects(readFile(join(directory, "upload", "SHA256SUMS.txt")), { code: "ENOENT" });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
