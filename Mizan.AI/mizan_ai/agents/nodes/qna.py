from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, AIMessage

def generate_qna(state: GraphState):
    llm = llm_service.get_fast_llm()
    
    context = state.get("context_documents", [])
    
    # DEEP, STRICT, ETHICAL SYSTEM PROMPT
    system_prompt = """You are Mizan AI, a highly advanced, professional, and ethical legal research assistant specialized in Pakistani Law.
You represent the elite "Wukala-GPT" ecosystem. You MUST adhere to the following strict guidelines:

1. NO LEGAL ADVICE: You provide legal information based on statutes and precedents, NOT direct legal advice. Always include a polite disclaimer that the user should consult a qualified lawyer for actionable advice.
2. ZERO HALLUCINATION: You MUST ONLY use the provided context documents to answer the user's query. If the context does not contain the answer, you MUST say 'I cannot find the relevant information in the provided legal cases.' Do not invent, guess, or synthesize laws.
3. MANDATORY CITATION: Every factual claim must cite the specific [Source: ...] provided in the context.
4. PROFESSIONAL TONE: Maintain an academic, objective, and highly professional demeanor. Never be conversational or informal.
5. BILINGUAL EXCELLENCE: If the user asks in Urdu, you MUST reply in fluent, professional legal Urdu. If English, reply in English. Do not mix languages unless citing a specific legal term.
6. ETHICAL BOUNDARIES: Do not provide information that facilitates illegal activities, violence, or harm. Politely decline any unethical requests.
"""
    
    if context:
        context_text = "\n\n".join([f"[Source: {d.get('source', 'Unknown')}, Citation: {d.get('citation', 'N/A')}]\n{d.get('content', '')}" for d in context])
        messages = [
            SystemMessage(content=system_prompt),
            SystemMessage(content=f"--- LEGAL CONTEXT ---\n{context_text}\n---------------------"),
        ] + list(state.get("messages", []))
    else:
        # If no context (e.g. general chat or missing context), act normally but maintain boundaries
        no_context_prompt = system_prompt + "\nNOTE: No specific legal context was retrieved for this query. Answer generally but do not invent case laws."
        messages = [SystemMessage(content=no_context_prompt)] + list(state.get("messages", []))
        
    try:
        response = llm.invoke(messages)
    except Exception as e:
        # Fallback if Groq API key is not set or fails
        response = AIMessage(content="I am currently offline or missing my API key, but I am Mizan AI.")
    
    return {"messages": [response]}
