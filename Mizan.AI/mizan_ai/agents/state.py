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
