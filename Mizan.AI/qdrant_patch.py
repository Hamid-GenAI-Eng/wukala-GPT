import os
from qdrant_client import QdrantClient
from qdrant_client.http.models import Filter, FieldCondition, MatchValue

client = QdrantClient(host='localhost', port=6333)

print("Fetching fabricated chunks...")
results, next_page = client.scroll(
    collection_name='legal_corpus',
    scroll_filter=Filter(
        must=[
            FieldCondition(key='court', match=MatchValue(value='Supreme Court of Pakistan')),
            FieldCondition(key='citation', match=MatchValue(value='Citation not found'))
        ]
    ),
    limit=10000,
    with_payload=True
)

patched_count = 0
examples = []

for r in results:
    payload = r.payload
    filename = payload.get('source_file', '')
    old_court = payload.get('court')
    old_citation = payload.get('citation')
    
    is_statute = any(keyword in filename.lower() for keyword in ['act', 'code', 'ordinance', 'order', 'constitution', 'rules'])
    
    if is_statute:
        act_name = filename.replace(".pdf", "").replace(".txt", "").replace("_", " ").title()
        new_court = ""
        new_citation = act_name
    else:
        new_court = "Unknown Court"
        new_citation = f"[Citation could not be extracted — verify source document: {filename}]"
    
    if patched_count < 3:
        examples.append({
            "filename": filename,
            "old": f"Court: {old_court} | Citation: {old_citation}",
            "new": f"Court: {new_court} | Citation: {new_citation}"
        })
    
    client.set_payload(
        collection_name='legal_corpus',
        payload={
            "court": new_court,
            "citation": new_citation
        },
        points=[r.id]
    )
    patched_count += 1

print(f"Patched {patched_count} chunks.")
print("Examples:")
for ex in examples:
    print(f"- Filename: {ex['filename']}")
    print(f"  Before: {ex['old']}")
    print(f"  After:  {ex['new']}\n")
