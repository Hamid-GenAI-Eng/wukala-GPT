from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.runnables import Runnable
from mizan_ai.core.config import settings
import logging
import asyncio

logger = logging.getLogger(__name__)

class RobustLLMWrapper(Runnable):
    def __init__(self, models):
        self.models = models
        
    def invoke(self, input, config=None, **kwargs):
        last_error = None
        for idx, llm in enumerate(self.models):
            try:
                response = llm.invoke(input, config=config, **kwargs)
                print(f"[RobustLLM] SUCCESS: Provider {idx+1} ({llm.__class__.__name__} - {getattr(llm, 'model_name', 'unknown')}) served the request.")
                return response
            except Exception as e:
                error_str = str(e).lower()
                if '429' in error_str or 'rate_limit' in error_str or 'quota' in error_str or 'rate limit' in error_str:
                    print(f"[RobustLLM] WARNING: Provider {idx+1} ({llm.__class__.__name__}) hit rate limit/quota. Error: {e}. Failing over to next provider...")
                    last_error = e
                    continue
                else:
                    raise e
        print(f"[RobustLLM] ERROR: All providers failed.")
        raise last_error

from langchain_ollama import ChatOllama
import requests

class LLMService:
    def __init__(self):
        fast_models = []
        reasoning_models = []
        
        provider = getattr(settings, "LLM_PROVIDER", "ollama")
        
        if provider == "ollama":
            base_url = getattr(settings, "OLLAMA_BASE_URL", "http://host.docker.internal:11434")
            fast_model = getattr(settings, "MIZAN_FAST_MODEL", "qwen3:8b")
            reason_model = getattr(settings, "MIZAN_REASONING_MODEL", "qwen3:14b")
            
            fast_models.append(ChatOllama(base_url=base_url, model=fast_model, temperature=0.1))
            reasoning_models.append(ChatOllama(base_url=base_url, model=reason_model, temperature=0.3))
        
        self.fast_llm = RobustLLMWrapper(fast_models)
        self.reasoning_llm = RobustLLMWrapper(reasoning_models)

    def get_fast_llm(self):
        return self.fast_llm
        
    def get_reasoning_llm(self):
        return self.reasoning_llm
        
    def check_ollama_status(self):
        provider = getattr(settings, "LLM_PROVIDER", "ollama")
        if provider != "ollama":
            return
            
        base_url = getattr(settings, "OLLAMA_BASE_URL", "http://host.docker.internal:11434")
        fast_model = getattr(settings, "MIZAN_FAST_MODEL", "qwen3:8b")
        reason_model = getattr(settings, "MIZAN_REASONING_MODEL", "qwen3:14b")
        review_model = getattr(settings, "MIZAN_REVIEW_MODEL", "qwen3:14b")
        
        required_models = {fast_model, reason_model, review_model}
        
        try:
            response = requests.get(f"{base_url}/api/tags", timeout=5)
            response.raise_for_status()
            
            data = response.json()
            available_models = {model["name"] for model in data.get("models", [])}
            
            for rm in required_models:
                if rm not in available_models and f"{rm}:latest" not in available_models:
                    raise ValueError(f"Configured model '{rm}' is not installed. Run: ollama pull {rm}")
                    
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"MizanAI LLM unavailable: Ollama is not reachable at {base_url}. Details: {e}")

llm_service = LLMService()
