import sqlite3
import sys
import tempfile
import unittest
from pathlib import Path

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RUNTIME_ROOT))

from storage import Storage


def profile(profile_id="primary", origin="https://api.example.com"):
    return {
        "id": profile_id,
        "name": f"Profile {profile_id}",
        "baseUrl": f"{origin}/v1",
        "origin": origin,
        "model": "model-1",
        "embeddingModel": "embedding-1",
        "temperature": 0.2,
        "maxTokens": 2048,
        "timeoutMs": 30000,
    }


class StorageTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.database_path = Path(self.directory.name) / "stewie.db"
        self.storage = Storage(self.database_path)

    def tearDown(self):
        self.storage.close()
        self.directory.cleanup()

    def test_profiles_use_one_migration_and_never_store_plaintext_key(self):
        self.storage.upsert_profile(profile(), "Y2lwaGVydGV4dA==", make_active=True)

        saved = self.storage.list_profiles()
        self.assertEqual(len(saved), 1)
        self.assertEqual(saved[0]["active"], True)
        self.assertEqual(saved[0]["apiKeyCiphertext"], "Y2lwaGVydGV4dA==")
        self.assertNotIn("apiKey", saved[0])
        self.assertNotIn(b"sk-plain", self.database_path.read_bytes())

        with sqlite3.connect(self.database_path) as connection:
            self.assertEqual(
                connection.execute("SELECT version FROM schema_migrations").fetchall(),
                [(1,)],
            )

    def test_origin_change_clears_old_ciphertext_and_active_profile_is_unique(self):
        self.storage.upsert_profile(profile(), "Y2lwaGVydGV4dA==", make_active=True)
        self.storage.upsert_profile(profile("secondary"), "c2Vjb25k", make_active=True)
        self.assertEqual(
            [(item["id"], item["active"]) for item in self.storage.list_profiles()],
            [("primary", False), ("secondary", True)],
        )

        changed = profile(origin="https://other.example.com")
        self.storage.upsert_profile(changed, None, make_active=False)
        self.assertEqual(self.storage.get_profile("primary")["apiKeyCiphertext"], None)

    def test_unknown_profile_operations_fail_explicitly(self):
        with self.assertRaisesRegex(ValueError, "模型配置不存在"):
            self.storage.set_active_profile("missing")
        with self.assertRaisesRegex(ValueError, "模型配置不存在"):
            self.storage.delete_profile("missing")


if __name__ == "__main__":
    unittest.main()
