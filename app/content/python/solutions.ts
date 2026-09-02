export const lessonSolutions: Record<string, string> = {
  "first-output": `print("我的第一段 Python")
print(8 * 7)`,
  variables: `name = "小派"
level = 1

print(f"{name}正在挑战第 {level} 关")`,
  strings: `def normalize_title(text):
    return text.strip().lower()`,
  branches: `def grade(score):
    if score < 60:
        return "C"
    if score < 90:
        return "B"
    return "A"`,
  loops: `def sum_even(numbers):
    total = 0
    for number in numbers:
        if number % 2 == 0:
            total += number
    return total`,
  functions: `def shipping_fee(price, member):
    return 0 if member or price >= 99 else 10`,
  lists: `def improve_scores(scores):
    return [min(score + 5, 100) for score in scores if score >= 60]`,
  dictionaries: `def word_counts(words):
    result = {}
    for word in words:
        result[word] = result.get(word, 0) + 1
    return result`,
  exceptions: `def parse_age(text):
    try:
        return int(text)
    except ValueError:
        return None`,
  classes: `class Wallet:
    def __init__(self):
        self.balance = 0

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("amount must be positive")
        self.balance += amount
        return self.balance`,
  generators: `def even_numbers(limit):
    for number in range(0, limit + 1, 2):
        yield number`,
  decorators: `def twice(func):
    def wrapper(*positional, **named):
        func(*positional, **named)
        return func(*positional, **named)
    return wrapper`,
  "project-text": `def analyze(text):
    words = text.lower().split()
    counts = {}
    for word in words:
        counts[word] = counts.get(word, 0) + 1
    top = max(counts, key=counts.get) if counts else None
    return {"words": len(words), "unique": len(counts), "top": top}`,
  "project-expense": `def summarize(records):
    total = 0
    by_category = {}
    for record in records:
        total += record["amount"]
        category = record["category"]
        by_category[category] = by_category.get(category, 0) + record["amount"]
    return {"total": total, "by_category": by_category}`,
  "project-tasks": `def plan(tasks):
    for task in tasks:
        if task["priority"] not in range(1, 6):
            raise ValueError("priority must be 1-5")
    ordered = sorted(
        tasks,
        key=lambda task: (-task["priority"], task["name"]),
    )
    return [task["name"] for task in ordered]`,
  "agent-tool-registry": `class ToolRegistry:
    def __init__(self):
        self.tools = {}

    def register(self, name, func):
        if name in self.tools:
            raise ValueError("duplicate tool")
        self.tools[name] = func

    def execute(self, name, payload):
        return self.tools[name](**payload)`,
  "agent-action-parser": `def parse_action(text):
    text = text.strip()
    if "[" not in text or not text.endswith("]"):
        return None, None
    name, payload = text[:-1].split("[", 1)
    if not name:
        return None, None
    return name, payload`,
  "agent-react-loop": `def parse_action(text):
    text = text.strip()
    if "[" not in text or not text.endswith("]"):
        return None, None
    name, payload = text[:-1].split("[", 1)
    return (name, payload) if name else (None, None)


def run_react(actions, tools, max_steps=5):
    history = []
    steps = 0
    for action_text in actions[:max_steps]:
        steps += 1
        name, payload = parse_action(action_text)
        if name == "Finish":
            return {"answer": payload, "history": history, "steps": steps}
        observation = tools[name](payload)
        history.append({
            "action": name,
            "input": payload,
            "observation": observation,
        })
    return {"answer": None, "history": history, "steps": steps}`,
  "agent-plan-solve": `def execute_plan(steps, executor):
    context = {}
    results = []
    for step in steps:
        result = executor(step["task"], context.copy())
        results.append({"id": step["id"], "result": result})
        context[step["id"]] = result
    return results`,
  "agent-reflection": `def reflection_loop(draft, evaluate, revise, max_rounds=3):
    if max_rounds < 0:
        raise ValueError("max_rounds must be non-negative")
    for _ in range(max_rounds):
        if evaluate(draft):
            return draft
        draft = revise(draft)
    return draft`,
  "agent-memory-retrieval": `def retrieve_memories(memories, query, limit=2):
    if limit <= 0:
        return []
    query_words = set(query.lower().split())
    scored = []
    for index, memory in enumerate(memories):
        content_words = set(memory["content"].lower().split())
        overlap = len(query_words & content_words)
        if overlap:
            scored.append((
                overlap,
                memory["importance"],
                index,
                memory["content"],
            ))
    scored.sort(key=lambda item: (-item[0], -item[1], item[2]))
    return [item[3] for item in scored[:limit]]`,
  "agent-handoff": `def handoff(sender, task, agents):
    for agent in agents:
        if task["capability"] in agent["capabilities"]:
            return {
                "from": sender,
                "to": agent["name"],
                "task": task["description"],
            }
    raise LookupError(f"no agent for {task['capability']}")`,
  "agent-travel-project": `def build_trip(city, tools):
    trace = []
    weather = tools["weather"](city)
    trace.append({
        "tool": "weather",
        "input": city,
        "observation": weather,
    })
    condition = weather["condition"]
    attractions = tools["attraction"](city, condition)
    trace.append({
        "tool": "attraction",
        "input": {"city": city, "condition": condition},
        "observation": attractions,
    })
    return {
        "city": city,
        "weather": weather,
        "attractions": attractions,
        "trace": trace,
    }`,
  "agent-deep-research-project": `def build_research_report(topic, tasks, search):
    sections = []
    sources = []
    for task in tasks:
        results = search(task)
        findings = [item["snippet"] for item in results]
        section_sources = [item["url"] for item in results]
        sections.append({
            "title": task,
            "findings": findings,
            "sources": section_sources,
        })
        for url in section_sources:
            if url not in sources:
                sources.append(url)
    return {"topic": topic, "sections": sections, "sources": sources}`,
  "agent-framework-capstone": `class Agent:
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
        for action_text in actions[:self.max_steps]:
            if "[" not in action_text or not action_text.endswith("]"):
                continue
            name, payload = action_text[:-1].split("[", 1)
            if name == "Finish":
                return {"answer": payload, "history": self.history.copy()}
            observation = self.tools[name](payload)
            self.history.append({
                "action": name,
                "input": payload,
                "observation": observation,
            })
        return {"answer": None, "history": self.history.copy()}`,
};
