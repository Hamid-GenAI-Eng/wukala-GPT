import json
import os
import uuid
from mizan_ai.services.qdrant_service import qdrant_service
from mizan_ai.services.embedding_service import embedding_service

def load_dataset(file_path: str):
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_ingestion():
    print("🚀 Starting Golden Data Ingestion...")
    
    # 1. Drop existing collection to clear 1024-dimension mock data
    try:
        print(f"🗑️ Dropping existing collection '{qdrant_service.collection_name}'...")
        qdrant_service.client.delete_collection(qdrant_service.collection_name)
    except Exception as e:
        print(f"Collection drop skipped: {e}")
        
    # Re-initialize collection with 1024-dimension schema
    qdrant_service._ensure_collection()
    print("✅ Collection recreated with size=1024.")

    # 2. Load the Golden Dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "golden_dataset.json")
    golden_data = load_dataset(dataset_path)
    
    print(f"📊 Loaded {len(golden_data)} ground-truth documents to ingest.")
    
    # 3. Embed and Ingest
    for i, item in enumerate(golden_data):
        text_content = item["ground_truth"]
        
        print(f"Embedding Document {i+1}...")
        vectors = embedding_service.embed_text(text_content)
        
        point_id = str(uuid.uuid4())
        payload = {
            "text": text_content,
            "source_file": f"golden_knowledge_{i+1}.txt",
            "citation": f"Golden Rule {i+1}",
            "court": "Supreme Court of AI"
        }
        
        qdrant_service.upsert_document(
            point_id=point_id,
            dense_vector=vectors["dense"],
            sparse_vector=vectors["sparse"],
            payload=payload
        )
        print(f"✅ Ingested {payload['citation']}")
        
    print("\n🎉 Golden Data Ingestion Complete! Qdrant is now populated with real ONNX embeddings.")

if __name__ == "__main__":
    run_ingestion()
