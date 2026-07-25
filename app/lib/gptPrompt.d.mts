export type PromptTestResult = {
  name: string;
  passed: boolean;
  detail: string;
  expected?: string;
  actual?: string;
  rule?: string;
};

export type PromptException = {
  type: string;
  message: string;
  traceback: string;
  line: number | null;
};

export type GptHelpPromptInput = {
  lessonTitle: string;
  goal: string;
  requirements: readonly string[];
  code: string;
  output: string;
  executionFailure: { type: string; message: string } | null;
  exception: PromptException | null;
  tests: PromptTestResult[];
  attemptedHints: readonly string[];
};

export function buildGptHelpPrompt(input: GptHelpPromptInput): string;

export const promptDataHeader: "PY_PATH_ANALYSIS_DATA_JSON_V2";
