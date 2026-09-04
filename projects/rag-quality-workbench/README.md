# RAG Quality Workbench

一个可复现的本地 RAG 质量评测工作台：把同一组问答样本交给检索器，比较召回来源、引用覆盖和资料不足边界，帮助定位“检索错”还是“回答错”。项目不依赖在线服务，模型调用由学习站的本地安全配置控制。

## 用户故事

作为维护团队知识库的人，我希望每次调整切分、Embedding 或 Retriever 后，都能看到 recall@k、首个命中位置和引用覆盖率；没有相关资料时必须明确返回 `no_results`，不能生成看似确定的答案。

## 输入与输出

- 输入：带 `query`、`expectedSources` 的固定问答样本，以及检索结果和回答引用。
- 输出：每条样本的实际来源、`recall`、`citation_coverage`、状态和耗时；原始文本与来源 metadata 一并保留。
- 不做：不把主观回答相似度当作检索通过，也不估算缺失的 token usage。

## 演示脚本

在项目目录执行 `python demo.py` 可看到一次真实命中和一次 `no_results` 的 JSON 结果。

1. 准备两份带 `source` metadata 的 Markdown 文档和三条固定问题。
2. 执行离线 indexing，再运行同一批检索评测，记录 `recall@k`、MRR 与引用覆盖。
3. 修改切分大小或 `top_k`，重新运行并比较真实指标。
4. 在生成前加入重排步骤：记录每个候选的 `source` 和 `rerank_score`，排序后再截取 `top_k`，比较重排前后的首个命中位置。
5. 用一条没有命中的问题验证返回 `status=no_results`、空来源，并确认不会调用生成步骤。
6. 将成功与失败结果写入 README 或终端记录，说明本次改动的取舍。

## 架构与验收

`load → split → embed → store` 是可重跑的离线流程；`retrieve → threshold → rerank → cite → evaluate` 是在线请求中的可观察流程。验收至少覆盖：典型命中、不同来源顺序、重复来源去重、重排后的 `top_k` 边界、无命中和模型失败。每次结果携带课程哈希、资料哈希和 Embedding 模型名，便于复现。

## 已知限制

- 内置样本用于学习和回归，不代表真实业务数据的质量。
- 当前评测不替代人工检查答案事实性；它只报告可计算的检索与引用指标。
- API Key 只在桌面版系统安全存储中使用，离线 HTML 不保存或发送密钥。
