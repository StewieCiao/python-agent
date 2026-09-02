-- version: 3
BEGIN IMMEDIATE;

CREATE TABLE mastery_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('pass', 'fail')),
    mistake_codes_json TEXT NOT NULL,
    created_at TEXT NOT NULL
);

INSERT INTO schema_migrations(version) VALUES (3);
COMMIT;
