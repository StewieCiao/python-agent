import { join } from "node:path";

function targetDirectory(platform, arch) {
  if (platform !== "darwin" && platform !== "win32") {
    throw new Error(`不支持的桌面 smoke 平台：${platform}`);
  }
  return join("desktop", "out", `Stewie LearnOS-${platform}-${arch}`);
}

export function packagedExecutablePath(platform, arch) {
  const target = targetDirectory(platform, arch);
  if (platform === "darwin") {
    return join(target, "Stewie LearnOS.app", "Contents", "MacOS", "stewie-learnos");
  }
  return join(target, "stewie-learnos.exe");
}

export function packagedResourcesPath(platform, arch) {
  const target = targetDirectory(platform, arch);
  if (platform === "darwin") {
    return join(target, "Stewie LearnOS.app", "Contents", "Resources");
  }
  return join(target, "resources");
}
