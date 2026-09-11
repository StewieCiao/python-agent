import assert from "node:assert/strict";
import { readFile, mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";

test("desktop worker resolves Pyodide assets relative to its custom-protocol URL", async () => {
  const source = await readFile(new URL("../public/python-worker.js", import.meta.url), "utf8");

  assert.match(source, /new URL\("pyodide\/", self\.location\.href\)/);
});

test("missing runtime module reports initialization failure instead of killing the worker", async () => {
  const directory = await mkdtemp(join(tmpdir(), "stewie-worker-import-"));
  const workerUrl = pathToFileURL(join(directory, "worker.mjs"));
  const messages = [];
  let onMessage;
  globalThis.self = {
    location: { href: workerUrl.href },
    addEventListener(_type, listener) { onMessage = listener; },
    postMessage(message) { messages.push(message); },
  };
  try {
    await writeFile(workerUrl, await readFile(new URL("../public/python-worker.js", import.meta.url)));
    await assert.doesNotReject(import(workerUrl.href));
    await onMessage({ data: { type: "initialize" } });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].type, "initialization-error");
    assert.match(messages[0].message, /Cannot find module/);
    assert.match(messages[0].message, /pyodide\.mjs/);
  } finally {
    delete globalThis.self;
    await rm(directory, { recursive: true });
  }
});
