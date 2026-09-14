import { parser } from "@lezer/python";

export function staticDiagnostics(source) {
  const tree = parser.parse(source);
  let firstError = null;
  tree.iterate({ enter(node) {
    if (node.type.isError && firstError === null) firstError = node.node;
  } });
  if (firstError === null) return [];

  const ancestors = [];
  for (let node = firstError.parent; node; node = node.parent) ancestors.push(node.name);
  let nextStep = "查看标出位置及上一行，检查语法结构；此提示不代表 Python 运行时的确定诊断。";
  if (ancestors.includes("String")) {
    nextStep = "检查字符串的开始与结束引号，以及反斜杠转义；三引号也需要成对。";
  } else if (ancestors.some((name) => ["ArgList", "ParamList", "ParenthesizedExpression", "ArrayExpression", "DictionaryExpression"].includes(name))) {
    nextStep = "检查该表达式的括号配对、逗号和参数是否完整。";
  } else if (ancestors[0] === "Body") {
    nextStep = "检查冒号后代码块的缩进与内容；同一层级应对齐，空块可使用 pass。";
  } else if (ancestors.some((name) => ["IfStatement", "ForStatement", "WhileStatement", "FunctionDefinition", "ClassDefinition"].includes(name))) {
    nextStep = "检查语句头是否完整，并在代码块开始前写冒号。";
  }
  const before = source.slice(0, firstError.from);
  return [{
    source: "static", severity: "warning",
    line: before.split("\n").length,
    column: firstError.from - before.lastIndexOf("\n"),
    reason: "语法解析器在此处未能识别完整结构；位置可能是问题暴露处，而非根因。",
    nextStep,
  }];
}
