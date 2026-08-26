import { createServer } from "node:http";
import { homedir } from "node:os";
import { join } from "node:path";
import { createKeychain } from "./keychain.mjs";
import { createLocalService } from "./server.mjs";

const host = "127.0.0.1";
const port = 4318;
const storageDirectory = join(homedir(), "Library", "Application Support", "Stewie Learning Site");
const server = createServer(createLocalService({
  storageDirectory,
  keychain: createKeychain(),
}));

server.listen(port, host, () => {
  console.log(`Stewie 本地模型服务已启动：http://${host}:${port}`);
  console.log(`非敏感配置目录：${storageDirectory}`);
});
