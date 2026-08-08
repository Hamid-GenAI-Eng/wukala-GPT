import os
import io
import fitz  # PyMuPDF
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from typing import List, Dict, Any
from docx import Document
from docx.shared import Pt, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import markdown2
from bs4 import BeautifulSoup

from mizan_ai.core.security import get_current_user
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from mizan_ai.core.config import settings

router = APIRouter()

TEMPLATES_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "Legal drafting templates")

class DraftRequest(BaseModel):
    template_path: str
    case_facts: str

class ExtractFieldsRequest(BaseModel):
    template_path: str

class ExportRequest(BaseModel):
    markdown_content: str
    document_title: str

@router.get("/templates")
async def get_templates(current_user: str = Depends(get_current_user)):
    """Scans the Legal drafting templates directory and returns available categories and files."""
    if not os.path.exists(TEMPLATES_DIR):
        return {"categories": []}
    
    categories = []
    for category in os.listdir(TEMPLATES_DIR):
        category_path = os.path.join(TEMPLATES_DIR, category)
        if os.path.isdir(category_path):
            cat_data = {"name": category, "languages": []}
            for lang in os.listdir(category_path):
                lang_path = os.path.join(category_path, lang)
                if os.path.isdir(lang_path):
                    lang_data = {"language": lang, "files": []}
                    for f in os.listdir(lang_path):
                        if f.endswith(".pdf"):
                            lang_data["files"].append(f)
                    if lang_data["files"]:
                        cat_data["languages"].append(lang_data)
            if cat_data["languages"]:
                categories.append(cat_data)
                
    return {"categories": categories}


@router.get("/template-file")
async def get_template_file(path: str):
    """Streams the raw PDF file for viewing in the frontend."""
    file_path = os.path.join(TEMPLATES_DIR, path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
    return FileResponse(file_path, media_type="application/pdf", filename=os.path.basename(file_path))


@router.post("/extract-fields")
async def extract_fields(request: ExtractFieldsRequest, current_user: str = Depends(get_current_user)):
    """Extracts fillable fields from the template PDF dynamically."""
    file_path = os.path.join(TEMPLATES_DIR, request.template_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
        
    template_text = ""
    try:
        import pytesseract
        from PIL import Image
        with fitz.open(file_path) as doc:
            for page in doc:
                text = page.get_text().strip()
                if len(text) > 50:
                    template_text += text + "\n"
                else:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    template_text += pytesseract.image_to_string(img) + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")

    if not template_text.strip():
        raise HTTPException(status_code=400, detail="The template PDF is empty.")

    try:
        llm = ChatGroq(temperature=0.0, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
        
        system_prompt = """You are an AI that extracts form fields from legal templates.
Analyze the template text and identify all the variables or placeholders that a user needs to fill out (e.g., Client Name, Date, Amount, Court Name, Reason, etc.).
Return ONLY a valid JSON array of objects. Each object should have 'id' (a snake_case identifier) and 'label' (a short, human-readable label).
Example:
[
  {"id": "client_name", "label": "Client Name"},
  {"id": "court_name", "label": "Court Name"},
  {"id": "dispute_amount", "label": "Dispute Amount"}
]
Do not include any markdown formatting or explanations, only the raw JSON array."""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"--- TEMPLATE ---\n{template_text}")
        ]
        
        response = llm.invoke(messages)
        print("GROQ RAW RESPONSE:", response.content)
        import json
        content = response.content.replace("```json", "").replace("```", "").strip()
        print("PARSED CONTENT:", content)
        fields = json.loads(content)
        return {"fields": fields}
        
    except Exception as e:
        print(f"Exception during extraction: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Field extraction failed: {str(e)}")


@router.post("/generate")
async def generate_draft(request: DraftRequest, current_user: str = Depends(get_current_user)):
    """Reads the PDF template and uses AI to generate a filled draft based on case facts."""
    file_path = os.path.join(TEMPLATES_DIR, request.template_path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
        
    # 1. Extract text from the PDF template
    template_text = ""
    try:
        import pytesseract
        from PIL import Image
        with fitz.open(file_path) as doc:
            for page in doc:
                text = page.get_text().strip()
                if len(text) > 50:
                    template_text += text + "\n"
                else:
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
                    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
                    template_text += pytesseract.image_to_string(img) + "\n"
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading PDF: {str(e)}")

    if not template_text.strip():
        raise HTTPException(status_code=400, detail="The template PDF is empty or could not be read.")

    # 2. Call Groq to generate the draft
    try:
        llm = ChatGroq(temperature=0.2, model_name="llama-3.3-70b-versatile", groq_api_key=settings.GROQ_API_KEY)
        
        system_prompt = """You are an elite legal drafting AI. 
You will be provided with a raw Legal Document Template (which was extracted via OCR and may have messy formatting/newlines) and a set of Case Facts/Client Details.
Your task is to generate a final, polished legal document by filling in the details from the case facts into the template structure.
RULES:
1. Reconstruct and fix the proper legal formatting. The OCR text might be scattered; you must organize it into a clean, professional legal document structure with proper paragraphs.
2. Maintain the exact tone and legal structure of the template. 
3. If specific details are missing from the case facts, leave a placeholder like [Name] or [Date].
4. Put the signature blocks (e.g. DEPONENT, ATTESTATION) at the bottom neatly.
5. DO NOT add any conversational text (e.g., "Here is your document"). ONLY return the final document text.
6. Format the output in Markdown (using # for headers, bold for emphasis, and proper spacing) so it can be rendered beautifully."""
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"--- TEMPLATE ---\n{template_text}\n\n--- CASE FACTS ---\n{request.case_facts}")
        ]
        
        response = llm.invoke(messages)
        return {"draft": response.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")


@router.post("/export")
async def export_to_docx(request: ExportRequest, current_user: str = Depends(get_current_user)):
    """Converts edited Markdown draft into a beautifully formatted legal .docx file."""
    try:
        # Convert Markdown to HTML, then parse text to handle bold/headers roughly
        html = markdown2.markdown(request.markdown_content)
        soup = BeautifulSoup(html, 'html.parser')
        
        doc = Document()
        
        # Legal styling configuration
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Times New Roman'
        font.size = Pt(12)
        
        # Add Title
        title = doc.add_heading(request.document_title, level=1)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
        # Parse paragraphs
        for element in soup.find_all(['p', 'h1', 'h2', 'h3', 'ul', 'li']):
            if element.name in ['h1', 'h2', 'h3']:
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
                run = p.add_run(element.get_text())
                run.bold = True
                run.font.size = Pt(14)
            else:
                p = doc.add_paragraph()
                p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
                # Rough handling of bold inside paragraph
                for child in element.children:
                    if child.name in ['strong', 'b']:
                        run = p.add_run(child.get_text())
                        run.bold = True
                    else:
                        run = p.add_run(child.get_text() if hasattr(child, 'get_text') else str(child))
                        
        # Save to in-memory bytes buffer
        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)
        
        return StreamingResponse(
            file_stream, 
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={request.document_title}.docx"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
