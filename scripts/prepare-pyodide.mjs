import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const EXPECTED_VERSION = "314.0.3";
const files = [
  "pyodide.mjs",
  "pyodide.asm.mjs",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
];

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(projectRoot, "node_modules", "pyodide");
const publicRoot = join(projectRoot, "public", "pyodide");
const packageJson = JSON.parse(
  await readFile(join(packageRoot, "package.json"), "utf8"),
);

if (packageJson.version !== EXPECTED_VERSION) {
  throw new Error(
    `Expected pyodide ${EXPECTED_VERSION}, found ${packageJson.version}.`,
  );
}

await mkdir(publicRoot, { recursive: true });
await Promise.all(
  files.map((file) =>
    copyFile(join(packageRoot, file), join(publicRoot, file)),
  ),
);
await writeFile(
  join(publicRoot, "runtime-manifest.json"),
  `${JSON.stringify(
    {
      package: "pyodide",
      version: EXPECTED_VERSION,
      source: "official npm package",
      files,
    },
    null,
    2,
  )}\n`,
  "utf8",
);
