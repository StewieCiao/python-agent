from datetime import datetime, timedelta, timezone


def _parse_time(value):
    if not isinstance(value, str):
        raise ValueError("掌握度事件时间无效")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("掌握度事件时间无效") from error
    if parsed.tzinfo is None:
        raise ValueError("掌握度事件必须包含时区")
    return parsed.astimezone(timezone.utc)


def compute_mastery(events, now):
    current = _parse_time(now)
    if not isinstance(events, list):
        raise ValueError("掌握度事件无效")
    result = {}
    for event in events:
        if not isinstance(event, dict) or set(event) != {"lessonId", "familyId", "outcome", "mistakeCodes", "createdAt"}:
            raise ValueError("掌握度事件无效")
        if not isinstance(event["lessonId"], str) or not isinstance(event["familyId"], str):
            raise ValueError("掌握度事件无效")
        if event["outcome"] not in {"pass", "fail"} or not isinstance(event["mistakeCodes"], list):
            raise ValueError("掌握度事件无效")
        if not all(isinstance(code, str) and code for code in event["mistakeCodes"]):
            raise ValueError("掌握度事件错误模式无效")
        created_at = _parse_time(event["createdAt"])
        if created_at > current:
            raise ValueError("掌握度事件不能来自未来")
        item = result.setdefault(event["lessonId"], {
            "familyId": event["familyId"], "score": 0.5, "attempts": 0,
            "mistakeCodes": [], "lastAttemptAt": event["createdAt"],
        })
        if item["familyId"] != event["familyId"]:
            raise ValueError("同一课程不能更换 family")
        item["attempts"] += 1
        item["score"] = max(0.0, min(1.0, item["score"] + (0.25 if event["outcome"] == "pass" else -0.25)))
        item["lastAttemptAt"] = event["createdAt"]
        for code in event["mistakeCodes"]:
            if code not in item["mistakeCodes"]:
                item["mistakeCodes"].append(code)
    return result


def select_review_queue(mastery, now):
    current = _parse_time(now)
    if not isinstance(mastery, dict):
        raise ValueError("掌握度数据无效")
    queue = []
    for lesson_id, item in mastery.items():
        if not isinstance(lesson_id, str) or not isinstance(item, dict):
            raise ValueError("掌握度数据无效")
        last_attempt = _parse_time(item.get("lastAttemptAt"))
        if item.get("score", 0) < 0.5 or current - last_attempt >= timedelta(days=7):
            queue.append((item["score"], last_attempt, lesson_id))
    return [lesson_id for _, _, lesson_id in sorted(queue, key=lambda entry: (entry[0], entry[1], entry[2]))]
