from langgraph.graph import StateGraph, END
from mizan_ai.agents.state import GraphState
from mizan_ai.agents.nodes.router import route_query
from mizan_ai.agents.nodes.retriever import retrieve_documents
from mizan_ai.agents.nodes.qna import generate_qna
from mizan_ai.agents.nodes.summarizer import summarize_documents

from langgraph.checkpoint.sqlite import SqliteSaver
import sqlite3

# Initialize SQLite Checkpointer connection
conn = sqlite3.connect("mizan_sessions.db", check_same_thread=False)
memory_saver = SqliteSaver(conn)

def build_graph():
    workflow = StateGraph(GraphState)
    
    workflow.add_node("router", route_query)
    workflow.add_node("retriever", retrieve_documents)
    workflow.add_node("qna", generate_qna)
    workflow.add_node("summarizer", summarize_documents)
    
    workflow.set_entry_point("router")
    
    def routing_logic(state: GraphState):
        intent = state.get("intent", "qna")
        if intent == "retrieve" or intent == "deep_research":
            return "retriever"
        elif intent == "summarize":
            return "summarizer"
        return "qna"
        
    workflow.add_conditional_edges(
        "router",
        routing_logic,
        {
            "retriever": "retriever",
            "summarizer": "summarizer",
            "qna": "qna"
        }
    )
    
    workflow.add_edge("retriever", "qna")
    workflow.add_edge("summarizer", END)
    workflow.add_edge("qna", END)
    
    return workflow.compile(checkpointer=memory_saver)

app_graph = build_graph()
