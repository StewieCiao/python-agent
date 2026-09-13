import test from "node:test";
import assert from "node:assert/strict";
import { runtimeDiagnostic } from "../app/lib/editor/diagnostics.mjs";

test("真实异常保留原文和位置，并按异常类型提供中文原因与可执行建议", () => {
  for (const [type, concept] of [
    ["SyntaxError", "语法"], ["IndentationError", "缩进"],
    ["NameError", "名字"], ["TypeError", "类型"], ["ValueError", "值"],
    ["IndexError", "索引"], ["KeyError", "键"], ["AttributeError", "属性"],
    ["ZeroDivisionError", "除数"],
  ]) {
    const exception = { type, line: 3, message: "原始消息 <>&\n", traceback: "  原始 traceback\n" };
    const diagnostic = runtimeDiagnostic(exception);
    assert.equal(diagnostic.source, "runtime");
    assert.equal(diagnostic.severity, "error");
    assert.equal(diagnostic.line, 3);
    assert.match(diagnostic.reason, new RegExp(concept));
    assert.ok(diagnostic.nextStep.length > 10);
    assert.equal(diagnostic.message, exception.message);
    assert.equal(diagnostic.traceback, exception.traceback);
  }
});

test("没有 Python 异常时不伪造诊断，未知异常不猜测根因或行号", () => {
  assert.equal(runtimeDiagnostic(null), null);
  const diagnostic = runtimeDiagnostic({ type: "CustomError", line: null, message: "未知", traceback: "原文" });
  assert.equal(diagnostic.line, null);
  assert.match(diagnostic.reason, /未能定位/);
  assert.equal(diagnostic.type, "CustomError");
});
