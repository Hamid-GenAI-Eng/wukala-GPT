from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, AIMessage

def summarize_documents(state: GraphState):
    llm = llm_service.get_fast_llm()
    
    context = state.get("context_documents", [])
    if not context:
         return {"messages": [AIMessage(content="There are no documents to summarize.")]}
         
    system_prompt = """You are Mizan AI's Summarization Agent. 
    Take the provided legal texts and summarize them into easy-to-understand bullet points.
    Highlight the core legal principle and the ruling. Do not hallucinate."""
    
    context_text = "\n\n".join([f"Case: {d['source']}\nText: {d['content']}" for d in context])
    
    messages = [
        SystemMessage(content=system_prompt),
        SystemMessage(content=f"Documents to summarize:\n{context_text}"),
    ]
    
    try:
        response = llm.invoke(messages)
    except Exception as e:
        response = AIMessage(content="Summary failed due to API configuration issues.")
    
    return {"messages": [response]}
