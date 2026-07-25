import type { Lesson } from "./curriculum";

export type RunSnapshot = Readonly<{
  token: string;
  lessonId: string;
  lessonTitle: string;
  goal: string;
  requirements: readonly string[];
  code: string;
  attemptedHints: readonly string[];
}>;

export function createRunSnapshot(input: {
  token: string;
  lesson: Lesson;
  code: string;
  attemptedHints: string[];
}): RunSnapshot;

export function snapshotMatches(
  snapshot: RunSnapshot,
  lessonId: string,
  code: string,
): boolean;
