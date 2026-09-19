import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from mizan_ai.services.qdrant_service import qdrant_service
from qdrant_client import models

def inspect_document(doc_id, limit=3):
    print(f"\n{'='*60}")
    print(f"Inspecting Document: {doc_id}")
    print(f"{'='*60}")
    
    try:
        points = qdrant_service.client.scroll(
            collection_name=qdrant_service.collection_name,
            scroll_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="source_file",
                        match=models.MatchValue(value=doc_id)
                    )
                ]
            ),
            limit=limit,
            with_payload=True,
            with_vectors=False
        )[0]
        
        if not points:
            print("No chunks found.")
            return
            
        for i, p in enumerate(points):
            payload = p.payload
            print(f"\n--- Chunk {i+1} ---")
            print(f"Chunk ID: {payload.get('chunk_id')}")
            print(f"Canonical References: {payload.get('canonical_references')}")
            print(f"Citation: {payload.get('citation')}")
            print(f"Text Length: {len(payload.get('text', ''))}")
            # Print a snippet
            text = payload.get('text', '')
            print(f"Text Snippet: {text[:200]}...")
            if len(text) > 200:
                print(f"               ...{text[-100:]}")
                
    except Exception as e:
        print(f"Error inspecting {doc_id}: {e}")

if __name__ == "__main__":
    sys.stdout.reconfigure(encoding='utf-8')
    docs_to_inspect = [
        "ANTI-TERRORISM ACT_ 1997.pdf",
        "ARBITRATION ACT_ 1940.pdf",
        "2024 S C M R 1071.pdf",
        "2024 S C M R 1085.pdf"
    ]
    for d in docs_to_inspect:
        inspect_document(d)
