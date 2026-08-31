# Stewie Personal Learning Site Implementation Plan

> **Archived baseline:** This plan records the current Mac local-service implementation. New zero-environment desktop work follows `2026-08-31-stewie-learnos-desktop.md`; keep this document only as migration evidence until the desktop replacement is verified.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the existing local Python course into Stewie's local-first Python, LangChain/RAG, and LangGraph learning site with secure local model profiles and a lesson-aware chat tutor.

**Architecture:** A shared TypeScript course catalog feeds both the React site and generated offline HTML. A small Node HTTP service owns profile persistence, macOS Keychain access, chat history, and the single OpenAI-compatible upstream call path; the browser never receives secrets.

**Tech Stack:** React 19, vinext/Vite, TypeScript, Node core HTTP/filesystem, macOS `security`, Pyodide 314.0.3, Node test runner, Figma.

**Spec:** `docs/superpowers/specs/2026-08-26-stewie-learning-site-design.md`

## Global Constraints

- Local only; no hosting or cloud database.
- Exactly one OpenAI-compatible request path and no automatic retry.
- Keychain failure never falls back to browser, file, or environment storage.
- Full and offline sites derive from one course catalog.
- Tests target user-visible contracts, not implementation names or CSS classes.
- Each phase ends with diff, test, lint/type/build, and catch/retry/fallback review.

---

### Task 1: Shared learning catalog

**Files:**
- Create: `app/lib/learningCatalog.ts`
- Create: `app/lib/learningCatalogSchema.mjs`
- Test: `tests/learningCatalog.test.mjs`
- Modify: `app/lib/curriculum.ts`, `scripts/build-offline-html.mjs`

**Interfaces:**
- Produces `learningTracks`, `findLearningLesson(courseId, lessonId)`, and `validateLearningCatalog(catalog)`.
- Existing Python `lessons` remain the source for Python exercises and are referenced, not copied.

- [ ] Write one table-driven failing invariant test proving every course/lesson has unique ids, valid video domains, valid official sources, and complete migration fields.
- [ ] Run `node --test tests/learningCatalog.test.mjs` and confirm it fails because the catalog does not exist.
- [ ] Implement the smallest catalog schema and three tracks: Python, LangChain/RAG, LangGraph.
- [ ] Add p37–38 memory notes, p39–67 roadmap, official videos, migration cards, examples, exercises and answers.
- [ ] Make the offline builder consume this catalog while retaining existing Python solutions.
- [ ] Run catalog and existing curriculum/offline tests; merge or remove tests whose old 25-level count contract is no longer valid.
- [ ] Review phase diff and commit `feat: add shared learning catalog`.

### Task 2: Local profile and chat service

**Files:**
- Create: `local-service/modelProfile.mjs`, `local-service/keychain.mjs`, `local-service/storage.mjs`, `local-service/chatPrompt.mjs`, `local-service/server.mjs`
- Create: `scripts/run-local.mjs`
- Test: `tests/modelProfile.test.mjs`, `tests/localService.test.mjs`, `tests/chatPrompt.test.mjs`
- Modify: `package.json`, `.gitignore`

**Interfaces:**
- `validateProfile(input)` returns a normalized non-secret profile or throws one explicit validation error.
- `redactProfile(profile, hasApiKey)` returns the only frontend profile shape.
- HTTP routes: `GET /profiles`, `PUT/DELETE /profiles/:id`, `POST /profiles/:id/test`, `POST /chat`, `GET/DELETE /chat-history`.

- [ ] Write failing table-driven tests for valid profiles, unsafe HTTP cloud URLs, missing models, bounds, and redaction.
- [ ] Implement the pure validation/redaction module and make tests pass.
- [ ] Write failing Keychain boundary tests with only the command runner replaced; assert Key values never enter returned objects or errors.
- [ ] Implement macOS Keychain get/set/delete with no fallback and make tests pass.
- [ ] Write failing service integration tests using temporary storage and a real local mock upstream for save/redact, upstream error propagation, context isolation, and history isolation/clear.
- [ ] Implement owner-only JSON persistence, prompt JSON isolation, one `/chat/completions` request with timeout, and the six routes.
- [ ] Make `npm run dev` and `npm start` launch the local service and site together; a failed child process terminates the command with its real status.
- [ ] Run service tests, diff review, catch/retry/default search, lint/type/build, then commit `feat: add secure local model service`.

### Task 3: Figma design and React learning interface

**Files:**
- Modify: `app/page.tsx`, `app/globals.css`, `app/layout.tsx`
- Create focused UI modules only when two real consumers justify them.
- Test: extend catalog/state pure tests; do not snapshot the full page.

**Interfaces:**
- Course navigation consumes `learningTracks` and never applies lock state.
- Model settings consumes redacted profile routes only.
- Chat drawer sends `{ mode, courseId, lessonId, message, profileId }` and renders real service errors.

- [ ] Create the Figma design file, actual tokens, minimal repeated components, and the four approved screens; validate section screenshots and fonts.
- [ ] Write failing pure state tests for one-time legacy Python progress migration and free course navigation.
- [ ] Implement the new state shape and remove locked/unlocked behavior while preserving Python drafts, mistakes and Pyodide execution.
- [ ] Implement dashboard, course/lesson content, settings page and chat drawer from the approved Figma design.
- [ ] Persist per-lesson chat through the local service and show the exact local config/Keychain locations in settings.
- [ ] Run relevant tests and browser-smoke the critical full-site journeys with a local mock model.
- [ ] Review diff, catches, defaults, helpers and UI failure states; commit `feat: redesign stewie learning site`.

### Task 4: Offline learning file

**Files:**
- Modify: `offline/template.html`, `scripts/build-offline-html.mjs`
- Regenerate: `Stewie-个人学习站-离线版.html`
- Test: `tests/offlineCourse.test.mjs`

**Interfaces:**
- Offline course data is serialized from `learningTracks` plus existing Python exercises/solutions.
- Offline HTML exposes no profile, chat, key, localhost service, or network execution interface.

- [ ] Replace old offline tests with one failing invariant test for shared content plus one security-boundary test for excluded model features.
- [ ] Implement the renamed offline layout with free course navigation, videos as explicit external links, editor, progress and answers.
- [ ] Generate the single file and make tests pass.
- [ ] Inspect the file locally, review diff and commit `feat: update offline learning site`.

### Task 5: Verification and delivery

**Files:**
- Modify only files required by verified failures.

- [ ] Run `git diff --check`, all tests, lint with zero warnings, TypeScript/build and offline build in order.
- [ ] Search business code for `catch`, `retry`, `default`, and `fallback`; record each real boundary, automatic retry count, and persistence path count.
- [ ] Review base SHA to HEAD for duplicate abstractions, silent degradation, repeated tests, implementation-detail tests and unused template remnants.
- [ ] Browser-verify course browsing, saved-but-masked key with a disposable Keychain profile, mock chat success, upstream failure, Python success/error/timeout recovery, and offline absence of chat/settings.
- [ ] Run final Figma screenshot/font verification.
- [ ] Use the verification and finishing-branch skills, then present integration options without pushing or hosting.
