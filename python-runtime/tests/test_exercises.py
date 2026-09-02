import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from exercises import select_family, validate_generated_exercise


class ExerciseTest(unittest.TestCase):
    def test_select_family_uses_known_lesson_and_mistakes(self):
        bundle = {
            "families": {
                "python-loops-v1": {
                    "id": "python-loops-v1",
                    "lessonIds": ["loops"],
                    "difficulty": "beginner",
                    "validatorVersion": "1",
                    "mistakeCodes": ["missing-loop", "wrong-boundary"],
                    "constraints": ["sum even values"],
                }
            }
        }
        selected = select_family(bundle, "loops", ["wrong-boundary"])
        self.assertEqual(selected["familyId"], "python-loops-v1")
        self.assertEqual(selected["mistakeCodes"], ["wrong-boundary"])
        self.assertEqual(selected["difficulty"], "beginner")

    def test_select_family_rejects_unknown_or_invalid_mistake(self):
        bundle = {"families": {}}
        with self.assertRaisesRegex(ValueError, "family"):
            select_family(bundle, "loops", [])
        bundle["families"]["f"] = {
            "id": "f", "lessonIds": ["loops"], "difficulty": "beginner",
            "validatorVersion": "1", "mistakeCodes": ["wrong-boundary"], "constraints": ["one loop"],
        }
        with self.assertRaisesRegex(ValueError, "错误模式"):
            select_family(bundle, "loops", ["unknown"])

    def test_candidate_validation_is_strict_and_does_not_claim_execution(self):
        family = {
            "id": "python-loops-v1",
            "validatorVersion": "1",
            "constraints": ["sum even values"],
        }
        candidate = {
            "familyId": "python-loops-v1",
            "validatorVersion": "1",
            "prompt": "对新的输入求偶数和",
            "starterCode": "def sum_even(numbers):\n    pass",
            "hints": ["先初始化 total"],
        }
        accepted = validate_generated_exercise(family, candidate)
        self.assertFalse(accepted["accepted"])
        self.assertEqual(accepted["reason"], "需要真实 family 验证器")
        self.assertNotIn("solution", accepted)

        invalid = dict(candidate)
        invalid["prompt"] = ""
        with self.assertRaisesRegex(ValueError, "题目字段"):
            validate_generated_exercise(family, invalid)


if __name__ == "__main__":
    unittest.main()
