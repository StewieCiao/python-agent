export type ExerciseDifficulty = "beginner" | "intermediate" | "advanced";

export type ExerciseFamily = {
  id: string;
  lessonIds: string[];
  difficulty: ExerciseDifficulty;
  validatorVersion: string;
  mistakeCodes: string[];
  constraints: string[];
};
