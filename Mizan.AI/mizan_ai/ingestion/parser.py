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

def extract_chunks_from_document(file_path: str, filename: str) -> list[dict]:
    logger.info(f"Extracting text and chunking {filename}")
    
    text_content = ""
    if filename.lower().endswith('.pdf'):
        text_content = extract_text_from_pdf(file_path)
    elif filename.lower().endswith('.txt'):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                text_content = f.read()
        except Exception as e:
            logger.error(f"Error reading txt file {file_path}: {e}")
            return []
    else:
        logger.warning(f"Unsupported file format: {filename}")
        return []

    if not text_content.strip():
        logger.warning(f"No text extracted from {filename}")
        return []
    
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
    
    result = []
    for idx, chunk in enumerate(chunks):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{filename}_{idx}"))
        result.append({
            "point_id": point_id,
            "text": chunk["text"],
            "payload": {
                "text": chunk["text"],
                "citation": metadata["citation"],
                "court": metadata["court"],
                "source_file": filename
            }
        })
        
    return result

def process_and_ingest_document(file_path: str, filename: str):
    chunks = extract_chunks_from_document(file_path, filename)
    if not chunks:
        logger.warning(f"No chunks to ingest for {filename}")
        return
        
    texts = [c["text"] for c in chunks]
    payloads = [c["payload"] for c in chunks]
    ids = [c["point_id"] for c in chunks]
    
    # Embed and upsert directly since this is an on-the-fly request
    dense_embeddings, sparse_embeddings = embedding_service.embed_texts(texts)
    qdrant_service.upsert_documents(ids, dense_embeddings, sparse_embeddings, payloads)
    logger.info(f"Successfully processed and ingested {len(chunks)} chunks for {filename}")
