def chunk_text(text: str, metadata: dict, chunk_size: int = 500) -> list[dict]:
    """
    Splits text into chunks and PREPENDS context to each chunk
    to prevent LLM hallucination during RAG.
    """
    words = text.split()
    chunks = []
    
    for i in range(0, len(words), chunk_size):
        chunk_words = words[i:i + chunk_size]
        raw_chunk_text = " ".join(chunk_words)
        
        # Strict context prepending
        annotated_text = f"[{metadata['court']} - {metadata['citation']}] {raw_chunk_text}"
        
        chunks.append({
            "text": annotated_text,
            "metadata": metadata
        })
        
    return chunks
