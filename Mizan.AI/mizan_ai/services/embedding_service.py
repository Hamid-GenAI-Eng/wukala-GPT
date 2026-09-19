import logging
import os
import site

os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
os.environ["ONNXRUNTIME_INTEROP_NUM_THREADS"] = "1"
os.environ["ONNXRUNTIME_INTRA_OP_NUM_THREADS"] = "1"

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
        self._dense_model = None
        self._sparse_model = None
        self._reranker_model = None
        self.is_loaded = False
        self._initialized = False

    def _load_models(self):
        """Lazy-load models on first use so uvicorn starts immediately."""
        if self._initialized:
            return
        self._initialized = True
        logger.info("Lazy-loading Enterprise Embeddings (ONNX/FastEmbed) - PyTorch Free...")
        try:
            providers = ["CPUExecutionProvider"]
            from mizan_ai.core.config import settings

            self._dense_model = TextEmbedding(model_name=settings.MIZAN_DENSE_MODEL, providers=providers)
            self._sparse_model = SparseTextEmbedding(model_name=settings.MIZAN_SPARSE_MODEL, providers=providers)
            self._reranker_model = TextCrossEncoder(model_name=settings.MIZAN_RERANK_MODEL, providers=["CPUExecutionProvider"])
            self.is_loaded = True
            logger.info("FastEmbed loaded successfully with configured models.")
        except Exception as e:
            logger.error(f"Failed to load ONNX embeddings: {e}")
            self.is_loaded = False

    def embed_text(self, text: str):
        """
        Returns dense and sparse vectors for the given text using ONNX CPU Runtime.
        """
        self._load_models()
        if not self.is_loaded:
            return {
                "dense": [0.0] * 1024,
                "sparse": {"indices": [1], "values": [0.1]}
            }

        dense_vecs = list(self._dense_model.embed([text]))[0]
        sparse_vecs = list(self._sparse_model.embed([text]))[0]

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
        self._load_models()
        if not self.is_loaded or not texts:
            return [{
                "dense": [0.0] * 1024,
                "sparse": {"indices": [1], "values": [0.1]}
            } for _ in texts]

        dense_vecs_generator = self._dense_model.embed(texts)
        sparse_vecs_generator = self._sparse_model.embed(texts)

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
        self._load_models()
        if not self.is_loaded or not documents:
            return [1.0] * len(documents)

        scores = list(self._reranker_model.rerank(query, documents))
        return [float(score) for score in scores]

embedding_service = EnterpriseEmbeddingService()
