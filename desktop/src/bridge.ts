import type { PythonHealth } from "./pythonService.mjs";
import type { ModelProfileInput, PublicModelProfile } from "../../app/lib/modelConfig.ts";
import type { ModelMessage } from "./modelClient.mjs";
import type { RagDocument, RagMatch } from "./ragService.mjs";
import type { LegacyConversation, MasteryEvent, MasteryResult, PersonalizedExerciseResult, PythonChatMessage, PythonLearningState } from "./pythonService.mjs";

export type DesktopAppInfo = {
  name: string;
  version: string;
  platform: string;
  architecture: string;
  python: PythonHealth | null;
  storagePath: string;
};

export type DesktopIpcError = {
  code: string;
  message: string;
  status: number | null;
};

export type DesktopIpcResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: DesktopIpcError };

export type SaveModelProfileInput = {
  profile: ModelProfileInput;
  apiKey?: string;
  makeActive: boolean;
};

export type StewieDesktopBridge = {
  appInfo(): Promise<DesktopAppInfo>;
  listModelProfiles(): Promise<DesktopIpcResult<PublicModelProfile[]>>;
  saveModelProfile(input: SaveModelProfileInput): Promise<DesktopIpcResult<PublicModelProfile>>;
  activateModelProfile(profileId: string): Promise<DesktopIpcResult<PublicModelProfile>>;
  deleteModelProfile(profileId: string): Promise<DesktopIpcResult<{ deleted: true }>>;
  testModelProfile(profileId: string): Promise<DesktopIpcResult<{ reply: string }>>;
  chatWithModel(input: { profileId: string; messages: ModelMessage[] }): Promise<DesktopIpcResult<{ reply: string }>>;
  answerWithRag(input: { profileId: string; query: string; documents: RagDocument[] }): Promise<DesktopIpcResult<{ answer: string; sources: string[]; matches: RagMatch[] }>>;
  selectRagDocuments(): Promise<DesktopIpcResult<RagDocument[]>>;
  getLearningState(): Promise<DesktopIpcResult<PythonLearningState>>;
  saveLearningState(state: PythonLearningState): Promise<DesktopIpcResult<PythonLearningState>>;
  recordMasteryAttempt(event: MasteryEvent): Promise<DesktopIpcResult<{ recorded: true }>>;
  getMastery(now: string): Promise<DesktopIpcResult<MasteryResult>>;
  getPersonalizedExercise(lessonId: string, seed: number): Promise<DesktopIpcResult<PersonalizedExerciseResult>>;
  importLegacyLearningState(state: PythonLearningState, rawSource: string): Promise<DesktopIpcResult<{
    imported: boolean;
    state: PythonLearningState;
  }>>;
  listChatMessages(courseId: string, lessonId: string): Promise<DesktopIpcResult<PythonChatMessage[]>>;
  appendChatMessages(courseId: string, lessonId: string, messages: readonly PythonChatMessage[]): Promise<DesktopIpcResult<PythonChatMessage[]>>;
  clearChatMessages(courseId: string, lessonId: string): Promise<DesktopIpcResult<{ cleared: true }>>;
  importLegacyDesktopData(input: { sourceKind: "model-profiles" | "chat-history"; sourceHash: string; profiles: unknown[] | null; conversations: LegacyConversation[] | null }): Promise<DesktopIpcResult<{ imported: boolean }>>;
  recordLegacyDesktopFailure(input: { sourceKind: "model-profiles" | "chat-history"; sourceHash: string; errorMessage: string }): Promise<DesktopIpcResult<{ recorded: true }>>;
  exportLearningData(): Promise<DesktopIpcResult<{ status: "cancelled" } | { status: "saved"; path: string }>>;
  importLearningData(): Promise<DesktopIpcResult<{ status: "cancelled" } | { status: "imported"; counts: Record<string, number> }>>;
  onBeforeClose(callback: () => void): () => void;
  confirmClose(): Promise<DesktopIpcResult<{ closed: true }>>;
};

declare global {
  interface Window {
    stewie: StewieDesktopBridge;
  }
}
