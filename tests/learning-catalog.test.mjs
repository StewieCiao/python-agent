import test from "node:test";
import assert from "node:assert/strict";
import {
  learningTracks,
  validateLearningCatalog,
} from "../app/content/learningCatalog.ts";

test("学习目录以一组不变量阻止重复标识、无来源迁移和不可信视频", () => {
  assert.doesNotThrow(() => validateLearningCatalog(learningTracks));
  assert.deepEqual(
    learningTracks.map((track) => track.id),
    ["python", "langchain-rag", "langgraph"],
  );
});

test("目录校验拒绝视频域名和迁移来源被悄悄放宽", () => {
  const invalid = structuredClone(learningTracks);
  invalid[1].lessons[0].videos[0].url = "https://example.com/course";
  assert.throws(
    () => validateLearningCatalog(invalid),
    /不允许的视频域名 example\.com/,
  );

  const missingSource = structuredClone(learningTracks);
  missingSource[1].lessons[0].migrations[0].officialSources = [];
  assert.throws(
    () => validateLearningCatalog(missingSource),
    /迁移说明缺少官方来源/,
  );

  const missingExercise = structuredClone(learningTracks);
  delete missingExercise[2].lessons[0].exercise;
  assert.throws(
    () => validateLearningCatalog(missingExercise),
    /课程缺少练习/,
  );
});
