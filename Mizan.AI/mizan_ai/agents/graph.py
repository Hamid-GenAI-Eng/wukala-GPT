from langgraph.graph import StateGraph, END
from mizan_ai.agents.state import GraphState
from mizan_ai.agents.nodes.router import route_query
from mizan_ai.agents.nodes.retriever import retrieve_documents
from mizan_ai.agents.nodes.qna import generate_qna
from mizan_ai.agents.nodes.summarizer import summarize_documents
from mizan_ai.agents.nodes.refiner import refine_query
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
    workflow.add_node("router", route_query)
    workflow.add_node("refiner", refine_query)
    workflow.add_node("retriever", retrieve_documents)
    workflow.add_node("qna", generate_qna)
    workflow.add_node("summarizer", summarize_documents)
    
    workflow.add_node("emergency_intake", emergency_intake_node)
    workflow.add_node("analysis", analysis_node)
    workflow.add_node("reviewer", review_node)
    workflow.add_node("synthesizer", synthesize_node)
    
    workflow.set_entry_point("security_guardrail")
    
    def route_after_security(state: GraphState):
        if state.get("security_status") == "blocked":
            return "blocked"
        return "safe"
        
    workflow.add_conditional_edges(
        "security_guardrail",
        route_after_security,
        {
            "blocked": END,
            "safe": "router"
        }
    )
    
    def routing_logic(state: GraphState):
        intent = state.get("intent", "qna")
        if intent == "emergency":
            return "emergency_intake"
        elif intent == "retrieve" or intent == "deep_research":
            return "refiner"
        elif intent == "summarize":
            return "summarizer"
        return "qna"
        
    workflow.add_conditional_edges(
        "router",
        routing_logic,
        {
            "emergency_intake": "emergency_intake",
            "refiner": "refiner",
            "summarizer": "summarizer",
            "qna": "qna"
        }
    )
    
    workflow.add_edge("refiner", "retriever")
    
    # The B2B Multi-Agent RAG Pipeline
    workflow.add_edge("retriever", "analysis")
    workflow.add_edge("analysis", "synthesizer")
    workflow.add_edge("synthesizer", "reviewer")
    
    def route_after_review(state: GraphState):
        if state.get("reviewer_decision") == "fail":
            return "synthesizer"
        return "end"
        
    workflow.add_conditional_edges(
        "reviewer",
        route_after_review,
        {
            "synthesizer": "synthesizer",
            "end": END
        }
    )
    
    workflow.add_edge("emergency_intake", END)
    workflow.add_edge("summarizer", END)
    workflow.add_edge("qna", END)
    
    return workflow.compile(checkpointer=memory_saver)

app_graph = build_graph()
