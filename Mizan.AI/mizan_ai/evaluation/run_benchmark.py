import sys
import os

# Ensure the correct path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from mizan_ai.evaluation.evaluator import MizanBenchEvaluator
from mizan_ai.agents.state import GraphState
from mizan_ai.agents.nodes.pre_router_inspector import pre_router_inspector_node
from mizan_ai.agents.nodes.query_normalizer import query_normalizer_node
from mizan_ai.agents.nodes.retriever import retrieve_documents
from langchain_core.messages import HumanMessage
from mizan_ai.services.qdrant_service import qdrant_service

def mock_retrieval_function(query: str):
    state = {"messages": [HumanMessage(content=query)]}
    
    # 1. Pre-Router
    pr_state = pre_router_inspector_node(state)
    state.update(pr_state)
    
    # 2. Normalizer (Deterministic Mock for Benchmarking)
    original_query = state["messages"][-1].content
    pre_router_info = state.get("pre_router_info", {})
    qn_state = {
        "normalized_query": {
            "original_query": original_query,
            "language_hint": pre_router_info.get("language_hint", "en"),
            "canonical_query": original_query,
            "explicit_entities": pre_router_info.get("explicit_entities", {}),
            "inferred_entities": {},
            "search_variants": [original_query],
            "entity_confidence": "high"
        }
    }
    state.update(qn_state)
    
    # 3. Retriever
    ret_state = retrieve_documents(state)
    
    evidence = ret_state.get("evidence", [])
    
    # Print the requested benchmark diagnostics
    print(f"\n[BENCHMARK QUERY]: {query}")
    print("Exact-reference hits:")
    for ev in evidence:
        if "exact_reference" in ev.get("diagnostics", {}).get("retrieval_sources", []):
            print(f"  - {ev.get('document_id')} / {ev.get('chunk_id')}")
    
    print("Dense/Sparse hits (Hybrid):")
    for ev in evidence:
        if "hybrid" in ev.get("diagnostics", {}).get("retrieval_sources", []):
            print(f"  - {ev.get('document_id')} / {ev.get('chunk_id')} | Fusion Score: {ev.get('retrieval_score', 0):.4f}")
            
    print("Reranker ordering:")
    for ev in evidence:
        print(f"  - {ev.get('document_id')} / {ev.get('chunk_id')} | Reranker Score: {ev.get('reranker_score', 0):.4f}")
    
    return evidence

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    # Ensure collection exists before testing
    try:
        qdrant_service._ensure_collection_and_alias()
    except Exception as e:
        print(f"Skipping Qdrant init: {e}")
        
    evaluator = MizanBenchEvaluator(os.path.join(os.path.dirname(__file__), "seed_dataset.json"))
    print("Running baseline benchmark...")
    report = evaluator.run_benchmark(mock_retrieval_function, run_name="baseline_phase1")
    
    print("\n--- Benchmark Results ---")
    print(f"Run Name: {report['run_name']}")
    for k, v in report['overall_metrics'].items():
        print(f"{k}: {v:.4f}")
