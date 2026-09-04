# Mini Agent 工具框架

## 用户故事

为个人研究助手提供一个小而可观察的 Agent 运行时：工具注册和替换都通过明确接口完成，每次会话保留动作、输入与观察，达到步数上限时明确停止。

## 架构与数据流

`动作文本 → 工具解析 → 注册工具 → observation → history → Finish 或 max_steps`

框架不生成默认答案。重复注册保留 `ValueError`，未知工具保留 `KeyError`，未完成的运行返回 `answer=None`，便于上层展示真实失败边界。

## 演示脚本

在项目目录运行 `python demo.py`：

1. 注册 `echo` 工具并执行一次工具动作和 `Finish`。
2. 查看返回的 answer 与 history。
3. 用 `max_steps=1` 验证第二个 Finish 不会被越过。
4. 观察重复工具和未知工具的真实异常。

## 已知限制

这是教学用同步运行时，不包含模型调用、并发调度或持久化 checkpoint；生产系统仍需为工具权限、超时和外部副作用增加独立边界。
