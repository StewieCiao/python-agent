"""确定性的 Agentic RAG 路由演示，不依赖模型或网络。"""


def route_question(question):
    if not isinstance(question, str) or not question.strip():
        raise ValueError("question must be non-empty")
    return "retrieve" if "期限" in question or "政策" in question else "direct"


def answer_question(question, tools):
    route = route_question(question)
    if route == "direct":
        return {"route": route, "answer": "请提供更具体的问题", "sources": []}
    result = tools["search_knowledge"](question)
    if not result:
        return {"route": route, "answer": "资料不足", "sources": []}
    return {"route": route, "answer": result[0]["text"], "sources": [item["source"] for item in result]}


if __name__ == "__main__":
    tools = {"search_knowledge": lambda query: [{"text": "退款期限为 30 天", "source": "policy.md"}]}
    print(answer_question("退款期限", tools))
    print(answer_question("未知政策", {"search_knowledge": lambda query: []}))
