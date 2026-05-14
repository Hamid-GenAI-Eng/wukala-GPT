from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mizan_ai.core.config import settings

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
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

from mizan_ai.api.routes import chat, documents, auth, drafting
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(chat.router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(drafting.router, prefix=f"{settings.API_V1_STR}/drafting", tags=["drafting"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("mizan_ai.main:app", host="0.0.0.0", port=8000, reload=True)
