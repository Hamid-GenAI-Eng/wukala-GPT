from typing import TypedDict, Annotated, Sequence
from langchain_core.messages import BaseMessage
import operator

class GraphState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    intent: str
    context_documents: list[dict]
    summary: str
    deep_research_iterations: int
    is_deep_research: bool
    refined_query: str
    security_status: str
    canned_response: str
    analysis_draft: str
    citations: str
    risk_flags: str
    reviewer_feedback: str
    reviewer_decision: str
    review_iterations: int
