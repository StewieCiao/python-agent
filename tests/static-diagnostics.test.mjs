import test from "node:test";
import assert from "node:assert/strict";
import { staticDiagnostics } from "../app/lib/editor/staticDiagnostics.mjs";

test("静态检查定位缺冒号、引号、括号和代码块问题但不冒充执行结果", () => {
  for (const [source, clue] of [
    ["if True\n    pass", "冒号"],
    ['print("hello)', "引号"],
    ["print(1", "括号"],
    ["if True:\npass", "缩进"],
  ]) {
    const results = staticDiagnostics(source);
    assert.equal(results.length, 1);
    assert.equal(results[0].source, "static");
    assert.equal(results[0].severity, "warning");
    assert.match(results[0].nextStep, new RegExp(clue));
    assert.ok(results[0].line >= 1);
    assert.ok(results[0].column >= 1);
  }
});

test("合法函数引用、嵌套函数、注释、字符串、多行表达式不产生静态误报", () => {
  for (const source of [
    "def f(x):\n    return x\nreference = f",
    "def outer():\n    def inner():\n        return 1\n    return inner",
    '# if no colon\ntext = "print( and return"',
    'text = """中文\nif : (\n"""',
    "total = (1 +\n    2)",
    "callback = text.strip", "", "value = missing_name",
  ]) assert.deepEqual(staticDiagnostics(source), [], source);
});
