from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage
import json

def route_query(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "qna"}
        
    last_message = messages[-1].content
    text_lower = last_message.lower().strip()
    
    # Deterministic Greetings bypass
    greetings = {"hi", "hello", "hey", "aoa", "salam", "assalam o alaikum", "السلام علیکم"}
    if text_lower in greetings:
        return {"intent": "CASUAL"}
    
    if state.get("is_deep_research"):
        return {"intent": "deep_research"}
        
    prompt = f"""You are a master triage and traffic router for MizanAI, a Pakistani Legal AI Assistant.
Analyze the user's message and strictly classify it into exactly ONE of the following intents:

- LEGAL_QA: General legal questions and explanations of law.
- LEGAL_RESEARCH: Deep research into legal precedents or case law.
- DOCUMENT_SUMMARY: Explicit requests to summarize a legal document.
- DOCUMENT_ANALYSIS: Analyzing a contract or legal document for risks/clauses.
- LEGAL_DRAFTING: Drafting legal documents, notices, or contracts.
- PROCEDURAL_GUIDANCE: Questions about court procedures, filing, or next steps.
- CASE_LAW_QUERY: Querying specific legal cases or judgments.
- STATUTE_QUERY: Querying specific acts, sections, or articles of the constitution.
- CASUAL: Casual conversation, greetings (e.g., "Assalam-o-Alaikum"), thanks, or chitchat.
- IRRELEVANT: Queries entirely unrelated to law (e.g., weather, sports, coding).
- UNSAFE: Emergencies, active crimes, or requests to do something illegal.
- INSUFFICIENT_CONTEXT: The query is too short or vague to understand what is being asked.

User Message: "{last_message}"

Return ONLY a valid JSON object matching this structure exactly:
{{
    "intent": "intent_name"
}}
Do not include markdown formatting or any other text.
"""
    try:
        from mizan_ai.core.utils import clean_llm_json
        from langchain_core.messages import HumanMessage
        llm = llm_service.get_fast_llm()
        
        msgs = [SystemMessage(content=prompt)]
        result = None
        for attempt in range(2):
            response = llm.invoke(msgs)
            try:
                result = clean_llm_json(response.content)
                break
            except ValueError:
                if attempt == 1:
                    raise
                msgs.append(response)
                msgs.append(HumanMessage(content="Your response was not valid JSON. Please return ONLY a valid JSON object matching the exact requested structure, with no extra text or tags."))
                
        intent = result.get("intent", "LEGAL_QA").upper()
        
        # Guardrail against hallucinations
        valid_intents = [
            "LEGAL_QA", "LEGAL_RESEARCH", "DOCUMENT_SUMMARY", "DOCUMENT_ANALYSIS", 
            "LEGAL_DRAFTING", "PROCEDURAL_GUIDANCE", "CASE_LAW_QUERY", "STATUTE_QUERY", 
            "CASUAL", "IRRELEVANT", "UNSAFE", "INSUFFICIENT_CONTEXT"
        ]
        if intent not in valid_intents:
            intent = "LEGAL_QA"
            
        return {"intent": intent}
    except Exception as e:
        print(f"Router Error: {e}")
        # Default fallback to LEGAL_QA for safety
        return {"intent": "LEGAL_QA"}
