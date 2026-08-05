import { loadPyodide } from "/pyodide/pyodide.mjs";

const PYODIDE_VERSION = "314.0.3";
const PYODIDE_INDEX_URL = new URL("/pyodide/", self.location.origin).href;

const PYTHON_HARNESS = String.raw`
import contextlib
import copy
import ast
import inspect
import io
import json
import re
import traceback

def _raises_value_error(func):
    try:
        func()
    except ValueError:
        return True
    return False

def _raises_key_error(func):
    try:
        func()
    except KeyError:
        return True
    return False

def _raises_lookup_error(func):
    try:
        func()
    except LookupError:
        return True
    return False

def _second_print_uses_multiplication(source):
    tree = ast.parse(source, filename="<learner>")
    print_calls = [
        statement.value
        for statement in tree.body
        if isinstance(statement, ast.Expr)
        and isinstance(statement.value, ast.Call)
        and isinstance(statement.value.func, ast.Name)
        and statement.value.func.id == "print"
    ]
    if len(print_calls) < 2 or not print_calls[1].args:
        return False
    return any(isinstance(node, ast.Mult) for node in ast.walk(print_calls[1].args[0]))

def _function_node(source, function_name):
    tree = ast.parse(source, filename="<learner>")
    return next(
        (
            node
            for node in tree.body
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef))
            and node.name == function_name
        ),
        None,
    )

def _nodes_in_scope(function):
    pending = list(reversed(function.body))
    while pending:
        node = pending.pop()
        if isinstance(
            node,
            (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Lambda),
        ):
            continue
        yield node
        children = list(ast.iter_child_nodes(node))
        pending.extend(reversed(children))

def _function_has_node(source, function_name, node_type_name):
    function = _function_node(source, function_name)
    node_type = getattr(ast, node_type_name)
    return function is not None and any(
        isinstance(node, node_type) for node in _nodes_in_scope(function)
    )

def _function_node_count(source, function_name, node_type_name):
    function = _function_node(source, function_name)
    if function is None:
        return 0
    node_type = getattr(ast, node_type_name)
    return sum(
        isinstance(node, node_type) for node in _nodes_in_scope(function)
    )

def _function_catches_only_value_error(source, function_name):
    function = _function_node(source, function_name)
    if function is None:
        return False
    handlers = [
        node for node in _nodes_in_scope(function) if isinstance(node, ast.ExceptHandler)
    ]
    return bool(handlers) and all(
        isinstance(handler.type, ast.Name) and handler.type.id == "ValueError"
        for handler in handlers
    )

def _normalize_python_label(text):
    return re.sub(r"\s+(?=Python$)", "", text.strip())

def _silent_call(func, *args, **kwargs):
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        result = func(*args, **kwargs)
    return result, output.getvalue()

def _type_error_escapes(func):
    class TypeErrorProbe:
        def __int__(self):
            raise TypeError("type-error-probe")
    try:
        func(TypeErrorProbe())
    except TypeError:
        return True
    return False

def _wallet_results(wallet_type):
    wallet = wallet_type()
    first = wallet.deposit(30)
    second = wallet.deposit(12)
    return first, second, wallet.balance

def _wallet_sequence(wallet_type):
    return _wallet_results(wallet_type) == (30, 42, 42)

def _decorator_observation(decorator):
    calls = []
    def target(left, right, *, scale):
        calls.append(((left, right), {"scale": scale}))
        return len(calls) * scale
    result = decorator(target)(2, 3, scale=4)
    return {"calls": calls, "result": result}

def _decorator_contract(decorator):
    expected_call = ((2, 3), {"scale": 4})
    observation = _decorator_observation(decorator)
    return observation == {
        "calls": [expected_call, expected_call],
        "result": 8,
    }

def _plan_preserves_input(func):
    items = [{"name": "x", "priority": 2}, {"name": "y", "priority": 4}]
    before = copy.deepcopy(items)
    func(items)
    return items == before

def _tool_registry_observation(registry_type):
    calls = []
    def combine(left, right=0):
        calls.append({"left": left, "right": right})
        return left + right
    registry = registry_type()
    registry.register("combine", combine)
    results = [
        registry.execute("combine", {"left": 2, "right": 3}),
        registry.execute("combine", {"left": 10}),
    ]
    return {"results": results, "calls": calls}

def _tool_registry_contract(registry_type):
    return _tool_registry_observation(registry_type) == {
        "results": [5, 10],
        "calls": [{"left": 2, "right": 3}, {"left": 10, "right": 0}],
    }

def _tool_registry_errors(registry_type):
    registry = registry_type()
    registry.register("echo", lambda value: value)
    duplicate = _raises_value_error(lambda: registry.register("echo", lambda value: value))
    missing = _raises_key_error(lambda: registry.execute("missing", {"value": "x"}))
    return duplicate, missing

def _react_travel_observation(func):
    tools = {
        "weather": lambda city: f"{city}:晴",
        "attraction": lambda request: f"{request}:熊猫基地",
    }
    return func(
        ["weather[成都]", "attraction[成都|晴]", "Finish[安排完成]"],
        tools,
        5,
    )

def _react_limit_observation(func):
    return func(
        ["echo[one]", "Finish[不应到达]"],
        {"echo": lambda text: text.upper()},
        1,
    )

def _plan_solve_observation(func):
    steps = [
        {"id": "weather", "task": "查天气"},
        {"id": "route", "task": "排行程"},
    ]
    def executor(task, context):
        context_text = ",".join(f"{key}={value}" for key, value in context.items())
        return f"{task}|{context_text}"
    return func(steps, executor)

def _memory_retrieval_observation(func):
    memories = [
        {"content": "python basics", "importance": 0.9},
        {"content": "agent memory design", "importance": 0.95},
        {"content": "python agent tools", "importance": 0.6},
        {"content": "travel notes", "importance": 1.0},
    ]
    return func(memories, "PYTHON agent", 3)

def _handoff_observation(func):
    task = {"capability": "weather", "description": "查询成都天气"}
    agents = [
        {"name": "writer-agent", "capabilities": ["write"]},
        {"name": "weather-agent", "capabilities": ["weather", "location"]},
        {"name": "backup-agent", "capabilities": ["weather"]},
    ]
    return func("planner", task, agents)

def _handoff_contract(func):
    task = {"capability": "weather", "description": "查询成都天气"}
    agents = [
        {"name": "writer-agent", "capabilities": ["write"]},
        {"name": "weather-agent", "capabilities": ["weather", "location"]},
        {"name": "backup-agent", "capabilities": ["weather"]},
    ]
    before_task = copy.deepcopy(task)
    before_agents = copy.deepcopy(agents)
    result = func("planner", task, agents)
    return (
        result == {"from": "planner", "to": "weather-agent", "task": "查询成都天气"}
        and task == before_task
        and agents == before_agents
    )

def _travel_project_observation(func, city, condition, attractions):
    def weather(requested_city):
        if requested_city != city:
            raise AssertionError(f"weather 收到错误城市: {requested_city}")
        return {"condition": condition, "temperature": 26}
    def attraction(requested_city, requested_condition):
        if requested_city != city or requested_condition != condition:
            raise AssertionError(
                f"attraction 收到错误参数: {requested_city}, {requested_condition}"
            )
        return list(attractions)
    tools = {
        "weather": weather,
        "attraction": attraction,
    }
    return func(city, tools)

def _research_project_observation(func):
    data = {
        "基础": [
            {"snippet": "先学 Python", "url": "source-a"},
            {"snippet": "理解工具调用", "url": "source-shared"},
        ],
        "实践": [
            {"snippet": "实现 ReAct", "url": "source-shared"},
            {"snippet": "加入评估", "url": "source-b"},
        ],
    }
    return func("Agent 学习路线", ["基础", "实践"], lambda task: data[task])

def _mini_agent_observation(agent_type):
    agent = agent_type("helper", max_steps=3)
    agent.register_tool("echo", lambda text: text.upper())
    first = agent.run(["echo[hello]", "Finish[done]"])
    second = agent.run(["Finish[fresh]"])
    return {"first": first, "second": second}

def _mini_agent_contract(agent_type):
    return _mini_agent_observation(agent_type) == {
        "first": {
            "answer": "done",
            "history": [{"action": "echo", "input": "hello", "observation": "HELLO"}],
        },
        "second": {"answer": "fresh", "history": []},
    }

def _mini_agent_errors(agent_type):
    agent = agent_type("helper")
    agent.register_tool("echo", lambda text: text)
    duplicate = _raises_value_error(lambda: agent.register_tool("echo", lambda text: text))
    missing = _raises_key_error(lambda: agent.run(["missing[x]"]))
    return duplicate, missing

def _mini_agent_limit(agent_type):
    agent = agent_type("helper", max_steps=1)
    agent.register_tool("echo", lambda text: text.upper())
    return agent.run(["echo[one]", "Finish[不应到达]"])

_stdout_buffer = io.StringIO()
_stderr_buffer = io.StringIO()
_result = {
    "output": "",
    "stderr": "",
    "exception": None,
    "tests": [],
}
_learner_namespace = {"__name__": "__main__"}

try:
    _compiled = compile(__learner_code, "<learner>", "exec")
    with contextlib.redirect_stdout(_stdout_buffer), contextlib.redirect_stderr(_stderr_buffer):
        exec(_compiled, _learner_namespace, _learner_namespace)
except BaseException as _error:
    _line = _error.lineno if isinstance(_error, SyntaxError) else None
    if _line is None and _error.__traceback__ is not None:
        for _frame in traceback.extract_tb(_error.__traceback__):
            if _frame.filename == "<learner>":
                _line = _frame.lineno
    _result["exception"] = {
        "type": type(_error).__name__,
        "message": str(_error),
        "line": _line,
        "traceback": "".join(traceback.format_exception(_error)),
    }

_result["output"] = _stdout_buffer.getvalue()
_result["stderr"] = _stderr_buffer.getvalue()

if _result["exception"] is None:
    _output_lines = _result["output"].splitlines()
    _test_namespace = _learner_namespace.copy()
    _test_namespace.update({
        "_stdout": _result["output"],
        "_output_lines": _output_lines,
        "_source": __learner_code,
        "_raises_value_error": _raises_value_error,
        "_raises_key_error": _raises_key_error,
        "_raises_lookup_error": _raises_lookup_error,
        "_second_print_uses_multiplication": _second_print_uses_multiplication,
        "_function_has_node": _function_has_node,
        "_function_node_count": _function_node_count,
        "_function_catches_only_value_error": _function_catches_only_value_error,
        "_normalize_python_label": _normalize_python_label,
        "_silent_call": _silent_call,
        "_type_error_escapes": _type_error_escapes,
        "_wallet_results": _wallet_results,
        "_wallet_sequence": _wallet_sequence,
        "_decorator_observation": _decorator_observation,
        "_decorator_contract": _decorator_contract,
        "_plan_preserves_input": _plan_preserves_input,
        "_tool_registry_observation": _tool_registry_observation,
        "_tool_registry_contract": _tool_registry_contract,
        "_tool_registry_errors": _tool_registry_errors,
        "_react_travel_observation": _react_travel_observation,
        "_react_limit_observation": _react_limit_observation,
        "_plan_solve_observation": _plan_solve_observation,
        "_memory_retrieval_observation": _memory_retrieval_observation,
        "_handoff_observation": _handoff_observation,
        "_handoff_contract": _handoff_contract,
        "_travel_project_observation": _travel_project_observation,
        "_research_project_observation": _research_project_observation,
        "_mini_agent_observation": _mini_agent_observation,
        "_mini_agent_contract": _mini_agent_contract,
        "_mini_agent_errors": _mini_agent_errors,
        "_mini_agent_limit": _mini_agent_limit,
        "inspect": inspect,
    })
    for _spec in json.loads(__lesson_tests_json):
        _feedback = _spec.get("feedback")
        _expected = _feedback["expected"] if _feedback else ""
        _rule = _feedback["rule"] if _feedback else ""
        _actual = ""
        if _feedback and "actualLine" in _feedback:
            _actual_line = _feedback["actualLine"]
            if 0 <= _actual_line < len(_output_lines):
                _actual = _output_lines[_actual_line] or "（空行）"
        try:
            _passed = bool(eval(_spec["expression"], _test_namespace, _test_namespace))
            if not _passed and _feedback and "actualExpression" in _feedback:
                _actual = repr(eval(_feedback["actualExpression"], _test_namespace, _test_namespace))
            _detail = "" if _passed else _spec["failure"]
        except BaseException as _test_error:
            _passed = False
            _detail = f"测试求值时出现 {type(_test_error).__name__}: {_test_error}"
        _result["tests"].append({
            "name": _spec["name"],
            "passed": _passed,
            "detail": _detail,
            "expected": _expected,
            "actual": _actual,
            "rule": _rule,
            "kind": _spec.get("kind", "behavior"),
        })

json.dumps(_result, ensure_ascii=False)
`;

let runtime = null;

async function initialize() {
  runtime = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });
}

async function runLesson(message) {
  if (!runtime) {
    throw new Error("Pyodide 尚未完成加载。");
  }
  runtime.globals.set("__learner_code", message.code);
  runtime.globals.set("__lesson_tests_json", JSON.stringify(message.tests));
  const raw = await runtime.runPythonAsync(PYTHON_HARNESS);
  return JSON.parse(raw);
}

self.addEventListener("message", async (event) => {
  const message = event.data;
  if (message.type === "initialize") {
    try {
      await initialize();
      self.postMessage({ type: "ready", version: PYODIDE_VERSION });
    } catch (error) {
      self.postMessage({
        type: "initialization-error",
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (message.type === "run") {
    try {
      const result = await runLesson(message);
      self.postMessage({ type: "run-result", token: message.token, result });
    } catch (error) {
      self.postMessage({
        type: "run-error",
        token: message.token,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
});
