export function createRunSnapshot({ token, lesson, code, attemptedHints }) {
  return Object.freeze({
    token,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    goal: lesson.goal,
    requirements: Object.freeze([...lesson.requirements]),
    code,
    attemptedHints: Object.freeze([...attemptedHints]),
  });
}

export function snapshotMatches(snapshot, lessonId, code) {
  return snapshot.lessonId === lessonId && snapshot.code === code;
}
