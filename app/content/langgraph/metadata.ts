import type { LearningLesson } from "../authoring/types.ts";

export const langgraphHints: Record<string, [string, string, string]> = {
  "graph-foundations": ["先写 State 的字段。", "再声明节点和边的去向。", "最后编译并验证 END 边界。"],
  "state-reducers-routing": ["区分覆盖字段和追加字段。", "让路由只返回已声明分支名。", "给循环设置可观察的终止条件。"],
  "checkpoint-configuration": ["先确定 thread_id", "复制检查点后再合并更新", "用未知线程验证真实失败"],
  "supervisor-routing": ["先列出可用角色", "把选择和执行分开", "用 unknown 角色验证 KeyError"],
  "persistence-short-memory": ["先为图配置 checkpointer。", "每次调用提供稳定 thread_id。", "用不同线程验证状态不会串线。"],
  "long-term-store": ["先确定 namespace、key 和 value。", "把 user_id 与 thread_id 分开。", "分别验证覆盖更新和缺失记录。"],
  "streaming-interrupts": ["先选择要展示的真实 stream 事件。", "在副作用之前调用 interrupt。", "恢复时再次验证用户决定。"],
  "subgraphs-parallelism": ["先画出父图与子图的状态边界。", "为并行写入字段定义 reducer。", "检查空分支和失败分支的汇总结果。"],
  "memory-research-project": ["先列出 thread state 与 Store memory。", "再安排检索、审核和写作节点。", "最后用恢复和引用测试验收项目。"],
};

export const langgraphChecks: Record<string, NonNullable<LearningLesson["browserChecks"]>> = {
  "graph-foundations": [
    { name: "节点输出", expression: "isinstance(node_update, dict)", failure: "节点应返回局部状态更新字典。", kind: "behavior" },
    { name: "边界终点", expression: "END in graph_edges", failure: "图必须声明明确的结束边界。", kind: "structure" },
  ],
  "state-reducers-routing": [
    { name: "路由有限", expression: "route_result in {\"revise\", \"finish\"}", failure: "路由结果必须属于已声明分支。", kind: "behavior" },
    { name: "循环上限", expression: "attempts <= 2", failure: "循环应有明确的尝试次数上限。", kind: "behavior" },
  ],
  "checkpoint-configuration": [
    { name: "恢复状态", expression: "resume({\"thread-a\": {\"step\": 2}}, \"thread-a\", {\"step\": 3}) == {\"step\": 3}", failure: "应从指定 thread 的检查点恢复并应用更新。", kind: "behavior" },
    { name: "原状态不变", expression: "saved == {\"thread-a\": {\"step\": 2}}", failure: "恢复不能修改原检查点。", kind: "behavior" },
    { name: "缺失线程", expression: "_raises_key_error(lambda: resume(saved, \"missing\", {}))", failure: "未知 thread_id 应保留 KeyError。", kind: "behavior" },
  ],
  "supervisor-routing": [
    { name: "角色交接", expression: "handoff({\"role\": \"researcher\", \"task\": \"rag\"}, {\"researcher\": lambda task: task.upper()}) == {\"role\": \"researcher\", \"task\": \"rag\", \"result\": \"RAG\"}", failure: "Supervisor 应把任务交给指定角色并保留结果。", kind: "behavior" },
    { name: "输入保留", expression: "handoff({\"role\": \"writer\", \"task\": \"draft\"}, {\"writer\": lambda task: task + \"!\"})[\"task\"] == \"draft\"", failure: "交接记录必须保留原始任务。", kind: "behavior" },
    { name: "未知角色", expression: "_raises_key_error(lambda: handoff({\"role\": \"unknown\", \"task\": \"x\"}, {}))", failure: "未注册角色不能静默选择默认 Agent。", kind: "behavior" },
  ],
  "persistence-short-memory": [
    { name: "线程键", expression: "config[\"configurable\"][\"thread_id\"]", failure: "持久化调用必须提供 thread_id。", kind: "structure" },
    { name: "恢复状态", expression: "resumed_state == saved_state", failure: "同一线程恢复时应读回检查点状态。", kind: "behavior" },
  ],
  "long-term-store": [
    { name: "用户命名空间", expression: "namespace[0] == user_id", failure: "长期记忆应按 user_id 隔离。", kind: "structure" },
    { name: "跨线程读取", expression: "store[(namespace, key)] == value", failure: "Store 应能按 namespace/key 读取值。", kind: "behavior" },
  ],
  "streaming-interrupts": [
    { name: "事件顺序", expression: "events[0][\"node\"] != events[-1][\"node\"]", failure: "流式事件应保留节点执行顺序。", kind: "behavior" },
    { name: "中断状态", expression: "interrupt_state[\"requires_approval\"] is True", failure: "高风险步骤应留下待审核状态。", kind: "structure" },
  ],
  "subgraphs-parallelism": [
    { name: "子图边界", expression: "subgraph_result is not None", failure: "子图必须返回可合并结果。", kind: "behavior" },
    { name: "并行合并", expression: "merged_state[\"branches\"] == 2", failure: "并行分支结果应在父图中合并。", kind: "behavior" },
  ],
  "memory-research-project": [
    { name: "线程恢复", expression: "resume(thread_id) == checkpoint_state", failure: "研究项目应能从同一 thread 检查点恢复。", kind: "behavior" },
    { name: "长期偏好", expression: "store.get((\"user\", user_id), \"profile\") is not None", failure: "项目应把跨线程偏好保存到 Store。", kind: "behavior" },
  ],
};
