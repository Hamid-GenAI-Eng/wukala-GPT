import json
from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, HumanMessage

def review_node(state: GraphState):
    drafted_strategy = state.get("messages", [])[-1].content if state.get("messages") else ""
    evidence = state.get("evidence", [])
    context_docs = state.get("context_documents", [])
    items = evidence if evidence else context_docs
    review_iterations = state.get("review_iterations", 0)
    if not items or review_iterations >= 2:
        # Pass immediately if no context to verify against, or max iterations reached
        return {"reviewer_decision": "PASS", "review_iterations": review_iterations + 1}
    
    context_text = ""
    for i, item in enumerate(items):
        source = item.get("source") or item.get("document_id") or "Unknown"
        text = item.get("text") or item.get("content") or ""
        context_text += f"[{i+1}] Source: {source}\nContent: {text}\n\n"
    system_prompt = f"""You are MizanAI's Quality Assurance & Red Team Critic.
Your job is to review the Final Output (which is a JSON string containing the 'answer' field) against the Original Context.

You MUST check these 6 critical points:
1. Are material legal claims supported by the context?
2. Are cited authorities actually present in the context?
3. Did the answer actually address the user's question?
4. Is the user's language preserved?
5. Is there ANY fabricated/hallucinated law or citation?
6. Is the Markdown formatting premium and professional?

Retrieved Context:
{context_text}

Final Output from Synthesizer:
{drafted_strategy}

If ANY of the 6 points fail, you must return "REWRITE_REQUIRED" and specify which point failed.
If all 6 points pass, return "PASS".

Return your response in STRICT JSON format:
{{
    "decision": "PASS | REWRITE_REQUIRED",
    "critique": "If fail, explain EXACTLY which of the 6 points failed and how to fix it. If pass, leave empty."
}}
"""


    try:
        from mizan_ai.core.utils import clean_llm_json
        llm = llm_service.get_reasoning_llm()
        msgs = [SystemMessage(content=system_prompt)]
        
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
                msgs.append(HumanMessage(content="Your response was not valid JSON. Please return STRICT JSON format only, without <think> tags."))
        
        return {
            "reviewer_decision": result.get("decision", "PASS").upper(),
            "reviewer_feedback": result.get("critique", ""),
            "review_iterations": review_iterations + 1
        }
        
    except Exception as e:
        print(f"Review Node Error: {e}")
        return {"reviewer_decision": "PASS", "review_iterations": review_iterations + 1}
