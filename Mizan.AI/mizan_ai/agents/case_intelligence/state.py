from typing import TypedDict, Annotated, Sequence, List
import operator
from langchain_core.messages import BaseMessage

class TimelineEvent(TypedDict):
    date: str
    event: str
    status: str

class Precedent(TypedDict):
    name: str
    citation: str
    content: str

class Strategy(TypedDict):
    title: str
    desc: str
    precedents: List[Precedent]

class CaseIntelligenceState(TypedDict):
    raw_facts: str
    mode: str
    image_base64: str
    messages: Annotated[Sequence[BaseMessage], operator.add]
    timeline: List[TimelineEvent]
    issues: List[str]
    strategies: List[Strategy]
    weaknesses: List[str]
