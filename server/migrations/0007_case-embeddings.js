exports.up = (pgm) => {
  pgm.sql(`CREATE EXTENSION IF NOT EXISTS vector;`);

  pgm.sql(`
    CREATE TABLE IF NOT EXISTS case_embeddings (
      id              SERIAL PRIMARY KEY,
      case_id         INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
      content_type    TEXT NOT NULL DEFAULT 'case_summary',
      content_preview TEXT NOT NULL DEFAULT '',
      embedding       vector(1536) NOT NULL,
      source_id       INTEGER,
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS case_embeddings_unique_idx ON case_embeddings (case_id, content_type, source_id) NULLS NOT DISTINCT;`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_case_embeddings_case_id ON case_embeddings(case_id);`);

  pgm.sql(`CREATE INDEX IF NOT EXISTS idx_case_embeddings_hnsw ON case_embeddings USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);`);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS case_embeddings;`);
};
