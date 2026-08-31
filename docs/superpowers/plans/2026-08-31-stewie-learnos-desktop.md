# Stewie LearnOS Desktop Implementation Plan

> **Execution rule:** Implement task-by-task with review checkpoints. Keep the current runnable site until the full desktop replacement acceptance set passes on packaged clean machines. Do not run multiple workers against the shared worktree.

**Goal:** Turn the current local learning website into a zero-environment Windows/macOS desktop application with three complete curricula, secure per-device BYOK, verified personalized exercises, local hybrid RAG, and a LangGraph adaptive tutor.

**Architecture:** A static React renderer runs inside Electron. A narrow preload bridge calls Electron main for secret encryption, model HTTP, authorized files and learner-process supervision. One bundled trusted Python service exclusively owns SQLite, RAG and the Tutor Graph. Every learner-code run is a fresh main-supervised child with a dedicated control channel. Versioned JSON snapshots generated from one typed catalog/family source feed renderer, offline HTML, trusted service and runner. Basic Python remains in a Pyodide Web Worker.

**Primary stack:** React 19, TypeScript, Electron Forge, async Electron `safeStorage`, pinned CPython standalone with stdlib SQLite/FTS5, Pyodide 314.0.3, LangChain/LangGraph Python, Node test runner, Python unittest/pytest, and a deliberately small Playwright desktop E2E suite.

**Spec:** `docs/superpowers/specs/2026-08-31-stewie-learnos-desktop-design.md`

## Global checkpoints

Before each task commit:

- Run `git diff --check`.
- Run the smallest relevant tests, then lint/type/build for touched packages.
- Search the task diff for `catch`, `retry`, `default`, `fallback`, `localStorage`, API Key names and accidental logs.
- Confirm every new helper has at least two real callers, otherwise inline it.
- Review task base SHA → head SHA for silent degradation, duplicate persistence, copied content and repeated tests.
- Do not add a second database owner, secret path, provider protocol or generic retry framework.

## Milestone A — Zero-environment desktop foundation

### Task 1: Add the secure desktop shell

**Files:**

- Create: `desktop/package.json`, `desktop/forge.config.ts`, `desktop/tsconfig.json`
- Create: `desktop/src/main.ts`, `desktop/src/preload.ts`, `desktop/src/renderer.tsx`, `desktop/src/index.html`, `desktop/src/bridge.ts`
- Modify: root `package.json`, `.gitignore`
- Test: `tests/desktopManifest.test.mjs`, `tests/desktopWindowPolicy.test.mjs`

- [ ] Write failing contracts for pinned Electron/Forge packages, Windows/macOS makers and no end-user runtime install script.
- [ ] Add Forge + Vite scripts: `desktop:dev`, `desktop:package`, `desktop:make`.
- [ ] Configure `contextIsolation`, disabled Node integration, renderer sandbox, strict CSP, single-instance lock and blocked arbitrary navigation/new windows.
- [ ] Validate IPC sender/origin before handling every request; expose only `appInfo()` initially.
- [ ] Load a local static renderer with no Vinext/Node server and package an unsigned Mac artifact outside the repository.
- [ ] Run the global checkpoint and commit `feat: add secure desktop shell`.

### Task 2: Bundle the trusted Python data service and prove every target early

**Files:**

- Create: `scripts/prepare-python-runtime.mjs`
- Create: `python-runtime/requirements.lock`, `python-runtime/service.py`, `python-runtime/protocol.py`
- Create: `desktop/src/pythonService.ts`
- Create: `.github/workflows/desktop-smoke.yml`
- Modify: `desktop/forge.config.ts`, root package scripts and `.gitignore`
- Test: `tests/pythonRuntimeManifest.test.mjs`, `python-runtime/tests/test_protocol.py`

- [ ] Pin one `python-build-standalone` release, Python minor and archive SHA-256 for Windows/macOS x64/ARM64.
- [ ] Pin LangChain, LangGraph and document dependencies once; final users never run `pip install`.
- [ ] Download/verify/extract during build only, with one source/version and no alternate fallback.
- [ ] Start one trusted service with a dedicated bidirectional control channel; it does not execute learner code or receive API Key plaintext, and can issue schema-checked `model_request` events for main to fulfill later.
- [ ] Add a health response proving Python version, required imports, SQLite transactions and FTS5.
- [ ] Package the runtime outside ASAR with correct executable permissions and resolve it only through `process.resourcesPath`.
- [ ] In CI, build and launch a packaged health smoke on Windows/macOS x64/ARM64 immediately, catching wheel, permission, ASAR and ABI problems before product work.
- [ ] Document nested runtime signing/notarization inputs in Forge config even while internal artifacts remain unsigned.
- [ ] Run the global checkpoint and commit `build: bundle cross-platform python service`.

### Task 3: Share the current learning UI with the desktop renderer

**Files:**

- Create: `app/components/LearningApp.tsx`, `app/lib/platformBridge.ts`
- Modify: `app/page.tsx`, `app/globals.css`, desktop renderer/preload
- Test: extend existing catalog/storage contracts only where behavior changes

- [ ] Extract a framework-neutral React root without changing current course behavior.
- [ ] Keep browser development and desktop entries around one shared component/CSS source, not duplicated markup.
- [ ] Keep Pyodide Worker execution, run snapshots, prompt JSON isolation and offline generation unchanged.
- [ ] Preserve responsive grid behavior across narrow/large desktop windows.
- [ ] Verify desktop course browsing plus Python success, SyntaxError, failed tests and infinite-loop recovery.
- [ ] Run the global checkpoint and commit `refactor: share learning app with desktop`.

### Task 4: Add secure model profiles and the initial SQLite schema

**Files:**

- Create: `app/lib/modelConfig.ts`
- Create: `desktop/src/modelClient.ts`, `desktop/src/modelProfileService.ts`
- Create: `python-runtime/migrations/001-model-profiles.sql`, `python-runtime/storage.py`
- Modify: desktop main/preload, `app/lib/platformBridge.ts`
- Test: model config, safeStorage/IPC, model client and Python storage integration tests

- [ ] Consolidate URL/limits validation and redaction in one pure TypeScript module.
- [ ] Add named OpenAI-compatible profiles, one active profile and optional embedding model.
- [ ] Let the password input hold Key only until one save IPC completes, then clear it; do not put it in global state, localStorage, logs or clipboard.
- [ ] Main uses async `safeStorage`; trusted Python storage receives only opaque ciphertext and non-secret fields.
- [ ] Bind ciphertext to provider origin; changing origin deletes the old ciphertext and requires a new Key.
- [ ] Reject unavailable encryption without file/env/localStorage fallback.
- [ ] Use `redirect: "error"`, an explicit timeout and no automatic retry for chat, embeddings and connection tests.
- [ ] Route renderer chat, trusted-service model events, RAG/Tutor calls and the later learner gateway through this one main-process model client.
- [ ] Decrypt only in main for each outbound request, construct Authorization there, and discard the local plaintext reference after fetch completion.
- [ ] Redact Key, authorization headers and request secrets from upstream/network errors while preserving status and useful reason.
- [ ] Test sender/origin rejection, CSP, password clearing, masked restart, plaintext absence from database/files/logs/service messages/renderer responses/child environments, cross-origin redirect rejection and upstream error redaction.
- [ ] Run the global checkpoint and commit `feat: secure desktop model profiles`.

### Task 5: Migrate learning state into the single Python-owned database

**Files:**

- Create: `python-runtime/migrations/002-learning-state.sql`
- Create: `app/lib/desktopState.ts`
- Modify: `python-runtime/storage.py`, desktop bridge and learning app state calls
- Test: Python migration/storage tests and `tests/legacyProgressMigration.test.mjs`

- [ ] Add only currently needed tables for course progress, drafts and chat threads/messages; later milestones add their own numbered migrations.
- [ ] Apply each migration in one transaction or report its real failure; no partial schema repair.
- [ ] Add one explicit importer for validated legacy Python localStorage progress and record completion.
- [ ] Detect the exact legacy Mac `model-profiles.json` and `chat-history.json`, validate their version-1 schemas, import non-secret profiles/history idempotently by source hash, and mark imported profiles as requiring Key re-entry.
- [ ] Do not read/delete old Keychain entries automatically; keep legacy files/entries until the user explicitly confirms cleanup. A failed import leaves source data untouched and records the real failure.
- [ ] Move desktop progress/history from localStorage to the trusted service while offline HTML keeps its isolated localStorage.
- [ ] Add export/import of non-secret learning data; exclude Key ciphertext and source documents by default.
- [ ] Test lesson/history isolation, clear operations, corrupted migration and repeat-start behavior.
- [ ] Run the global checkpoint and commit `feat: migrate desktop learning state`.

## Milestone B — Trusted course and exercise foundation

### Task 6: Establish one curriculum catalog and editorial evidence

**Files:**

- Create: `app/content/schema.ts`, `app/content/catalog.ts`
- Create: `app/content/python/index.ts`, `app/content/langchain-rag/index.ts`, `app/content/langgraph/index.ts`
- Create: `scripts/build-learning-bundle.mjs`
- Create: `docs/curriculum-review.md`
- Modify: current catalog and offline builder
- Test: merge/replace `tests/learningCatalog.test.mjs`

- [ ] Write one data-driven invariant for ids, stage order, prerequisites, sources, verified versions, exercises, hints, answers, videos and project links.
- [ ] Move existing lessons without changing ids or copying Python exercise definitions.
- [ ] Make `build-learning-bundle.mjs` the only consumer of `app/content/catalog.ts`; generate schema-versioned `course-public.json` and `learning-service.json` with catalog/family SHA-256.
- [ ] Make desktop, browser development and offline builder consume the public snapshot; trusted service/runner consume the service snapshot and reject stale/invalid schema/hash at startup.
- [ ] Record the source route and current official API baseline for each stage; high-star repositories are coverage references, not copied content.
- [ ] Define editorial review evidence: substantive beginner explanation, original example, misconception, executable representative and source-version review per stage.
- [ ] Delete old tests that repeat the same field-presence contract per lesson.
- [ ] Verify offline HTML contains public lesson content but no profile/Key/chat/RAG/desktop bridge.
- [ ] Run the global checkpoint and commit `refactor: establish reviewed curriculum source`.

### Task 7: Define trusted exercise families before expanding courses

**Files:**

- Create: `app/exercises/schema.ts`
- Create: `app/exercises/python/`, `app/exercises/langchain-rag/`, `app/exercises/langgraph/`
- Create: `python-runtime/exercises/reference_validator.py`
- Test: `tests/exerciseFamilies.test.mjs`, Python validator tests

- [ ] Define family-owned parameters, starter generator, reference solution, trusted tests, tags and difficulty bounds.
- [ ] Serialize family metadata/tests into the generated service snapshot; Python uses this snapshot plus explicitly named validator modules, not duplicated course/family facts.
- [ ] Keep LLM text out of trusted tests and grader code.
- [ ] Port representative current Python exercises while preserving source-substring and scope-aware AST regressions.
- [ ] Add one representative LangChain and LangGraph family that runs in the pinned packaged environment.
- [ ] Validate boundary parameter sets, reference solution and hidden tests; reject invalid families explicitly.
- [ ] Run the global checkpoint and commit `feat: define trusted exercise families`.

### Task 8: Complete Python in reviewable stage slices

**Files:** `app/content/python/`, `app/exercises/python/`, focused course/judge tests

- [ ] Deliver eight separate stage slices, each reviewed and committed before the next: fundamentals; control/collections; functions/files; advanced language; engineering quality; APIs/data/concurrency; algorithms/performance; production project practice.
- [ ] Reach at least 64 substantive lessons and six projects: expense CLI, data cleaner, API collector, async information collector, tested package, learning analytics app.
- [ ] Every lesson includes beginner explanation, original runnable example, misconception, exercise, tiered hints, answer and tags.
- [ ] Use behavior tests first and scoped AST only for explicit teaching constructs; never source/comment substring grading.
- [ ] For each stage, execute representative starter failure, reference success and alternative-correct implementation, then record editorial/source-version review in `docs/curriculum-review.md`.
- [ ] After all eight stage commits, run the global checkpoint and commit the stage index `feat: complete python engineering route`.

### Task 9: Complete LangChain/RAG in reviewable stage slices

**Files:** `app/content/langchain-rag/`, `app/exercises/langchain-rag/`, migration-card tests

- [ ] Deliver seven stage slices: model I/O; runnable/tools; ingestion; embeddings/2-step RAG; advanced retrieval; conversational/agentic RAG; evaluation/security/production.
- [ ] Reach at least 48 substantive lessons and four projects: cited PDF QA, hybrid personal knowledge base, evaluated support RAG, agentic research assistant.
- [ ] Keep current official APIs in the main path; legacy Memory/classic chains appear only in sourced migration cards.
- [ ] Run representative lessons/projects in the pinned environment and record exact package/API versions.
- [ ] Author original text/code; use official docs, LLM Zoomcamp and high-star repositories only as coverage references.
- [ ] After each stage review/commit, update editorial evidence; finish with `feat: complete langchain rag route`.

### Task 10: Complete LangGraph in reviewable stage slices

**Files:** `app/content/langgraph/`, `app/exercises/langgraph/`, graph exercise tests

- [ ] Deliver seven stage slices: state/edges; routing/Command/Send; streaming/tools; persistence/Store; interrupts/HITL; subgraphs/multi-agent/durable execution; evaluation/capstone.
- [ ] Reach at least 42 substantive lessons and four projects: approval workflow, persistent support agent, deep research graph, adaptive tutor.
- [ ] Align memory/persistence terminology with current official docs and record package/API versions.
- [ ] Accept structurally and behaviorally equivalent code; do not force variable names or one spelling.
- [ ] Run representative graph builds, invocations, persistence and interrupt/resume in the packaged environment.
- [ ] After each stage review/commit, update editorial evidence; finish with `feat: complete langgraph route`.

## Milestone C — Isolated execution and personal mastery

### Task 11: Execute learner code in a fresh process with a separate control channel

**Files:**

- Create: `desktop/src/learnerProcess.ts`, `python-runtime/exercises/run.py`
- Modify: trusted Python service and desktop bridge
- Test: Node process-tree and Python execution tests

- [ ] Have Electron main spawn one fresh `run.py` supervisor per run with stripped environment and new temporary directory; the supervisor starts learner code, while trusted service never starts or kills it.
- [ ] Keep control/result framing on a dedicated inherited pipe; capture child stdout/stderr separately as untrusted data.
- [ ] Use immutable ids and one active run lock; reject stale result application.
- [ ] Supervisor creates one POSIX process group or, on Windows, a stdlib-`ctypes` Job Object with `JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`; do not add a native addon or second cleanup fallback.
- [ ] Close and verify that containment before returning every success, test failure, exception, protocol failure, timeout and app-shutdown result; timeout has no test result, cleanup failure is explicit.
- [ ] Preserve real exception type, traceback, stdout, stderr and trusted test details.
- [ ] Main schema-validates the result, attaches catalog/family hashes from the service bundle, then asks trusted service to persist it in one transaction.
- [ ] Test direct print/native stdout, module-state isolation, SyntaxError, runtime error, failed tests, timeout/recovery, successful-run-with-background-descendant cleanup and shutdown cleanup.
- [ ] Add packaged execution smoke to the existing Windows/macOS architecture matrix.
- [ ] Run the global checkpoint and commit `feat: isolate learner python execution`.

### Task 12: Isolate model access for learner code

**Files:** `desktop/src/runModelGateway.ts`, learner process/service integration, gateway tests

- [ ] Start a random-port loopback gateway only for an explicitly model-enabled run.
- [ ] Issue an unguessable one-run token; enforce request count, body size, model/path allowlist and timeout.
- [ ] Keep the real Key in main; disable redirects and forward only chat/embedding to the active bound origin.
- [ ] Close the gateway on success, failure, timeout, descendant cleanup and application shutdown.
- [ ] Test child environment/error/database/logs for raw-Key absence, one successful call, one upstream failure and zero retry.
- [ ] Run the global checkpoint and commit `feat: gate learner model access`.

### Task 13: Record immutable attempts and calculate mastery once

**Files:**

- Create: `python-runtime/migrations/003-attempts-mastery.sql`
- Create: `python-runtime/learning/mastery.py`, `python-runtime/learning/review_schedule.py`
- Modify: trusted service and renderer display
- Test: Python table-driven mastery/schedule tests

- [ ] Persist exact lesson/exercise/code/result/hints snapshots plus catalog/family hashes only after a real run; timeout is distinct.
- [ ] Implement one transparent Python mastery score and review schedule; TypeScript never recomputes it.
- [ ] Cover independent success, hinted success, repeated error, delayed retention and unseen concept.
- [ ] Show evidence and “why this is next” without claiming psychological certainty.
- [ ] Run the global checkpoint and commit `feat: track personal mastery`.

### Task 14: Generate and verify personalized variants

**Files:**

- Create: `app/lib/personalizedExercisePrompt.ts`, `app/lib/personalizedExerciseSchema.ts`
- Create: `python-runtime/migrations/004-personalized-exercises.sql`
- Create: `python-runtime/exercises/personalize.py`
- Modify: model client, trusted service and UI
- Test: prompt/schema round-trip and Python personalization service tests

- [ ] Select due concepts and trusted family from the validated service snapshot using saved mastery/attempt evidence.
- [ ] Put family description and all untrusted attempt data in one JSON-isolated prompt.
- [ ] Allow the LLM to return only title/story/requirements/hints/explanation, never tests or grader code.
- [ ] Test delimiter words, quotes, slashes, newlines and prompt-injection text round-trip unchanged.
- [ ] Schema-check output, combine with deterministic family parameters, run reference solution/trusted tests in a fresh process and check duplicates.
- [ ] Persist only verified variants with generator version and human-readable selection reason.
- [ ] On failure show the real stage/reason; never serve unverified or generic fallback questions.
- [ ] Run the global checkpoint and commit `feat: generate verified personal practice`.

## Milestone D — Local hybrid RAG

### Task 15: Import and index local documents through the sole database owner

**Files:**

- Create: `python-runtime/migrations/005-rag-documents.sql`
- Create: `python-runtime/rag/ingest.py`, `python-runtime/rag/chunking.py`
- Modify: trusted service, main file authorization and UI
- Test: parser fixtures and import integration test

- [ ] Accept only user-selected PDF/Markdown/TXT with explicit type/size limits; no disk scan or parser fallback chain.
- [ ] Copy into managed storage, record checksum/metadata, parse page/section-aware chunks and deduplicate.
- [ ] Have main request embeddings with the active profile, then return vectors to the trusted service; Python never receives Key.
- [ ] Commit document/chunks/vectors in one service-owned transaction or report the real failure.
- [ ] Use one minimal fixture per format at parser level, not repeated E2E cases.
- [ ] Run the global checkpoint and commit `feat: ingest local rag documents`.

### Task 16: Add fused retrieval, citations and answer generation

**Files:**

- Create: `python-runtime/rag/retrieve.py`, `python-runtime/rag/metrics.py`
- Create: `app/lib/ragAnswerPrompt.ts`
- Create: RAG UI modules only when repeated
- Test: Python ranking/metric tests and prompt isolation tests

- [ ] Trusted service runs FTS5 plus dense cosine over the same chunk ids and combines them with explicit RRF parameters.
- [ ] Optional rerank uses the one model protocol; no provider adapter or fallback model.
- [ ] Serialize retrieved chunks as untrusted JSON; require returned citation ids to belong to the retrieved set.
- [ ] Show document/page/section, excerpt and retrieval score; open only the managed source.
- [ ] Return “资料不足” below threshold instead of uncited ordinary chat presented as RAG.
- [ ] Test keyword-only, semantic-only, fused order, missing evidence and invalid citation once at the lowest layer.
- [ ] Run the global checkpoint and commit `feat: add cited hybrid rag`.

### Task 17: Add a local RAG evaluation workbench

**Files:**

- Create: `python-runtime/migrations/006-rag-evaluations.sql`, `python-runtime/rag/evaluate.py`
- Create: focused evaluation UI
- Test: deterministic metric tests and one integration run

- [ ] Store question, expected source and optional expected answer cases.
- [ ] Calculate Recall@K, MRR, nDCG, citation coverage and latency deterministically.
- [ ] Label optional model-graded correctness/relevance/groundedness as model evaluation.
- [ ] Persist configuration/results for comparable runs and export portfolio JSON/CSV without Key or document content by default.
- [ ] Run the global checkpoint and commit `feat: evaluate local rag quality`.

## Milestone E — LangGraph tutor and portfolio product

### Task 18: Implement the adaptive tutor in the trusted service

**Files:**

- Create: `python-runtime/migrations/007-tutor-checkpoints.sql`
- Create: `python-runtime/tutor/state.py`, `graph.py`, `nodes.py`
- Modify: tutor/chat UI and service protocol
- Test: focused graph behavior tests

- [ ] Implement load, diagnose, retrieve, select, generate, validate, grade, update and schedule nodes.
- [ ] Use the service-owned SQLite checkpointer for thread state and the existing mastery tables for cross-thread state.
- [ ] Call Task 14’s one personalization service; do not duplicate mastery or validator rules inside graph nodes.
- [ ] Use interrupts for hint level, answer reveal and source confirmation.
- [ ] Treat generation/validation failure as a visible graph outcome, not a success edge.
- [ ] Test one complete path, one interrupt/resume and one validation failure without snapshotting graph internals.
- [ ] Run the global checkpoint and commit `feat: add adaptive tutor graph`.

### Task 19: Finish responsive UX, offline output and portfolio evidence

**Files:** focused renderer/CSS modules, offline builder, `docs/portfolio.md`, small E2E suite

- [ ] Add dashboard for three tracks, mastery, reviews, projects and RAG health.
- [ ] Keep lesson/editor/feedback usable at narrow and large windows with no absolute-panel overlap.
- [ ] Show storage locations, non-secret export/clear, model cost limits and exact security limitations.
- [ ] Keep offline HTML derived from the same catalog and prove no profile/Key/chat/RAG/desktop bridge exists.
- [ ] Add portfolio architecture, decisions, measured RAG metrics and demo checklist.
- [ ] E2E only: first launch/save-and-clear-Key, course/code run, personalized exercise, RAG citation, explicit upstream failure, offline exclusion.
- [ ] Run the global checkpoint and commit `feat: finish stewie learnos experience`.

### Task 20: Sign-ready release and final completion audit

**Files:** `.github/workflows/desktop-release.yml`, `docs/release.md`, Forge/package metadata

- [ ] Promote the early packaged smoke matrix to release builds for Windows/macOS x64/ARM64.
- [ ] Verify CPython service, learner subprocess/tree cleanup, Pyodide and representative LangChain/LangGraph run inside every artifact.
- [ ] Add SHA-256 manifests and configure nested runtime signing/notarization secrets without committing credentials.
- [ ] Label unsigned internal artifacts accurately; with credentials, verify signed Windows installer and notarized Mac DMG on clean machines.
- [ ] Run full tests, zero-warning lint, types, web/offline build, desktop make and packaged E2E.
- [ ] Search business code and report exact catches, automatic retries, persistence roots and all Key-handling boundaries.
- [ ] Review desktop base SHA → head for duplicate adapters, repositories, copied course content, redundant tests and unused legacy local-service code.
- [ ] Remove the legacy Node local-service code only after the complete replacement set passes: desktop courses/code execution, profile/chat migration, personalized practice, RAG, Tutor Graph, offline output and clean-machine packaged verification. Preserve user legacy files/Keychain entries until their explicit cleanup choice.
- [ ] Commit `release: prepare stewie learnos distribution`.

## Final acceptance evidence

The full goal remains incomplete until current artifacts prove every item:

- Clean Windows and Mac install/launch without Node, Python, Docker or terminal.
- Key input is cleared after submit; persisted/decrypted Key never returns to renderer. Plaintext exists transiently only in input/save and main outbound request construction, and is absent from SQLite/files/logs/exports/service messages/child environments; SQLite contains only origin-bound `safeStorage` ciphertext.
- IPC sender/CSP checks, redirect rejection and upstream error redaction pass.
- All three routes meet stage/lesson/project minimums, editorial/source-version review, representative packaged execution, and matching catalog/family hashes across renderer/service/attempts—not only field-count invariants.
- Basic and bundled Python show real success, traceback, failed test, timeout and descendant cleanup.
- A real mistake changes mastery and yields a verified personalized exercise with an explainable reason.
- A user document yields fused retrieval, valid citations and persisted evaluation metrics.
- Tutor Graph demonstrates interrupt/resume, thread checkpoint and cross-thread mastery without duplicated rules.
- Offline HTML contains shared public courses but no secret/model/RAG/desktop entry.
- Signed/notarized production artifacts are verified, or missing external signing credentials are reported as the sole release blocker.

Final delivery reports new catch count, automatic retry count, persistence root count, test categories, deleted redundant tests, artifact sizes and known security limits.
