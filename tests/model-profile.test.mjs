import test from "node:test";
import assert from "node:assert/strict";
import {
  redactProfile,
  validateProfile,
  redactSecrets,
} from "../app/lib/modelConfig.ts";

const validProfile = {
  id: "qwen-local",
  name: "通义兼容服务",
  baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1/",
  model: "qwen-plus",
  temperature: 0.3,
  maxTokens: 2048,
  timeoutMs: 30000,
  embeddingModel: "text-embedding-v4",
};

test("模型配置规范化 URL，并只向前端暴露非敏感字段", () => {
  const profile = validateProfile(validProfile);
  assert.equal(profile.baseUrl, "https://dashscope.aliyuncs.com/compatible-mode/v1");
  assert.equal(profile.origin, "https://dashscope.aliyuncs.com");
  assert.deepEqual(redactProfile(profile, true), {
    id: profile.id,
    name: profile.name,
    baseUrl: profile.baseUrl,
    model: profile.model,
    embeddingModel: profile.embeddingModel,
    temperature: profile.temperature,
    maxTokens: profile.maxTokens,
    timeoutMs: profile.timeoutMs,
    active: false,
    hasApiKey: true,
  });
  assert.equal("apiKey" in redactProfile(profile, true), false);
});

test("可选 embedding model 归一为空值，错误文本会统一脱敏", () => {
  const profile = validateProfile({ ...validProfile, embeddingModel: "  " });
  assert.equal(profile.embeddingModel, null);
  assert.equal(
    redactSecrets("Authorization: Bearer sk-secret；上游回显 sk-secret", ["sk-secret"]),
    "Authorization: [REDACTED]；上游回显 [REDACTED]",
  );
});

test("模型配置以一组边界拒绝不安全 URL 和无效参数", () => {
  const cases = [
    ["非法 URL", { baseUrl: "not-a-url" }, /baseUrl 不是有效 URL/],
    ["云端 HTTP", { baseUrl: "http://api.example.com/v1" }, /云端地址必须使用 HTTPS/],
    ["URL 凭据", { baseUrl: "https://user:pass@example.com/v1" }, /不能包含用户名或密码/],
    ["URL 查询", { baseUrl: "https://example.com/v1?token=x" }, /不能包含查询参数或片段/],
    ["空模型", { model: " " }, /model 不能为空/],
    ["过高温度", { temperature: 2.1 }, /temperature 必须在 0 到 2 之间/],
    ["无效 token", { maxTokens: 0 }, /maxTokens 必须是 1 到 200000 的整数/],
    ["过短超时", { timeoutMs: 999 }, /timeoutMs 必须是 1000 到 120000 的整数/],
    ["额外字段", { headers: { Authorization: "secret" } }, /未知配置字段 headers/],
  ];

  for (const [name, change, expected] of cases) {
    assert.throws(
      () => validateProfile({ ...validProfile, ...change }),
      expected,
      name,
    );
  }
});

test("本机 OpenAI-compatible HTTP 地址可用，但必须是明确回环主机", () => {
  for (const baseUrl of [
    "http://localhost:11434/v1",
    "http://127.0.0.1:11434/v1",
    "http://[::1]:11434/v1",
  ]) {
    assert.equal(validateProfile({ ...validProfile, baseUrl }).baseUrl, baseUrl);
  }
});
