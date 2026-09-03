import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tutor_graph import TutorGraphError, create_tutor_graph, validate_tutor_response
from langgraph.checkpoint.memory import MemorySaver


CHUNKS = [{"id": "lesson-1", "source": "lesson.md", "text": "函数返回值"}]
BASE_STATE = {
    "course_id": "python",
    "lesson_id": "functions",
    "user_question": "为什么这里要 return？",
    "mastery_snapshot": {"functions": {"score": 0.25}},
    "retrieved_chunks": CHUNKS,
    "response": {},
    "citations": [],
    "next_action": "",
}


class TutorGraphTest(unittest.TestCase):
    def test_graph_accepts_only_citations_from_retrieved_chunks(self):
        response = {"answer": "return 把值交给调用方。", "citations": [{"source": "lesson.md"}]}

        result = validate_tutor_response(response, CHUNKS)

        self.assertEqual(result["answer"], response["answer"])
        self.assertEqual(result["citations"], response["citations"])

        with self.assertRaisesRegex(TutorGraphError, "引用来源无效"):
            validate_tutor_response(
                {"answer": "猜测", "citations": [{"source": "outside.md"}]}, CHUNKS
            )

    def test_graph_returns_explicit_insufficient_context_without_success_response(self):
        result = validate_tutor_response(
            {"answer": "资料不足", "citations": []}, []
        )

        self.assertEqual(result["status"], "insufficient_context")
        self.assertEqual(result["answer"], "资料不足")

    def test_graph_state_isolated_by_thread_id(self):
        graph = create_tutor_graph(MemorySaver())
        first = graph.invoke(
            {**BASE_STATE, "response": {"answer": "A", "citations": [{"source": "lesson.md"}]}},
            {"configurable": {"thread_id": "thread-a"}},
        )
        second = graph.invoke(
            {**BASE_STATE, "response": {"answer": "B", "citations": [{"source": "lesson.md"}]}},
            {"configurable": {"thread_id": "thread-b"}},
        )

        self.assertEqual(first["response"]["answer"], "A")
        self.assertEqual(second["response"]["answer"], "B")
        self.assertEqual(first["thread_id"], "thread-a")
        self.assertEqual(second["thread_id"], "thread-b")

    def test_graph_rejects_missing_question_or_unvalidated_response(self):
        graph = create_tutor_graph(MemorySaver())
        with self.assertRaisesRegex(TutorGraphError, "问题不能为空"):
            graph.invoke({**BASE_STATE, "user_question": ""}, {"configurable": {"thread_id": "x"}})
        with self.assertRaisesRegex(TutorGraphError, "回答必须包含 answer 和 citations"):
            graph.invoke({**BASE_STATE, "response": {}}, {"configurable": {"thread_id": "x"}})


if __name__ == "__main__":
    unittest.main()
