import warnings
from typing import Any, TypedDict


class TutorGraphError(ValueError):
    pass


class TutorState(TypedDict, total=False):
    course_id: str
    lesson_id: str
    user_question: str
    mastery_snapshot: dict[str, Any]
    retrieved_chunks: list[dict[str, Any]]
    response: dict[str, Any]
    citations: list[dict[str, str]]
    next_action: str
    thread_id: str
    turn_ready: bool


def _validate_chunks(chunks):
    if not isinstance(chunks, list):
        raise TutorGraphError("检索资料结构无效")
    for chunk in chunks:
        if (
            not isinstance(chunk, dict)
            or set(chunk) != {"id", "source", "text"}
            or not all(isinstance(chunk[field], str) and chunk[field] for field in ("id", "source", "text"))
        ):
            raise TutorGraphError("检索资料结构无效")


def validate_tutor_response(response, retrieved_chunks):
    _validate_chunks(retrieved_chunks)
    if not isinstance(response, dict) or set(response) != {"answer", "citations"}:
        raise TutorGraphError("回答必须包含 answer 和 citations")
    if not isinstance(response["answer"], str) or not response["answer"].strip():
        raise TutorGraphError("回答内容不能为空")
    citations = response["citations"]
    if not isinstance(citations, list):
        raise TutorGraphError("引用必须是数组")
    sources = {chunk["source"] for chunk in retrieved_chunks}
    for citation in citations:
        if not isinstance(citation, dict) or set(citation) != {"source"} or citation["source"] not in sources:
            raise TutorGraphError("引用来源无效")
    if retrieved_chunks and not citations:
        raise TutorGraphError("有检索资料时回答必须包含引用")
    if not retrieved_chunks:
        return {"status": "insufficient_context", "answer": response["answer"], "citations": []}
    return {"status": "ok", "answer": response["answer"], "citations": citations}


def create_tutor_graph(checkpointer):
    with warnings.catch_warnings():
        warnings.filterwarnings(
            "ignore",
            message="The default value of `allowed_objects` will change in a future version.*",
            category=Warning,
        )
        from langgraph.graph import END, START, StateGraph

    def load_context(state, config):
        for field in ("course_id", "lesson_id", "user_question", "mastery_snapshot"):
            if field not in state:
                raise TutorGraphError(f"导师状态缺少 {field}")
        if not isinstance(state["user_question"], str) or not state["user_question"].strip():
            raise TutorGraphError("问题不能为空")
        if not isinstance(state["mastery_snapshot"], dict):
            raise TutorGraphError("掌握度快照无效")
        thread_id = config.get("configurable", {}).get("thread_id")
        if not isinstance(thread_id, str) or not thread_id:
            raise TutorGraphError("thread_id 必须是非空字符串")
        return {"thread_id": thread_id}

    def retrieve_sources(state):
        _validate_chunks(state.get("retrieved_chunks"))
        return {}

    def choose_teaching_move(state):
        return {"next_action": "explain" if state["retrieved_chunks"] else "insufficient_context"}

    def draft_hint_or_explanation(state):
        if "response" not in state:
            raise TutorGraphError("回答必须包含 answer 和 citations")
        return {}

    def validate_citations_node(state):
        validated = validate_tutor_response(state["response"], state["retrieved_chunks"])
        return {
            "response": validated,
            "citations": validated["citations"],
            "next_action": "respond" if validated["status"] == "ok" else "insufficient_context",
        }

    def save_turn(state):
        return {"turn_ready": True}

    builder = StateGraph(TutorState)
    builder.add_node("load_context", load_context)
    builder.add_node("retrieve_sources", retrieve_sources)
    builder.add_node("choose_teaching_move", choose_teaching_move)
    builder.add_node("draft_hint_or_explanation", draft_hint_or_explanation)
    builder.add_node("validate_citations", validate_citations_node)
    builder.add_node("save_turn", save_turn)
    builder.add_edge(START, "load_context")
    builder.add_edge("load_context", "retrieve_sources")
    builder.add_edge("retrieve_sources", "choose_teaching_move")
    builder.add_edge("choose_teaching_move", "draft_hint_or_explanation")
    builder.add_edge("draft_hint_or_explanation", "validate_citations")
    builder.add_edge("validate_citations", "save_turn")
    builder.add_edge("save_turn", END)
    return builder.compile(checkpointer=checkpointer)
