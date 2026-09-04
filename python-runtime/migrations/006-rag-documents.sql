-- version: 6
BEGIN IMMEDIATE;

CREATE TABLE rag_documents (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    text TEXT NOT NULL,
    content_hash TEXT NOT NULL UNIQUE,
    imported_at TEXT NOT NULL
);

INSERT INTO schema_migrations(version) VALUES (6);
COMMIT;
