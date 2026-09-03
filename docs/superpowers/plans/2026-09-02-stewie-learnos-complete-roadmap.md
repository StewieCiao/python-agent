# Stewie LearnOS 完整零部署学习平台实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Every task uses `superpowers:test-driven-development`; every gate uses `superpowers:requesting-code-review` and `superpowers:verification-before-completion`.

**Goal:** 将 Stewie LearnOS 升级为任何用户下载安装后即可使用的本地优先学习平台：三条从入门到实战的完整课程、基于错题的可解释个性化练习、带引用和评测的本地 RAG、LangGraph 自适应导师，以及不泄漏 API Key 的本地模型配置。

**Architecture:** Electron 是完整版的唯一运行容器，主进程独占模型 HTTP 与操作系统密钥存储；内置 Python 服务独占 SQLite、课程快照、个性化、RAG 和 Tutor Graph；不可信学习者代码只在隔离 Worker/runner 中执行。浏览器开发版复用 renderer，离线 HTML 只包含公开课程正文、编辑器和答案，不包含模型、聊天、RAG 或桌面桥。

**Tech Stack:** Electron Forge 44、React 19、TypeScript 5.9、vinext/Vite、内置 Python 3.13.15、LangChain 1.2.12、LangGraph 1.1.2、langgraph-checkpoint-sqlite 2.0.6、Pyodide 314.0.3、SQLite、Node test runner、Python unittest。

**Spec:** `docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md`；Gate 2 基础方案：`docs/superpowers/plans/2026-09-02-stewie-learnos-gate-2-curriculum-source.md`。

## Global Constraints

- 最终交付是 Windows 10/11 与 macOS 13+ 的安装包；用户不安装 Node、Python、Docker、依赖或手动启动服务器。
- API Key 只进入系统钥匙串；不能回退到 localStorage、明文文件、环境变量、SQLite、renderer、Python learner、日志、导出或 RAG 文档。
- 浏览器不直连模型；所有模型调用走 Electron main 的一个 OpenAI-compatible `ModelClient`，Ollama/通义只通过同一协议与用户配置表达。
- 连接测试、聊天、embedding、写入、运行和导入不自动重试；每个边界只设置一个明确 timeout，并保留真实错误。
- 上游失败、RAG 资料不足、题目生成失败不得伪造成功、空回答、无引用回答或“已生成”状态。
- `app/content/catalog.ts` 是唯一课程作者根；完整版、浏览器和离线版由 public snapshot 派生，Python service/runner 由 service snapshot 派生。
- 课程文字、题目、答案和讲义原创；官方文档决定 API 语义，高星 GitHub 项目只用于路线覆盖核对。
- 课程判题优先真实行为测试；只有题目明确要求语法构造时才用作用域感知 AST，不使用源码 substring/count 代替执行。
- 新增 helper 必须有至少两个真实调用方；不提前建立 provider adapter、repository、泛化 retry 或未来协议。
- 每个 Task 先写失败测试，确认失败原因，再写最小实现；每阶段都执行 `git diff --check`、测试、lint、TypeScript、catch/retry/fallback 搜索和 diff review。

---

## 0. 当前基线与路线来源

### 已完成基线

当前分支 `codex/stewie-learning-site` 已完成 Gate 1，并已开始 Gate 2：

- Gate 1：桌面安装包运行时、系统密钥串、本地 SQLite、模型主进程边界、Worker 超时和判题回归。
- Gate 2 已落地：schema/invariant、39 个现有 lesson 的聚合适配、public/service 快照、离线与 renderer 的 public 消费。
- 现有提交基线：`7be691a`；最近 Gate 2 进度提交包括 `6ebb044`、`38bc242`。
- 已完成：Python service 快照启动校验、Electron 双哈希校验、旧作者源清理、三课课程地图、个性化练习、带引用 RAG、离线发布和最终发行验证。
- 仍未完成：Tutor Graph 的真实状态编排，以及三条路线各阶段项目的深度实现与人工演示验收。

### 路线参考与取舍

1. LangChain 官方仓库与官方文档：先理解模型/消息、结构化输出、工具、middleware、检索和 agents，再进入 LangGraph；旧 `Memory` 类只能放入迁移卡。
2. LangGraph 官方仓库与 Graph API/Persistence/Interrupts 文档：先学 State、Node、Edge、条件路由和循环，再学 checkpoint、Store、interrupt、并行和子图。
3. DataTalksClub LLM Zoomcamp：用于检查 RAG 是否覆盖数据摄取、chunking、向量检索、agentic RAG、评测和监控。
4. Datawhale `hello-agents`：用于中文 Agent/工具/记忆/DeepResearch 覆盖核对。
5. LangChain Academy 与 DeepLearning.AI：作为视频/实验补充；视频中的旧 API 只能通过迁移卡标识风险，不直接成为主线代码。

### 三课最终规模

- Python：8 个阶段、至少 64 节、6 个渐进项目。
- LangChain/RAG：7 个阶段、至少 48 节、4 个项目。
- LangGraph：7 个阶段、至少 42 节、4 个项目。
- Gate 2/3 期间不批量伪造课程；每节课必须有初学者讲义、原创示例、误区、可执行练习、分层提示、答案、标签、来源、适用版本和代表性测试。

---

## Gate 2：收口单一课程源

已有详细方案见 `docs/superpowers/plans/2026-09-02-stewie-learnos-gate-2-curriculum-source.md`。继续执行其未完成项，不另建第二套数据格式。

### Task 1：完成 service snapshot 与双端哈希启动校验

**Files:**

- Create: `python-runtime/catalog.py`
- Create: `python-runtime/tests/test_catalog.py`
- Create: `desktop/src/catalogBundle.mts`
- Modify: `python-runtime/service.py`, `python-runtime/tests/test_service.py`
- Modify: `scripts/prepare-python-runtime.mjs`
- Modify: `desktop/src/pythonService.mts`, `desktop/src/main.ts`
- Test: `tests/pythonServiceProtocol.test.mjs`, packaged smoke tests

**Contract:** `load_learning_bundle(path)` 只读固定 `learning-service.json`，严格验证 `stewie-catalog-v1`、内容重算的 `catalogHash`/`familyHash` 和 lesson id；失败直接报告真实原因。Electron 在开窗前重算 public 内容哈希，并与 Python health 返回的已重算值比较，任一不一致都停止启动。

- [ ] 先写错误 schema、内容改写、checks 改写和文件损坏四个 table-driven 失败用例。
- [ ] 运行 Python 测试确认因 loader 不存在/拒绝缺失哈希而红灯。
- [ ] 实现 Node/Python 一致的 canonical JSON；不接受旧格式、第二路径或空对象。
- [ ] 将 service JSON 纳入 Python runtime source fingerprint 与 packaged copy。
- [ ] 修改 health metadata 的严格协议解析和 Electron 启动边界。
- [ ] 运行 `npm test`、Python unittest、两种 typecheck、lint、package smoke。
- [ ] 提交：`feat: verify packaged curriculum bundle`。

### Task 2：删除重复作者源并完成 Gate 2 审校

**Files:**

- Delete: `app/lib/learningCatalog.ts`, `app/lib/lessonGuides.ts`, `app/lib/solutions.ts`, `app/lib/curriculum.ts`（仅在所有调用方已迁移后删除）
- Modify: `tests/judging-regression.test.mjs`, `tests/offline-html.test.mjs`, `tests/learning-bundle.test.mjs`
- Delete/merge: `tests/learning-catalog.test.mjs`, `tests/lesson-guides.test.mjs` 的重复 field-presence cases
- Complete: `docs/curriculum-review.md`

- [ ] 先把 judging regression 改读 service/public snapshot，确认伪通过矩阵仍通过。
- [ ] `rg` 确认业务代码不再导入旧作者模块，再删除旧模块。
- [ ] 为每个现有 stage 完成官方来源、版本/日期、初学者解释、原创可运行示例、误区、代表性 lesson 五项审校记录。
- [ ] 重建 offline HTML，验证课程正文/题目/提示/答案存在，profile/Key/chat/RAG runtime/desktop bridge 不存在。
- [ ] 提交：`refactor: establish reviewed curriculum source`。

**Gate 2 evidence:** 一个作者根、两份生成快照、相同且重算的哈希、无重复课程列表、离线 public-only、普通测试不联网。

---

## Gate 3：可信练习与个性化基础

### Task 3：定义可追溯的 exercise family

**Files:**

- Create: `app/exercises/schema.ts`, `app/exercises/families.ts`
- Create: `python-runtime/exercises.py`, `python-runtime/tests/test_exercises.py`
- Modify: `app/content/schema.ts`, `scripts/build-learning-bundle.mjs`, generated snapshots
- Test: `tests/exercise-family.test.mjs`

**Contract:** 每个可个性化 lesson 只引用一个 family id；family 描述输入生成规则、约束、答案验证器版本、难度等级和错误模式，不保存 API Key 或用户内容。Python validator 只接收 schema-checked family payload，不从源码文字猜测。

- [ ] 先写 family 缺字段、未知 lesson、未知难度、validator 输出结构错误的失败测试。
- [ ] 为 Python 基础 25 课和后续新增课建立少量真实 family；重复规则用数据表表达，不复制每节课一套 if 链。
- [ ] 为每个 family 提供至少三组未出现在 starter 的输入，并保留实际/期望/规则反馈。
- [ ] 让 `familyHash` 来自 family payload；attempt 保存 `catalogHash`、`familyHash` 和 family version。
- [ ] 运行已有判题矩阵，确认正确替代写法继续通过、伪通过继续失败。
- [ ] 提交：`feat: add trusted exercise families`。

### Task 4：掌握度、错题模式与复习调度

**Files:**

- Create: `python-runtime/mastery.py`
- Create: `python-runtime/tests/test_mastery.py`
- Modify: `python-runtime/storage.py`, migrations, protocol and TypeScript bridge
- Test: `tests/mastery.test.mjs`

**Contract:** `record_attempt(lesson_id, family_id, outcome, mistake_codes, created_at)` 只保存非敏感事件；`compute_mastery(events, now)` 是无 IO 纯函数；`select_review_queue(mastery, now)` 只返回已知 lesson/family。错误模式来自真实测试结果（如 `missing-loop`, `boundary-error`），不是模型自由分类。

- [ ] 先写同一事件序列的确定性掌握度/复习队列失败测试，覆盖新课、连续失败、成功后复习、7 天逾期和无事件。
- [ ] 建立一次 SQLite 迁移，保存 attempt 与 mistake code，不复制课程正文。
- [ ] 失败时保留原始结果，不能把未知事件变成默认 mastery。
- [ ] 通过 Python/Node 合同测试和清除/历史隔离测试后提交：`feat: track mastery and review state`。

### Task 5：个性化题目生成的安全闭环

**Files:**

- Create: `python-runtime/personalization.py`
- Create: `python-runtime/tests/test_personalization.py`
- Create: `desktop/src/personalizationGateway.mts`（仅在有真实 service caller 后创建）
- Modify: service protocol、main model gateway、renderer review UI
- Test: `tests/personalization.test.mjs`, one packaged E2E

**Contract:**

```text
select_personalization_input(lesson_snapshot, mastery_events, mistakes, now)
  -> {lessonId, familyId, difficulty, mistakeCodes, constraints}

validate_generated_exercise(family, candidate)
  -> {accepted: true, exercise} | {accepted: false, reason}
```

- [ ] 先写失败测试：错误 lesson/family、缺题目约束、模型返回完整答案、格式错误、与 family validator 不一致、重复最近题目。
- [ ] 选择器只依据本地掌握度、错题代码、复习时间和 family 约束，不把隐私数据发给模型。
- [ ] 模型调用只从 Python service → Electron main → 已有 `ModelClient`，请求中不含 API Key；不在浏览器直连。
- [ ] 模型输出先作为不可信数据解析和 family 验证；未通过就明确“未生成可验证题目”，不显示成功、不保存为练习。
- [ ] 通过验证后才保存题目、来源 family、输入错误模式和生成时间；用户可看到“为什么推荐这题”。
- [ ] API Key 配置保存后输入框立即清空，UI 只显示 provider/model/已配置，不显示 Key。
- [ ] 用一个 E2E 完成：失败一次 → 错误模式记录 → 生成个性题 → 验证 → 练习 → 掌握度更新。
- [ ] 提交：`feat: add validated personalized practice`。

**Gate 3 evidence:** 可信 family hash 可追溯；个性题未经真实 validator 不会显示成功；错题原因和推荐原因可解释；无密钥泄漏。

---

## Gate 4：把三条课程补全到可学习、可演示

### Task 6：Python 从基础到 Agent 工程的 8 阶段

**Files:** `app/content/python/`、`docs/curriculum-review.md`、bundle tests、每阶段代表性测试。

阶段顺序固定：

1. 运行模型、变量、类型、表达式、输入输出。
2. 分支、循环、字符串、列表、字典、集合与推导式。
3. 函数、作用域、模块、异常、文件与 JSON。
4. 面向对象、迭代器、生成器、装饰器、上下文管理器。
5. 测试、类型标注、日志、配置、HTTP 和 SQLite。
6. Prompt 数据结构、工具注册、Action 解析、ReAct。
7. 规划、反思、记忆检索、多 Agent 交接。
8. 生产项目实践：旅行助手、DeepResearch、Mini Agent 框架。

- [ ] 每阶段先增一节真实讲义/示例/误区/练习/答案，再通过 bundle invariant。
- [ ] 每个项目有输入输出契约、错误边界、测试、README 和可录制演示。
- [ ] 不把“写法偏好”伪装成结构要求；结构测试只服务明确教学目标。
- [ ] 每阶段独立提交并审查，避免一次生成大量相似课程。

### Task 7：LangChain/RAG 的 7 阶段、48 节、4 项目

阶段顺序固定：

1. 模型、消息、Prompt、结构化输出和成本。
2. Runnable、LCEL、parser、异步、streaming 和错误边界。
3. Document、loader、metadata、切分和数据清洗。
4. Embedding、向量存储、相似度、基础检索与两阶段 RAG。
5. Rerank、混合检索、引用、答案阈值和 RAG 评测。
6. LangChain v1 agents、tools、middleware、短期/长期记忆。
7. 对话式/agentic RAG、安全、成本、观测和综合项目。

项目：

- 文档问答最小闭环。
- 带引用的个人知识库。
- Agentic RAG 路由器。
- 本地学习资料研究助手。

- [ ] 旧 `ConversationBufferMemory`、`ConversationChain` 等只出现在迁移卡；主线使用当前官方 Agent/checkpointer/Store 语义。
- [ ] 每节至少一个官方 source route 和一个可运行 representative。
- [ ] RAG 课程里的评测指标必须落到真实数据集/固定小样本，不以“看起来回答不错”验收。

### Task 8：LangGraph 的 7 阶段、42 节、4 项目

阶段顺序固定：

1. StateGraph、State、Node、Edge、compile、invoke。
2. Reducer、条件边、循环、结束条件和错误路由。
3. Checkpoint、thread_id、短期记忆与恢复。
4. Store、namespace、key 与跨线程长期记忆。
5. Streaming、interrupt、人工确认和恢复。
6. 子图、并行、Map-Reduce、运行时上下文和可观测性。
7. 研究助手、Agent supervisor、评测和部署边界。

项目：

- 可恢复的审批工作流。
- 多步骤研究图。
- 带长期记忆的学习导师。
- Agent supervisor + RAG 综合项目。

- [ ] 对每个循环设真实终止条件和超时；不把无限循环交给 UI。
- [ ] 用行为测试验证 state、checkpoint、interrupt、恢复和线程隔离。
- [ ] 接受等价实现，不强迫变量名或唯一语法。

**Gate 4 evidence:** 三课达到 64/48/42 节及项目数，课程结构通过单一 invariant，所有来源和版本审校完成，课程页面能从 public snapshot 正常浏览。

---

## Gate 5：本地混合 RAG 与引用评测

### Task 9：安全文档导入与本地索引

**Files:**

- Create: `python-runtime/rag/ingest.py`, `python-runtime/rag/schema.py`
- Create: `python-runtime/tests/test_rag_ingest.py`
- Modify: SQLite migrations、service protocol、desktop preload/main bridge
- Test: `tests/rag-contract.test.mjs`

**Contract:** 只接受用户明确选择的 PDF/Markdown/TXT；读取文件后保存 source metadata、文本 hash、页码/行号和 chunk；不执行文档内容，不把文档发送到浏览器或日志。

- [ ] 先写文件类型、空文档、损坏 PDF、超大文档和重复 hash 的失败测试。
- [ ] PDF 使用已有 pypdf；Markdown/TXT 保留原始行号；chunk 记录 `sourceId`, `chunkId`, `text`, `location`, `contentHash`。
- [ ] SQLite 是唯一 owner；删除文档使用一个事务清理 chunks/vectors/eval references。
- [ ] 不引入独立向量数据库或原生 ANN；先用本地顺序 cosine 扫描，只有基准证明不足时才提案升级。
- [ ] 提交：`feat: ingest local learning documents`。

### Task 10：Hybrid retrieval、引用和资料不足阈值

**Files:** `python-runtime/rag/retrieval.py`, `python-runtime/rag/evaluation.py`, tests, service protocol, RAG UI。

**Contract:** `retrieve(query, filters, top_k)` 返回 lexical/vector 分数、融合排名、chunk location 和 content hash；回答请求必须带引用集合。低于阈值时返回“资料不足”，不能降级成无引用普通聊天。

- [ ] 先写 lexical、vector、RRF/融合、过滤、空结果、并列分数和 top-k 的 table-driven tests。
- [ ] embedding 通过 main gateway 调用用户已配置的 OpenAI-compatible endpoint；embedding 失败保留真实状态，不写伪向量、不自动重试。
- [ ] 先用 SQLite FTS5 + 顺序 cosine；保存 embedding model/dimension/hash，模型变化不得静默混用。
- [ ] 生成回答的 prompt 只含选中的 chunks 和来源元数据；模型输出再由 citation validator 检查。
- [ ] UI 展示检索片段、来源、页码/行号、命中分数和“资料不足”原因。
- [ ] 提交：`feat: add cited local hybrid rag`。

### Task 11：RAG 评测工作台

**Files:** `python-runtime/rag/evaluation.py`, migrations, tests, RAG UI。

- [ ] 用小型固定问答集测试 retrieval recall@k、MRR、citation coverage、answer faithfulness proxy、latency 和 token/cost。
- [ ] 评测结果记录检索配置、embedding model、catalog/document hash 和时间；不保存 API Key。
- [ ] UI 能比较两次索引/检索配置；不要把单一分数伪装成准确率真值。
- [ ] 提交：`feat: evaluate rag retrieval and citations`。

**Gate 5 evidence:** PDF/Markdown/TXT 本地导入、可复现 chunk/hash、混合检索、真实引用、资料不足阈值和评测面板全部通过集成测试。

---

## Gate 6：LangGraph 自适应导师

### Task 12：只在已有 caller 需要时加入 Tutor Graph

**Files:** `python-runtime/tutor_graph.py`, tests, service protocol, main gateway, UI。

**Graph state:**

```python
class TutorState(TypedDict):
    course_id: str
    lesson_id: str
    user_question: str
    mastery_snapshot: dict
    retrieved_chunks: list[dict]
    response: dict
    citations: list[dict]
    next_action: str
```

**Nodes:** `load_context` → `retrieve_sources` → `choose_teaching_move` → `draft_hint_or_explanation` → `validate_citations` → `save_turn`；验证失败走明确错误边，不返回无引用成功。

- [ ] 先写 state schema、线程隔离、RAG 资料不足、citation validation、interrupt 人工确认和恢复的失败测试。
- [ ] `thread_id` 只代表短期线程状态；跨线程用户知识放 Store；不把完整聊天历史当长期记忆。
- [ ] 导师默认先指出具体错误/根因再给最小提示；只有用户请求且策略允许时才给完整答案。
- [ ] Tutor Graph 通过已有 main model gateway 调用模型；不为 graph 单独建立 provider adapter。
- [ ] 保存每次 graph run 的 catalog/family/document hash，便于复现历史结果。
- [ ] 提交：`feat: add adaptive langgraph tutor`。

**Gate 6 evidence:** 一次课程问答、一次 RAG 引用回答、一次资料不足、一次 interrupt/恢复和一次线程隔离均在 packaged app 中通过。

---

## Gate 7：零部署发行与隐私验收

### Task 13：干净机器安装验证

**Files:** Forge config、runtime prepare scripts、release docs、packaged smoke tests。

- [ ] Windows x64/ARM64、macOS x64/ARM64 均打包内置 Python、service、课程快照、Pyodide 资产和 renderer。
- [ ] 安装后首启不要求 Node/Python/Docker/终端/端口冲突处理；服务由 Electron main 管理生命周期。
- [ ] service、public snapshot、runtime manifest 的 schema/hash 不一致时明确退出并显示原因。
- [ ] 使用干净用户目录验证安装、升级、重复启动、服务退出、RAG 数据路径、Keychain 和导入导出。
- [ ] 离线 HTML 继续单文件打开；不把完整版服务或密钥入口嵌入其中。

### Task 14：安全与边界 E2E

只保留高价值旅程：

1. 首次启动 → 保存配置 → 输入框清空 → UI 显示已配置但不回显 Key。
2. 浏览课程 → Python 基础代码运行 → 真实错误/超时反馈。
3. 错题 → 推荐个性题 → family 验证 → 复习记录。
4. 导入文档 → 检索 → 引用回答；资料不足明确失败。
5. LangGraph 导师一次成功、一次上游失败、一次线程隔离。
6. 离线 HTML 无配置、聊天、RAG、桌面桥。

- [ ] 只 mock 外部 OS keychain、模型 HTTP、文件系统；不 mock 被测模块内部。
- [ ] 执行 `rg -n '\\bcatch\\b|retry|fallback|default'`，逐项解释新增边界。
- [ ] 执行 `git diff --check`、Node/Python tests、lint、两套 typecheck、build、offline build、package smoke。
- [ ] 提交：`release: verify zero-deployment desktop app`。

---

## 简历项目建议

不要把“学习网站”只写成 CRUD 页面。建议以一个旗舰项目和两个可拆分子项目呈现，每个项目都附架构图、真实指标、失败案例和可运行演示。

### 旗舰项目：Stewie LearnOS — Local-First Adaptive RAG Learning Platform

适合放在简历项目首位。可展示的工程能力：Electron 零部署发行、OS Keychain、内置 Python、Pyodide Worker、SQLite、可信判题、个性化练习、Hybrid RAG、LangGraph Tutor。

建议简历描述（完成并测量后再填数字）：

> 设计并实现跨平台本地优先 AI 学习平台，安装包内置 Python/LangChain/LangGraph，使用 Electron main 统一模型调用与 Keychain 密钥隔离；实现基于错题模式和掌握度的可验证个性化练习、SQLite + FTS5/向量混合检索、带页码/行号引用的 RAG，以及可恢复的 LangGraph 导师工作流。通过真实错误/超时、哈希一致性、引用覆盖率、检索 recall@k、延迟和密钥不泄漏测试验证。

必须准备的证据：

- 安装包在干净机器无需运行时依赖即可启动。
- Key 不出现在 renderer、Python、SQLite、日志、导出和网络请求 body。
- 个性题未通过 family validator 时不会显示“生成成功”。
- RAG 显示真实来源与资料不足阈值，不把普通聊天冒充检索回答。
- 至少一组可重复指标：recall@5、MRR、citation coverage、p95 latency、失败率、安装体积。

### 子项目 A：Cited Local Hybrid RAG Workbench

若需要单独投递后端/AI 应用岗位，可从旗舰项目拆出：

- PDF/Markdown/TXT ingestion，保留页码/行号和 content hash。
- FTS5 lexical + 顺序 cosine vector + RRF 融合。
- 引用验证、资料不足阈值、检索评测和配置对比。
- README 放一组固定问答集、检索结果、失败回答和指标表。

它比“做了一个聊天机器人”更适合简历，因为能展示数据管道、检索质量、可追溯性和评测闭环。

### 子项目 B：Validated Adaptive Exercise Engine

若需要突出 Agent/教育技术方向，可拆出：

- 从真实错题测试结果提取有限错误模式。
- 根据 mastery/review schedule 选择 family、难度和输入约束。
- 使用 OpenAI-compatible 模型生成候选题，但由确定性 family validator 决定是否可发布。
- 记录推荐原因、family/catalog hash、题目版本和复习结果。

简历重点应放“模型只是候选生成器，确定性验证器负责质量闸门”，并展示生成拒绝率、重复率和练习后错误率变化。

### 子项目 C：Recoverable LangGraph Tutor

若目标是 LangGraph/Agent 岗位，可拆出：

- StateGraph + checkpoint/thread_id 短期记忆。
- Store 跨线程长期记忆。
- RAG 检索、引用验证、interrupt 人工确认、失败恢复和线程隔离。
- 一张 state transition 图和一次中断恢复录屏。

不要把“使用了 LangChain/LangGraph”作为成果本身；要展示状态契约、失败边、恢复语义、观测指标和测试。

### 推荐简历排序

1. Stewie LearnOS（旗舰，覆盖全栈本地 AI 工程）。
2. Cited Local Hybrid RAG Workbench（检索与评测深度）。
3. Validated Adaptive Exercise Engine 或 Recoverable LangGraph Tutor（二选一，取决于岗位）。

同一套代码可以拆成三个 GitHub 仓库或一个 monorepo 的三个 package，但课程正文与用户数据不要复制到多个仓库。

---

## 最终交付验收

- [ ] 任意支持平台的用户只下载并安装即可使用完整版；不安装 Node/Python/Docker，不手动启动服务。
- [ ] 三条课程达到最终规模，且每节内容、来源、版本、练习和项目关联通过统一 invariant。
- [ ] 用户 Key 只保存在本机 OS Keychain；模型调用经 main gateway；无浏览器直连。
- [ ] 真实错题可追溯到 mistake code、family、catalog/family hash 和复习记录。
- [ ] 个性化题目经过确定性 family validator；失败不伪造成功。
- [ ] 本地 RAG 支持 PDF/Markdown/TXT、混合检索、引用、资料不足和评测。
- [ ] LangGraph Tutor 支持线程短期状态、Store 长期记忆、RAG 引用、interrupt 和恢复。
- [ ] 离线 HTML 仍可独立打开，只含 public 课程、编辑器和答案。
- [ ] 全量测试、lint、TypeScript、Python unittest、web/offline build、安装包和干净机器 E2E 全通过。
- [ ] 最终审查报告列出新增 catch 数、重试点数、持久化路径数、测试类别、删除的重复测试和所有外部依赖版本。
- [ ] 完成后才调用 `update_goal(status="complete")`；任何 Gate 未满足都保持目标 active，不用较小子集代替最终目标。
