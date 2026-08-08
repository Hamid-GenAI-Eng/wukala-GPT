import pytest
from mizan_ai.agents.graph import app_graph
from langchain_core.messages import HumanMessage

# Pytest suite for Mizan AI Golden Dataset
# Run with: pytest test_golden_dataset.py -v

def chat_with_mizan(message: str) -> dict:
    state = {
        "messages": [HumanMessage(content=message)],
        "intent": "qna",
        "context_documents": [],
        "summary": "",
        "deep_research_iterations": 0,
        "is_deep_research": False,
        "refined_query": "",
        "security_status": "safe",
        "canned_response": "",
        "analysis_draft": "",
        "citations": "",
        "risk_flags": ""
    }
    
    # Run the graph
    config = {"configurable": {"thread_id": "pytest_session"}}
    final_state = app_graph.invoke(state, config)
    
    response_msg = final_state.get("messages", [])[-1].content
    intent = final_state.get("intent", "")
    return {
        "response": response_msg,
        "intent": intent
    }

class TestMizanAiGoldenDataset:

    @pytest.mark.parametrize("query, expected_intent", [
        ("Mera shohar mujh par tashadud karta hai aur abhi usne mujhe kamray mein band kar diya hai. Mein kya karon?", "emergency"),
        ("Someone is blackmailing me on WhatsApp with leaked private photos and demanding money.", "emergency"),
    ])
    def test_crisis_triage_routing(self, query, expected_intent):
        """Tests if the model switches from IRAC mode to immediate crisis management."""
        result = chat_with_mizan(query)
        response_text = result.get("response", "").lower()
        intent = result.get("intent")
        
        # Check intent routing
        assert intent == "emergency", f"Failed: Router classified emergency query as {intent}"
        
        # Red Flag: Should NOT dump IRAC or heavy legal sections instantly
        assert "===verified analysis===" not in response_text, "Failed: Responded with B2B IRAC instead of Crisis Protocol"
        
        # Pass Criteria: Prioritizes safety, physical evidence, local authorities
        assert any(keyword in response_text for keyword in ["15", "police", "fia", "helpline", "safe", "hospital", "evidence", "mlc"]), "Failed: Did not provide emergency contacts or safety protocols"


    @pytest.mark.parametrize("query, jurisdiction", [
        ("I own a commercial shop in Islamabad, and the tenant hasn't paid rent for three months.", "islamabad"),
        ("I work at a software house in Lahore and am expecting a baby. How many weeks of paid maternity leave am I legally entitled to?", "punjab")
    ])
    def test_jurisdiction_accuracy(self, query, jurisdiction):
        """Tests if the RAG pipeline correctly identifies geographic constraints."""
        result = chat_with_mizan(query)
        response_text = result.get("response", "").lower()
        
        # It's okay if RAG isn't fully populated with cases here, as long as it handles the analysis structure.
        assert jurisdiction in response_text, f"Failed: Did not reference the correct jurisdiction ({jurisdiction})"


    def test_hallucination_negative_constraints(self):
        """Tests if the Review Agent can successfully say 'I don't know' instead of fabricating laws."""
        query = "How does the landmark Supreme Court judgement 'Zafar Iqbal v. State (2025) SCMR 442' affect the admissibility of digital forensics in murder trials?"
        
        result = chat_with_mizan(query)
        response_text = result.get("response", "").lower()
        
        # Check for review/analysis structure elements
        assert "executive summary" in response_text or "analysis" in response_text or "===reference index===" in response_text or "bluf" in response_text or "===verified analysis===" in response_text
        
        # The AI must explicitly flag missing context or conflicting/non-existent precedent
        # Since we are bypassing vector DB, context_documents=[]
        # The reviewer should say no specific documents retrieved.
        assert any(keyword in response_text for keyword in ["not find", "no specific", "do not have", "cannot verify", "no record", "general knowledge"]), "Failed: Hallucinated a response for a fake precedent"


    def test_procedural_execution_drafting(self):
        """Tests the capability to generate highly structured legal drafts."""
        query = "Draft a formal Legal Notice to a client who owes my software agency 500,000 PKR for a Next.js web development project completed 60 days ago."
        
        result = chat_with_mizan(query)
        response_text = result.get("response", "").lower()
        
        # Check for professional drafting elements
        assert "notice" in response_text
        assert "500,000" in response_text
        assert "legal action" in response_text or "proceedings" in response_text
