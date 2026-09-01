import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startPythonService } from "../desktop/src/pythonService.mts";
import { packagedResourcesPath } from "./desktopPackagePaths.mjs";

const directory = await mkdtemp(join(tmpdir(), "stewie-python-smoke-"));
let client;
try {
  client = await startPythonService({
    resourcesPath: packagedResourcesPath(process.platform, process.arch),
    platform: process.platform,
    databasePath: join(directory, "stewie.db"),
    onFailure(error) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    },
  });
  process.stdout.write(`${JSON.stringify(client.health)}\n`);
} finally {
  client?.stop();
  await rm(directory, { recursive: true, force: true });
}
