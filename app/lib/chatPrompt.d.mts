export type ChatHistoryMessage = { role: "user" | "assistant"; content: string };

export function buildChatMessages(input: {
  mode: "lesson" | "general";
  lessonContext?: unknown;
  history: ChatHistoryMessage[];
  message: string;
}): Array<{ role: "system" | "user" | "assistant"; content: string }>;

export function buildTutorMessages(input: {
  courseId: string;
  lessonId: string;
  lessonContext: unknown;
  history: ChatHistoryMessage[];
  message: string;
  citationSource: string;
}): Array<{ role: "system" | "user" | "assistant"; content: string }>;

export function parseTutorReply(raw: string): { answer: string; citations: Array<{ source: string }> };
