const STORAGE_KEY = "stewie.learner-id";

export function seedFromLearnerId(identity: string): number {
  if (!identity) throw new Error("学习者标识不能为空");
  let hash = 2166136261;
  for (const character of identity) {
    hash ^= character.codePointAt(0)!;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function loadLearnerSeed(storage: Pick<Storage, "getItem" | "setItem">, createId = () => crypto.randomUUID()): number {
  const existing = storage.getItem(STORAGE_KEY);
  const identity = existing || createId();
  if (!existing) storage.setItem(STORAGE_KEY, identity);
  return seedFromLearnerId(identity);
}
