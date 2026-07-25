import type { PromptException, PromptTestResult } from "./gptPrompt.mjs";

export type ValidatedMistake = {
  id: string;
  lessonId: string;
  createdAt: string;
  code: string;
  output: string;
  stderr: string;
  exception: PromptException | null;
  tests: PromptTestResult[];
};

export type ValidatedProgress = {
  completed: string[];
  drafts: Record<string, string>;
  mistakes: ValidatedMistake[];
};

export function parseStoredProgress(
  raw: string,
  lessonIds: readonly string[],
): ValidatedProgress;
