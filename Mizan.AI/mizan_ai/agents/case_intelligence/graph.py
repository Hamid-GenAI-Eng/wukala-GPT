from langgraph.graph import StateGraph, END
from mizan_ai.agents.case_intelligence.state import CaseIntelligenceState
from mizan_ai.agents.case_intelligence.nodes import extract_facts, spot_issues, retrieve_precedents, synthesize_strategy, extract_urdu_facts_node
from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# Initialize SQLite Checkpointer connection
conn = sqlite3.connect("mizan_sessions.db", check_same_thread=False)
memory_saver = SqliteSaver(conn)

def build_case_intelligence_graph():
    workflow = StateGraph(CaseIntelligenceState)
    
    workflow.add_node("urdu_fact_extractor", extract_urdu_facts_node)
    workflow.add_node("fact_extractor", extract_facts)
    workflow.add_node("issue_spotter", spot_issues)
    workflow.add_node("precedent_retriever", retrieve_precedents)
    workflow.add_node("synthesizer", synthesize_strategy)
    
    workflow.set_entry_point("urdu_fact_extractor")
    
    workflow.add_edge("urdu_fact_extractor", "fact_extractor")
    workflow.add_edge("fact_extractor", "issue_spotter")
    workflow.add_edge("issue_spotter", "precedent_retriever")
    workflow.add_edge("precedent_retriever", "synthesizer")
    workflow.add_edge("synthesizer", END)
    
    return workflow.compile(checkpointer=memory_saver)

ci_graph = build_case_intelligence_graph()
