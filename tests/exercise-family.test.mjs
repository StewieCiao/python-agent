import test from "node:test";
import assert from "node:assert/strict";
import { exerciseFamilies } from "../app/exercises/families.ts";

test("可信练习 family 只绑定已知的单一课程关卡并声明验证约束", async () => {
  const { authoredCatalog } = await import("../app/content/catalog.ts");
  const known = new Set(authoredCatalog.tracks.flatMap((track) => track.lessons.map((lesson) => lesson.id)));
  assert.ok(exerciseFamilies.length >= 7);
  for (const family of exerciseFamilies) {
    assert.equal(family.lessonIds.length, 1);
    assert.ok(known.has(family.lessonIds[0]));
    assert.match(family.validatorVersion, /^\d+$/);
    assert.ok(family.constraints.length > 0);
    assert.ok(family.mistakeCodes.length > 0);
  }
});

test("family id 和 lesson 绑定不重复", () => {
  assert.equal(new Set(exerciseFamilies.map((family) => family.id)).size, exerciseFamilies.length);
  assert.equal(new Set(exerciseFamilies.flatMap((family) => family.lessonIds)).size, exerciseFamilies.length);
});
