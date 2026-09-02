import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from protocol import ProtocolError, decode_request, encode_message, error_response, success_response


class ProtocolTest(unittest.TestCase):
    def test_health_request_and_responses_round_trip_as_json(self):
        request = decode_request('{"id":"health-1","method":"health","params":{}}')

        self.assertEqual(
            request,
            {"id": "health-1", "method": "health", "params": {}},
        )
        self.assertEqual(
            json.loads(encode_message(success_response("health-1", {"ready": True}))),
            {"id": "health-1", "ok": True, "result": {"ready": True}},
        )
        self.assertEqual(
            json.loads(encode_message(error_response("health-1", ValueError("真实原因")))),
            {
                "id": "health-1",
                "ok": False,
                "error": {"type": "ValueError", "message": "真实原因"},
            },
        )

    def test_invalid_frames_are_rejected_without_guessing_another_format(self):
        invalid_frames = [
            "not-json",
            "[]",
            '{"id":"x","method":"health"}',
            '{"id":"x","method":"health","params":{},"extra":true}',
            '{"id":"","method":"health","params":{}}',
            '{"id":"x","method":"unknown","params":{}}',
            '{"id":"x","method":"health","params":{"fallback":true}}',
        ]

        for frame in invalid_frames:
            with self.subTest(frame=frame):
                with self.assertRaises(ProtocolError):
                    decode_request(frame)

    def test_profile_methods_accept_only_their_exact_parameter_contract(self):
        request = decode_request(
            '{"id":"p1","method":"profile.get","params":{"profileId":"primary"}}'
        )
        self.assertEqual(request["params"], {"profileId": "primary"})

        invalid_frames = [
            '{"id":"p1","method":"profile.get","params":{}}',
            '{"id":"p1","method":"profile.get","params":{"profileId":"primary","extra":true}}',
            '{"id":"p1","method":"profile.activate","params":{"profileId":1}}',
            '{"id":"p1","method":"profile.upsert","params":{"profile":{},"apiKeyCiphertext":null}}',
        ]
        for frame in invalid_frames:
            with self.subTest(frame=frame):
                with self.assertRaises(ProtocolError):
                    decode_request(frame)

    def test_learning_and_chat_methods_accept_only_exact_parameter_contracts(self):
        valid_requests = [
            {"id": "m1", "method": "mastery.get", "params": {"now": "2026-09-02T00:00:00+00:00"}},
            {"id": "m2", "method": "mastery.record", "params": {"event": {}}},
            {"id": "p1", "method": "personalization.next", "params": {"lessonId": "loops", "seed": 1}},
            {"id": "l1", "method": "learning.get", "params": {}},
            {"id": "l2", "method": "learning.save", "params": {"state": {}}},
            {
                "id": "l3",
                "method": "learning.importLegacy",
                "params": {"state": {}, "sourceHash": "sha256"},
            },
            {"id": "c1", "method": "chat.list", "params": {"courseId": "python", "lessonId": "one"}},
            {
                "id": "c2",
                "method": "chat.append",
                "params": {"courseId": "python", "lessonId": "one", "messages": []},
            },
            {"id": "c3", "method": "chat.clear", "params": {"courseId": "python", "lessonId": "one"}},
        ]
        for request in valid_requests:
            with self.subTest(method=request["method"]):
                self.assertEqual(decode_request(json.dumps(request)), request)

        invalid_requests = [
            {"id": "x", "method": "mastery.get", "params": {"now": ""}},
            {"id": "x", "method": "mastery.record", "params": {"event": []}},
            {"id": "x", "method": "personalization.next", "params": {"lessonId": "loops", "seed": True}},
            {"id": "x", "method": "learning.get", "params": {"state": {}}},
            {"id": "x", "method": "learning.save", "params": {"state": []}},
            {"id": "x", "method": "learning.importLegacy", "params": {"state": {}, "sourceHash": ""}},
            {"id": "x", "method": "chat.list", "params": {"courseId": "", "lessonId": "one"}},
            {"id": "x", "method": "chat.append", "params": {"courseId": "python", "lessonId": "one", "messages": {}}},
            {"id": "x", "method": "chat.clear", "params": {"courseId": "python", "lessonId": "one", "extra": True}},
        ]
        for request in invalid_requests:
            with self.subTest(method=request["method"]):
                with self.assertRaises(ProtocolError):
                    decode_request(json.dumps(request))


if __name__ == "__main__":
    unittest.main()
