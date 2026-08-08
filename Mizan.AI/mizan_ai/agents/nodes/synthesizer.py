from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

def synthesize_node(state: GraphState):
    verified_analysis = state.get("analysis_draft", "")
    citations = state.get("citations", "")
    user_messages = state.get("messages", [])
    
    system_prompt = f"""You are Mizan AI's Synthesis and Executive Reporting Agent.
You will receive the Verified Legal Analysis (IRAC framework).
Your job is to read the analysis and generate the BLUF (Bottom Line Up Front) and the Risk Assessment.
Finally, assemble the COMPLETE response.

Structure the final output exactly as follows:

## 1. Executive Summary (BLUF)
**Direct Answer:** [Yes / No / It depends] followed by a 1-2 sentence high-level explanation.
**Key Determining Factor:** Identify the primary statute or precedent driving this answer.

## 2. Factual & Legal Analysis
{verified_analysis}

## 3. Strict Citation & Grounding
{citations}

## 4. Risk Assessment & Ambiguity Flags
List any:
- **Jurisdictional Limits:** Note if the answer assumes a specific jurisdiction or if the user omitted one.
- **Conflicting Precedent:** Mention if the analysis is uncertain.
- **Missing Context:** State what additional facts would be needed for a definitive answer.

## 5. Procedural Next Steps
Give 1-2 actionable steps (e.g., "Would you like me to draft a letter?", "Consult a lawyer").
"""

    reviewer_feedback = state.get("reviewer_feedback", "")
    if reviewer_feedback:
        system_prompt += f"\n\nCRITICAL FEEDBACK FROM OPPOSING COUNSEL:\n{reviewer_feedback}\n\nYou MUST rewrite the strategy to address and correct this flaw."

    try:
        llm = llm_service.get_reasoning_llm()
        response = llm.invoke([
            SystemMessage(content=system_prompt),
            *user_messages
        ])
        
        return {"messages": [response]}
        
    except Exception as e:
        print(f"Synthesis Node Error: {e}")
        return {"messages": [AIMessage(content=verified_analysis + "\n\n" + citations)]}
