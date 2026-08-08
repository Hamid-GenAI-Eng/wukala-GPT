import json
from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage

def review_node(state: GraphState):
    drafted_strategy = state.get("messages", [])[-1].content if state.get("messages") else ""
    context_docs = state.get("context_documents", [])
    review_iterations = state.get("review_iterations", 0)
    
    if not context_docs or review_iterations >= 3:
        # Pass immediately if no context to verify against, or max iterations reached
        return {"reviewer_decision": "pass", "review_iterations": review_iterations + 1}
    
    context_text = ""
    for i, doc in enumerate(context_docs):
        context_text += f"[{i+1}] Source: {doc.get('metadata', {}).get('source', 'Unknown')}\nContent: {doc.get('content')}\n\n"
        
    system_prompt = f"""You are an elite Opposing Counsel and Red Team Critic.
Your job is to ruthlessly review the Drafted Strategy against the Original Context.
You must find ONE factual contradiction, hallucinated law, or logical flaw in the drafted strategy based ONLY on the retrieved context.

Retrieved Context:
{context_text}

Drafted Strategy:
{drafted_strategy}

Return your response in STRICT JSON format:
{{
    "decision": "pass" | "fail",
    "critique": "If fail, explain the exact flaw and how to fix it. If pass, leave empty."
}}
"""

    try:
        llm = llm_service.get_reasoning_llm()
        response = llm.invoke([SystemMessage(content=system_prompt)])
        
        # Clean JSON from response (handle markdown blocks)
        content = response.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        result = json.loads(content)
        
        return {
            "reviewer_decision": result.get("decision", "pass").lower(),
            "reviewer_feedback": result.get("critique", ""),
            "review_iterations": review_iterations + 1
        }
        
    except Exception as e:
        print(f"Review Node Error: {e}")
        return {"reviewer_decision": "pass", "review_iterations": review_iterations + 1}
