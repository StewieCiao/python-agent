"""可复现的 RAG 重排与资料不足演示，不依赖外部服务。"""

import json


def rerank(candidates, top_k):
    """按重排分数降序选择候选，保留真实 source。"""
    if not isinstance(top_k, int) or isinstance(top_k, bool) or top_k < 0:
        raise ValueError("top_k must be a non-negative integer")
    ranked = sorted(candidates, key=lambda item: item["rerank_score"], reverse=True)
    return ranked[:top_k]


def evaluate(expected_sources, candidates, top_k):
    """返回可解释的召回、引用覆盖和 no_results 状态。"""
    selected = rerank(candidates, top_k)
    expected = set(expected_sources)
    retrieved = {item["source"] for item in selected}
    if not expected or not retrieved:
        return {"status": "no_results", "recall": 0.0, "sources": []}
    return {
        "status": "ok",
        "recall": len(expected & retrieved) / len(expected),
        "sources": [item["source"] for item in selected],
    }


def main():
    candidates = [
        {"source": "guide.md", "rerank_score": 0.72},
        {"source": "policy.md", "rerank_score": 0.94},
    ]
    print(json.dumps(evaluate(["policy.md"], candidates, 1), ensure_ascii=False))
    print(json.dumps(evaluate(["missing.md"], candidates, 1), ensure_ascii=False))


if __name__ == "__main__":
    main()
