import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
CATALOG_PATH = RUNTIME_ROOT.parent / "generated" / "learning-service.json"
sys.path.insert(0, str(RUNTIME_ROOT))

from catalog import load_learning_bundle
from service import build_health_result, dispatch_request
from storage import Storage

BUNDLE = load_learning_bundle(CATALOG_PATH)


class ServiceTest(unittest.TestCase):
    def test_health_proves_runtime_packages_sqlite_transactions_and_fts5(self):
        health = build_health_result(load_learning_bundle(CATALOG_PATH))

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
        self.assertEqual(health["catalog"]["schemaVersion"], "stewie-catalog-v1")

    def test_service_returns_one_real_response_per_frame_and_survives_protocol_error(self):
        frames = "\n".join(
            [
                '{"id":"first","method":"health","params":{}}',
                "not-json",
                '{"id":"second","method":"health","params":{}}',
            ]
        ) + "\n"
        with tempfile.TemporaryDirectory() as directory:
            completed = subprocess.run(
                [
                    sys.executable,
                    str(RUNTIME_ROOT / "service.py"),
                    "--catalog",
                    str(CATALOG_PATH),
                    "--database",
                    str(Path(directory) / "stewie.db"),
                ],
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

    def test_protocol_error_keeps_valid_request_id_and_service_continues(self):
        frames = "\n".join(
            [
                '{"id":"bad-1","method":"learning.save","params":{"state":[]}}',
                '{"id":"good-1","method":"health","params":{}}',
            ]
        ) + "\n"
        with tempfile.TemporaryDirectory() as directory:
            completed = subprocess.run(
                [
                    sys.executable,
                    str(RUNTIME_ROOT / "service.py"),
                    "--catalog",
                    str(CATALOG_PATH),
                    "--database",
                    str(Path(directory) / "stewie.db"),
                ],
                input=frames,
                text=True,
                capture_output=True,
                check=True,
            )
        responses = [json.loads(line) for line in completed.stdout.splitlines()]
        self.assertEqual(
            responses[0],
            {
                "id": "bad-1",
                "ok": False,
                "error": {"type": "ProtocolError", "message": "state 必须是对象"},
            },
        )
        self.assertEqual((responses[1]["id"], responses[1]["ok"]), ("good-1", True))

    def test_service_persists_opaque_profile_ciphertext(self):
        profile = {
            "id": "primary",
            "name": "Primary",
            "baseUrl": "https://api.example.com/v1",
            "origin": "https://api.example.com",
            "model": "model-1",
            "embeddingModel": None,
            "temperature": 0.2,
            "maxTokens": 1024,
            "timeoutMs": 30000,
        }
        frames = "\n".join(
            [
                json.dumps({
                    "id": "save",
                    "method": "profile.upsert",
                    "params": {
                        "profile": profile,
                        "apiKeyCiphertext": "Y2lwaGVydGV4dA==",
                        "makeActive": True,
                    },
                }),
                '{"id":"list","method":"profile.list","params":{}}',
            ]
        ) + "\n"
        with tempfile.TemporaryDirectory() as directory:
            completed = subprocess.run(
                [
                    sys.executable,
                    str(RUNTIME_ROOT / "service.py"),
                    "--catalog",
                    str(CATALOG_PATH),
                    "--database",
                    str(Path(directory) / "stewie.db"),
                ],
                input=frames,
                text=True,
                capture_output=True,
                check=True,
            )
        responses = [json.loads(line) for line in completed.stdout.splitlines()]
        self.assertEqual(responses[0]["ok"], True)
        self.assertEqual(responses[1]["result"][0]["apiKeyCiphertext"], "Y2lwaGVydGV4dA==")

    def test_service_dispatches_learning_and_chat_methods_to_storage(self):
        state = {"completed": ["lesson-1"], "drafts": {"lesson-1": "print(1)"}, "mistakes": []}
        with tempfile.TemporaryDirectory() as directory:
            storage = Storage(Path(directory) / "stewie.db")
            try:
                self.assertEqual(
                    dispatch_request(
                        {"method": "learning.save", "params": {"state": state}}, storage, BUNDLE
                    ),
                    state,
                )
                self.assertEqual(
                    dispatch_request({"method": "learning.get", "params": {}}, storage, BUNDLE), state
                )
                message = {
                    "role": "user",
                    "content": "问题",
                    "createdAt": "2026-09-02T10:00:00+00:00",
                }
                self.assertEqual(
                    dispatch_request(
                        {
                            "method": "chat.append",
                            "params": {
                                "courseId": "python",
                                "lessonId": "lesson-1",
                                "messages": [message],
                            },
                        },
                        storage, BUNDLE,
                    ),
                    [message],
                )
                self.assertEqual(
                    dispatch_request(
                        {
                            "method": "chat.list",
                            "params": {"courseId": "python", "lessonId": "lesson-1"},
                        },
                        storage, BUNDLE,
                    ),
                    [message],
                )
                self.assertEqual(
                    dispatch_request(
                        {
                            "method": "chat.clear",
                            "params": {"courseId": "python", "lessonId": "lesson-1"},
                        },
                        storage, BUNDLE,
                    ),
                    {"cleared": True},
                )
            finally:
                storage.close()

    def test_service_persists_mastery_attempts_and_returns_review_queue(self):
        event = {
            "lessonId": "loops", "familyId": "python-loops-v1", "outcome": "fail",
            "mistakeCodes": ["missing-loop"], "createdAt": "2026-09-02T10:00:00+00:00",
        }
        with tempfile.TemporaryDirectory() as directory:
            storage = Storage(Path(directory) / "stewie.db")
            try:
                self.assertEqual(dispatch_request({"method": "mastery.record", "params": {"event": event}}, storage, BUNDLE), {"recorded": True})
                result = dispatch_request({"method": "mastery.get", "params": {"now": "2026-09-02T11:00:00+00:00"}}, storage, BUNDLE)
                self.assertEqual(result["reviewQueue"], ["loops"])
                self.assertEqual(result["mastery"]["loops"]["mistakeCodes"], ["missing-loop"])
            finally:
                storage.close()

    def test_personalization_uses_local_mistake_modes_and_verified_family(self):
        event = {
            "lessonId": "loops", "familyId": "python-loops-v1", "outcome": "fail",
            "mistakeCodes": ["missing-loop"], "createdAt": "2026-09-02T10:00:00+00:00",
        }
        with tempfile.TemporaryDirectory() as directory:
            storage = Storage(Path(directory) / "stewie.db")
            try:
                storage.record_mastery_attempt(event)
                result = dispatch_request({"method": "personalization.next", "params": {"lessonId": "loops", "seed": 2}}, storage, BUNDLE)
                self.assertEqual(result["recommendation"]["mistakeCodes"], ["missing-loop"])
                self.assertEqual(result["exercise"]["familyId"], "python-loops-v1")
                with self.assertRaisesRegex(ValueError, "未找到"):
                    dispatch_request({"method": "personalization.next", "params": {"lessonId": "variables", "seed": 1}}, storage, BUNDLE)
            finally:
                storage.close()


if __name__ == "__main__":
    unittest.main()
