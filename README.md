# Stewie LearnOS

一个本机优先的个人学习站：学习 Python、LangChain/RAG 与 LangGraph，运行练习、复盘错题、生成个性化练习，并完成可写入简历的项目。

## 使用

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址（通常是 `http://localhost:3000/`）。

运行所需的 Python 环境来自锁定的官方 `pyodide@314.0.3` npm 包。安装、启动和构建时会自动把所需原版运行资产准备到本地同源目录，不依赖额外 CDN。

## 单文件离线版

公开静态版：<https://stewieciao.github.io/python-agent/>（无需部署或安装，适合直接浏览课程内容）。

直接双击项目根目录的 `Stewie-个人学习站-离线版.html` 即可使用，不需要安装 Python、Node.js，也不需要启动本地服务器。

- 内含 Python 64 节、LangChain/RAG 48 节、LangGraph 42 节课程地图、提示、项目和参考答案
- 不加载外部资源，不发送网络请求，也不执行学习者代码
- 草稿和完成进度只保存在当前浏览器；可通过“导出记录 / 导入记录”迁移到其他电脑
- 参考答案默认折叠，建议完成练习后再展开对照

课程或答案更新后，运行 `npm run build:offline` 可重新生成单文件版本。

需要发布到 GitHub Pages 时运行 `npm run build:pages`，然后将生成的 `dist-pages/` 目录选作 Pages 发布目录。

仓库已包含 GitHub Actions 发布工作流：在仓库 Settings → Pages 中将发布方式设为 GitHub Actions，推送到 `main` 后会自动生成并发布静态站点。访问链接由 GitHub Pages 设置页提供。

需要完整桌面能力时，在 GitHub Actions 中手动运行 `Build desktop installers`，或推送一个 `v*` 标签。工作流会为 macOS（arm64/x64）和 Windows（arm64/x64）生成安装包并上传为可下载的 Actions artifact；安装包内置 Python、课程快照和本地服务，不要求目标电脑安装 Node.js 或 Python。

在 macOS 上也可以本地生成当前架构的安装包：

```bash
npm run desktop:make
```

产物位于 `desktop/out/make/`；当前机器会生成对应架构的 DMG，其他平台请使用 GitHub Actions 的发行工作流。

## 课程与反馈

- 三条路线按 Track → Stage → Lesson → Project 组织，从 Python 基础到 LangChain/RAG 与 LangGraph 实战。
- 每节课提供“概念入门 → 逐步拆解 → 常见误区”的知识讲解，使用逐步代码示例和阅读要点照顾零基础学习者。
- 包含智能旅行助手、自动化 DeepResearch 与 Mini Agent 框架三个综合案例。
- Python 基础顺序参考 [Python 官方教程](https://docs.python.org/3/tutorial/)；Agent 路线与案例参考并注明 [Datawhale Hello-Agents](https://github.com/datawhalechina/hello-agents) 原始章节。
- LangChain/RAG 的路线复核了 [pixegami/langchain-rag-tutorial](https://github.com/pixegami/langchain-rag-tutorial) 的端到端文档问答拆解；LangGraph 复核了官方 [langgraph-ai/langgraph](https://github.com/langchain-ai/langgraph) 示例与 [LangChain Academy](https://academy.langchain.com/courses/langgraph-essentials-python)。这些仓库只作为学习顺序和项目边界参考，站内代码仍以锁定版本的官方 API 与本地真实测试为准。
- 桌面版可在模型设置中保存 OpenAI-compatible 配置；API Key 只进入操作系统安全存储，不回显给页面。
- 桌面导师支持把本地多文档交给真实 Embedding 检索并返回来源；模型不可用时保留真实错误。
- Python 在独立 Web Worker 中真实运行；无限循环超过 4 秒会被终止，页面不会冻结。
- 反馈直接展示标准输出、标准错误、异常类型、行号、真实 traceback，以及每项测试的实际结果、期望结果、行为规则或教学构造。
- 进度、草稿和错题保存在本地；桌面版使用 SQLite，离线版使用浏览器本地存储。
- 桌面版的非敏感配置由本地服务管理：macOS 位于 `~/Library/Application Support/Stewie Learning Site/`，Windows 位于 `%APPDATA%/Stewie Learning Site/`；API Key 不写入这些文件，而是保存到当前系统用户的安全存储。离线版和 Pages 版不会接收或保存 API Key。
- “复制求助内容”会生成结构化 JSON 数据，保留本次运行的代码与反馈快照，默认要求 GPT 只给最小提示。

## 检查

```bash
npm test
npm run test:python
npm run lint
npm run build
```

`npm run test:python` 使用项目内置的 Python 3.13.15 运行时；若尚未准备运行时，先执行 `npm run prepare:python-runtime`。
