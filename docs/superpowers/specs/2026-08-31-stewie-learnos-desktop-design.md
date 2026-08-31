# Stewie LearnOS 跨平台桌面学习平台设计

**状态：** 已选择推荐架构，作为 2026-08-26 本地网站设计的后继版本
**目标平台：** Windows 10/11、macOS 13+，x64 与 ARM64
**产品目标：** 用户只下载安装包即可使用完整学习平台，不需要 Node、Python、Docker、终端或手动启动本地服务器。

## 1. 成功标准

Stewie LearnOS 完成时必须同时满足以下条件：

1. Windows 用户通过一个 `.exe` 安装包、macOS 用户通过一个 `.dmg` 安装并启动应用。
2. 首次启动不依赖开发工具、系统 Python、外部数据库或浏览器扩展。
3. Python、LangChain/RAG、LangGraph 三条课程均从入门覆盖到可演示项目，并具有讲义、练习、参考答案、来源和版本说明。
4. 用户可填写 OpenAI-compatible 的 Base URL、模型名和 API Key；Key 明文只在用户输入/保存，以及主进程为每次模型请求解密和构造授权头期间短暂存在。持久化时仅将操作系统保护的密文写入数据库，明文不进入日志、普通文件、导出、Python service 或 learner process。
5. 基础 Python 题继续真实执行；LangChain/LangGraph 项目使用随应用分发的固定 Python 环境真实执行。
6. 错题、提示依赖和复习结果形成个人掌握度，系统能生成并验证适合该用户的新题。
7. 用户可导入 PDF、Markdown、TXT，获得带来源引用的本地 RAG 问答，并能查看检索与回答评测。
8. 完整版和单文件离线版继续由同一份课程内容派生；离线版不包含模型配置、聊天或 RAG。
9. 上游模型、密钥存储、Python 执行或文档解析失败时显示真实原因，不静默降级或伪造成功。

“零部署”指最终用户零环境配置，不表示开发构建零依赖。安装包内部可以包含 Electron、Pyodide 和固定 CPython 运行时。

## 2. 方案选择

### 2.1 未选择：单文件 HTML 作为完整版

单文件适合课程浏览和基础 Pyodide 练习，但浏览器页面无法可靠隔离 API Key，也无法稳定承载完整的 Python LangChain/LangGraph 依赖。因此它只保留为轻量离线版。

### 2.2 未选择：浏览器网站加用户启动的本地服务

现有实现依赖 Node 22、固定端口和 macOS `security` 命令。它适合开发，但不能满足跨平台、无终端和无手动服务生命周期的目标。

### 2.3 选择：Electron 桌面应用

采用 Electron Forge 打包 Windows/macOS 安装包。React 界面加载本地静态资源；Electron 主进程管理密钥、文件、模型请求和 Python 子进程。用户不接触端口或服务命令。

参考基线：

- Electron 官方分发概览：https://www.electronjs.org/docs/latest/tutorial/distribution-overview
- Electron Forge：https://www.electronforge.io/
- Electron `safeStorage`：https://www.electronjs.org/docs/latest/api/safe-storage
- Python standalone builds：https://github.com/astral-sh/python-build-standalone

## 3. 进程与信任边界

```text
Electron renderer
  ├─ 课程、编辑器、进度、反馈 UI
  └─ API Key 只在用户输入与提交期间短暂存在；只能调用 preload 暴露的窄接口
          │ IPC（结构校验）
Electron main
  ├─ safeStorage / Keychain / DPAPI
  ├─ OpenAI-compatible HTTP
  ├─ 文件授权与 Python 进程监督
  ├─ 每次运行的临时模型网关
  ├─ 专用管道 → Bundled trusted Python service（唯一数据库 owner）
  └─ 每次运行启动独立 learner subprocess
          ├─ 专用控制管道返回结果
          └─ stdout/stderr 只作为学习结果捕获
Bundled trusted Python service
  ├─ SQLite 迁移、学习状态、RAG 与 Tutor Graph
  ├─ 不执行学习者代码、不接收 API Key 明文
  └─ 不启动或监督 learner subprocess
```

Renderer 设置：

- `contextIsolation: true`
- `nodeIntegration: false`
- `sandbox: true`
- 禁止任意导航和新窗口；外部课程链接经确认后交给系统浏览器。
- preload 只暴露课程应用真实使用的 IPC 方法，不暴露通用文件系统、shell 或 HTTP。
- 主进程验证 IPC sender、页面 origin 和 schema；生产 renderer 使用严格 CSP 并关闭 DevTools。

用户输入 Key 时，明文不可避免地短暂存在于 password input 和一次 IPC 参数中；提交完成后立即清空，不写入全局状态、localStorage 或日志。每次模型调用时，主进程会短暂解密并构造上游 Authorization header，响应完成后不保留额外明文副本。主进程是唯一能读取已保存/已解密 Key、访问用户选择文件和联系模型提供方的进程。IPC 输入使用一组小型共享 schema 校验；错误保留原始类型、状态码和明确的可读说明。

受信任 Python service 需要模型时，只在专用双向协议中发送不含 Key 的 `model_request`；main 使用同一个模型客户端执行并返回 `model_result`。聊天、RAG、Tutor Graph 和 learner gateway 不各自实现 provider 调用。

## 4. 分发与运行环境

### 4.1 桌面包

- Electron Forge 负责 `package` / `make`。
- Windows 生成按用户安装的安装包，不要求管理员权限。
- macOS 生成 `.dmg`，正式发行需要签名与 notarization。
- CI 在对应系统原生 runner 构建，不能用一个系统伪造另一个系统的产物。
- GitHub Release 发布校验和；更新功能不是首版前置条件，避免先引入自动更新复杂度。

### 4.2 Python 运行时

- 基础 Python 题继续使用锁定的 Pyodide，在 Web Worker 中运行并保留 4 秒超时与 worker 重建。
- LangChain/LangGraph 使用固定版本的 `python-build-standalone` CPython，按操作系统和架构打入安装包。
- 依赖在构建期下载、锁定并安装到随包环境；最终用户启动时不运行 `pip install`。
- 受信任的 Python service 只处理数据库、RAG 和 Tutor Graph 请求，不执行或启动学习者代码。
- Electron main 为每次练习启动全新的 run supervisor；supervisor 再启动 learner subprocess，避免模块、全局变量和文件描述符跨运行残留，并把 schema 校验后的最终结果交给 main。main 只在 OS containment 已清理后把结果交给 trusted service 事务保存。
- 控制结果走独立管道；learner stdout/stderr 只作为待分析数据捕获，不能破坏协议 framing。
- 每项任务有不可变 id、种类、输入和超时。run supervisor 在 POSIX 创建独立 process group，在 Windows 用 Python `ctypes` 创建启用 `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` 的 Job Object 并把 learner 加入其中，不引入原生 addon。
- 成功、测试失败、Python exception、协议失败、超时和应用退出都必须先关闭同一个 containment、确认后代已终止，再返回/持久化结果。超时仍返回独立 `execution_timeout`，清理失败则附带真实 `process_cleanup_failed`，不尝试第二套 fallback。
- 执行目录是每次新建的临时目录；环境变量白名单化，不继承 Key 或主进程配置。

CPython 进程隔离不等于操作系统级恶意代码沙箱。界面必须明确：只运行自己理解的代码。首版不承诺安全执行来自陌生人的恶意 Python。

### 4.3 学习代码使用模型

API Key 不注入 Python 环境。需要真实模型的课程运行时，由主进程启动只监听 `127.0.0.1` 随机端口的短生命周期网关，并发放单次运行 token：

- token 只在本次执行有效；
- 只提供课程需要的 chat/embedding 路径；
- 每次运行有明确的请求次数和超时上限；
- 网关把请求转发给当前配置，Python 子进程永远看不到真实 Key；
- 上游请求禁止自动跟随跨 origin 重定向；修改 profile 的 provider origin 时必须重新输入 Key；
- 运行结束立即关闭网关。

这是桌面应用内部执行机制，不要求用户部署或管理服务。失败直接终止本次运行并显示上游原因，不转用另一个模型或假回复。

## 5. 本地身份、配置与数据

首版不建立账号系统。每个操作系统用户拥有一个独立本地学习身份；不同电脑天然隔离。

### 5.1 持久化事实来源

只有两类持久化根：

1. 操作系统安全设施：macOS Keychain 或 Windows DPAPI 保护 `safeStorage` 的加密能力。
2. Electron `userData` 目录：一个 SQLite 数据库和受管的导入文档目录；数据库只保存 `safeStorage` 产生的 Key 密文，不保存明文。

SQLite 只由受信任的 Python service 通过标准库 `sqlite3` 打开、迁移和事务写入；Electron main 和 learner subprocess 不直接连接数据库。构建和打包 smoke test 必须证明固定 CPython 包含所需 SQLite/FTS5。SQLite 保存：

- 非敏感模型配置；
- 课程进度、草稿、运行结果和错题事件；
- 掌握度与复习计划；
- 聊天线程和消息；
- RAG 文档、切片、向量、检索记录与评测；
- schema 版本和一次性迁移状态。

不使用 localStorage 作为完整版事实来源。现有 localStorage 仅支持一次显式导入，成功后写入迁移标记；损坏数据整体拒绝，不猜测修复。

现有 Mac 版本的 `model-profiles.json` 与 `chat-history.json` 也只通过一条幂等迁移导入：先按旧版精确 schema 校验，再导入非敏感配置和历史并记录源文件 hash。旧 macOS Keychain 条目不由新应用自动读取或删除；迁移后的 profile 明确显示“需要重新输入 Key”。旧文件和 Keychain 条目保留到用户在迁移界面确认清理，迁移失败时保留原数据和真实原因。

### 5.2 API Key 安全

- Renderer 提交明文后立即清空输入；主进程使用 Electron 异步 `safeStorage.encryptStringAsync` 生成密文，再把不透明密文交给受信任 Python service 写入 SQLite。
- 读取时 Python service 只返回密文；仅主进程调用对应异步 API 解密。
- macOS 的加密能力由 Keychain 保护；Windows 使用 DPAPI 绑定当前系统用户。
- Renderer 从后端只能读取 `hasApiKey: boolean`，不能取回已保存或已解密 Key。
- 保存、测试连接和删除是三个明确操作，不自动重试。
- Key 明文不写入 SQLite、日志、崩溃报告、导出包或剪贴板；SQLite 中的系统绑定密文也不进入普通学习数据导出。
- provider origin 与密文一起绑定；更换 origin 会删除旧密文并要求重新输入，避免把既有 Key 发送给新地址。
- Linux 暂不作为首发平台；未来只有检测到真实 secret backend 才允许保存，绝不降级为 Electron `basic_text`。
- 应用无法防御已完全控制操作系统的恶意软件；产品文案不得承诺绝对安全。
- Windows DPAPI 主要隔离不同系统用户，不能阻止同一登录用户下的恶意进程；macOS 正式包必须保持一致代码签名，避免 Keychain 将每次构建识别为不同应用。

## 6. 课程内容架构

### 6.1 单一数据源

课程内容拆成三个 TypeScript 数据模块和一个聚合入口：

```text
app/content/
  python/
  langchain-rag/
  langgraph/
  catalog.ts
app/exercises/
  families.ts
generated/（构建产物，不手工编辑）
  course-public.json
  learning-service.json
```

TypeScript catalog/family 是唯一作者源。构建脚本生成两个带 schema version、catalog hash 和 family hash 的 JSON 快照：renderer/离线版只读取公开课程快照；trusted service 与 learner runner 读取包含可信 family/test 数据的 service 快照。Python 启动时校验 schema/hash，不接受猜测格式。每次 attempt 保存 catalog/family hash，保证历史判题和个性化选择可追溯；Python 不复制课程事实或另建 family 规则表。

每节课至少包含：

- 唯一 id、阶段、预计时长和前置知识；
- 学习目标、面向初学者的讲义、示例和常见误区；
- 可验证练习、分层提示和参考答案；
- 概念标签、难度和后续项目关联；
- 官方来源、高质量辅助资源、核验日期和适用版本；
- 若涉及旧 API，提供迁移卡而不是把旧写法混入主线。

构建脚本是唯一读取 TypeScript 聚合入口的消费者，并生成受校验快照；桌面 renderer、浏览器开发入口和离线 HTML 都读取 `course-public.json`。离线构建过滤模型、RAG 和桌面运行功能，但不复制课程正文。

### 6.2 Python 工程路线

目标：8 个阶段、至少 64 节、6 个渐进项目。

1. 运行模型、变量、类型、表达式、输入输出。
2. 分支、循环、字符串、列表、字典、集合与推导式。
3. 函数、作用域、模块、异常、文件与 JSON。
4. OOP、dataclass、协议、迭代器、生成器、装饰器、上下文管理器。
5. typing、pytest 思维、调试、日志、包结构、虚拟环境和 Git。
6. HTTP/API、SQLite、数据处理、asyncio 和并发边界。
7. 常用数据结构、算法、复杂度与性能分析。
8. 可维护项目、测试、文档、发布与复盘。

参考路线只用于结构校准：OSSU、30 Days of Python、Project Based Learning、TheAlgorithms/Python。课程文字、题目和答案由本项目原创。

### 6.3 LangChain 与 RAG 路线

目标：7 个阶段、至少 48 节、4 个项目。

1. LLM 应用基础：消息、Prompt、结构化输出、工具调用。
2. Runnable/组合、模型配置、错误与超时边界。
3. 文档加载、解析、切片、元数据和去重。
4. Embedding、语义检索、两阶段 RAG 和引用。
5. 混合检索、query rewrite、multi-query、HyDE、RRF、rerank。
6. 对话式 RAG、agentic RAG、安全、成本和观测。
7. 数据集、retrieval/answer 指标、离线评测和生产化项目。

主线以 LangChain 官方 Learn/Docs 和 LLM Zoomcamp 为基线。RAG_Techniques 只用于技术目录参考，不复制受其自定义许可约束的内容或代码。

旧 `ConversationBufferMemory`、`ConversationChain`、classic chains 等只出现在迁移卡；当前方案使用 checkpointer 表示线程短期状态，Store 表示跨线程长期记忆。

### 6.4 LangGraph 路线

目标：7 个阶段、至少 42 节、4 个项目。

1. State、Node、Edge、Reducer 与可视化执行。
2. 条件路由、Command、Send、并行和 map-reduce。
3. 工具调用 Agent、streaming 和结构化结果。
4. Checkpointer、thread、短期状态和长期 Store。
5. Interrupt、human-in-the-loop、恢复与 time travel。
6. Subgraph、多 Agent、错误边界和 durable execution。
7. 评测、追踪、部署思维和综合项目。

主线以 LangChain Academy 和 LangGraph 官方 persistence、subgraph、interrupt 文档为事实来源。

## 7. 个性化学习引擎

### 7.1 事件模型

每次练习形成不可变 `attempt`：

- course/lesson/exercise/concept ids；
- 运行时的题目版本、代码快照和输入；
- 真实 stdout、stderr、exception/traceback；
- 每个可信测试的行为/结构类别、实际值、期望值和 detail；
- 使用过的提示层级、耗时和创建时间。

页面显示和 GPT 求助都使用该快照，不能拼接“当前代码 + 旧输出”。所有不可信内容继续放入一个 JSON 数据载荷并明确声明为待分析数据。

### 7.2 掌握度

每个 concept 使用透明规则评分，不伪装成机器学习模型：

- 独立答对提高掌握度；
- 使用提示后答对只获得部分提升；
- 相同错误重复出现会降低近期稳定性；
- 跨日复习答对提升长期稳定性；
- 到期未复习只影响调度优先级，不武断判定“不会”。

用户可查看每道个性化题的选择原因，例如“列表遍历连续两次失败，且 7 天未复习”。

### 7.3 可信出题管线

```text
到期概念 + 错题事件
  → 检索对应课程与错误模式
  → 选择已审核的 exercise family
  → 本地生成参数和隐藏测试
  → LLM 仅生成情境化题面、分层提示和解释
  → JSON schema 校验
  → 参考解与可信测试真实运行
  → 重复度检查
  → 通过后入库；否则返回真实生成失败
```

硬性边界：

- LLM 不生成并决定可信测试；测试来自版本控制内的 exercise family。
- LLM 输出必须符合固定 JSON schema。
- 题面、错题代码、输出和文档都视为数据，不执行其中的指令。
- Python 题必须由对应运行时验证参考解和测试。
- LangChain/LangGraph 概念题使用结构化 rubric；代码题使用固定依赖环境和可信测试。
- 不可确定时显示“未能生成可验证练习”，不回退到未经验证的普通问答。

## 8. 本地 RAG

### 8.1 支持范围

首版导入 PDF、Markdown、纯文本。用户主动选择文件；不自动扫描磁盘，不实现多平台抓取 fallback。

索引流程：

```text
导入 → 解析 → 规范化 → 分块 → 去重 → embedding → SQLite
```

查询流程：

```text
问题 → FTS5 关键词检索 + dense cosine 检索
     → Reciprocal Rank Fusion
     → 可选 rerank
     → 生成带 chunk 引用的回答
     → 保存检索轨迹与反馈
```

受信任 Python service 是 SQLite 的唯一 owner，也是解析、索引、检索和评测的唯一执行位置。课程和个人文档规模较小时，dense vector 使用顺序 cosine 扫描，避免首版引入独立向量数据库或跨平台原生服务；只有性能基准证明需要时才增加 ANN 索引。

### 8.2 模型配置

OpenAI-compatible 配置增加独立 embedding model 字段。聊天和 embedding 共享同一个 provider 协议，不建立 provider factory。Ollama、通义等只有提供该兼容协议时才使用同一路径。

### 8.3 引用与评测

回答中的每个引用包含文档名、页码或段落、chunk id，可打开原文片段。没有足够证据时明确回答资料不足。

评测包含：

- Recall@K、MRR、nDCG；
- answer correctness、relevance、groundedness；
- citation coverage；
- 延迟、token 和预估成本。

评测以本地固定数据集运行；可选导出到 LangSmith，但产品核心不依赖云端评测服务。

## 9. LangGraph 自适应导师

最终综合图：

```text
load_learning_state
  → diagnose_gap
  → retrieve_course_and_attempts
  → select_exercise_family
  → generate_variant
  → validate_variant
  → present_or_explain_failure
  → grade_attempt
  → update_mastery
  → schedule_review
```

Tutor Graph 运行在受信任 Python service 中，由同一服务的 checkpointer 读写 SQLite；跨线程掌握度由同一数据库中的 Store 语义表保存。掌握度计算只有一个 Python 纯模块事实来源，renderer 只展示结果，不在 TypeScript 重算。个性题验证也只调用同一 Python exercise service。`interrupt` 用于用户选择提示层级、确认是否查看答案和审核文档引用。图中的模型节点不自动重试；只有明确证明幂等的索引读取允许单点重试，首版默认仍为零重试。

## 10. 简历级综合项目

项目名：**Stewie LearnOS — Local-First Adaptive RAG Learning Platform**

它包含四个可独立演示但共享一个产品的数据闭环：

1. 跨平台零环境桌面分发与安全 BYOK。
2. 真实运行、可信判题和个性化题目生成。
3. 本地 hybrid RAG、引用和评测面板。
4. LangGraph 自适应导师、短期状态、长期掌握度和 HITL。

简历演示必须提供：

- 3 分钟安装到首次运行视频；
- 一个错误代码如何进入掌握度并生成新题；
- 一个文档问题的混合检索、引用和评测轨迹；
- 一个 LangGraph 中断、恢复和跨会话记忆过程；
- Windows/macOS CI 产物、架构图和指标报告。

## 11. 错误、兜底与测试边界

- 自动重试默认 0 个。
- 不从 safeStorage 失败降级到文件/localStorage/env。
- 不从桌面主进程失败降级为 renderer 直连模型。
- 不从 CPython 失败降级为模拟 LangChain/LangGraph 结果。
- 不从 RAG 失败降级为无引用普通聊天并声称检索成功。
- catch 只放在 IPC、文件、数据库、密钥存储、HTTP、worker/child process、clipboard 等真实边界，并只在最接近边界的一层转换一次。
- 数据迁移只接受一个已知旧版本；不连续猜测格式。

测试类别限制为：

1. 纯函数：课程 invariant、配置校验/脱敏、掌握度、复习调度、exercise schema、RRF/指标。
2. 集成：safeStorage/IPC sender/CSP、SQLite 迁移、模型重定向与错误脱敏、Python timeout/进程树清理、RAG 引用、聊天线程隔离。
3. E2E：安装后启动、Key 提交后输入清空且不回显、基础代码运行、个性题闭环、文档 RAG、明确失败、离线版无敏感入口。

同一规则只在最低有效层测试一次，不为课程条目逐条复制测试，不做整页快照或 CSS 类名测试。

## 12. 非目标与外部条件

- 首发不做账号、多人协作、云同步或支付。
- 首发不做 Linux；后续支持必须先证明安全密钥后端和打包链。
- 首发不做任意网页爬取、视频下载或自动转写 fallback。
- 首发不建设 provider adapter/factory、通用 retry、repository 框架或远程向量数据库。
- 正式无警告分发需要 Apple Developer 与 Windows 代码签名凭据；开发期可以验证未签名包，但不能把未签名包宣称为最终公众发行版。

## 13. 阶段验收

每个阶段必须执行：

1. `git diff --check`；
2. 该阶段最低有效测试；
3. lint 和类型/构建；
4. 搜索新增 `catch`、`retry`、`default`、`fallback` 并逐项说明；
5. base SHA → head SHA 审查重复抽象、静默降级、重复测试和实现细节测试。

最终报告列出新增 catch 数、自动重试点数、持久化根数、测试类别、删除的重复测试以及仍需外部签名凭据的发行条件。
