def _family_records(bundle):
    families = bundle.get("families")
    if not isinstance(families, dict):
        raise ValueError("family 数据无效")
    return families.values()


def select_family(bundle, lesson_id, mistake_codes):
    if not isinstance(lesson_id, str) or not isinstance(mistake_codes, list):
        raise ValueError("family 选择输入无效")
    for family in _family_records(bundle):
        if not isinstance(family, dict) or family.get("lessonIds") != [lesson_id]:
            continue
        allowed = family.get("mistakeCodes")
        if not isinstance(allowed, list) or any(code not in allowed for code in mistake_codes):
            raise ValueError("错误模式不属于该 family")
        return {
            "lessonId": lesson_id,
            "familyId": family["id"],
            "validatorVersion": family["validatorVersion"],
            "difficulty": family["difficulty"],
            "mistakeCodes": list(mistake_codes),
            "constraints": list(family["constraints"]),
        }
    raise ValueError("未找到课程对应的 family")


def validate_generated_exercise(family, candidate):
    if not isinstance(family, dict) or not isinstance(candidate, dict):
        raise ValueError("题目输入结构无效")
    required = {"familyId", "validatorVersion", "prompt", "starterCode", "hints", "parameters"}
    if set(candidate) != required:
        raise ValueError("题目字段无效")
    if candidate["familyId"] != family.get("id") or candidate["validatorVersion"] != family.get("validatorVersion"):
        raise ValueError("题目 family 版本不匹配")
    if not isinstance(candidate["prompt"], str) or not candidate["prompt"].strip():
        raise ValueError("题目字段无效")
    if not isinstance(candidate["starterCode"], str) or not candidate["starterCode"].strip():
        raise ValueError("题目字段无效")
    if not isinstance(candidate["hints"], list) or not all(isinstance(hint, str) and hint.strip() for hint in candidate["hints"]):
        raise ValueError("题目字段无效")
    parameters = candidate["parameters"]
    if not isinstance(parameters, dict) or set(parameters) != {"seed", "label", "values"} or not isinstance(parameters["seed"], int) or not isinstance(parameters["label"], str) or not isinstance(parameters["values"], str):
        raise ValueError("题目参数无效")
    variants = _VARIANTS.get(family["id"])
    expected_values = {label: values for label, values in variants}
    if parameters["label"] not in expected_values or parameters["values"] != expected_values[parameters["label"]]:
        raise ValueError("题目参数不属于 family")
    return {"accepted": True, "exercise": candidate}


_VARIANTS = {
    "python-loops-v1": [
        ("输入 [14, 3, 8, 11]", "[14, 3, 8, 11]"),
        ("输入 [5, 12, 17, 20]", "[5, 12, 17, 20]"),
        ("输入 [-4, 7, 0, 9]", "[-4, 7, 0, 9]"),
    ],
    "python-lists-v1": [
        ("输入 [41, 60, 99]", "[41, 60, 99]"),
        ("输入 [58, 76, 101]", "[58, 76, 101]"),
        ("输入 [0, 64, 97]", "[0, 64, 97]"),
    ],
    "python-dictionaries-v1": [
        ("输入 ['go', 'py', 'go', 'rs']", "['go', 'py', 'go', 'rs']"),
        ("输入 ['js', 'ts', 'js', 'go', 'ts']", "['js', 'ts', 'js', 'go', 'ts']"),
        ("输入 ['rust', 'go', 'rust']", "['rust', 'go', 'rust']"),
    ],
    "python-output-v1": [("计算 9 * 6", "9 * 6"), ("计算 11 * 5", "11 * 5"), ("计算 12 * 4", "12 * 4")],
    "python-exceptions-v1": [("文本 '42'", "'42'"), ("文本 'oops'", "'oops'"), ("文本 '3.5'", "'3.5'")],
    "python-decorators-v1": [("调用 multiply(3, factor=4)", "3, factor=4"), ("调用 multiply(5, factor=2)", "5, factor=2"), ("调用 multiply(7, factor=3)", "7, factor=3")],
    "python-expense-v1": [("记录 food=12、travel=30", "food=12, travel=30"), ("记录 books=18、food=9", "books=18, food=9"), ("记录 travel=7、tools=25", "travel=7, tools=25")],
}


def generate_personalized_exercise(selection, seed, recent_prompts):
    if not isinstance(selection, dict) or not isinstance(seed, int) or not isinstance(recent_prompts, list):
        raise ValueError("个性题选择输入无效")
    family_id = selection.get("familyId")
    variants = _VARIANTS.get(family_id)
    if not variants:
        raise ValueError("family 没有已审校的题目变体")
    label, values = variants[seed % len(variants)]
    prompt = f"针对 {label} 完成题目要求，并保留 family 的教学约束。"
    if prompt in recent_prompts:
        raise ValueError("生成题目与最近练习重复")
    return {
        "familyId": family_id,
        "validatorVersion": selection.get("validatorVersion", "1"),
        "prompt": prompt,
        "starterCode": "# 在这里完成练习\n",
        "hints": ["先写最小可运行版本，再用题目给出的新输入验证。"],
        "parameters": {"seed": seed, "label": label, "values": values},
    }
