import type { LearningLesson } from "../authoring/types.ts";

export const langchainHints: Record<string, [string, string, string]> = {
  "memory-modernization": ["先区分消息历史、thread 状态和 Store。", "为每类记忆写出生命周期和作用域。", "用两个 thread 与一个 user 偏好验证隔离。"],
  "document-loaders": ["先确认 loader 返回 Document。", "检查 page_content 与 metadata。", "用不同文件类型复查来源和页码。"],
  "indexing-vector-store": ["先切分并保留每个 chunk 的来源。", "再计算 embedding 并写入向量库。", "用题目之外的问题检查召回结果。"],
  "retrieval-chain": ["先单独运行 retriever。", "把 context 和 question 分开传入。", "空召回时保留资料不足状态。"],
  "rag-project": ["先画出离线索引和在线问答两条流程。", "为每一步记录真实输入输出。", "分别测试重复索引、无命中和模型失败。"],
  "agent-v1": ["先定义工具参数和返回结构。", "观察每次 tool call 与 observation。", "为循环和权限设置明确上限。"],
  "agent-rag-project": ["先独立验证检索工具。", "再连接 create_agent 和中间件。", "检查回答是否只引用真实来源。"],
  "model-messages-prompts": ["区分消息角色", "声明模板变量", "检查渲染结果"],
  "model-configuration": ["先列出模型配置字段", "分别验证类型和边界", "用缺失 model 与无效 timeout 回归"],
  "structured-output": ["先写出结构", "保留真实错误", "用边界输入验证"],
  "runnable-pipeline": ["先写出结构", "保留真实错误", "用边界输入验证"],
};

export const langchainChecks: Record<string, NonNullable<LearningLesson["browserChecks"]>> = {
  "memory-modernization": [
    { name: "线程隔离", expression: "memory_terms[\"checkpointer\"] != memory_terms[\"store\"]", failure: "短期线程状态和长期 Store 应明确区分。", kind: "behavior" },
    { name: "持久化历史", expression: "memory_terms[\"json_history\"] != \"\"", failure: "应说明 JSON 记录解决的是消息历史持久化。", kind: "structure" },
  ],
  "document-loaders": [
    { name: "保留来源", expression: "documents and all(\"source\" in document.metadata for document in documents)", failure: "每个文档都应保留 source metadata。", kind: "behavior" },
    { name: "正文非空", expression: "all(document.page_content.strip() for document in documents)", failure: "加载结果不应包含空正文。", kind: "behavior" },
  ],
  "indexing-vector-store": [
    { name: "向量对应", expression: "len(documents) == len(vectors)", failure: "文档与向量必须一一对应。", kind: "behavior" },
    { name: "可追溯元数据", expression: "all(\"source\" in document.metadata for document in documents)", failure: "索引记录必须保留来源。", kind: "structure" },
  ],
  "retrieval-chain": [
    { name: "返回候选", expression: "isinstance(retrieved, list)", failure: "检索步骤应返回候选列表。", kind: "behavior" },
    { name: "限制数量", expression: "len(retrieved) <= top_k", failure: "检索结果不应超过 top_k。", kind: "behavior" },
  ],
  "rag-project": [
    { name: "引用来源", expression: "answer.sources and all(source for source in answer.sources)", failure: "项目回答应带有真实来源。", kind: "behavior" },
    { name: "无资料边界", expression: "no_match.answer == \"资料不足\" and no_match.sources == []", failure: "无命中时应停止生成并明确资料不足。", kind: "behavior" },
  ],
  "agent-v1": [
    { name: "工具输入", expression: "tool_call[\"name\"] and isinstance(tool_call[\"arguments\"], dict)", failure: "工具调用应包含名称和字典参数。", kind: "structure" },
    { name: "真实错误", expression: "tool_error is not None or tool_result is not None", failure: "工具失败或成功都必须保留真实结果。", kind: "behavior" },
  ],
  "agent-rag-project": [
    { name: "检索后引用", expression: "response.sources and response.answer", failure: "Agent RAG 回答必须同时有答案和来源。", kind: "behavior" },
    { name: "无命中停止", expression: "empty_response.answer == \"资料不足\"", failure: "无资料时 Agent 不应自行编造答案。", kind: "behavior" },
  ],
  "model-messages-prompts": [
    { name: "消息角色", expression: "messages[0][\"role\"] == \"system\" and messages[-1][\"role\"] == \"user\"", failure: "应明确区分 system 与 user 消息。", kind: "structure" },
    { name: "模板变量", expression: "\"topic\" in prompt_variables", failure: "模板应声明题目要求的变量。", kind: "structure" },
  ],
  "model-configuration": [
    { name: "有效配置", expression: "validate_model_config({\"model\": \"demo\", \"timeout\": 30, \"temperature\": 0.2}) == {\"valid\": True, \"error\": None}", failure: "完整配置应通过本地校验。", kind: "behavior" },
    { name: "超时边界", expression: "validate_model_config({\"model\": \"demo\", \"timeout\": 0, \"temperature\": 0.2}) == {\"valid\": False, \"error\": \"timeout\"}", failure: "timeout 必须是大于 0 的数字。", kind: "behavior" },
    { name: "温度边界", expression: "validate_model_config({\"model\": \"demo\", \"timeout\": 30, \"temperature\": 1.1}) == {\"valid\": False, \"error\": \"temperature\"}", failure: "temperature 必须位于 0 到 1。", kind: "behavior" },
  ],
  "structured-output": [
    { name: "字段完整", expression: "isinstance(result, dict) and \"summary\" in result and \"confidence\" in result", failure: "结构化结果必须包含 summary 与 confidence。", kind: "structure" },
    { name: "置信度范围", expression: "0 <= result[\"confidence\"] <= 1", failure: "confidence 必须位于 0 到 1。", kind: "behavior" },
  ],
  "runnable-pipeline": [
    { name: "管道顺序", expression: "chain_steps == [\"template\", \"model\", \"parser\"]", failure: "Runnable 应按 template → model → parser 顺序组合。", kind: "structure" },
    { name: "保留错误", expression: "pipeline_error is not None or result is not None", failure: "管道应保留真实错误或真实结果。", kind: "behavior" },
  ],
};
