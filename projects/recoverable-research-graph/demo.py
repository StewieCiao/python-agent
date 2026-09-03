"""Small LangGraph demo showing checkpointed approval and resume."""

from typing import TypedDict

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import END, START, StateGraph
from langgraph.types import Command, interrupt


class ResearchState(TypedDict, total=False):
    topic: str
    draft: str
    approved: bool
    status: str


def build_graph():
    def draft(state):
        return {"draft": f"关于 {state['topic']} 的研究草稿"}

    def review(state):
        approved = interrupt({"draft": state["draft"], "requires_approval": True})
        return {"approved": bool(approved), "status": "approved" if approved else "cancelled"}

    def finish(state):
        return {"status": state["status"]}

    builder = StateGraph(ResearchState)
    builder.add_node("draft", draft)
    builder.add_node("review", review)
    builder.add_node("finish", finish)
    builder.add_edge(START, "draft")
    builder.add_edge("draft", "review")
    builder.add_edge("review", "finish")
    builder.add_edge("finish", END)
    return builder.compile(checkpointer=MemorySaver())


def run(topic, thread_id, approval):
    graph = build_graph()
    config = {"configurable": {"thread_id": thread_id}}
    graph.invoke({"topic": topic}, config)
    return graph.invoke(Command(resume=approval), config)


if __name__ == "__main__":
    print(run("LangGraph", "demo", True))
