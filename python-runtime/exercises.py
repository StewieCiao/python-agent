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
            "difficulty": family["difficulty"],
            "mistakeCodes": list(mistake_codes),
            "constraints": list(family["constraints"]),
        }
    raise ValueError("未找到课程对应的 family")


def validate_generated_exercise(family, candidate):
    if not isinstance(family, dict) or not isinstance(candidate, dict):
        raise ValueError("题目输入结构无效")
    required = {"familyId", "validatorVersion", "prompt", "starterCode", "hints"}
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
    return {"accepted": False, "reason": "需要真实 family 验证器"}
