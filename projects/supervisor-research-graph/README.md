# Supervisor Research Graph

一个可恢复的多 Agent 研究工作流：Supervisor 根据任务状态选择 researcher、writer 或 reviewer，节点只返回局部状态更新，LangGraph checkpoint 保存每条 `thread_id` 的进度。

## 用户故事

作为需要整理资料的个人研究者，我希望把检索、写作和复核拆成可观察的角色路由；高风险报告在提交前暂停等待人工确认，恢复时继续原来的 thread，而不是重新执行或串用别人的状态。

## 输入与输出

- 输入：研究主题、任务状态、`thread_id` 和已注册 worker。
- 输出：每次节点交接的角色、状态更新、来源和审批状态。
- 不做：Supervisor 不直接生成事实答案；未知角色不自动选择默认 worker。

## 演示脚本

1. 用 `thread_id=research-1` 启动 researcher → writer → reviewer 三个节点，记录每次状态更新。
2. 在 reviewer 前触发 `interrupt`，展示待审核状态和当前 checkpoint。
3. 用同一个 `thread_id` 恢复并批准，确认只继续未完成节点。
4. 用 `thread_id=research-2` 并行运行另一主题，验证状态与长期偏好互不串线。
5. 传入未注册角色，确认保留 `KeyError` 并停止流程，而不是伪造成功结果。

## 架构与验收

状态包含 `topic`、`plan`、`findings`、`sources`、`draft` 和 `approved`；短期状态由 checkpoint 按 thread 保存，跨 thread 偏好放入 Store。验收覆盖角色路由、状态合并、人工中断、同 thread 恢复、不同 thread 隔离、未知角色失败和来源保留。

## 已知限制

- 示例 worker 使用本地确定性函数，不代表真实搜索质量。
- checkpoint 的 SQLite 部署、并行度和权限策略需要按生产环境单独配置。
- 模型密钥不写入图状态或日志，只由桌面版系统安全存储管理。

