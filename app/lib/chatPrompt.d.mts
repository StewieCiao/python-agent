export type ChatHistoryMessage = { role: "user" | "assistant"; content: string };

export function buildChatMessages(input: {
  mode: "lesson" | "general";
  lessonContext?: unknown;
  history: ChatHistoryMessage[];
  message: string;
}): Array<{ role: "system" | "user" | "assistant"; content: string }>;
