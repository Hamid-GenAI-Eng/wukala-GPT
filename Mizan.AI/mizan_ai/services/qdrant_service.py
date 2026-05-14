from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from mizan_ai.core.config import settings

class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY
        )
        self.collection_name = "legal_corpus"
        self._ensure_collection()

    def _ensure_collection(self):
        if not self.client.collection_exists(self.collection_name):
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config={
                    "dense": rest.VectorParams(
                        size=1024, # bge-m3 dense vector size
                        distance=rest.Distance.COSINE
                    )
                },
                sparse_vectors_config={
                    "sparse": rest.SparseVectorParams(
                        modifier=rest.Modifier.IDF
                    )
                }
            )

    def hybrid_search(self, dense_vector: list, sparse_vector: dict, limit: int = 5):
        # Implementation of hybrid search combining dense and sparse
        # Note: Qdrant allows querying both simultaneously via FusionQuery
        response = self.client.query_points(
            collection_name=self.collection_name,
            prefetch=[
                rest.Prefetch(
                    query=dense_vector,
                    using="dense",
                    limit=limit
                ),
                rest.Prefetch(
                    query=rest.SparseVector(
                        indices=sparse_vector['indices'],
                        values=sparse_vector['values']
                    ),
                    using="sparse",
                    limit=limit
                )
            ],
            query=rest.FusionQuery(fusion=rest.Fusion.RRF),
            limit=limit
        )
        return response.points

    def upsert_document(self, point_id: str, dense_vector: list, sparse_vector: dict, payload: dict):
        self.client.upsert(
            collection_name=self.collection_name,
            points=[
                rest.PointStruct(
                    id=point_id,
                    vector={
                        "dense": dense_vector,
                        "sparse": rest.SparseVector(
                            indices=sparse_vector['indices'],
                            values=sparse_vector['values']
                        )
                    },
                    payload=payload
                )
            ]
        )

qdrant_service = QdrantService()
