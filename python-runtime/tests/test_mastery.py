import sys
import unittest
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from mastery import compute_mastery, select_review_queue


def stamp(days=0):
    return (datetime(2026, 9, 2, tzinfo=timezone.utc) + timedelta(days=days)).isoformat()


class MasteryTest(unittest.TestCase):
    def test_new_failed_and_recovered_lesson_has_explainable_score(self):
        events = [
            {"lessonId": "loops", "familyId": "python-loops-v1", "outcome": "fail", "mistakeCodes": ["missing-loop"], "createdAt": stamp()},
            {"lessonId": "loops", "familyId": "python-loops-v1", "outcome": "pass", "mistakeCodes": [], "createdAt": stamp(1)},
        ]
        mastery = compute_mastery(events, stamp(1))
        self.assertEqual(mastery["loops"]["attempts"], 2)
        self.assertEqual(mastery["loops"]["mistakeCodes"], ["missing-loop"])
        self.assertEqual(mastery["loops"]["score"], 0.5)

    def test_review_queue_includes_new_failed_and_seven_day_overdue(self):
        events = [
            {"lessonId": "new", "familyId": "f1", "outcome": "fail", "mistakeCodes": ["wrong"], "createdAt": stamp()},
            {"lessonId": "old", "familyId": "f2", "outcome": "pass", "mistakeCodes": [], "createdAt": stamp(-8)},
            {"lessonId": "fresh", "familyId": "f3", "outcome": "pass", "mistakeCodes": [], "createdAt": stamp()},
        ]
        mastery = compute_mastery(events, stamp())
        self.assertEqual(select_review_queue(mastery, stamp()), ["new", "old"])

    def test_invalid_event_is_rejected_without_default_mastery(self):
        with self.assertRaisesRegex(ValueError, "事件"):
            compute_mastery([{"lessonId": "loops", "outcome": "unknown"}], stamp())


if __name__ == "__main__":
    unittest.main()
