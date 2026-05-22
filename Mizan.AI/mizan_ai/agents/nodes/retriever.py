from mizan_ai.agents.state import GraphState
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.services.embedding_service import embedding_service

def retrieve_documents(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"context_documents": []}
        
    query = messages[-1].content
    if "[USER INPUT BEGIN]" in query:
        try:
            query = query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
        except Exception:
            pass
        
    # 1. Embed query
    vectors = embedding_service.embed_text(query)
    
    # 2. Hybrid search in Qdrant
    points = qdrant_service.hybrid_search(
        dense_vector=vectors["dense"],
        sparse_vector=vectors["sparse"],
        limit=5
    )
    
    # 3. Format points into strict context to prevent hallucination
    context_docs = []
    for p in points:
        payload = p.payload or {}
        citation = payload.get("citation", "Unknown Citation")
        court = payload.get("court", "Unknown Court")
        text = payload.get("text", "")
        
        formatted_doc = {
            "source": f"{citation} - {court}",
            "citation": citation,
            "content": text
        }
        context_docs.append(formatted_doc)
        
    return {"context_documents": context_docs}

