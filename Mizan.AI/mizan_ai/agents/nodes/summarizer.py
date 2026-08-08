from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, AIMessage

def summarize_documents(state: GraphState):
    llm = llm_service.get_fast_llm()
    
    context = state.get("context_documents", [])
    if not context:
         return {"messages": [AIMessage(content="There are no documents to summarize.")]}
         
    system_prompt = """You are Mizan AI's Elite Legal Summarization Agent. 
    
### 1. STRICT LANGUAGE ISOLATION
- Summarize the documents in the exact language requested by the user's query or the document context. If the user asks in Urdu, provide the summary in pure, professional Nastaliq Urdu.
- 🚫 FATAL ERROR AVOIDANCE: NO Hindi words. NO Russian/Cyrillic characters. Strictly professional Legal Urdu or English.

### 2. ENTERPRISE STRUCTURE
Format your summary professionally using Markdown:
- Use **## Core Legal Principle**
- Use **## Key Facts** (Bullet points)
- Use **## Final Ruling / Conclusion**

### 3. CONSTRAINTS
- Rely ONLY on the provided context. Do not hallucinate external case law.
"""
    
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
