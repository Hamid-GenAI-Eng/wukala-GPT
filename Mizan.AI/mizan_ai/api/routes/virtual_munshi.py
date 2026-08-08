from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import fitz  # PyMuPDF
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from typing import List, Optional
import os
import tempfile
import edge_tts
import asyncio
import base64

router = APIRouter()

class MunshiNotificationRequest(BaseModel):
    case_title: str
    next_hearing_date: str
    court: str
    include_audio: bool = False

class MunshiNotificationResponse(BaseModel):
    text_roman_urdu: str
    audio_base64: Optional[str] = None

class ParsedCase(BaseModel):
    case_title: str
    case_number: str
    date: str
    judge: str
    courtroom: str

class CauseListResponse(BaseModel):
    cases: List[ParsedCase]

@router.post("/cause-list", response_model=CauseListResponse)
async def upload_cause_list(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    # Read PDF text
    content = await file.read()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_pdf:
        temp_pdf.write(content)
        temp_pdf_path = temp_pdf.name
        
    try:
        text = ""
        doc = fitz.open(temp_pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    finally:
        if os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
            
    if not text.strip():
        raise HTTPException(status_code=400, detail="Could not extract text from PDF.")
        
    # Use LLM to extract cases
    llm = ChatGroq(model="llama3-70b-8192", temperature=0)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an AI legal assistant in Pakistan ('Virtual Munshi').
Your task is to parse a noisy Court Cause List text.
Extract all cases found and return them as a JSON list of objects.
Do NOT return anything except the raw JSON array.
Each object must have these exact string keys: "case_title", "case_number", "date", "judge", "courtroom".
If a date is not mentioned per case, but mentioned at the top of the cause list, apply it to all cases.
If a field is missing, use an empty string ""."""),
        ("user", "Here is the cause list text:\n\n{text}")
    ])
    
    chain = prompt | llm
    try:
        response = chain.invoke({"text": text[:15000]}) # Limit text to avoid token limits
        import json
        import re
        content_str = response.content
        # Extract JSON if enclosed in markdown
        json_match = re.search(r'\[.*\]', content_str, re.DOTALL)
        if json_match:
            parsed_cases = json.loads(json_match.group(0))
        else:
            parsed_cases = json.loads(content_str)
            
        validated_cases = []
        for c in parsed_cases:
            validated_cases.append(ParsedCase(
                case_title=c.get("case_title", ""),
                case_number=c.get("case_number", ""),
                date=c.get("date", ""),
                judge=c.get("judge", ""),
                courtroom=c.get("courtroom", "")
            ))
            
        return CauseListResponse(cases=validated_cases)
    except Exception as e:
        print("Error parsing cause list:", e)
        raise HTTPException(status_code=500, detail="Failed to parse Cause List via LLM.")

@router.post("/generate-notification", response_model=MunshiNotificationResponse)
async def generate_notification(request: MunshiNotificationRequest):
    llm = ChatGroq(model="llama3-70b-8192", temperature=0.7)
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an AI 'Virtual Munshi' (legal assistant) for a Pakistani lawyer.
Generate a highly professional, respectful, and short WhatsApp message to inform a client about their new hearing date.
The message MUST be in Roman Urdu (Urdu written in English letters).
Example tone: "Assalam o Alaikum, Aap ki case ki agli tareekh fix ho gai hai..."
Do NOT include English translations or any other text. ONLY the Roman Urdu message."""),
        ("user", "Case: {case_title}\nNext Date: {next_hearing_date}\nCourt: {court}")
    ])
    
    chain = prompt | llm
    response = chain.invoke({
        "case_title": request.case_title,
        "next_hearing_date": request.next_hearing_date,
        "court": request.court
    })
    
    roman_urdu_text = response.content.strip()
    
    audio_base64 = None
    if request.include_audio:
        try:
            communicate = edge_tts.Communicate(roman_urdu_text, "ur-PK-AsadNeural")
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio:
                temp_audio_path = temp_audio.name
                
            await communicate.save(temp_audio_path)
            
            with open(temp_audio_path, "rb") as f:
                audio_bytes = f.read()
                audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
                
        except Exception as e:
            print("TTS Generation Error:", e)
        finally:
            if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
                os.remove(temp_audio_path)
                
    return MunshiNotificationResponse(
        text_roman_urdu=roman_urdu_text,
        audio_base64=audio_base64
    )
