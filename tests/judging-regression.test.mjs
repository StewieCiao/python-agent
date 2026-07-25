import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { loadPyodide } from "pyodide";
import { lessons } from "../app/lib/curriculum.ts";

const workerSource = await readFile(
  new URL("../public/python-worker.js", import.meta.url),
  "utf8",
);
const harnessMatch = workerSource.match(
  /const PYTHON_HARNESS = String\.raw`([\s\S]*?)`;/,
);
assert.ok(harnessMatch, "应能读取 Worker 使用的真实 Python harness");

const runtime = await loadPyodide();
const lessonById = new Map(lessons.map((lesson) => [lesson.id, lesson]));

async function execute(lessonId, code) {
  const lesson = lessonById.get(lessonId);
  assert.ok(lesson, `未知关卡：${lessonId}`);
  runtime.globals.set("__learner_code", code);
  runtime.globals.set("__lesson_tests_json", JSON.stringify(lesson.tests));
  return JSON.parse(await runtime.runPythonAsync(harnessMatch[1]));
}

function passed(result) {
  return result.tests.map((item) => item.passed);
}

test("每项判题都提供分类、实际值来源、期望与规则", () => {
  for (const lesson of lessons) {
    for (const lessonTest of lesson.tests) {
      assert.ok(lessonTest.feedback, `${lesson.id}/${lessonTest.name} 缺少反馈`);
      assert.equal(typeof lessonTest.feedback.expected, "string");
      assert.equal(typeof lessonTest.feedback.rule, "string");
      assert.ok(
        "actualLine" in lessonTest.feedback ||
          "actualExpression" in lessonTest.feedback,
        `${lesson.id}/${lessonTest.name} 缺少实际值来源`,
      );
      assert.ok(
        lessonTest.kind === undefined ||
          lessonTest.kind === "behavior" ||
          lessonTest.kind === "structure",
      );
    }
  }
});

test("第一关只接受第二个 print 自身的乘法表达式", async () => {
  const valid = await execute(
    "first-output",
    'print("我的第一段 Python")\nprint(7 * 8)\n',
  );
  assert.deepEqual(passed(valid), [true, true, true]);

  const unrelated = await execute(
    "first-output",
    'print("我的第一段Python")\nprint(56)\ndummy = 1 * 1\n',
  );
  assert.equal(unrelated.tests[1].passed, true);
  assert.equal(unrelated.tests[1].actual, "56");
  assert.equal(unrelated.tests[1].kind, "behavior");
  assert.equal(unrelated.tests[2].passed, false);
  assert.equal(unrelated.tests[2].kind, "structure");
  assert.match(unrelated.tests[2].rule, /第二个 print/);
});

test("第一关保留前导空行，不重排真实输出行号", async () => {
  const result = await execute(
    "first-output",
    'print()\nprint("我的第一段 Python")\nprint(8 * 7)\n',
  );
  assert.deepEqual(passed(result), [false, false, false]);
  assert.equal(result.tests[0].actual, "（空行）");
  assert.equal(result.tests[1].actual, "我的第一段 Python");
});

const pseudoPasses = [
  {
    lessonId: "loops",
    code: "total = 18\n# for placeholder\n",
    failedTest: "使用 for 循环",
  },
  {
    lessonId: "lists",
    code: "improved = [65, 82, 100]\n# [ for placeholder\n",
    failedTest: "使用列表推导式",
  },
  {
    lessonId: "dictionaries",
    code: 'counts = {"py": 3, "go": 2, "js": 1}\n',
    failedTest: "统计未见过的单词",
  },
  {
    lessonId: "exceptions",
    code: [
      "def parse_age(text):",
      '    if text == "18":',
      "        return 18",
      "    return None",
      "# except ValueError",
    ].join("\n"),
    failedTest: "只捕获 ValueError",
  },
  {
    lessonId: "decorators",
    code: [
      "def twice(func):",
      "    def wrapper(*args):",
      "        func(*args)",
      "        return func(*args)",
      "    return wrapper",
      "# **kwargs",
    ].join("\n"),
    failedTest: "调用两次并返回第二次结果",
  },
  {
    lessonId: "project-expense",
    code: [
      "def summarize(records):",
      "    if list(records):",
      '        return {"total": 60, "by_category": {"餐饮": 48, "交通": 12}}',
      '    return {"total": 0, "by_category": {}}',
      "# for placeholder",
    ].join("\n"),
    failedTest: "使用一个 for 循环",
  },
];

for (const scenario of pseudoPasses) {
  test(`${scenario.lessonId} 的注释或写死样例不能伪通过`, async () => {
    const result = await execute(scenario.lessonId, scenario.code);
    const target = result.tests.find((item) => item.name === scenario.failedTest);
    assert.ok(target, `应包含测试：${scenario.failedTest}`);
    assert.equal(target.passed, false);
  });
}

test("嵌套 dummy 中的教学构造不能冒充目标函数实现", async () => {
  const hardcodedLoop = await execute(
    "loops",
    [
      "def sum_even(numbers):",
      "    def nested():",
      "        for item in []:",
      "            pass",
      "    return 8",
    ].join("\n"),
  );
  assert.equal(
    hardcodedLoop.tests.find((item) => item.name === "使用 for 循环")?.passed,
    false,
  );

  const loopResult = await execute(
    "loops",
    [
      "def sum_even(numbers):",
      "    def dummy():",
      "        for item in []:",
      "            pass",
      "    return sum(number for number in numbers if number % 2 == 0)",
    ].join("\n"),
  );
  assert.deepEqual(passed(loopResult), [true, true, false]);

  const listResult = await execute(
    "lists",
    [
      "def improve_scores(scores):",
      "    def dummy():",
      "        return [item for item in []]",
      "    return list(map(lambda score: min(score + 5, 100), filter(lambda score: score >= 60, scores)))",
    ].join("\n"),
  );
  assert.deepEqual(passed(listResult), [true, true, false]);
});

test("消费汇总的一个 for 不能再叠加额外推导式", async () => {
  const result = await execute(
    "project-expense",
    [
      "def summarize(records):",
      "    total = 0",
      "    grouped = {}",
      "    for record in records:",
      '        grouped[record["category"]] = grouped.get(record["category"], 0) + record["amount"]',
      '    total = sum([record["amount"] for record in records])',
      '    return {"total": total, "by_category": grouped}',
    ].join("\n"),
  );
  assert.deepEqual(passed(result), [true, true, false]);
  assert.equal(result.tests[2].actual, "(1, 0, 1)");
});

test("shipping_fee 调用期间的 print 会被真实捕获并判失败", async () => {
  const result = await execute(
    "functions",
    [
      "def shipping_fee(price, member):",
      '    print("不应输出")',
      "    return 0 if member or price >= 99 else 10",
    ].join("\n"),
  );
  assert.deepEqual(passed(result), [false, false, false]);
  assert.match(result.tests[0].actual, /不应输出/);
  assert.equal(result.output, "");
});

test("Wallet 必须同时拒绝零和负数", async () => {
  const result = await execute(
    "classes",
    [
      "class Wallet:",
      "    def __init__(self):",
      "        self.balance = 0",
      "    def deposit(self, amount):",
      "        if amount == 0:",
      '            raise ValueError("invalid")',
      "        self.balance += amount",
      "        return self.balance",
    ].join("\n"),
  );
  assert.deepEqual(passed(result), [true, true, false]);
  assert.match(result.tests[2].rule, /amount <= 0/);
});

test("plan 必须同时拒绝 0 和 6", async () => {
  const result = await execute(
    "project-tasks",
    [
      "def plan(tasks):",
      "    for task in tasks:",
      '        if task["priority"] == 0:',
      '            raise ValueError("invalid")',
      '    return [task["name"] for task in sorted(tasks, key=lambda item: (-item["priority"], item["name"]))]',
    ].join("\n"),
  );
  const boundaryTest = result.tests.find(
    (item) => item.name === "拒绝优先级下界和上界",
  );
  assert.equal(boundaryTest?.passed, false);
});

const validAlternatives = [
  {
    lessonId: "strings",
    code: [
      "def normalize_title(text):",
      "    return text.strip().lower()",
    ].join("\n"),
  },
  {
    lessonId: "branches",
    code: [
      "def grade(score):",
      "    if score < 60:",
      '        return "C"',
      "    if score < 90:",
      '        return "B"',
      '    return "A"',
    ].join("\n"),
  },
  {
    lessonId: "loops",
    code: [
      "def sum_even(numbers):",
      "    total = 0",
      "    for number in numbers:",
      "        if number % 2 == 0:",
      "            total += number",
      "    return total",
    ].join("\n"),
  },
  {
    lessonId: "functions",
    code: [
      "def shipping_fee(price, member):",
      "    return 0 if member or price >= 99 else 10",
    ].join("\n"),
  },
  {
    lessonId: "lists",
    code: [
      "def improve_scores(scores):",
      "    return [min(score + 5, 100) for score in scores if score >= 60]",
    ].join("\n"),
  },
  {
    lessonId: "dictionaries",
    code: [
      "def word_counts(words):",
      "    result = {}",
      "    for word in words:",
      "        result[word] = result.get(word, 0) + 1",
      "    return result",
    ].join("\n"),
  },
  {
    lessonId: "exceptions",
    code: [
      "def parse_age(text):",
      "    try:",
      "        return int(text)",
      "    except (ValueError) as err:",
      "        return None",
    ].join("\n"),
  },
  {
    lessonId: "classes",
    code: [
      "class Wallet:",
      "    def __init__(self):",
      "        self.balance = 0",
      "    def deposit(self, amount):",
      "        if amount <= 0:",
      '            raise ValueError("amount must be positive")',
      "        self.balance += amount",
      "        return self.balance",
    ].join("\n"),
  },
  {
    lessonId: "generators",
    code: [
      "def even_numbers(limit):",
      "    # 这只是无关注释：return [",
      "    for number in range(0, limit + 1, 2):",
      "        yield number",
    ].join("\n"),
  },
  {
    lessonId: "decorators",
    code: [
      "def twice(func):",
      "    def wrapper(*positional, **named):",
      "        func(*positional, **named)",
      "        return func(*positional, **named)",
      "    return wrapper",
    ].join("\n"),
  },
  {
    lessonId: "project-text",
    code: [
      "def analyze(text):",
      "    words = text.lower().split()",
      "    counts = {}",
      "    for word in words:",
      "        counts[word] = counts.get(word, 0) + 1",
      '    return {"words": len(words), "unique": len(counts), "top": max(counts, key=counts.get) if counts else None}',
    ].join("\n"),
  },
  {
    lessonId: "project-expense",
    code: [
      "def summarize(records):",
      "    total = 0",
      "    grouped = {}",
      "    for record in records:",
      '        total += record["amount"]',
      '        category = record["category"]',
      '        grouped[category] = grouped.get(category, 0) + record["amount"]',
      '    return {"total": total, "by_category": grouped}',
    ].join("\n"),
  },
  {
    lessonId: "project-tasks",
    code: [
      "def plan(tasks):",
      "    for task in tasks:",
      '        if task["priority"] not in range(1, 6):',
      '            raise ValueError("priority must be 1-5")',
      '    ordered = sorted(tasks, key=lambda task: (-task["priority"], task["name"]))',
      '    return [task["name"] for task in ordered]',
    ].join("\n"),
  },
];

for (const scenario of validAlternatives) {
  test(`${scenario.lessonId} 的正确替代写法全部通过`, async () => {
    const result = await execute(scenario.lessonId, scenario.code);
    assert.equal(result.exception, null);
    assert.deepEqual(
      passed(result),
      result.tests.map(() => true),
      result.tests.map((item) => item.detail).filter(Boolean).join("\n"),
    );
  });
}
