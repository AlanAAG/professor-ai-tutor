"""Shared utility functions for the professor-agent-platform."""


def _get_doc_id(doc: dict) -> str:
    """
    Generate a stable unique identifier for a RAG document.

    Used for deduplication when merging results from multiple retrieval calls
    (e.g., legacy schema + new schema in Notes Creator mode).

    Precedence:
      1. doc["id"]
      2. doc["metadata"]["id"]
      3. doc["metadata"]["chunk_id"]
      4. Composite fallback: title::content_type::content-hash
    """
    metadata = doc.get("metadata") or {}
    return (
        doc.get("id")
        or metadata.get("id")
        or metadata.get("chunk_id")
        or f"{metadata.get('title', '')}::{metadata.get('content_type', '')}::{hash(doc.get('content', ''))}"
    )
