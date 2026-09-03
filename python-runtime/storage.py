import base64
import binascii
import json
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from exercises import generate_personalized_exercise, select_family, validate_generated_exercise
from mastery import compute_mastery, select_review_queue
from tutor import build_tutor_plan


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


def _validate_timestamp(value):
    if not isinstance(value, str) or not value:
        raise ValueError("时间戳必须是非空字符串")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError("时间戳不是有效 ISO 格式") from error


def _validate_mistake(value):
    fields = {"id", "lessonId", "createdAt", "code", "output", "stderr", "exception", "tests"}
    if not isinstance(value, dict) or set(value) != fields:
        raise ValueError("错题字段无效")
    for field in ("id", "lessonId", "createdAt"):
        if not isinstance(value[field], str) or not value[field]:
            raise ValueError(f"错题 {field} 无效")
    for field in ("code", "output", "stderr"):
        if not isinstance(value[field], str):
            raise ValueError(f"错题 {field} 无效")
    _validate_timestamp(value["createdAt"])
    exception = value["exception"]
    if exception is not None:
        exception_fields = {"type", "message", "traceback", "line"}
        if not isinstance(exception, dict) or set(exception) != exception_fields:
            raise ValueError("错题 exception 无效")
        if not all(isinstance(exception[field], str) for field in ("type", "message", "traceback")):
            raise ValueError("错题 exception 文本无效")
        if exception["line"] is not None and (
            not isinstance(exception["line"], int) or isinstance(exception["line"], bool)
        ):
            raise ValueError("错题 exception 行号无效")
    if not isinstance(value["tests"], list):
        raise ValueError("错题 tests 无效")
    for test in value["tests"]:
        if not isinstance(test, dict):
            raise ValueError("错题测试项无效")
        required = {"name", "passed", "detail"}
        allowed = required | {"expected", "actual", "rule", "kind"}
        if (
            not required.issubset(test)
            or set(test) - allowed
            or not isinstance(test["name"], str)
        ):
            raise ValueError("错题测试项字段无效")
        if not isinstance(test["passed"], bool) or not isinstance(test["detail"], str):
            raise ValueError("错题测试项类型无效")
        for field in ("expected", "actual", "rule"):
            if field in test and not isinstance(test[field], str):
                raise ValueError(f"错题测试项 {field} 无效")
        if "kind" in test and test["kind"] not in {"behavior", "structure"}:
            raise ValueError("错题测试项 kind 无效")


def _validate_learning_state(state):
    fields = {"completed", "drafts", "mistakes"}
    if not isinstance(state, dict) or set(state) != fields:
        raise ValueError("学习进度字段无效")
    if not isinstance(state["completed"], list) or any(
        not isinstance(lesson_id, str) or not lesson_id for lesson_id in state["completed"]
    ):
        raise ValueError("completed 无效")
    if len(set(state["completed"])) != len(state["completed"]):
        raise ValueError("completed 不得重复")
    drafts = state["drafts"]
    if not isinstance(drafts, dict) or any(
        not isinstance(lesson_id, str) or not isinstance(code, str)
        for lesson_id, code in drafts.items()
    ):
        raise ValueError("drafts 无效")
    if not isinstance(state["mistakes"], list):
        raise ValueError("mistakes 无效")
    for item in state["mistakes"]:
        _validate_mistake(item)
    mistake_ids = [item["id"] for item in state["mistakes"]]
    if len(set(mistake_ids)) != len(mistake_ids):
        raise ValueError("错题 id 不得重复")
    return state


def _validate_chat_messages(messages):
    if not isinstance(messages, list):
        raise ValueError("messages 必须是数组")
    for message in messages:
        if not isinstance(message, dict) or set(message) != {"role", "content", "createdAt"}:
            raise ValueError("聊天消息字段无效")
        if message["role"] not in {"user", "assistant"}:
            raise ValueError("聊天消息 role 无效")
        if not isinstance(message["content"], str) or not message["content"]:
            raise ValueError("聊天消息 content 无效")
        _validate_timestamp(message["createdAt"])


def _validate_chat_key(course_id, lesson_id):
    if not isinstance(course_id, str) or not course_id:
        raise ValueError("course_id 必须是非空字符串")
    if not isinstance(lesson_id, str) or not lesson_id:
        raise ValueError("lesson_id 必须是非空字符串")


def _validate_source(source_kind, source_hash):
    if source_kind not in {"model-profiles", "chat-history"}:
        raise ValueError("迁移源类型无效")
    if not isinstance(source_hash, str) or not source_hash:
        raise ValueError("迁移源 hash 无效")


def _validate_rag_evaluation(record):
    fields = {
        "catalogHash", "documentHash", "embeddingModel", "recordedAt", "caseCount",
        "recallAtK", "mrr", "citationCoverage", "faithfulnessProxy", "latencyMs",
    }
    if not isinstance(record, dict) or set(record) != fields:
        raise ValueError("RAG 评测记录字段无效")
    for field in ("catalogHash", "documentHash"):
        if not isinstance(record[field], str) or not re.fullmatch(r"[0-9a-f]{64}", record[field]):
            raise ValueError("RAG 评测记录字段无效")
    if not isinstance(record["embeddingModel"], str) or not record["embeddingModel"]:
        raise ValueError("RAG 评测记录字段无效")
    _validate_timestamp(record["recordedAt"])
    if not isinstance(record["caseCount"], int) or isinstance(record["caseCount"], bool) or record["caseCount"] < 1:
        raise ValueError("RAG 评测记录字段无效")
    for field in ("recallAtK", "mrr", "citationCoverage", "faithfulnessProxy"):
        if not isinstance(record[field], (int, float)) or isinstance(record[field], bool) or not 0 <= record[field] <= 1:
            raise ValueError("RAG 评测记录字段无效")
    if not isinstance(record["latencyMs"], (int, float)) or isinstance(record["latencyMs"], bool) or record["latencyMs"] < 0:
        raise ValueError("RAG 评测记录字段无效")


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

    def get_learning_state(self):
        completed = [
            row["lesson_id"]
            for row in self.connection.execute(
                "SELECT lesson_id FROM lesson_progress WHERE completed = 1 ORDER BY position ASC"
            )
        ]
        drafts = {
            row["lesson_id"]: row["code"]
            for row in self.connection.execute(
                "SELECT lesson_id, code FROM lesson_drafts ORDER BY lesson_id"
            )
        }
        mistakes = []
        for row in self.connection.execute("SELECT * FROM mistakes ORDER BY position ASC"):
            mistakes.append(
                {
                    "id": row["id"],
                    "lessonId": row["lesson_id"],
                    "createdAt": row["created_at"],
                    "code": row["code"],
                    "output": row["output"],
                    "stderr": row["stderr"],
                    "exception": json.loads(row["exception_json"])
                    if row["exception_json"] is not None
                    else None,
                    "tests": json.loads(row["tests_json"]),
                }
            )
        return {"completed": completed, "drafts": drafts, "mistakes": mistakes}

    def _replace_learning_state(self, state):
        self.connection.execute("DELETE FROM lesson_progress")
        self.connection.execute("DELETE FROM lesson_drafts")
        self.connection.execute("DELETE FROM mistakes")
        self.connection.executemany(
            "INSERT INTO lesson_progress (lesson_id, completed, position) VALUES (?, 1, ?)",
            [(lesson_id, position) for position, lesson_id in enumerate(state["completed"])],
        )
        self.connection.executemany(
            "INSERT INTO lesson_drafts (lesson_id, code) VALUES (?, ?)",
            list(state["drafts"].items()),
        )
        self.connection.executemany(
            """
            INSERT INTO mistakes (
                id, position, lesson_id, created_at, code, output, stderr,
                exception_json, tests_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            [
                (
                    item["id"],
                    position,
                    item["lessonId"],
                    item["createdAt"],
                    item["code"],
                    item["output"],
                    item["stderr"],
                    json.dumps(item["exception"], ensure_ascii=False, separators=(",", ":"))
                    if item["exception"] is not None
                    else None,
                    json.dumps(item["tests"], ensure_ascii=False, separators=(",", ":")),
                )
                for position, item in enumerate(state["mistakes"])
            ],
        )

    def save_learning_state(self, state):
        _validate_learning_state(state)
        with self.connection:
            self._replace_learning_state(state)
        return self.get_learning_state()

    def record_mastery_attempt(self, event):
        if not isinstance(event, dict):
            raise ValueError("掌握度事件无效")
        compute_mastery([event], event.get("createdAt"))
        with self.connection:
            self.connection.execute(
                "INSERT INTO mastery_attempts (lesson_id, family_id, outcome, mistake_codes_json, created_at) VALUES (?, ?, ?, ?, ?)",
                (event["lessonId"], event["familyId"], event["outcome"], json.dumps(event["mistakeCodes"], ensure_ascii=False), event["createdAt"]),
            )
        return {"recorded": True}

    def get_mastery(self, now):
        mastery = compute_mastery(self._mastery_events(), now)
        return {"mastery": mastery, "reviewQueue": select_review_queue(mastery, now)}

    def _mastery_events(self):
        return [
            {
                "lessonId": row["lesson_id"],
                "familyId": row["family_id"],
                "outcome": row["outcome"],
                "mistakeCodes": json.loads(row["mistake_codes_json"]),
                "createdAt": row["created_at"],
            }
            for row in self.connection.execute("SELECT lesson_id, family_id, outcome, mistake_codes_json, created_at FROM mastery_attempts ORDER BY id")
        ]

    def get_tutor_plan(self, learning_bundle, now):
        return build_tutor_plan(learning_bundle, compute_mastery(self._mastery_events(), now), now)

    def record_rag_evaluation(self, record):
        _validate_rag_evaluation(record)
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO rag_evaluations (
                    catalog_hash, document_hash, embedding_model, recorded_at, case_count,
                    recall_at_k, mrr, citation_coverage, faithfulness_proxy, latency_ms
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record["catalogHash"], record["documentHash"], record["embeddingModel"],
                    record["recordedAt"], record["caseCount"], record["recallAtK"],
                    record["mrr"], record["citationCoverage"], record["faithfulnessProxy"],
                    record["latencyMs"],
                ),
            )
        return {"recorded": True}

    def list_rag_evaluations(self):
        rows = self.connection.execute(
            """
            SELECT id, catalog_hash, document_hash, embedding_model, recorded_at, case_count,
                   recall_at_k, mrr, citation_coverage, faithfulness_proxy, latency_ms
            FROM rag_evaluations ORDER BY id DESC LIMIT 20
            """
        ).fetchall()
        return [
            {
                "id": row["id"],
                "catalogHash": row["catalog_hash"],
                "documentHash": row["document_hash"],
                "embeddingModel": row["embedding_model"],
                "recordedAt": row["recorded_at"],
                "caseCount": row["case_count"],
                "recallAtK": row["recall_at_k"],
                "mrr": row["mrr"],
                "citationCoverage": row["citation_coverage"],
                "faithfulnessProxy": row["faithfulness_proxy"],
                "latencyMs": row["latency_ms"],
            }
            for row in rows
        ]

    def next_personalized_exercise(self, learning_bundle, lesson_id, seed):
        events = [
            {"lessonId": row["lesson_id"], "familyId": row["family_id"], "outcome": row["outcome"], "mistakeCodes": json.loads(row["mistake_codes_json"]), "createdAt": row["created_at"]}
            for row in self.connection.execute("SELECT lesson_id, family_id, outcome, mistake_codes_json, created_at FROM mastery_attempts WHERE lesson_id = ? ORDER BY id", (lesson_id,))
        ]
        mistake_codes = []
        for event in events:
            for code in event["mistakeCodes"]:
                if code not in mistake_codes:
                    mistake_codes.append(code)
        selection = select_family(learning_bundle, lesson_id, mistake_codes)
        lesson = next(
            (
                item
                for track in learning_bundle["catalog"]["tracks"]
                for item in track["lessons"]
                if item["id"] == lesson_id
            ),
            None,
        )
        if not isinstance(lesson, dict) or not isinstance(lesson.get("exercise"), dict):
            raise ValueError("个性题对应课程缺少 starter")
        selection["starterCode"] = lesson["exercise"].get("starterCode")
        recent_prompts = [
            row["prompt"]
            for row in self.connection.execute(
                "SELECT prompt FROM personalized_exercises WHERE lesson_id = ? ORDER BY id DESC LIMIT 3",
                (lesson_id,),
            )
        ]
        exercise = generate_personalized_exercise(selection, seed, recent_prompts)
        family = learning_bundle["families"][selection["familyId"]]
        checked = validate_generated_exercise(family, exercise)
        if not checked["accepted"]:
            raise ValueError("个性题未通过 family 验证")
        with self.connection:
            self.connection.execute(
                "INSERT INTO personalized_exercises (lesson_id, family_id, prompt, created_at) VALUES (?, ?, ?, ?)",
                (lesson_id, selection["familyId"], exercise["prompt"], datetime.now(timezone.utc).isoformat()),
            )
        return {"exercise": checked["exercise"], "recommendation": {"lessonId": lesson_id, "familyId": selection["familyId"], "mistakeCodes": mistake_codes, "difficulty": selection["difficulty"]}}

    def import_legacy_learning_state(self, state, source_hash):
        _validate_learning_state(state)
        if not isinstance(source_hash, str) or not source_hash:
            raise ValueError("迁移源 hash 无效")
        existing = self.connection.execute(
            "SELECT status FROM migration_sources WHERE source_kind = 'learning-progress' AND source_hash = ?",
            (source_hash,),
        ).fetchone()
        if existing is not None:
            return {"imported": False, "state": self.get_learning_state()}
        with self.connection:
            self._replace_learning_state(state)
            self.connection.execute(
                """
                INSERT INTO migration_sources (source_kind, source_hash, status)
                VALUES ('learning-progress', ?, 'imported')
                """,
                (source_hash,),
            )
        return {"imported": True, "state": self.get_learning_state()}

    def list_chat_messages(self, course_id, lesson_id):
        _validate_chat_key(course_id, lesson_id)
        return [
            {
                "role": row["role"],
                "content": row["content"],
                "createdAt": row["created_at"],
            }
            for row in self.connection.execute(
                """
                SELECT role, content, created_at FROM chat_messages
                WHERE course_id = ? AND lesson_id = ? ORDER BY sequence ASC
                """,
                (course_id, lesson_id),
            )
        ]

    def append_chat_messages(self, course_id, lesson_id, messages):
        _validate_chat_key(course_id, lesson_id)
        _validate_chat_messages(messages)
        with self.connection:
            self.connection.execute(
                """
                INSERT INTO chat_threads (course_id, lesson_id) VALUES (?, ?)
                ON CONFLICT(course_id, lesson_id) DO NOTHING
                """,
                (course_id, lesson_id),
            )
            next_sequence = self.connection.execute(
                """
                SELECT COALESCE(MAX(sequence), -1) + 1 FROM chat_messages
                WHERE course_id = ? AND lesson_id = ?
                """,
                (course_id, lesson_id),
            ).fetchone()[0]
            self.connection.executemany(
                """
                INSERT INTO chat_messages
                    (course_id, lesson_id, sequence, role, content, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                [
                    (
                        course_id,
                        lesson_id,
                        next_sequence + offset,
                        message["role"],
                        message["content"],
                        message["createdAt"],
                    )
                    for offset, message in enumerate(messages)
                ],
            )
            self.connection.execute(
                """
                UPDATE chat_threads SET updated_at = CURRENT_TIMESTAMP
                WHERE course_id = ? AND lesson_id = ?
                """,
                (course_id, lesson_id),
            )
        return self.list_chat_messages(course_id, lesson_id)

    def clear_chat_messages(self, course_id, lesson_id):
        _validate_chat_key(course_id, lesson_id)
        with self.connection:
            self.connection.execute(
                "DELETE FROM chat_threads WHERE course_id = ? AND lesson_id = ?",
                (course_id, lesson_id),
            )
        return {"cleared": True}

    def import_legacy(self, source_kind, source_hash, profiles, conversations):
        _validate_source(source_kind, source_hash)
        if source_kind == "model-profiles":
            if not isinstance(profiles, list) or not profiles:
                raise ValueError("旧模型配置必须是非空数组")
            validated = []
            for profile in profiles:
                profile = _validated_profile(profile)
                validated.append(profile)
            if len({profile["id"] for profile in validated}) != len(validated):
                raise ValueError("旧模型配置 id 不得重复")
        elif conversations is None or not isinstance(conversations, list):
            raise ValueError("旧聊天历史必须是数组")
        existing = self.connection.execute(
            "SELECT status FROM migration_sources WHERE source_kind = ? AND source_hash = ?",
            (source_kind, source_hash),
        ).fetchone()
        if existing is not None:
            return {"imported": existing["status"] == "imported"}
        with self.connection:
            if source_kind == "model-profiles":
                conflict = self.connection.execute(
                    f"SELECT id FROM model_profiles WHERE id IN ({','.join('?' for _ in validated)}) LIMIT 1",
                    [profile["id"] for profile in validated],
                ).fetchone()
                if conflict is not None:
                    raise ValueError(f"模型配置 id 已存在：{conflict['id']}")
                has_active = self.connection.execute(
                    "SELECT 1 FROM model_profiles WHERE active = 1 LIMIT 1"
                ).fetchone() is not None
                for index, profile in enumerate(validated):
                    self.connection.execute(
                        """INSERT INTO model_profiles
                        (id,name,base_url,provider_origin,model,embedding_model,temperature,max_tokens,timeout_ms,api_key_ciphertext,active)
                        VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
                        (profile["id"], profile["name"], profile["baseUrl"], profile["origin"], profile["model"],
                         profile["embeddingModel"], profile["temperature"], profile["maxTokens"], profile["timeoutMs"], None,
                         int(not has_active and index == 0)),
                    )
            else:
                for conversation in conversations:
                    if not isinstance(conversation, dict) or set(conversation) != {"courseId", "lessonId", "messages"}:
                        raise ValueError("旧聊天记录字段无效")
                    _validate_chat_key(conversation["courseId"], conversation["lessonId"])
                    _validate_chat_messages(conversation["messages"])
                    exists = self.connection.execute(
                        "SELECT 1 FROM chat_messages WHERE course_id = ? AND lesson_id = ? LIMIT 1",
                        (conversation["courseId"], conversation["lessonId"]),
                    ).fetchone()
                    if exists is not None:
                        raise ValueError("旧聊天记录与现有记录冲突")
                for conversation in conversations:
                    course_id, lesson_id = conversation["courseId"], conversation["lessonId"]
                    self.connection.execute(
                        "INSERT INTO chat_threads(course_id, lesson_id) VALUES (?, ?)"
                        "ON CONFLICT(course_id, lesson_id) DO NOTHING",
                        (course_id, lesson_id),
                    )
                    for sequence, message in enumerate(conversation["messages"]):
                        self.connection.execute(
                            "INSERT INTO chat_messages(course_id, lesson_id, sequence, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                            (course_id, lesson_id, sequence, message["role"], message["content"], message["createdAt"]),
                        )
            self.connection.execute(
                "INSERT INTO migration_sources(source_kind,source_hash,status) VALUES (?,?, 'imported')",
                (source_kind, source_hash),
            )
        return {"imported": True}

    def record_legacy_failure(self, source_kind, source_hash, error_message):
        _validate_source(source_kind, source_hash)
        if not isinstance(error_message, str) or not error_message:
            raise ValueError("迁移失败原因无效")
        with self.connection:
            self.connection.execute(
                "INSERT OR IGNORE INTO migration_sources(source_kind,source_hash,status,error_message) VALUES (?,?, 'failed', ?)",
                (source_kind, source_hash, error_message),
            )
        return {"recorded": True}

    def export_learning(self):
        chats = []
        for row in self.connection.execute("SELECT course_id, lesson_id FROM chat_threads ORDER BY course_id, lesson_id"):
            chats.append({
                "courseId": row["course_id"],
                "lessonId": row["lesson_id"],
                "messages": self.list_chat_messages(row["course_id"], row["lesson_id"]),
            })
        return {
            "schema": "stewie-learning-export-v1",
            "exportedAt": datetime.now().astimezone().isoformat(),
            "learning": self.get_learning_state(),
            "chats": chats,
        }

    def import_learning_export(self, document):
        if not isinstance(document, dict) or set(document) != {"schema", "exportedAt", "learning", "chats"}:
            raise ValueError("学习导入文件字段无效")
        if document["schema"] != "stewie-learning-export-v1":
            raise ValueError("学习导入文件版本不支持")
        _validate_timestamp(document["exportedAt"])
        _validate_learning_state(document["learning"])
        if not isinstance(document["chats"], list):
            raise ValueError("学习导入聊天字段无效")
        for conversation in document["chats"]:
            if not isinstance(conversation, dict) or set(conversation) != {"courseId", "lessonId", "messages"}:
                raise ValueError("学习导入聊天字段无效")
            _validate_chat_key(conversation["courseId"], conversation["lessonId"])
            _validate_chat_messages(conversation["messages"])
        with self.connection:
            self._replace_learning_state(document["learning"])
            self.connection.execute("DELETE FROM chat_threads")
            for conversation in document["chats"]:
                course_id, lesson_id = conversation["courseId"], conversation["lessonId"]
                self.connection.execute("INSERT INTO chat_threads(course_id, lesson_id) VALUES (?, ?)", (course_id, lesson_id))
                self.connection.executemany(
                    "INSERT INTO chat_messages(course_id, lesson_id, sequence, role, content, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                    [(course_id, lesson_id, index, message["role"], message["content"], message["createdAt"])
                     for index, message in enumerate(conversation["messages"])],
                )
        return {
            "imported": True,
            "counts": {
                "completed": len(document["learning"]["completed"]),
                "drafts": len(document["learning"]["drafts"]),
                "mistakes": len(document["learning"]["mistakes"]),
                "threads": len(document["chats"]),
                "messages": sum(len(item["messages"]) for item in document["chats"]),
            },
        }
