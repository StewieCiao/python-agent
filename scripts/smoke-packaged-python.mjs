import { startPythonService } from "../desktop/src/pythonService.mts";
import { packagedResourcesPath } from "./desktopPackagePaths.mjs";

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
