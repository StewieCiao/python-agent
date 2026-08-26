import test from "node:test";
import assert from "node:assert/strict";
import { createKeychain } from "../local-service/keychain.mjs";

test("钥匙串写入失败只返回边界错误，不泄漏 API Key 或尝试其他存储", async () => {
  const secret = "sk-never-show-this";
  let calls = 0;
  const keychain = createKeychain(async () => {
    calls += 1;
    const error = new Error(`security command failed for ${secret}`);
    error.code = 44;
    error.stderr = `Keychain denied ${secret}`;
    throw error;
  });

  await assert.rejects(
    keychain.set("profile-a", secret),
    (error) => {
      assert.equal(error.name, "KeychainError");
      assert.equal(error.operation, "写入");
      assert.equal(error.exitCode, 44);
      assert.doesNotMatch(error.message, /sk-never-show-this/);
      return true;
    },
  );
  assert.equal(calls, 1, "失败后不得调用第二条存储路径");
});

test("钥匙串读取只去掉命令末尾换行，空结果视为未配置", async () => {
  const values = [
    { stdout: "sk-value-with spaces  \n", stderr: "" },
    { stdout: "\n", stderr: "" },
    Object.assign(new Error("not found"), { code: 44 }),
  ];
  const keychain = createKeychain(async () => {
    const value = values.shift();
    if (value instanceof Error) throw value;
    return value;
  });

  assert.equal(await keychain.get("profile-a"), "sk-value-with spaces  ");
  assert.equal(await keychain.get("profile-b"), null);
  assert.equal(await keychain.get("profile-c"), null);
});
