import type { LearningTrack, VideoResource } from "../authoring/types.ts";
import { langchainChecks, langchainHints } from "./metadata.ts";

const VERIFIED_AT = "2026-09-02";
const VERIFIED_VERSIONS = { langchain: "1.2.12", langgraph: "1.1.2" };
const HEIMA = "https://www.bilibili.com/video/BV1yjz5BLEoY";
const DLAI_LANGCHAIN = "https://www.deeplearning.ai/short-courses/langchain-for-llm-application-development/";
const DLAI_DATA = "https://www.deeplearning.ai/short-courses/langchain-chat-with-your-data/";
const DLAI_AGENTS = "https://www.deeplearning.ai/short-courses/functions-tools-agents-langchain/";
const DLAI_MEMORY = "https://www.deeplearning.ai/short-courses/long-term-agentic-memory-with-langgraph/";
const LANGCHAIN_V1 = "https://docs.langchain.com/oss/python/releases/langchain-v1";
const LANGCHAIN_MESSAGES = "https://docs.langchain.com/oss/python/langchain/messages";
const LANGCHAIN_STRUCTURED_OUTPUT = "https://docs.langchain.com/oss/python/langchain/structured-output";
const LANGCHAIN_KNOWLEDGE_BASE = "https://docs.langchain.com/oss/python/langchain/knowledge-base";
const LANGCHAIN_MIGRATION = "https://docs.langchain.com/oss/python/migrate/langchain-v1";
const MEMORY_OVERVIEW = "https://docs.langchain.com/oss/python/concepts/memory";
const SHORT_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/short-term-memory";
const LONG_TERM_MEMORY = "https://docs.langchain.com/oss/python/langchain/long-term-memory";
const RETRIEVAL = "https://docs.langchain.com/oss/python/langchain/retrieval";
const AGENTS = "https://docs.langchain.com/oss/python/langchain/agents";
function heimaVideo(page: number, title: string, duration: string): VideoResource {
  return { title, url: `${HEIMA}?p=${page}`, provider: "黑马程序员", language: "中文", duration, note: `主线课程第 ${page} 节；站内讲义会标出与当前官方 API 的差异。` };
}
export const langchainTrack: LearningTrack = {
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
          body: "完成“记忆：会话历史、短期状态与长期记忆”时，LangChain v1 的 Agent 以 LangGraph 为运行时。给 create_agent 传入 checkpointer，再在调用配置中提供 thread_id，状态会按线程保存。开发时可用 InMemorySaver，持久化环境应使用官方数据库 checkpointer。",
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
        {
          title: "文档加载器与统一 Document 的常见误区",
          body: "完成“文档加载器与统一 Document”时，不要把读取成功当成内容可信，也不要丢弃 source 或 page metadata；先检查正文和来源，再进入切分。",
          bullets: ["读取和回答分开", "来源字段不可丢", "解析错误保留原样"],
          example: `print(docs[0].metadata)`,
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
      migrations: [{
        title: "从社区 Loader 迁移到统一 Document 契约",
        status: "renamed",
        explanation: "Loader 的核心产物是带 page_content 和 metadata 的 Document；旧教程中直接传递字符串的写法需要先显式转换并保留来源。",
        beforeCode: "text = open(\"guide.txt\").read()",
        afterCode: "docs = TextLoader(\"guide.txt\").load()\ntext = docs[0].page_content",
        officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
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
        {
          title: "切分、嵌入与向量存储的常见误区",
          body: "完成“切分、嵌入与向量存储”时，不要把 top-k 当成答案正确率，也不要在写入向量时删除 chunk 的来源；召回后仍要核验文本和 metadata。",
          bullets: ["chunk 保留来源", "距离不是可信度", "召回结果需要复核"],
          example: `results = vector_store.similarity_search("退款", k=2)`,
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
      migrations: [{
        title: "从手写向量字典迁移到 Vector Store",
        status: "replaced",
        explanation: "索引流程统一为切分、嵌入和 Vector Store 写入；不要自己维护文本到向量的平行字典而丢失 metadata。",
        beforeCode: "vectors = {text: embed(text) for text in texts}",
        afterCode: "chunks = splitter.split_documents(docs)\nvector_store.add_documents(chunks)",
        officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
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
        {
          title: "从 Retriever 到可核验的 RAG 回答的常见误区",
          body: "完成“从 Retriever 到可核验的 RAG 回答”时，不要跳过召回检查直接调用模型，也不要在空 context 时猜测答案；把 question、context 和来源分别观察。",
          bullets: ["先看召回片段", "空资料明确反馈", "回答保留真实来源"],
          example: `context = format_docs(retriever.invoke(question))`,
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
      migrations: [{
        title: "从旧 chain.run 迁移到 Retriever + Runnable",
        status: "replaced",
        explanation: "新版检索链把 context 和 question 的输入形状写清楚，并使用 invoke；空召回应在生成前明确停止。",
        beforeCode: "answer = qa_chain.run(question)",
        afterCode: "docs = retriever.invoke(question)\nanswer = rag_chain.invoke({\"question\": question, \"context\": format_docs(docs)})",
        officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
      exercise: {
        prompt: "输入是 question 字符串、documents 列表和 top_k；输出是 retrieved 候选列表与可传给 prompt 的 context。请先完成一个可观察的关键词检索：结果不超过 top_k，无命中时 retrieved 为空且 context 明确为“没有检索到资料”，再映射到 Retriever + Runnable。",
        starterCode: `question = "退款"\ndocuments = [\n    {"text": "退款期限为七天", "source": "policy.md"},\n    {"text": "客服联系邮箱见首页", "source": "contact.md"},\n]\ntop_k = 1\n\ndef retrieve(question, documents, top_k):\n    pass\n\nretrieved = []\ncontext = ""`,
        solution: `question = "退款"\ndocuments = [\n    {"text": "退款期限为七天", "source": "policy.md"},\n    {"text": "客服联系邮箱见首页", "source": "contact.md"},\n]\ntop_k = 1\n\ndef retrieve(question, documents, top_k):\n    matches = [document for document in documents if question in document["text"]]\n    return matches[:top_k]\n\nretrieved = retrieve(question, documents, top_k)\ncontext = "没有检索到资料" if not retrieved else "\\n".join(\n    f"来源: {document['source']}\\n{document['text']}" for document in retrieved\n)`,
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
        {
          title: "RAG 项目：上传、索引、检索与会话的常见误区",
          body: "完成“RAG 项目：上传、索引、检索与会话”时，不要把索引半成品标为成功，也不要把历史、检索失败和模型失败混成一种状态；每一步都保留可追踪结果。",
          bullets: ["索引完成后再写状态", "区分三类失败", "会话和知识库分离"],
          example: `status = {"index": "ready", "retrieval": "ok", "answer": "ok"}`,
        },
      ],
      videos: [
        heimaVideo(46, "RAG 项目案例介绍", "06:17"),
        heimaVideo(49, "知识库更新服务", "19:03"),
        heimaVideo(52, "RAG 服务核心代码", "14:22"),
        heimaVideo(54, "聊天页面开发", "23:05"),
      ],
      officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
      migrations: [{
        title: "从单体 QA Chain 迁移到离线/在线分层",
        status: "replaced",
        explanation: "将上传索引与在线检索拆成可重跑的两个流程；索引失败不能留下半成品，回答阶段只使用已验证的 retriever。",
        beforeCode: "answer = qa_chain.run(question)",
        afterCode: "index_document(path)\ndocs = retriever.invoke(question)\nanswer = rag_chain.invoke({\"question\": question, \"context\": format_docs(docs)})",
        officialSources: [{ label: "LangChain retrieval", url: RETRIEVAL }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
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
        {
          title: "LangChain v1 Agent 与中间件的常见误区",
          body: "完成“LangChain v1 Agent 与中间件”时，不要让中间件隐藏工具异常或把 Agent 变成无限循环；工具输入、Observation 和步数边界都要可观察。",
          bullets: ["工具失败保留原因", "限制循环步数", "横切逻辑不要吞错"],
          example: `agent = create_agent(model, tools=[search_docs])`,
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
        {
          title: "Agent + RAG 综合项目的常见误区",
          body: "完成“Agent + RAG 综合项目”时，不要把日志中的成功文案当作真实结果，也不要让 Agent 绕过检索工具直接编造；先验证工具，再观察每次调用和来源。",
          bullets: ["日志记录真实状态", "无命中明确停止", "来源随回答返回"],
          example: `event = {"tool": "search_knowledge", "status": "ok"}`,
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
      migrations: [{
        title: "从 AgentExecutor 迁移到 LangChain v1 Agent",
        status: "replaced",
        explanation: "LangChain v1 使用 create_agent 作为标准入口；RAG 工具仍需先独立验证，再交给 Agent 调度。",
        beforeCode: "agent = AgentExecutor.from_agent_and_tools(agent=old_agent, tools=tools)",
        afterCode: "agent = create_agent(model, tools=[search_knowledge])",
        officialSources: [{ label: "LangChain agents", url: AGENTS }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }],
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
      officialSources: [{ label: "LangChain messages", url: LANGCHAIN_MESSAGES }],
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
      exercise: { prompt: "输入是一个 topic 字符串；输出是按顺序排列的 messages 列表。请先用纯 Python 字典表达 system 与 user 角色，并声明 prompt_variables，再把同一结构映射到 ChatPromptTemplate。", starterCode: `topic = \"RAG\"\nprompt_variables = []\nmessages = []`, solution: `topic = \"RAG\"\nprompt_variables = [\"topic\"]\nmessages = [\n    {\"role\": \"system\", \"content\": \"你是导师\"},\n    {\"role\": \"user\", \"content\": f\"解释 {topic}\"},\n]` },
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
      officialSources: [{ label: "LangChain structured output", url: LANGCHAIN_STRUCTURED_OUTPUT }],
      migrations: [{
        title: "从手写解析器迁移到结构化输出",
        status: "replaced",
        explanation: "旧教程常用 StructuredOutputParser 拼接格式说明；新版优先让模型绑定明确 schema，并让验证失败保留原始异常。",
        beforeCode: "parser = StructuredOutputParser.from_response_schemas(schemas)\nresult = parser.parse(text)",
        afterCode: "result = model.with_structured_output(Answer).invoke(messages)",
        officialSources: [{ label: "LangChain structured output", url: LANGCHAIN_STRUCTURED_OUTPUT }],
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
      officialSources: [{ label: "LangChain knowledge base", url: LANGCHAIN_KNOWLEDGE_BASE }],
      migrations: [{
        title: "从旧 run 方法迁移到统一 invoke",
        status: "renamed",
        explanation: "Runnable 统一使用 invoke、ainvoke 或 batch 表达同步、异步和批量调用，避免在不同链类型之间记忆不同入口。",
        beforeCode: "chain.run({\"topic\": \"RAG\"})",
        afterCode: "chain.invoke({\"topic\": \"RAG\"})",
        officialSources: [{ label: "LangChain knowledge base", url: LANGCHAIN_KNOWLEDGE_BASE }],
        verifiedAt: VERIFIED_AT,
        verifiedVersions: VERIFIED_VERSIONS,
      }], project: false, projectLinks: [],
      exercise: { prompt: "写出 template → model → parser 的三步组合，并说明每一步输入输出。", starterCode: `template = None\nmodel = None\nparser = None`, solution: `chain = template | model | parser\nresult = chain.invoke({\"topic\": \"RAG\"})` },
    },
  ],
};

for (const [index, lesson] of langchainTrack.lessons.entries()) {
  if (index > 0 && (!lesson.prerequisites || lesson.prerequisites.length === 0)) {
    lesson.prerequisites = [langchainTrack.lessons[index - 1].id];
  }
  const hints = langchainHints[lesson.id];
  if (!hints) throw new Error(`langchain-rag/${lesson.id} 缺少作者提示`);
  lesson.exercise.hints = [...hints];
  const checks = langchainChecks[lesson.id];
  if (checks) lesson.browserChecks = checks;
}
