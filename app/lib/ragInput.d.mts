import type { answerWithRag, evaluateRag } from "./platformBridge";

export type RagInput = {
  mode: "text" | "files";
  text: string;
  source: string;
  documents: Array<{ id: string; text: string; source: string }>;
};
export type RagWorkspace = {
  input: RagInput;
  result: Awaited<ReturnType<typeof answerWithRag>> | null;
  evaluation: Awaited<ReturnType<typeof evaluateRag>> | null;
};
export function ragDocumentsForInput(input: RagInput): RagInput["documents"];
export function replaceRagInput(state: RagWorkspace, input: RagInput): RagWorkspace;
