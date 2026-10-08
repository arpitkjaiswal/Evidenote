CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS study_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  title varchar(160) NOT NULL CHECK (length(trim(title)) > 0),
  content text NOT NULL CHECK (length(trim(content)) > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_notes_user_created_idx
  ON study_notes (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS study_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id uuid NOT NULL REFERENCES study_notes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_chunks_note_idx ON study_chunks (note_id);
CREATE INDEX IF NOT EXISTS study_chunks_user_idx ON study_chunks (user_id);
CREATE INDEX IF NOT EXISTS study_chunks_embedding_hnsw_idx
  ON study_chunks USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS study_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  question text NOT NULL,
  answer text NOT NULL,
  sources json NOT NULL DEFAULT '[]'::json,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS study_messages_user_created_idx
  ON study_messages (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION match_study_chunks(
  query_embedding vector(1536),
  query_user_id uuid,
  match_count integer DEFAULT 6
)
RETURNS TABLE (
  chunk_id uuid,
  note_id uuid,
  title text,
  content text,
  similarity real
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.note_id,
    n.title,
    c.content,
    (1 - (c.embedding <=> query_embedding))::real
  FROM study_chunks AS c
  INNER JOIN study_notes AS n ON n.id = c.note_id
  WHERE c.user_id = query_user_id
    AND n.user_id = query_user_id
  ORDER BY c.embedding <=> query_embedding
  LIMIT LEAST(GREATEST(match_count, 1), 8)
$$;
