import base64
import binascii
import sqlite3
from pathlib import Path


PROFILE_FIELDS = {
    "id",
    "name",
    "baseUrl",
    "origin",
    "model",
    "embeddingModel",
    "temperature",
    "maxTokens",
    "timeoutMs",
}


def _validated_profile(profile):
    if not isinstance(profile, dict) or set(profile) != PROFILE_FIELDS:
        raise ValueError("模型配置字段无效")
    for field in ("id", "name", "baseUrl", "origin", "model"):
        if not isinstance(profile[field], str) or not profile[field]:
            raise ValueError(f"{field} 无效")
    if profile["embeddingModel"] is not None and not isinstance(profile["embeddingModel"], str):
        raise ValueError("embeddingModel 无效")
    if not isinstance(profile["temperature"], (int, float)):
        raise ValueError("temperature 无效")
    for field in ("maxTokens", "timeoutMs"):
        if not isinstance(profile[field], int) or isinstance(profile[field], bool):
            raise ValueError(f"{field} 无效")
    return profile


def _decode_ciphertext(value):
    if value is None:
        return None
    if not isinstance(value, str) or not value:
        raise ValueError("API Key 密文无效")
    try:
        return base64.b64decode(value, validate=True)
    except (binascii.Error, ValueError) as error:
        raise ValueError("API Key 密文不是有效 Base64") from error


def _encode_ciphertext(value):
    return base64.b64encode(value).decode("ascii") if value is not None else None


class Storage:
    def __init__(self, database_path, migrations_path=None):
        self.database_path = Path(database_path)
        self.database_path.parent.mkdir(parents=True, exist_ok=True)
        self.connection = sqlite3.connect(self.database_path)
        self.connection.row_factory = sqlite3.Row
        self.connection.execute("PRAGMA foreign_keys = ON")
        self.migrations_path = Path(migrations_path or Path(__file__).with_name("migrations"))
        self._apply_migrations()

    def _apply_migrations(self):
        has_table = self.connection.execute(
            "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'"
        ).fetchone()
        applied = set()
        if has_table:
            applied = {
                row[0]
                for row in self.connection.execute("SELECT version FROM schema_migrations")
            }
        migration_files = sorted(self.migrations_path.glob("[0-9][0-9][0-9]-*.sql"))
        available = {int(path.name.split("-", 1)[0]) for path in migration_files}
        if applied - available:
            raise RuntimeError("数据库包含当前应用不认识的 migration")
        for path in migration_files:
            version = int(path.name.split("-", 1)[0])
            if version in applied:
                continue
            try:
                self.connection.executescript(path.read_text(encoding="utf-8"))
            except Exception:
                self.connection.rollback()
                raise

    def close(self):
        self.connection.close()

    def _row_to_profile(self, row):
        return {
            "id": row["id"],
            "name": row["name"],
            "baseUrl": row["base_url"],
            "origin": row["provider_origin"],
            "model": row["model"],
            "embeddingModel": row["embedding_model"],
            "temperature": row["temperature"],
            "maxTokens": row["max_tokens"],
            "timeoutMs": row["timeout_ms"],
            "apiKeyCiphertext": _encode_ciphertext(row["api_key_ciphertext"]),
            "active": bool(row["active"]),
        }

    def list_profiles(self):
        rows = self.connection.execute(
            "SELECT * FROM model_profiles ORDER BY id"
        ).fetchall()
        return [self._row_to_profile(row) for row in rows]

    def get_profile(self, profile_id):
        row = self.connection.execute(
            "SELECT * FROM model_profiles WHERE id = ?", (profile_id,)
        ).fetchone()
        if row is None:
            raise ValueError("模型配置不存在")
        return self._row_to_profile(row)

    def upsert_profile(self, profile, api_key_ciphertext, make_active):
        profile = _validated_profile(profile)
        provided_ciphertext = _decode_ciphertext(api_key_ciphertext)
        with self.connection:
            existing = self.connection.execute(
                "SELECT provider_origin, api_key_ciphertext, active FROM model_profiles WHERE id = ?",
                (profile["id"],),
            ).fetchone()
            if api_key_ciphertext is not None:
                ciphertext = provided_ciphertext
            elif existing is not None and existing["provider_origin"] == profile["origin"]:
                ciphertext = existing["api_key_ciphertext"]
            else:
                ciphertext = None

            profile_count = self.connection.execute(
                "SELECT COUNT(*) FROM model_profiles"
            ).fetchone()[0]
            active = bool(make_active or profile_count == 0 or (existing and existing["active"]))
            if active:
                self.connection.execute("UPDATE model_profiles SET active = 0 WHERE active = 1")

            self.connection.execute(
                """
                INSERT INTO model_profiles (
                    id, name, base_url, provider_origin, model, embedding_model,
                    temperature, max_tokens, timeout_ms, api_key_ciphertext, active, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    base_url = excluded.base_url,
                    provider_origin = excluded.provider_origin,
                    model = excluded.model,
                    embedding_model = excluded.embedding_model,
                    temperature = excluded.temperature,
                    max_tokens = excluded.max_tokens,
                    timeout_ms = excluded.timeout_ms,
                    api_key_ciphertext = excluded.api_key_ciphertext,
                    active = excluded.active,
                    updated_at = CURRENT_TIMESTAMP
                """,
                (
                    profile["id"],
                    profile["name"],
                    profile["baseUrl"],
                    profile["origin"],
                    profile["model"],
                    profile["embeddingModel"],
                    profile["temperature"],
                    profile["maxTokens"],
                    profile["timeoutMs"],
                    ciphertext,
                    int(active),
                ),
            )
        return self.get_profile(profile["id"])

    def set_active_profile(self, profile_id):
        self.get_profile(profile_id)
        with self.connection:
            self.connection.execute("UPDATE model_profiles SET active = 0 WHERE active = 1")
            self.connection.execute(
                "UPDATE model_profiles SET active = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (profile_id,),
            )
        return self.get_profile(profile_id)

    def delete_profile(self, profile_id):
        profile = self.get_profile(profile_id)
        with self.connection:
            self.connection.execute("DELETE FROM model_profiles WHERE id = ?", (profile_id,))
            if profile["active"]:
                next_profile = self.connection.execute(
                    "SELECT id FROM model_profiles ORDER BY id LIMIT 1"
                ).fetchone()
                if next_profile is not None:
                    self.connection.execute(
                        "UPDATE model_profiles SET active = 1 WHERE id = ?",
                        (next_profile["id"],),
                    )
        return {"deleted": True}
