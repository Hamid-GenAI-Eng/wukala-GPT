from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage

def analysis_node(state: GraphState):
    messages = state.get("messages", [])
    evidence = state.get("evidence", [])
    context_docs = state.get("context_documents", [])
    
    # Use evidence if available, else fallback to context_documents
    items = evidence if evidence else context_docs
    
    context_text = ""
    for i, item in enumerate(items):
        source = item.get("source") or item.get("document_id") or "Unknown Source"
        text = item.get("text") or item.get("content") or ""
        context_text += f"--- Document {i+1} [{source}] ---\n{text}\n\n"
        
    evidence_status = state.get("evidence_status", "UNKNOWN")
    
    system_prompt = f"""You are Mizan AI's Elite Factual & Legal Analysis Agent.
Your job is to read the user's query and the retrieved context documents, and synthesize a rigorous legal analysis.
DO NOT provide an executive summary, and DO NOT provide next steps. Just the core analysis.

Evidence Status for this query is: {evidence_status}
If Evidence Status is NO_EVIDENCE or if the retrieved documents do not contain the answer, you MUST state exactly: "insufficient authority in retrieved sources" and refuse to answer. Do NOT guess or use general knowledge.

You must reason internally from the retrieved evidence. Determine and output the following sections based ONLY on the evidence:
**Legal Issue(s):** State the specific legal question clearly.
**Applicable Legislation/Sections:** List the applicable statutory laws retrieved from the context.
**Relevant Cases/Principles:** List precedents and legal principles from the context.
**Application to Facts:** Apply the rules you just identified to the specific facts mentioned by the user.
**Exceptions/Limitations:** Any exceptions or conflicting authorities noted in the context.

CRITICAL INSTRUCTION: Never print a citation marker without a real matching source from the Retrieved Context. DO NOT invent or hallucinate citations under any circumstances.

Retrieved Context:
{context_text}
"""

    try:
        llm = llm_service.get_reasoning_llm()
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            *messages
        ])
        
        # Build the citations block
        citations_text = ""
        if items:
            for i, item in enumerate(items):
                source = item.get("source") or item.get("document_id") or "Unknown"
                citations_text += f"[{i+1}] Source: {source}\n"
        else:
            citations_text = "No specific documents were retrieved for this query."
        
        # We store the draft in state, we do NOT append it to messages yet.
        return {
            "analysis_draft": response.content,
            "citations": citations_text
        }
        
    except Exception as e:
        print(f"Analysis Node Error: {e}")
        return {"analysis_draft": "Error generating legal analysis."}
