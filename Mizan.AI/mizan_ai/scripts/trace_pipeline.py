import sys
import os
import json
import asyncio

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mizan_ai.agents.graph import app_graph
from langchain_core.messages import HumanMessage

queries = [
    "What is the punishment for murder under section 302 of PPC?",
    "Explain the concept of bail under Section 497.",
    "Section 489-F dishonour of cheque requirements",
    "Article 199 of the Constitution writ jurisdiction",
    "What are the requirements for arbitration under the Arbitration Act 1940?",
    "Anti-Terrorism Act 1997 section 7 punishments",
    "2024 SCMR 1071 main findings",
    "How does the court treat bail in non-bailable offences?",
    "Mera zameen ka masla hai court me" # Bonus false-premise/urdu test
]

async def trace_query(query):
    print(f"\n{'='*60}")
    print(f"QUERY: {query}")
    print(f"{'='*60}")
    
    state = {"messages": [HumanMessage(content=query)]}
    config = {"configurable": {"thread_id": "trace_123"}}
    
    # We will step through the graph or just invoke and capture state
    try:
        final_state = await asyncio.to_thread(app_graph.invoke, state, config)
        
        intent = final_state.get("intent", "UNKNOWN")
        pre_router = final_state.get("pre_router_info", {})
        norm = final_state.get("normalized_query", {})
        evidence = final_state.get("evidence", [])
        
        print(f"1. INTENT: {intent}")
        print(f"2. EXPLICIT ENTITIES: {pre_router.get('explicit_entities')}")
        print(f"3. INFERRED ENTITIES: {norm.get('inferred_entities')}")
        print(f"4. SEARCH VARIANTS: {norm.get('search_variants')}")
        print(f"5. CANONICAL QUERY: {norm.get('canonical_query')}")
        print(f"6. RETRIEVAL & FUSION:")
        for ev in evidence:
            doc_id = ev.get('document_id')
            chunk_id = ev.get('chunk_id')
            sources = ev.get('diagnostics', {}).get('retrieval_sources', [])
            score = ev.get('retrieval_score', 0)
            reranker = ev.get('reranker_score', 0)
            print(f"   - {doc_id} / {chunk_id} | Sources: {sources} | HybridScore: {score:.4f} | Reranker: {reranker:.4f}")
            
    except Exception as e:
        print(f"Error tracing query: {e}")

async def main():
    for q in queries:
        await trace_query(q)

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    asyncio.run(main())
