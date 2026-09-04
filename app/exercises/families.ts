import type { ExerciseFamily, ExerciseVariant, PersonalizedCheck } from "./schema.ts";

function variant(label: string, values: string, checks: PersonalizedCheck[]): ExerciseVariant {
  return { label, values, checks };
}

const loops = [
  ["输入 [14, 3, 8, 11]", "[14, 3, 8, 11]", 22], ["输入 [5, 12, 17, 20]", "[5, 12, 17, 20]", 32], ["输入 [-4, 7, 0, 9]", "[-4, 7, 0, 9]", -4],
  ["输入 [2, 15, 18, -3]", "[2, 15, 18, -3]", 20], ["输入 [21, 6, 0, -8]", "[21, 6, 0, -8]", -2], ["输入 [13, 16, 19, 22]", "[13, 16, 19, 22]", 38],
] as const;
const lists = [
  ["输入 [41, 60, 99]", "[41, 60, 99]", "[65, 100]"], ["输入 [58, 76, 101]", "[58, 76, 101]", "[81, 100]"], ["输入 [0, 64, 97]", "[0, 64, 97]", "[69, 100]"],
  ["输入 [12, 55, 88]", "[12, 55, 88]", "[93]"], ["输入 [67, 3, 104]", "[67, 3, 104]", "[72, 100]"], ["输入 [25, 72, 96]", "[25, 72, 96]", "[77, 100]"],
] as const;
const dictionaries = [
  ["输入 ['go', 'py', 'go', 'rs']", "['go', 'py', 'go', 'rs']", '{"go": 2, "py": 1, "rs": 1}'], ["输入 ['js', 'ts', 'js', 'go', 'ts']", "['js', 'ts', 'js', 'go', 'ts']", '{"js": 2, "ts": 2, "go": 1}'], ["输入 ['rust', 'go', 'rust']", "['rust', 'go', 'rust']", '{"rust": 2, "go": 1}'],
  ["输入 ['java', 'kotlin', 'java', 'zig']", "['java', 'kotlin', 'java', 'zig']", '{"java": 2, "kotlin": 1, "zig": 1}'], ["输入 ['elixir', 'go', 'elixir']", "['elixir', 'go', 'elixir']", '{"elixir": 2, "go": 1}'], ["输入 ['swift', 'dart', 'swift', 'lua']", "['swift', 'dart', 'swift', 'lua']", '{"swift": 2, "dart": 1, "lua": 1}'],
] as const;
const exceptions = [["文本 '42'", "'42'", "42"], ["文本 'oops'", "'oops'", "None"], ["文本 '3.5'", "'3.5'", "None"], ["文本 '-7'", "'-7'", "-7"], ["文本 '100'", "'100'", "100"], ["文本 '1e2'", "'1e2'", "None"]] as const;
const expenses = [
  ["记录 food=12、travel=30", "food=12, travel=30", '{"total": 42, "by_category": {"food": 12, "travel": 30}}'], ["记录 books=18、food=9", "books=18, food=9", '{"total": 27, "by_category": {"books": 18, "food": 9}}'], ["记录 travel=7、tools=25", "travel=7, tools=25", '{"total": 32, "by_category": {"travel": 7, "tools": 25}}'],
  ["记录 rent=40、music=6", "rent=40, music=6", '{"total": 46, "by_category": {"rent": 40, "music": 6}}'], ["记录 taxi=11、books=13", "taxi=11, books=13", '{"total": 24, "by_category": {"taxi": 11, "books": 13}}'], ["记录 coffee=5、hardware=27", "coffee=5, hardware=27", '{"total": 32, "by_category": {"coffee": 5, "hardware": 27}}'],
] as const;
const output = [["计算 9 * 6", "9 * 6", 54], ["计算 11 * 5", "11 * 5", 55], ["计算 12 * 4", "12 * 4", 48], ["计算 13 * 7", "13 * 7", 91], ["计算 15 * 8", "15 * 8", 120], ["计算 17 * 3", "17 * 3", 51]] as const;
const reranking = [
  ["候选 a/b，取 2", "2", "b,a"], ["候选 x/y，取 1", "1", "y"], ["候选 p/q，取 2", "2", "p,q"],
  ["候选 m/n，取 1", "1", "m"], ["候选 r/s，取 2", "2", "s,r"], ["候选 u/v，取 1", "1", "v"],
] as const;
const humanReview = ["send_report", "publish_note", "delete_record", "export_data", "reset_access", "merge_branch"] as const;
const citationCases = [
  ["退款政策", "policy.md", "30 天"], ["部署手册", "deploy.md", "先运行测试"], ["安全规范", "security.md", "最小权限"],
  ["数据字典", "schema.md", "字段必须有类型"], ["服务协议", "service.md", "超时返回错误"], ["审核流程", "review.md", "拒绝会停止"],
] as const;
const retrievalCases = [
  ["退款", 1, "policy.md"], ["部署", 1, "deploy.md"], ["权限", 2, "security.md"],
  ["字段", 1, "schema.md"], ["超时", 2, "service.md"], ["审核", 1, "review.md"],
] as const;
const routingCases = [
  [0.9, 0, "finish"], [0.4, 1, "revise"], [0.7, 2, "finish"],
  [0.8, 0, "finish"], [0.2, 2, "finish"], [0.1, 1, "revise"],
] as const;
const checkpointCases = [
  ["thread-a", 1, 2], ["thread-b", 3, 4], ["research-1", 0, 1],
  ["review-2", 7, 8], ["chat-x", 2, 5], ["job-9", 10, 11],
] as const;
const hybridCases = [
  ["policy.md", 0.8, 0.7, "ok"], ["deploy.md", 0.7, 0.6, "ok"], ["security.md", 0.9, 0.85, "ok"],
  ["schema.md", 0.6, 0.7, "no_results"], ["service.md", 0.75, 0.8, "no_results"], ["review.md", 0.5, 0.6, "no_results"],
] as const;
const structuredCases = [
  ["答案", 0.9, "ok"], ["摘要", 0.6, "ok"], ["结论", 1, "ok"],
  ["警告", -0.1, "invalid"], ["证据", 1.1, "invalid"], ["说明", "high", "invalid"],
] as const;
const storeCases = [
  ["u-1", "dark"], ["u-2", "zh-CN"], ["researcher", "python"],
  ["reviewer", "graph"], ["u-5", "beginner"], ["guest", "en"],
] as const;
const interruptCases = [
  ["send_report", "approve"], ["publish_note", "reject"], ["delete_record", "approve"],
  ["export_data", "reject"], ["reset_access", "approve"], ["merge_branch", "reject"],
] as const;
const evaluationCases = [
  ["a.md", ["a.md"], ["a.md"], 1], ["b.md", ["b.md", "c.md"], ["b.md"], 0.5],
  ["c.md", ["x.md"], [], 0], ["d.md", ["x.md"], ["x.md"], 0],
  ["e.md", ["e.md", "f.md"], ["e.md", "f.md"], 1], ["g.md", [], [], 0],
] as const;
const toolRegistryCases = [
  ["weather", "成都"], ["search", "RAG"], ["calendar", "周五"],
  ["currency", "CNY"], ["status", "ready"], ["lookup", "LangGraph"],
] as const;
const actionCases = [
  ["weather", "成都"], ["search", "RAG"], ["calendar", "周五"],
  ["Finish", "已完成"], ["lookup", "LangGraph"], ["summarize", "资料"],
] as const;
const walletCases = [
  ["5, 7", 12], ["1, 20", 21], ["12, 3", 15],
  ["100, 25", 125], ["8, 8", 16], ["2, 4", 6],
] as const;

const twoBehaviorChecks = (first: string, second: string, failure: string): PersonalizedCheck[] => [
  { name: "变体行为", expression: first, failure, kind: "behavior" },
  { name: "边界行为", expression: second, failure: "还应处理空输入或未出现过的边界。", kind: "behavior" },
];

export const exerciseFamilies: ExerciseFamily[] = [
  {
    id: "python-output-v1", lessonIds: ["first-output"], difficulty: "beginner", validatorVersion: "1",
    mistakeCodes: ["wrong-line", "missing-expression"], constraints: ["two output lines", "second print contains multiplication"],
    variants: output.map(([label, expression, expected]) => variant(label, expression, twoBehaviorChecks(`len(_output_lines) == 2 and _output_lines[1].strip() == "${expected}"`, "_second_print_uses_multiplication(_source)", "第二行应输出本变体乘法结果，并保留直接乘法表达式。"))),
  },
  {
    id: "python-loops-v1", lessonIds: ["loops"], difficulty: "beginner", validatorVersion: "1",
    mistakeCodes: ["missing-loop", "wrong-boundary"], constraints: ["sum even values", "one loop in target function"],
    variants: loops.map(([label, values, expected]) => variant(label, values, twoBehaviorChecks(`sum_even(${values}) == ${expected}`, "sum_even([]) == 0", "应只累加本变体输入中的偶数。"))),
  },
  {
    id: "python-lists-v1", lessonIds: ["lists"], difficulty: "beginner", validatorVersion: "1",
    mistakeCodes: ["wrong-filter", "wrong-cap"], constraints: ["return a transformed list", "preserve input order"],
    variants: lists.map(([label, values, expected]) => variant(label, values, twoBehaviorChecks(`improve_scores(${values}) == ${expected}`, "improve_scores([]) == []", "应筛选、加分并封顶本变体列表。"))),
  },
  {
    id: "python-dictionaries-v1", lessonIds: ["dictionaries"], difficulty: "beginner", validatorVersion: "1",
    mistakeCodes: ["hard-coded-key", "wrong-count"], constraints: ["count every input key", "support unseen keys"],
    variants: dictionaries.map(([label, values, expected]) => variant(label, values, twoBehaviorChecks(`word_counts(${values}) == ${expected}`, "word_counts([]) == {}", "应按传入键动态统计，不能写死键名。"))),
  },
  {
    id: "python-exceptions-v1", lessonIds: ["exceptions"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-handler", "swallowed-type-error"], constraints: ["catch ValueError only", "let TypeError escape"],
    variants: exceptions.map(([label, values, expected]) => variant(label, values, twoBehaviorChecks(`parse_age(${values}) == ${expected}`, "parse_age(' 27 ') == 27", "只能把无法转换的文本变为 None，有效整数应保留。"))),
  },
  {
    id: "python-decorators-v1", lessonIds: ["decorators"], difficulty: "advanced", validatorVersion: "1",
    mistakeCodes: ["lost-kwargs", "wrong-call-count"], constraints: ["preserve positional and keyword arguments", "call wrapped function twice"],
    variants: ["3, factor=4", "5, factor=2", "7, factor=3", "2, factor=9", "6, factor=5", "9, factor=2"].map((call) => variant(`调用 multiply(${call})`, call, twoBehaviorChecks("_decorator_contract(twice)", "_decorator_kwargs_probe(twice)", "应原样转发本变体的位置和关键字参数，并调用两次。"))),
  },
  {
    id: "python-expense-v1", lessonIds: ["project-expense"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["hard-coded-category", "extra-traversal"], constraints: ["aggregate arbitrary categories", "one loop in summarize"],
    variants: expenses.map(([label, values, expected]) => variant(label, values, twoBehaviorChecks(`summarize([${values.split(", ").map((item) => { const [category, amount] = item.split("="); return `{\"category\":\"${category}\",\"amount\":${amount}}`; }).join(", ")}]) == ${expected}`, 'summarize([]) == {"total": 0, "by_category": {}}', "应从本变体记录动态汇总总额和分类。"))),
  },
  {
    id: "python-wallet-v1", lessonIds: ["classes"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["shared-state", "accepted-non-positive-deposit"], constraints: ["keep balance per instance", "reject zero and negative deposits"],
    variants: walletCases.map(([label, expected]) => variant(`存入 ${label}`, label, twoBehaviorChecks(
      `((lambda wallet: (wallet.deposit(${label.split(", ").join("), wallet.deposit(")}), wallet.balance()))(Wallet()))[-1] == ${expected}`,
      `_raises_value_error(lambda: Wallet().deposit(-1)) and _raises_value_error(lambda: Wallet().deposit(0))`,
      "每个 Wallet 应独立累计余额，并拒绝零或负数存款。",
    ))),
  },
  {
    id: "langchain-reranking-v1", lessonIds: ["reranking"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-order", "wrong-top-k"], constraints: ["sort by rerank_score", "reject negative top_k"],
    variants: reranking.map(([label, topK, expected]) => variant(label, topK, twoBehaviorChecks(
      `[item["source"] for item in rerank([{"source":"a","rerank_score":0.2},{"source":"b","rerank_score":0.9}], ${topK})] == [${expected.split(",").map((item) => `"${item}"`).join(",")}]`,
      "_raises_value_error(lambda: rerank([], -1))",
      "应按重排分数排序并严格限制 top_k。",
    ))),
  },
  {
    id: "langgraph-human-review-v1", lessonIds: ["human-review-state"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-decision", "lost-review-action"], constraints: ["approve or reject explicitly", "preserve action in returned state"],
    variants: humanReview.map((action) => variant(`审核 ${action}`, action, twoBehaviorChecks(
      `resume_review({"action":"${action}"}, "approve") == {"status":"approved","action":"${action}"}`,
      `resume_review({"action":"${action}"}, "reject") == {"status":"cancelled","action":"${action}"}`,
      "审核结果必须保留原 action，并区分批准与拒绝。",
    ))),
  },
  {
    id: "langchain-citation-v1", lessonIds: ["citation-grounded-generation"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["invented-source", "missing-no-results"], constraints: ["sources come from retrieved documents", "empty context returns no_results"],
    variants: citationCases.map(([label, source, text]) => variant(label, source, twoBehaviorChecks(
      `grounded_answer("${label}", [{"text":"${text}","source":"${source}"}])["sources"] == ["${source}"]`,
      `grounded_answer("${label}", [])["status"] == "no_results"`,
      "回答只能引用真实检索来源；没有资料时必须明确返回 no_results。",
      ))),
  },
  {
    id: "langchain-retrieval-v1", lessonIds: ["retrieval-chain"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-retrieval", "wrong-top-k"], constraints: ["return matching documents", "respect top_k and empty results"],
    variants: retrievalCases.map(([query, topK, source]) => variant(`检索“${query}”`, `${query} / top_k=${topK}`, twoBehaviorChecks(
      `retrieve("${query}", [{"text":"${query} 说明", "source":"${source}"}, {"text":"其他资料", "source":"other.md"}], ${topK}) == [{"text":"${query} 说明", "source":"${source}"}]`,
      `retrieve("不存在", [{"text":"${query} 说明", "source":"${source}"}], ${topK}) == []`,
      "应只返回真实匹配文档，并遵守 top_k；无命中时返回空列表。",
    ))),
  },
  {
    id: "langgraph-routing-v1", lessonIds: ["state-reducers-routing"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-route", "missing-termination"], constraints: ["route by score", "stop at attempts limit"],
    variants: routingCases.map(([score, attempts, expected]) => variant(`score=${score} / attempts=${attempts}`, `${score}, ${attempts}`, twoBehaviorChecks(
      `route({"score": ${score}, "attempts": ${attempts}}) == "${expected}"`,
      `route({"score": 0.1, "attempts": 3}) == "finish"`,
      "路由应同时检查质量阈值和尝试上限，达到任一条件就结束。",
    ))),
  },
  {
    id: "langgraph-checkpoint-v1", lessonIds: ["checkpoint-configuration"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-thread", "mutated-checkpoint"], constraints: ["resume selected thread", "return copied state"],
    variants: checkpointCases.map(([threadId, oldStep, nextStep]) => variant(`${threadId}：${oldStep} → ${nextStep}`, `${threadId} / ${oldStep}`, twoBehaviorChecks(
      `resume({"${threadId}": {"step": ${oldStep}}}, "${threadId}", {"step": ${nextStep}}) == {"step": ${nextStep}}`,
      `((lambda saved: (resume(saved, "${threadId}", {}), saved))( {"${threadId}": {"step": ${oldStep}}} ))[1]["${threadId}"]["step"] == ${oldStep}`,
      "恢复必须读取指定 thread、返回更新后的副本，并保留原检查点不变。",
    ))),
  },
  {
    id: "langchain-hybrid-retrieval-v1", lessonIds: ["hybrid-retrieval"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-threshold", "duplicate-source"], constraints: ["deduplicate by source", "return no_results below threshold"],
    variants: hybridCases.map(([source, score, threshold, expected]) => variant(`${source} 阈值 ${threshold}`, `${source} / score=${score} / threshold=${threshold}`, twoBehaviorChecks(
      `merge_retrieval([{"source":"${source}","score":${score}}], [], ${threshold})["status"] == "${expected}"`,
      `merge_retrieval([], [], ${threshold}) == {"status": "no_results", "matches": []}`,
      "应按 source 去重、保留最高分，并在没有达到阈值时明确返回 no_results。",
    ))),
  },
  {
    id: "langchain-structured-output-v1", lessonIds: ["structured-output"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["missing-field", "invalid-confidence"], constraints: ["require summary and confidence", "confidence must be 0..1"],
    variants: structuredCases.map(([summary, confidence, expected]) => variant(`${summary} / confidence=${confidence}`, `${summary} / ${confidence}`, twoBehaviorChecks(
      `validate_answer({"summary":"${summary}","confidence":${typeof confidence === "string" ? `"${confidence}"` : confidence}}) == ${expected === "ok" ? "True" : "False"}`,
      `validate_answer({"summary":"${summary}"}) is False`,
      "结构化结果必须包含 summary 和 confidence，且 confidence 必须是 0 到 1 的数字。",
    ))),
  },
  {
    id: "langgraph-store-v1", lessonIds: ["long-term-store"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-namespace", "cross-user-memory"], constraints: ["scope by user_id", "return None for missing keys"],
    variants: storeCases.map(([userId, language]) => variant(`${userId} / ${language}`, `${userId} / ${language}`, twoBehaviorChecks(
      `read_store({("${userId}", "profile"): {"language": "${language}"}}, "${userId}", "language") == "${language}"`,
      `read_store({("${userId}", "profile"): {"language": "${language}"}}, "other-user", "language") is None`,
      "长期记忆必须按 user_id 隔离 namespace；缺失用户不能读取别人的资料。",
    ))),
  },
  {
    id: "langgraph-interrupt-v1", lessonIds: ["streaming-interrupts"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["ignored-rejection", "unknown-decision"], constraints: ["pause before side effects", "reject explicitly"],
    variants: interruptCases.map(([action, decision]) => variant(`${action} / ${decision}`, `${action} / ${decision}`, twoBehaviorChecks(
      `approve_email({"draft":"${action}","decision":"${decision}"}) == "${decision === "approve" ? "approved" : "cancelled"}"`,
      `_raises_value_error(lambda: approve_email({"draft":"${action}","decision":"later"}))`,
      "人工决定必须显式处理：批准继续、拒绝取消、未知决定失败。",
    ))),
  },
  {
    id: "langchain-rag-evaluation-v1", lessonIds: ["rag-evaluation"], difficulty: "intermediate", validatorVersion: "1",
    mistakeCodes: ["wrong-recall", "missing-citation"], constraints: ["compare retrieved sources", "measure citation coverage"],
    variants: evaluationCases.map(([source, retrieved, cited, recall]) => variant(`${source} 评估`, `${source} / recall=${recall}`, twoBehaviorChecks(
      `evaluate_retrieval(["${source}"], ${JSON.stringify(retrieved)}, ${JSON.stringify(cited)})["recall"] == ${recall}`,
      `evaluate_retrieval([], [], []) ["status"] == "no_results"`,
      "评估应根据真实来源集合计算召回和引用覆盖，并保留无资料状态。",
    ))),
  },
  {
    id: "python-tool-registry-v1", lessonIds: ["agent-tool-registry"], difficulty: "advanced", validatorVersion: "1",
    mistakeCodes: ["wrong-dispatch", "swallowed-tool-error"], constraints: ["forward keyword arguments", "reject duplicate or unknown tools"],
    variants: toolRegistryCases.map(([name, value]) => variant(`${name}(${value})`, `${name} / ${value}`, twoBehaviorChecks(
      `((lambda registry: (registry.register("${name}", lambda value: value), registry.execute("${name}", {"value": "${value}"}))[1])(ToolRegistry())) == "${value}"`,
      `_tool_registry_errors(ToolRegistry) == (True, True)`,
      "注册表必须把参数传给真实工具，并保留重复注册和未知工具错误。",
    ))),
  },
  {
    id: "python-action-parser-v1", lessonIds: ["agent-action-parser"], difficulty: "advanced", validatorVersion: "1",
    mistakeCodes: ["wrong-parse", "rewritten-payload"], constraints: ["preserve action payload", "reject malformed protocol"],
    variants: actionCases.map(([name, payload]) => variant(`${name}[${payload}]`, `${name} / ${payload}`, twoBehaviorChecks(
      `parse_action("  ${name}[${payload}]  ") == ("${name}", "${payload}")`,
      `parse_action("${name} ${payload}") == (None, None)`,
      "应保留动作名和 payload 原文，并拒绝缺少方括号的模糊格式。",
    ))),
  },
];

const familyIds = new Set<string>();
const lessonIds = new Set<string>();
for (const family of exerciseFamilies) {
  if (familyIds.has(family.id)) throw new Error(`重复练习 family ${family.id}`);
  familyIds.add(family.id);
  if (family.lessonIds.length !== 1) throw new Error(`练习 family 必须绑定一关 ${family.id}`);
  for (const lessonId of family.lessonIds) {
    if (lessonIds.has(lessonId)) throw new Error(`练习 family 重复绑定 ${lessonId}`);
    lessonIds.add(lessonId);
  }
  if (family.constraints.length === 0 || family.mistakeCodes.length === 0 || family.variants.length !== 6 || family.variants.some((item) => item.checks.length < 2)) {
    throw new Error(`练习 family 缺少约束、变体或测试 ${family.id}`);
  }
}
