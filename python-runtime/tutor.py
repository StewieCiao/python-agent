from mastery import select_review_queue


def build_tutor_plan(learning_bundle, mastery, now):
    if not isinstance(learning_bundle, dict) or not isinstance(mastery, dict):
        raise ValueError("导师计划输入无效")
    queue = select_review_queue(mastery, now)
    lessons = {
        lesson["id"]: lesson
        for track in learning_bundle["catalog"]["tracks"]
        for lesson in track["lessons"]
    }
    selected = queue[:3]
    if not selected:
        selected = [
            lesson["id"]
            for track in learning_bundle["catalog"]["tracks"]
            for lesson in track["lessons"]
            if lesson["id"] not in mastery
        ][:1]
    steps = []
    for lesson_id in selected:
        lesson = lessons.get(lesson_id)
        if lesson is None:
            raise ValueError("掌握度包含未知课程")
        item = mastery.get(lesson_id)
        reason = "最近一次练习需要复习" if item else "按推荐顺序开始学习"
        if item and item.get("mistakeCodes"):
            reason = f"需要复习：{'、'.join(item['mistakeCodes'])}"
        steps.append({
            "lessonId": lesson_id,
            "title": lesson["title"],
            "reason": reason,
            "actions": ["阅读概念入门讲解", "运行练习并查看真实反馈", "用变化输入复测"],
        })
    return {"status": "review" if queue else "start", "steps": steps}
