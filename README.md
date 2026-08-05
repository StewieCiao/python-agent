# Python → Agent

一个仅在本机使用的智能体开发闯关工作台：学 Python → 写组件 → 运行判题 → 看反馈 → 复习错题 → 构建 Agent。

## 使用

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址（通常是 `http://localhost:3000/`）。

运行所需的 Python 环境来自锁定的官方 `pyodide@314.0.3` npm 包。安装、启动和构建时会自动把所需原版运行资产准备到本地同源目录，不依赖额外 CDN。

## 课程与反馈

- 25 个关卡，从 Python 起步与工程能力，逐步进入 ReAct、Plan-and-Solve、Reflection、Memory/RAG、多 Agent 协作。
- 包含智能旅行助手、自动化 DeepResearch 与 Mini Agent 框架三个综合案例。
- Python 基础顺序参考 [Python 官方教程](https://docs.python.org/3/tutorial/)；Agent 路线与案例参考并注明 [Datawhale Hello-Agents](https://github.com/datawhalechina/hello-agents) 原始章节。
- Agent 关卡使用确定性的本地工具与模型响应模拟，不需要 API Key；重点先掌握循环、状态、工具契约和错误边界。
- Python 在独立 Web Worker 中真实运行；无限循环超过 4 秒会被终止，页面不会冻结。
- 反馈直接展示标准输出、标准错误、异常类型、行号、真实 traceback，以及每项测试的实际结果、期望结果、行为规则或教学构造。
- 进度、草稿和错题只保存在当前浏览器的本地存储。
- “复制求助内容”会生成结构化 JSON 数据，保留本次运行的代码与反馈快照，默认要求 GPT 只给最小提示。

## 检查

```bash
npm test
npm run lint
npm run build
```
