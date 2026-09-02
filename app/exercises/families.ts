import type { ExerciseFamily } from "./schema.ts";

export const exerciseFamilies: ExerciseFamily[] = [
  { id: "python-output-v1", lessonIds: ["first-output"], difficulty: "beginner", validatorVersion: "1", mistakeCodes: ["wrong-line", "missing-expression"], constraints: ["two output lines", "second print contains multiplication"] },
  { id: "python-loops-v1", lessonIds: ["loops"], difficulty: "beginner", validatorVersion: "1", mistakeCodes: ["missing-loop", "wrong-boundary"], constraints: ["sum even values", "one loop in target function"] },
  { id: "python-lists-v1", lessonIds: ["lists"], difficulty: "beginner", validatorVersion: "1", mistakeCodes: ["wrong-filter", "wrong-cap"], constraints: ["return a transformed list", "preserve input order"] },
  { id: "python-dictionaries-v1", lessonIds: ["dictionaries"], difficulty: "beginner", validatorVersion: "1", mistakeCodes: ["hard-coded-key", "wrong-count"], constraints: ["count every input key", "support unseen keys"] },
  { id: "python-exceptions-v1", lessonIds: ["exceptions"], difficulty: "intermediate", validatorVersion: "1", mistakeCodes: ["wrong-handler", "swallowed-type-error"], constraints: ["catch ValueError only", "let TypeError escape"] },
  { id: "python-decorators-v1", lessonIds: ["decorators"], difficulty: "advanced", validatorVersion: "1", mistakeCodes: ["lost-kwargs", "wrong-call-count"], constraints: ["preserve positional and keyword arguments", "call wrapped function twice"] },
  { id: "python-expense-v1", lessonIds: ["project-expense"], difficulty: "intermediate", validatorVersion: "1", mistakeCodes: ["hard-coded-category", "extra-traversal"], constraints: ["aggregate arbitrary categories", "one loop in summarize"] },
];

const familyIds = new Set<string>();
const lessonIds = new Set<string>();
for (const family of exerciseFamilies) {
  if (familyIds.has(family.id)) throw new Error(`重复练习 family ${family.id}`);
  familyIds.add(family.id);
  if (family.lessonIds.length !== 1) throw new Error(`练习 family 必须绑定一关 ${family.id}`);
  for (const lessonId of family.lessonIds) {
    if (lessonIds.has(lessonId)) throw new Error(`练习 family 重复绑定 ${lessonId}`);
    lessonIds.add(lessonId);
  }
  if (family.constraints.length === 0 || family.mistakeCodes.length === 0) {
    throw new Error(`练习 family 缺少约束或错误模式 ${family.id}`);
  }
}
