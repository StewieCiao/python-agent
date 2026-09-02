import json


class ProtocolError(ValueError):
    pass


METHOD_PARAMS = {
    "health": set(),
    "profile.list": set(),
    "profile.get": {"profileId"},
    "profile.activate": {"profileId"},
    "profile.delete": {"profileId"},
    "profile.upsert": {"profile", "apiKeyCiphertext", "makeActive"},
    "learning.get": set(),
    "learning.save": {"state"},
    "learning.importLegacy": {"state", "sourceHash"},
    "chat.list": {"courseId", "lessonId"},
    "chat.append": {"courseId", "lessonId", "messages"},
    "chat.clear": {"courseId", "lessonId"},
    "legacy.import": {"sourceKind", "sourceHash", "profiles", "conversations"},
    "legacy.recordFailure": {"sourceKind", "sourceHash", "errorMessage"},
    "learning.export": set(),
    "learning.importExport": {"document"},
    "mastery.record": {"event"},
    "mastery.get": {"now"},
}


def decode_request(frame):
    try:
        request = json.loads(frame)
    except json.JSONDecodeError as error:
        raise ProtocolError("请求不是有效 JSON") from error

    if not isinstance(request, dict):
        raise ProtocolError("请求必须是 JSON 对象")
    if set(request) != {"id", "method", "params"}:
        raise ProtocolError("请求字段必须且只能包含 id、method、params")
    if not isinstance(request["id"], str) or not request["id"] or len(request["id"]) > 128:
        raise ProtocolError("请求 id 必须是 1–128 字符的字符串")
    if request["method"] not in METHOD_PARAMS:
        raise ProtocolError("不支持的服务方法")
    params = request["params"]
    if not isinstance(params, dict) or set(params) != METHOD_PARAMS[request["method"]]:
        raise ProtocolError(f"{request['method']} 的 params 字段无效")
    if request["method"] in {"profile.get", "profile.activate", "profile.delete"}:
        if not isinstance(params["profileId"], str) or not params["profileId"]:
            raise ProtocolError("profileId 必须是非空字符串")
    if request["method"] == "profile.upsert":
        if not isinstance(params["profile"], dict):
            raise ProtocolError("profile 必须是对象")
        if params["apiKeyCiphertext"] is not None and not isinstance(params["apiKeyCiphertext"], str):
            raise ProtocolError("apiKeyCiphertext 必须是字符串或 null")
        if not isinstance(params["makeActive"], bool):
            raise ProtocolError("makeActive 必须是布尔值")
    if request["method"] in {"learning.save", "learning.importLegacy"}:
        if not isinstance(params["state"], dict):
            raise ProtocolError("state 必须是对象")
    if request["method"] == "learning.importLegacy":
        if not isinstance(params["sourceHash"], str) or not params["sourceHash"]:
            raise ProtocolError("sourceHash 必须是非空字符串")
    if request["method"] in {"chat.list", "chat.append", "chat.clear"}:
        for field in ("courseId", "lessonId"):
            if not isinstance(params[field], str) or not params[field]:
                raise ProtocolError(f"{field} 必须是非空字符串")
    if request["method"] == "chat.append" and not isinstance(params["messages"], list):
        raise ProtocolError("messages 必须是数组")
    if request["method"] == "legacy.import":
        if params["sourceKind"] not in {"model-profiles", "chat-history"}:
            raise ProtocolError("sourceKind 无效")
        if not isinstance(params["sourceHash"], str) or not params["sourceHash"]:
            raise ProtocolError("sourceHash 必须是非空字符串")
        if params["sourceKind"] == "model-profiles" and (not isinstance(params["profiles"], list) or params["conversations"] is not None):
            raise ProtocolError("legacy.import 数据字段无效")
        if params["sourceKind"] == "chat-history" and (params["profiles"] is not None or not isinstance(params["conversations"], list)):
            raise ProtocolError("legacy.import 数据字段无效")
    if request["method"] == "legacy.recordFailure":
        if params["sourceKind"] not in {"model-profiles", "chat-history"}:
            raise ProtocolError("sourceKind 无效")
        if not isinstance(params["sourceHash"], str) or not params["sourceHash"] or not isinstance(params["errorMessage"], str) or not params["errorMessage"]:
            raise ProtocolError("legacy.recordFailure 字段无效")
    if request["method"] == "learning.importExport" and not isinstance(params["document"], dict):
        raise ProtocolError("document 必须是对象")
    if request["method"] == "mastery.record" and not isinstance(params["event"], dict):
        raise ProtocolError("event 必须是对象")
    if request["method"] == "mastery.get" and (not isinstance(params["now"], str) or not params["now"]):
        raise ProtocolError("now 必须是非空字符串")
    return request


def success_response(request_id, result):
    return {"id": request_id, "ok": True, "result": result}


def error_response(request_id, error):
    return {
        "id": request_id,
        "ok": False,
        "error": {"type": type(error).__name__, "message": str(error)},
    }


def encode_message(message):
    return json.dumps(message, ensure_ascii=False, separators=(",", ":")) + "\n"
