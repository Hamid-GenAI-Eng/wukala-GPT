import logging

logger = logging.getLogger(__name__)

class BGEM3EmbeddingService:
    def __init__(self):
        logger.info("Initializing BGE-m3 model. This requires heavy VRAM...")
        try:
            from FlagEmbedding import BGEM3FlagModel
            self.model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)
            self.is_loaded = True
        except ImportError:
            logger.warning("FlagEmbedding not installed. Running in mock mode.")
            self.is_loaded = False

    def embed_text(self, text: str):
        """
        Returns dense and sparse vectors for the given text.
        """
        if not self.is_loaded:
            # Mock return for testing without GPU/dependencies
            return {
                "dense": [0.0] * 1024,
                "sparse": {"indices": [1, 2, 3], "values": [0.1, 0.2, 0.3]}
            }
        
        embeddings = self.model.encode(
            [text], 
            return_dense=True, 
            return_sparse=True, 
            return_colbert_vecs=False
        )
        
        dense = embeddings['dense_vecs'][0].tolist()
        sparse_dict = embeddings['lexical_weights'][0]
        # Convert dict {str(id): float} to indices and values list for Qdrant safely
        indices = []
        values = []
        for k, v in sparse_dict.items():
            try:
                indices.append(int(k))
                values.append(float(v))
            except ValueError:
                # Deterministic hash for string tokens to positive 32-bit int to prevent crash
                hashed_idx = abs(hash(k)) % 2147483647
                indices.append(hashed_idx)
                values.append(float(v))
        
        return {
            "dense": dense,
            "sparse": {"indices": indices, "values": values}
        }


embedding_service = BGEM3EmbeddingService()
