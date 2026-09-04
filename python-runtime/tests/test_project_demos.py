import importlib.util
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


class ProjectDemosTest(unittest.TestCase):
    def test_adaptive_coach_preserves_real_failure_categories(self):
        coach = load("coach_demo", "projects/adaptive-python-coach/demo.py")
        self.assertEqual(coach.classify_attempt({"exception": {"type": "SyntaxError"}, "tests": []})["mistake_codes"], ["SyntaxError"])
        self.assertEqual(coach.classify_attempt({"exception": None, "tests": [{"name": "边界", "passed": False}]})["outcome"], "fail")

    def test_rag_demo_has_explicit_no_evidence_result(self):
        rag = load("rag_demo", "projects/private-rag-study-assistant/demo.py")
        self.assertEqual(rag.answer("未知", [{"text": "Python", "source": "a.md"}]), {"answer": "资料不足", "sources": []})

    def test_rag_demo_returns_matching_text_and_deduplicated_sources(self):
        rag = load("rag_demo_sources", "projects/private-rag-study-assistant/demo.py")
        documents = [
            {"text": "RAG 保留引用", "source": "notes.md"},
            {"text": "引用格式示例", "source": "notes.md"},
        ]
        result = rag.answer("引用", documents)
        self.assertEqual(result["answer"], "RAG 保留引用")
        self.assertEqual(result["sources"], ["notes.md"])

    def test_rag_demo_rejects_empty_question(self):
        rag = load("rag_demo_invalid", "projects/private-rag-study-assistant/demo.py")
        with self.assertRaisesRegex(ValueError, "question must be non-empty"):
            rag.answer("  ", [{"text": "Python", "source": "a.md"}])

    def test_rag_quality_workbench_reranks_and_preserves_no_results(self):
        workbench = load("rag_quality_demo", "projects/rag-quality-workbench/demo.py")
        candidates = [
            {"source": "low.md", "rerank_score": 0.2},
            {"source": "high.md", "rerank_score": 0.9},
        ]
        self.assertEqual(workbench.rerank(candidates, 1), [candidates[1]])
        self.assertEqual(workbench.evaluate(["high.md"], candidates, 1), {"status": "ok", "recall": 1.0, "sources": ["high.md"]})
        self.assertEqual(workbench.evaluate(["missing.md"], candidates, 0), {"status": "no_results", "recall": 0.0, "sources": []})
        with self.assertRaisesRegex(ValueError, "top_k"):
            workbench.rerank(candidates, -1)

    def test_research_graph_can_resume_same_thread_after_approval(self):
        graph = load("research_demo", "projects/recoverable-research-graph/demo.py")
        result = graph.run("LangGraph", "thread-a", True)
        self.assertEqual(result["status"], "approved")


if __name__ == "__main__":
    unittest.main()
