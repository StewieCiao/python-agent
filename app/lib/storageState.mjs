function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isValidException(value) {
  return (
    value === null ||
    (isRecord(value) &&
      typeof value.type === "string" &&
      typeof value.message === "string" &&
      typeof value.traceback === "string" &&
      (value.line === null || typeof value.line === "number"))
  );
}

function isValidTest(value) {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.passed === "boolean" &&
    typeof value.detail === "string"
  );
}

function isValidMistake(value, knownIds) {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    knownIds.has(value.lessonId) &&
    typeof value.code === "string" &&
    typeof value.output === "string" &&
    typeof value.stderr === "string" &&
    typeof value.createdAt === "string" &&
    !Number.isNaN(Date.parse(value.createdAt)) &&
    isValidException(value.exception) &&
    Array.isArray(value.tests) &&
    value.tests.every(isValidTest)
  );
}

export function parseStoredProgress(raw, lessonIds) {
  const knownIds = new Set(lessonIds);
  const value = JSON.parse(raw);
  if (!isRecord(value)) throw new Error("保存内容不是对象");
  if (!Array.isArray(value.completed)) throw new Error("completed 不是数组");
  if (
    value.completed.some((id) => typeof id !== "string" || !knownIds.has(id)) ||
    new Set(value.completed).size !== value.completed.length
  ) {
    throw new Error("completed 含未知或重复关卡");
  }
  if (!isRecord(value.drafts)) throw new Error("drafts 不是对象");
  if (
    Object.entries(value.drafts).some(
      ([id, code]) => !knownIds.has(id) || typeof code !== "string",
    )
  ) {
    throw new Error("drafts 含未知关卡或非文本代码");
  }
  if (
    !Array.isArray(value.mistakes) ||
    !value.mistakes.every((mistake) => isValidMistake(mistake, knownIds))
  ) {
    throw new Error("mistakes 结构无效");
  }
  return value;
}
