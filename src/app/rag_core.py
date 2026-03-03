"""
RAGCore: Retrieval-Augmented Generation core for all professor-AI tutor modes.

Metadata schemas supported:
  Legacy:     content_type="recording_transcript"  (no section field)
  New:        content_type="api_ingested_resource", section="recording"  (recordings)
              content_type="api_ingested_resource", section="pre_read"   (pre-reads)
              content_type="stub_no_content"                             (unextracted resources)

Study mode and Quiz mode already handle both schemas via _is_recording_transcript().
Notes Creator and Pre-Read mode fixes are applied in this file.
"""

import logging
from typing import Any

from src.shared.utils import _get_doc_id

logger = logging.getLogger(__name__)


class RAGCore:
    def __init__(self, supabase_client, retriever, reranker=None):
        self.supabase = supabase_client
        self.retriever = retriever
        self.reranker = reranker

    # ------------------------------------------------------------------
    # _is_recording_transcript — DO NOT MODIFY, correct as-is.
    # Used by Study mode and Quiz mode.
    # ------------------------------------------------------------------
    def _is_recording_transcript(self, doc: dict) -> bool:
        """Return True for both legacy and new-schema recording transcripts."""
        metadata = doc.get("metadata") or {}
        return (
            metadata.get("content_type") == "recording_transcript"
            or (
                metadata.get("content_type") == "api_ingested_resource"
                and metadata.get("section") == "recording"
            )
        )

    # ------------------------------------------------------------------
    # retrieve_rag_documents — delegates to the injected retriever.
    # ------------------------------------------------------------------
    def retrieve_rag_documents(
        self,
        query: str,
        metadata_filter: dict,
        cohort_id: str,
        top_k: int = 10,
    ) -> list[dict]:
        return self.retriever.retrieve(
            query=query,
            metadata_filter=metadata_filter,
            cohort_id=cohort_id,
            top_k=top_k,
        )

    # ------------------------------------------------------------------
    # get_available_lectures
    # Fix 1: Notes Creator — dual-schema filter + title/session fallback
    # Fix 4: Pre-Read     — title/session fallback (same pattern as Fix 1)
    # ------------------------------------------------------------------
    def get_available_lectures(self, mode: str, cohort_id: str) -> list[str]:
        """Return a deduplicated, sorted list of available session names for the given mode."""

        def _call_rpc(filter_params: dict) -> list[dict]:
            try:
                result = self.supabase.rpc(
                    "get_available_sessions",
                    {"cohort": cohort_id, "filters": filter_params},
                ).execute()
                return result.data or []
            except Exception as exc:
                logger.warning(
                    "RPC get_available_sessions failed for filter %s: %s",
                    filter_params,
                    exc,
                )
                return []

        def _normalize_session(row: dict) -> str | None:
            # Fix 1 / Fix 4: new-schema RPC rows may use 'title' instead of 'session'.
            # Use whichever key is present so the row is not silently dropped.
            return row.get("session") or row.get("title") or None

        if mode == "Notes Creator":
            # Fix 1: call RPC twice — once with legacy filter, once with new schema filter —
            # then merge and deduplicate on the session value.
            legacy_rows = _call_rpc({"content_type": "recording_transcript"})
            new_schema_rows = _call_rpc({"section": "recording"})

            seen: set[str] = set()
            sessions: list[str] = []
            for row in legacy_rows + new_schema_rows:
                session = _normalize_session(row)
                if session and session not in seen:
                    seen.add(session)
                    sessions.append(session)

            logger.info(
                "Notes Creator get_available_lectures: %d sessions after dual-schema merge "
                "(legacy=%d, new=%d)",
                len(sessions),
                len(legacy_rows),
                len(new_schema_rows),
            )
            return sessions

        elif mode == "Pre-Read":
            rows = _call_rpc({"section": "pre_read"})

            # Fix 4: apply the same title-to-session fallback so pre-read sessions are not
            # silently dropped when the RPC returns 'title' instead of 'session'.
            seen: set[str] = set()
            sessions: list[str] = []
            for row in rows:
                session = _normalize_session(row)
                if session and session not in seen:
                    seen.add(session)
                    sessions.append(session)

            logger.info("Pre-Read get_available_lectures: %d sessions", len(sessions))
            return sessions

        else:
            # Study / Quiz — existing behaviour unchanged.
            rows = _call_rpc({})
            seen: set[str] = set()
            sessions: list[str] = []
            for row in rows:
                session = _normalize_session(row)
                if session and session not in seen:
                    seen.add(session)
                    sessions.append(session)
            return sessions

    # ------------------------------------------------------------------
    # _prepare_rag_context
    # Fix 2: Notes Creator — dual-schema retrieval with deduplication
    # Fix 3: Pre-Read      — all-stubs detection + system prompt patch
    # Study / Quiz branches are left unchanged.
    # ------------------------------------------------------------------
    def _prepare_rag_context(
        self,
        mode: str,
        query: str,
        lecture_val: str | None,
        cohort_id: str,
        system_prompt: str,
        top_k: int = 10,
    ) -> tuple[list[dict], str]:
        """
        Retrieve, deduplicate, and rerank RAG documents for the given mode.

        Returns:
            (documents, system_prompt)  — system_prompt may be augmented for Pre-Read stubs.
        """

        if mode == "Study":
            # Study mode: handles both schemas via _is_recording_transcript() — DO NOT MODIFY.
            metadata_filter: dict[str, Any] = {}
            if lecture_val:
                metadata_filter["title"] = lecture_val

            raw_docs = self.retrieve_rag_documents(query, metadata_filter, cohort_id, top_k)

            # Deduplication (existing pattern retained)
            seen_ids: set[str] = set()
            documents: list[dict] = []
            for doc in raw_docs:
                doc_id = _get_doc_id(doc)
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    documents.append(doc)

            documents = [d for d in documents if self._is_recording_transcript(d)]
            documents = self._rerank(query, documents)
            return documents, system_prompt

        elif mode == "Quiz":
            # Quiz mode: already works — DO NOT MODIFY.
            metadata_filter = {}
            if lecture_val:
                metadata_filter["title"] = lecture_val

            raw_docs = self.retrieve_rag_documents(query, metadata_filter, cohort_id, top_k)

            seen_ids: set[str] = set()
            documents: list[dict] = []
            for doc in raw_docs:
                doc_id = _get_doc_id(doc)
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    documents.append(doc)

            documents = [d for d in documents if self._is_recording_transcript(d)]
            documents = self._rerank(query, documents)
            return documents, system_prompt

        elif mode == "Notes Creator":
            # Fix 2: remove the single hardcoded content_type filter.
            # Perform two separate retrieve_rag_documents calls and merge with deduplication,
            # following the same _get_doc_id / seen_ids pattern used in Study mode above.
            base_filter: dict[str, Any] = {}
            if lecture_val:
                base_filter["title"] = lecture_val

            # Call 1: legacy schema
            legacy_filter = {**base_filter, "content_type": "recording_transcript"}
            legacy_docs = self.retrieve_rag_documents(query, legacy_filter, cohort_id, top_k)

            # Call 2: new schema
            new_filter = {**base_filter, "section": "recording"}
            new_docs = self.retrieve_rag_documents(query, new_filter, cohort_id, top_k)

            # Merge with deduplication using _get_doc_id (same pattern as Study mode branch)
            seen_ids: set[str] = set()
            documents: list[dict] = []
            for doc in legacy_docs + new_docs:
                doc_id = _get_doc_id(doc)
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    documents.append(doc)

            documents = self._rerank(query, documents)
            logger.info(
                "Notes Creator _prepare_rag_context: %d docs after dual-schema merge+rerank "
                "(legacy=%d, new=%d)",
                len(documents),
                len(legacy_docs),
                len(new_docs),
            )
            return documents, system_prompt

        elif mode == "Pre-Read":
            # section="pre_read" filter is already correct; keep it.
            metadata_filter = {"section": "pre_read"}
            if lecture_val:
                metadata_filter["title"] = lecture_val

            raw_docs = self.retrieve_rag_documents(query, metadata_filter, cohort_id, top_k)

            seen_ids: set[str] = set()
            documents: list[dict] = []
            for doc in raw_docs:
                doc_id = _get_doc_id(doc)
                if doc_id not in seen_ids:
                    seen_ids.add(doc_id)
                    documents.append(doc)

            documents = self._rerank(query, documents)

            # Fix 3: detect when every retrieved document is a stub and patch the system prompt
            # so the AI explicitly directs the student to CoachLMS rather than trying to answer.
            all_stubs = (
                all(
                    (doc.get("metadata") or {}).get("content_type") == "stub_no_content"
                    for doc in documents
                )
                if documents
                else False
            )

            if all_stubs:
                logger.info(
                    "Pre-Read _prepare_rag_context: all %d retrieved docs are stubs; "
                    "appending all-stubs instruction to system prompt",
                    len(documents),
                )
                system_prompt = system_prompt + (
                    "\n\nALL RETRIEVED CONTEXT IS STUB CONTENT: Every pre-read resource for this "
                    "session could not be automatically extracted. Do not attempt to summarize or "
                    "answer subject-matter questions. Instead, tell the student clearly that none "
                    "of the pre-read materials for this session could be automatically processed, "
                    "list the resource titles found (from the 'Resource:' field in each stub), "
                    "and direct them to CoachLMS to access them manually before the session."
                )

            return documents, system_prompt

        else:
            # Fallback for any unrecognised mode.
            metadata_filter = {}
            if lecture_val:
                metadata_filter["title"] = lecture_val
            documents = self.retrieve_rag_documents(query, metadata_filter, cohort_id, top_k)
            documents = self._rerank(query, documents)
            return documents, system_prompt

    # ------------------------------------------------------------------
    # Internal reranker helper
    # ------------------------------------------------------------------
    def _rerank(self, query: str, documents: list[dict]) -> list[dict]:
        if not self.reranker or not documents:
            return documents
        try:
            return self.reranker.rerank(query, documents)
        except Exception as exc:
            logger.warning("Reranker failed, returning unranked documents: %s", exc)
            return documents
