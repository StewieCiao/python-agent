import { mkdir, copyFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(fileURLToPath(import.meta.url));
const sourcePath = join(projectRoot, "..", "Stewie-个人学习站-离线版.html");
const outputDirectory = join(projectRoot, "..", "dist-pages");
const outputPath = join(outputDirectory, "index.html");

await mkdir(outputDirectory, { recursive: true });
await copyFile(sourcePath, outputPath);
console.log(`已生成静态发布入口：${outputPath}`);
