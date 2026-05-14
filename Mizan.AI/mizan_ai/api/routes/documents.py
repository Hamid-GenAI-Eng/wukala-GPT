from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from mizan_ai.core.security import get_current_user, TokenData
import os
import shutil
from mizan_ai.ingestion.parser import process_and_ingest_document

router = APIRouter()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    current_user: TokenData = Depends(get_current_user)
):
    if not file.filename.endswith(('.pdf', '.txt')):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Process the document
    process_and_ingest_document(file_path, file.filename)
    
    return {"message": f"Successfully uploaded and processed {file.filename}"}
