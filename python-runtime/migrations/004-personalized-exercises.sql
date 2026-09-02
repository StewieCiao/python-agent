-- version: 4
BEGIN IMMEDIATE;

CREATE TABLE personalized_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id TEXT NOT NULL,
    family_id TEXT NOT NULL,
    prompt TEXT NOT NULL,
    created_at TEXT NOT NULL
);

INSERT INTO schema_migrations(version) VALUES (4);
COMMIT;
