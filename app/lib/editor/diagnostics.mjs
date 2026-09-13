const GUIDANCE = {
  SyntaxError: ["Python 无法按语法规则解析代码。", "查看标出行及上一行，检查冒号、括号、引号是否完整，再运行。"],
  IndentationError: ["代码块的缩进不符合 Python 的层级规则。", "检查标出行与同一代码块的语句是否对齐，避免混用制表符和空格。"],
  NameError: ["当前作用域中找不到使用的名字。", "对照原始消息核对拼写，确认该变量在使用前已定义且定义分支已执行。"],
  TypeError: ["操作或函数调用收到不兼容的类型或参数。", "检查 traceback 最后一次调用，打印相关值的 type() 并核对函数参数。"],
  ValueError: ["值的类型可接受，但内容不符合操作要求。", "对照原始消息检查实际输入值，用一个符合要求的小样例再次调用。"],
  IndexError: ["序列索引超出当前范围。", "检查 len(序列) 与实际索引；非负索引应小于序列长度。"],
  KeyError: ["映射中没有所访问的键。", "检查实际键集合及键名拼写；只有业务允许缺失时再处理缺失分支。"],
  AttributeError: ["对象没有请求的属性或方法。", "检查对象的实际类型与属性拼写；确认它不是意外得到的 None。"],
  ZeroDivisionError: ["除数为零，当前除法无法完成。", "检查除数的来源，用零输入复现并按题目契约处理该边界。"],
};

export function runtimeDiagnostic(exception) {
  if (exception === null) return null;
  const guidance = GUIDANCE[exception.type];
  return {
    ...exception,
    source: "runtime",
    severity: "error",
    reason: guidance ? guidance[0] : "已收到真实异常，但未能定位更多根因。",
    nextStep: guidance ? guidance[1] : "展开原始 traceback，检查最后一个学习者调用位置；信息不足时保留原文求助。",
  };
}
