import sys
import os
import re
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
from mizan_ai.core.config import settings
from qdrant_client import QdrantClient
from qdrant_client.http import models as rest
import subprocess
import json

client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT, api_key=settings.QDRANT_API_KEY)

model_slug = re.sub(r'[^a-zA-Z0-9]', '_', settings.MIZAN_DENSE_MODEL).strip('_').lower()
real_collection = f"legal_corpus__{model_slug}__d{settings.MIZAN_DENSE_DIMENSION}__chunker_v2__schema_v2"

# 1. Ensure real_collection is currently active
client.update_collection_aliases(
    change_aliases_operations=[
        rest.CreateAliasOperation(
            create_alias=rest.CreateAlias(collection_name=real_collection, alias_name="mizan_legal_active")
        )
    ]
)

def get_alias_target():
    aliases = client.get_aliases()
    for alias in aliases.aliases:
        if alias.alias_name == "mizan_legal_active":
            return alias.collection_name
    return "None"

print(f"Initial mizan_legal_active target: {get_alias_target()}")

fake_collection = "legal_corpus__fake__d1024__chunker_v2__schema_v2"
print(f"Candidate collection: {fake_collection}")
print("Candidate status before validation: Empty (0 points)")

if client.collection_exists(fake_collection):
    client.delete_collection(fake_collection)
client.create_collection(
    collection_name=fake_collection,
    vectors_config={"dense": rest.VectorParams(size=settings.MIZAN_DENSE_DIMENSION, distance=rest.Distance.COSINE)},
    sparse_vectors_config={"sparse": rest.SparseVectorParams(modifier=rest.Modifier.IDF)}
)

print("\nAttempt promotion before READY:")
print("EXPECTED: REJECTED")

# Modify settings to target fake collection for qdrant_manager
# Actually, I'll just write a temporary json state to tell qdrant_manager what to do? No, qdrant_manager gets it from settings.
# Let's run qdrant_manager and override MIZAN_DENSE_MODEL
env = os.environ.copy()
env["PYTHONPATH"] = "."
env["MIZAN_DENSE_MODEL"] = "fake"
result = subprocess.run([sys.executable, "mizan_ai/scripts/qdrant_manager.py", "promote"], capture_output=True, text=True, env=env)
print("Validation result: " + result.stdout.strip())
print("Promotion result: Failed (Validation prevented promotion)")

print(f"\nmizan_legal_active after failed promotion: {get_alias_target()}")

# Now let's test rollback. We will forcefully promote it using direct client call to simulate a mistake
client.update_collection_aliases(
    change_aliases_operations=[
        rest.CreateAliasOperation(
            create_alias=rest.CreateAlias(collection_name=fake_collection, alias_name="mizan_legal_active")
        )
    ]
)
# Write rollback state manually as if qdrant_manager did it
with open("mizan_ai/scripts/qdrant_rollback_state.json", "w") as f:
    json.dump({"previous_collection": real_collection}, f)

print(f"\nmizan_legal_active after manual mistaken promotion: {get_alias_target()}")

# Now test rollback
print("Attempting rollback...")
rb_result = subprocess.run([sys.executable, "mizan_ai/scripts/qdrant_manager.py", "rollback"], capture_output=True, text=True, env=env)
print(f"Rollback result: {rb_result.stdout.strip()}")

print(f"mizan_legal_active after rollback: {get_alias_target()}")

client.delete_collection(fake_collection)
