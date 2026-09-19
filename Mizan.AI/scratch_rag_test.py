import os
import json
from dotenv import load_dotenv

load_dotenv()

def step1_refiner(query):
    print("--- STEP 1: REFINER ---")
    try:
        from mizan_ai.agents.nodes.refiner import refine_query
        from mizan_ai.agents.state import GraphState
        from langchain_core.messages import HumanMessage
        
        state = {"messages": [HumanMessage(content=query)]}
        result = refine_query(state)
        print(f"Original: {query}")
        print(f"Refined (HyDE): {result.get('refined_query')}\n")
        return result.get('refined_query')
    except Exception as e:
        print(f"Error in refiner: {e}\n")
        return query

def step2_qdrant_ppc():
    print("--- STEP 2: QDRANT RAW PPC CHUNKS ---")
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.http.models import Filter, FieldCondition, MatchText
        
        client = QdrantClient(host=os.getenv("QDRANT_HOST", "localhost"), port=int(os.getenv("QDRANT_PORT", 6333)))
        
        # We need to find PPC Sec 378/379. 
        # Since we don't know the exact metadata values, we can do a scroll with full text match.
        results, _ = client.scroll(
            collection_name="legal_corpus",
            scroll_filter=Filter(
                must=[
                    FieldCondition(
                        key="text",
                        match=MatchText(text="378")
                    )
                ]
            ),
            limit=5,
            with_payload=True
        )
        
        print(f"Found {len(results)} chunks matching '378'")
        for i, res in enumerate(results):
            text = res.payload.get("text", "")
            # Only print if it looks like PPC
            if "theft" in text.lower() or "whoever" in text.lower() or "penal code" in text.lower():
                print(f"CHUNK {i+1} SOURCE: {res.payload.get('source_file')}")
                print(f"TEXT:\n{text[:500]}...\n")
                
    except Exception as e:
        print(f"Error in Qdrant search: {e}\n")

def step4_retrieval(query, refined_query):
    print("--- STEP 4 & 5: RETRIEVAL PIPELINE ---")
    try:
        from mizan_ai.services.embedding_service import embedding_service
        from mizan_ai.services.qdrant_service import qdrant_service
        
        target_query = refined_query or query
        print(f"Embedding query: {target_query}")
        
        vectors = embedding_service.embed_text(target_query)
        
        points = qdrant_service.hybrid_search(
            dense_vector=vectors["dense"],
            sparse_vector=vectors["sparse"],
            limit=15
        )
        
        print("\n(a) TOP 15 RAW HYBRID SEARCH RESULTS (BEFORE RERANKING):")
        documents_text = []
        for i, p in enumerate(points):
            text = p.payload.get("text", "")
            source = p.payload.get("source_file", "Unknown")
            print(f"  {i+1}. Score: {p.score} | Source: {source} | Text preview: {text[:80].replace(chr(10), ' ')}...")
            documents_text.append(text)
            
        print("\n(b) CROSS-ENCODER RERANKING:")
        if not points:
            print("No points found to rerank.")
            return
            
        try:
            rerank_scores = embedding_service.rerank_documents(target_query, documents_text)
            scored_points = list(zip(points, rerank_scores))
            scored_points.sort(key=lambda x: x[1], reverse=True)
            
            print("TOP 5 RESULTS AFTER RERANKING:")
            for i, (p, score) in enumerate(scored_points[:5]):
                source = p.payload.get("source_file", "Unknown")
                print(f"  {i+1}. Rerank Score: {score} | Source: {source} | Text preview: {p.payload.get('text', '')[:80].replace(chr(10), ' ')}...")
        except Exception as rerank_e:
            print(f"RERANKER FAILED/EXCEPTION: {rerank_e}")
            
    except Exception as e:
        print(f"Error in retrieval pipeline: {e}\n")

if __name__ == "__main__":
    query = "what is the punishment of thief?"
    refined = step1_refiner(query)
    step2_qdrant_ppc()
    step4_retrieval(query, refined)
