import assert from "node:assert/strict";
import { test } from "node:test";
import { createModelClient, ModelRequestError } from "../desktop/src/modelClient.mts";
import { createModelProfileService } from "../desktop/src/modelProfileService.mts";

const PROFILE = {
  id: "primary",
  name: "Primary",
  baseUrl: "https://api.example.com/v1",
  model: "model-1",
  embeddingModel: "embedding-1",
  temperature: 0.2,
  maxTokens: 2048,
  timeoutMs: 30000,
};

function storedProfile(overrides = {}) {
  return {
    ...PROFILE,
    origin: "https://api.example.com",
    active: true,
    apiKeyCiphertext: Buffer.from("ciphertext").toString("base64"),
    ...overrides,
  };
}

test("safeStorage 保存 Key 后只把密文交给 Python，renderer 只得到脱敏配置", async () => {
  const calls = [];
  const store = {
    async request(method, params) {
      calls.push({ method, params });
      if (method === "profile.upsert") {
        return storedProfile({
          ...params.profile,
          active: params.makeActive,
          apiKeyCiphertext: params.apiKeyCiphertext,
        });
      }
      throw new Error(`unexpected ${method}`);
    },
  };
  const safeStorage = {
    isAsyncEncryptionAvailable: async () => true,
    getSelectedStorageBackend: () => "unknown",
    encryptStringAsync: async (value) => {
      assert.deepEqual(JSON.parse(value), {
        version: 1,
        origin: "https://api.example.com",
        apiKey: "sk-desktop-secret",
      });
      return Buffer.from("ciphertext");
    },
    decryptStringAsync: async () => ({
      result: JSON.stringify({
        version: 1,
        origin: "https://api.example.com",
        apiKey: "sk-desktop-secret",
      }),
      shouldReEncrypt: false,
    }),
  };
  const service = createModelProfileService({ store, safeStorage, platform: "darwin" });

  const saved = await service.save({
    profile: PROFILE,
    apiKey: "sk-desktop-secret",
    makeActive: true,
  });

  assert.equal(saved.hasApiKey, true);
  assert.equal("apiKey" in saved, false);
  assert.equal("apiKeyCiphertext" in saved, false);
  assert.equal(JSON.stringify(calls).includes("sk-desktop-secret"), false);
  assert.equal(calls[0].params.apiKeyCiphertext, Buffer.from("ciphertext").toString("base64"));
});

test("解密后的 API Key 必须与当前 provider origin 一致", async () => {
  const service = createModelProfileService({
    store: { request: async () => storedProfile() },
    safeStorage: {
      isAsyncEncryptionAvailable: async () => true,
      getSelectedStorageBackend: () => "unknown",
      encryptStringAsync: async () => Buffer.alloc(0),
      decryptStringAsync: async () => ({
        result: JSON.stringify({
          version: 1,
          origin: "https://attacker.example.com",
          apiKey: "sk-secret",
        }),
        shouldReEncrypt: false,
      }),
    },
    platform: "darwin",
  });

  await assert.rejects(service.getProfileForRequest("primary"), /服务地址不一致/);
});

test("系统加密不可用时明确拒绝，不写入 Python 或其他存储", async () => {
  let storeCalls = 0;
  const service = createModelProfileService({
    store: { request: async () => { storeCalls += 1; } },
    safeStorage: {
      isAsyncEncryptionAvailable: async () => false,
      getSelectedStorageBackend: () => "unknown",
      encryptStringAsync: async () => Buffer.alloc(0),
      decryptStringAsync: async () => ({ result: "", shouldReEncrypt: false }),
    },
    platform: "darwin",
  });

  await assert.rejects(
    service.save({ profile: PROFILE, apiKey: "sk-secret", makeActive: true }),
    /系统安全存储不可用/,
  );
  assert.equal(storeCalls, 0);
});

test("模型请求由 main 添加 Authorization、禁止跳转且不自动重试", async () => {
  let calls = 0;
  const credentials = { profile: storedProfile(), apiKey: "sk-secret" };
  const client = createModelClient({
    getProfileForRequest: async () => credentials,
    fetchImpl: async (url, init) => {
      calls += 1;
      assert.equal(url, "https://api.example.com/v1/chat/completions");
      assert.equal(init.redirect, "error");
      assert.equal(init.headers.Authorization, "Bearer sk-secret");
      assert.ok(init.signal instanceof AbortSignal);
      return new Response(JSON.stringify({
        choices: [{ message: { role: "assistant", content: "真实回答 sk-secret" } }],
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    },
  });

  const reply = await client.chat("primary", [{ role: "user", content: "你好" }]);
  assert.equal(reply, "真实回答 [REDACTED]");
  assert.equal(calls, 1);
  assert.equal(credentials.apiKey, "");
});

test("上游状态和原因会透传但 Key/Authorization 必须脱敏", async () => {
  let calls = 0;
  const credentials = { profile: storedProfile(), apiKey: "sk-secret" };
  const client = createModelClient({
    getProfileForRequest: async () => credentials,
    fetchImpl: async () => {
      calls += 1;
      return new Response(JSON.stringify({
        error: { message: "Authorization: Bearer sk-secret quota exceeded sk-secret" },
      }), { status: 429, headers: { "Content-Type": "application/json" } });
    },
  });

  await assert.rejects(
    client.chat("primary", [{ role: "user", content: "你好" }]),
    (error) => {
      assert.ok(error instanceof ModelRequestError);
      assert.equal(error.status, 429);
      assert.match(error.message, /quota exceeded/);
      assert.doesNotMatch(error.message, /sk-secret|Bearer/);
      return true;
    },
  );
  assert.equal(calls, 1);
  assert.equal(credentials.apiKey, "");
});

test("无效聊天输入在解密 API Key 前拒绝", async () => {
  let decryptCalls = 0;
  const client = createModelClient({
    getProfileForRequest: async () => {
      decryptCalls += 1;
      return { profile: storedProfile(), apiKey: "sk-secret" };
    },
  });

  await assert.rejects(client.chat("primary", []), /1–100 条/);
  assert.equal(decryptCalls, 0);
});
