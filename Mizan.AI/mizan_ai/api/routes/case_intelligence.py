from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from mizan_ai.agents.case_intelligence.graph import ci_graph

router = APIRouter()

class CaseIntelligenceRequest(BaseModel):
    session_id: str
    raw_facts: str
    mode: str = "standard"
    image_base64: Optional[str] = None

class StrategyResponse(BaseModel):
    title: str
    desc: str
    precedents: List[dict]

class TimelineEventResponse(BaseModel):
    date: str
    event: str
    status: str

class CaseIntelligenceResponse(BaseModel):
    timeline: List[TimelineEventResponse]
    issues: List[str]
    strategies: List[StrategyResponse]
    weaknesses: List[str]

@router.post("/analyze", response_model=CaseIntelligenceResponse)
async def analyze_case(request: CaseIntelligenceRequest):
    try:
        config = {"configurable": {"thread_id": request.session_id}}
        
        # Invoke the graph
        result = ci_graph.invoke({
            "raw_facts": request.raw_facts,
            "mode": request.mode,
            "image_base64": request.image_base64,
            "timeline": [],
            "issues": [],
            "strategies": [],
            "weaknesses": []
        }, config=config)
        
        return CaseIntelligenceResponse(
            timeline=result.get("timeline", []),
            issues=result.get("issues", []),
            strategies=result.get("strategies", []),
            weaknesses=result.get("weaknesses", [])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
