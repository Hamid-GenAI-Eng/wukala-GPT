import sys
from mizan_ai.agents.state import GraphState
from mizan_ai.agents.nodes.retriever import retrieve_documents
from langchain_core.messages import HumanMessage

queries = [
    "Explain PPC?",
    "What is CrPC?",
    "PPC kya hai?",
    "Section 489-F PPC kya hai?",
    "Explain Article 199.",
    "What is QSO?",
    "Tell me about Anti-Terrorism Act 1997.",
    "What is JavaScript?"
]

for q in queries:
    state = GraphState(
        messages=[HumanMessage(content=q)],
        intent="LEGAL_QA",
        pre_router_info={},
        normalized_query={},
        evidence=[],
        evidence_status="",
        context_documents=[],
        summary="",
        deep_research_iterations=0,
        is_deep_research=False,
        refined_query="",
        security_status="",
        canned_response="",
        analysis_draft="",
        citations="",
        risk_flags="",
        reviewer_feedback="",
        reviewer_decision="",
        review_iterations=0
    )
    result = retrieve_documents(state)
    has_docs = len(result["evidence"]) > 0
    intent = result.get("intent", "LEGAL_QA")
    
    print(f"--- QUERY: {q}")
    print(f"INTENT: {intent}")
    print(f"DOCS FOUND: {has_docs}")
    if has_docs:
        print(f"EVIDENCE STATUS: {result['evidence_status']}")
        for i, ev in enumerate(result["evidence"]):
            title = ev.get("title", "")
            print(f"  [Doc {i}] Title: {title} | Source: {ev.get('source')} | Score: {ev.get('reranker_score')} | Exact: {'exact_reference' in ev['diagnostics']['retrieval_sources']}")
    print("\n")
