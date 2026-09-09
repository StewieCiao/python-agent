import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("desktop worker resolves Pyodide assets relative to its custom-protocol URL", async () => {
  const source = await readFile(new URL("../public/python-worker.js", import.meta.url), "utf8");

  assert.match(source, /import \{ loadPyodide \} from "\.\/pyodide\/pyodide\.mjs"/);
  assert.match(source, /new URL\("pyodide\/", self\.location\.href\)/);
});

test("Windows packaged smoke allows the verified slower WASM startup window", async () => {
  const source = await readFile(new URL("../scripts/smoke-packaged-renderer.mjs", import.meta.url), "utf8");

  assert.match(source, /process\.platform === "win32" \? 180_000 : 60_000/);
});
