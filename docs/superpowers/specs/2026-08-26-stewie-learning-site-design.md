# Stewie 的个人学习站设计规范

## 目标

把现有 Python → Agent 闯关站升级为本地优先的个人学习站：自由浏览 Python、LangChain/RAG、LangGraph 课程，保留可选代码练习，并在完整版提供安全的模型配置与课程导师对话。单文件离线版继续只承载课程、编辑器、参考答案和本地进度。

## 信息架构

- 品牌统一为“Stewie 的个人学习站”，不再使用“闯关、锁定、解锁”。
- 首页展示三条课程路线、完成进度与“继续学习”。所有课程均可自由打开。
- 课程页包含：详细讲义、视频资源、官方资料、版本状态、迁移卡、代码示例、可选练习和参考答案。
- 现有 Python 25 节课程及真实 Pyodide 判题保留；LangChain/RAG 和 LangGraph 使用同一课程数据结构派生完整版与离线版。

## LangChain 与 LangGraph 内容

- 当前学习点固定为黑马课程第 38 节。先补充第 37–38 节记忆课程，再覆盖第 39–67 节。
- 文件持久化消息历史标记为“持久化会话历史”，不能称作现代 LangGraph 长期记忆。
- `RunnableWithMessageHistory` 和 `BaseChatMessageHistory` 作为仍可使用的低层机制介绍，不伪造弃用结论。
- 明确迁移：线程短期记忆使用 checkpointer；跨线程长期记忆使用 Store；旧 `ConversationChain`/`LLMChain` 属于 classic 范畴；旧 `create_react_agent` 迁移到 `create_agent`。
- 每条迁移卡包含状态、旧写法、新写法、解释、前后代码、官方来源、核验日期和核验版本。
- 视频中文优先，官方英文校准。黑马各分 P 作为主线；LangChain Academy 和 DeepLearning.AI 作为官方或高可信补充。外部旧课程必须标注版本风险。
- 若公开视频无字幕，实施过程只允许单一公开音频来源加本地 `faster-whisper` 转写。音频和完整逐字稿不提交；失败时只报告真实原因或要求用户提供本地音频。

## 本地模型服务

- 服务仅监听 `127.0.0.1:4318`，完整版不得绕过它直连模型。
- 首版仅支持 OpenAI-compatible `/chat/completions`，不创建 provider adapter/factory。
- 非敏感配置写入 `~/Library/Application Support/Stewie Learning Site/model-profiles.json`；API Key 写入 macOS 钥匙串，service 为 `Stewie Learning Site`、account 为 profile id。
- 钥匙串失败不得退回 localStorage、明文文件或环境变量；上游失败不得生成默认回复。
- 云端 Base URL 只允许 HTTPS；HTTP 只允许 `localhost`、`127.0.0.1` 和 `::1`。
- 配置页支持多个命名 profile：name、baseUrl、model、temperature、maxTokens、timeoutMs 和 `hasApiKey`。API Key 永不返回前端或进入日志。
- 聊天提供“课程导师”和“普通对话”模式。课程模式发送当前课程精炼上下文、迁移说明、最近 20 条消息和当前问题；所有课程/用户内容作为待分析数据序列化。
- 历史按 courseId/lessonId 隔离，可读取和清除；损坏记录返回明确错误，不猜测或部分修复。

## 前端与 Figma

- Figma Drafts 新建“Stewie 个人学习站”，只建立实际使用的 tokens、组件和变体。
- 设计首页、课程页、模型配置页、聊天抽屉的 1440px 桌面版与窄屏适配。
- 保留现有温暖纸张色与深色技术侧栏的识别度，使用 Geist、PingFang SC 和 Geist Mono。
- 完整版显示本地服务、Python Worker 和模型配置的真实状态；失败原因可见，不显示伪成功。
- 离线版无模型配置、聊天入口、API Key 字段和本地服务地址。

## 数据与兼容

- 单一课程数据模型是完整版与离线版的事实来源。
- 旧 Python 进度只支持一条显式迁移到新课程状态的路径，迁移成功后保留原键，不重复迁移；损坏数据明确回到空白状态。
- 配置校验、脱敏和课程 invariant 各自只存在一个纯模块实现。

## 错误与测试边界

- catch 只用于文件、钥匙串、HTTP、Worker、剪贴板和 localStorage 等真实外部边界，不在多层重复改写同一错误。
- 聊天、连接测试和写操作不自动重试；不创建 retry/fallback 框架。
- 单测只覆盖课程 invariant、配置保存/脱敏、钥匙串不泄漏、URL 边界、上游错误透传、上下文隔离、历史隔离/清除和旧进度迁移。
- 浏览器验收只覆盖课程浏览、配置保存但不回显 Key、聊天成功、聊天明确失败、离线版无配置/聊天入口。
- 每阶段提交前执行 diff check、相关测试、lint/类型或 build，并审查新增 catch/retry/default/fallback、重复抽象和重复测试。

## 非目标

- 不上线、不托管视频、不提交完整课程逐字稿。
- 不支持多厂商原生协议、Windows 凭据存储或自动 provider fallback。
- 不为未来需求提前建设数据库、repository 层、通用重试器或完整设计系统。
