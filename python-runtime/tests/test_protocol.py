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


if __name__ == "__main__":
    unittest.main()
