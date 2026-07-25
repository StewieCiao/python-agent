import { loadPyodide } from "/pyodide/pyodide.mjs";

const PYODIDE_VERSION = "314.0.3";
const PYODIDE_INDEX_URL = new URL("/pyodide/", self.location.origin).href;

const PYTHON_HARNESS = String.raw`
import contextlib
import copy
import inspect
import io
import json
import traceback

def _raises_value_error(func):
    try:
        func()
    except ValueError:
        return True
    return False

def _decorator_called_twice(decorator):
    counter = {"n": 0}
    def counted():
        counter["n"] += 1
        return counter["n"]
    wrapped = decorator(counted)
    wrapped()
    return counter["n"] == 2

def _plan_preserves_input(func):
    items = [{"name": "x", "priority": 2}, {"name": "y", "priority": 4}]
    before = copy.deepcopy(items)
    func(items)
    return items == before

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
    _test_namespace = _learner_namespace.copy()
    _test_namespace.update({
        "_stdout": _result["output"],
        "_source": __learner_code,
        "_raises_value_error": _raises_value_error,
        "_decorator_called_twice": _decorator_called_twice,
        "_plan_preserves_input": _plan_preserves_input,
        "inspect": inspect,
    })
    for _spec in json.loads(__lesson_tests_json):
        try:
            _passed = bool(eval(_spec["expression"], _test_namespace, _test_namespace))
            _detail = "" if _passed else _spec["failure"]
        except BaseException as _test_error:
            _passed = False
            _detail = f"测试求值时出现 {type(_test_error).__name__}: {_test_error}"
        _result["tests"].append({
            "name": _spec["name"],
            "passed": _passed,
            "detail": _detail,
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
