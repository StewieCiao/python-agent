import { join } from "node:path";
import { startPythonService } from "../desktop/src/pythonService.mts";

function packagedResourcesPath(platform, arch) {
  const target = `Stewie LearnOS-${platform}-${arch}`;
  if (platform === "darwin") {
    return join("desktop", "out", target, "Stewie LearnOS.app", "Contents", "Resources");
  }
  if (platform === "win32") return join("desktop", "out", target, "resources");
  throw new Error(`不支持的桌面 smoke 平台：${platform}`);
}

const client = await startPythonService({
  resourcesPath: packagedResourcesPath(process.platform, process.arch),
  platform: process.platform,
  onFailure(error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  },
});

process.stdout.write(`${JSON.stringify(client.health)}\n`);
client.stop();
