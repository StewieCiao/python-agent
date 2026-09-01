const RELEASE_BASE =
  "https://github.com/astral-sh/python-build-standalone/releases/download/20260825";

const assets = {
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

for (const asset of Object.values(assets)) {
  Object.assign(asset, { url: `${RELEASE_BASE}/${asset.archive}` });
  Object.freeze(asset);
}

export const PYTHON_RUNTIME = Object.freeze({
  pythonVersion: "3.13.15",
  releaseTag: "20260825",
  assets: Object.freeze(assets),
});

export function runtimeAssetFor(platform, arch) {
  const target = `${platform}-${arch}`;
  const asset = PYTHON_RUNTIME.assets[target];
  if (!asset) throw new Error(`不支持的 Python 运行时目标: ${target}`);
  return asset;
}

export function pythonExecutableRelativePath(platform) {
  if (platform === "darwin") return "bin/python3";
  if (platform === "win32") return "python.exe";
  throw new Error(`不支持的 Python 运行时平台: ${platform}`);
}

export function validateRuntimeAssetRedirect(rawUrl) {
  if (URL.canParse(rawUrl)) {
    const url = new URL(rawUrl);
    if (url.protocol === "https:" && url.hostname === "release-assets.githubusercontent.com") {
      return url.toString();
    }
  }
  throw new Error("Python 运行时下载跳转到了非 GitHub 资产域");
}
