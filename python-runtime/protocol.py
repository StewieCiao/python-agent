import json


class ProtocolError(ValueError):
    pass


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
    if request["method"] != "health":
        raise ProtocolError("不支持的服务方法")
    if request["params"] != {}:
        raise ProtocolError("health 的 params 必须是空对象")
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
