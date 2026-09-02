# Stewie LearnOS Gate 2：单一课程数据源实施方案

> **执行者要求：** 必须先使用 `superpowers:executing-plans`，每项功能按 `superpowers:test-driven-development` 执行；最终提交前使用 `superpowers:requesting-code-review` 与 `superpowers:verification-before-completion`。本方案仅执行 Gate 2，验收后停止，不得自行进入 Gate 3。

**目标：** 将现有 Python、LangChain/RAG、LangGraph 内容收敛为一个 TypeScript 作者源，并生成公开课程快照与可信服务快照，使桌面 renderer、浏览器开发版、离线 HTML 和 Python 服务读取各自受校验的构建产物。

**架构：** `app/content/catalog.ts` 是唯一作者聚合根，且只有 `scripts/build-learning-bundle.mjs` 可以导入它。构建脚本从同一个目录生成 `generated/course-public.json` 与 `generated/learning-service.json`。公开消费者只能读取 public 快照；Python 服务读取 service 快照；Electron 启动时比较二者的课程哈希。不存在旧文件兜底、猜测格式、运行时联网取课程或第二套课程列表。

**技术栈：** TypeScript 5.9、Node.js 22、React/Next/vinext、Electron 44、Python 3.13.15、Node test runner、Python unittest、SHA-256。

**规格依据：**

- `docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md`
- `docs/superpowers/plans/2026-08-31-stewie-learnos-desktop.md` 的 Task 6
- `docs/superpowers/plans/2026-09-02-stewie-learnos-luna-handoff.md` 的 Gate 2
- Gate 1 完成提交：`7be691a fix: validate learning imports and exports`

---

## 一、执行边界

### 1. 本轮必须完成

1. 一个课程作者根：`app/content/catalog.ts`。
2. 三个课程族作者模块：
   - `app/content/python/index.ts`
   - `app/content/langchain-rag/index.ts`
   - `app/content/langgraph/index.ts`
3. 两个生成快照：
   - `generated/course-public.json`
   - `generated/learning-service.json`
4. 一份阶段级审校证据：`docs/curriculum-review.md`。
5. 浏览器、桌面 renderer、离线构建只消费 public 快照。
6. Python 服务只消费 service 快照，并在启动时验证 schema 与哈希。
7. Electron 在创建主窗口前确认 public/service `catalogHash` 与 `familyHash` 相同。
8. 删除旧的重复作者源与重复字段存在性测试。

### 2. 本轮明确不做

- 不扩充到 64 节 Python 课程，不重写现有课程正文，不改变任何现有 lesson id。
- 不建立 Gate 3 的通用 exercise family、沙箱 runner、隐藏测试协议或评分 DSL。
- 不升级 LangChain、LangGraph、Python、Pyodide 或 Electron 版本。
- 不增加 provider adapter、repository、兼容层、通用 retry 或远程 CMS。
- 不让浏览器或离线 HTML 直连模型，不把 API Key 写入课程快照。
- 不把官方仓库或高星课程内容复制进站内；它们只用于覆盖面核对。
- 不用在线请求验证每条 URL，常规测试只验证结构、协议和允许域。

### 3. 固定事实

- 课程 id 顺序固定为：`python`、`langchain-rag`、`langgraph`。
- 当前 lesson id 必须原样保留：Python 25 个，LangChain/RAG 7 个，LangGraph 7 个。
- 当前可执行基线必须来自项目锁定依赖，而非官网最新版本：
  - Python `3.13.15`
  - Pyodide `314.0.3`
  - LangChain `1.2.12`
  - LangGraph `1.1.2`
  - `langgraph-checkpoint-sqlite` `2.0.6`
- 官网文档是当前语义依据；版本不固定的网页记录 `verifiedAt: "2026-09-02"`，不得伪称其等同于本地包版本。
- LangChain 的跨线程长期记忆使用 Store，线程状态使用 checkpointer；LangGraph 的持久化、interrupt 和 Graph API 分别以官方文档为依据。

---

## 二、固定数据合同

在开始 Task 2 前先按下述合同写测试。实现中若发现字段名需要改变，必须先回到本方案核对调用方，不能同时保留新旧两种格式。

### 1. 作者源类型

`app/content/schema.ts` 只定义本轮真实使用的类型：

```ts
export const CATALOG_SCHEMA_VERSION = "stewie-catalog-v1" as const;

export type CourseId = "python" | "langchain-rag" | "langgraph";
export type Difficulty = "beginner" | "intermediate" | "advanced";
export type SourceKind = "official-doc" | "official-repo" | "reference-course";

export type RuntimeVersions = {
  python: "3.13.15";
  pyodide: "314.0.3";
  langchain: "1.2.12";
  langgraph: "1.1.2";
  langgraphCheckpointSqlite: "2.0.6";
};

export type CourseSource = {
  kind: SourceKind;
  label: string;
  url: string;
  verifiedAt: string;
};

export type CourseVideo = {
  title: string;
  url: string;
  provider: "黑马程序员" | "LangChain Academy" | "DeepLearning.AI";
  language: "中文" | "英文";
  duration: string;
  note: string;
};

export type MigrationCard = {
  title: string;
  status: "legacy" | "renamed" | "replaced";
  explanation: string;
  beforeCode: string;
  afterCode: string;
  officialSources: CourseSource[];
  verifiedAt: string;
  verifiedVersions: Pick<RuntimeVersions, "langchain" | "langgraph">;
};

export type GuideSection = {
  kind: "概念入门" | "逐步拆解" | "常见误区";
  title: string;
  body: string;
  bullets: string[];
  example: string;
};

export type PublicExercise = {
  prompt: string;
  starterCode: string;
  hints: string[];
  solution: string;
};

export type BrowserCheck = {
  name: string;
  expression: string;
  failure: string;
  kind: "behavior" | "structure";
  feedback?: {
    expected: string;
    actualLine?: number;
    actualExpression?: string;
    rule: string;
  };
};

export type CourseLesson = {
  id: string;
  stageId: string;
  order: number;
  title: string;
  kicker: string;
  summary: string;
  minutes: number;
  prerequisites: string[];
  difficulty: Difficulty;
  tags: string[];
  guide: GuideSection[];
  videos: CourseVideo[];
  officialSources: CourseSource[];
  migrations: MigrationCard[];
  project: boolean;
  projectLinks: string[];
  exercise: PublicExercise;
  browserChecks: BrowserCheck[];
};

export type CourseStage = {
  id: string;
  order: number;
  title: string;
  description: string;
  lessonIds: string[];
};

export type CourseTrack = {
  id: CourseId;
  title: string;
  shortTitle: string;
  description: string;
  accent: string;
  currentLessonId: string;
  stages: CourseStage[];
  lessons: CourseLesson[];
};

export type AuthoredCatalog = {
  schemaVersion: typeof CATALOG_SCHEMA_VERSION;
  verifiedAt: string;
  runtimeVersions: RuntimeVersions;
  tracks: CourseTrack[];
};
```

说明：

- `browserChecks` 是当前已经公开到浏览器 Pyodide 的检查，不得称为隐藏测试。
- Gate 3 才会定义可信 exercise family。本轮 `familyHash` 有真实含义：它是所有 `browserChecks` 的规范化投影哈希，不是空占位，也不是未来协议。
- `projectLinks` 表示课程到既有项目课的关联 lesson id，不是 URL。
- 新增 `prerequisites`、`difficulty`、`tags`、`stageId` 时只做对现有内容的保守标注，不新增课程或改变学习要求。

### 2. 快照合同

两个文件都使用以下顶层元数据：

```ts
type SnapshotMeta = {
  schemaVersion: "stewie-catalog-v1";
  catalogHash: string; // 64 位小写十六进制 SHA-256
  familyHash: string;  // 64 位小写十六进制 SHA-256
};
```

`course-public.json`：

```json
{
  "schemaVersion": "stewie-catalog-v1",
  "catalogHash": "…",
  "familyHash": "…",
  "catalog": {
    "verifiedAt": "2026-09-02",
    "runtimeVersions": {},
    "tracks": []
  }
}
```

`learning-service.json`：

```json
{
  "schemaVersion": "stewie-catalog-v1",
  "catalogHash": "…",
  "familyHash": "…",
  "catalog": {
    "verifiedAt": "2026-09-02",
    "runtimeVersions": {},
    "tracks": []
  },
  "checks": {
    "lesson-id": []
  }
}
```

具体投影规则：

- public 的 `catalog.tracks` 包含课程正文、视频、迁移卡、练习题、提示、参考答案和现有公开浏览器检查。
- service 的 `catalog` 与 public 的 `catalog` 深度相等；`checks` 是按 lesson id 索引的同一批 `browserChecks`，供 Python 校验和未来 Gate 3 迁移使用。
- `catalogHash = sha256(canonicalJson(catalog))`。
- `familyHash = sha256(canonicalJson(checks))`。
- `canonicalJson` 递归按对象键排序，数组保持作者顺序，UTF-8 编码，不包含生成时间或本机路径。
- public 和 service 必须分别重算自己的 `catalogHash`；service 还必须重算 `familyHash`。只比较文件里的两个字符串不算验证。
- Electron 主进程启动时还要从打包的 public JSON 重算 `catalogHash`，再与 Python 已重算的 service metadata 比较；因此打包后篡改任一份内容都会阻止启动。
- 不增加自动修复、旧 schema 兼容或备用文件。校验失败即明确停止构建/启动。

### 3. 阶段映射

不改变 lesson id。阶段只作为新元数据加入：

- Python：沿用现有 6 个 `MODULE_ORDER` 值，每个模块建立一个稳定 stage id。
- LangChain/RAG：按现有 7 节顺序建立 7 个阶段，stage id 与对应 lesson id 相同并加 `stage-` 前缀。
- LangGraph：按现有 7 节顺序建立 7 个阶段，规则同上。

不要在 Gate 2 强行把当前内容改造成最终 8 阶段/64 节路线；该扩展属于 Gate 4。

---

## 三、阶段检查点（每个 Task 都执行）

每项任务必须走以下循环，不得攒到最后统一清理：

1. 写一个能说明用户可见回归的失败测试。
2. 运行该测试，确认因缺少当前功能而失败，而不是测试自身报错。
3. 写最少实现。
4. 运行聚焦测试并确认通过。
5. 执行：

```bash
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
```

6. 搜索本 Task 新增的错误处理和冗余路径：

```bash
git diff --unified=0 | rg '^\+.*\b(catch|retry|fallback|default)\b'
rg -n '\bcatch\b|retry|fallback|default' app/content scripts/build-learning-bundle.mjs python-runtime desktop/src tests
```

7. 对每个新增 `catch` 写下对应真实边界；正常的数据校验应直接 `throw`，不要用 catch 改成默认对象。
8. 审查从本 Task 起始 SHA 到当前 HEAD/工作树的 diff，确认无重复课程、无静默降级、无实现细节测试、无单调用方通用抽象。
9. 有 Critical/Important 问题则先修复并重跑；没有问题才提交。

---

## 四、实施任务

### Task 1：确认 Gate 1 基线并冻结迁移合同

**修改文件：** 无。

**目的：** 防止 Luna 在错误分支上执行，或在迁移中无意改变课程 id 和现有行为。

**步骤 1：确认仓库状态**

```bash
cd '/Users/ciao/Documents/Python学习/.worktrees/stewie-learning-site'
git branch --show-current
git status --short
git merge-base --is-ancestor 7be691a HEAD
git log -5 --oneline
```

期望：分支为 `codex/stewie-learning-site`，工作树干净，ancestor 命令退出 0。

**步骤 2：完整阅读规格与当前实现**

```bash
sed -n '1,260p' docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md
sed -n '120,150p' docs/superpowers/plans/2026-08-31-stewie-learnos-desktop.md
sed -n '617,650p' docs/superpowers/plans/2026-09-02-stewie-learnos-luna-handoff.md
sed -n '1,240p' app/lib/learningCatalog.ts
sed -n '1,180p' app/lib/curriculum.ts
```

随后继续读到每个文件 EOF，不得只读上述开头。

**步骤 3：记录现有 ID 清单但不创建重复数据文件**

使用一次性只读命令打印三个 track 与 39 个 lesson id。ID 清单只放在迁移测试断言中，不生成 fixture JSON，不复制正文。

**步骤 4：运行基线验证**

```bash
npm test
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
'./desktop/.runtime/python/bin/python3' -m unittest discover -s python-runtime/tests -v
npm run build
npm run build:offline
```

若任一项失败，先使用 `superpowers:systematic-debugging` 判断是否为已有问题；不得把基线问题混进 Gate 2 提交。

**提交：** 无。Task 1 只产生验证记录。

---

### Task 2：用一个数据驱动测试锁定 schema 与课程不变量

**文件：**

- 创建：`app/content/schema.ts`
- 创建：`tests/learning-bundle.test.mjs`
- 暂不修改作者数据。

**步骤 1：先写失败测试**

测试通过动态导入 `app/content/schema.ts` 断言：

- schema version 精确为 `stewie-catalog-v1`；
- runtime versions 精确匹配锁定版本；
- validator 拒绝未知顶层字段、重复 track/lesson/stage id、stage 顺序断裂、未知 prerequisite、stage.lessonIds 与 lesson.stageId 不一致；
- validator 拒绝空 guide、空 exercise、空 hints、空 solution、无官方来源的迁移卡；
- 视频 URL 只允许现有三个提供方的 HTTPS 域名；普通 source 只要求 HTTPS 与已声明 kind，不进行联网；
- projectLinks 只能引用同 track 已存在且 `project` 标记为真的 lesson。

使用 table-driven cases；不为每个字段单独建测试，不断言私有函数名或错误栈。

```bash
node --experimental-strip-types --test tests/learning-bundle.test.mjs
```

期望：因 `schema.ts` 不存在而失败。

**步骤 2：写最小 schema 与纯 validator**

- 按“固定数据合同”实现类型。
- `validateAuthoredCatalog(value)` 成功时返回经过类型收窄的原对象，失败时抛一条带数据路径的明确错误，例如 `tracks[1].lessons[0].stageId 引用了未知阶段`。
- 不修复、去重或补默认值。
- 只允许 validator 中需要聚合多个验证分支的局部辅助；至少两处使用后才提取。

**步骤 3：运行测试与阶段检查点**

```bash
node --experimental-strip-types --test tests/learning-bundle.test.mjs
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
```

**步骤 4：提交**

```bash
git add app/content/schema.ts tests/learning-bundle.test.mjs
git commit -m "test: define curriculum bundle contract"
```

---

### Task 3：合并 Python 的四处作者数据

**文件：**

- 创建：`app/content/python/index.ts`
- 修改：`tests/learning-bundle.test.mjs`
- 暂时保留：`app/lib/curriculum.ts`、`app/lib/lessonGuides.ts`、`app/lib/solutions.ts`

**步骤 1：扩展失败测试**

用一张 exact-id table 锁定当前 25 个 Python lesson id 及顺序。再断言每节课只有一个合并对象同时包含：

- 现有 module 对应的 `stageId`；
- 原 title、goal/summary、minutes、requirements、starterCode；
- `lessonGuides.ts` 的完整 guide；
- `solutions.ts` 的完整 solution；
- `curriculum.ts` 的完整 tests，映射为 `browserChecks`，未写 kind 时规范为 `behavior`。

测试不复制整篇讲义、答案或测试表达式，只检查关键计数、全部 id 以及几个代表性内容的等值迁移。

**步骤 2：确认红灯**

```bash
node --experimental-strip-types --test tests/learning-bundle.test.mjs
```

期望：`app/content/python/index.ts` 不存在或导出缺失。

**步骤 3：搬迁而非复制**

- 将 `curriculum.ts`、`lessonGuides.ts`、`solutions.ts` 的作者值合并进 `pythonLessons`。
- Python 6 个 module 变为 6 个显式 `CourseStage`。
- 课程 source 中的 Hello Agents GitHub 链接标为 `reference-course`，Python 官方教程链接标为 `official-doc`。
- `project-expense` 等现有项目课标记 `project: true`；非项目课的 `projectLinks` 可指向与其真实相关的现有项目课，没有明确关系则空数组，不猜测。
- 不改判断表达式、不重写答案、不改 lesson id。

**步骤 4：阶段检查与提交**

```bash
node --experimental-strip-types --test tests/learning-bundle.test.mjs tests/judging-regression.test.mjs
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
git add app/content/python/index.ts tests/learning-bundle.test.mjs
git commit -m "refactor: unify python curriculum content"
```

旧文件此时仍作为旧消费者存在，但不允许再编辑其正文；Task 7 将删除它们。

---

### Task 4：迁移 LangChain/RAG、LangGraph，并建立阶段审校证据

**文件：**

- 创建：`app/content/langchain-rag/index.ts`
- 创建：`app/content/langgraph/index.ts`
- 创建：`app/content/catalog.ts`
- 创建：`docs/curriculum-review.md`
- 修改：`tests/learning-bundle.test.mjs`

**步骤 1：先写失败测试**

新增以下数据驱动断言：

- track 顺序精确为 `python`、`langchain-rag`、`langgraph`；
- LangChain/RAG 和 LangGraph 各 7 个现有 lesson id，顺序不变；
- 每个 stage 的 `lessonIds` 非空并与课程顺序一致；
- migration card 的版本是锁定运行时版本 `1.2.12`/`1.1.2`，而非当前旧文件中的 `1.3.17`/`1.2.11`；
- 官方来源、视频和迁移卡仍与旧站内容对应；
- `app/content/catalog.ts` 导出一个通过 validator 的 `authoredCatalog`。

确认测试先因模块不存在而失败。

**步骤 2：迁移两个 track**

- 从 `app/lib/learningCatalog.ts` 移动内容，不保留第二份常量。
- `app/content/catalog.ts` 只负责导入三个 course 模块、填入 schema/version 元数据、聚合并调用 validator。
- 除构建脚本外，不允许任何生产或测试模块直接导入 `catalog.ts`；当前 Task 的临时测试可导入，Task 5 改为从生成快照验证并删除该直连。
- 把“官方当前文档核验日期”和“本地可执行版本”分开表达，不升级 package lock。

**步骤 3：建立 `docs/curriculum-review.md`**

每个 stage 一行，列必须固定为：

```text
track / stage / official source route / runtime baseline / verified date /
beginner explanation / original runnable example / misconception review / representative lesson
```

审校状态只允许 `reviewed` 或 `needs-review`。Gate 2 提交前所有现有 stage 必须为 `reviewed`，且 representative lesson 必须真实存在。文档必须明确：

- 官方文档是 API 与语义事实来源；
- LangChain、LangGraph GitHub 仓库用于项目结构和覆盖面核对；
- DataTalksClub `llm-zoomcamp` 与 Datawhale `hello-agents` 只作覆盖参考，不复制正文或代码；
- Bilibili 黑马课程保留为中文学习路线，但迁移卡以官方文档为准。

**步骤 4：阶段检查与提交**

```bash
node --experimental-strip-types --test tests/learning-bundle.test.mjs
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
git add app/content docs/curriculum-review.md tests/learning-bundle.test.mjs
git commit -m "refactor: consolidate authored course tracks"
```

---

### Task 5：生成两个确定性快照并验证真实哈希

**文件：**

- 创建：`app/content/canonicalJson.ts`
- 创建：`scripts/build-learning-bundle.mjs`
- 创建：`generated/course-public.json`
- 创建：`generated/learning-service.json`
- 修改：`package.json`
- 修改：`tests/learning-bundle.test.mjs`

**步骤 1：先写失败测试**

测试以子进程执行 `npm run build:learning`，然后读取两个 JSON 文件，断言：

- schema 精确；
- public/service `catalog` 深度相等；
- 两者 `catalogHash` 相同；
- 两者 `familyHash` 相同；
- 测试端独立规范化并重算两个 SHA-256，不能调用构建脚本的 hash helper；
- service `checks` 与 catalog 中所有 `browserChecks` 的 lesson-id 投影一致；
- 连续构建两次字节完全相同；
- 快照中不存在 `generatedAt`、绝对路径、API Key、profile、chat、history、RAG 索引或桌面 bridge 字段。

这里故意在测试中保留一份很短的 canonical JSON 实现，以防生成器自身的错误同时污染“期望值”。它不是业务数据重复。

**步骤 2：实现单一构建入口**

- 只有该脚本导入 `app/content/catalog.ts`。
- 构建前调用 validator。
- `app/content/canonicalJson.ts` 只负责递归对象键排序并生成用于哈希的紧凑 JSON；它会被构建脚本和 Task 8 的 Electron 主进程校验器共同使用。
- 数组保持作者顺序，最终文件输出 UTF-8、2 空格缩进、文件末尾一个换行。
- 先写同目录临时文件，再原子 rename；写失败直接保留真实错误，不写旧文件兜底。
- 不捕获 hash/validation 错误；命令失败即非零退出。
- 脚本只写上述两个固定路径，不接受自由输出路径。

**步骤 3：接入构建命令**

在根 `package.json` 添加：

```json
"build:learning": "node --experimental-strip-types scripts/build-learning-bundle.mjs"
```

并让以下入口在消费前只调用一次 `build:learning`：

- 根 `prebuild`
- `build:offline` 前置脚本
- desktop 的 `premake`/`prepackage` 在 `prepare-python-runtime` 前

不要让 `postinstall` 自动改写课程快照；课程快照由构建/打包命令生成并提交，以便 Git 审查。

**步骤 4：验证确定性与提交**

```bash
npm run build:learning
cp generated/course-public.json /tmp/stewie-course-public.json
cp generated/learning-service.json /tmp/stewie-learning-service.json
npm run build:learning
cmp /tmp/stewie-course-public.json generated/course-public.json
cmp /tmp/stewie-learning-service.json generated/learning-service.json
node --experimental-strip-types --test tests/learning-bundle.test.mjs
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
git add package.json app/content/canonicalJson.ts scripts/build-learning-bundle.mjs generated tests/learning-bundle.test.mjs
git commit -m "build: generate versioned learning bundles"
```

---

### Task 6：迁移浏览器、renderer 和离线版到 public 快照

**文件：**

- 创建：`app/content/publicCatalog.ts`
- 修改：`app/components/LearningApp.tsx`
- 修改：`app/components/CatalogLesson.tsx`
- 修改：`app/components/CourseChat.tsx`
- 修改：`app/lib/runSnapshot.d.mts`
- 修改：`scripts/build-offline-html.mjs`
- 修改：`tests/offline-html.test.mjs`
- 修改：必要的现有 UI 单元测试

**步骤 1：先写 public loader 与离线失败测试**

`publicCatalog.ts` 必须在模块加载时：

- 精确校验 schema；
- 浏览器模块加载保持同步，不为 SHA 引入异步状态；构建时完整重算由 Task 5 保证，运行时 loader 做严格结构与 64 位 hash 格式校验；桌面主进程启动时的内容重算与交叉哈希由 Task 8 保证；
- 导出类型收窄后的 `publicCatalog`、`learningTracks`、`pythonLessons` 和按 id 查找的只读映射；只导出真实调用方需要的视图。

离线测试改为读取 `generated/course-public.json` 作期望，不再导入作者模块，并额外断言：

- 离线 HTML 内嵌的课程数据与 public `catalog` 相等；
- 保留所有公开讲义、题目、提示、答案；
- 没有模型配置、API Key、chat、RAG 检索入口、本地服务 URL、Electron bridge；
- 课程名称中的“RAG”不视为运行时 RAG 功能泄漏。

先运行：

```bash
npm run build:learning
node --experimental-strip-types --test tests/offline-html.test.mjs
```

期望：旧 builder 仍直连旧作者模块，测试失败。

**步骤 2：改消费端**

- UI 从 `publicCatalog.ts` 获取 track/lesson/guide/solution/browserChecks。
- 保持现有 Python Pyodide 判题行为；只改字段读取路径，不重写 harness。
- offline builder 只读取 `generated/course-public.json`，并继续安全转义 `</script`。
- 类型只从 `schema.ts` 或 public loader 导出，不从旧 `learningCatalog.ts` 导出。

**步骤 3：验证关键旅程**

```bash
npm run build:learning
npm run build:offline
node --experimental-strip-types --test tests/offline-html.test.mjs tests/judging-regression.test.mjs tests/storage.test.mjs
npm run build
npm run smoke:packaged-renderer
git diff --check
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
```

手工打开浏览器开发版，验证 Python 第一课可显示、运行、判题、查看答案；再直接打开离线 HTML，验证三条课程可浏览且无模型设置/课程导师入口。

**步骤 4：提交**

```bash
git add app/components app/content/publicCatalog.ts app/lib/runSnapshot.d.mts scripts/build-offline-html.mjs tests/offline-html.test.mjs Stewie-个人学习站-离线版.html
git commit -m "refactor: consume public curriculum snapshot"
```

---

### Task 7：删除旧作者源并合并重复测试

**文件：**

- 删除：`app/lib/learningCatalog.ts`
- 删除：`app/lib/lessonGuides.ts`
- 删除：`app/lib/solutions.ts`
- 删除或改为无数据兼容层后再删除：`app/lib/curriculum.ts`
- 修改：`tests/judging-regression.test.mjs`
- 删除：`tests/lesson-guides.test.mjs`
- 删除或合并：`tests/learning-catalog.test.mjs`
- 修改：所有剩余旧 import 调用方

**步骤 1：写防重复回归断言**

在 `tests/learning-bundle.test.mjs` 添加一个面向产物的合同：生成器成功后，仓库业务代码中不存在对旧四个模块的 import。不要扫描任意源码字符串；只在该清理 Task 使用 `rg` 作为验收命令，不把它做成长期单测。

**步骤 2：迁移最后调用方**

- `tests/judging-regression.test.mjs` 从 service snapshot 读取 Python `browserChecks` 和 solution，继续保留此前伪通过/反向误判矩阵。
- `desktop/src/main.ts` 暂时从 public loader 获取已知 lesson id；Task 8 再加入服务哈希比对。
- `runSnapshot` 类型改从 schema 获取。
- 删除只验证 guide 字段存在的重复测试；对应合同已被统一 invariant 覆盖。

**步骤 3：确认真正只剩一个作者根**

```bash
rg -n 'lib/(learningCatalog|lessonGuides|solutions|curriculum)|from ["'"'].*(learningCatalog|lessonGuides|solutions|curriculum)' app desktop scripts tests
rg -n 'memory-modernization|first-output|graph-foundations' app --glob '!content/**'
```

第一条应无结果；第二条只允许真实 UI 默认选择或测试中的稳定 id，不允许出现整份课程对象。

**步骤 4：验证并提交**

```bash
npm run build:learning
npm test
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
git diff --check
git add -A app tests desktop/src
git commit -m "refactor: remove duplicate curriculum sources"
```

---

### Task 8：让 Python 服务验证 service 快照，并让 Electron 比对双端哈希

**文件：**

- 创建：`python-runtime/catalog.py`
- 创建：`python-runtime/tests/test_catalog.py`
- 创建：`desktop/src/catalogBundle.mts`
- 修改：`python-runtime/service.py`
- 修改：`python-runtime/tests/test_service.py`
- 修改：`scripts/prepare-python-runtime.mjs`
- 修改：`desktop/src/pythonService.mts`
- 修改：`desktop/src/main.ts`
- 修改：`tests/pythonServiceProtocol.test.mjs`
- 修改：必要的 packaged smoke tests

**步骤 1：先写 Python 失败测试**

`test_catalog.py` 使用最小临时 JSON fixture，覆盖且只覆盖：

1. 正确 snapshot 返回 schema、catalogHash、familyHash 和 lesson id 集合；
2. schema 不同明确失败；
3. catalog 内容被改但 hash 未改明确失败；
4. checks 被改但 family hash 未改明确失败；
5. 文件损坏明确失败，不尝试旧格式或备用文件。

Mock 只替换文件系统路径，不 mock loader 内部函数。

```bash
'./desktop/.runtime/python/bin/python3' -m unittest python-runtime/tests/test_catalog.py -v
```

期望：模块不存在而失败。

**步骤 2：实现 Python loader**

- `load_learning_bundle(path)` 读取一次 JSON、精确验证顶层字段、重算两个 hash。
- Python canonical JSON 必须与 Node 规则一致：对象键排序、紧凑分隔符、`ensure_ascii=False`、UTF-8。
- 只接受固定 schema；失败抛 `ValueError`/`FileNotFoundError` 的真实原因。
- 不 catch 后返回空 catalog，不搜索其他目录。

**步骤 3：服务启动时加载一次**

- `service.py` 在进入请求循环前加载与自身同目录部署的 `learning-service.json`。
- `health` 增加：

```json
"catalog": {
  "schemaVersion": "stewie-catalog-v1",
  "catalogHash": "…",
  "familyHash": "…"
}
```

- `build_health_result` 接收已验证的 metadata，不在每次 health 请求重复读文件。
- 测试调用可显式传入小 fixture metadata；不添加默认假 metadata。

**步骤 4：纳入运行时打包指纹**

在 `SERVICE_FILES` 增加：

- `catalog.py`
- 从 `generated/learning-service.json` 复制到服务目录的显式映射

不要把生成文件复制回 `python-runtime` 作者目录。`sourceFingerprint` 必须包含 service 快照 hash，使课程变化会触发运行时重新准备。

**步骤 5：Electron 启动交叉校验**

- `PythonHealth` 类型加入 catalog metadata，并做 exact-key 校验。
- `catalogBundle.mts` 导入打包进主进程的 `generated/course-public.json`，用 Node `crypto` 重算 `catalogHash`，并严格校验 schema/hash 字段；不得复用文件中未验证的 hash 当作结果。
- 规范化 JSON 的纯函数放在 `app/content/canonicalJson.ts`，由构建脚本和 `catalogBundle.mts` 两个真实调用方共用；Python 保留等价的跨语言实现。不要把 Node `crypto` 放进 renderer 可达模块。
- Python 服务 ready 后、窗口创建前比较重算后的 public schema/catalogHash/familyHash 与 Python 已重算的 service metadata；任一不同走现有 `startupBoundary`，显示“课程数据版本不一致”并退出。
- 不捕获后继续启动，不回退到浏览器数据，不自动重试。

**步骤 6：验证**

```bash
npm run build:learning
npm run prepare:python-runtime
'./desktop/.runtime/python/bin/python3' -m unittest discover -s python-runtime/tests -v
node --experimental-strip-types --test tests/pythonServiceProtocol.test.mjs tests/packaged-python.test.mjs
npm run smoke:packaged-python
npm run desktop:typecheck
npm run lint -- --max-warnings=0
npx tsc --noEmit
git diff --check
```

再增加一个 Electron 协议测试：Python 返回不同 catalogHash 时，启动边界得到明确失败，不创建窗口。不要为每种 hash/schema 差异重复三条 E2E。

**步骤 7：以 Gate 2 规定的提交名提交**

```bash
git add python-runtime scripts/prepare-python-runtime.mjs desktop/src tests
git commit -m "refactor: establish reviewed curriculum source"
```

---

### Task 9：最终 Gate 2 全量验证、代码审查与唯一收口提交

**文件：** 只修改审查发现的真实问题。

**步骤 1：重新生成并确认工作树只含预期产物变化**

```bash
npm run build:learning
npm run build:offline
git status --short
git diff --check
```

生成后再次执行 `git status`，两个 JSON 和离线 HTML 不应出现未提交漂移。

**步骤 2：全量自动验证**

```bash
npm test
'./desktop/.runtime/python/bin/python3' -m unittest discover -s python-runtime/tests -v
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run desktop:typecheck
npm run build
npm run build:offline
npm run prepare:python-runtime
npm run smoke:packaged-python
npm run desktop:package
npm run smoke:packaged-renderer
git diff --check
```

必须报告每条命令的退出状态和测试数量；不要只写“全部通过”。

**步骤 3：人工关键旅程**

在 GPT 桌面端或真实 Electron 包中验证：

1. 三条课程路线与当前 39 节课均可浏览。
2. Python 第一课可编辑、运行、看到真实测试结果、查看答案。
3. 模型设置和按 lesson 隔离的课程对话仍可用。
4. 直接打开 `Stewie-个人学习站-离线版.html` 可浏览讲义、题目、提示、答案。
5. 离线版没有模型设置、课程导师、本地服务、RAG 检索或桌面桥接入口。
6. 人为修改 service snapshot 后重新准备运行时，应用明确拒绝哈希不一致；恢复并重新生成后可正常启动。

**步骤 4：专项冗余与安全审查**

从 Gate 2 起始 SHA `7be691a` 审查到当前 HEAD：

```bash
git diff --stat 7be691a..HEAD
git diff --check 7be691a..HEAD
git diff 7be691a..HEAD -- app/content generated scripts python-runtime desktop/src app/components tests package.json
rg -n '\bcatch\b|retry|fallback|default' app/content scripts/build-learning-bundle.mjs python-runtime/catalog.py python-runtime/service.py desktop/src
rg -n 'app/content/catalog|content/catalog' app desktop scripts tests
rg -n 'learningCatalog|lessonGuides|lessonSolutions|from .*curriculum' app desktop scripts tests
```

审查结论必须逐项回答：

- `app/content/catalog.ts` 是否只有构建脚本一个消费者；
- 是否只有一份 track/lesson 正文；
- 是否有 catch 吞错、备用快照、旧 schema 猜测或自动重试；
- 是否引入只有一个调用方的通用 helper；
- 是否测试私有函数、CSS 类、完整页面快照或第三方库内部行为；
- 是否仍有重复 field-presence 测试；
- public/service 是否真实重算 hash，而非只比较字符串；
- offline 是否只排除运行功能而保留公开 RAG 课程内容。

使用 `superpowers:requesting-code-review` 做一次独立审查。所有 Critical/Important 必须修复并重跑完整验证；没有问题时不要制造空修复提交。

**步骤 5：收口提交**

如果审查产生改动：

```bash
git add -A
git commit -m "fix: close curriculum source review"
```

Task 8 已产生规格要求的 `refactor: establish reviewed curriculum source`。如果最后审查没有改动，不得创建空提交。提交后：

```bash
git status --short
git log --oneline 7be691a..HEAD
```

工作树必须干净。

---

## 五、Gate 2 验收表

全部勾选后立即停止，不进入 Gate 3：

- [ ] `app/content/catalog.ts` 是唯一作者聚合根，且只有生成器导入。
- [ ] Python 25、LangChain/RAG 7、LangGraph 7 个 lesson id 全部不变。
- [ ] `generated/course-public.json` 与 `generated/learning-service.json` 均由同一命令确定性生成。
- [ ] 两快照 schema、catalogHash、familyHash 相同且均经过内容重算。
- [ ] browser、renderer、offline 只消费 public；Python 只消费 service。
- [ ] Electron 在开窗前比较双端 hash，不一致则明确停止。
- [ ] 离线 HTML 含公开讲义、题目、提示、答案，无 profile/Key/chat/本地 RAG/desktop bridge。
- [ ] `docs/curriculum-review.md` 每个现有 stage 都有官方来源、版本/日期与五项审校证据。
- [ ] 旧四处作者数据与重复 field-presence 测试已删除。
- [ ] 正常测试不逐个联网请求外部 URL。
- [ ] 无新增自动重试；无旧快照、localStorage、远端课程或猜测 schema fallback。
- [ ] 全量测试、lint、TypeScript、build、offline、Python runtime、package smoke 全通过。
- [ ] 独立审查没有 Critical/Important。
- [ ] 工作树干净，Gate 2 有真实提交。

---

## 六、交付报告模板

Luna 最终报告必须包含：

```text
Gate 2 status: PASS / BLOCKED
Base SHA: 7be691a
Head SHA: <actual>
Commits: <list>

Course facts:
- tracks: 3
- lessons: Python 25 / LangChain-RAG 7 / LangGraph 7
- authored roots: 1
- generated snapshots: 2
- catalogHash: <actual>
- familyHash: <actual>

Verification:
- npm test: <count/pass>
- Python unittest: <count/pass>
- lint --max-warnings=0: <result>
- root TypeScript: <result>
- desktop TypeScript: <result>
- build/offline/package/smoke: <result per command>
- manual journeys: <result per journey>

Boundary audit:
- new catch count: <number and purpose of each>
- retry points: <must remain 0 in Gate 2>
- persistence paths added: <expected 0; generated build files are not user persistence>
- authored curriculum roots: <must be 1>
- tests added by category: schema/invariant, deterministic bundle/hash, offline public boundary, Python startup validation, desktop hash mismatch
- redundant tests removed: <files/cases and why>
- Critical/Important review findings: <none or fixed list>

Gate 3 was not started.
```

---

## 七、给 5.6 Luna 的启动提示词

```text
继续开发 Stewie LearnOS。

工作目录：
/Users/ciao/Documents/Python学习/.worktrees/stewie-learning-site

分支：
codex/stewie-learning-site

Gate 1 已在提交 7be691a 完成。请完整阅读：
1. docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md
2. docs/superpowers/plans/2026-08-31-stewie-learnos-desktop.md
3. docs/superpowers/plans/2026-09-02-stewie-learnos-luna-handoff.md
4. docs/superpowers/plans/2026-09-02-stewie-learnos-gate-2-curriculum-source.md

使用 superpowers:executing-plans 执行本方案，只做 Gate 2。每个 Task 使用测试驱动，并在阶段提交前运行方案规定的 diff、测试、lint、类型检查和 catch/retry/fallback 审查。保留所有现有 lesson id 与 Gate 1 功能；不得增加第二套课程数据、旧快照兜底、猜测 schema、自动重试、浏览器直连模型、密钥明文存储或 Gate 3 的提前抽象。

所有 Gate 2 验证通过并完成独立代码审查，且没有 Critical/Important 后再提交并报告精确证据。验收后停止，不要自行进入 Gate 3。
```

---

## 八、审校时使用的权威路线

这些链接用于人工核对 `docs/curriculum-review.md`，不得在常规测试中逐个联网：

- Python 官方教程：<https://docs.python.org/3/tutorial/>
- LangChain memory 概览：<https://docs.langchain.com/oss/python/concepts/memory>
- LangChain short-term memory：<https://docs.langchain.com/oss/python/langchain/short-term-memory>
- LangChain long-term memory：<https://docs.langchain.com/oss/python/langchain/long-term-memory>
- LangChain agents：<https://docs.langchain.com/oss/python/langchain/agents>
- LangGraph persistence：<https://docs.langchain.com/oss/python/langgraph/persistence>
- LangGraph interrupts：<https://docs.langchain.com/oss/python/langgraph/interrupts>
- LangGraph Graph API：<https://docs.langchain.com/oss/python/langgraph/use-graph-api>
- LangChain 官方仓库（覆盖核对）：<https://github.com/langchain-ai/langchain>
- LangGraph 官方仓库（覆盖核对）：<https://github.com/langchain-ai/langgraph>
- DataTalksClub LLM Zoomcamp（覆盖参考）：<https://github.com/DataTalksClub/llm-zoomcamp>
- Datawhale Hello Agents（中文覆盖参考）：<https://github.com/datawhalechina/hello-agents>
