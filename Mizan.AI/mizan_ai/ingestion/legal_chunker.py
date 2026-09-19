import re
from typing import List, Dict

def parse_canonical_reference(text: str, default_statute: str = None) -> str:
    text_lower = text.lower()
    
    # Check for Citations first
    citation_match1 = re.search(r'(pld|scmr|pcrlj|ylr|clc)[\s\.]*(\d{4})[\s\.]*[a-z]*[\s\.]*(\d+)', text_lower)
    citation_match2 = re.search(r'(\d{4})[\s\.]*(pld|scmr|pcrlj|ylr|clc)[\s\.]*[a-z]*[\s\.]*(\d+)', text_lower)
    
    if citation_match1:
        return f"pk:report:{citation_match1.group(1)}:{citation_match1.group(2)}:{citation_match1.group(3)}"
    elif citation_match2:
        return f"pk:report:{citation_match2.group(2)}:{citation_match2.group(1)}:{citation_match2.group(3)}"
    
    statute = default_statute
    if "crpc" in text_lower or "cr.p.c" in text_lower or "criminal procedure" in text_lower: statute = "crpc"
    elif "ppc" in text_lower or "p.p.c" in text_lower or "penal code" in text_lower: statute = "ppc"
    elif "constitution" in text_lower or "art" in text_lower: statute = "constitution"
    elif "cpc" in text_lower or "c.p.c" in text_lower or "civil procedure" in text_lower: statute = "cpc"
    
    if not statute:
        return text_lower.replace(" ", "")
        
    # Extract the number part properly, allowing hyphens and letters like 489-F or 497
    match = re.search(r'\d+[a-z]?(?:-[a-z])?', text_lower)
    if not match:
        return text_lower.replace(" ", "")
        
    num = match.group(0).lower()
    if "-" not in num and re.match(r'\d+[a-z]', num):
        num = num[:-1] + "-" + num[-1]
        
    return f"pk:statute:{statute}:{num}"

def extract_metadata_from_text(text: str, filename: str) -> Dict:
    """
    Extracts explicit metadata ONLY when confidently identifiable.
    No hallucination.
    """
    metadata = {
        "document_type": "other",
        "jurisdiction": "pk",
        "court": None,
        "citation": None,
        "date": None,
        "title": filename,
        "section": None,
        "chapter": None,
        "source_file": filename,
        "canonical_references": []
    }
    
    # Simple citation extraction (Canonical)
    citation_match = re.search(r'(PLD|SCMR|PCrLJ|YLR|CLC)\s*(\d+)\s*[A-Za-z]+\s*(\d+)', text[:2000])
    if citation_match:
        journal = citation_match.group(1).lower()
        year = citation_match.group(2)
        page = citation_match.group(3)
        metadata["citation"] = citation_match.group(0)
        metadata["document_type"] = "judgment"
        metadata["canonical_references"].append(f"pk:report:{journal}:{year}:{page}")
        
        if "SCMR" in metadata["citation"] or "Supreme Court" in text[:1000]:
            metadata["court"] = "Supreme Court of Pakistan"
            
    # Simple statute extraction
    if "Act, " in text[:500] or "Ordinance, " in text[:500] or "Code" in filename:
        metadata["document_type"] = "statute"
        
    return metadata

def chunk_statute(text: str, base_metadata: Dict) -> List[Dict]:
    """
    Chunks a statute intelligently by Chapter and Section.
    """
    chunks = []
    lines = text.split('\n')
    current_chapter = None
    current_section = None
    current_chunk_text = []
    
    for line in lines:
        line_strip = line.strip()
        
        # Detect Chapter
        chapter_match = re.match(r'^(?:CHAPTER|Chapter)\s+([IVXLCDM\d]+)', line_strip)
        if chapter_match:
            current_chapter = chapter_match.group(1)
            continue
            
        # Detect Section
        section_match = re.match(r'^(?:Section|Sec\.|S\.)\s+(\d+(?:-[A-Z])?)', line_strip)
        if section_match:
            # Save previous chunk
            if current_chunk_text:
                meta = base_metadata.copy()
                meta["chapter"] = current_chapter
                meta["section"] = current_section
                
                # Append canonical key for the section if it's a known statute
                if current_section and meta.get("document_type") == "statute":
                    # basic matching based on filename or text
                    statute_id = "unknown"
                    title = meta.get("title", "").lower()
                    if "crpc" in title or "criminal procedure" in title:
                        statute_id = "crpc"
                    elif "ppc" in title or "penal code" in title:
                        statute_id = "ppc"
                    elif "cpc" in title or "civil procedure" in title:
                        statute_id = "cpc"
                    elif "constitution" in title:
                        statute_id = "constitution"
                        
                    if statute_id != "unknown":
                        canonical = f"pk:statute:{statute_id}:{current_section.lower()}"
                        meta["canonical_references"] = meta.get("canonical_references", []) + [canonical]
                
                chunks.append({
                    "text": "\n".join(current_chunk_text),
                    "metadata": meta
                })
            current_section = section_match.group(1)
            current_chunk_text = [line_strip]
        else:
            if line_strip:
                current_chunk_text.append(line_strip)
                
    # Add final chunk
    if current_chunk_text:
        meta = base_metadata.copy()
        meta["chapter"] = current_chapter
        meta["section"] = current_section
        
        if current_section and meta.get("document_type") == "statute":
            statute_id = "unknown"
            title = meta.get("title", "").lower()
            if "crpc" in title or "criminal procedure" in title:
                statute_id = "crpc"
            elif "ppc" in title or "penal code" in title:
                statute_id = "ppc"
            elif "cpc" in title or "civil procedure" in title:
                statute_id = "cpc"
            elif "constitution" in title:
                statute_id = "constitution"
                
            if statute_id != "unknown":
                canonical = f"pk:statute:{statute_id}:{current_section.lower()}"
                meta["canonical_references"] = meta.get("canonical_references", []) + [canonical]
                
        chunks.append({
            "text": "\n".join(current_chunk_text),
            "metadata": meta
        })
        
    return chunks

def chunk_judgment(text: str, base_metadata: Dict) -> List[Dict]:
    """
    Chunks a judgment by paragraphs or headings, avoiding hallucinated semantic labels.
    """
    chunks = []
    # Split by double newline (paragraphs)
    paragraphs = re.split(r'\n\s*\n', text)
    
    current_chunk = []
    current_length = 0
    
    for p in paragraphs:
        p_clean = p.strip()
        if not p_clean:
            continue
            
        # Very basic fallback chunking if paragraph is too long, we just append it
        current_chunk.append(p_clean)
        current_length += len(p_clean.split())
        
        if current_length > 400: # Target around 400-500 words per chunk
            meta = base_metadata.copy()
            chunks.append({
                "text": "\n\n".join(current_chunk),
                "metadata": meta
            })
            current_chunk = []
            current_length = 0
            
    if current_chunk:
        meta = base_metadata.copy()
        chunks.append({
            "text": "\n\n".join(current_chunk),
            "metadata": meta
        })
        
    return chunks

def chunk_legal_text(text: str, filename: str) -> List[Dict]:
    """
    Main entry point for legal chunking.
    """
    metadata = extract_metadata_from_text(text, filename)
    
    if metadata["document_type"] == "statute":
        chunks = chunk_statute(text, metadata)
        # Fallback if statute chunker failed to find sections
        if len(chunks) < 2 and len(text.split()) > 1000:
            chunks = chunk_judgment(text, metadata)
    else:
        chunks = chunk_judgment(text, metadata)
        
    # Final pass to inject context into text (Prepending) for embedding robustness
    for chunk in chunks:
        meta = chunk["metadata"]
        context_str = ""
        if meta.get("citation"):
            context_str += f"[Citation: {meta['citation']}] "
        if meta.get("court"):
            context_str += f"[Court: {meta['court']}] "
        if meta.get("chapter"):
            context_str += f"[Chapter: {meta['chapter']}] "
        if meta.get("section"):
            context_str += f"[Section: {meta['section']}] "
            
        chunk["text"] = f"{context_str}\n{chunk['text']}".strip()
        
    return chunks
