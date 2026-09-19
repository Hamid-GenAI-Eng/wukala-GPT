import fitz  # PyMuPDF
import logging
import uuid
import os
import re
from mizan_ai.ingestion.legal_chunker import chunk_legal_text
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
    
    # Chunking using structural legal chunker
    chunks = chunk_legal_text(text_content, filename)
    
    result = []
    for idx, chunk in enumerate(chunks):
        point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{filename}_{idx}"))
        result.append({
            "point_id": point_id,
            "text": chunk["text"],
            "payload": {
                "text": chunk["text"],
                "citation": chunk["metadata"].get("citation"),
                "court": chunk["metadata"].get("court"),
                "section": chunk["metadata"].get("section"),
                "title": chunk["metadata"].get("title"),
                "document_type": chunk["metadata"].get("document_type"),
                "source_file": filename,
                "canonical_references": chunk["metadata"].get("canonical_references", []),
                "parent_chunk_id": None # Tracked later if we do parent-child hierarchy properly
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
