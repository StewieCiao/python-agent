# Stewie LearnOS 课程审校记录

## Phase 0–1（2026-09-02）

阶段主题核对参考了 [LangChain Academy](https://github.com/langchain-ai/langchain-academy)、[langgraph-101](https://github.com/langchain-ai/langgraph-101)、[learning-langchain](https://github.com/langchain-ai/learning-langchain) 以及 [LangChain Retrieval 官方教程](https://docs.langchain.com/oss/python/langchain/retrieval)。这些链接只作为路线参考，课程正文仍以锁定版本的官方文档为准。

- 作者目录已统一从 `app/content/catalog.ts` 生成，离线 HTML 与公开快照使用同一份数据。
- 当前课程地图：Python 64 节 / 6 个项目，LangChain-RAG 48 节 / 4 个项目，LangGraph 42 节 / 4 个项目；阶段数分别为 8 / 7 / 7。
- 路线来源复核（2026-09-04）：LangChain/RAG 参考 [pixegami/langchain-rag-tutorial](https://github.com/pixegami/langchain-rag-tutorial) 的文档问答拆解；LangGraph 参考官方 [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) 示例与 [LangChain Academy Essentials](https://academy.langchain.com/courses/langgraph-essentials-python)。仓库热度仅作筛选信号，不作为运行时依赖或课程正确性的证明。
- LangChain 草稿的官方文档已归入 `officialSources`，三节代表课分别直链 messages、structured output 与 knowledge base；视频仅使用允许的视频域名。
- 草稿具备三张讲解卡、三层提示、先修关系和行为/结构检查；适配器回归测试确认这些字段不会丢失。
- 离线版重新生成并通过无外部资源检查；模型设置、聊天和 RAG runtime 不进入离线文件。
- 开发页真实验收确认课程导师包含“用本地资料做一次 RAG 检索”面板；桌面端可通过安全文件选择器导入 TXT、Markdown、CSV 和 PDF，PDF 按页保留来源。
- `npm run build:pages` 会从同一离线快照生成 `dist-pages/index.html`；GitHub Pages 工作流可直接发布该目录。

## 验证证据

- `npm test`：254 项通过。
- 当前三条路线的扩展主题均已绑定具体练习规格，课程标题不再使用“从概念到练习”占位模板；讲解卡直接展示主题 starter 骨架并列出真实检查边界；后续仍需逐阶段补充更丰富的原创示例、迁移卡和项目验收材料。
- 桌面 RAG 面板现可对用户提供的小型问答集逐条执行真实检索并显示 recall@k、MRR、引用覆盖、引用一致性代理和耗时；模型未返回 token usage 时明确标为不可用，不估算成本。
- 个性化练习 family 现在从作者源携带六组变体和独立行为检查；覆盖 Python 输出/循环/字符串/分支/函数/容器/异常/类与对象/生成器/装饰器/文本分析/项目汇总/任务优先级/Plan-and-Solve/Reflection/记忆检索/Agent 交接/旅行助手/DeepResearch/ReAct 循环/Mini Agent 毕业项目/Tool Registry/Action 解析，以及 LangChain 消息/模型配置/Runnable、工具调用项目、文档问答项目、RAG 观测项目、结构化输出、检索链、混合检索、重排、引用、RAG 评估和 LangGraph 路由、checkpoint、Store 长期记忆、Interrupt 审批、人工审核、审核项目、多 Agent 调度项目、长期记忆项目、可恢复研究项目、Supervisor 角色交接、工具节点错误状态。Python 服务只校验签名快照中的检查，桌面 Worker 使用个性题检查而不是原关卡样例。
- 个性题生成会从当前种子位置顺序跳过最近已使用的变体；仅当近期记录覆盖全部候选时明确失败，避免同一学习者重复点击时误报。
- 项目个性化覆盖回归已锁定 14 个阶段项目（Python 6、LangChain/RAG 4、LangGraph 4）全部绑定 family；每个 family 固定六组变体并至少包含两项行为检查，防止新增项目只完成静态题面而遗漏错题闭环。
- 每节课程至少包含两项带名称、表达式和失败说明的反馈检查；旧草稿中的占位表达式已移除。
- `npm run lint -- --max-warnings=0`：通过。
- `npm run build`：通过。
- GitHub Pages 工作流包含官方 Pages 配置动作，推送 `main` 后自动发布 `dist-pages` 静态入口。
- 零部署入口审查确认：Pages 只发布单一自包含 `index.html`，不会依赖仓库子路径之外的资源。
- `git diff --check`：通过。
- 项目自带 Python 3.13.15 运行环境准备完成；内置运行时 `python-runtime` 59 项测试与 packaged smoke 均通过（LangChain 1.2.12、LangGraph 1.1.2、pypdf 6.16.2、SQLite FTS5）。测试包含 RAG 空问题、重排 top_k、Agentic RAG 无命中、Supervisor 角色失败、个性题重复轮换边界，打包复制清单包含 Tutor 图所需模块，桌面包可完成真实健康握手。
- packaged renderer smoke 已验证 Python 执行与安全存储失败边界：失败时保留真实原因且不留下半成品配置；当前环境未提供可用系统钥匙串，因此未伪造成功分支。
- `npm run desktop:package` 已实际生成 macOS arm64 应用包；打包过程自动准备锁定的 Python 与 LangChain/LangGraph 运行时，目标电脑无需另装 Node.js 或 Python。
- `npm run desktop:make` 已生成 macOS arm64 DMG（`desktop/out/make/Stewie-LearnOS.dmg`），可作为跨电脑分发的安装入口。
- GitHub Pages 已部署至 `https://stewieciao.github.io/python-agent/`；macOS 与 Windows x64 打包验证通过。Windows arm64 当前会被上游 `workerd` 的平台包限制阻断，未伪造可下载产物。
- Python 基础与项目课已补齐逐课官方来源映射，生成快照和离线 HTML 均由作者目录重新生成并通过来源完整性测试。
- Python 基础路线已补齐从输出、变量、字符串、分支、循环、函数到 Agent 基础的先修链，并由回归测试验证关键节点。
- 三条路线的课程按顺序连续分配到阶段，阶段索引与课程归属经过一致性校验；正式目录转换会保留 `familyId`，个性化练习关联不会丢失。
- LangChain/RAG 与 LangGraph 作者源已为每节框架课直接提供三张讲解卡、三层提示、连续先修关系和至少一张 API 迁移卡；缺失内容会在作者目录导入时明确失败，不再静默补写。
- `npm run build:pages` 已重新生成单一 `dist-pages/index.html`（395480 bytes），未发现外部脚本、图片或样式引用；快照包含 64/48/42 节课程和 6/4/4 个项目。

## 尚未完成的内容审校

Phase 2–8 仍需逐阶段扩充每课的原创示例、迁移卡和项目 README，并在桌面端逐路线抽查执行、复习和个性化题目闭环。当前已完成代表课深化：LangGraph 的 `graph-foundations`、`state-reducers-routing`、`checkpoint-configuration`、`persistence-short-memory`、`long-term-store`、`streaming-interrupts`、`subgraphs-parallelism`、`supervisor-routing`、`tool-node-boundaries`，以及 LangChain 的 `model-messages-prompts`、`model-configuration`、`structured-output`、`retrieval-chain`、`rag-evaluation`、`hybrid-retrieval`、`reranking`、`citation-grounded-generation`。这些课程分别锁定输入/输出契约、真实中间状态、checkpoint 恢复、Supervisor 角色交接、工具错误状态、配置/超时边界、混合检索阈值、重排与 top_k、召回/引用指标、引用来源约束和可运行最小骨架；Python 工程主题还加入 HTTP 状态与超时、SQLite 事务提交与失败回滚、本地 API Key 脱敏、日志脱敏的显式契约。回归测试覆盖对应教学契约。RAG 评测结果已写入 SQLite，可按课程哈希、资料哈希和 Embedding 模型查看最近记录；当前地图已保证结构、可浏览性和基础行为验证，项目级教学质量仍需继续验收。
本轮新增的 `human-review-state` 代表课把 interrupt 推进为 pending_review、approve、reject 三种可验证状态，并由回归测试锁定未知决定不得默认批准。
