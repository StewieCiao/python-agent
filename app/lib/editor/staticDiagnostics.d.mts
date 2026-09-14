export type StaticDiagnostic = {
  source: "static";
  severity: "warning";
  line: number;
  column: number;
  reason: string;
  nextStep: string;
};
export function staticDiagnostics(source: string): StaticDiagnostic[];
