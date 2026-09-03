import test from "node:test";
import assert from "node:assert/strict";

const { evaluateRag } = await import("../desktop/src/ragEvaluation.mts");

test("RAG 评测计算 recall@k、MRR、引用覆盖和真实耗时", async () => {
  const calls = [];
  const result = await evaluateRag({
    answer: async (_profile, query, documents) => {
      calls.push({ query, documents });
      const includeOther = query.includes("恢复");
      return {
        answer: "答案 [guide.md]",
        sources: ["guide.md"],
        matches: includeOther
          ? [{ source: "guide.md", score: 0.9 }, { source: "other.md", score: 0.4 }]
          : [{ source: "guide.md", score: 0.9 }],
      };
    },
  }, "profile-1", [
    { query: "如何保存状态？", expectedSources: ["guide.md"] },
    { query: "如何恢复状态？", expectedSources: ["guide.md", "missing.md"] },
  ], [
    { id: "guide", text: "checkpoint 保存状态", source: "guide.md" },
    { id: "other", text: "恢复线程", source: "other.md" },
  ]);

  assert.equal(calls.length, 2);
  assert.equal(result.recallAtK, 0.75);
  assert.equal(result.mrr, 1);
  assert.equal(result.citationCoverage, 0.75);
  assert.equal(result.faithfulnessProxy, 0.5);
  assert.equal(result.caseResults.length, 2);
  assert.equal(result.tokenUsage.status, "unavailable");
  assert.ok(result.latencyMs >= 0);
});

test("RAG 评测拒绝空问答集，不调用检索", async () => {
  let called = false;
  await assert.rejects(
    () => evaluateRag({ answer: async () => { called = true; throw new Error("不应调用"); } }, "p", [], []),
    /问答集不能为空/,
  );
  assert.equal(called, false);
});

test("RAG 评测保留资料不足的真实结果", async () => {
  const result = await evaluateRag({
    answer: async () => ({ answer: "资料不足", sources: [], matches: [] }),
  }, "p", [{ query: "未知", expectedSources: ["missing.md"] }], [{ id: "a", text: "资料", source: "a.md" }]);
  assert.equal(result.caseResults[0].answer, "资料不足");
  assert.equal(result.recallAtK, 0);
  assert.equal(result.citationCoverage, 0);
  assert.equal(result.faithfulnessProxy, 0);
});
