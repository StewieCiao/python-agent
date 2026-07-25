import test from "node:test";
import assert from "node:assert/strict";
import { parseStoredProgress } from "../app/lib/storageState.mjs";

const lessonIds = ["lesson-1", "lesson-2"];

function validState() {
  return {
    completed: ["lesson-1"],
    drafts: { "lesson-1": 'print("ok")' },
    mistakes: [
      {
        id: "mistake-1",
        lessonId: "lesson-1",
        createdAt: "2026-07-25T12:00:00.000Z",
        code: "print(missing)",
        output: "",
        stderr: "",
        exception: {
          type: "NameError",
          message: "name 'missing' is not defined",
          traceback: "Traceback...",
          line: 1,
        },
        tests: [],
      },
    ],
  };
}

test("完整本地进度通过校验", () => {
  const state = validState();
  assert.deepEqual(parseStoredProgress(JSON.stringify(state), lessonIds), state);
});

test("未知或重复 completed 关卡使整份记录失效", () => {
  const unknown = validState();
  unknown.completed = ["lesson-3"];
  assert.throws(
    () => parseStoredProgress(JSON.stringify(unknown), lessonIds),
    /completed/,
  );

  const duplicate = validState();
  duplicate.completed = ["lesson-1", "lesson-1"];
  assert.throws(
    () => parseStoredProgress(JSON.stringify(duplicate), lessonIds),
    /completed/,
  );
});

test("drafts 只接受已知关卡的字符串代码", () => {
  const nonString = validState();
  nonString.drafts = { "lesson-1": 123 };
  assert.throws(
    () => parseStoredProgress(JSON.stringify(nonString), lessonIds),
    /drafts/,
  );

  const unknown = validState();
  unknown.drafts = { "lesson-3": "print('x')" };
  assert.throws(
    () => parseStoredProgress(JSON.stringify(unknown), lessonIds),
    /drafts/,
  );
});

test("未知错题关卡或缺失使用字段使整份记录失效", () => {
  const unknownLesson = validState();
  unknownLesson.mistakes[0].lessonId = "lesson-3";
  assert.throws(
    () => parseStoredProgress(JSON.stringify(unknownLesson), lessonIds),
    /mistakes/,
  );

  const missingCode = validState();
  delete missingCode.mistakes[0].code;
  assert.throws(
    () => parseStoredProgress(JSON.stringify(missingCode), lessonIds),
    /mistakes/,
  );
});

test("异常与测试结果必须满足页面实际使用的类型", () => {
  const badException = validState();
  badException.mistakes[0].exception.line = "1";
  assert.throws(
    () => parseStoredProgress(JSON.stringify(badException), lessonIds),
    /mistakes/,
  );

  const badTest = validState();
  badTest.mistakes[0].tests = [
    { name: "结果", passed: "yes", detail: "wrong type" },
  ];
  assert.throws(
    () => parseStoredProgress(JSON.stringify(badTest), lessonIds),
    /mistakes/,
  );

  const badFeedback = validState();
  badFeedback.mistakes[0].tests = [
    {
      name: "输出",
      passed: false,
      detail: "不匹配",
      expected: 56,
      actual: "54",
      rule: "允许交换乘数",
    },
  ];
  assert.throws(
    () => parseStoredProgress(JSON.stringify(badFeedback), lessonIds),
    /mistakes/,
  );
});

test("无效 JSON 明确抛错，不返回部分默认值", () => {
  assert.throws(() => parseStoredProgress("{broken", lessonIds), SyntaxError);
});
