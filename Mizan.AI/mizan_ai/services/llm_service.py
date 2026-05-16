from langchain_groq import ChatGroq
from mizan_ai.core.config import settings
import logging

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        if not settings.GROQ_API_KEY:
            logger.warning("GROQ_API_KEY not set! LLM service will fail if called.")
        api_key = settings.GROQ_API_KEY or "dummy_key_to_prevent_startup_crash"
        
        # High speed QnA model
        self.fast_llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.1
        )
        
        # Reasoner/Deep model
        self.reasoning_llm = ChatGroq(
            api_key=api_key,
            model_name="llama-3.3-70b-versatile",
            temperature=0.3
        )

    def get_fast_llm(self):
        return self.fast_llm
        
    def get_reasoning_llm(self):
        return self.reasoning_llm

llm_service = LLMService()
