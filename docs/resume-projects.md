# Stewie LearnOS 简历项目指南

这些项目都能在本机复现，建议选择 1 个主项目加 1 个辅助项目展示，而不是把所有练习都堆在简历上。

| 项目 | 适合展示的能力 | 面试演示证据 |
| --- | --- | --- |
| `adaptive-python-coach` | Worker 隔离、真实 traceback、错题模式与个性化练习 | 运行失败代码 → 生成不同输入的变体 → 复测通过 |
| `private-rag-study-assistant` | 本地资料摄取、引用、无资料边界、隐私设计 | 导入 Markdown/PDF → 回答带来源 → 无命中显示资料不足 |
| `rag-quality-workbench` | recall@k、MRR、重排、引用覆盖和回归评测 | 固定数据集运行评测并解释指标变化 |
| `agentic-rag-router` | 工具路由、Agent 循环、失败状态和检索边界 | 未知工具真实失败；命中与无命中分支可复现 |
| `supervisor-research-graph` | Supervisor、多 Agent 角色交接、状态隔离 | 展示角色路由、未知角色错误和线程隔离 |
| `recoverable-research-graph` | checkpoint、interrupt、恢复执行和人工审核 | 暂停 → 拒绝/批准 → 从同一 thread 恢复 |
| `mini-agent-framework` | 工具注册、动作协议、history、步数上限 | `python demo.py` 展示 Finish 与 `max_steps` 两条路径 |

## 推荐简历表述

**主项目：Stewie LearnOS — Local-First Adaptive RAG Learning Platform**

> 构建本机优先的 Python/LangChain/LangGraph 学习平台：在 Worker 中真实执行练习，保存 stdout/stderr/traceback，依据已审核的 exercise family 生成不同输入的个性题；桌面端通过系统安全存储保护模型密钥，并提供带引用和评测指标的本地 RAG。

简历中应同时写清楚验证证据（测试、演示数据和失败边界），不要只写“支持 Agent/RAG”。离线版不执行代码、不保存 API Key；需要真实模型调用时使用桌面完整版。
