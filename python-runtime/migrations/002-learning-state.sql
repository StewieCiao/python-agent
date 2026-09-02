-- version: 2
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
