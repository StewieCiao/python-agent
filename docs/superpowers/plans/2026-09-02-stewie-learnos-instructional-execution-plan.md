# Stewie LearnOS 全系统教学内容执行计划

> **执行要求：** 按 `docs/superpowers/specs/2026-09-02-stewie-learnos-system-instructional-guidance.md` 连续执行，不再逐关向用户确认。每个任务测试先行、独立提交、保留真实失败，不覆盖无关改动。

**目标：** 建立统一教学合同，完成 Python 64、LangChain/RAG 48、LangGraph 42 节的课程地图与内容，并优先交付可完整浏览的离线版。

## Phase 0：收口当前工作区

### Task 0.1：审查而非原样提交当前 LangChain 草稿

**当前改动：** `app/content/learningCatalog.ts` 中 `model-messages-prompts`、`structured-output`、`runnable-pipeline`。

- 先运行作者目录导入，复现“不允许的视频域名 docs.langchain.com”。
- 将三节草稿视为素材，不视为已完成课程；按统一三卡、三提示、行为检查、先修和来源合同重写。
- 不把官方文档伪装成 `CourseVideo`；官方文档放入 `officialSources`。
- 不在旧 `learningCatalog.ts` 继续扩写整条课程，先完成单一作者根迁移。
- 提交前运行课程导入、catalog bundle 和离线测试。

### Task 0.2：消除过渡适配造成的教学信息丢失

**重点文件：** `app/content/catalog.ts`、`app/content/schema.ts`、`app/content/courseTrackAdapter.ts`、`app/content/learningCatalog.ts`、三条 track 目录。

- 先写失败测试证明适配器会丢失 prerequisites、三层 hints、browserChecks 和 project。
- 将 LangChain/RAG、LangGraph 改为与 Python 一样的正式作者模块，不再依赖一课一阶段的 legacy adapter。
- 只在所有调用方迁移并且生成快照一致后删除旧作者源；不保留第二套正文。
- 保留现有 lesson id 能力映射；若 id 必须变化，提供确定性进度迁移表。
- 统一运行时版本和来源核验日期。

**提交：** `refactor: unify authored curriculum tracks`

## Phase 1：先建立全量课程地图

### Task 1.1：一次性定义三条路线骨架

- 在正式作者模块中先建立 64/48/42 个 lesson manifest：id、stageId、order、title、summary、minutes、prerequisites、difficulty、tags、project、projectLinks。
- 标记 6/4/4 个项目及其依赖课程。
- 建立跨路线建议关系：LangChain L1 至少要求 Python 的函数、字典、异常、模块；LangGraph G1 至少要求 Python 函数/类型和 LangChain Runnable 基础。
- 自由浏览不变，先修只用于推荐和提示。

### Task 1.2：强化目录合同测试

新增或扩展测试覆盖：

- 三路线顺序固定，阶段数为 8/7/7，课程数至少 64/48/42，项目数至少 6/4/4。
- lesson/stage id 全局唯一，order 连续，stage.lessonIds 双向一致。
- prerequisites 全部存在、早于当前课、无环。
- 每课正好三张不同 kind 的讲解卡、正好三层非重复提示。
- 每课至少一个官方来源；版本与 `RUNTIME_VERSIONS` 一致。
- 非项目课至少两个行为检查；需要异常/边界的课程有对应检查。
- `projectLinks` 只指向项目，项目反向覆盖关联课程。
- 生成快照确定性、哈希一致、离线 JSON 与作者目录一致。

**提交：** `content: define complete learning paths`

## Phase 2：建立 22 节代表课模板

三条路线每个阶段先完成一节代表课，共 22 节。目的不是只交付 22 节，而是先验证同一模板能覆盖基础语法、框架数据流、图状态和项目课。

每节按以下顺序实施：

1. 先写内容合同失败测试。
2. 写一句可验证目标和真实先修关系。
3. 写三张讲解卡：心智模型、数据流拆解、错误对照。
4. 写同能力不同场景的原创示例。
5. 写包含输入/输出/约束/边界的任务。
6. 写概念、结构、近解三层提示。
7. 写答案，再写至少三个行为检查验证典型、变化和边界。
8. 运行正确替代写法与伪通过回归。
9. 生成离线版，抽查桌面和窄屏。

代表课通过后冻结模板，只修合同缺陷，不在后续阶段随意改变结构。

**提交：** 每条路线一个提交，例如 `content: establish python lesson standard`。

## Phase 3：批量完成 Python 64 节

按 P1 → P8 顺序，每个阶段一个实现批次和提交。禁止一次生成 64 节后统一修错。

每阶段完成条件：

- 本阶段全部课程通过十项内容门槛。
- 每个新概念至少有一个代表性真实行为测试。
- 阶段项目可运行、可失败、可复现，README 和演示步骤完整。
- 旧 25 课不是原样保留：逐课检查先修、提示梯度、边界和项目链接。
- Agent 课不重复教授本应在 P1–P5 完成的 Python 基础。

**建议提交：** `content: complete python stage p1` 至 `p8`。

## Phase 4：批量完成 LangChain/RAG 48 节

按 L1 → L7 顺序，每阶段独立提交。

- 主线示例只使用锁定版官方语义；旧 API 进入迁移卡。
- 每个 Runnable/检索流程写清输入和输出形状。
- loader、split、embedding、retrieve、rerank、generate、cite、evaluate 各阶段可单独观察。
- RAG 项目使用固定小样本做召回、引用和无资料回答测试。
- 模型不可用时显示真实边界，不用静态假回答冒充运行结果。

**建议提交：** `content: complete langchain stage l1` 至 `l7`。

## Phase 5：批量完成 LangGraph 42 节

按 G1 → G7 顺序，每阶段独立提交。

- 每课画清 State 输入、Node 变更、Edge 去向和最终状态。
- reducer、条件路由、循环终止、checkpoint、interrupt、Store 分开教授。
- thread_id 与 user_id、短期状态与长期记忆必须用对照示例区分。
- 循环、恢复、并行和 supervisor 项目都有确定性上限、失败状态和线程隔离测试。

**建议提交：** `content: complete langgraph stage g1` 至 `g7`。

## Phase 6：离线版第一完整交付

### Task 6.1：重建离线内容

- 从 public snapshot 重新生成 `Stewie-个人学习站-离线版.html`。
- 校验 64/48/42 课程、6/4/4 项目、讲解、题目、三层提示、答案、来源和迁移卡全部内嵌。
- 校验没有外部资源加载、网络调用、模型设置、聊天、RAG runtime 或桌面桥。
- 保持答案和提示默认折叠，本地草稿与完成进度兼容。

### Task 6.2：人工内容与界面抽查

每阶段至少抽查一节、每路线至少抽查一个项目：

- 桌面宽屏与窄屏无横向内容溢出。
- 中英文、代码、表格、长 URL 可读。
- 推荐顺序、先修说明、项目入口清楚，但不锁死自由浏览。
- 参考答案不会在未点击时泄露。
- 刷新后草稿和完成进度仍在。

**提交：** `content: deliver complete offline curriculum`

## Phase 7：桌面教学闭环对齐

离线内容验收后，验证同一作者目录在桌面端形成完整闭环：

- 真实执行显示 stdout、stderr、exception、actual、expected、rule、next action。
- 失败 attempt 记录确定性 mistake code；通过后更新 mastery 和 review queue。
- 分层提示按使用次数记录；答案仅主动展开。
- 个性化练习显示推荐原因，并在可信 family 验证后才可练习。
- 教学模型只解释真实结果，不修改通过/失败结论。
- 项目页面按里程碑、测试、README 和演示产物验收。

**提交：** `feat: align desktop learning loop with curriculum`

## Phase 8：全量验证与交付证据

每阶段运行相关测试；最终必须全量运行：

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

同时运行仓库已有 Python runtime 测试、bundle/hash 校验和离线生成流程。若 package scripts 名称不同，先查看 `package.json` 并使用现有真实脚本，不创造虚假的通过记录。

最终生成 `docs/curriculum-review.md`，逐阶段记录：

- 课程和项目数量。
- 代表课与代表项目。
- 官方来源和核验版本。
- 判题/伪通过回归证据。
- 离线截图或人工检查结果。
- 尚未完成的真实限制。

## 执行纪律

- 不再把开发 Gate 当作教学关卡，也不再逐关等待用户确认。
- 当前 LangChain 草稿不能原样提交；先按 Phase 0 收口。
- 不并行修改同一个作者文件；按 track/stage 划分批次。
- 不复制课程正文到离线模板、Python service 或 UI。
- 不用大批量模板化文字制造“课程数量已达标”的假象。
- 任何阶段测试失败先定位根因；不得删测试、放宽合同或加入静默 fallback 以换取绿灯。
- 不修改 API Key、隐私边界、已有进度格式；如确需修改，停止并请求产品决策。
- 每次提交只包含本阶段相关源码、测试、生成物和审校证据。

## 完成定义

只有同时满足以下条件，才可以报告全系统教学内容完成：

1. 三条路线达到 64/48/42 节，项目达到 6/4/4。
2. 所有课程通过统一教学合同与来源核验。
3. 所有答案通过对应检查，合理等价解通过，已知伪通过失败。
4. 离线版完整、无网络、可读、进度兼容，并由同一作者目录生成。
5. 桌面端真实反馈、复习和个性化使用同一课程与判题事实。
6. 全量测试、lint、typecheck、build、diff check 通过。
7. `docs/curriculum-review.md` 给出可复核证据和真实遗留限制。
