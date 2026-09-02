import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path

RUNTIME_ROOT = Path(__file__).resolve().parents[1]
PROJECT_ROOT = RUNTIME_ROOT.parent
sys.path.insert(0, str(RUNTIME_ROOT))

from catalog import load_learning_bundle


def canonical_json(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


class CatalogTest(unittest.TestCase):
    def test_loads_verified_service_snapshot(self):
        path = PROJECT_ROOT / "generated" / "learning-service.json"
        bundle = load_learning_bundle(path)
        self.assertEqual(bundle["schemaVersion"], "stewie-catalog-v1")
        self.assertEqual(
            bundle["catalogHash"],
            hashlib.sha256(canonical_json(bundle["catalog"]).encode("utf-8")).hexdigest(),
        )
        self.assertEqual(
            bundle["familyHash"],
            hashlib.sha256(canonical_json({"checks": bundle["checks"], "families": bundle["families"]}).encode("utf-8")).hexdigest(),
        )

    def test_rejects_changed_catalog_without_new_hash(self):
        source = json.loads((PROJECT_ROOT / "generated" / "learning-service.json").read_text(encoding="utf-8"))
        source["catalog"]["tracks"][0]["title"] = "changed"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "learning-service.json"
            path.write_text(json.dumps(source, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "catalogHash"):
                load_learning_bundle(path)

    def test_rejects_changed_checks_without_new_family_hash(self):
        source = json.loads((PROJECT_ROOT / "generated" / "learning-service.json").read_text(encoding="utf-8"))
        source["checks"]["first-output"][0]["failure"] = "changed"
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "learning-service.json"
            path.write_text(json.dumps(source, ensure_ascii=False), encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "familyHash"):
                load_learning_bundle(path)

    def test_rejects_invalid_json_without_trying_another_file(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "learning-service.json"
            path.write_text("not-json", encoding="utf-8")
            with self.assertRaises(json.JSONDecodeError):
                load_learning_bundle(path)


if __name__ == "__main__":
    unittest.main()
