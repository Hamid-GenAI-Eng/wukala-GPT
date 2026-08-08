import logging
import os
import site

# Register NVIDIA pip package DLLs if they exist
try:
    for pkg in ["cudnn", "cublas"]:
        path = os.path.join(site.getsitepackages()[0], "nvidia", pkg, "bin")
        if os.path.exists(path):
            os.add_dll_directory(path)
            os.environ["PATH"] = path + os.pathsep + os.environ.get("PATH", "")
except Exception:
    pass

from fastembed import TextEmbedding, SparseTextEmbedding
from fastembed.rerank.cross_encoder import TextCrossEncoder

logger = logging.getLogger(__name__)

class EnterpriseEmbeddingService:
    def __init__(self):
        logger.info("Initializing Enterprise Embeddings (ONNX/FastEmbed) - PyTorch Free...")
        try:
            providers = ["CUDAExecutionProvider", "CPUExecutionProvider"]
            
            # Using BAAI/bge-large-en-v1.5 for dense (1024 dimensions)
            self.dense_model = TextEmbedding(model_name="BAAI/bge-large-en-v1.5", providers=providers) 
            # Using Splade for Sparse
            self.sparse_model = SparseTextEmbedding(model_name="prithivida/Splade_PP_en_v1", providers=providers)
            # Using Jina Reranker v2 Multilingual for Cross-Encoder Reranking
            self.reranker_model = TextCrossEncoder(model_name="jinaai/jina-reranker-v2-base-multilingual", providers=providers)
            self.is_loaded = True
            logger.info("FastEmbed loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load ONNX embeddings: {e}")
            self.is_loaded = False

    def embed_text(self, text: str):
        """
        Returns dense and sparse vectors for the given text using ONNX CPU Runtime.
        """
        if not self.is_loaded:
            return {
                "dense": [0.0] * 1024,
                "sparse": {"indices": [1], "values": [0.1]}
            }
        
        # Dense
        dense_vecs = list(self.dense_model.embed([text]))[0]
        
        # Sparse
        sparse_vecs = list(self.sparse_model.embed([text]))[0]
        
        return {
            "dense": dense_vecs.tolist(),
            "sparse": {
                "indices": sparse_vecs.indices.tolist(),
                "values": sparse_vecs.values.tolist()
            }
        }

    def embed_texts(self, texts: list[str]) -> list[dict]:
        """
        Batched embedding generation. Returns a list of vectors.
        """
        if not self.is_loaded or not texts:
            return [{
                "dense": [0.0] * 1024,
                "sparse": {"indices": [1], "values": [0.1]}
            } for _ in texts]

        # FastEmbed is highly optimized for lists
        dense_vecs_generator = self.dense_model.embed(texts)
        sparse_vecs_generator = self.sparse_model.embed(texts)

        results = []
        for dense, sparse in zip(dense_vecs_generator, sparse_vecs_generator):
            results.append({
                "dense": dense.tolist(),
                "sparse": {
                    "indices": sparse.indices.tolist(),
                    "values": sparse.values.tolist()
                }
            })
        return results
        
    def rerank_documents(self, query: str, documents: list[str]) -> list[float]:
        """
        Takes a query and a list of document strings, returns their relevance scores.
        """
        if not self.is_loaded or not documents:
            return [1.0] * len(documents)
            
        # FastEmbed reranker returns an iterable of arrays containing the score
        # e.g. [array([0.9]), array([0.1])]
        scores = list(self.reranker_model.rerank(query, documents))
        return [float(score) for score in scores]

embedding_service = EnterpriseEmbeddingService()
