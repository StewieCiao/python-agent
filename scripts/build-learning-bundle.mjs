import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { authoredCatalog } from "../app/content/catalog.ts";
import { canonicalJson } from "../app/content/canonicalJson.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicPath = resolve(root, "generated/course-public.json");
const servicePath = resolve(root, "generated/learning-service.json");

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

const catalog = {
  verifiedAt: authoredCatalog.verifiedAt,
  runtimeVersions: authoredCatalog.runtimeVersions,
  tracks: authoredCatalog.tracks,
};
const checks = Object.fromEntries(
  authoredCatalog.tracks.flatMap((track) => track.lessons.map((lesson) => [lesson.id, lesson.browserChecks])),
);
const catalogHash = sha256(canonicalJson(catalog));
const familyHash = sha256(canonicalJson(checks));
const publicSnapshot = {
  schemaVersion: authoredCatalog.schemaVersion,
  catalogHash,
  familyHash,
  catalog,
};
const serviceSnapshot = {
  ...publicSnapshot,
  checks,
};

await mkdir(dirname(publicPath), { recursive: true });
await writeFile(publicPath, `${JSON.stringify(publicSnapshot, null, 2)}\n`, "utf8");
await writeFile(servicePath, `${JSON.stringify(serviceSnapshot, null, 2)}\n`, "utf8");

