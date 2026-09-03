export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export type PersonalizedCheck = {
  name: string;
  expression: string;
  failure: string;
  kind: "behavior" | "structure";
};

export type ExerciseVariant = {
  label: string;
  values: string;
  checks: PersonalizedCheck[];
};

export type ExerciseFamily = {
  id: string;
  lessonIds: string[];
  difficulty: ExerciseDifficulty;
  validatorVersion: string;
  mistakeCodes: string[];
  constraints: string[];
  variants: ExerciseVariant[];
};
