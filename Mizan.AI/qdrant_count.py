import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

client = QdrantClient(host='localhost', port=6333)

count_result = client.count(
    collection_name='legal_corpus',
    count_filter=Filter(
        must=[
            FieldCondition(key='court', match=MatchValue(value='Supreme Court of Pakistan')),
            FieldCondition(key='citation', match=MatchValue(value='Citation not found'))
        ]
    )
)
print(f"Total fabricated Supreme Court chunks: {count_result.count}")
