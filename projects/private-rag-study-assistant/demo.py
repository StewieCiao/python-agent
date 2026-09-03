"""Offline retrieval demo with an explicit no-evidence boundary."""


def answer(question, documents):
    if not isinstance(question, str) or not question.strip():
        raise ValueError("question must be non-empty")
    matches = [document for document in documents if any(word in document["text"].lower() for word in question.lower().split())]
    if not matches:
        return {"answer": "资料不足", "sources": []}
    return {
        "answer": matches[0]["text"],
        "sources": list(dict.fromkeys(document["source"] for document in matches)),
    }


if __name__ == "__main__":
    print(answer("引用", [{"text": "引用必须真实", "source": "notes.md"}]))
