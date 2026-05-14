import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def download_model():
    logger.info("Initializing download for BGE-m3 model (this may take a few minutes as it is several GBs)...")
    try:
        from FlagEmbedding import BGEM3FlagModel
        # Initializing the model automatically downloads it to the huggingface cache
        model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
        logger.info("✅ BAAI/bge-m3 Model successfully downloaded and loaded!")
    except Exception as e:
        logger.error(f"❌ Failed to download/load the model. Error: {e}")

if __name__ == "__main__":
    download_model()
