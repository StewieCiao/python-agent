export function ragDocumentsForInput(input) {
  if (input.mode === "files") return input.documents;
  return input.text.trim() ? [{ id: "local-1", text: input.text, source: input.source }] : [];
}

export function replaceRagInput(state, input) {
  return { ...state, input, result: null, evaluation: null };
}
