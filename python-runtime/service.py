import argparse
import importlib
import importlib.metadata
import platform
import sqlite3
import sys
import warnings
from contextlib import closing

from langchain_core._api.deprecation import LangChainPendingDeprecationWarning
from protocol import decode_request, encode_message, error_response, success_response
from storage import Storage


REQUIRED_PACKAGES = {
    "langchain": "langchain",
    "langgraph": "langgraph",
    "langgraph-checkpoint-sqlite": "langgraph.checkpoint.sqlite",
    "pypdf": "pypdf",
}


def build_health_result():
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
    }


def dispatch_request(request, storage):
    method = request["method"]
    params = request["params"]
    if method == "health":
        return build_health_result()
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
    raise ValueError("不支持的服务方法")


def serve(input_stream, output_stream, storage):
    for frame in input_stream:
        request_id = None
        try:
            request = decode_request(frame)
            request_id = request["id"]
            response = success_response(request_id, dispatch_request(request, storage))
        except Exception as error:
            response = error_response(request_id, error)
        output_stream.write(encode_message(response))
        output_stream.flush()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--database", required=True)
    args = parser.parse_args()
    storage = Storage(args.database)
    try:
        serve(sys.stdin, sys.stdout, storage)
    finally:
        storage.close()


if __name__ == "__main__":
    main()
