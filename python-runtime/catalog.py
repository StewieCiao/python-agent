import hashlib
import json
import re
from pathlib import Path


SCHEMA_VERSION = "stewie-catalog-v1"
HASH_PATTERN = re.compile(r"^[0-9a-f]{64}$")
SNAPSHOT_KEYS = {"schemaVersion", "catalogHash", "familyHash", "catalog", "checks"}


def _sha256_json(value):
    encoded = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def load_learning_bundle(path):
    with Path(path).open("r", encoding="utf-8") as stream:
        bundle = json.load(stream)
    if not isinstance(bundle, dict) or set(bundle) != SNAPSHOT_KEYS:
        raise ValueError("learning-service.json 顶层结构无效")
    if bundle["schemaVersion"] != SCHEMA_VERSION:
        raise ValueError("learning-service.json schema version 无效")
    if not isinstance(bundle["catalog"], dict) or not isinstance(bundle["checks"], dict):
        raise ValueError("learning-service.json catalog/checks 无效")
    if not HASH_PATTERN.fullmatch(bundle["catalogHash"]):
        raise ValueError("learning-service.json catalogHash 格式无效")
    if not HASH_PATTERN.fullmatch(bundle["familyHash"]):
        raise ValueError("learning-service.json familyHash 格式无效")
    if _sha256_json(bundle["catalog"]) != bundle["catalogHash"]:
        raise ValueError("learning-service.json catalogHash 校验失败")
    if _sha256_json(bundle["checks"]) != bundle["familyHash"]:
        raise ValueError("learning-service.json familyHash 校验失败")
    lesson_ids = {
        lesson["id"]
        for track in bundle["catalog"].get("tracks", [])
        for lesson in track.get("lessons", [])
        if isinstance(lesson, dict) and isinstance(lesson.get("id"), str)
    }
    if set(bundle["checks"]) != lesson_ids:
        raise ValueError("learning-service.json checks 与课程 id 不一致")
    return bundle

