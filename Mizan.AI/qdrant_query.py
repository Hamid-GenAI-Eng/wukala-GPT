import os
import json
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchText

client = QdrantClient(host='localhost', port=6333)
results, _ = client.scroll(
    collection_name='legal_corpus',
    scroll_filter=Filter(
        must=[
            FieldCondition(key='source_file', match=MatchText(text='THE PAKISTAN PENAL CODE.pdf')),
            FieldCondition(key='text', match=MatchText(text='378'))
        ]
    ),
    limit=5,
    with_payload=True
)

with open('qdrant_output.txt', 'w', encoding='utf-8') as f:
    for r in results:
        text = r.payload.get('text', '')
        f.write(f"SOURCE: {r.payload.get('source_file')}\nTEXT: {text}\n---\n")
