from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage

def analysis_node(state: GraphState):
    messages = state.get("messages", [])
    context_docs = state.get("context_documents", [])
    
    context_text = ""
    for i, doc in enumerate(context_docs):
        meta = doc.get("metadata", {})
        source = meta.get("source", "Unknown Source")
        context_text += f"--- Document {i+1} [{source}] ---\n{doc.get('content')}\n\n"
        
    system_prompt = f"""You are Mizan AI's Elite Factual & Legal Analysis Agent.
Your job is to read the user's query and the retrieved context documents, and synthesize a rigorous legal analysis.
DO NOT provide an executive summary, and DO NOT provide next steps. Just the core analysis.

You must structure your response strictly using the IRAC methodology:
**Issue Identification:**
State the specific legal question clearly in 1-2 sentences.

**Relevant Authority (The Rule):**
List the applicable statutory laws, regulations, and case precedents retrieved from the context.
You MUST rely only on the provided context. If the context is empty, explicitly state that general knowledge is being used.

**Application to Facts:**
Apply the rules you just identified to the specific facts mentioned by the user. 
Be highly logical and objective.

CRITICAL INSTRUCTION: If the user asks about a specific case law, precedent, or statute that is NOT explicitly present in the Retrieved Context, you MUST explicitly state: "I cannot verify this precedent as no specific record was found in the retrieved context." DO NOT hallucinate case facts.

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
        if context_docs:
            for i, doc in enumerate(context_docs):
                citations_text += f"[{i+1}] Source: {doc.get('metadata', {}).get('source', 'Unknown')}\n"
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
