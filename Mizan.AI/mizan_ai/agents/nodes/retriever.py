from mizan_ai.agents.state import GraphState
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.services.embedding_service import embedding_service

def retrieve_documents(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"context_documents": []}
        
    query = state.get("refined_query") or messages[-1].content
    if "[USER INPUT BEGIN]" in query:
        try:
            query = query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
        except Exception:
            pass
        
    # 1. Embed query
    vectors = embedding_service.embed_text(query)
    
    # 2. Broad Hybrid search in Qdrant (top_k=15)
    points = qdrant_service.hybrid_search(
        dense_vector=vectors["dense"],
        sparse_vector=vectors["sparse"],
        limit=15
    )
    
    # 3. Cross-Encoder Reranking
    if points:
        documents_text = [p.payload.get("text", "") for p in points]
        rerank_scores = embedding_service.rerank_documents(query, documents_text)
        
        # Zip points with their rerank scores and sort descending
        scored_points = list(zip(points, rerank_scores))
        scored_points.sort(key=lambda x: x[1], reverse=True)
        
        # Keep only the top 5 absolute best chunks
        points = [p for p, score in scored_points[:5]]
    
    # 4. Format points into strict context to prevent hallucination
    context_docs = []
    for p in points:
        payload = p.payload or {}
        citation = payload.get("citation", "Unknown Citation")
        court = payload.get("court", "Unknown Court")
        source_file = payload.get("source_file", "Unknown File")
        text = payload.get("text", "")
        
        # Fallback to file name if parsing failed to find a standard citation
        if citation == "Citation not found" or citation == "Unknown Citation":
            citation = source_file.replace(".pdf", "").replace(".txt", "").replace("_", " ").title()
            
        source_display = citation
        if court != "Unknown Court":
            source_display += f" - {court}"
            
        formatted_doc = {
            "source": source_display,
            "citation": citation,
            "content": text
        }
        context_docs.append(formatted_doc)
        
    return {"context_documents": context_docs}

