export function pythonWorkerUrl(): string {
  return new URL("python-worker.js", document.baseURI).toString();
}
