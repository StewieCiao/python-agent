import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from documents import load_documents


class DocumentsTest(unittest.TestCase):
    def test_text_files_keep_source_and_normalize_nonempty_lines(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "notes.md"
            path.write_text("第一行\n\n 第二行 \n", encoding="utf-8")

            self.assertEqual(
                load_documents([str(path)]),
                [{"id": "notes.md", "text": "第一行\n\n 第二行 ", "source": "notes.md"}],
            )

    def test_unsupported_or_empty_files_fail_with_real_reason(self):
        with tempfile.TemporaryDirectory() as directory:
            empty = Path(directory) / "empty.txt"
            empty.write_text("   \n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "正文为空"):
                load_documents([str(empty)])

            binary = Path(directory) / "notes.exe"
            binary.write_bytes(b"data")
            with self.assertRaisesRegex(ValueError, "不支持"):
                load_documents([str(binary)])
