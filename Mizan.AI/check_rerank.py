import asyncio
from mizan_ai.agents.nodes.refiner import refine_query
from mizan_ai.agents.nodes.retriever import retrieve_documents
from mizan_ai.agents.state import GraphState
from langchain_core.messages import HumanMessage
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.services.embedding_service import embedding_service

async def main():
    state = {'messages': [HumanMessage(content='what is the punishment of thief?')]}
    
    # Run Refiner
    state = refine_query(state)
    refined = state.get("refined_query")
    print("REFINED QUERY (HyDE):")
    print(refined)
    print("-" * 50)
    
    query = refined
    vectors = embedding_service.embed_text(query)
    
    # 2. Broad Hybrid search in Qdrant (top_k=15)
    points = qdrant_service.hybrid_search(
        dense_vector=vectors["dense"],
        sparse_vector=vectors["sparse"],
        limit=15
    )
    
    if points:
        documents_text = [p.payload.get("text", "") for p in points]
        rerank_scores = embedding_service.rerank_documents(query, documents_text)
        
        # Zip points with their rerank scores and sort descending
        scored_points = list(zip(points, rerank_scores))
        scored_points.sort(key=lambda x: x[1], reverse=True)
        
        print("TOP 5 RESULTS AFTER RERANKING:")
        for i, (p, score) in enumerate(scored_points[:5]):
            payload = p.payload or {}
            citation = payload.get("citation", "Unknown Citation")
            court = payload.get("court", "Unknown Court")
            source_file = payload.get("source_file", "Unknown File")
            
            if citation == "Citation not found" or citation == "Unknown Citation":
                citation = source_file.replace(".pdf", "").replace(".txt", "").replace("_", " ").title()
                
            source_display = citation
            if court != "Unknown Court" and court != "":
                source_display += f" - {court}"
                
            print(f"[{i+1}] Score: {score:.4f} | Source: {source_display}")
            print(f"    Preview: {payload.get('text', '')[:100]}...\n")

if __name__ == "__main__":
    asyncio.run(main())
