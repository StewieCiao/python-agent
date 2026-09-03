import type { RagDocument, RagMatch } from "./ragService.mjs";

export type RagEvaluationCase = {
  query: string;
  expectedSources: string[];
};

export type RagEvaluationCaseResult = {
  query: string;
  expectedSources: string[];
  answer: string;
  matches: RagMatch[];
  sources: string[];
  recallAtK: number;
  reciprocalRank: number;
  citationCoverage: number;
  faithfulnessProxy: number;
  latencyMs: number;
};

export type RagEvaluationResult = {
  caseResults: RagEvaluationCaseResult[];
  recallAtK: number;
  mrr: number;
  citationCoverage: number;
  faithfulnessProxy: number;
  latencyMs: number;
  tokenUsage: { status: "unavailable"; reason: string };
};

type RagAnswer = {
  answer: string;
  sources: string[];
  matches: RagMatch[];
};

type RagAnswerer = {
  answer(profileId: string, query: string, documents: RagDocument[]): Promise<RagAnswer>;
};

function validateCases(cases: RagEvaluationCase[]): void {
  if (!Array.isArray(cases) || cases.length === 0 || cases.length > 20) {
    throw new Error("评测问答集不能为空且最多包含 20 条");
  }
  for (const item of cases) {
    if (!item || typeof item.query !== "string" || !item.query.trim() || !Array.isArray(item.expectedSources) || item.expectedSources.length === 0 || item.expectedSources.some((source) => typeof source !== "string" || !source.trim())) {
      throw new Error("评测问答项必须包含问题和至少一个期望来源");
    }
  }
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}

export async function evaluateRag(
  answerer: RagAnswerer,
  profileId: string,
  cases: RagEvaluationCase[],
  documents: RagDocument[],
): Promise<RagEvaluationResult> {
  validateCases(cases);
  const started = performance.now();
  const caseResults: RagEvaluationCaseResult[] = [];
  for (const item of cases) {
    const caseStarted = performance.now();
    const response = await answerer.answer(profileId, item.query, documents);
    const expected = [...new Set(item.expectedSources)];
    const rankedSources = response.matches.map(({ source }) => source);
    const matched = expected.filter((source) => rankedSources.includes(source));
    const firstRank = rankedSources.findIndex((source) => expected.includes(source));
    const cited = expected.filter((source) => response.sources.includes(source));
    caseResults.push({
      query: item.query,
      expectedSources: expected,
      answer: response.answer,
      matches: response.matches,
      sources: response.sources,
      recallAtK: ratio(matched.length, expected.length),
      reciprocalRank: firstRank < 0 ? 0 : 1 / (firstRank + 1),
      citationCoverage: ratio(cited.length, expected.length),
      faithfulnessProxy: cited.length === expected.length && expected.every((source) => response.answer.includes(source)) ? 1 : 0,
      latencyMs: performance.now() - caseStarted,
    });
  }
  return {
    caseResults,
    recallAtK: caseResults.reduce((sum, item) => sum + item.recallAtK, 0) / caseResults.length,
    mrr: caseResults.reduce((sum, item) => sum + item.reciprocalRank, 0) / caseResults.length,
    citationCoverage: caseResults.reduce((sum, item) => sum + item.citationCoverage, 0) / caseResults.length,
    faithfulnessProxy: caseResults.reduce((sum, item) => sum + item.faithfulnessProxy, 0) / caseResults.length,
    latencyMs: performance.now() - started,
    tokenUsage: { status: "unavailable", reason: "当前 OpenAI-compatible 模型响应未提供 token usage；未估算成本。" },
  };
}
