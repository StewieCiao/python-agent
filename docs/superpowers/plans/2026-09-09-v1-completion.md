# Stewie LearnOS v1.0 完整交付执行指导

> For agentic workers: 使用 superpowers:executing-plans 逐项执行并更新复选框。用户于 2026-09-09 明确授权继续实施、发布指导并设定目标直至 v1.0 完成；不再请求重复的“开始”确认。

**Goal:** 交付可下载、可安装、可学习、可验证的 v1.0：完整桌面版、公开课程页和单文件离线版，以及普通用户可操作的说明。

**Architecture:** 继续共享课程数据、Python 编辑器和反馈语义，使用不同运行适配器承载浏览器与桌面能力。离线 HTML 和 Pages 保持静态课程模式；桌面版提供本地服务、代码运行和可配置模型能力。

**Tech Stack:** 现有 React/TypeScript、Pyodide/Worker、Electron/Forge、Python、SQLite、LangChain/LangGraph、GitHub Actions；语法高亮优先采用可本地打包的 CodeMirror 6 Python 扩展。

**Spec:** 本文件是本轮统一交付范围与验收规范；此前对话中已讨论的高亮、输出、错误反馈和标题优化均纳入本轮。原总体路线见 `docs/superpowers/plans/2026-09-02-stewie-learnos-complete-roadmap.md`，冲突时以本轮明确范围为准。

## 全局约束和目标管理

- 在“产品制作”任务调用 get_goal；若无活动目标，create_goal，目标为完成本文件所有 v1.0 验收项。已有不冲突活动目标时继续并将本文件作为交付清单。不可仅因完成一批代码就结束整个目标。
- 持续完成安全且已授权的实现、测试、提交、推送、CI 和公开仓库版本发布。只有真实缺少外部凭据、付费资源或必须由用户决定的范围变更时才说明阻塞；不反复索要开始许可。
- 仓库 `StewieCiao/python-agent`；目标版本 `v1.0.0`。先核验标签是否存在，禁止覆盖旧标签、删除用户数据或改写远程历史。
- 保持 64/48/42 节课程与 6/4/4 项目基线及既有 lesson ID、进度和草稿兼容；不以增加课程或提交数量代替功能完成。
- 离线版不联网、不执行学习者代码；所有“检查”明确标注静态检查。Pages 是在线访问的静态课程版，不冒称在线完整运行环境。
- 本地 RAG 不等于模型完全离线：外部模型/Embedding 服务可能接收问题和相关文本，在设置与说明中准确说明数据流。
- 不把 Worker 说成完整安全沙箱；不把引用 ID 校验说成已经证明回答事实正确；不把语法树解析说成完整 Python 运行语义检查。
- 不隐藏失败测试，不跳过平台制造全绿，不仅通过增加超时处理启动故障。稳定批次再推送；合理使用工作流并发控制减少过期运行。

## 1. 固定基线与发布阻塞排查

涉及 `.github/workflows/desktop-smoke.yml`、`.github/workflows/desktop-release.yml`、`scripts/smoke-packaged-renderer.mjs`、`desktop/src/main.ts`、`desktop/src/pythonService.mts`、`desktop/vite.renderer.config.ts`、`package.json`、锁文件及相关桌面测试。

- [x] 检查当前 git 状态、既有指导、最近 CI 日志和真实下载资产，记录基线 SHA；保留不属于本轮的改动。
- [x] Windows x64：在失败时输出页面状态、控制台/网络异常、资源 URL 与 Python 启动日志，复现“Python 就绪”超时，定位根因后做最小修复。
- [x] Windows ARM64：验证 `workerd` 安装阻塞是否来自桌面流程不需要的 Web 构建依赖；通过合理拆分依赖或受支持构建方式修复，更新锁文件；禁止盲目全局忽略安装脚本。
- [x] 为确认的启动或配置问题添加能复现旧故障的回归检查，再修复并运行相关检查。
- [x] 四目标 macOS arm64/x64、Windows arm64/x64 保留为正式目标；若确有不可克服支持限制，提供证据并报告，不擅自把平台删除后声称完整发行完成。

验证证据：`a5350e5` 的 [四平台 packaged smoke](https://github.com/StewieCiao/python-agent/actions/runs/34756979880) 全部通过。ARM64 保留既定安装方式并显式重建 Electron、准备 Pyodide；未改依赖版本，锁文件无需变更。详细根因与回归记录见 `docs/releases/v1.0.0-acceptance.md`。下载发行仍未完成，不包含在上述运行验证中。

## 2. 共享语法高亮编辑器

涉及新建 `app/components/PythonEditor.tsx`、共享编辑器模块（放 `app/lib/editor/`）、`app/components/LearningApp.tsx`、`app/components/CatalogLesson.tsx`、`app/globals.css`、`offline/template.html`、`scripts/build-offline-html.mjs`、依赖锁文件、`tests/python-editor.test.mjs`。

- [ ] 使用共享编辑器初始化函数，React 负责挂载销毁，离线生成流程内联同一模块的构建结果；不使用运行时 CDN。组件接口至少包含 value、onChange、可访问名称及只读状态。
- [ ] 覆盖关键字、字符串、数字、注释、函数、属性/方法高亮；验证 `text.strip()`、`row.name`、`Row.value`、`chain.invoke()`、`graph.compile()`，不要只特判 Row。
- [ ] 测试字符串与注释内的相同文本不误着色，三引号、中文和未完成代码不崩溃，HTML 特殊字符不被执行。
- [ ] 保留中文输入法、复制粘贴、撤销重做、缩进、行号、滚动和本地草稿；切课后不混用上一课内容或撤销历史，重新打开能恢复草稿。
- [ ] 桌面与窄屏浏览器实测；断网并通过 file:// 打开生成 HTML，确认高亮工作且无外部请求。

## 3. 输出规范和初学者错误指导

涉及 `app/components/LearningApp.tsx`、`app/components/CatalogLesson.tsx`、`app/lib/gptPrompt.mjs`、新建 `app/lib/editor/diagnostics.ts`（或共享等价模块）、`offline/template.html`、反馈样式及诊断测试。

- [ ] 统一“程序输出 / 发现的问题 / 测试结果”区域。原样保留输出换行、前导空格和 stderr；空输出明确说明；修改代码后标记旧运行结果已过期。
- [ ] 每条诊断包含来源（静态/运行）、严重程度、位置（可确定时）、中文原因和下一步建议；原始 traceback 默认折叠但可展开复制。
- [ ] 覆盖缺冒号、未闭合括号或引号、缩进问题以及实际 SyntaxError、IndentationError、NameError、TypeError、ValueError、IndexError、KeyError、AttributeError。
- [ ] 目标函数或参数检查从课程已有契约派生。`print` 替代 `return`、方法漏括号属于有上下文的教学提示；只有题目要求与实际语义能支持时才提示，不把合法函数引用判成语法错误。
- [ ] 离线静态检查不宣称“运行成功”或“全部测试通过”；无发现时提示“未发现已覆盖的常见问题，未运行代码”。仅凭静态检查不能自动完成课程。
- [ ] 用有效函数引用、嵌套函数、注释、字符串和多行表达式测试误报；用失败后修改再运行测试反馈更新。

## 4. 标题和课程体验

涉及 `app/globals.css`、两个课程组件、`offline/template.html`、`app/content/` 和 `tests/learning-bundle.test.mjs`。

- [ ] 标题统一为 Python、LangChain / RAG、LangGraph，采用路线标签、阶段、课程标题的层级；颜色辅助识别但不作为唯一信息。
- [ ] 检查三张讲解卡、渐进提示、默认折叠参考答案、项目验收要求和先修导航；保持已有课程数量，不无止境扩写内容。
- [ ] 三路线各选基础、进阶、项目课程完成一次实际学习流程；核验进度、错题、变化练习和导出导入。

## 5. 完整版服务和真实测试

涉及 `python-runtime/`、`desktop/src/ragService.mts`、`desktop/src/modelProfileService.mts`、`app/components/CourseChat.tsx`、`app/components/ModelSettings.tsx` 及对应现有测试。

- [ ] 验证资料导入、重复导入、重启恢复、检索、引用校验、无资料、删除资料后的检索结果更新。
- [ ] 验证模型未配置、错误 Key、连接失败与无效响应的真实错误；不得吞错生成假答案。
- [ ] 验证学习数据重启持久化、旧进度迁移、API Key 不进入日志/页面/学习导出。
- [ ] 已有合法配置时做一次真实端到端模型请求；缺少配置时注明真实模型请求未验收，报告所缺条件，不自行购买服务或索取明文密钥。
- [ ] 执行 `npm run test:all`、`npm run demo:projects`、桌面打包和两项 packaged smoke；保存最终 SHA、测试数量、退出状态及已知警告。历史测试通过不能替代最终版本证据。

## 6. v1.0 下载、README 与发行

涉及 `README.md`、`docs/zero-deploy.md`、`docs/static-hosting.md`、两个 package.json 与锁文件、发行工作流、新建 `docs/releases/v1.0.0.md` 和 `docs/releases/v1.0.0-acceptance.md`。

- [ ] README 顶部提供“打开在线课程 / 下载离线版 / 下载桌面完整版”，明确各版本是否运行代码、是否支持模型、数据存储位置及联网边界。
- [ ] 写清 Windows 安装步骤与架构选择、macOS 安装步骤、第一次运行和模型配置、进度备份、升级方法；未签名包如实说明，不指导关闭系统整体安全防护。
- [ ] 同步版本到 1.0.0，生成最新离线 HTML、Pages 和四平台安装包。资源名使用稳定 ASCII 名称并包含版本/平台/架构，避免乱码和同名覆盖。
- [ ] CI 对最终候选提交通过后，将安装包、离线 HTML 和 SHA256 校验清单发布至公开 v1.0.0 Release；用户下载入口必须指向真实存在资源，不只写“自行运行 Actions”。
- [ ] 验证匿名下载链接、包大小与校验和；安装/启动检查必须针对实际打包产物。记录平台环境及不能完成的人工验证，不伪称四平台人工验收。
- [ ] 确认 Pages 对应最终版本发布成功；填写验收报告、已知限制、最终 SHA、Release URL、各平台下载链接和实际测试结果。

## 完成判定与汇报

只有上述交付条件全部满足，才将“产品制作”目标标记完成并称为 v1.0 完整交付。有一项阻塞则保留未完成状态，列明证据、已尝试方案、所需外部条件；遵守目标工具对 blocked 的规则。

每完成一个阶段提供简短进展；不因报告一批测试通过而终止其余阶段。最终汇报应包含：已交付功能、下载使用方法、最终版本测试、仍有的限制与数据备份方法。总进度用已验收项/总项表达，不再给无计算依据的 82% 等数字。
