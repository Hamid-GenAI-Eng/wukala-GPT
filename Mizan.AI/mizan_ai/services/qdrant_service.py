import json
import re
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from mizan_ai.core.config import settings

class QdrantService:
    def __init__(self, verify_alias=True):
        self.client = QdrantClient(
            host=settings.QDRANT_HOST,
            port=settings.QDRANT_PORT,
            api_key=settings.QDRANT_API_KEY
        )
        # Deterministic configuration fingerprint
        model_slug = re.sub(r'[^a-zA-Z0-9]', '_', settings.MIZAN_DENSE_MODEL).strip('_').lower()
        self.collection_name = f"legal_corpus__{model_slug}__d{settings.MIZAN_DENSE_DIMENSION}__chunker_v2__schema_v2"
        self.alias_name = "mizan_legal_active"
        if verify_alias:
            self._verify_alias()

    def _verify_alias(self):
        """Verifies that the alias exists at startup. Fails loudly if not."""
        aliases = self.client.get_aliases()
        alias_exists = False
        for alias in aliases.aliases:
            if alias.alias_name == self.alias_name:
                alias_exists = True
                break
        
        if not alias_exists:
            raise RuntimeError(f"Qdrant alias '{self.alias_name}' does not exist. Run qdrant_manager.py to initialize the database before starting the application.")

    def hybrid_search(self, dense_vector: list, sparse_vector: dict, limit: int = 5):
        # We query the alias
        prefetch_limit = limit * 4
        
        response = self.client.query_points(
            collection_name=self.alias_name,
            prefetch=[
                rest.Prefetch(
                    query=dense_vector,
                    using="dense",
                    limit=prefetch_limit
                ),
                rest.Prefetch(
                    query=rest.SparseVector(
                        indices=sparse_vector['indices'],
                        values=sparse_vector['values']
                    ),
                    using="sparse",
                    limit=prefetch_limit
                )
            ],
            query=rest.FusionQuery(fusion=rest.Fusion.RRF),
            limit=limit
        )
        return response.points

    def exact_reference_search(self, queries: list[str], limit: int = 5):
        """
        Retrieves chunks that exactly match explicit references in metadata.
        Uses exact string match on citation, section, or court.
        """
        if not queries:
            return []
            
        should_conditions = []
        for q in queries:
            should_conditions.extend([
                rest.FieldCondition(key="citation", match=rest.MatchText(text=q)),
                rest.FieldCondition(key="section", match=rest.MatchText(text=q)),
                rest.FieldCondition(key="title", match=rest.MatchText(text=q))
            ])
            
        filter_query = rest.Filter(should=should_conditions)
        
        response = self.client.scroll(
            collection_name=self.alias_name,
            scroll_filter=filter_query,
            limit=limit,
            with_payload=True,
            with_vectors=False
        )
        return response[0]

    def upsert_document(self, point_id: str, dense_vector: list, sparse_vector: dict, payload: dict):
        self.client.upsert(
            collection_name=self.collection_name, # Always upsert to the underlying physical collection
            points=[
                rest.PointStruct(
                    id=point_id,
                    vector={
                        "dense": dense_vector,
                        "sparse": rest.SparseVector(
                            indices=sparse_vector['indices'],
                            values=sparse_vector['values']
                        )
                    }
                )
            ]
        )

    def upsert_documents(self, points_payloads: list[dict]):
        """
        Batch upsert documents into Qdrant.
        Expects a list of dicts with: point_id, dense_vector, sparse_vector, payload
        """
        if not points_payloads:
            return

        points = []
        for p in points_payloads:
            points.append(
                rest.PointStruct(
                    id=p["point_id"],
                    vector={
                        "dense": p["dense_vector"],
                        "sparse": rest.SparseVector(
                            indices=p["sparse_vector"]['indices'],
                            values=p["sparse_vector"]['values']
                        )
                    },
                    payload=p["payload"]
                )
            )
            
        self.client.upsert(
            collection_name=self.collection_name,
            points=points
        )

qdrant_service = QdrantService()
