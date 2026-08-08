from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage
import json

def route_query(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"intent": "qna"}
        
    last_message = messages[-1].content
    
    if state.get("is_deep_research"):
        return {"intent": "deep_research"}
        
    prompt = f"""You are a master triage and traffic router for a Legal AI Assistant.
Analyze the user's message and strictly classify it into exactly one of the following intents:
- "emergency": The user is reporting an active crime, physical assault, robbery, domestic violence in progress, or any time-sensitive crisis requiring immediate actionable safety or legal steps (like calling police, preserving evidence, or going to a hospital).
- "qna": General chat, greetings, asking for a password, simple clarification, or queries not requiring case documents. Also use this for translating languages natively.
- "summarize": Explicit requests to summarize a legal document, case file, or contract.
- "deep_research": Explicit requests to conduct deep research on legal precedents or case law.
- "retrieve": Substantive legal queries, questions about specific laws, or queries requiring factual context from the database (e.g. "What is section 498?", "Explain breach of contract").

User Message: "{last_message}"

Return ONLY a valid JSON object matching this structure exactly:
{{
    "intent": "intent_name"
}}
Do not include markdown formatting or any other text.
"""
    try:
        llm = llm_service.get_fast_llm()
        response = llm.invoke([SystemMessage(content=prompt)])
        content = response.content.strip()
        if content.startswith("```json"):
            content = content.replace("```json", "", 1)
        if content.endswith("```"):
            content = content[:-3]
            
        result = json.loads(content.strip())
        intent = result.get("intent", "retrieve")
        
        # Guardrail against hallucinations
        if intent not in ["emergency", "qna", "summarize", "deep_research", "retrieve"]:
            intent = "retrieve"
            
        return {"intent": intent}
    except Exception as e:
        print(f"Router Error: {e}")
        # Default fallback to retrieve for safety
        return {"intent": "retrieve"}
