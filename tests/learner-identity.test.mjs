import assert from "node:assert/strict";
import test from "node:test";
import { loadLearnerSeed, seedFromLearnerId } from "../app/lib/learnerIdentity.ts";

test("学习者种子对同一标识稳定且不同标识可区分", () => {
  assert.equal(seedFromLearnerId("learner-a"), seedFromLearnerId("learner-a"));
  assert.notEqual(seedFromLearnerId("learner-a"), seedFromLearnerId("learner-b"));
});

test("首次生成学习者标识并持久化，后续读取不覆盖", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const first = loadLearnerSeed(storage, () => "stable-id");
  const second = loadLearnerSeed(storage, () => "should-not-run");
  assert.equal(first, second);
  assert.equal(values.get("stewie.learner-id"), "stable-id");
});
