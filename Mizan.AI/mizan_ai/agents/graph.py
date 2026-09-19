from langgraph.graph import StateGraph, END
from mizan_ai.agents.state import GraphState
from mizan_ai.agents.nodes.pre_router_inspector import pre_router_inspector_node
from mizan_ai.agents.nodes.router import route_query
from mizan_ai.agents.nodes.query_normalizer import query_normalizer_node
from mizan_ai.agents.nodes.retriever import retrieve_documents
from mizan_ai.agents.nodes.qna import generate_qna
from mizan_ai.agents.nodes.summarizer import summarize_documents
from mizan_ai.agents.nodes.security import security_check_node

from mizan_ai.agents.nodes.emergency_intake import emergency_intake_node
from mizan_ai.agents.nodes.analysis import analysis_node
from mizan_ai.agents.nodes.reviewer import review_node
from mizan_ai.agents.nodes.synthesizer import synthesize_node

from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# Initialize SQLite Checkpointer connection
conn = sqlite3.connect("mizan_sessions.db", check_same_thread=False)
memory_saver = SqliteSaver(conn)

def build_graph():
    workflow = StateGraph(GraphState)
    
    workflow.add_node("security_guardrail", security_check_node)
    workflow.add_node("pre_router_inspector", pre_router_inspector_node)
    workflow.add_node("router", route_query)
    workflow.add_node("query_normalizer", query_normalizer_node)
    workflow.add_node("retriever", retrieve_documents)
    workflow.add_node("qna", generate_qna)
    workflow.add_node("summarizer", summarize_documents)
    
    workflow.add_node("emergency_intake", emergency_intake_node)
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("reviewer", review_node)
    workflow.add_node("synthesizer", synthesize_node)
    
    workflow.set_entry_point("router")
    
    def routing_logic(state: GraphState):
        intent = state.get("intent", "LEGAL_QA")
        if intent == "UNSAFE":
            return "emergency_intake"
        elif intent in ["CASUAL", "IRRELEVANT", "INSUFFICIENT_CONTEXT"]:
            return "synthesizer" # Bypass RAG
        else:
            return "retriever" # Bypass query_normalizer for speed
        
    workflow.add_conditional_edges(
        "router",
        routing_logic,
        {
            "emergency_intake": "emergency_intake",
            "retriever": "retriever",
            "synthesizer": "synthesizer"
        }
    )
    
    def post_retrieval_routing(state: GraphState):
        intent = state.get("intent", "LEGAL_QA")
        if intent in ["LEGAL_RESEARCH", "DOCUMENT_ANALYSIS"]:
            return "analysis"
        return "synthesizer" # Fast path for normal queries
        
    workflow.add_conditional_edges(
        "retriever",
        post_retrieval_routing,
        {
            "analysis": "analysis",
            "synthesizer": "synthesizer"
        }
    )
    
    workflow.add_edge("analysis", "reviewer")
    workflow.add_edge("reviewer", "synthesizer")
    workflow.add_edge("synthesizer", END)
    
    workflow.add_edge("emergency_intake", END)
    workflow.add_edge("summarizer", END)
    workflow.add_edge("qna", END)
    
    return workflow.compile(checkpointer=memory_saver)

app_graph = build_graph()
