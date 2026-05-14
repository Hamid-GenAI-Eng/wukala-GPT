import logging
from qdrant_client import QdrantClient
from mizan_ai.core.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_qdrant_status():
    client = QdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        api_key=settings.QDRANT_API_KEY
    )
    
    collection_name = "legal_corpus"
    
    try:
        collection_info = client.get_collection(collection_name)
        logger.info(f"📊 Collection Name: {collection_name}")
        logger.info(f"✅ Total Vectors Indexed (Points Count): {collection_info.points_count}")
        logger.info(f"🟢 Status: {collection_info.status}")
        
        if collection_info.points_count > 0:
            # Let's peek at one of the vectors to ensure metadata is correct
            points = client.scroll(
                collection_name=collection_name,
                limit=1,
                with_payload=True,
                with_vectors=False
            )[0]
            
            if points:
                payload = points[0].payload
                logger.info(f"📄 Sample Payload Metadata for a Chunk:")
                logger.info(f"   - Source File: {payload.get('source_file')}")
                logger.info(f"   - Court: {payload.get('court')}")
                logger.info(f"   - Citation: {payload.get('citation')}")
                logger.info(f"   - Text snippet: {payload.get('text', '')[:100]}...")
            
    except Exception as e:
        logger.error(f"Error connecting to Qdrant: {e}")

if __name__ == "__main__":
    check_qdrant_status()
