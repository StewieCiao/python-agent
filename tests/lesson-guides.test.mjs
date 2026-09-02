import test from "node:test";
import assert from "node:assert/strict";
import { lessons } from "../app/content/python/curriculum.ts";
import { lessonGuides } from "../app/content/python/lessonGuides.ts";

const expectedKinds = ["概念入门", "逐步拆解", "常见误区"];

test("每一关都有面向初学者的三段式知识讲解", () => {
  assert.deepEqual(
    Object.keys(lessonGuides).sort(),
    lessons.map((lesson) => lesson.id).sort(),
  );

  for (const lesson of lessons) {
    const guide = lessonGuides[lesson.id];
    assert.equal(guide.length, 3, `${lesson.id} 应有三段讲解`);
    assert.deepEqual(guide.map((section) => section.kind), expectedKinds);
    for (const section of guide) {
      assert.ok(section.title.length >= 6, `${lesson.id} 的标题过短`);
      assert.ok(section.body.length >= 55, `${lesson.id}/${section.kind} 的讲解不够详细`);
      assert.ok(section.example.trim().length > 0, `${lesson.id}/${section.kind} 缺少示例`);
      assert.ok(section.bullets.length >= 3, `${lesson.id}/${section.kind} 缺少阅读要点`);
      assert.ok(section.bullets.every((bullet) => bullet.trim().length >= 5));
    }
  }
});

test("知识讲解标题具体且不重复", () => {
  const titles = Object.values(lessonGuides).flatMap((guide) =>
    guide.map((section) => section.title),
  );
  assert.equal(new Set(titles).size, titles.length);
});
