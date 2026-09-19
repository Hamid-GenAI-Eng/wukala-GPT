import logging
import re
from typing import List, Dict, Any
from mizan_ai.agents.state import GraphState
from mizan_ai.services.qdrant_service import qdrant_service
from qdrant_client import models
from mizan_ai.services.embedding_service import embedding_service
from mizan_ai.core.config import settings

logger = logging.getLogger(__name__)

LEGAL_ALIASES = {
    "ppc": "Pakistan Penal Code, 1860",
    "crpc": "Code of Criminal Procedure, 1898",
    "cpc": "Code of Civil Procedure, 1908",
    "qso": "Qanun-e-Shahadat Order, 1984",
    "ata": "Anti-Terrorism Act, 1997",
    "fca": "Family Courts Act, 1964",
    "constitution": "Constitution of the Islamic Republic of Pakistan, 1973"
}

def _detect_aliases(query: str) -> List[str]:
    detected = []
    q_lower = query.lower()
    for alias, full_name in LEGAL_ALIASES.items():
        if re.search(r'\b' + alias + r'\b', q_lower):
            detected.append(full_name)
    return detected

def retrieve_documents(state: GraphState):
    normalized_query = state.get("normalized_query", {})
    messages = state.get("messages", [])
    original_query = ""
    if messages:
        original_query = messages[-1].content
        if "[USER INPUT BEGIN]" in original_query:
            try:
                original_query = original_query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
            except:
                pass

    detected_statutes = _detect_aliases(original_query)

    if not normalized_query:
        normalized_query = {
            "canonical_query": original_query,
            "search_variants": [original_query],
            "explicit_entities": {}
        }
        
    explicit_entities = normalized_query.get("explicit_entities", {})
    search_variants = normalized_query.get("search_variants", [normalized_query.get("canonical_query")])
    if not search_variants:
        search_variants = [normalized_query.get("canonical_query")]
        
    is_deep_research = state.get("is_deep_research", False)
    
    # Cap limits for normal queries to save latency
    top_k_initial = settings.TOP_K_INITIAL if is_deep_research else 10
    top_k_rerank = settings.TOP_K_RERANK if is_deep_research else 5
        
    # Inject detected statutes as search variants and explicit entities
    for stat in detected_statutes:
        if stat not in search_variants:
            search_variants.append(stat)
        if "canonical_references" not in explicit_entities:
            explicit_entities["canonical_references"] = []
        # Add only if not already present
        if not any(ref.get("canonical_key") == stat for ref in explicit_entities["canonical_references"]):
            explicit_entities["canonical_references"].append({"canonical_key": stat})
            
    # Restrict variants for normal Q&A
    if not is_deep_research and len(search_variants) > 2:
        search_variants = search_variants[:2]
            
    all_candidates: Dict[str, Dict[str, Any]] = {} # Deduplication dictionary keyed by point_id
    
    # 1. Exact Reference Search
    exact_queries = []
    exact_queries.extend(explicit_entities.get("citations", []))
    exact_queries.extend(explicit_entities.get("sections", []))
    
    if explicit_entities:
        exact_conditions = []
        canonical_refs = explicit_entities.get("canonical_references", [])
        canonical_keys = [ref["canonical_key"] for ref in canonical_refs if "canonical_key" in ref]
        
        if canonical_keys:
            exact_conditions.append(
                models.FieldCondition(
                    key="canonical_references",
                    match=models.MatchAny(any=canonical_keys)
                )
            )
            # Also check the document title
            exact_conditions.append(
                models.FieldCondition(
                    key="title",
                    match=models.MatchAny(any=canonical_keys)
                )
            )
            
        if exact_conditions:
            try:
                res = qdrant_service.client.scroll(
                    collection_name=qdrant_service.alias_name,
                    scroll_filter=models.Filter(should=exact_conditions),
                    limit=top_k_initial,
                    with_payload=True
                )
                for point in res[0]:
                    pid = str(point.id)
                    if pid not in all_candidates:
                        all_candidates[pid] = {
                            "payload": point.payload,
                            "matched_query_variants": ["exact_reference"],
                            "retrieval_sources": ["exact_reference"],
                            "fusion_score": 1.0 # Max score for exact match
                        }
                    else:
                        if "exact_reference" not in all_candidates[pid]["retrieval_sources"]:
                            all_candidates[pid]["retrieval_sources"].append("exact_reference")
            except Exception as e:
                logger.error(f"Exact Retrieval Error: {e}")
                
    # 2. Parallel Batched Hybrid Search
    valid_variants = [v for v in search_variants if v.strip()]
    if valid_variants:
        vectors_list = embedding_service.embed_texts(valid_variants)
        
        for variant, vectors in zip(valid_variants, vectors_list):
            hybrid_points = qdrant_service.hybrid_search(
                dense_vector=vectors["dense"],
                sparse_vector=vectors["sparse"],
                limit=top_k_initial
            )
            
            for point in hybrid_points:
                pid = str(point.id)
                if pid not in all_candidates:
                    all_candidates[pid] = {
                        "payload": point.payload,
                        "matched_query_variants": [variant],
                        "retrieval_sources": ["hybrid"],
                        "fusion_score": point.score
                    }
                else:
                    if variant not in all_candidates[pid]["matched_query_variants"]:
                        all_candidates[pid]["matched_query_variants"].append(variant)
                    if "hybrid" not in all_candidates[pid]["retrieval_sources"]:
                        all_candidates[pid]["retrieval_sources"].append("hybrid")
                    # Boost fusion score if found by multiple variants
                    all_candidates[pid]["fusion_score"] += (point.score * 0.1)

    # 3. Cross-Encoder Reranking
    candidates_list = [{"id": pid, **data} for pid, data in all_candidates.items()]
    
    if candidates_list:
        try:
            # OPTIMIZATION: Cap the number of candidates sent to the CPU-bound Cross-Encoder
            candidates_list.sort(key=lambda x: x["fusion_score"], reverse=True)
            candidates_list = candidates_list[:12]
            
            documents_text = [c["payload"].get("text", "") for c in candidates_list]
            # Use canonical query for reranking to ensure English alignment
            canonical = normalized_query.get("canonical_query", search_variants[0])
            rerank_scores = embedding_service.rerank_documents(canonical, documents_text)
            
            for idx, candidate in enumerate(candidates_list):
                # If it's an exact reference, don't let reranker downrank it to oblivion
                if "exact_reference" in candidate["retrieval_sources"]:
                    candidate["reranker_score"] = max(rerank_scores[idx], 0.8)
                else:
                    candidate["reranker_score"] = rerank_scores[idx]
                
            # Sort by reranker score descending
            candidates_list.sort(key=lambda x: x["reranker_score"], reverse=True)
            
            # Keep Top K
            candidates_list = candidates_list[:top_k_rerank]
            
        except Exception as e:
            logger.error(f"CRITICAL RERANKER FAILURE: {e}")
            raise Exception("Cross-Encoder Reranking failed. Aborting retrieval to prevent hallucinated results.") from e
            
    # 3.5 Broad Statute Fallback
    # If no useful evidence was found but a known statute was detected, fetch broad statute material
    if (not candidates_list or max([c["reranker_score"] for c in candidates_list] + [0.0]) < 0.3) and detected_statutes:
        logger.info(f"Triggering Broad Statute Fallback for: {detected_statutes}")
        fallback_conditions = []
        for stat in detected_statutes:
            # We want to match either title or source_file for the broad statute
            fallback_conditions.append(
                models.FieldCondition(
                    key="title",
                    match=models.MatchAny(any=[stat])
                )
            )
        try:
            fallback_vectors = embedding_service.embed_text(normalized_query.get("canonical_query", original_query))
            res = qdrant_service.client.query_points(
                collection_name=qdrant_service.alias_name,
                query=fallback_vectors["dense"],
                using="dense",
                query_filter=models.Filter(should=fallback_conditions),
                limit=5,
                with_payload=True
            )
            for point in res.points:
                pid = str(point.id)
                # Only add if not already in candidates to avoid dupes
                if not any(c["id"] == pid for c in candidates_list):
                    candidates_list.append({
                        "id": pid,
                        "payload": point.payload,
                        "matched_query_variants": ["fallback"],
                        "retrieval_sources": ["exact_reference"], # Treat as exact for scoring
                        "fusion_score": 0.8,
                        "reranker_score": 0.8
                    })
        except Exception as e:
            logger.error(f"Fallback Retrieval Error: {e}")

    # 4. Construct Structured Evidence Objects
    evidence_list = []
    for rank, candidate in enumerate(candidates_list):
        payload = candidate["payload"] or {}
        
        evidence = {
            "evidence_id": f"ev_{rank+1}_{candidate['id'][:8]}",
            "document_id": payload.get("source_file", "unknown"),
            "chunk_id": candidate["id"],
            "title": payload.get("title", "Unknown Title"),
            "document_type": payload.get("document_type", "other"),
            "court": payload.get("court"),
            "citation": payload.get("citation"),
            "section": payload.get("section"),
            "chapter": payload.get("chapter"),
            "text": payload.get("text", ""),
            "source": payload.get("source_file", "unknown"),
            "retrieval_score": candidate.get("fusion_score", 0.0),
            "reranker_score": candidate.get("reranker_score", 0.0),
            "authority_score": None, # Will be filled by AuthorityScorer
            "diagnostics": {
                "matched_query_variants": candidate.get("matched_query_variants", []),
                "retrieval_sources": candidate.get("retrieval_sources", [])
            }
        }
        evidence_list.append(evidence)
        
    from mizan_ai.services.authority_scorer import authority_scorer
    evidence_list = authority_scorer.score_evidence(evidence_list)
        
    evidence_status = "NO_EVIDENCE"
    if evidence_list:
        highest_score = max([ev.get("reranker_score", 0.0) for ev in evidence_list])
        has_exact = any("exact_reference" in ev["diagnostics"].get("retrieval_sources", []) for ev in evidence_list)
        
        if has_exact or highest_score >= 0.7:
            evidence_status = "SUFFICIENT"
        elif highest_score >= 0.3:
            evidence_status = "LIMITED"
        else:
            evidence_status = "NO_EVIDENCE"
            
    # Set the intent to STATUTE_QUERY if we triggered fallback
    intent = state.get("intent", "LEGAL_QA")
    if detected_statutes and "exact_reference" in [src for ev in evidence_list for src in ev["diagnostics"].get("retrieval_sources", [])]:
        intent = "STATUTE_QUERY"
            
    return {"evidence": evidence_list, "evidence_status": evidence_status, "intent": intent}
