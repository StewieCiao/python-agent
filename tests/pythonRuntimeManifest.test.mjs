import assert from "node:assert/strict";
import { test } from "node:test";

async function loadManifest() {
  try {
    return await import("../scripts/python-runtime-manifest.mjs");
  } catch (error) {
    assert.fail(`内置 Python 运行时清单尚未实现：${error?.code || error?.message}`);
  }
}

const EXPECTED_ASSETS = {
  "darwin-arm64": {
    archive: "cpython-3.13.15+20260825-aarch64-apple-darwin-install_only.tar.gz",
    sha256: "d681f7cebf4885637242cba807d22f476b9ea8555ac2dc7307172426dbf161e1",
  },
  "darwin-x64": {
    archive: "cpython-3.13.15+20260825-x86_64-apple-darwin-install_only.tar.gz",
    sha256: "40eb292bb37f32639b1eb5736bef702081a2151eda1bb4e6171345a157babfa6",
  },
  "win32-arm64": {
    archive: "cpython-3.13.15+20260825-aarch64-pc-windows-msvc-install_only.tar.gz",
    sha256: "b15a161f9431eabbe4b9f445752aed3572260b011c10b858962f0f2508078fa8",
  },
  "win32-x64": {
    archive: "cpython-3.13.15+20260825-x86_64-pc-windows-msvc-install_only.tar.gz",
    sha256: "82a792c25550a421b29f381eaeafa6dccd1ffcbd97a1b1507b202f5df877cecf",
  },
};

test("内置 Python 只使用一个官方不可变 release 和四个固定校验资产", async () => {
  const { PYTHON_RUNTIME, runtimeAssetFor } = await loadManifest();

  assert.equal(PYTHON_RUNTIME.pythonVersion, "3.13.15");
  assert.equal(PYTHON_RUNTIME.releaseTag, "20260825");
  assert.deepEqual(Object.keys(PYTHON_RUNTIME.assets).sort(), Object.keys(EXPECTED_ASSETS).sort());

  for (const [target, expected] of Object.entries(EXPECTED_ASSETS)) {
    assert.deepEqual(PYTHON_RUNTIME.assets[target], {
      ...expected,
      url: `https://github.com/astral-sh/python-build-standalone/releases/download/20260825/${expected.archive}`,
    });
    const [platform, arch] = target.split("-");
    assert.deepEqual(runtimeAssetFor(platform, arch), PYTHON_RUNTIME.assets[target]);
  }
});

test("未知平台或架构明确失败，不尝试第二来源", async () => {
  const { runtimeAssetFor } = await loadManifest();

  assert.throws(() => runtimeAssetFor("linux", "x64"), /不支持的 Python 运行时目标: linux-x64/);
  assert.throws(() => runtimeAssetFor("darwin", "ia32"), /不支持的 Python 运行时目标: darwin-ia32/);
});

test("打包和运行服务共用同一平台解释器路径", async () => {
  const { pythonExecutableRelativePath } = await loadManifest();

  assert.equal(pythonExecutableRelativePath("darwin"), "bin/python3");
  assert.equal(pythonExecutableRelativePath("win32"), "python.exe");
  assert.throws(
    () => pythonExecutableRelativePath("linux"),
    /不支持的 Python 运行时平台: linux/,
  );
});

test("官方 release 只允许跳转到 GitHub 签名资产域", async () => {
  const { validateRuntimeAssetRedirect } = await loadManifest();
  const allowed =
    "https://release-assets.githubusercontent.com/github-production-release-asset/162334160/file?sig=abc";

  assert.equal(validateRuntimeAssetRedirect(allowed), allowed);
  assert.throws(
    () => validateRuntimeAssetRedirect("https://cdn.example.com/python.tar.gz"),
    /Python 运行时下载跳转到了非 GitHub 资产域/,
  );
  assert.throws(
    () => validateRuntimeAssetRedirect("http://release-assets.githubusercontent.com/file"),
    /Python 运行时下载跳转到了非 GitHub 资产域/,
  );
});
