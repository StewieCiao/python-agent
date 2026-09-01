-- version: 1
BEGIN IMMEDIATE;

CREATE TABLE schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE model_profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    base_url TEXT NOT NULL,
    provider_origin TEXT NOT NULL,
    model TEXT NOT NULL,
    embedding_model TEXT,
    temperature REAL NOT NULL,
    max_tokens INTEGER NOT NULL,
    timeout_ms INTEGER NOT NULL,
    api_key_ciphertext BLOB,
    active INTEGER NOT NULL DEFAULT 0 CHECK (active IN (0, 1)),
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX model_profiles_one_active
ON model_profiles(active)
WHERE active = 1;

INSERT INTO schema_migrations(version) VALUES (1);

COMMIT;
