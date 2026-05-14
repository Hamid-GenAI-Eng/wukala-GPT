import os
import logging
from mizan_ai.ingestion.parser import process_and_ingest_document
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.core.config import settings
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

CORPUS_DIR = "Legal_corpus"

def run_ingestion():
    # Initialize Qdrant Collection (handled automatically on import)
    
    if not os.path.exists(CORPUS_DIR):
        logger.error(f"Directory {CORPUS_DIR} does not exist.")
        return

    files = [f for f in os.listdir(CORPUS_DIR) if f.endswith(('.pdf', '.txt'))]
    logger.info(f"Found {len(files)} files to ingest for strict testing.")
    
    # Ingesting files
    for idx, filename in enumerate(files):
        logger.info(f"[{idx+1}/{len(files)}] Ingesting {filename}...")
        file_path = os.path.join(CORPUS_DIR, filename)
        process_and_ingest_document(file_path, filename)
        
    logger.info("Ingestion completed successfully.")

if __name__ == "__main__":
    run_ingestion()
