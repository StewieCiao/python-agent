def _family_records(bundle):
    families = bundle.get("families")
    if not isinstance(families, dict):
        raise ValueError("family 数据无效")
    return families.values()


def _valid_checks(value):
    return isinstance(value, list) and len(value) >= 2 and all(
        isinstance(item, dict)
        and set(item) == {"name", "expression", "failure", "kind"}
        and all(isinstance(item[field], str) and item[field].strip() for field in ("name", "expression", "failure"))
        and item["kind"] in {"behavior", "structure"}
        for item in value
    )


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
            "variants": list(family["variants"]),
        }
    raise ValueError("未找到课程对应的 family")


def validate_generated_exercise(family, candidate):
    if not isinstance(family, dict) or not isinstance(candidate, dict):
        raise ValueError("题目输入结构无效")
    required = {"familyId", "validatorVersion", "prompt", "starterCode", "hints", "parameters", "tests"}
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
    variants = family.get("variants")
    if not isinstance(variants, list):
        raise ValueError("family 变体无效")
    selected = next((item for item in variants if isinstance(item, dict) and item.get("label") == parameters["label"] and item.get("values") == parameters["values"]), None)
    if selected is None or not _valid_checks(selected.get("checks")):
        raise ValueError("题目参数不属于 family")
    tests = candidate["tests"]
    if not _valid_checks(tests) or tests != selected["checks"]:
        raise ValueError("题目测试不属于 family")
    return {"accepted": True, "exercise": candidate}


def generate_personalized_exercise(selection, seed, recent_prompts):
    if not isinstance(selection, dict) or not isinstance(seed, int) or not isinstance(recent_prompts, list):
        raise ValueError("个性题选择输入无效")
    family_id = selection.get("familyId")
    variants = selection.get("variants")
    if not isinstance(variants, list) or not variants:
        raise ValueError("family 没有已审校的题目变体")
    identities = set()
    for variant in variants:
        if not isinstance(variant, dict):
            raise ValueError("family 变体结构无效")
        identity = (variant.get("label"), variant.get("values"))
        if identity in identities:
            raise ValueError("family 变体身份重复")
        identities.add(identity)
    constraints = selection.get("constraints", [])
    if not isinstance(constraints, list) or not all(isinstance(item, str) and item.strip() for item in constraints):
        raise ValueError("family 约束无效")
    mistake_codes = selection.get("mistakeCodes", [])
    if not isinstance(mistake_codes, list) or not all(isinstance(code, str) and code.strip() for code in mistake_codes):
        raise ValueError("错误模式无效")
    starter_code = selection.get("starterCode")
    if not isinstance(starter_code, str) or not starter_code.strip():
        raise ValueError("个性题缺少课程 starter")
    selected = None
    prompt = ""
    for offset in range(len(variants)):
        candidate = variants[(seed + offset) % len(variants)]
        if not isinstance(candidate, dict) or not isinstance(candidate.get("label"), str) or not isinstance(candidate.get("values"), str) or not _valid_checks(candidate.get("checks")):
            raise ValueError("family 变体结构无效")
        focus = f"重点复习错误模式：{'、'.join(mistake_codes)}。" if mistake_codes else "本次没有记录错误模式。"
        candidate_prompt = f"针对 {candidate['label']} 完成题目要求。{focus}教学约束：{'；'.join(constraints)}。"
        if candidate_prompt not in recent_prompts:
            selected = candidate
            prompt = candidate_prompt
            break
    if selected is None:
        raise ValueError("生成题目与最近练习重复")
    label = selected["label"]
    values = selected["values"]
    return {
        "familyId": family_id,
        "validatorVersion": selection.get("validatorVersion", "1"),
        "prompt": prompt,
        "starterCode": starter_code,
        "hints": [
            "先定位本题 family 正在练习的核心能力。",
            "把输入、处理中间值和返回结果分别写出来，再实现最小版本。",
            "用题目给出的新输入和一个边界输入复测，确认没有写死示例。",
        ],
        "parameters": {"seed": seed, "label": label, "values": values},
        "tests": selected["checks"],
    }
