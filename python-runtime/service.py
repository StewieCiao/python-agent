import argparse
import importlib
import importlib.metadata
import json
import platform
import sqlite3
import sys
import warnings
from contextlib import closing

from langchain_core._api.deprecation import LangChainPendingDeprecationWarning
from catalog import load_learning_bundle
from protocol import decode_request, encode_message, error_response, success_response
from storage import Storage


REQUIRED_PACKAGES = {
    "langchain": "langchain",
    "langgraph": "langgraph",
    "langgraph-checkpoint-sqlite": "langgraph.checkpoint.sqlite",
    "pypdf": "pypdf",
}


def build_health_result(learning_bundle):
    packages = {}
    for distribution, module in REQUIRED_PACKAGES.items():
        with warnings.catch_warnings():
            warnings.filterwarnings(
                "ignore",
                message="The default value of `allowed_objects` will change in a future version.*",
                category=LangChainPendingDeprecationWarning,
            )
            importlib.import_module(module)
        packages[distribution] = importlib.metadata.version(distribution)

    with closing(sqlite3.connect(":memory:")) as connection:
        connection.execute("CREATE TABLE transaction_probe (value INTEGER NOT NULL)")
        connection.commit()
        connection.execute("BEGIN")
        connection.execute("INSERT INTO transaction_probe VALUES (1)")
        connection.rollback()
        transaction_ok = connection.execute(
            "SELECT COUNT(*) FROM transaction_probe"
        ).fetchone()[0] == 0

        connection.execute("CREATE VIRTUAL TABLE search_probe USING fts5(content)")
        connection.execute("INSERT INTO search_probe(content) VALUES ('stewie learnos')")
        fts5_ok = connection.execute(
            "SELECT COUNT(*) FROM search_probe WHERE search_probe MATCH 'stewie'"
        ).fetchone()[0] == 1

    return {
        "pythonVersion": platform.python_version(),
        "packages": packages,
        "sqlite": {
            "version": sqlite3.sqlite_version,
            "transaction": transaction_ok,
            "fts5": fts5_ok,
        },
        "catalog": {
            "schemaVersion": learning_bundle["schemaVersion"],
            "catalogHash": learning_bundle["catalogHash"],
            "familyHash": learning_bundle["familyHash"],
        },
    }


def dispatch_request(request, storage, learning_bundle):
    method = request["method"]
    params = request["params"]
    if method == "health":
        return build_health_result(learning_bundle)
    if method == "profile.list":
        return storage.list_profiles()
    if method == "profile.get":
        return storage.get_profile(params["profileId"])
    if method == "profile.upsert":
        return storage.upsert_profile(
            params["profile"],
            params["apiKeyCiphertext"],
            params["makeActive"],
        )
    if method == "profile.activate":
        return storage.set_active_profile(params["profileId"])
    if method == "profile.delete":
        return storage.delete_profile(params["profileId"])
    if method == "learning.get":
        return storage.get_learning_state()
    if method == "learning.save":
        return storage.save_learning_state(params["state"])
    if method == "learning.importLegacy":
        return storage.import_legacy_learning_state(params["state"], params["sourceHash"])
    if method == "chat.list":
        return storage.list_chat_messages(params["courseId"], params["lessonId"])
    if method == "chat.append":
        return storage.append_chat_messages(
            params["courseId"], params["lessonId"], params["messages"]
        )
    if method == "chat.clear":
        return storage.clear_chat_messages(params["courseId"], params["lessonId"])
    if method == "legacy.import":
        return storage.import_legacy(
            params["sourceKind"], params["sourceHash"], params["profiles"], params["conversations"]
        )
    if method == "legacy.recordFailure":
        return storage.record_legacy_failure(
            params["sourceKind"], params["sourceHash"], params["errorMessage"]
        )
    if method == "learning.export":
        return storage.export_learning()
    if method == "learning.importExport":
        return storage.import_learning_export(params["document"])
    if method == "mastery.record":
        return storage.record_mastery_attempt(params["event"])
    if method == "mastery.get":
        return storage.get_mastery(params["now"])
    if method == "personalization.next":
        return storage.next_personalized_exercise(learning_bundle, params["lessonId"], params["seed"])
    raise ValueError("不支持的服务方法")


def serve(input_stream, output_stream, storage, learning_bundle):
    for frame in input_stream:
        request_id = None
        try:
            raw_request = json.loads(frame)
        except json.JSONDecodeError:
            raw_request = None
        if (
            isinstance(raw_request, dict)
            and isinstance(raw_request.get("id"), str)
            and raw_request["id"]
            and len(raw_request["id"]) <= 128
        ):
            request_id = raw_request["id"]
        try:
            request = decode_request(frame)
            request_id = request["id"]
            response = success_response(request_id, dispatch_request(request, storage, learning_bundle))
        except Exception as error:
            response = error_response(request_id, error)
        output_stream.write(encode_message(response))
        output_stream.flush()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--catalog", required=True)
    parser.add_argument("--database", required=True)
    args = parser.parse_args()
    learning_bundle = load_learning_bundle(args.catalog)
    storage = Storage(args.database)
    try:
        serve(sys.stdin, sys.stdout, storage, learning_bundle)
    finally:
        storage.close()


if __name__ == "__main__":
    main()
