"""Deterministic demo for the adaptive exercise feedback contract."""


def classify_attempt(result):
    if not isinstance(result, dict):
        raise ValueError("result must be a mapping")
    exception = result.get("exception")
    tests = result.get("tests")
    if exception:
        return {"outcome": "fail", "mistake_codes": [exception["type"]], "next_step": "先阅读 traceback 的具体行"}
    if not isinstance(tests, list):
        raise ValueError("tests must be a list")
    failed = [test["name"] for test in tests if not test["passed"]]
    if failed:
        return {"outcome": "fail", "mistake_codes": failed, "next_step": "换一组输入复测失败行为"}
    return {"outcome": "pass", "mistake_codes": [], "next_step": "进入下一项能力练习"}


if __name__ == "__main__":
    print(classify_attempt({"exception": None, "tests": [{"name": "边界", "passed": True}]}))
