import os
import io
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

router = APIRouter()

TEMPLATES_DIR = os.environ.get(
    "TEMPLATES_DIR",
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "Legal drafting templates (Word)")
)

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
                        if f.endswith(".docx"):
                            lang_data["files"].append(f)
                    if lang_data["files"]:
                        cat_data["languages"].append(lang_data)
            if cat_data["languages"]:
                categories.append(cat_data)
                
    return {"categories": categories}


@router.get("/template-content")
async def get_template_content(path: str, current_user: str = Depends(get_current_user)):
    """Extracts raw text from the .docx template and returns it as HTML using mammoth."""
    import mammoth
    file_path = os.path.join(TEMPLATES_DIR, path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
        
    try:
        with open(file_path, "rb") as docx_file:
            style_map = (
                "p[style-name='Title'] => h1.doc-title\n"
                "p[style-name='Heading 1'] => h2.doc-h1\n"
                "p[style-name='Heading 2'] => h3.doc-h2\n"
                "p[style-name='Heading 3'] => h4.doc-h3"
            )
            result = mammoth.convert_to_html(docx_file, style_map=style_map)
            html = result.value
            return {"content": html}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading docx: {str(e)}")



@router.get("/template-file")
async def get_template_file(path: str):
    """Streams the raw docx file for downloading."""
    file_path = os.path.join(TEMPLATES_DIR, path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Template not found")
    return FileResponse(file_path, media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document", filename=os.path.basename(file_path))


@router.post("/export")
async def export_to_docx(request: ExportRequest, current_user: str = Depends(get_current_user)):
    """Converts edited Markdown draft into a formatted legal .docx file."""
    try:
        html = markdown2.markdown(request.markdown_content)
        soup = BeautifulSoup(html, 'html.parser')
        
        doc = Document()
        
        style = doc.styles['Normal']
        font = style.font
        font.name = 'Times New Roman'
        font.size = Pt(12)
        
        title = doc.add_heading(request.document_title, level=1)
        title.alignment = WD_ALIGN_PARAGRAPH.CENTER
        
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
                for child in element.children:
                    if child.name in ['strong', 'b']:
                        run = p.add_run(child.get_text())
                        run.bold = True
                    else:
                        run = p.add_run(child.get_text() if hasattr(child, 'get_text') else str(child))
                        
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
