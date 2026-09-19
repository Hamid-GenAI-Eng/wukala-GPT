import json
import time
import uuid
import datetime
from typing import List, Dict, Any

class MizanBenchEvaluator:
    def __init__(self, dataset_path: str):
        self.dataset_path = dataset_path
        with open(dataset_path, 'r', encoding='utf-8') as f:
            self.test_cases = json.load(f)
            
    def calculate_metrics(self, retrieved_chunks: List[str], expected_chunks: List[str], expected_docs: List[str]) -> Dict[str, float]:
        """
        Calculate Recall@5, Recall@10, MRR, and NDCG@10.
        Note: For Phase 1 we use basic exact string match of IDs.
        """
        if not expected_chunks and not expected_docs:
            return {"Recall@5": 1.0, "Recall@10": 1.0, "MRR": 1.0, "NDCG@10": 1.0}

        metrics = {"Recall@5": 0.0, "Recall@10": 0.0, "MRR": 0.0, "NDCG@10": 0.0}
        
        # Recall@5
        hits_at_5 = sum(1 for c in retrieved_chunks[:5] if c in expected_chunks or any(d in c for d in expected_docs))
        metrics["Recall@5"] = min(1.0, hits_at_5 / max(1, len(expected_chunks) + len(expected_docs)))
        
        # Recall@10
        hits_at_10 = sum(1 for c in retrieved_chunks[:10] if c in expected_chunks or any(d in c for d in expected_docs))
        metrics["Recall@10"] = min(1.0, hits_at_10 / max(1, len(expected_chunks) + len(expected_docs)))
        
        # MRR
        for idx, c in enumerate(retrieved_chunks):
            if c in expected_chunks or any(d in c for d in expected_docs):
                metrics["MRR"] = 1.0 / (idx + 1)
                break
                
        # NDCG@10 (Simplified binary relevance for now)
        import math
        dcg = 0.0
        idcg = sum(1.0 / math.log2(i + 2) for i in range(min(10, len(expected_chunks) + len(expected_docs))))
        
        for idx, c in enumerate(retrieved_chunks[:10]):
            if c in expected_chunks or any(d in c for d in expected_docs):
                dcg += 1.0 / math.log2(idx + 2)
                
        metrics["NDCG@10"] = dcg / idcg if idcg > 0 else 0.0
        
        return metrics

    def run_benchmark(self, retrieval_function, run_name: str = "baseline"):
        results = []
        overall_metrics = {"Recall@5": 0.0, "Recall@10": 0.0, "MRR": 0.0, "NDCG@10": 0.0, "latency_ms": 0.0}
        
        for case in self.test_cases:
            if not case.get("answerable", True) or case.get("expected_behavior") != "retrieve":
                continue # Skip non-retrieval tasks for retrieval benchmark
                
            start_time = time.time()
            
            # Simulated call to actual retriever architecture
            try:
                retrieved = retrieval_function(case["query"])
                retrieved_ids = [doc.get("chunk_id", doc.get("document_id")) for doc in retrieved]
            except Exception as e:
                print(f"Error on {case['id']}: {e}")
                retrieved_ids = []
                
            latency = (time.time() - start_time) * 1000
            
            expected_docs = [doc["document_id"] for doc in case.get("relevant_documents", [])]
            expected_chunks = [chunk["chunk_id"] for chunk in case.get("relevant_chunks", [])]
            
            print(f"Expected documents: {expected_docs}")
            print(f"Expected chunks: {expected_chunks}")
            
            case_metrics = self.calculate_metrics(retrieved_ids, expected_chunks, expected_docs)
            case_metrics["latency_ms"] = latency
            
            print("Scores for this query:")
            print(json.dumps(case_metrics, indent=2))
            
            if case_metrics["Recall@10"] == 0:
                print("Reasoning: 0 Recall@10. None of the retrieved top-10 chunks matched expected document/chunk IDs. The ground-truth IDs may be incorrect, or the retrieval parameters failed to find them.")
            else:
                print("Reasoning: Expected evidence was successfully found in top-10.")
                
            results.append({
                "case_id": case["id"],
                "metrics": case_metrics,
                "retrieved": retrieved_ids[:10]
            })
            
            for k in overall_metrics:
                overall_metrics[k] += case_metrics[k]
                
        # Average metrics
        if results:
            for k in overall_metrics:
                overall_metrics[k] /= len(results)
                
        report = {
            "timestamp": datetime.datetime.now().isoformat(),
            "run_name": run_name,
            "overall_metrics": overall_metrics,
            "results": results
        }
        
        # Save report
        filename = f"mizan_bench_results_{run_name}_{int(time.time())}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
            
        return report

# For isolated testing:
if __name__ == "__main__":
    evaluator = MizanBenchEvaluator("seed_dataset.json")
    print("Loaded test cases:", len(evaluator.test_cases))
