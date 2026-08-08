import json
import os
import sys
import time

# --- HACK: Bypass Ragas/Langchain ChatVertexAI Bug ---
import types
dummy_vertex = types.ModuleType('langchain_community.chat_models.vertexai')
dummy_vertex.ChatVertexAI = None
sys.modules['langchain_community.chat_models.vertexai'] = dummy_vertex
# -----------------------------------------------------

# Mizan AI Imports MUST GO FIRST to prevent ONNX/Torch DLL collisions on Windows
from langchain_core.messages import HumanMessage
from mizan_ai.agents.graph import app_graph
from mizan_ai.services.llm_service import llm_service

from typing import List
from datasets import Dataset
from ragas import evaluate
from ragas.metrics import (
    ContextPrecision,
    ContextRecall,
    Faithfulness,
)
from ragas.run_config import RunConfig

def load_dataset(file_path: str) -> List[dict]:
    with open(file_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def run_evaluation():
    print("🚀 Starting Mizan AI RAG Evaluation with Ragas...")
    
    # Load Golden Dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(base_dir, "golden_dataset.json")
    golden_data = load_dataset(dataset_path)
    
    questions = []
    answers = []
    contexts = []
    ground_truths = []
    
    print(f"📊 Loaded {len(golden_data)} test queries (English, Professional Urdu, Broken Roman Urdu).")
    
    for i, item in enumerate(golden_data):
        query = item["query"]
        ground_truth = item["ground_truth"]
        
        print(f"\n[{i+1}/{len(golden_data)}] Testing Query: {query}")
        
        # Configure thread for LangGraph memory
        config = {"configurable": {"thread_id": f"eval_thread_{i}"}}
        
        # Invoke the main Mizan AI graph
        state = app_graph.invoke(
            {"messages": [HumanMessage(content=query)]}, 
            config=config
        )
        
        # Extract Answer
        final_answer = state["messages"][-1].content
        
        # Extract Context Documents retrieved by Qdrant
        retrieved_docs = state.get("context_documents", [])
        retrieved_texts = [d.get("content", "") for d in retrieved_docs]
        
        questions.append(query)
        answers.append(final_answer)
        contexts.append(retrieved_texts)
        ground_truths.append(ground_truth)  # Ragas expects a string in newer versions
        
        print(f"✅ Generated Answer length: {len(final_answer)} chars")
        print(f"✅ Retrieved {len(retrieved_docs)} context documents")
        time.sleep(3) # Prevent Groq Rate Limiting (causes the 64-char fallback error)
        
    # Format for HuggingFace Dataset
    data = {
        "question": questions,
        "answer": answers,
        "contexts": contexts,
        "ground_truth": ground_truths
    }
    dataset = Dataset.from_dict(data)
    
    print("\n🧠 Handing over to Ragas LLM-as-a-Judge for metric scoring...")
    
    # Use the FREE Groq LLM that Mizan AI is already using instead of paid OpenAI
    evaluator_llm = llm_service.get_fast_llm()
    
    try:
        # We wrap the evaluation in the specific LLM to bypass OpenAI requirement.
        # Note: answer_relevance requires embeddings (which OpenAI usually provides). 
        # To keep it 100% free and avoid OpenAI, we will evaluate the 3 core LLM metrics first.
        # Ragas bombs the API with concurrent requests by default, which causes Groq's Free Tier to timeout.
        # We enforce strict rate limiting here: 1 worker, 120s timeout.
        config = RunConfig(timeout=120, max_retries=10, max_workers=1)
        
        result = evaluate(
            dataset = dataset, 
            metrics=[
                ContextPrecision(),
                ContextRecall(),
                Faithfulness(),
            ],
            llm=evaluator_llm,
            run_config=config
        )
        
        print("\n🏆 EVALUATION RESULTS:")
        print(result)
        
    except Exception as e:
        print(f"\n❌ Ragas Evaluation Failed: {e}")
        print("💡 Hint: Ensure your GROQ_API_KEY is set in the .env file.")

if __name__ == "__main__":
    run_evaluation()
