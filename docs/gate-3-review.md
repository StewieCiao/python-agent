# Gate 3 审校记录

核验基线：`codex/stewie-learning-site`，2026-09-02。

## 已验证边界

- 可信 exercise family 使用唯一 ID、单一 lesson 绑定、固定 validator 版本、难度、错误模式和教学约束。
- family 元数据与判题检查共同计算 `familyHash`，并写入公开/服务课程快照。
- 个性题变体来自固定参数表；同一 seed 可复现，最近题目会被拒绝。
- 候选题目必须匹配 family、版本和已知变体参数；字段缺失、参数篡改或未知 family 会明确失败。
- 掌握度只读取真实 pass/fail 事件，保留错误模式；无效事件、未来时间和 family 变更会明确失败。
- mastery event 与已验证个性题摘要保存在 SQLite；服务重启后可读取复习队列。
- `mastery.record`、`mastery.get`、`personalization.next` 通过桌面安全桥接暴露；浏览器路径不会改走模型服务。
- API Key 不进入 family、掌握度、个性题或课程快照。

## 测试证据

- Python runtime 全量测试：37 项通过。
- Node 回归测试：129 项通过。
- TypeScript、桌面类型检查和零警告 lint 通过。
- `git diff --check` 通过。

## 明确未完成

- 个性题目前使用已审校的确定性变体；尚未接入模型生成。
- 尚未执行学习者代码的 family 专属隐藏验证；服务不会把结构校验伪装成运行成功。
- 三条课程扩展和本地 RAG 不属于本 Gate 记录，也未在本轮启动。
