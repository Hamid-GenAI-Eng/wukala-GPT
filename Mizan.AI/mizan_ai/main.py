import os
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["ONNXRUNTIME_INTEROP_NUM_THREADS"] = "1"
os.environ["ONNXRUNTIME_INTRA_OP_NUM_THREADS"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from mizan_ai.core.config import settings
from mizan_ai.services.llm_service import llm_service
from mizan_ai.services.embedding_service import embedding_service

import logging
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Check Ollama (non-fatal — LLM features are optional)
    try:
        llm_service.check_ollama_status()
    except Exception as e:
        logger.warning(f"Ollama not available (LLM-based features will be disabled): {e}")
        
    # Eagerly load FastEmbed ONNX models so the first user query doesn't hang
    try:
        logger.info("Pre-loading FastEmbed ONNX models into memory...")
        embedding_service._load_models()
        logger.info("FastEmbed models loaded successfully.")
    except Exception as e:
        logger.error(f"Failed to pre-load embedding models: {e}")
        
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # In production, specify exact domains via env
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "healthy", "project": settings.PROJECT_NAME}

from mizan_ai.api.routes import chat, documents, auth, drafting, case_intelligence, virtual_munshi
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(drafting.router, prefix=f"{settings.API_V1_STR}/drafting", tags=["drafting"])
app.include_router(case_intelligence.router, prefix=f"{settings.API_V1_STR}/case-intelligence", tags=["case_intelligence"])
app.include_router(virtual_munshi.router, prefix=f"{settings.API_V1_STR}/munshi", tags=["virtual_munshi"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("mizan_ai.main:app", host="0.0.0.0", port=8000, reload=True)
