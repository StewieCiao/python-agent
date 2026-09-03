from pathlib import Path

TEXT_SUFFIXES = {".txt", ".md", ".markdown", ".csv"}
MAX_FILES = 10
MAX_BYTES = 10 * 1024 * 1024


def _source_name(path: Path) -> str:
    return path.name


def _text_document(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if not text.strip():
        raise ValueError(f"文件 {path.name} 正文为空")
    return {"id": path.name, "text": text.rstrip("\n"), "source": _source_name(path)}


def _pdf_documents(path: Path) -> list[dict]:
    from pypdf import PdfReader

    pages = []
    for page_number, page in enumerate(PdfReader(str(path)).pages, start=1):
        text = (page.extract_text() or "").strip()
        if text:
            pages.append({
                "id": f"{path.name}#page={page_number}",
                "text": text,
                "source": f"{path.name} · 第 {page_number} 页",
            })
    if not pages:
        raise ValueError(f"文件 {path.name} 未提取到正文")
    return pages


def load_documents(paths: list[str]) -> list[dict]:
    if not isinstance(paths, list) or not paths or len(paths) > MAX_FILES:
        raise ValueError("本次最多选择 10 个文件，且不能为空")
    documents = []
    for raw_path in paths:
        if not isinstance(raw_path, str) or not raw_path:
            raise ValueError("文件路径无效")
        path = Path(raw_path)
        if not path.is_file():
            raise ValueError(f"文件不存在：{path.name}")
        if path.stat().st_size > MAX_BYTES:
            raise ValueError(f"文件 {path.name} 超过 10 MB")
        suffix = path.suffix.lower()
        if suffix in TEXT_SUFFIXES:
            documents.append(_text_document(path))
        elif suffix == ".pdf":
            documents.extend(_pdf_documents(path))
        else:
            raise ValueError(f"不支持的文件格式：{suffix or '无扩展名'}")
    return documents
