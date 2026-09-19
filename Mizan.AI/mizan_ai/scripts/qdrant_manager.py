import sys
import os
import argparse
import re
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))

from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
from mizan_ai.core.config import settings

def get_client():
    return QdrantClient(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        api_key=settings.QDRANT_API_KEY
    )

def get_collection_name():
    model_slug = re.sub(r'[^a-zA-Z0-9]', '_', settings.MIZAN_DENSE_MODEL).strip('_').lower()
    return f"legal_corpus__{model_slug}__d{settings.MIZAN_DENSE_DIMENSION}__chunker_v2__schema_v2"

ALIAS_NAME = "mizan_legal_active"
ROLLBACK_FILE = os.path.join(os.path.dirname(__file__), "qdrant_rollback_state.json")

def create():
    client = get_client()
    collection_name = get_collection_name()
    if not client.collection_exists(collection_name):
        print(f"[Qdrant] Creating new versioned collection: {collection_name}")
        client.create_collection(
            collection_name=collection_name,
            vectors_config={
                "dense": rest.VectorParams(
                    size=settings.MIZAN_DENSE_DIMENSION,
                    distance=rest.Distance.COSINE
                )
            },
            sparse_vectors_config={
                "sparse": rest.SparseVectorParams(
                    modifier=rest.Modifier.IDF
                )
            }
        )
        print("Done.")
    else:
        print(f"Collection {collection_name} already exists.")

from mizan_ai.ingestion.parser import extract_chunks_from_document
from mizan_ai.services.embedding_service import embedding_service
from mizan_ai.services.qdrant_service import QdrantService
import glob
import uuid
import os

def ingest(directory):
    manager = QdrantService(verify_alias=False)
    print(f"Ingesting documents from {directory} into {manager.collection_name}...")
    pdf_files = glob.glob(os.path.join(directory, "*.pdf"))
    if not pdf_files:
        print(f"No PDF files found in {directory}")
        return
        
    points_payloads = []
    for pdf_path in pdf_files:
        print(f"Parsing {pdf_path}...")
        filename = os.path.basename(pdf_path)
        chunks = extract_chunks_from_document(pdf_path, filename)
        for chunk in chunks:
            # Reusing the chunk dictionary format returned by extract_chunks_from_document
            # Note: extract_chunks_from_document already sets point_id, text, and payload!
            embeddings = embedding_service.embed_text(chunk["text"])
            dense_vec = embeddings["dense"]
            sparse_vec = embeddings["sparse"]
            points_payloads.append({
                "point_id": chunk["point_id"],
                "dense_vector": dense_vec,
                "sparse_vector": sparse_vec,
                "payload": chunk["payload"]
            })
            
    print(f"Upserting {len(points_payloads)} chunks to Qdrant...")
    manager.upsert_documents(points_payloads)
    print("Done. Ready to validate.")

def validate():
    client = get_client()
    collection_name = get_collection_name()
    if not client.collection_exists(collection_name):
        print(f"FAIL: Collection {collection_name} does not exist.")
        sys.exit(1)
        
    info = client.get_collection(collection_name)
    print(f"Validation successful. Points count: {info.points_count}")
    return True

def promote():
    client = get_client()
    collection_name = get_collection_name()
    
    # 1. Verify target collection exists and is valid
    if not client.collection_exists(collection_name):
        print(f"FAIL: Cannot promote because collection {collection_name} does not exist.")
        sys.exit(1)
        
    info = client.get_collection(collection_name)
    if info.points_count == 0:
        print("FAIL: Cannot promote an empty/partially ingested collection.")
        sys.exit(1)
        
    # 2. Check current alias target for rollback
    current_target = None
    aliases = client.get_aliases()
    for alias in aliases.aliases:
        if alias.alias_name == ALIAS_NAME:
            current_target = alias.collection_name
            break
            
    if current_target:
        print(f"Saving rollback state: {current_target}")
        with open(ROLLBACK_FILE, "w") as f:
            json.dump({"previous_collection": current_target}, f)
            
    print(f"Promoting alias '{ALIAS_NAME}' to point to '{collection_name}'")
    client.update_collection_aliases(
        change_aliases_operations=[
            rest.CreateAliasOperation(
                create_alias=rest.CreateAlias(
                    collection_name=collection_name,
                    alias_name=ALIAS_NAME
                )
            )
        ]
    )
    print("Promotion successful.")

def rollback():
    client = get_client()
    if not os.path.exists(ROLLBACK_FILE):
        print("FAIL: No rollback state found.")
        sys.exit(1)
        
    with open(ROLLBACK_FILE, "r") as f:
        state = json.load(f)
        
    prev_collection = state.get("previous_collection")
    if not prev_collection:
        print("FAIL: Invalid rollback state.")
        sys.exit(1)
        
    if not client.collection_exists(prev_collection):
        print(f"FAIL: Previous collection {prev_collection} no longer exists.")
        sys.exit(1)
        
    print(f"Rolling back alias '{ALIAS_NAME}' to '{prev_collection}'")
    client.update_collection_aliases(
        change_aliases_operations=[
            rest.CreateAliasOperation(
                create_alias=rest.CreateAlias(
                    collection_name=prev_collection,
                    alias_name=ALIAS_NAME
                )
            )
        ]
    )
    print("Rollback successful.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Qdrant Lifecycle Manager")
    parser.add_argument("command", choices=["create", "ingest", "validate", "promote", "rollback"])
    parser.add_argument("--dir", help="Directory to ingest from")
    
    args = parser.parse_args()
    
    if args.command == "create":
        create()
    elif args.command == "ingest":
        if not args.dir:
            print("Must specify --dir for ingestion")
            sys.exit(1)
        ingest(args.dir)
    elif args.command == "validate":
        validate()
    elif args.command == "promote":
        promote()
    elif args.command == "rollback":
        rollback()
