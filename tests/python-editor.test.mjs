import test from "node:test";
import assert from "node:assert/strict";
import { highlightPython } from "../app/lib/editor/pythonHighlight.mjs";

test("Python 高亮区分关键字、字符串、数字、注释、函数和属性", () => {
  const html = highlightPython('if "text".strip():\n    print(row.name, 42)  # note');
  assert.match(html, /token-keyword.*if/);
  assert.match(html, /token-string.*text/);
  assert.match(html, /token-function.*print/);
  assert.match(html, /token-attribute.*strip/);
  assert.match(html, /token-attribute.*name/);
  assert.match(html, /token-number.*42/);
  assert.match(html, /token-comment.*# note/);
});

test("高亮不会解析字符串、注释或 HTML 特殊字符中的伪代码", () => {
  const html = highlightPython('text = "if Row.value: # fake <tag>"\n# graph.compile()');
  assert.equal((html.match(/token-keyword/g) ?? []).length, 0);
  assert.equal((html.match(/token-function/g) ?? []).length, 0);
  assert.match(html, /&lt;tag&gt;/);
  assert.match(html, /token-string/);
  assert.match(html, /token-comment/);
});

test("高亮支持三引号、中文和未完成代码，并保持原文可见", () => {
  const source = '说明 = "中文"\nmessage = """未完成\n中文内容';
  const html = highlightPython(source);
  assert.match(html, /token-string/);
  assert.match(html, /中文内容/);
  assert.doesNotThrow(() => highlightPython("def f(:"));
});
