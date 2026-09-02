import { parseStoredProgress } from "./storageState.mjs";
import type { ValidatedProgress as StoredProgress } from "./storageState.mjs";

export type LearningExportV1 = {
  schema: "stewie-learning-export-v1";
  exportedAt: string;
  learning: StoredProgress;
  chats: Array<{
    courseId: string;
    lessonId: string;
    messages: Array<{ role: "user" | "assistant"; content: string; createdAt: string }>;
  }>;
};

export function serializeLearningExport(document: LearningExportV1): string {
  return `${JSON.stringify(document)}\n`;
}

export function parseLearningExport(raw: string, lessonIds: readonly string[]): LearningExportV1 {
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch (error) {
    throw new Error(`学习导入文件不是有效 JSON：${error instanceof Error ? error.message : String(error)}`);
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("学习导入文件结构无效");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== 4 || record.schema !== "stewie-learning-export-v1" || typeof record.exportedAt !== "string" || !Array.isArray(record.chats)) {
    throw new Error("学习导入文件版本或字段无效");
  }
  const learning = parseStoredProgress(JSON.stringify(record.learning), lessonIds);
  const chats = record.chats.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new Error("学习导入聊天结构无效");
    const chat = item as Record<string, unknown>;
    if (Object.keys(chat).length !== 3 || typeof chat.courseId !== "string" || !chat.courseId || typeof chat.lessonId !== "string" || !chat.lessonId || !Array.isArray(chat.messages)) throw new Error("学习导入聊天字段无效");
    const messages = chat.messages.map((message) => {
      if (!message || typeof message !== "object" || Array.isArray(message)) throw new Error("学习导入消息字段无效");
      const entry = message as Record<string, unknown>;
      if (Object.keys(entry).length !== 3 || (entry.role !== "user" && entry.role !== "assistant") || typeof entry.content !== "string" || !entry.content || typeof entry.createdAt !== "string" || !entry.createdAt) throw new Error("学习导入消息字段无效");
      return { role: entry.role, content: entry.content, createdAt: entry.createdAt } as LearningExportV1["chats"][number]["messages"][number];
    });
    return { courseId: chat.courseId, lessonId: chat.lessonId, messages };
  });
  return { schema: "stewie-learning-export-v1", exportedAt: record.exportedAt, learning, chats };
}
