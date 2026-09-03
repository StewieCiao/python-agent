import type { LearningTrack } from "../authoring/types.ts";
import { langgraphChecks, langgraphHints } from "./metadata.ts";

const VERIFIED_AT = "2026-09-02";
const VERIFIED_VERSIONS = { langchain: "1.2.12", langgraph: "1.1.2" };
const GRAPH_API = "https://docs.langchain.com/oss/python/langgraph/graph-api";
const PERSISTENCE = "https://docs.langchain.com/oss/python/langgraph/persistence";
const INTERRUPTS = "https://docs.langchain.com/oss/python/langgraph/interrupts";
const LONG_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/long-term-memory";
const SHORT_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/short-term-memory";
const ACADEMY_INTRO = "https://academy.langchain.com/courses/intro-to-langgraph";
const ACADEMY_ESSENTIALS = "https://academy.langchain.com/courses/langgraph-essentials-python";
const DLAI_LANGGRAPH = "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/";
const DLAI_MEMORY = "https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/";
export const langgraphTrack: LearningTrack = {
  id: "langgraph",
  title: "LangGraph 工作流与智能体",
  shortTitle: "LangGraph",
  description: "从 StateGraph 到持久化、长期记忆、人机协作和多 Agent 项目，建立可观察、可恢复的工作流思维。",
  accent: "#6f5aa8",
  currentLessonId: "graph-foundations",
  lessons: [
    {
      id: "graph-foundations",
      title: "StateGraph、Node 与 Edge",
      summary: "先把图看成共享状态上的函数流程，再学习 Agent。",
      minutes: 50,
      guide: [
        {
          title: "State 是节点之间的共同契约",
          body: "每个节点接收当前 state，并返回需要更新的字段；edge 只决定下一个节点。把状态 schema 写清楚，可以让路由、持久化和调试都围绕同一份数据，而不是依赖隐藏的全局变量。",
          bullets: ["节点只返回需要更新的字段", "START 和 END 描述边界", "先编译再 invoke"],
          example: `class State(TypedDict):\n    topic: str\n    answer: str\n\ndef draft(state: State):\n    return {"answer": f"关于 {state['topic']} 的草稿"}`,
        },
        {
          title: "图适合明确控制流程",
          body: "简单的一次模型调用不需要 LangGraph。只有当任务需要分支、循环、持久化、中断或多个明确步骤时，图结构才提供价值。先画出状态变化，再决定节点数量。",
          bullets: ["节点名称表达职责", "edge 不承担业务计算", "避免把每行代码拆成节点"],
          example: `builder = StateGraph(State)\nbuilder.add_node("draft", draft)\nbuilder.add_edge(START, "draft")\nbuilder.add_edge("draft", END)\ngraph = builder.compile()`,
        },
        {
          title: "StateGraph、Node 与 Edge 的常见误区",
          body: "完成“StateGraph、Node 与 Edge”时，不要把业务计算塞进 edge，也不要把每个小步骤拆成无法理解的节点；先确认 state 的输入、节点更新和 END 边界。",
          bullets: ["节点负责计算", "边只负责去向", "编译后再运行"],
          example: `builder.add_edge("draft", END)`,
        },
      ],
      videos: [
        {
          title: "LangGraph Essentials - Python",
          url: ACADEMY_ESSENTIALS,
          provider: "LangChain Academy",
          language: "英文",
          duration: "1 小时",
          note: "官方快速入门，覆盖节点、边、条件边、记忆和 interrupt。",
        },
        {
          title: "AI Agents in LangGraph",
          url: DLAI_LANGGRAPH,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "约 1 小时 30 分",
          note: "从零实现 Agent 后再映射到 LangGraph。",
        },
      ],
      officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
      migrations: [{
        title: "从旧 Chain 组合迁移到 StateGraph",
        status: "replaced",
        explanation: "需要分支、恢复或可观察状态时，用 StateGraph 明确声明节点、边和状态；简单的单次调用仍可保留 Runnable。",
        beforeCode: "chain = prompt | model\nanswer = chain.invoke(input)",
        afterCode: "builder = StateGraph(State)\nbuilder.add_node(\"answer\", answer_node)\nbuilder.add_edge(START, \"answer\")\nbuilder.add_edge(\"answer\", END)",
        officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "输入是一个 topic 字符串；输出是第一个节点产生的 node_update 字典。请用两个节点依次生成 outline 和 answer，并用 graph_edges 明确到达 END。先用纯 Python 数据观察 StateGraph 的输入、节点输出和结束边界，再映射到官方 API。",
        starterCode: `topic = "RAG"\nEND = "END"\n\ndef draft(state):\n    pass\n\nnode_update = {}\ngraph_edges = ["START"]`,
        solution: `topic = "RAG"\nEND = "END"\n\ndef draft(state):\n    return {"answer": f"关于 {state['topic']} 的草稿"}\n\nnode_update = draft({"topic": topic})\ngraph_edges = ["START", "draft", "END"]`,
      },
    },
    {
      id: "state-reducers-routing",
      title: "Reducer、条件边与循环",
      summary: "控制状态如何合并，并让下一步由明确路由结果决定。",
      minutes: 60,
      guide: [
        {
          title: "Reducer 决定更新还是追加",
          body: "普通字段默认被新值覆盖；消息列表等累积字段需要 reducer。Reducer 是状态契约的一部分，错误的 reducer 会造成历史丢失或重复，因此应先用最小输入验证合并结果。",
          bullets: ["覆盖字段不需要 reducer", "消息使用 add_messages", "节点不直接修改传入 state"],
          example: `class State(TypedDict):\n    messages: Annotated[list, add_messages]\n    attempts: int`,
        },
        {
          title: "条件边返回有限的路由名",
          body: "路由函数读取 state，返回下一分支标识。它不负责调用工具或修改数据；所有可能返回值应在图中有对应目标，让未知状态成为明确错误而不是悄悄走默认节点。",
          bullets: ["路由只做决策", "分支集合可枚举", "循环必须有退出条件"],
          example: `def route(state):\n    return "revise" if state["score"] < 0.8 else "finish"\n\nbuilder.add_conditional_edges("review", route, {"revise": "draft", "finish": END})`,
        },
        {
          title: "Reducer、条件边与循环的常见误区",
          body: "完成“Reducer、条件边与循环”时，不要让 reducer 悄悄丢失历史，也不要让路由返回未声明的节点名；每个循环都必须有可验证的终止条件。",
          bullets: ["先验证合并结果", "路由值必须可枚举", "明确循环上限"],
          example: `builder.add_conditional_edges("review", route, {"revise": "draft", "finish": END})`,
        },
      ],
      videos: [{
        title: "Introduction to LangGraph · Modules 1–2",
        url: ACADEMY_INTRO,
        provider: "LangChain Academy",
        language: "英文",
        duration: "课程共 6 小时",
        note: "重点学习 State Schema、Reducers、Router 与 Agent。",
      }],
      officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
      migrations: [{
        title: "从隐式 if 路由迁移到条件边",
        status: "replaced",
        explanation: "把路由函数返回值与图中的目标节点显式绑定；未知分支不应静默落到默认节点。",
        beforeCode: "if score < 0.8:\n    draft_again()\nelse:\n    finish()",
        afterCode: "builder.add_conditional_edges(\"review\", route, {\"revise\": \"draft\", \"finish\": END})",
        officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "为草稿审查图增加 revise/finish 条件路由，并通过 attempts 限制最多修改两次。",
        starterCode: `def route(state):\n    pass`,
        solution: `def route(state):\n    if state["score"] >= 0.8:\n        return "finish"\n    if state["attempts"] >= 2:\n        return "finish"\n    return "revise"`,
      },
    },
    {
      id: "persistence-short-memory",
      title: "Persistence 与线程短期记忆",
      summary: "用 checkpointer 保存图状态，让同一 thread 可恢复、检查和继续。",
      minutes: 60,
      guide: [
        {
          title: "Checkpoint 保存每一步状态",
          body: "编译图时传入 checkpointer，调用时提供 thread_id。运行中的 state 会形成 checkpoint 序列，可用于恢复、查看历史和 time travel。内存保存器只适合本地学习，生产环境应选择官方持久化实现。",
          bullets: ["thread_id 是恢复键", "checkpoint 与业务数据库不同", "失败后从明确 checkpoint 恢复"],
          example: `checkpointer = InMemorySaver()\ngraph = builder.compile(checkpointer=checkpointer)\nconfig = {"configurable": {"thread_id": "lesson-3"}}\ngraph.invoke({"messages": [...]}, config)`,
        },
        {
          title: "短期记忆属于一个 thread",
          body: "同一 thread 的后续调用能够读取之前状态；更换 thread_id 就是新会话。用户长期偏好不应依靠扫描全部 thread 历史获得，而应写入 Store。",
          bullets: ["会话连续性复用 thread_id", "新任务使用新 thread", "跨 thread 数据交给 Store"],
          example: `same_thread = {"configurable": {"thread_id": "chat-42"}}\nnew_thread = {"configurable": {"thread_id": "chat-43"}}`,
        },
        {
          title: "Persistence 与线程短期记忆的常见误区",
          body: "完成“Persistence 与线程短期记忆”时，不要遗漏 thread_id，也不要把跨用户资料混进单个线程的 checkpoint；恢复前先确认读取的是同一条线程。",
          bullets: ["thread_id 必须稳定", "检查点不等于用户画像", "恢复保留真实状态"],
          example: `config = {"configurable": {"thread_id": "chat-42"}}`,
        },
      ],
      videos: [{
        title: "Introduction to LangGraph · State and Memory",
        url: ACADEMY_INTRO,
        provider: "LangChain Academy",
        language: "英文",
        duration: "课程共 6 小时",
        note: "学习 checkpointer、消息裁剪、摘要与外部记忆。",
      }],
      officialSources: [
        { label: "LangGraph persistence", url: PERSISTENCE },
        { label: "LangChain short-term memory", url: SHORT_TERM_MEMORY },
      ],
      migrations: [{
        title: "从手写 history 迁移到 checkpointer",
        status: "replaced",
        explanation: "短期线程状态由 checkpointer 按 thread_id 保存和恢复；手写消息历史仍可用于展示，但不再承担完整 Agent 状态持久化。",
        beforeCode: "history = load_messages(session_id)\nhistory.append(message)\nsave_messages(session_id, history)",
        afterCode: "graph = builder.compile(checkpointer=InMemorySaver())\nconfig = {\"configurable\": {\"thread_id\": \"chat-42\"}}\ngraph.invoke(input_state, config)",
        officialSources: [{ label: "LangGraph persistence", url: PERSISTENCE }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "用两个 thread_id 调用同一图，验证同线程连续、不同线程隔离。",
        starterCode: `config_a = {"configurable": {"thread_id": ""}}\nconfig_b = {"configurable": {"thread_id": ""}}`,
        solution: `config_a = {"configurable": {"thread_id": "user-a"}}\nconfig_b = {"configurable": {"thread_id": "user-b"}}`,
      },
    },
    {
      id: "long-term-store",
      title: "Store 与跨线程长期记忆",
      summary: "使用 namespace/key 保存用户资料、偏好或可检索记忆。",
      minutes: 65,
      guide: [
        {
          title: "namespace 决定记忆归属",
          body: "Store 的一条记忆由 namespace、key 和 value 组成。常见 namespace 包含用户 id 和记忆类型，避免不同用户互相读到数据。key 标识具体记录，value 保存结构化内容。",
          bullets: ["用户 id 进入 namespace", "value 使用明确 schema", "工具只访问授权 namespace"],
          example: `namespace = ("memories", user_id)\nstore.put(namespace, "profile", {"language": "zh-CN", "level": "beginner"})`,
        },
        {
          title: "长期记忆需要写入与检索策略",
          body: "系统必须决定何时写、写什么、何时更新和怎样召回。把所有对话原样写入 Store 既浪费空间，也会积累冲突信息。可以显式让用户确认，也可以在后台抽取结构化事实，但都要保留来源和更新时间。",
          bullets: ["区分 profile 与事件集合", "更新覆盖与追加规则不同", "召回结果仍需检查相关性"],
          example: `item = store.get(("memories", user_id), "profile")\npreferred_language = item.value["language"] if item else "zh-CN"`,
        },
        {
          title: "Store 与跨线程长期记忆的常见误区",
          body: "完成“Store 与跨线程长期记忆”时，不要把 thread_id 当作用户身份，也不要在缺少记录时猜测偏好；namespace、key 和 value 的契约必须明确。",
          bullets: ["用户和线程分开", "缺失记录保留 None", "写入结构可验证"],
          example: `item = store.get(("memories", user_id), "profile")`,
        },
      ],
      videos: [
        {
          title: "Introduction to LangGraph · Long-Term Memory",
          url: ACADEMY_INTRO,
          provider: "LangChain Academy",
          language: "英文",
          duration: "课程共 6 小时",
          note: "重点学习 Store、Profile、Collection 与长期记忆 Agent。",
        },
        {
          title: "Long-Term Agentic Memory With LangGraph",
          url: DLAI_MEMORY,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 24 分",
          note: "补充记忆抽取、管理和 LangMem 思路。",
        },
      ],
      officialSources: [{ label: "LangChain long-term memory", url: LONG_TERM_MEMORY }],
      migrations: [{
        title: "从 thread history 迁移到 Store",
        status: "replaced",
        explanation: "跨线程的用户偏好和资料应写入 Store 的 namespace/key；不要扫描某个 thread 的历史来猜测长期记忆。",
        beforeCode: "profile = history[-1].get(\"profile\")",
        afterCode: "profile = store.get((\"users\", user_id, \"profile\"), \"current\")",
        officialSources: [{ label: "LangChain long-term memory", url: LONG_TERM_MEMORY }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "设计 profile 与 learning_events 两类 namespace，分别处理覆盖更新和追加记录。",
        starterCode: `profile_namespace = ()\nevents_namespace = ()`,
        solution: `profile_namespace = ("users", user_id, "profile")\nevents_namespace = ("users", user_id, "learning_events")`,
      },
    },
    {
      id: "streaming-interrupts",
      title: "Streaming、Interrupt 与人工确认",
      summary: "让长任务及时反馈，并在高风险动作前安全暂停。",
      minutes: 70,
      guide: [
        {
          title: "流式事件比加载动画更可信",
          body: "graph.stream 可以按 values、updates 或 messages 等模式产出真实进度。界面应显示当前节点或模型 token，而不是无论后台状态如何都滚动伪进度。流结束前不能标记任务完成。",
          bullets: ["选择与 UI 对应的 stream_mode", "异常终止保留最后真实事件", "不要重放动作造成重复副作用"],
          example: `for update in graph.stream(input_state, config, stream_mode="updates"):\n    print(update)`,
        },
        {
          title: "Interrupt 把决定交还给人",
          body: "节点调用 interrupt(payload) 后保存状态并暂停。用户确认后用 Command(resume=value) 继续；payload 应包含要执行的动作和影响，恢复值必须再次验证。",
          bullets: ["暂停前 checkpoint 已存在", "展示具体动作与参数", "拒绝和批准都要有明确分支"],
          example: `approved = interrupt({"action": "send_email", "recipient": recipient})\nif not approved:\n    return {"status": "cancelled"}`,
        },
        {
          title: "Streaming、Interrupt 与人工确认的常见误区",
          body: "完成“Streaming、Interrupt 与人工确认”时，不要用假进度掩盖节点停滞，也不要在 interrupt 之前执行不可撤销副作用；恢复值仍需经过业务验证。",
          bullets: ["事件必须来自真实执行", "副作用放在确认之后", "拒绝路径明确结束"],
          example: `approved = interrupt({"action": "send_email"})`,
        },
      ],
      videos: [{
        title: "Introduction to LangGraph · UX and Human-in-the-Loop",
        url: ACADEMY_INTRO,
        provider: "LangChain Academy",
        language: "英文",
        duration: "课程共 6 小时",
        note: "覆盖 streaming、breakpoints、编辑状态、动态中断和 time travel。",
      }],
      officialSources: [{ label: "LangGraph interrupts", url: INTERRUPTS }],
      migrations: [{
        title: "从手写进度轮询迁移到 stream 与 interrupt",
        status: "replaced",
        explanation: "长流程用 graph.stream 产生真实节点事件；需要人工决定时用 interrupt 保存状态并暂停，而不是用定时器猜测进度。",
        beforeCode: "run_workflow()\nprint(\"处理中...\")",
        afterCode: "for event in graph.stream(input_state, config, stream_mode=\"updates\"):\n    print(event)\napproved = interrupt({\"action\": \"send_email\"})",
        officialSources: [{ label: "LangGraph interrupts", url: INTERRUPTS }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "在发送邮件节点前加入 interrupt，用户拒绝时返回 cancelled，不调用发送工具。",
        starterCode: `def approve_email(state):\n    pass`,
        solution: `def approve_email(state):\n    approved = interrupt({"action": "send_email", "draft": state["draft"]})\n    return {"approved": bool(approved)}`,
      },
    },
    {
      id: "subgraphs-parallelism",
      title: "子图、并行与 Map-Reduce",
      summary: "把可独立的工作分开执行，再通过明确 reducer 汇总结果。",
      minutes: 65,
      guide: [
        {
          title: "子图隔离一段完整职责",
          body: "当研究、审核或写作流程拥有自己的 state 和节点时，可以编译成子图并作为父图节点使用。子图不是为了让画布更漂亮，而是让一段流程可以独立理解、测试和复用。",
          bullets: ["先明确父子状态映射", "子图内部错误不改写", "共享持久化语义要显式设计"],
          example: `research_graph = research_builder.compile()\nparent.add_node("research", research_graph)`,
        },
        {
          title: "并行结果需要 reducer 合并",
          body: "多个节点可以读取同一初始状态并行工作，但写入同一字段时必须定义合并方式。Map-Reduce 常把主题拆成多个 Send 任务，再将 findings 追加到列表，最终节点统一生成报告。",
          bullets: ["并行任务互不依赖", "共享字段定义 reducer", "汇总节点处理空结果与失败列表"],
          example: `def fan_out(state):\n    return [Send("research_section", {"topic": topic}) for topic in state["topics"]]`,
        },
        {
          title: "子图、并行与 Map-Reduce 的常见误区",
          body: "完成“子图、并行与 Map-Reduce”时，不要让子图偷偷改写父状态，也不要在并行分支写入没有 reducer 的共享字段；先定义输入映射和合并规则。",
          bullets: ["父子状态边界清楚", "共享字段显式合并", "失败结果可观察"],
          example: `parent.add_node("research", research_graph)`,
        },
      ],
      videos: [{
        title: "Introduction to LangGraph · Building Your Assistant",
        url: ACADEMY_INTRO,
        provider: "LangChain Academy",
        language: "英文",
        duration: "课程共 6 小时",
        note: "覆盖 parallelization、sub-graphs、map-reduce 和 research assistant。",
      }],
      officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
      migrations: [{
        title: "从串行函数链迁移到子图与并行分支",
        status: "replaced",
        explanation: "当职责可独立执行时，把流程编译为子图或通过 Send fan-out；共享字段必须声明 reducer，不能靠全局列表汇总。",
        beforeCode: "for topic in topics:\n    findings.append(research(topic))",
        afterCode: "return [Send(\"research_section\", {\"topic\": topic}) for topic in state[\"topics\"]]",
        officialSources: [{ label: "LangGraph Graph API", url: GRAPH_API }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "把三个研究主题并行分发，使用 reducer 汇总 findings，再生成报告。",
        starterCode: `def fan_out(state):\n    pass`,
        solution: `def fan_out(state):\n    return [Send("research_section", {"topic": topic}) for topic in state["topics"]]`,
      },
    },
    {
      id: "memory-research-project",
      title: "项目：带长期记忆的研究助手",
      summary: "组合检索、并行研究、人工确认、短期状态和长期偏好。",
      minutes: 150,
      guide: [
        {
          title: "项目状态只保存本次运行",
          body: "研究主题、计划、各章节 findings、引用、审批结果和最终报告属于当前 thread，交给 checkpointer。用户偏好的语言、报告长度和常用来源属于跨 thread 信息，交给 Store。",
          bullets: ["thread state 与 user memory 分离", "引用随 findings 保存", "审批后再生成最终报告"],
          example: `class ResearchState(TypedDict):\n    topic: str\n    plan: list[str]\n    findings: Annotated[list[dict], operator.add]\n    report: str`,
        },
        {
          title: "先验证证据，再让模型写作",
          body: "每个研究节点返回发现与来源，汇总节点先检查空结果、重复来源和失败章节，再生成草稿。人工确认可以修改计划或拒绝继续，最终报告只能引用真实收集到的来源。",
          bullets: ["检索结果和模型总结分开保存", "失败章节进入明确列表", "长期偏好不覆盖当前用户指令"],
          example: `preferences = store.get(("users", user_id), "report_preferences")\nconfig = {"configurable": {"thread_id": research_id}}\ngraph.invoke({"topic": topic, "preferences": preferences.value}, config)`,
        },
        {
          title: "带长期记忆的研究助手的常见误区",
          body: "完成“项目：带长期记忆的研究助手”时，不要把用户偏好写入当前 thread，也不要在没有真实来源时生成看似完整的报告；先区分状态范围，再验证证据和审批结果。",
          bullets: ["短期状态按 thread 隔离", "长期偏好按 user 隔离", "报告只引用真实证据"],
          example: `config = {"configurable": {"thread_id": research_id}}`,
        },
      ],
      videos: [
        {
          title: "Introduction to LangGraph · Research Assistant",
          url: ACADEMY_INTRO,
          provider: "LangChain Academy",
          language: "英文",
          duration: "课程共 6 小时",
          note: "官方完整项目路线，适合作为本学习站 LangGraph 毕业项目。",
        },
        {
          title: "AI Agents in LangGraph",
          url: DLAI_LANGGRAPH,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "约 1 小时 30 分",
          note: "补充 persistence、streaming、human-in-the-loop 和 essay writer。",
        },
      ],
      officialSources: [
        { label: "LangGraph persistence", url: PERSISTENCE },
        { label: "LangGraph interrupts", url: INTERRUPTS },
        { label: "LangChain long-term memory", url: LONG_TERM_MEMORY },
      ],
      migrations: [{
        title: "从脚本式研究助手迁移到可恢复项目图",
        status: "replaced",
        explanation: "把研究计划、证据、审批和报告写进明确的 StateGraph；thread state 交给 checkpointer，跨线程偏好交给 Store。",
        beforeCode: "plan = make_plan(topic)\nfindings = research(plan)\nreturn write_report(findings)",
        afterCode: "config = {\"configurable\": {\"thread_id\": research_id}}\ngraph.invoke({\"topic\": topic}, config)",
        officialSources: [{ label: "LangGraph persistence", url: PERSISTENCE }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "列出研究助手的 thread state、Store memory、节点和人工中断点，保证两类状态不混用。",
        starterCode: `thread_state = []\nstore_memory = []\nnodes = []\ninterrupt_before = ""`,
        solution: `thread_state = ["topic", "plan", "findings", "sources", "draft", "approved"]\nstore_memory = ["language", "report_length", "preferred_sources"]\nnodes = ["plan", "research", "review_evidence", "write_report"]\ninterrupt_before = "write_report"`,
      },
    },
  ],
};

for (const [index, lesson] of langgraphTrack.lessons.entries()) {
  if (index > 0 && (!lesson.prerequisites || lesson.prerequisites.length === 0)) {
    lesson.prerequisites = [langgraphTrack.lessons[index - 1].id];
  }
  const hints = langgraphHints[lesson.id];
  if (!hints) throw new Error(`langgraph/${lesson.id} 缺少作者提示`);
  lesson.exercise.hints = [...hints];
  const checks = langgraphChecks[lesson.id];
  if (checks) lesson.browserChecks = checks;
}
