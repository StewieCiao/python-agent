import test from "node:test";
import assert from "node:assert/strict";
import { ragDocumentsForInput, replaceRagInput } from "../app/lib/ragInput.mjs";

test("RAG 使用显式选择的资料，空文件库不退回旧粘贴文本", () => {
  const documents = [{ id: "file", text: "文件正文", source: "file.md" }];
  const input = { mode: "files", text: "旧粘贴文本", source: "笔记", documents };
  assert.deepEqual(ragDocumentsForInput(input), documents);
  assert.deepEqual(ragDocumentsForInput({ ...input, documents: [] }), []);
  assert.deepEqual(ragDocumentsForInput({ ...input, mode: "text" }), [
    { id: "local-1", text: "旧粘贴文本", source: "笔记" },
  ]);
  assert.deepEqual(ragDocumentsForInput({ ...input, mode: "text", text: "  " }), []);
});

test("替换或清空 RAG 输入同时撤下旧答案与评测，不改写旧快照", () => {
  const input = { mode: "files", text: "旧文本", source: "笔记", documents: [] };
  const previous = { input, result: { answer: "旧答案", sources: [], matches: [] }, evaluation: { recallAtK: 1 } };
  for (const next of [input, { ...input, mode: "text", text: "新文本" }]) {
    assert.deepEqual(replaceRagInput(previous, next), { input: next, result: null, evaluation: null });
  }
  assert.equal(previous.result.answer, "旧答案");
  assert.equal(previous.evaluation.recallAtK, 1);
});
