# Stewie LearnOS Luna Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Use `superpowers:test-driven-development` for every behavior change, `superpowers:requesting-code-review` before each commit, and `superpowers:verification-before-completion` before reporting success. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue the existing Stewie LearnOS work from a verified zero-deployment desktop foundation to persistent learning state, a reviewed three-track curriculum, trusted personalized practice, local hybrid RAG, an adaptive LangGraph tutor, and signed release-ready artifacts.

**Architecture:** Keep one static React learning application shared by browser development, offline HTML, and Electron. Electron main owns all model HTTP and OS secret operations; one bundled trusted Python service exclusively owns SQLite, RAG, mastery, and tutor state. Basic Python remains in a Pyodide Web Worker until the isolated bundled-Python runner is introduced; untrusted learner code never runs inside the trusted service.

**Tech Stack:** React 19, TypeScript, Electron 44 + Forge/Vite, async Electron `safeStorage`, Python 3.13.15 standalone, SQLite/FTS5, Pyodide 314.0.3, LangChain 1.2.12, LangGraph 1.1.2, Node test runner, Python `unittest`.

**Spec:** `docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md`

**Authoritative full plan:** `docs/superpowers/plans/2026-08-31-stewie-learnos-desktop.md`

## Global Constraints

- Work only in `/Users/ciao/Documents/Python学习/.worktrees/stewie-learning-site` on branch `codex/stewie-learning-site` unless the user explicitly changes the target.
- Start from a clean descendant of feature baseline `17d0ff8` that also contains this handoff document. Do not redo completed Tasks 1–4.
- Do not use Figma. Keep the current visual language and improve it directly in React/CSS.
- Keep the final application zero-deployment: users must not install Node, Python, Docker, packages, or run a server.
- Keep one OpenAI-compatible model protocol. Do not create provider factories, adapters, compatibility layers, or automatic retry frameworks.
- Never fall back from `safeStorage` to localStorage, environment variables, a plaintext file, Python, or direct renderer HTTP.
- Never fall back from Electron desktop IPC to the legacy browser HTTP model service. Desktop bridge absence must remain an explicit error.
- Keep API Key plaintext only briefly in the password input and Electron main during one save-encryption operation, and during each outbound request construction/use. It must never enter renderer state, SQLite plaintext, logs, exports, prompts, Python messages, or learner environments.
- Keep automatic retries at zero for chat, connection tests, embeddings, writes, and learner runs. Use one explicit timeout and show the real failure.
- Every `catch` must protect a real external/parsing boundary and preserve a useful reason. No module-wide catch returning a default object or fake success.
- Do not add a helper until at least two real callers need the same logic. Do not add a future protocol before its first real caller.
- Complete/full desktop and offline HTML must consume the same course source. Do not maintain parallel lesson or migration-card lists.
- Judge behavior first. Use scoped AST only when a lesson explicitly requires a Python construct. Never grade with source/comment substring matching.
- Add only high-value behavior tests. Do not test private helper names, CSS class names, snapshots of whole pages, or third-party internals.
- Preserve the legacy Node local service until desktop progress/chat migration, course/code execution, personalized practice, RAG, tutor, offline output, and clean-machine packaged verification all pass.
- Before every commit run `git diff --check`, focused tests, full lint/type/build appropriate to the stage, and a diff search for `catch`, `retry`, `default`, `fallback`, `localStorage`, `apiKey`, and logging.

---

## Current Verified Baseline

### Completed commits

1. `af49257 feat: add secure desktop shell`
2. `aa2b9e9 build: bundle cross-platform python service`
3. `f4941e2 feat: share learning app with desktop`
4. `17d0ff8 feat: secure desktop model profiles`

### Working features

- A packaged macOS ARM64 app starts without Node, system Python, or a local server.
- The shared responsive learning UI works in Electron and browser development.
- Pyodide runs in a Worker with real success, traceback, failed-test, four-second timeout, Worker restart, and stale-result protection.
- Python judging regressions reject comment/source-string tricks and accept equivalent valid implementations.
- The bundled Python service proves Python 3.13.15, SQLite transactions/FTS5, LangChain 1.2.12, LangGraph 1.1.2, checkpoint SQLite 2.0.6, and pypdf 6.16.2.
- Named OpenAI-compatible profiles are stored in SQLite; API Key ciphertext is bound to provider origin.
- Renderer model calls go through preload → trusted Electron main → one `ModelClient`; redirects are rejected, timeout is explicit, retries are zero, and success/error text is redacted.
- The password input is uncontrolled and cleared before the save IPC completes.
- Desktop bridge absence is explicit and cannot silently route to `127.0.0.1:4318`.
- The offline HTML remains network-free and excludes desktop/model service behavior.

### Verified commands at the baseline

```bash
npm test                              # 107 passing Node tests
npm run lint -- --max-warnings=0
npm run desktop:typecheck
desktop/.runtime/python/bin/python3.13 -m unittest discover -s python-runtime/tests -v  # 9 passing
npm run build:offline
npm run build
npm run desktop:package
npm run smoke:packaged-python
npm run smoke:packaged-renderer
```

### Current artifact and known limitation

- Developer artifact: `/Users/ciao/Desktop/Stewie LearnOS.app` (about 423 MB).
- The unsigned/ad-hoc local artifact can browse courses and run Python.
- This Mac has no Developer ID identity. Electron async `safeStorage` therefore fails on the real packaged app; the UI correctly shows the failure and leaves no partial profile. Do not weaken storage to make the local smoke green. Proper signing/notarization belongs to the release task.
- Current new production boundaries from Task 4: six justified catches, zero automatic retry points, one new SQLite persistence root.

### Incomplete state to preserve accurately

- Desktop Python learning progress still hydrates/saves through browser `localStorage`.
- Desktop course chat history is session-only; browser development still uses the legacy JSON history service.
- Model profiles are in the new SQLite database, but exact legacy JSON profile/history migration is not implemented.
- Trusted Python has no model caller yet. Add a schema-checked main gateway only when RAG/Tutor first needs it; do not prebuild an idle event protocol.
- Course counts/content depth, personalized exercise generation, local RAG, tutor graph, Windows artifacts, and production signing remain incomplete.

---

## Execution Order

Execute the following gates in order. Do not start the large course expansion before Gates 1–3 pass; otherwise curriculum, attempts, and offline output will diverge.

1. Persist and migrate learning/chat state in the single Python-owned SQLite database.
2. Establish one generated curriculum catalog and editorial evidence source.
3. Establish trusted exercise families and packaged validators.
4. Expand Python, LangChain/RAG, and LangGraph in small reviewed stage commits.
5. Add isolated bundled-Python execution, mastery, and verified personalization.
6. Add local hybrid RAG with citations and evaluation.
7. Add the adaptive LangGraph tutor.
8. Finish responsive UX, signing, Windows/macOS release verification, and cleanup.

---

### Task 1: Reconfirm the Baseline Before Editing

**Files:**
- Read: `docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md`
- Read: `docs/superpowers/plans/2026-08-31-stewie-learnos-desktop.md`
- Read: `app/lib/platformBridge.ts`, `desktop/src/main.ts`, `desktop/src/modelClient.mts`, `desktop/src/modelProfileService.mts`
- Read: `python-runtime/protocol.py`, `python-runtime/storage.py`, `app/components/LearningApp.tsx`, `app/components/CourseChat.tsx`

**Interfaces:**
- Consumes: commit `17d0ff8` and its existing tests.
- Produces: a clean verified base SHA recorded in the task notes; no code change.

- [ ] **Step 1: Confirm repository state**

```bash
git status --short
git branch --show-current
git log -1 --oneline
```

Expected: clean status, branch `codex/stewie-learning-site`, and a docs-only descendant of `17d0ff8` containing this plan.

Confirm the feature baseline is an ancestor:

```bash
git merge-base --is-ancestor 17d0ff8 HEAD
```

Expected: exit code 0.

- [ ] **Step 2: Run the baseline contract suite**

```bash
npm test
npm run lint -- --max-warnings=0
npm run desktop:typecheck
desktop/.runtime/python/bin/python3.13 -m unittest discover -s python-runtime/tests -v
```

Expected: 107 Node tests, 9 Python tests, zero lint warnings, and no TypeScript errors. If counts rise because another committed stage landed, require all tests to pass and record the new count.

- [ ] **Step 3: Record the base SHA**

```bash
git rev-parse HEAD
```

Use this SHA for the Gate 1 base→head review.

---

### Task 2: Add Transactional Learning and Chat Tables

**Files:**
- Create: `python-runtime/migrations/002-learning-state.sql`
- Modify: `python-runtime/storage.py`
- Test: `python-runtime/tests/test_storage.py`

**Interfaces:**
- Consumes: `Storage` and migration table from `001-model-profiles.sql`.
- Produces:
  - `Storage.get_learning_state() -> StoredProgress`
  - `Storage.save_learning_state(state) -> StoredProgress`
  - `Storage.import_legacy_learning_state(state, source_hash) -> {imported, state}`
  - `Storage.list_chat_messages(course_id, lesson_id) -> list[message]`
  - `Storage.append_chat_messages(course_id, lesson_id, messages) -> list[message]`
  - `Storage.clear_chat_messages(course_id, lesson_id) -> {cleared: True}`

- [ ] **Step 1: Write failing Python storage tests**

Add table-driven tests covering:

```python
def test_learning_state_round_trips_and_replaces_atomically(self): ...
def test_completed_order_round_trips_when_timestamps_are_equal(self): ...
def test_legacy_progress_import_is_idempotent_by_source_hash(self): ...
def test_chat_history_is_isolated_by_course_and_lesson(self): ...
def test_clear_chat_history_does_not_touch_other_lessons(self): ...
def test_invalid_learning_state_rolls_back_without_partial_rows(self): ...
```

Use this canonical DTO everywhere; do not add migration status to it or rename `output` to `stdout`:

```ts
type StoredProgress = {
  completed: string[];
  drafts: Record<string, string>;
  mistakes: Array<{
    id: string;
    lessonId: string;
    createdAt: string;
    code: string;
    output: string;
    stderr: string;
    exception: PromptException | null;
    tests: PromptTestResult[];
  }>;
};
```

Use one minimal valid mistake containing code, output, stderr, exception, tests, and ISO timestamp. Assert stored code and messages are exact, including quotes, slashes, newlines, and instruction-like text. Add `test_mistake_order_round_trips_when_timestamps_are_equal`; the mistakes array order must round-trip exactly even when timestamps match.

- [ ] **Step 2: Verify the new tests fail for missing methods**

```bash
desktop/.runtime/python/bin/python3.13 -m unittest python-runtime/tests/test_storage.py -v
```

Expected: failures naming missing learning/chat methods or migration tables.

- [ ] **Step 3: Create migration 002 in one transaction**

Create only these required tables:

```sql
BEGIN IMMEDIATE;

CREATE TABLE lesson_progress (
  lesson_id TEXT PRIMARY KEY,
  completed INTEGER NOT NULL CHECK (completed IN (0, 1)),
  position INTEGER NOT NULL UNIQUE,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lesson_drafts (
  lesson_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE mistakes (
  id TEXT PRIMARY KEY,
  position INTEGER NOT NULL UNIQUE,
  lesson_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  code TEXT NOT NULL,
  output TEXT NOT NULL,
  stderr TEXT NOT NULL,
  exception_json TEXT,
  tests_json TEXT NOT NULL
);

CREATE TABLE chat_threads (
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (course_id, lesson_id)
);

CREATE TABLE chat_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (course_id, lesson_id, sequence),
  FOREIGN KEY (course_id, lesson_id)
    REFERENCES chat_threads(course_id, lesson_id)
    ON DELETE CASCADE
);

CREATE TABLE migration_sources (
  source_kind TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('imported', 'failed')),
  error_message TEXT,
  recorded_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (source_kind, source_hash)
);

INSERT INTO schema_migrations(version) VALUES (2);
COMMIT;
```

Do not add mastery, RAG, tutor, or document tables in this migration.

- [ ] **Step 4: Implement strict state writes**

Use one outer `with self.connection:` transaction for a full state replacement. Validate the complete input before deleting existing rows. Persist the array index of both `completed` entries and mistakes in their respective `position` columns and read each with `ORDER BY position ASC`; do not derive order from ids or timestamps. Migration status lives only in `migration_sources`, not in `StoredProgress`. Do not partially repair malformed mistakes or tests; raise a specific `ValueError` and keep the previous state unchanged.

- [ ] **Step 5: Implement chat isolation**

Append messages by calculating the next sequence inside the same transaction. Require non-empty course/lesson ids, valid role, non-empty content, and an ISO timestamp. Do not synthesize an assistant reply or timestamp after validation fails.

- [ ] **Step 6: Run focused tests**

```bash
desktop/.runtime/python/bin/python3.13 -m unittest python-runtime/tests/test_storage.py -v
```

Expected: all storage tests pass.

- [ ] **Step 7: Review and commit the storage unit**

```bash
git diff --check
git add python-runtime/migrations/002-learning-state.sql python-runtime/storage.py python-runtime/tests/test_storage.py
git commit -m "feat: store learning and chat state"
```

---

### Task 3: Expose Learning and Chat Through the Strict Service Protocol

**Files:**
- Modify: `python-runtime/protocol.py`
- Modify: `python-runtime/service.py`
- Modify: `desktop/src/pythonService.mts`
- Test: `python-runtime/tests/test_protocol.py`
- Test: `python-runtime/tests/test_service.py`
- Test: `tests/pythonServiceProtocol.test.mjs`

**Interfaces:**
- Consumes: Task 2 storage methods.
- Produces exact request methods:
  - `learning.get {}`
  - `learning.save {state}`
  - `learning.importLegacy {state, sourceHash}`
  - `chat.list {courseId, lessonId}`
  - `chat.append {courseId, lessonId, messages}`
  - `chat.clear {courseId, lessonId}`

- [ ] **Step 1: Write failing exact-schema protocol tests**

For every new method, test one valid frame and one table-driven invalid-field case. Continue requiring exact request keys; reject unknown fields instead of guessing another schema.

- [ ] **Step 2: Run protocol tests and observe failure**

```bash
desktop/.runtime/python/bin/python3.13 -m unittest python-runtime/tests/test_protocol.py python-runtime/tests/test_service.py -v
node --experimental-strip-types --test tests/pythonServiceProtocol.test.mjs
```

- [ ] **Step 3: Add only the six methods above**

Dispatch directly to `Storage`. Keep Python responses as data only. Do not add a generic RPC registry, event bus, retry field, provider method, or model event without a real Python caller.

- [ ] **Step 4: Preserve real service errors**

Keep one per-frame service boundary so a bad request receives its real type/message while the service remains alive. A malformed service response still remains fatal in Electron main; do not return an empty state.

- [ ] **Step 5: Run focused protocol/integration tests**

Use the commands from Step 2. Expected: all pass.

- [ ] **Step 6: Review and commit the protocol unit**

```bash
git diff --check
git add python-runtime/protocol.py python-runtime/service.py python-runtime/tests desktop/src/pythonService.mts tests/pythonServiceProtocol.test.mjs
git commit -m "feat: expose learning state protocol"
```

---

### Task 4: Move Desktop Progress and Chat off localStorage

**Files:**
- Create: `app/lib/desktopState.ts`
- Modify: `desktop/src/bridge.ts`
- Modify: `desktop/src/preload.ts`
- Modify: `desktop/src/main.ts`
- Modify: `app/lib/platformBridge.ts`
- Modify: `app/components/LearningApp.tsx`
- Modify: `app/components/CourseChat.tsx`
- Test: `tests/legacyProgressMigration.test.mjs`
- Test: extend `tests/platformBridge.test.mjs`
- Test: extend `scripts/smoke-packaged-renderer.mjs`

**Interfaces:**
- Consumes: Task 3 protocol calls and existing `parseStoredProgress(raw, lessonIds)`.
- Produces:
  - `loadLearningState(lessonIds): Promise<StoredProgress>`
  - `saveLearningState(state): Promise<void>`
  - `importLegacyLearningState(raw, lessonIds): Promise<{imported: boolean; state: StoredProgress}>`
  - platform chat load/append/clear backed by SQLite in desktop and legacy HTTP only in explicit browser development.

- [ ] **Step 1: Write pure migration tests first**

Cover:

```text
valid legacy JSON -> exact validated state sent once
invalid legacy JSON -> explicit error, no partial import
same source hash -> imported false and unchanged state
desktop bridge missing -> DESKTOP_BRIDGE_UNAVAILABLE, no HTTP
browser/offline path -> existing localStorage behavior unchanged
```

Compute the source hash from the exact raw legacy string in Electron main or the trusted service; do not normalize and silently change the source before hashing.

- [ ] **Step 2: Implement `desktopState.ts` as the single platform decision**

Desktop must call only preload APIs. Browser development may retain its existing localStorage/legacy service path until final replacement. Offline HTML keeps its isolated localStorage and must not gain desktop/profile/chat imports.

- [ ] **Step 3: Replace desktop hydration**

In `LearningApp`, hydrate from SQLite when `__STEWIE_DESKTOP__` is true. On the first desktop run only:

1. Read legacy key `python-agent-path-progress-v2`.
2. Validate with existing `parseStoredProgress`.
3. Import by raw-source hash.
4. Keep the localStorage value untouched until the user later chooses cleanup.
5. Show the real migration failure if validation or storage fails.

Do not maintain live writes to both SQLite and localStorage in desktop.

For code editing, use one documented 300 ms draft autosave debounce, cancel the superseded timer, and flush the latest draft when the editor blurs, the lesson changes, code runs, or the window begins closing. This timer has explicit autosave semantics; do not use timer/microtask scheduling merely to silence lint. Ensure only the latest state can become the persisted state when saves overlap, and surface a failed write instead of marking it saved.

- [ ] **Step 4: Replace session-only desktop chat**

Course chat load, append, and clear must call SQLite through the bridge. Update history only after the model reply and database append both succeed; never show a saved state if persistence failed.

- [ ] **Step 5: Extend the packaged renderer smoke**

Use a temporary `userData` directory and verify:

```text
complete first Python lesson -> restart -> completed state remains
save a draft -> restart -> exact draft remains
make rapid consecutive edits -> restart -> latest edit remains
append one course chat -> unrelated lesson remains empty
clear current lesson -> unrelated lesson remains
```

Do not use a production user profile or real API Key in the smoke.

- [ ] **Step 6: Review and commit the desktop migration unit**

Run focused Node/Python tests, lint, desktop typecheck, desktop package, and the packaged renderer smoke. Then:

```bash
git diff --check
git add app desktop tests scripts/smoke-packaged-renderer.mjs
git commit -m "feat: migrate desktop learning state"
```

---

### Task 5: Import Exact Legacy Mac JSON Without Reading Old Keys

**Files:**
- Create: `desktop/src/legacyMigration.mts`
- Modify: `desktop/src/main.ts`
- Modify: `python-runtime/storage.py`, `python-runtime/protocol.py`, `python-runtime/service.py`
- Test: `tests/legacyDesktopFiles.test.mjs`
- Test: extend `python-runtime/tests/test_storage.py`

**Interfaces:**
- Consumes exact paths:
  - `~/Library/Application Support/Stewie Learning Site/model-profiles.json`
  - `~/Library/Application Support/Stewie Learning Site/chat-history.json`
- Produces exact protocol methods:
  - `legacy.import {sourceKind, sourceHash, profiles, conversations}`
  - `legacy.recordFailure {sourceKind, sourceHash, errorMessage}`
- Imported profiles always have `apiKeyCiphertext = null` and require Key re-entry.
- Each legacy file is an independent all-or-nothing source. A profile-file conflict does not block a separate history-file import, and vice versa.

- [ ] **Step 1: Write minimal legacy fixtures**

Use one valid profile array, one version-1 history object, one corrupted file, and one repeat-start case. Fixtures contain no real Key and remain small.

- [ ] **Step 2: Read only the two exact files**

If a file does not exist, report “not present” without scanning another directory. If it exists, parse exactly once. Validate profile fields through the existing TypeScript `validateProfile`; validate history through one strict version-1 parser. Do not attempt alternate filenames or formats.

- [ ] **Step 3: Define conflict behavior before implementing import**

For each source file, validate the entire payload and check all conflicts before writing:

- If any imported profile id already exists, reject that whole profile source, record it as `failed`, and write no profile. Never update, clear, or replace existing `api_key_ciphertext`, provider fields, or active status.
- If any imported `(courseId, lessonId)` already has messages, reject that whole history source, record it as `failed`, and write no message. Never append, resequence, or replace an existing thread.
- If there are no conflicts, insert imported profiles with `api_key_ciphertext = NULL`. Keep an existing active profile unchanged. If the database has no active profile, make the first imported profile in source order active and all other imported profiles inactive.
- Insert chat messages in exact source order and preserve each valid source timestamp. Do not deduplicate or sort by timestamp.
- A repeated `(sourceKind, sourceHash)` returns its recorded status and performs no writes.

Add tests proving existing ciphertext remains byte-for-byte unchanged, active-profile uniqueness is preserved, existing chat order is unchanged, a conflict cannot partially import a file, and a clean source imports exactly once.

- [ ] **Step 4: Import non-secret data in one transaction**

Add the two exact protocol methods above; do not create a generic migration RPC. `legacy.import` validates the complete payload before opening one transaction. Profiles enter `model_profiles` with `api_key_ciphertext = NULL`. History enters the Task 2 chat tables. Record imported source hash in `migration_sources`. A repeated hash returns the existing status and performs no writes.

If reading or validation fails after raw bytes are available, call `legacy.recordFailure` once with the SHA-256 of those exact bytes and the real redacted reason. If the file cannot be read, show the filesystem error and leave the database unchanged because there is no trustworthy source hash to record. Do not manufacture a hash or success record.

- [ ] **Step 5: Preserve legacy sources**

Do not delete or rewrite either JSON file. Do not call the old Keychain service and do not delete its entries. Show “需要重新输入 API Key” for imported profiles.

- [ ] **Step 6: Review and commit the legacy import unit**

```bash
git diff --check
git add desktop/src/legacyMigration.mts desktop/src/main.ts python-runtime tests
git commit -m "feat: import legacy desktop data"
```

---

### Task 6: Add Non-secret Learning Export and Import

**Files:**
- Create: `app/lib/learningExport.ts`
- Modify: Python storage/protocol and desktop bridge
- Modify: `app/components/ModelSettings.tsx` or a focused data panel only if the existing component becomes hard to read
- Test: `tests/learningExport.test.mjs`
- Test: extend Python storage tests

**Interfaces:**
- Produces exactly this JSON document; `StoredProgress` is the canonical DTO from Task 2:

```ts
type LearningExportV1 = {
  schema: "stewie-learning-export-v1";
  exportedAt: string;
  learning: StoredProgress;
  chats: Array<{
    courseId: string;
    lessonId: string;
    messages: Array<{
      role: "user" | "assistant";
      content: string;
      createdAt: string;
    }>;
  }>;
};
```

- Produces exact Python protocol methods:
  - `learning.export {}` → `LearningExportV1`
  - `learning.importExport {document}` → `{imported: true, counts: {completed, drafts, mistakes, threads, messages}}`
- Produces exact renderer bridge results:
  - `exportLearningData()` → `{status: "cancelled"}` or `{status: "saved", path: string}`
  - `importLearningData()` → `{status: "cancelled"}` or `{status: "imported", counts: {...}}`
- Explicitly excludes API Key plaintext/ciphertext, profile secrets, model responses not already in chat, source documents, RAG chunks/vectors, and OS paths.

- [ ] **Step 1: Write round-trip, transaction, dialog, and exclusion tests**

Assert exact round-trip for `learning` and `chats`, mistake order, chat message order, and one valid ISO `exportedAt`. Assert serialized export does not contain `apiKey`, `apiKeyCiphertext`, authorization headers, model-profile fields, source document content, vectors, or OS paths.

Use focused cases for: dialog cancellation performs no file/database operation; malformed or wrong-version input reports the real error; a failed import leaves the previous learning/chat state unchanged; a valid import replaces only learning/chat and leaves profiles/ciphertext untouched.

- [ ] **Step 2: Implement one versioned schema and one file boundary**

Reject other versions and malformed records. Accept one user-selected UTF-8 JSON file. Do not impose an import-only size ceiling that could reject a valid file created by this same application; surface real filesystem or memory errors instead. Do not guess encoding, alternate versions, or partially import a damaged export.

- [ ] **Step 3: Make the Python import transactional**

Validate the complete document before opening one transaction, replace allowed learning/chat state in that transaction, and leave current data untouched on failure. Never modify `model_profiles`, `migration_sources`, or future RAG tables. Python creates the export document and `exportedAt`; Electron does not recreate the DTO.

- [ ] **Step 4: Add explicit user actions**

Use Electron file dialogs through trusted main. A cancelled dialog returns the exact `cancelled` result and is not an error. For export, the confirmed path returned by `showSaveDialog` is the user's overwrite authorization; write once and surface filesystem failure. For import, read once as UTF-8, call the Python transaction once, and show its real result. No automatic export, clipboard copy, browser download fallback, silent overwrite, or retry.

- [ ] **Step 5: Review and commit the export unit**

```bash
git diff --check
git add app desktop python-runtime tests
git commit -m "feat: export learning data"
```

---

### Task 7: Gate 1 Verification, Review, and Commit

**Files:** all files changed by Tasks 2–6.

**Interfaces:**
- Produces a verified Gate 1 head with the five small commits above and no unresolved Critical/Important findings.

- [ ] **Step 1: Run full verification**

```bash
git diff --check
npm test
npm run lint -- --max-warnings=0
npm run desktop:typecheck
desktop/.runtime/python/bin/python3.13 -m unittest discover -s python-runtime/tests -v
npm run build:offline
npm run build
npm run desktop:package
npm run smoke:packaged-python
npm run smoke:packaged-renderer
```

- [ ] **Step 2: Audit the diff**

```bash
gate_1_base_sha=$(git rev-parse "$(git log -1 --format=%H --grep='^feat: store learning and chat state$')^")
git diff "$gate_1_base_sha" --check
git diff "$gate_1_base_sha" -- app desktop/src python-runtime scripts tests | rg 'catch|retry|fallback|default|localStorage|apiKey|Authorization|console\.'
```

The base expression resolves to the parent of the first Gate 1 feature commit, so the review excludes this docs-only handoff commit. For each match, record why it exists. Require zero automatic retry points and one SQLite persistence root. Remove duplicate adapters and tests before commit.

- [ ] **Step 3: Request Superpowers code review**

Require no unresolved Critical/Important findings for migration atomicity, secret exclusion, desktop/browser separation, and duplicate persistence.

- [ ] **Step 4: Commit review fixes only when needed**

```bash
git add -u
git commit -m "fix: close learning migration review"
```

Do not create an empty checkpoint commit when the review made no changes.

---

## Gate 2: One Curriculum Source

Follow original plan Task 6 after Gate 1. The concrete deliverable is one typed catalog that generates both public and trusted-service snapshots with matching SHA-256.

### Required sequence

- [ ] Create `app/content/schema.ts` with exact course/lesson/stage/project/source/video/migration-card types.
- [ ] Move existing Python, LangChain/RAG, and LangGraph content without changing ids.
- [ ] Make `app/content/catalog.ts` the only authored catalog root.
- [ ] Add `scripts/build-learning-bundle.mjs` to emit versioned `course-public.json` and `learning-service.json`.
- [ ] Make desktop, browser, and offline consume `course-public.json`; make Python service consume `learning-service.json`.
- [ ] Refuse startup/build when schema version or catalog hash differs; do not load a stale fallback file.
- [ ] Create `docs/curriculum-review.md` with one row per stage: official source route, verified version/date, beginner explanation review, runnable representative, misconception review.
- [ ] Merge/delete field-presence tests replaced by one data-driven invariant test.
- [ ] Commit `refactor: establish reviewed curriculum source` only after offline HTML proves no secret/model/RAG/desktop entry.

### Gate 2 acceptance

```text
one authored catalog
two generated snapshots
matching catalog hash
no duplicated course list
offline contains public content only
no external URL networking in normal tests
```

---

## Gate 3: Trusted Exercise Families

Follow original plan Task 7 before adding dozens of lessons.

### Required sequence

- [ ] Define family metadata, deterministic parameters, starter generator, reference solution, trusted tests, tags, and difficulty bounds.
- [ ] Serialize family facts once into the trusted service snapshot.
- [ ] Keep grader/test code deterministic; LLM output must never define tests or expected answers.
- [ ] Port representative Python exercises and preserve all current judging regression cases.
- [ ] Add one real packaged LangChain family and one real packaged LangGraph family.
- [ ] Test starter failure, reference success, alternative-correct success, invalid parameter rejection, and hidden-test behavior.
- [ ] Commit `feat: define trusted exercise families` after a packaged smoke.

---

## Gate 4: Expand the Three Learning Routes

Do not implement all content in one commit. Each bullet below is a separate editorial + runtime + review commit.

### Python: eight stage commits

1. Fundamentals.
2. Control flow and collections.
3. Functions and files.
4. Advanced language features.
5. Engineering quality and testing.
6. APIs, data, and concurrency.
7. Algorithms and performance.
8. Production project practice.

Final target: at least 64 substantive lessons and six projects. Every lesson needs an original beginner explanation, runnable example, misconception, exercise, tiered hints, answer, tags, and verified source baseline.

### LangChain/RAG: seven stage commits

1. Model I/O and prompts.
2. Runnables and tools.
3. Document ingestion.
4. Embeddings and two-step RAG.
5. Advanced retrieval.
6. Conversational and agentic RAG.
7. Evaluation, security, and production.

Final target: at least 48 substantive lessons and four projects. Current official APIs are the main path. Deprecated `Memory` and classic chains appear only in sourced migration cards showing the modern replacement.

### LangGraph: seven stage commits

1. State, nodes, and edges.
2. Routing, `Command`, and `Send`.
3. Streaming and tools.
4. Persistence, checkpointers, and `Store`.
5. Interrupts and human-in-the-loop.
6. Subgraphs, multi-agent patterns, and durable execution.
7. Evaluation and capstone.

Final target: at least 42 substantive lessons and four projects. Accept behaviorally/structurally equivalent implementations; never force variable names or one syntax spelling.

### Content-stage acceptance for every commit

```text
official source and version recorded
original text/code, not copied tutorial content
starter fails for the intended reason
reference answer passes
alternative correct answer passes
one common misconception is explained
packaged runtime executes one representative
no source substring grading
```

---

## Gate 5: Isolated Execution, Mastery, and Personalization

Execute original plan Tasks 11–14 in order.

1. Fresh bundled-Python learner process with separate control pipe and complete descendant cleanup.
2. Per-run loopback model gateway with one-run token; real Key remains in main.
3. Immutable attempt snapshots plus one Python-owned mastery score and review schedule.
4. LLM-generated story/requirements/hints only, combined with deterministic family tests and accepted only after reference validation.

Do not run learner code inside the trusted service. Do not serve an unverified personalized question as success. Add the Python→main schema-checked model request channel only when the first real personalization/RAG caller is implemented, and route it to the existing `ModelClient`.

---

## Gate 6: Local Hybrid RAG

Execute original plan Tasks 15–17.

- Import only user-selected PDF/Markdown/TXT with explicit size/type limits.
- Use one parser path per supported type; no crawler or downloader fallback chain.
- Store managed copies, checksums, metadata, chunks, vectors, and evaluations in the same SQLite owner.
- Request embeddings through Electron main; Python never receives the Key.
- Fuse FTS5 and dense cosine with explicit RRF parameters.
- Require citations to retrieved chunk ids and return “资料不足” below threshold.
- Measure Recall@K, MRR, nDCG, citation coverage, and latency deterministically.

---

## Gate 7: Adaptive LangGraph Tutor

Execute original plan Task 18 only after mastery, personalization, and RAG are stable.

- Use the service-owned SQLite checkpointer for thread state.
- Reuse the existing mastery/personalization/RAG services; do not duplicate their rules in graph nodes.
- Implement load, diagnose, retrieve, select, generate, validate, grade, update, and schedule nodes.
- Use interrupts for hint level, answer reveal, and source confirmation.
- Persist validation failure as a visible graph outcome, not a success edge.
- Test one full path, one interrupt/resume, and one validation failure.

---

## Gate 8: Product Finish and Release

Execute original plan Tasks 19–20.

- Finish dashboard, review queue, projects, RAG health, storage locations, export/clear controls, and cost/security explanations.
- Recheck narrow/large responsive layouts without absolute-panel overlap.
- Keep offline HTML derived from the same catalog and prove it has no profile, Key, chat, RAG, or desktop bridge.
- Build Windows/macOS x64/ARM64 in CI and run packaged Python/course/model failure smokes.
- Configure Developer ID/notarization and Windows signing only through CI secrets.
- Label unsigned artifacts accurately. Do not claim secure Key persistence on an unsigned Mac artifact.
- Remove the legacy Node local service only after the complete replacement acceptance set passes; preserve old user files/Keychain entries until explicit cleanup approval.

### Final report must include

```text
exact passing test counts
lint/type/build/package commands and results
new production catch count with one-line purpose per catch
automatic retry count
persistence root count and paths
test categories added and redundant tests deleted
artifact sizes and SHA-256 manifests
signed/notarized status per OS/architecture
known security limitations
remaining external credential blockers
```

---

## Recommended 5.6 Luna Startup Prompt

```text
Continue Stewie LearnOS in /Users/ciao/Documents/Python学习/.worktrees/stewie-learning-site on branch codex/stewie-learning-site. Read the design spec, the original desktop plan, and docs/superpowers/plans/2026-09-02-stewie-learnos-luna-handoff.md completely before editing. Start from Task 1 of the handoff and execute Gate 1 only. Use Superpowers executing-plans, TDD, code review, and verification-before-completion. Preserve the current zero-deployment packaged app and all completed Task 1–4 behavior. Do not add secret fallbacks, browser direct model access, provider adapters, retries, duplicated course sources, source-string grading, or future protocols without a real caller. After Gate 1 passes full verification and has no Critical/Important review findings, commit it and report exact evidence before moving to Gate 2.
```

## Self-review Checklist for the Executor

- [ ] The current task has a real user-visible deliverable and a focused failing test.
- [ ] No new helper has only one caller.
- [ ] No desktop operation silently uses the legacy browser service.
- [ ] No secret reaches renderer state, Python, SQLite plaintext, logs, export, or learner process.
- [ ] No catch returns success/default data after failure.
- [ ] No automatic retry was added.
- [ ] No course fact or validator rule was copied into a second source.
- [ ] No test asserts private names, CSS, or a whole-page snapshot.
- [ ] Packaged verification covers the changed boundary, not only source tests.
- [ ] The stage has a clean commit and a base→head review before the next gate.
