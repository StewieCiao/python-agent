import type { PromptException } from "../gptPrompt.mjs";

export type RuntimeDiagnostic = PromptException & {
  source: "runtime";
  severity: "error";
  reason: string;
  nextStep: string;
};

export function runtimeDiagnostic(exception: PromptException): RuntimeDiagnostic;
export function runtimeDiagnostic(exception: null): null;
export function runtimeDiagnostic(exception: PromptException | null): RuntimeDiagnostic | null;
