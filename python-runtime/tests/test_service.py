import json
import subprocess
import sys
import unittest
from pathlib import Path

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNTIME_ROOT))

from service import build_health_result


class ServiceTest(unittest.TestCase):
    def test_health_proves_runtime_packages_sqlite_transactions_and_fts5(self):
        health = build_health_result()

        self.assertEqual(health["pythonVersion"], "3.13.15")
        self.assertEqual(
            health["packages"],
            {
                "langchain": "1.2.12",
                "langgraph": "1.1.2",
                "langgraph-checkpoint-sqlite": "2.0.6",
                "pypdf": "6.16.2",
            },
        )
        self.assertEqual(health["sqlite"]["transaction"], True)
        self.assertEqual(health["sqlite"]["fts5"], True)

    def test_service_returns_one_real_response_per_frame_and_survives_protocol_error(self):
        frames = "\n".join(
            [
                '{"id":"first","method":"health","params":{}}',
                "not-json",
                '{"id":"second","method":"health","params":{}}',
            ]
        ) + "\n"
        completed = subprocess.run(
            [sys.executable, str(RUNTIME_ROOT / "service.py")],
            input=frames,
            text=True,
            capture_output=True,
            check=True,
        )
        responses = [json.loads(line) for line in completed.stdout.splitlines()]

        self.assertEqual(completed.stderr, "")
        self.assertEqual(len(responses), 3)
        self.assertEqual((responses[0]["id"], responses[0]["ok"]), ("first", True))
        self.assertEqual(
            responses[1],
            {
                "id": None,
                "ok": False,
                "error": {"type": "ProtocolError", "message": "请求不是有效 JSON"},
            },
        )
        self.assertEqual((responses[2]["id"], responses[2]["ok"]), ("second", True))


if __name__ == "__main__":
    unittest.main()
