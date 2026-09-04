"""确定性的 Supervisor 路由演示，不依赖模型或网络。"""


def dispatch(task, workers):
    role = task["role"]
    result = workers[role](task["input"])
    return {"role": role, "input": task["input"], "result": result}


def run_workflow(topic):
    workers = {
        "researcher": lambda value: {"sources": [f"{value}.md"]},
        "writer": lambda value: f"草稿：{value}",
        "reviewer": lambda value: {"approved": bool(value)},
    }
    steps = [
        dispatch({"role": "researcher", "input": topic}, workers),
        dispatch({"role": "writer", "input": topic}, workers),
        dispatch({"role": "reviewer", "input": True}, workers),
    ]
    return steps


if __name__ == "__main__":
    print(run_workflow("LangGraph"))
