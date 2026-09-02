import { createHash } from "node:crypto";
import snapshot from "../../generated/course-public.json" with { type: "json" };
import { canonicalJson } from "../../app/content/canonicalJson.ts";

type CatalogSnapshot = typeof snapshot;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function getPublicCatalogHashes(): { catalogHash: string; familyHash: string } {
  const catalog = snapshot.catalog as CatalogSnapshot["catalog"];
  const checks = Object.fromEntries(
    catalog.tracks.flatMap((track) => track.lessons.map((lesson) => [lesson.id, lesson.browserChecks])),
  );
  const families = snapshot.families;
  return {
    catalogHash: sha256(canonicalJson(catalog)),
    familyHash: sha256(canonicalJson({ checks, families })),
  };
}

export function assertCatalogHashes(expected: { catalogHash: string; familyHash: string }): void {
  const actual = getPublicCatalogHashes();
  if (actual.catalogHash !== expected.catalogHash || actual.familyHash !== expected.familyHash) {
    throw new Error("公开课程与 Python 服务课程快照不一致");
  }
}
