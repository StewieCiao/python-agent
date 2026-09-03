import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tutor import build_tutor_plan


NOW = "2026-09-03T00:00:00+00:00"
BUNDLE = {
    "catalog": {
        "tracks": [
            {"lessons": [{"id": "python-01", "title": "变量"}, {"id": "python-02", "title": "分支"}]},
        ]
    }
}


class TutorPlanTest(unittest.TestCase):
    def test_empty_mastery_starts_with_first_catalog_lesson(self):
        plan = build_tutor_plan(BUNDLE, {}, NOW)

        self.assertEqual(plan["status"], "start")
        self.assertEqual([step["lessonId"] for step in plan["steps"]], ["python-01"])
        self.assertEqual(len(plan["steps"][0]["actions"]), 3)

    def test_low_score_mastery_is_prioritized_and_explains_mistakes(self):
        mastery = {
            "python-02": {
                "score": 0.25,
                "lastAttemptAt": NOW,
                "mistakeCodes": ["NAME_ERROR"],
            }
        }

        plan = build_tutor_plan(BUNDLE, mastery, NOW)

        self.assertEqual(plan["status"], "review")
        self.assertEqual(plan["steps"][0]["lessonId"], "python-02")
        self.assertIn("NAME_ERROR", plan["steps"][0]["reason"])

    def test_unknown_mastery_lesson_is_a_clear_input_error(self):
        with self.assertRaisesRegex(ValueError, "未知课程"):
            build_tutor_plan(
                BUNDLE,
                {"missing": {"score": 0.1, "lastAttemptAt": NOW, "mistakeCodes": []}},
                NOW,
            )


if __name__ == "__main__":
    unittest.main()
