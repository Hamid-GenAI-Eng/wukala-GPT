from mizan_ai.agents.state import GraphState

def route_query(state: GraphState):
    # In a real app, use the LLM to classify intent
    # Here we mock it based on user input or state flags
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "qna"}
        
    last_message = messages[-1].content.lower()
    
    if state.get("is_deep_research"):
        return {"intent": "deep_research"}
        
    if "summarize" in last_message:
        return {"intent": "summarize"}
        
    if "search" in last_message or "case law" in last_message:
        return {"intent": "retrieve"}
        
    return {"intent": "qna"}
