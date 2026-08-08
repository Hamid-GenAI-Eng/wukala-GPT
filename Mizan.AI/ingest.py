import os
import json
import logging
from mizan_ai.ingestion.parser import extract_chunks_from_document
from mizan_ai.services.embedding_service import embedding_service
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.core.config import settings
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CORPUS_DIR = "Legal_corpus"
PROCESSED_FILES_JSON = "processed_files.json"
FAILED_LOG = "failed_ingestion.log"
BATCH_SIZE = 32

def load_processed_files() -> set:
    if os.path.exists(PROCESSED_FILES_JSON):
        with open(PROCESSED_FILES_JSON, 'r') as f:
            return set(json.load(f))
    return set()

def save_processed_file(filename: str):
    processed = load_processed_files()
    processed.add(filename)
    with open(PROCESSED_FILES_JSON, 'w') as f:
        json.dump(list(processed), f)

def log_failure(filename: str, reason: str):
    with open(FAILED_LOG, 'a') as f:
        f.write(f"{filename}: {reason}\n")

def process_batch(batch_chunks: list[dict]):
    if not batch_chunks:
        return
    
    texts = [chunk["text"] for chunk in batch_chunks]
    
    # 1. Batched Embedding
    vectors_list = embedding_service.embed_texts(texts)
    
    # 2. Combine into Qdrant Payloads
    points_payloads = []
    for chunk, vectors in zip(batch_chunks, vectors_list):
        points_payloads.append({
            "point_id": chunk["point_id"],
            "dense_vector": vectors["dense"],
            "sparse_vector": vectors["sparse"],
            "payload": chunk["payload"]
        })
        
    # 3. Batched Upsert
    qdrant_service.upsert_documents(points_payloads)

def run_ingestion():
    if not os.path.exists(CORPUS_DIR):
        logger.error(f"Directory {CORPUS_DIR} does not exist.")
        return

    all_files = [f for f in os.listdir(CORPUS_DIR) if f.endswith(('.pdf', '.txt'))]
    processed_files = load_processed_files()
    
    files_to_process = [f for f in all_files if f not in processed_files]
    logger.info(f"Found {len(all_files)} total files. {len(processed_files)} already processed. {len(files_to_process)} left to ingest.")
    
    for idx, filename in enumerate(files_to_process):
        logger.info(f"[{idx+1}/{len(files_to_process)}] Processing {filename}...")
        file_path = os.path.join(CORPUS_DIR, filename)
        
        try:
            chunks = extract_chunks_from_document(file_path, filename)
            
            if not chunks:
                save_processed_file(filename)
                continue
                
            # Process chunks in batches
            for i in range(0, len(chunks), BATCH_SIZE):
                batch = chunks[i:i+BATCH_SIZE]
                process_batch(batch)
                
            save_processed_file(filename)
            logger.info(f"Successfully ingested {filename} ({len(chunks)} chunks).")
            
        except Exception as e:
            logger.error(f"Failed to process {filename}: {e}")
            log_failure(filename, str(e))
            continue
            
    logger.info("Ingestion completed successfully.")

if __name__ == "__main__":
    run_ingestion()
