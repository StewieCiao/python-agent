import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from exercises import generate_personalized_exercise, select_family, validate_generated_exercise


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
        self.assertEqual(selected["validatorVersion"], "1")

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
        with self.assertRaisesRegex(ValueError, "题目字段"):
            validate_generated_exercise(family, candidate)

        invalid = dict(candidate)
        invalid["prompt"] = ""
        with self.assertRaisesRegex(ValueError, "题目字段"):
            validate_generated_exercise(family, invalid)

    def test_generated_variant_passes_known_parameter_validator(self):
        selection = {"familyId": "python-loops-v1", "validatorVersion": "1", "difficulty": "beginner", "constraints": ["sum even values"]}
        candidate = generate_personalized_exercise(selection, 1, [])
        checked = validate_generated_exercise(
            {"id": "python-loops-v1", "validatorVersion": "1", "constraints": ["sum even values"]},
            candidate,
        )
        self.assertEqual(checked, {"accepted": True, "exercise": candidate})

    def test_personalized_variant_is_deterministic_and_not_recent_duplicate(self):
        bundle = {"families": {
            "python-loops-v1": {
                "id": "python-loops-v1", "lessonIds": ["loops"], "difficulty": "beginner",
                "validatorVersion": "1", "mistakeCodes": ["missing-loop"], "constraints": ["sum even values"],
            }
        }}
        selection = select_family(bundle, "loops", ["missing-loop"])
        first = generate_personalized_exercise(selection, 4, [])
        second = generate_personalized_exercise(selection, 4, [])
        self.assertEqual(first, second)
        self.assertEqual(first["familyId"], "python-loops-v1")
        self.assertIn("输入", first["prompt"])
        self.assertEqual(len(first["hints"]), 3)
        with self.assertRaisesRegex(ValueError, "重复"):
            generate_personalized_exercise(selection, 4, [first["prompt"]])

    def test_each_verified_family_has_six_transfer_variants(self):
        family_ids = [
            "python-output-v1", "python-loops-v1", "python-lists-v1",
            "python-dictionaries-v1", "python-exceptions-v1", "python-decorators-v1",
            "python-expense-v1",
        ]
        for family_id in family_ids:
            prompts = {
                generate_personalized_exercise(
                    {"familyId": family_id, "validatorVersion": "1", "difficulty": "beginner", "constraints": ["verified family behavior"]},
                    seed,
                    [],
                )["prompt"]
                for seed in range(6)
            }
            self.assertEqual(len(prompts), 6, family_id)


if __name__ == "__main__":
    unittest.main()
