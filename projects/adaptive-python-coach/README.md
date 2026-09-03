# 自适应 Python 编程教练

## 用户故事

学习者运行练习后，系统保存真实 stdout、stderr、traceback 和测试结果，归纳稳定的错误模式，并从经过校验的 exercise family 生成同能力但不同输入的个性题。模型只解释结果，不参与通过/失败判定。

## 架构与数据流

`Worker 执行 → 行为检查 → mistake code → mastery event → review queue → family 变体`

代码在独立 Worker 中运行，4 秒超时会终止并重建 Worker。个性题携带不可变测试签名，运行时会校验 family、版本、参数和测试集合。

## 演示脚本

可直接运行 `python demo.py` 查看一次通过结果；也可以把真实执行结果传给 `classify_attempt`，观察异常、测试失败和通过三种状态。

1. 用错误代码触发真实 SyntaxError 或测试失败。
2. 在错题页查看失败代码和复习推荐。
3. 生成一组不同输入的个性题，确认题目不是原样复制。
4. 运行正确实现，确认 mastery 和 review queue 更新。
5. 输入无限循环，展示超时后 Worker 恢复且页面仍可继续运行。

## 已知限制

个性题首版依赖作者预先审核的 family 变体，不让模型自由生成未经验证的判题逻辑；离线版只提供课程内容，不执行学习者代码。
