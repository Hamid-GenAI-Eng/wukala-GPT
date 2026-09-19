import json
from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

def synthesize_node(state: GraphState):
    verified_analysis = state.get("analysis_draft", "")
    citations = state.get("citations", "")
    user_messages = state.get("messages", [])
    intent = state.get("intent", "LEGAL_QA")
    language_hint = state.get("pre_router_info", {}).get("language_hint", "en")
    evidence_status = state.get("evidence_status", "UNKNOWN")
    
    original_query = ""
    if user_messages:
        original_query = user_messages[-1].content
        if "[USER INPUT BEGIN]" in original_query:
            try:
                original_query = original_query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
            except:
                pass
                
    # Fast path for CASUAL and IRRELEVANT
    if intent == "CASUAL":
        ans = "Wa Alaikum Assalam. How may I assist you with your legal matter today?" if "ur" in language_hint or "mixed" in language_hint else "Hello! How may I assist you with your legal matter today?"
        resp_json = {
            "answer": ans,
            "language": language_hint,
            "intent": intent,
            "evidence_status": "N/A",
            "citations": [],
            "sources": [],
            "confidence": "high"
        }
        return {"messages": [AIMessage(content=json.dumps(resp_json))]}
    
    if intent == "IRRELEVANT":
        ans = "**This query appears to fall outside legal assistance.**\n\nMizanAI is designed for legal research, Pakistani laws, case analysis, legal drafting, procedural guidance and related legal questions.\n\nYou can ask me a legal question and I’ll assist you."
        resp_json = {
            "answer": ans,
            "language": "en",
            "intent": intent,
            "evidence_status": "N/A",
            "citations": [],
            "sources": [],
            "confidence": "high"
        }
        return {"messages": [AIMessage(content=json.dumps(resp_json))]}

    system_prompt = f"""You are MizanAI's Elite Synthesis and Executive Reporting Agent.
You are tasked with generating the final, premium formatted response for a Pakistani Legal query.

Original Query: "{original_query}"
Preferred Language: {language_hint} (en = English, ur = Urdu, roman_ur = Roman Urdu, mixed = Mixed)
Intent: {intent}
Evidence Status: {evidence_status}

CRITICAL RULES FOR EVIDENCE HANDLING:
Depending on the Evidence Status, you must adapt your response mode:
- MODE A (SUFFICIENT): Generate a fully evidence-grounded answer with verified citations from the Available Citations.
- MODE B (LIMITED): The retrieved material provides some context but may be incomplete. Still answer the user's legal question. Generate a useful general legal explanation, clearly separating what is supported by the retrieved sources. Qualify uncertainty professionally (e.g., "The currently retrieved material provides limited direct statutory authority...").
- MODE C (NO_EVIDENCE): If the query asks about a general legal concept (e.g., "What is bail?"), provide a safe, high-level legal overview. You MUST include this blockquote: "> **General Legal Guidance**\n> The explanation below is a general legal overview. I could not verify a specific authority from the currently available MizanAI legal corpus." 
  HOWEVER, if the query asks for a specific authority (e.g., "Explain PLD 2025 SC 999"), do NOT invent it. State clearly: "# Authority Not Verified\n\nI could not verify this authority in the currently available legal sources. If you provide the judgment or citation details, I can analyze it directly."

CRITICAL ANTI-HALLUCINATION RULE:
NEVER FABRICATE LEGAL AUTHORITY. Even when providing a general answer, do not invent case citations, judgment names, statutory sections, court holdings, dates, or quotations.
You are EXCLUSIVELY a Pakistani Legal AI. Always interpret ambiguous acronyms (e.g., PPC, CrPC, CPC, FIR) in the context of Pakistani law (Pakistan Penal Code, Code of Criminal Procedure, etc.). NEVER provide non-legal, marketing, or general internet definitions (e.g., do NOT explain "Pay-per-click" for PPC).

RULES & CONSTRAINTS:
1. Preserve Language: Respond primarily in the preferred language. For Mixed or Roman Urdu, write cleanly. ALWAYS preserve English legal terminology. Do not translate statutory citations.
2. Premium Formatting: Use Markdown consistently. Use `#` and `##` for hierarchy, `**bold**` for terms, blockquotes for key conclusions, and bullet points. Avoid walls of text. Do NOT use emojis. Do NOT include JSON keys inside the markdown `answer`.
3. Adaptive Formatting: 
   - For a Simple Legal Question: ## Overview, ## Key Areas, ## Practical Meaning.
   - For a Complex Legal Problem: ## Executive View (with blockquote), ## Relevant Legal Framework, ## Key Considerations, ## Application, ## Recommended Next Steps.
4. Citation Rules: Every important proposition must be traceable to the provided citations. DO NOT invent a case name if it is not provided.
5. Adaptive Length: Answer quality > length. Avoid giant walls of text.
6. Markdown Output ONLY: You must return the final answer as pure Markdown text. Do NOT wrap it in a JSON object.

Internal Reasoning Result (from previous step):
{verified_analysis}

Available Citations / Authorities:
{citations}
"""

    reviewer_feedback = state.get("reviewer_feedback", "")
    if reviewer_feedback:
        system_prompt += f"\n\nCRITICAL FEEDBACK FROM OPPOSING COUNSEL:\n{reviewer_feedback}\n\nYou MUST rewrite the final output to address and correct this flaw."

    # Deduplicate sources from evidence
    evidence_list = state.get("evidence", [])
    sources_list = []
    for ev in evidence_list:
        src = ev.get("citation") or ev.get("title") or ev.get("source")
        if src and src not in sources_list:
            sources_list.append(src)

    try:
        llm = llm_service.get_reasoning_llm()
        msgs = [SystemMessage(content=system_prompt)]
        
        response = llm.invoke(msgs)
        answer_md = response.content
        
        # Clean potential think tags
        import re
        answer_md = re.sub(r'<think>.*?</think>', '', answer_md, flags=re.DOTALL).strip()
        
        # Strip markdown code blocks if the LLM wrapped it in ```markdown
        if answer_md.startswith("```markdown"):
            answer_md = answer_md[11:]
        elif answer_md.startswith("```"):
            answer_md = answer_md[3:]
        if answer_md.endswith("```"):
            answer_md = answer_md[:-3]
        answer_md = answer_md.strip()

        if not answer_md:
            raise ValueError("LLM returned empty response")
            
        final_json = {
            "answer": answer_md,
            "language": language_hint,
            "intent": intent,
            "evidence_status": evidence_status,
            "citations": sources_list,
            "sources": sources_list,
            "confidence": "high"
        }
                
        return {"messages": [AIMessage(content=json.dumps(final_json))]}
        
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"SYNTHESIZER_ERROR: {type(e).__name__} - {e}")
        
        # Fallback Prompt Generation
        try:
            fallback_prompt = f"""User Question: {original_query}
Instruction: Provide a concise professional legal answer based ONLY on the evidence below. Do not invent citations. Return Markdown only.
Evidence: {citations}
"""
            fallback_llm = llm_service.get_fast_llm()
            fallback_resp = fallback_llm.invoke([HumanMessage(content=fallback_prompt)])
            fallback_md = re.sub(r'<think>.*?</think>', '', fallback_resp.content, flags=re.DOTALL).strip()
            
            final_json = {
                "answer": fallback_md,
                "language": language_hint,
                "intent": intent,
                "evidence_status": evidence_status,
                "citations": sources_list,
                "sources": sources_list,
                "confidence": "medium"
            }
            return {"messages": [AIMessage(content=json.dumps(final_json))]}
        except Exception as fallback_e:
            logger.error(f"FALLBACK_ERROR: {type(fallback_e).__name__} - {fallback_e}")
            final_json = {
                "answer": "An error occurred while synthesizing the legal response. Please try again.",
                "language": language_hint,
                "intent": intent,
                "evidence_status": evidence_status,
                "citations": [],
                "sources": [],
                "confidence": "low"
            }
            return {"messages": [AIMessage(content=json.dumps(final_json))]}
