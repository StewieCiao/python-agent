"""无依赖的 Mini Agent 框架演示。"""


class Agent:
    def __init__(self, name, max_steps=5):
        self.name = name
        self.max_steps = max_steps
        self.tools = {}
        self.history = []

    def register_tool(self, name, func):
        if name in self.tools:
            raise ValueError("duplicate tool")
        self.tools[name] = func

    def run(self, actions):
        self.history = []
        for action_text in actions[: self.max_steps]:
            if "[" not in action_text or not action_text.endswith("]"):
                continue
            name, payload = action_text[:-1].split("[", 1)
            if name == "Finish":
                return {"answer": payload, "history": self.history.copy()}
            observation = self.tools[name](payload)
            self.history.append({"action": name, "input": payload, "observation": observation})
        return {"answer": None, "history": self.history.copy()}


if __name__ == "__main__":
    agent = Agent("demo", max_steps=2)
    agent.register_tool("echo", str.upper)
    print(agent.run(["echo[hello]", "Finish[done]"]))
    limited = Agent("limited", max_steps=1)
    limited.register_tool("echo", str.upper)
    print(limited.run(["echo[one]", "Finish[done]"]))
