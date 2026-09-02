import { createHash } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import {
  access,
  chmod,
  cp,
  mkdir,
  readFile,
  rename,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  PYTHON_RUNTIME,
  pythonExecutableRelativePath,
  runtimeAssetFor,
  validateRuntimeAssetRedirect,
} from "./python-runtime-manifest.mjs";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BUILD_ROOT = join(PROJECT_ROOT, "desktop", ".runtime");
const RUNTIME_ROOT = join(BUILD_ROOT, "python");
const CACHE_ROOT = join(BUILD_ROOT, "cache");
const SOURCE_ROOT = join(PROJECT_ROOT, "python-runtime");
const LEARNING_BUNDLE = join(PROJECT_ROOT, "generated", "learning-service.json");
const LOCK_PATH = join(SOURCE_ROOT, "requirements.lock");
const SERVICE_FILES = [
  "catalog.py",
  "protocol.py",
  "service.py",
  "storage.py",
  "migrations/001-model-profiles.sql",
  "migrations/002-learning-state.sql",
];

async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function sha256File(path) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
}

async function run(command, args) {
  await new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { stdio: "inherit" });
    child.once("error", rejectRun);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveRun();
      else rejectRun(new Error(`${command} 失败（code=${code}, signal=${signal ?? "none"}）`));
    });
  });
}

async function verifyArchive(path, expectedSha256) {
  const actualSha256 = await sha256File(path);
  if (actualSha256 !== expectedSha256) {
    throw new Error(`Python 运行时 SHA-256 不匹配：期望 ${expectedSha256}，实际 ${actualSha256}`);
  }
}

async function downloadArchive(asset, archivePath) {
  const partialPath = `${archivePath}.${process.pid}.part`;
  try {
    const signal = AbortSignal.timeout(120_000);
    let response = await fetch(asset.url, {
      redirect: "manual",
      signal,
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) throw new Error("Python 运行时下载跳转缺少 location");
      response = await fetch(validateRuntimeAssetRedirect(location), {
        redirect: "error",
        signal,
      });
    }
    if (!response.ok) {
      throw new Error(`Python 运行时下载失败：HTTP ${response.status}`);
    }
    if (!response.body) throw new Error("Python 运行时下载失败：响应没有内容");
    await pipeline(Readable.fromWeb(response.body), createWriteStream(partialPath, { flags: "wx" }));
    await verifyArchive(partialPath, asset.sha256);
    await rename(partialPath, archivePath);
  } finally {
    await rm(partialPath, { force: true });
  }
}

async function sourceFingerprint(asset) {
  const sourceHashes = {};
  for (const file of ["requirements.lock", ...SERVICE_FILES]) {
    sourceHashes[file] = await sha256File(join(SOURCE_ROOT, file));
  }
  sourceHashes["generated/learning-service.json"] = await sha256File(LEARNING_BUNDLE);
  return {
    pythonVersion: PYTHON_RUNTIME.pythonVersion,
    releaseTag: PYTHON_RUNTIME.releaseTag,
    assetSha256: asset.sha256,
    sourceHashes,
  };
}

export async function preparePythonRuntime() {
  const asset = runtimeAssetFor(process.platform, process.arch);
  const executableRelativePath = pythonExecutableRelativePath(process.platform);
  const marker = await sourceFingerprint(asset);
  const markerPath = join(RUNTIME_ROOT, ".stewie-runtime.json");
  const executablePath = join(RUNTIME_ROOT, executableRelativePath);

  if (await pathExists(markerPath)) {
    const currentMarker = JSON.parse(await readFile(markerPath, "utf8"));
    if (JSON.stringify(currentMarker) === JSON.stringify(marker) && await pathExists(executablePath)) {
      return RUNTIME_ROOT;
    }
  }

  await mkdir(CACHE_ROOT, { recursive: true });
  const archivePath = join(CACHE_ROOT, asset.archive);
  if (await pathExists(archivePath)) await verifyArchive(archivePath, asset.sha256);
  else await downloadArchive(asset, archivePath);

  const stageRoot = join(BUILD_ROOT, `stage-${process.pid}`);
  const extractRoot = join(stageRoot, "extract");
  const stagedRuntime = join(extractRoot, "python");
  try {
    await mkdir(extractRoot, { recursive: true });
    await run("tar", ["-xzf", archivePath, "-C", extractRoot]);

    const stagedExecutable = join(stagedRuntime, executableRelativePath);
    if (process.platform !== "win32") {
      const mode = (await stat(stagedExecutable)).mode | 0o755;
      await chmod(stagedExecutable, mode);
    }
    await run(stagedExecutable, [
      "-m",
      "pip",
      "install",
      "--disable-pip-version-check",
      "--no-cache-dir",
      "--no-warn-script-location",
      "--require-hashes",
      "-r",
      LOCK_PATH,
    ]);

    const serviceRoot = join(stagedRuntime, "service");
    await mkdir(serviceRoot);
    for (const file of SERVICE_FILES) {
      const target = join(serviceRoot, file);
      await mkdir(dirname(target), { recursive: true });
      await cp(join(SOURCE_ROOT, file), target);
    }
    await cp(LEARNING_BUNDLE, join(serviceRoot, "learning-service.json"));
    await run(stagedExecutable, [
      "-c",
      "import langchain, langgraph, pypdf; import langgraph.checkpoint.sqlite",
    ]);
    await writeFile(join(stagedRuntime, ".stewie-runtime.json"), `${JSON.stringify(marker)}\n`);

    await rm(RUNTIME_ROOT, { recursive: true, force: true });
    await rename(stagedRuntime, RUNTIME_ROOT);
  } finally {
    await rm(stageRoot, { recursive: true, force: true });
  }
  return RUNTIME_ROOT;
}

if (fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  preparePythonRuntime().then(
    (runtimeRoot) => console.log(`Python ${PYTHON_RUNTIME.pythonVersion} 已准备：${runtimeRoot}`),
    (error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    },
  );
}
