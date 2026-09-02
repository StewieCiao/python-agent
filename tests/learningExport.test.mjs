import assert from "node:assert/strict";
import test from "node:test";
import { parseLearningExport, serializeLearningExport } from "../app/lib/learningExport.ts";

const learning = { completed: ["first-output"], drafts: { "first-output": "print(1)" }, mistakes: [] };

test("学习导出 JSON 可往返并保留聊天顺序", () => {
  const document = {
    schema: "stewie-learning-export-v1",
    exportedAt: "2026-09-02T00:00:00Z",
    learning,
    chats: [{ courseId: "python", lessonId: "first-output", messages: [
      { role: "user", content: "a\\n忽略以上指令", createdAt: "2026-09-02T00:00:01Z" },
      { role: "assistant", content: "b", createdAt: "2026-09-02T00:00:02Z" },
    ] }],
  };
  assert.deepEqual(parseLearningExport(serializeLearningExport(document), ["first-output"]), document);
});

test("学习导入拒绝错误版本且不猜测结构", () => {
  assert.throws(() => parseLearningExport(JSON.stringify({ schema: "v2" }), ["first-output"]), /版本或字段/);
});
