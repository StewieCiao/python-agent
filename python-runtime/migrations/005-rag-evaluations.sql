-- version: 5
BEGIN IMMEDIATE;

CREATE TABLE rag_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    catalog_hash TEXT NOT NULL,
    document_hash TEXT NOT NULL,
    embedding_model TEXT NOT NULL,
    recorded_at TEXT NOT NULL,
    case_count INTEGER NOT NULL CHECK (case_count > 0),
    recall_at_k REAL NOT NULL CHECK (recall_at_k >= 0 AND recall_at_k <= 1),
    mrr REAL NOT NULL CHECK (mrr >= 0 AND mrr <= 1),
    citation_coverage REAL NOT NULL CHECK (citation_coverage >= 0 AND citation_coverage <= 1),
    faithfulness_proxy REAL NOT NULL CHECK (faithfulness_proxy >= 0 AND faithfulness_proxy <= 1),
    latency_ms REAL NOT NULL CHECK (latency_ms >= 0)
);

INSERT INTO schema_migrations(version) VALUES (5);
COMMIT;
