# Stewie LearnOS 课程审校记录

## Phase 0–1（2026-09-02）

阶段主题核对参考了 [LangChain Academy](https://github.com/langchain-ai/langchain-academy)、[langgraph-101](https://github.com/langchain-ai/langgraph-101)、[learning-langchain](https://github.com/langchain-ai/learning-langchain) 以及 [LangChain Retrieval 官方教程](https://docs.langchain.com/oss/python/langchain/retrieval)。这些链接只作为路线参考，课程正文仍以锁定版本的官方文档为准。

- 作者目录已统一从 `app/content/catalog.ts` 生成，离线 HTML 与公开快照使用同一份数据。
- 当前课程地图：Python 64 节 / 6 个项目，LangChain-RAG 48 节 / 4 个项目，LangGraph 42 节 / 4 个项目；阶段数分别为 8 / 7 / 7。
- LangChain 草稿的官方文档已归入 `officialSources`，视频仅使用允许的视频域名。
- 草稿具备三张讲解卡、三层提示、先修关系和行为/结构检查；适配器回归测试确认这些字段不会丢失。
- 离线版重新生成并通过无外部资源检查；模型设置、聊天和 RAG runtime 不进入离线文件。
- 开发页真实验收确认课程导师包含“用本地资料做一次 RAG 检索”面板，可导入多个文本文件并显示来源。

## 验证证据

- `npm test`：139 项通过。
- 后续代表课批次将扩展条目中的占位内容逐阶段替换为作者内容；当前审查统计仍有 Python 8、LangChain/RAG 27、LangGraph 27 节待深写，不能视为最终课程完成。
- `npm run lint -- --max-warnings=0`：通过。
- `npm run build`：通过。
- `git diff --check`：通过。
- 项目自带 Python 3.13.15 运行环境准备完成；`python-runtime` 37 项测试与 packaged smoke 均通过（LangChain 1.2.12、LangGraph 1.1.2、SQLite FTS5）。

## 尚未完成的内容审校

Phase 2–8 仍需逐阶段把扩展课程替换为逐课作者内容，补齐每课的原创示例、真实行为检查、迁移卡和项目 README，并在桌面端逐路线抽查执行、复习和个性化题目闭环。当前地图保证结构和可浏览性，不把生成的扩展条目视为最终教学质量验收。
