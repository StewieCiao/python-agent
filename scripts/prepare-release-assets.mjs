import { copyFile, mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const [artifacts, output, version, offline, pages] = process.argv.slice(2);
if (process.argv.length !== 7 || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error("Usage: prepare-release-assets <artifacts> <new-output-directory> <version> <offline.html> <pages.tar.gz>");
}

async function installersIn(directory, filename) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await installersIn(path, filename));
    else if (entry.isFile() && entry.name === filename) found.push(path);
  }
  return found;
}

const files = [];
for (const target of ["macos-arm64", "macos-x64", "windows-arm64", "windows-x64"]) {
  const mac = target.startsWith("macos");
  const matches = await installersIn(join(artifacts, `stewie-learnos-${target}`), mac ? "Stewie-LearnOS.dmg" : "Stewie-LearnOS-Setup.exe");
  if (matches.length !== 1) throw new Error(`${target}: expected exactly one installer, found ${matches.length}`);
  files.push({ source: matches[0], name: `stewie-learnos-${version}-${target}${mac ? ".dmg" : "-setup.exe"}` });
}
files.push(
  { source: offline, name: `stewie-learnos-${version}-offline.html` },
  { source: pages, name: `stewie-learnos-${version}-pages.tar.gz` },
);
for (const { source } of files) {
  const info = await stat(source);
  if (!info.isFile() || info.size === 0) throw new Error(`Release asset is not a nonempty file: ${source}`);
}

// A new destination prevents stale assets/checksums from entering a release.
await mkdir(output);
const checksums = [];
for (const { source, name } of files.sort((a, b) => a.name.localeCompare(b.name, "en"))) {
  const destination = join(output, name);
  await copyFile(source, destination);
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(destination)) hash.update(chunk);
  checksums.push(`${hash.digest("hex")}  ${name}`);
}
await writeFile(join(output, "SHA256SUMS.txt"), `${checksums.join("\n")}\n`, { flag: "wx" });
console.log(`Prepared ${files.length} release assets for ${version}`);
