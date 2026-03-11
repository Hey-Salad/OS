-- Phase 2 RAG foundations
-- Extends the initial document schema to support richer ingestion and retrieval fallback.

PRAGMA foreign_keys = ON;

ALTER TABLE documents ADD COLUMN source_uri TEXT;
ALTER TABLE documents ADD COLUMN content_text TEXT;
ALTER TABLE documents ADD COLUMN metadata_json TEXT;

ALTER TABLE document_chunks ADD COLUMN char_count INTEGER;
ALTER TABLE document_chunks ADD COLUMN start_offset INTEGER;
ALTER TABLE document_chunks ADD COLUMN end_offset INTEGER;
ALTER TABLE document_chunks ADD COLUMN metadata_json TEXT;
ALTER TABLE document_chunks ADD COLUMN updated_at TEXT;

CREATE INDEX IF NOT EXISTS idx_document_chunks_document_order ON document_chunks(document_id, chunk_index);
CREATE INDEX IF NOT EXISTS idx_documents_scope_updated ON documents(scope_type, scope_id, updated_at);
