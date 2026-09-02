import test from "node:test";
import assert from "node:assert/strict";
import snapshot from "../generated/course-public.json" with { type: "json" };
import { getPublicCatalogHashes, assertCatalogHashes } from "../desktop/src/catalogBundle.mts";

test("桌面端重新计算的课程哈希与公开快照一致", () => {
  assert.deepEqual(getPublicCatalogHashes(), {
    catalogHash: snapshot.catalogHash,
    familyHash: snapshot.familyHash,
  });
});

test("课程哈希不一致时阻止启动", () => {
  assert.throws(
    () => assertCatalogHashes({ catalogHash: "0".repeat(64), familyHash: snapshot.familyHash }),
    /课程快照不一致/,
  );
});
