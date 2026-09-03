import { lessons as pythonLessons } from "./python/curriculum.ts";
import { lessonGuides } from "./python/lessonGuides.ts";
import { lessonSolutions } from "./python/solutions.ts";

export type VideoResource = {
  title: string;
  url: string;
  provider: "黑马程序员" | "LangChain Academy" | "DeepLearning.AI";
  language: "中文" | "英文";
  duration: string;
  note: string;
};

export type MigrationNote = {
  title: string;
  status: "legacy" | "renamed" | "replaced";
  explanation: string;
  beforeCode: string;
  afterCode: string;
  officialSources: Array<{ label: string; url: string }>;
  verifiedAt: string;
  verifiedVersions: { langchain: string; langgraph: string };
};

export type LearningGuide = {
  title: string;
  body: string;
  bullets: string[];
  example: string;
};

export type LearningExercise = {
  prompt: string;
  starterCode: string;
  hints?: string[];
  solution: string;
};

export type LearningLesson = {
  id: string;
  title: string;
  summary: string;
  minutes: number;
  prerequisites?: string[];
  difficulty?: "beginner" | "intermediate" | "advanced";
  tags?: string[];
  guide: LearningGuide[];
  videos: VideoResource[];
  officialSources: Array<{ label: string; url: string }>;
  migrations: MigrationNote[];
  project?: boolean;
  projectLinks?: string[];
  exercise: LearningExercise;
  browserChecks?: Array<{
    name: string;
    expression: string;
    failure: string;
    kind: "behavior" | "structure";
  }>;
  pythonLessonId?: string;
};

export type LearningTrack = {
  id: "python" | "langchain-rag" | "langgraph";
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  currentLessonId: string;
  lessons: LearningLesson[];
};

const VERIFIED_AT = "2026-09-02";
const VERIFIED_VERSIONS = { langchain: "1.2.12", langgraph: "1.1.2" };
const HEIMA = "https://www.bilibili.com/video/BV1yjz5BLEoY";
const LANGCHAIN_V1 = "https://docs.langchain.com/oss/python/releases/langchain-v1";
const LANGCHAIN_MIGRATION = "https://docs.langchain.com/oss/python/migrate/langchain-v1";
const MEMORY_OVERVIEW = "https://docs.langchain.com/oss/python/concepts/memory";
const SHORT_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/short-term-memory";
const LONG_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/long-term-memory";
const RETRIEVAL = "https://docs.langchain.com/oss/python/langchain/retrieval";
const AGENTS = "https://docs.langchain.com/oss/python/langchain/agents";
const GRAPH_API = "https://docs.langchain.com/oss/python/langgraph/graph-api";
const PERSISTENCE = "https://docs.langchain.com/oss/python/langgraph/persistence";
const INTERRUPTS = "https://docs.langchain.com/oss/python/langgraph/interrupts";
const ACADEMY_INTRO = "https://academy.langchain.com/courses/intro-to-langgraph";
const ACADEMY_ESSENTIALS = "https://academy.langchain.com/courses/langgraph-essentials-python";
const DLAI_LANGCHAIN = "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/";
const DLAI_DATA = "https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/";
const DLAI_AGENTS = "https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/";
const DLAI_LANGGRAPH = "https://www.deeplearning.ai/short-courses/ai-agents-in-langgraph/";
const DLAI_MEMORY = "https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/";

function heimaVideo(page: number, title: string, duration: string): VideoResource {
  return {
    title,
    url: `${HEIMA}?p=${page}`,
    provider: "黑马程序员",
    language: "中文",
    duration,
    note: `主线课程第 ${page} 节；站内讲义会标出与当前官方 API 的差异。`,
  };
}

const pythonTrack: LearningTrack = {
  id: "python",
  title: "Python 基础与工程",
  shortTitle: "Python",
  description: "从第一行代码到可测试的 Agent 基础组件。练习、真实运行反馈和错题记录全部保留，但不再锁定学习顺序。",
  accent: "#d58a42",
  currentLessonId: pythonLessons[0].id,
  lessons: pythonLessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    summary: lesson.goal,
    minutes: lesson.minutes,
    prerequisites: [],
    difficulty: lesson.module.startsWith("Agent") ? "advanced" : "beginner",
    tags: [lesson.kicker],
    guide: lessonGuides[lesson.id].map(({ title, body, bullets, example }) => ({
      title,
      body,
      bullets,
      example,
    })),
    videos: [],
    officialSources: lesson.source ? [lesson.source] : [],
    migrations: [],
    project: lesson.project ?? false,
    projectLinks: [],
    pythonLessonId: lesson.id,
    exercise: {
      prompt: lesson.requirements.join("\n"),
      starterCode: lesson.starterCode,
      hints: lesson.hints,
      solution: lessonSolutions[lesson.id],
    },
    browserChecks: lesson.tests.map((test) => ({
      name: test.name,
      expression: test.expression,
      failure: test.failure,
      kind: test.kind ?? "behavior",
    })),
  })),
};

const langchainTrack: LearningTrack = {
  id: "langchain-rag",
  title: "LangChain 与 RAG",
  shortTitle: "LangChain / RAG",
  description: "沿着你正在学习的黑马课程继续前进，同时用 LangChain v1 官方语义修正记忆、检索和 Agent 的旧写法。",
  accent: "#2f7f65",
  currentLessonId: "memory-modernization",
  lessons: [
    {
      id: "memory-modernization",
      title: "记忆：会话历史、短期状态与长期记忆",
      summary: "把第 37–38 节的 History 类放回正确位置，区分持久化消息、线程状态和跨线程记忆。",
      minutes: 55,
      guide: [
        {
          title: "先把三个相似概念拆开",
          body: "聊天消息写入内存或 JSON 文件，解决的是历史记录能否再次读取；checkpointer 保存的是某个 thread 的 Agent 状态；Store 保存的是可以跨 thread 查找的用户资料或应用知识。三者都能“记住”，但生命周期和检索范围完全不同。",
          bullets: ["消息历史不等于语义记忆", "thread_id 标识一次持续会话", "Store 通过 namespace 和 key 跨会话访问"],
          example: `# 课程中的文件历史：重启后还能读到消息\n# 官方短期记忆：checkpointer + thread_id\n# 官方长期记忆：store.put(namespace, key, value)`,
        },
        {
          title: "课程代码仍能教会你的部分",
          body: "RunnableWithMessageHistory 和 BaseChatMessageHistory 仍适合学习“如何给 Runnable 注入消息历史”。真正需要修正的是命名和系统边界：自定义 FileChatMessageHistory 是持久化消息适配器，不应被当作完整的生产级长期记忆架构。",
          bullets: ["保留 session_id 隔离思想", "文件方案只适合单机教学", "并发、检索和用户画像交给正式存储"],
          example: `conversation = RunnableWithMessageHistory(\n    chain, get_history,\n    input_messages_key="input",\n    history_messages_key="history",\n)`,
        },
        {
          title: "用新版 Agent 建立短期记忆",
          body: "LangChain v1 的 Agent 以 LangGraph 为运行时。给 create_agent 传入 checkpointer，再在调用配置中提供 thread_id，状态会按线程保存。开发时可用 InMemorySaver，持久化环境应使用官方数据库 checkpointer。",
          bullets: ["Agent 与保存器职责分开", "每次调用复用同一个 thread_id", "跨用户资料不要塞进线程历史"],
          example: `from langchain.agents import create_agent\nfrom langgraph.checkpoint.memory import InMemorySaver\n\nagent = create_agent(model, tools=[], checkpointer=InMemorySaver())\nconfig = {"configurable": {"thread_id": "stewie-1"}}\nagent.invoke({"messages": [{"role": "user", "content": "我在学 RAG"}]}, config)`,
        },
      ],
      videos: [
        heimaVideo(37, "Memory 临时会话记忆", "28:04"),
        heimaVideo(38, "Memory 长期会话记忆", "24:43"),
        {
          title: "Long-Term Agentic Memory With LangGraph",
          url: DLAI_MEMORY,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 24 分",
          note: "用于理解现代跨会话记忆；以站内官方迁移卡为代码基线。",
        },
      ],
      officialSources: [
        { label: "Memory overview", url: MEMORY_OVERVIEW },
        { label: "Short-term memory", url: SHORT_TERM_MEMORY },
        { label: "Long-term memory", url: LONG_TERM_MEMORY },
      ],
      migrations: [
        {
          title: "ConversationBufferMemory / ConversationChain → Agent checkpointer",
          status: "legacy",
          explanation: "旧 memory classes 与 ConversationChain 已移入 classic 体系。新 Agent 使用 checkpointer 保存 thread 状态。",
          beforeCode: `memory = ConversationBufferMemory()\nconversation = ConversationChain(llm=llm, memory=memory)`,
          afterCode: `agent = create_agent(model, tools=[], checkpointer=InMemorySaver())\nagent.invoke({"messages": messages}, {"configurable": {"thread_id": "u-1"}})`,
          officialSources: [
            { label: "LangChain v1 migration", url: LANGCHAIN_MIGRATION },
            { label: "Short-term memory", url: SHORT_TERM_MEMORY },
          ],
          verifiedAt: VERIFIED_AT,
          verifiedVersions: VERIFIED_VERSIONS,
        },
        {
          title: "文件聊天记录“长期记忆” → 持久化历史 / Store",
          status: "renamed",
          explanation: "JSON 文件能跨重启保存消息，但官方长期记忆特指可跨 thread 使用 Store 管理的用户或应用数据。",
          beforeCode: `history = FileChatMessageHistory("./chat_history", session_id)`,
          afterCode: `store.put(("memories", user_id), "profile", {"language": "zh-CN"})`,
          officialSources: [
            { label: "Memory overview", url: MEMORY_OVERVIEW },
            { label: "Long-term memory", url: LONG_TERM_MEMORY },
          ],
          verifiedAt: VERIFIED_AT,
          verifiedVersions: VERIFIED_VERSIONS,
        },
      ],
      exercise: {
        prompt: "分别写出 thread_id 短期记忆和 user_id 长期记忆的适用场景，并把课程中的 JSON 历史准确重命名。",
        starterCode: `memory_terms = {\n    "json_history": "",\n    "checkpointer": "",\n    "store": "",\n}`,
        solution: `memory_terms = {\n    "json_history": "持久化消息历史",\n    "checkpointer": "线程内短期状态",\n    "store": "跨线程长期记忆",\n}`,
      },
    },
    {
      id: "document-loaders",
      title: "文档加载器与统一 Document",
      summary: "继续第 39–42 节，理解 Loader 的真正产物是带 page_content 和 metadata 的 Document。",
      minutes: 70,
      guide: [
        {
          title: "Loader 负责读取，不负责回答",
          body: "CSVLoader、JSONLoader、TextLoader 和 PyPDFLoader 把不同文件格式转换为统一 Document。后续切分、嵌入和检索只依赖 Document 契约，因此 metadata 是否保留来源、页码和记录标识会直接影响答案可追溯性。",
          bullets: ["page_content 保存正文", "metadata 保存来源定位", "读取失败应报告真实文件或解析错误"],
          example: `from langchain_community.document_loaders import PyPDFLoader\n\ndocs = PyPDFLoader("guide.pdf").load()\nprint(docs[0].page_content, docs[0].metadata)`,
        },
        {
          title: "先检查数据，再选择切分方式",
          body: "结构化 CSV/JSON 适合按记录加载；长文本和 PDF 通常还需切分。不要把所有输入先拼成一个巨型字符串，否则会丢失记录边界和来源信息，也会让后续检索结果无法解释。",
          bullets: ["一条业务记录对应一个 Document", "PDF 要保留页码", "加载后先抽样检查文本和 metadata"],
          example: `for doc in docs[:2]:\n    print(len(doc.page_content))\n    print(doc.metadata.get("source"))`,
        },
      ],
      videos: [
        heimaVideo(39, "CSVLoader", "16:40"),
        heimaVideo(40, "JSONLoader", "16:58"),
        heimaVideo(41, "TextLoader 和文档分割器", "11:54"),
        heimaVideo(42, "PyPDFLoader", "06:58"),
        {
          title: "LangChain Chat with Your Data",
          url: DLAI_DATA,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 18 分",
          note: "适合补充文档加载到问答的完整视角；旧 API 以迁移卡为准。",
        },
      ],
      officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
      migrations: [],
      exercise: {
        prompt: "加载 PDF 后打印第一页正文长度、source 与 page 元数据，确认数据可追踪。",
        starterCode: `from langchain_community.document_loaders import PyPDFLoader\n\ndocs = PyPDFLoader("guide.pdf").load()\n# 检查第一页`,
        solution: `from langchain_community.document_loaders import PyPDFLoader\n\ndocs = PyPDFLoader("guide.pdf").load()\nfirst = docs[0]\nprint(len(first.page_content))\nprint(first.metadata.get("source"))\nprint(first.metadata.get("page"))`,
      },
    },
    {
      id: "indexing-vector-store",
      title: "切分、嵌入与向量存储",
      summary: "把第 41–43 节串成可解释的 indexing 流程，避免只记住某个向量库的方法名。",
      minutes: 65,
      guide: [
        {
          title: "索引是离线数据流程",
          body: "RAG 在回答前先把文档切成 chunk，计算 embedding，再写入 vector store。chunk 太长会混入多个主题，太短会丢失上下文；chunk_overlap 只用于保留边界信息，不是越大越好。",
          bullets: ["加载与索引可独立运行", "chunk 必须保留原 metadata", "用真实问题检查召回片段"],
          example: `from langchain_text_splitters import RecursiveCharacterTextSplitter\n\nsplitter = RecursiveCharacterTextSplitter(chunk_size=600, chunk_overlap=80)\nchunks = splitter.split_documents(docs)`,
        },
        {
          title: "向量库只负责相似内容召回",
          body: "Embedding 把文本映射到向量，vector store 根据距离返回相近 chunk。它并不知道答案是否正确，也不会自动处理权限、时效和引用，因此结果必须在交给模型前检查文本与 metadata。",
          bullets: ["query 与文档使用兼容 embedding", "top-k 是召回数量而非可信度", "检索结果应保留来源"],
          example: `vector_store.add_documents(chunks)\nresults = vector_store.similarity_search("退货期限", k=3)\nfor doc in results:\n    print(doc.page_content, doc.metadata)`,
        },
      ],
      videos: [
        heimaVideo(41, "TextLoader 和文档分割器", "11:54"),
        heimaVideo(43, "VectorStores 向量存储", "21:53"),
        {
          title: "LangChain Chat with Your Data",
          url: DLAI_DATA,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 18 分",
          note: "重点观看 splitting、vector store 与 retrieval 部分。",
        },
      ],
      officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
      migrations: [],
      exercise: {
        prompt: "对三段带 source 元数据的文本切分并检索，输出命中文本和来源。",
        starterCode: `# 建立 chunks 和 vector_store 后检索“退款”`,
        solution: `results = vector_store.similarity_search("退款", k=2)\nfor doc in results:\n    print(doc.page_content)\n    print(doc.metadata["source"])`,
      },
    },
    {
      id: "retrieval-chain",
      title: "从 Retriever 到可核验的 RAG 回答",
      summary: "学习第 44–45 节时，把 RunnablePassthrough 看成数据流组合，而不是必须背诵的魔法写法。",
      minutes: 55,
      guide: [
        {
          title: "RAG 的线上流程只有四步",
          body: "用户问题进入 retriever，相关 Document 被格式化成 context，prompt 同时接收 context 和原问题，模型再生成答案。调试时应逐步观察检索结果和最终 prompt，而不是只看最后一句回答。",
          bullets: ["先验证召回再调模型", "context 与 question 分开传递", "回答必须允许承认资料不足"],
          example: `chain = {\n    "context": retriever | format_docs,\n    "question": RunnablePassthrough(),\n} | prompt | model | StrOutputParser()`,
        },
        {
          title: "RunnablePassthrough 只是保留输入",
          body: "字典 Runnable 会并行计算字段。context 字段执行检索和格式化，question 字段使用 RunnablePassthrough 原样保留用户问题。理解输入输出形状后，LCEL 才容易阅读和测试。",
          bullets: ["为每一步写清输入输出类型", "格式化函数只做 Document → str", "不要在格式化阶段偷偷调用模型"],
          example: `def format_docs(docs):\n    return "\n\n".join(\n        f"来源: {d.metadata.get('source')}\n{d.page_content}" for d in docs\n    )`,
        },
      ],
      videos: [
        heimaVideo(44, "基于向量检索构建提示词", "10:21"),
        heimaVideo(45, "RunnablePassthrough 的使用", "23:40"),
        {
          title: "LangChain for LLM Application Development",
          url: DLAI_LANGCHAIN,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 48 分",
          note: "用于补充 chain 的整体思维；示例代码较早，站内以 v1 说明为准。",
        },
      ],
      officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
      migrations: [],
      exercise: {
        prompt: "实现 format_docs，输出正文与 source；资料为空时返回明确的“没有检索到资料”。",
        starterCode: `def format_docs(docs):\n    pass`,
        solution: `def format_docs(docs):\n    if not docs:\n        return "没有检索到资料"\n    return "\n\n".join(\n        f"来源: {doc.metadata.get('source', '未知')}\n{doc.page_content}"\n        for doc in docs\n    )`,
      },
    },
    {
      id: "rag-project",
      title: "RAG 项目：上传、索引、检索与会话",
      summary: "对应第 46–54 节，把服装客服项目拆成边界清晰的离线索引和在线问答流程。",
      minutes: 120,
      guide: [
        {
          title: "离线流程负责可重复索引",
          body: "文件上传后先计算内容标识，再执行加载、切分、嵌入和写库。内容标识用于判断是否重复，不代表文件可信；索引失败必须保留具体阶段和原因，不能把半成品标为成功。",
          bullets: ["原文件与索引状态分开", "同一内容避免重复嵌入", "metadata 保存知识库与来源"],
          example: `digest = hashlib.md5(content).hexdigest()\n# load -> split -> embed -> store\n# 只有写库完成后再记录 digest`,
        },
        {
          title: "在线流程只组合已验证组件",
          body: "在线请求读取历史、检索当前问题、生成带来源回答，再保存本轮消息。历史记录和长期用户记忆仍是不同数据；不要把所有历史无限塞入 prompt，也不要在检索失败时伪造知识库答案。",
          bullets: ["检索失败与模型失败分别显示", "历史窗口有明确上限", "回答附带真实来源"],
          example: `docs = retriever.invoke(question)\nanswer = rag_chain.invoke({"question": question, "context": format_docs(docs)})\nhistory.add_messages([HumanMessage(question), AIMessage(answer)])`,
        },
      ],
      videos: [
        heimaVideo(46, "RAG 项目案例介绍", "06:17"),
        heimaVideo(49, "知识库更新服务", "19:03"),
        heimaVideo(52, "RAG 服务核心代码", "14:22"),
        heimaVideo(54, "聊天页面开发", "23:05"),
      ],
      officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
      migrations: [],
      exercise: {
        prompt: "画出并用函数名表达离线 indexing 与在线 retrieval 两条流程，说明每一步的失败状态。",
        starterCode: `def index_document(path):\n    pass\n\ndef answer(question, thread_id):\n    pass`,
        solution: `def index_document(path):\n    docs = load(path)\n    chunks = split(docs)\n    return vector_store.add_documents(chunks)\n\ndef answer(question, thread_id):\n    docs = retriever.invoke(question)\n    return rag_chain.invoke({"question": question, "context": format_docs(docs)})`,
      },
    },
    {
      id: "agent-v1",
      title: "LangChain v1 Agent 与中间件",
      summary: "对应第 55–59 节，使用 create_agent 理解工具调用、流式更新和中间件。",
      minutes: 75,
      guide: [
        {
          title: "Agent 是模型与工具之间的受控循环",
          body: "create_agent 根据模型输出决定是否调用工具，把 Observation 放回消息，再继续推理直到生成最终回答。工具描述、参数 schema 和错误结果都是模型可见契约，不能只关注 Python 函数能否执行。",
          bullets: ["工具输入必须可验证", "每次调用保留真实 Observation", "限制步数和外部权限"],
          example: `from langchain.agents import create_agent\n\nagent = create_agent(model, tools=[search_docs], system_prompt="只根据工具结果回答")`,
        },
        {
          title: "中间件用于横切控制",
          body: "中间件适合统一处理动态提示词、模型选择、工具过滤、摘要和人工审批。它不应隐藏业务主流程，也不应把失败改写为成功；调试时需要知道错误发生在模型、工具还是中间件。",
          bullets: ["只为重复的横切需求使用", "保持调用顺序可观察", "不要吞掉工具异常"],
          example: `agent = create_agent(\n    model,\n    tools=[search_docs],\n    middleware=[summarization_middleware],\n)`,
        },
      ],
      videos: [
        heimaVideo(55, "Agent 智能体介绍", "06:28"),
        heimaVideo(56, "Agent 智能体初体验", "12:20"),
        heimaVideo(57, "Agent 的流式输出", "14:53"),
        heimaVideo(58, "Agent 的 ReAct 行动框架", "09:43"),
        heimaVideo(59, "Agent 的 middleware 中间件", "14:59"),
        {
          title: "Functions, Tools and Agents with LangChain",
          url: DLAI_AGENTS,
          provider: "DeepLearning.AI",
          language: "英文",
          duration: "1 小时 54 分",
          note: "补充工具与 Agent 思维；旧 Agent API 需对照本站迁移卡。",
        },
      ],
      officialSources: [
        { label: "LangChain agents", url: AGENTS },
        { label: "LangChain v1 release", url: LANGCHAIN_V1 },
      ],
      migrations: [
        {
          title: "create_react_agent → create_agent",
          status: "replaced",
          explanation: "LangChain v1 将 create_agent 设为标准 Agent 构造入口，底层仍使用 LangGraph 运行时。",
          beforeCode: `from langgraph.prebuilt import create_react_agent\nagent = create_react_agent(model, tools)`,
          afterCode: `from langchain.agents import create_agent\nagent = create_agent(model, tools=tools)`,
          officialSources: [
            { label: "LangChain v1 release", url: LANGCHAIN_V1 },
            { label: "LangChain v1 migration", url: LANGCHAIN_MIGRATION },
          ],
          verifiedAt: VERIFIED_AT,
          verifiedVersions: VERIFIED_VERSIONS,
        },
      ],
      exercise: {
        prompt: "把旧 create_react_agent 示例迁移到 create_agent，并保留同一工具列表。",
        starterCode: `from langgraph.prebuilt import create_react_agent\nagent = create_react_agent(model, tools)`,
        solution: `from langchain.agents import create_agent\nagent = create_agent(model, tools=tools)`,
      },
    },
    {
      id: "agent-rag-project",
      title: "Agent + RAG 综合项目",
      summary: "对应第 60–67 节，把日志、配置、检索工具、中间件和 Agent 组合成一条可调试路径。",
      minutes: 150,
      guide: [
        {
          title: "先定义工具契约，再连接 Agent",
          body: "检索总结、文件读取等能力先作为独立函数验证，再注册为工具。Agent 只负责判断何时调用；配置、路径和知识库状态由各自模块管理，避免所有逻辑堆进一个提示词或中间件。",
          bullets: ["工具可独立调用和测试", "路径限制在允许目录", "返回结构包含结果与来源"],
          example: `@tool\ndef search_knowledge(query: str) -> str:\n    """检索本地知识库并返回带来源片段。"""\n    return format_docs(retriever.invoke(query))`,
        },
        {
          title: "日志记录真实事件而非漂亮结果",
          body: "模型请求、工具调用、耗时、异常类型和最终回答应分开记录。日志不能包含 API Key，也不能在失败时写入“完成”。先有可观察性，才有资格优化 Agent 的提示词和检索效果。",
          bullets: ["密钥和完整敏感内容不入日志", "记录工具输入摘要与状态", "失败保留原始阶段"],
          example: `logger.info("tool_complete", extra={"tool": "search_knowledge", "count": len(docs)})`,
        },
      ],
      videos: [
        heimaVideo(60, "Agent 智能体项目介绍", "05:55"),
        heimaVideo(62, "配置、文件与提示词工具", "28:58"),
        heimaVideo(65, "Agent 项目 tools 开发", "21:56"),
        heimaVideo(66, "中间件和 Agent 创建", "38:43"),
        heimaVideo(67, "Agent 项目用户界面", "17:28"),
      ],
      officialSources: [{ label: "LangChain agents", url: AGENTS }],
      migrations: [],
      exercise: {
        prompt: "为 RAG 工具定义输入、输出、允许失败和日志字段，确保任何失败都不会返回伪答案。",
        starterCode: `def search_knowledge(query: str):\n    pass`,
        solution: `def search_knowledge(query: str):\n    docs = retriever.invoke(query)\n    if not docs:\n        return {"answer": None, "sources": [], "status": "no_results"}\n    return {"answer": format_docs(docs), "sources": [d.metadata.get("source") for d in docs], "status": "ok"}`,
      },
    },
    {
      id: "model-messages-prompts",
      title: "模型、消息与 Prompt 模板",
      prerequisites: ["memory-modernization"], difficulty: "beginner", tags: ["messages", "prompts"],
      summary: "从单次模型调用开始，区分 system、human 消息和可复用提示模板。",
      minutes: 35,
      guide: [
        { title: "消息是有角色的输入", body: "system 约束行为，human 描述当前任务，assistant 是历史结果。明确角色比把所有内容拼成一段字符串更容易调试。", bullets: ["先固定输入变量", "不要把用户文本当系统规则", "记录最终消息序列"], example: `from langchain_core.messages import SystemMessage, HumanMessage\nmessages = [SystemMessage(\"你是 Python 导师\"), HumanMessage(\"解释列表\")]` },
        { title: "模板让变化显式", body: "Prompt 模板只负责生成消息。渲染后先检查变量，再交给模型，缺变量应立即失败。", bullets: ["变量命名稳定", "输出结构交给 parser", "不在模板中执行工具"], example: `from langchain_core.prompts import ChatPromptTemplate\nprompt = ChatPromptTemplate.from_messages([(\"system\", \"你是导师\"), (\"human\", \"解释 {topic}\")])` },
        { title: "运行前预测消息", body: "完成“模型、消息与 Prompt 模板”时，先写出 topic 被替换后的两条消息，再调用模板。预测能帮助你区分模板渲染问题和模型请求问题。", bullets: ["确认变量名一致", "检查消息顺序", "再调用 invoke"], example: `messages = prompt.invoke({"topic": "RAG"})\nprint(messages.messages)` },
      ],
      videos: [heimaVideo(12, "提示词模板与消息", "24:00"), { title: "LangChain for LLM Application Development", url: DLAI_LANGCHAIN, provider: "DeepLearning.AI", language: "英文", duration: "约 1 小时", note: "补充消息、模板与输出解析。" }],
      officialSources: [{ label: "LangChain agents", url: AGENTS }],
      migrations: [{
        title: "从旧 LLMChain 迁移到 Runnable 管道",
        status: "replaced",
        explanation: "LangChain v1 以 Runnable 组合表达模板和模型；把可观察的步骤写成管道，并使用 invoke 传入变量。",
        beforeCode: "chain = LLMChain(llm=model, prompt=prompt)\nchain.run(topic=\"RAG\")",
        afterCode: "chain = prompt | model\nchain.invoke({\"topic\": \"RAG\"})",
        officialSources: [{ label: "LangChain v1", url: LANGCHAIN_V1 }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }], project: false, projectLinks: [],
      exercise: { prompt: "创建一个包含 system 与 human 消息的模板，接收 topic 变量并返回消息列表。", starterCode: `topic = \"\"\nmessages = []`, solution: `from langchain_core.prompts import ChatPromptTemplate\nprompt = ChatPromptTemplate.from_messages([(\"system\", \"你是导师\"), (\"human\", \"解释 {topic}\")])\nmessages = prompt.invoke({\"topic\": topic})` },
    },
    {
      id: "structured-output",
      title: "结构化输出与失败边界",
      prerequisites: ["model-messages-prompts"], difficulty: "beginner", tags: ["structured-output", "validation"],
      summary: "用 schema 约束模型结果，并区分解析失败和业务字段缺失。",
      minutes: 40,
      guide: [
        { title: "结构不是字符串约定", body: "当下游需要字段时，用 Pydantic 或 JSON schema 验证，而不是猜测逗号和换行。缺字段就是失败。", bullets: ["字段类型写进 schema", "保留原始解析错误", "验证失败停止下游"], example: `from pydantic import BaseModel\nclass Answer(BaseModel):\n    summary: str\n    confidence: float` },
        { title: "失败必须可追踪", body: "记录模板、请求和解析的阶段，保留异常类型；不要把错误改成空对象或默认回答。", bullets: ["边界状态显式", "不吞异常", "测试缺字段输入"], example: `answer = model.with_structured_output(Answer).invoke(messages)` },
        { title: "结构化输出的常见误区", body: "完成“结构化输出与失败边界”时，不要把解析失败改成空字典或把字符串强行当作合法结果；字段缺失应停在解析边界并保留真实错误。", bullets: ["区分解析与业务失败", "拒绝缺失字段", "保留异常类型"], example: `Answer.model_validate({"summary": "ok", "confidence": 0.8})` },
      ],
      videos: [{ title: "LangChain structured output", url: DLAI_LANGCHAIN, provider: "DeepLearning.AI", language: "英文", duration: "约 1 小时", note: "补充结构化输出与解析边界。" }],
      officialSources: [{ label: "LangChain agents", url: AGENTS }],
      migrations: [{
        title: "从手写解析器迁移到结构化输出",
        status: "replaced",
        explanation: "旧教程常用 StructuredOutputParser 拼接格式说明；新版优先让模型绑定明确 schema，并让验证失败保留原始异常。",
        beforeCode: "parser = StructuredOutputParser.from_response_schemas(schemas)\nresult = parser.parse(text)",
        afterCode: "result = model.with_structured_output(Answer).invoke(messages)",
        officialSources: [{ label: "LangChain agents", url: AGENTS }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }], project: false, projectLinks: [],
      exercise: { prompt: "定义 Answer schema，拒绝缺少 summary 或 confidence 的结果。", starterCode: `result = {}\nvalid = False`, solution: `from pydantic import BaseModel\nclass Answer(BaseModel):\n    summary: str\n    confidence: float\nvalid = Answer.model_validate(result)` },
    },
    {
      id: "runnable-pipeline",
      title: "Runnable 组合的第一条链",
      prerequisites: ["structured-output"], difficulty: "intermediate", tags: ["runnable", "composition"],
      summary: "把模板、模型和解析器组成可观察的 Runnable 管道。",
      minutes: 45,
      guide: [
        { title: "每一步都有输入输出", body: "Runnable 组合允许每一步单独 invoke、记录和测试。使用 | 表达顺序，避免不可检查的巨型函数。", bullets: ["单测每段输入输出", "顺序由管道表达", "步骤失败立即停止"], example: `chain = prompt | model | parser\nresult = chain.invoke({\"topic\": \"RAG\"})` },
        { title: "可观察性先于魔法", body: "链失败时必须知道是模板变量、模型请求还是解析器失败；保留原始错误才能修正。", bullets: ["为步骤命名", "记录耗时与状态", "不返回空字符串冒充成功"], example: `named = chain.with_config({\"run_name\": \"lesson-answer\"})` },
        { title: "Runnable 管道的常见误区", body: "完成“Runnable 组合的第一条链”时，不要把多个步骤藏进一个不可观察的函数，也不要在任一步失败时返回空结果；分别检查 template、model、parser 的输入输出。", bullets: ["保持步骤边界", "失败停止并留痕", "验证组合顺序"], example: `chain = template | model | parser` },
      ],
      videos: [{ title: "LangChain Expression Language", url: DLAI_LANGCHAIN, provider: "DeepLearning.AI", language: "英文", duration: "约 1 小时", note: "补充 Runnable 和组合语义。" }],
      officialSources: [{ label: "LangChain v1", url: LANGCHAIN_V1 }],
      migrations: [{
        title: "从旧 run 方法迁移到统一 invoke",
        status: "renamed",
        explanation: "Runnable 统一使用 invoke、ainvoke 或 batch 表达同步、异步和批量调用，避免在不同链类型之间记忆不同入口。",
        beforeCode: "chain.run({\"topic\": \"RAG\"})",
        afterCode: "chain.invoke({\"topic\": \"RAG\"})",
        officialSources: [{ label: "LangChain v1", url: LANGCHAIN_V1 }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }], project: false, projectLinks: [],
      exercise: { prompt: "写出 template → model → parser 的三步组合，并说明每一步输入输出。", starterCode: `template = None\nmodel = None\nparser = None`, solution: `chain = template | model | parser\nresult = chain.invoke({\"topic\": \"RAG\"})` },
    },
  ],
};

const authoredFeedbackChecks: Record<string, NonNullable<LearningLesson["browserChecks"]>> = {
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
    { name: "工具输入", expression: "tool_call.name and isinstance(tool_call.arguments, dict)", failure: "工具调用应包含名称和字典参数。", kind: "structure" },
    { name: "真实错误", expression: "tool_error is not None or tool_result is not None", failure: "工具失败或成功都必须保留真实结果。", kind: "behavior" },
  ],
  "agent-rag-project": [
    { name: "检索后引用", expression: "response.sources and response.answer", failure: "Agent RAG 回答必须同时有答案和来源。", kind: "behavior" },
    { name: "无命中停止", expression: "empty_response.answer == \"资料不足\"", failure: "无资料时 Agent 不应自行编造答案。", kind: "behavior" },
  ],
  "graph-foundations": [
    { name: "节点输出", expression: "isinstance(node_update, dict)", failure: "节点应返回局部状态更新字典。", kind: "behavior" },
    { name: "边界终点", expression: "END in graph_edges", failure: "图必须声明明确的结束边界。", kind: "structure" },
  ],
  "state-reducers-routing": [
    { name: "路由有限", expression: "route_result in {\"revise\", \"finish\"}", failure: "路由结果必须属于已声明分支。", kind: "behavior" },
    { name: "循环上限", expression: "attempts <= 2", failure: "循环应有明确的尝试次数上限。", kind: "behavior" },
  ],
  "persistence-short-memory": [
    { name: "线程键", expression: "config[\"configurable\"][\"thread_id\"]", failure: "持久化调用必须提供 thread_id。", kind: "structure" },
    { name: "恢复状态", expression: "resumed_state == saved_state", failure: "同一线程恢复时应读回检查点状态。", kind: "behavior" },
  ],
  "long-term-store": [
    { name: "用户命名空间", expression: "namespace[0] == user_id", failure: "长期记忆应按 user_id 隔离。", kind: "structure" },
    { name: "跨线程读取", expression: "store.get(namespace, key) == value", failure: "Store 应能按 namespace/key 读取值。", kind: "behavior" },
  ],
  "streaming-interrupts": [
    { name: "事件顺序", expression: "events[0].node != events[-1].node", failure: "流式事件应保留节点执行顺序。", kind: "behavior" },
    { name: "中断状态", expression: "interrupt_state.requires_approval is True", failure: "高风险步骤应留下待审核状态。", kind: "structure" },
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

for (const lesson of langchainTrack.lessons.slice(-3)) {
  if (lesson.guide.length < 3) lesson.guide.push({ title: "验证边界", body: "用一个新输入验证你的理解。", bullets: ["先预测", "再运行", "记录结果"], example: "print(result)" });
  lesson.prerequisites = lesson.id === "model-messages-prompts" ? ["memory-modernization"] : [langchainTrack.lessons[langchainTrack.lessons.findIndex((item) => item.id === lesson.id) - 1]?.id ?? "model-messages-prompts"];
  lesson.difficulty = lesson.id === "runnable-pipeline" ? "intermediate" : "beginner";
  lesson.tags = [lesson.id];
  lesson.project = false;
  lesson.projectLinks = [];
  lesson.exercise.hints = lesson.id === "model-messages-prompts" ? ["区分消息角色", "声明模板变量", "检查渲染结果"] : ["先写出结构", "保留真实错误", "用边界输入验证"];
  lesson.browserChecks = lesson.id === "model-messages-prompts"
    ? [
        { name: "消息角色", expression: "messages[0][\"role\"] == \"system\" and messages[-1][\"role\"] == \"user\"", failure: "应明确区分 system 与 user 消息。", kind: "structure" },
        { name: "模板变量", expression: "\"topic\" in prompt_variables", failure: "模板应声明题目要求的变量。", kind: "structure" },
      ]
    : lesson.id === "structured-output"
      ? [
          { name: "字段完整", expression: "isinstance(result, dict) and \"summary\" in result and \"confidence\" in result", failure: "结构化结果必须包含 summary 与 confidence。", kind: "structure" },
          { name: "置信度范围", expression: "0 <= result[\"confidence\"] <= 1", failure: "confidence 必须位于 0 到 1。", kind: "behavior" },
        ]
      : [
          { name: "管道顺序", expression: "chain_steps == [\"template\", \"model\", \"parser\"]", failure: "Runnable 应按 template → model → parser 顺序组合。", kind: "structure" },
          { name: "保留错误", expression: "pipeline_error is not None or result is not None", failure: "管道应保留真实错误或真实结果。", kind: "behavior" },
        ];
}

const langgraphTrack: LearningTrack = {
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
      migrations: [],
      exercise: {
        prompt: "创建一个接收 topic、生成 outline、再生成 answer 的两节点图。",
        starterCode: `builder = StateGraph(State)\n# 添加 outline 和 answer 节点`,
        solution: `builder = StateGraph(State)\nbuilder.add_node("outline", make_outline)\nbuilder.add_node("answer", write_answer)\nbuilder.add_edge(START, "outline")\nbuilder.add_edge("outline", "answer")\nbuilder.add_edge("answer", END)\ngraph = builder.compile()`,
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
      migrations: [],
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
      migrations: [],
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
      migrations: [],
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
      migrations: [],
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
      migrations: [],
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
      migrations: [],
      exercise: {
        prompt: "列出研究助手的 thread state、Store memory、节点和人工中断点，保证两类状态不混用。",
        starterCode: `thread_state = []\nstore_memory = []\nnodes = []\ninterrupt_before = ""`,
        solution: `thread_state = ["topic", "plan", "findings", "sources", "draft", "approved"]\nstore_memory = ["language", "report_length", "preferred_sources"]\nnodes = ["plan", "research", "review_evidence", "write_report"]\ninterrupt_before = "write_report"`,
      },
    },
  ],
};

for (const track of [langchainTrack, langgraphTrack]) {
  for (const lesson of track.lessons) {
    const checks = authoredFeedbackChecks[lesson.id];
    if (checks) lesson.browserChecks = checks;
  }
}

export const learningTracks: LearningTrack[] = [pythonTrack, langchainTrack, langgraphTrack];

const ALLOWED_VIDEO_HOSTS = new Set([
  "www.bilibili.com",
  "academy.langchain.com",
  "www.deeplearning.ai",
]);

export function validateLearningCatalog(catalog: readonly LearningTrack[]) {
  const trackIds = new Set<string>();
  for (const track of catalog) {
    if (trackIds.has(track.id)) throw new Error(`重复课程路线 ${track.id}`);
    trackIds.add(track.id);
    if (track.lessons.length === 0) throw new Error(`课程路线 ${track.id} 没有课程`);

    const lessonIds = new Set<string>();
    for (const lesson of track.lessons) {
      if (lessonIds.has(lesson.id)) throw new Error(`重复课程 ${track.id}/${lesson.id}`);
      lessonIds.add(lesson.id);
      if (lesson.guide.length < 2) throw new Error(`课程讲解不足 ${track.id}/${lesson.id}`);
      if (track.id !== "python" && lesson.videos.length === 0) {
        throw new Error(`课程缺少视频 ${track.id}/${lesson.id}`);
      }
      if (!lesson.exercise) throw new Error(`课程缺少练习 ${track.id}/${lesson.id}`);
      if (!lesson.browserChecks || lesson.browserChecks.length < 2) throw new Error(`课程反馈检查不足 ${track.id}/${lesson.id}`);
      for (const video of lesson.videos) {
        const host = new URL(video.url).hostname;
        if (!ALLOWED_VIDEO_HOSTS.has(host)) throw new Error(`不允许的视频域名 ${host}`);
      }
      for (const source of lesson.officialSources) {
        if (new URL(source.url).protocol !== "https:") {
          throw new Error(`官方来源必须使用 HTTPS ${track.id}/${lesson.id}`);
        }
      }
      for (const migration of lesson.migrations) {
        if (migration.officialSources.length === 0) {
          throw new Error(`迁移说明缺少官方来源 ${track.id}/${lesson.id}`);
        }
        if (!migration.beforeCode.trim() || !migration.afterCode.trim()) {
          throw new Error(`迁移说明缺少代码 ${track.id}/${lesson.id}`);
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(migration.verifiedAt)) {
          throw new Error(`迁移说明核验日期无效 ${track.id}/${lesson.id}`);
        }
        if (!migration.verifiedVersions.langchain || !migration.verifiedVersions.langgraph) {
          throw new Error(`迁移说明缺少核验版本 ${track.id}/${lesson.id}`);
        }
      }
    }
    if (!lessonIds.has(track.currentLessonId)) {
      throw new Error(`当前课程不存在 ${track.id}/${track.currentLessonId}`);
    }
  }
}

validateLearningCatalog(learningTracks);

export function findLearningLesson(courseId: string, lessonId: string) {
  const track = learningTracks.find((item) => item.id === courseId);
  return track?.lessons.find((item) => item.id === lessonId) ?? null;
}
