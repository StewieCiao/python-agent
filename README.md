# Python Path

一个仅在本机使用的 Python 闯关学习工作台：学知识 → 写代码 → 真实运行 → 看反馈 → 复习错题 → 做项目。

## 使用

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址（通常是 `http://localhost:3000/`）。

运行所需的 Python 环境来自锁定的官方 `pyodide@314.0.3` npm 包。安装、启动和构建时会自动把所需原版运行资产准备到本地同源目录，不依赖额外 CDN。

## 课程与反馈

- 15 个关卡，覆盖基础语法、基础编程、高级编程和 3 个综合项目。
- 课程顺序参考 [Python 官方教程](https://docs.python.org/3/tutorial/)。
- Python 在独立 Web Worker 中真实运行；无限循环超过 4 秒会被终止，页面不会冻结。
- 反馈直接展示标准输出、标准错误、异常类型、行号、真实 traceback 和逐项测试结果。
- 进度、草稿和错题只保存在当前浏览器的本地存储。
- “复制求助内容”会生成结构化 JSON 数据，保留本次运行的代码与反馈快照，默认要求 GPT 只给最小提示。

## 检查

```bash
npm test
npm run lint
npm run build
```
