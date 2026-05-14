import fitz  # PyMuPDF
import logging
import uuid
import os
import re
from mizan_ai.ingestion.chunker import chunk_text
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.services.embedding_service import embedding_service

logger = logging.getLogger(__name__)

def extract_text_from_pdf(file_path: str) -> str:
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error extracting text from {file_path}: {e}")
        return ""

def process_and_ingest_document(file_path: str, filename: str):
    logger.info(f"Starting processing for {filename}")
    
    text_content = ""
    if filename.lower().endswith('.pdf'):
        text_content = extract_text_from_pdf(file_path)
    elif filename.lower().endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        except Exception as e:
            logger.error(f"Error reading txt file {file_path}: {e}")
            return
    else:
        logger.warning(f"Unsupported file format: {filename}")
        return

    if not text_content.strip():
        logger.warning(f"No text extracted from {filename}")
        return
    
    # Try to extract citation if available in filename or text
    citation_match = re.search(r'(PLD|SCMR|PCrLJ|YLR|CLC)\s*\d+\s*[A-Za-z]+\s*\d+', text_content[:1000])
    citation = citation_match.group(0) if citation_match else "Citation not found"
    
    metadata = {
        "citation": citation,
        "court": "Supreme Court of Pakistan" if "SCMR" in citation or "Supreme Court" in text_content[:1000] else "Unknown Court",
        "date": "Unknown Date",
        "source_file": filename
    }
    
    # Chunking
    chunks = chunk_text(text_content, metadata)
    
    # Embedding and Upserting
    for chunk in chunks:
        vectors = embedding_service.embed_text(chunk["text"])
        point_id = str(uuid.uuid4())
        
        qdrant_service.upsert_document(
            point_id=point_id,
            dense_vector=vectors["dense"],
            sparse_vector=vectors["sparse"],
            payload={
                "text": chunk["text"],
                "citation": metadata["citation"],
                "court": metadata["court"],
                "source_file": filename
            }
        )
        
    logger.info(f"Finished ingesting {filename} into Qdrant.")
