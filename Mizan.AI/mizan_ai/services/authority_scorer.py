from typing import List, Dict

class LegalAuthorityScorer:
    """
    Deterministic Legal Authority Scorer.
    Scores evidence purely on extracted metadata. No LLM hallucination.
    """
    
    # Simple Phase 1 deterministic rules
    COURT_WEIGHTS = {
        "Supreme Court of Pakistan": 1.0,
        "Supreme Court": 1.0,
        "High Court": 0.8,
        "Federal Shariat Court": 0.8,
        "Session Court": 0.5,
        "Magistrate Court": 0.3
    }

    DOC_TYPE_WEIGHTS = {
        "constitution": 1.0,
        "statute": 0.9,
        "judgment": 0.8,
        "regulation": 0.7,
        "rule": 0.7,
        "other": 0.5
    }

    def score_evidence(self, evidence: List[Dict]) -> List[Dict]:
        for ev in evidence:
            score = 0.5 # Baseline
            
            # Document Type scoring
            doc_type = (ev.get("document_type") or "other").lower()
            score += self.DOC_TYPE_WEIGHTS.get(doc_type, 0.0) * 2.0
            
            # Court hierarchy scoring for judgments
            if doc_type == "judgment":
                court = ev.get("court")
                if court:
                    court_weight = self.COURT_WEIGHTS.get(court, 0.4) # Default to 0.4 if unknown court
                    score += court_weight * 3.0
                    
            # Bonus for exact statute matches from exact reference search
            diagnostics = ev.get("diagnostics", {})
            if "exact_reference" in diagnostics.get("retrieval_sources", []):
                score += 2.0
                
            ev["authority_score"] = min(10.0, score) # Cap at 10.0
            
        return evidence

authority_scorer = LegalAuthorityScorer()
