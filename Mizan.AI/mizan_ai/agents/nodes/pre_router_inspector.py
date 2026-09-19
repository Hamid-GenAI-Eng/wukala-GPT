import re
from mizan_ai.agents.state import GraphState

def pre_router_inspector_node(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"pre_router_info": {}}
        
    query = messages[-1].content
    # Extract actual user input if wrapped
    if "[USER INPUT BEGIN]" in query:
        try:
            query = query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
        except Exception:
            pass

    # 1. Deterministic script/language hint
    # Check for urdu/arabic characters
    has_urdu_chars = any('\u0600' <= c <= '\u06FF' for c in query)
    script = "urdu" if has_urdu_chars else "latin"
    
    # Roman Urdu heuristics (very basic deterministic hint)
    roman_ur_keywords = ["ki", "ka", "ke", "hai", "hain", "kya", "kyun", "kab", "case", "masla", "mera", "mujhe", "mein"]
    lower_query = query.lower()
    roman_ur_matches = sum(1 for w in roman_ur_keywords if f" {w} " in f" {lower_query} " or lower_query.startswith(f"{w} ") or lower_query.endswith(f" {w}"))
    
    language_hint = "unknown"
    if has_urdu_chars:
        language_hint = "ur"
    elif roman_ur_matches >= 2:
        language_hint = "roman_ur"
    elif any(c.isalpha() for c in query):
        language_hint = "en" # Fallback to English if latin and not Roman Urdu
        
    if has_urdu_chars and any(c.isascii() and c.isalpha() for c in query):
        language_hint = "mixed"

    # 2. Explicit entity canonicalization
    explicit_entities = {
        "statutes": [],
        "sections": [],
        "courts": [],
        "citations": [],
        "canonical_references": []
    }
    
    # Common Pakistani statutes mapping to canonical prefixes
    statute_map = {
        "crpc": "pk:statute:crpc",
        "criminal procedure code": "pk:statute:crpc",
        "code of criminal procedure": "pk:statute:crpc",
        "ppc": "pk:statute:ppc",
        "pakistan penal code": "pk:statute:ppc",
        "cpc": "pk:statute:cpc",
        "civil procedure code": "pk:statute:cpc",
        "code of civil procedure": "pk:statute:cpc",
        "constitution": "pk:constitution:1973",
        "constitution of pakistan": "pk:constitution:1973"
    }
    
    # Extract Section + Statute combinations (e.g. Section 497 CrPC, 489-F PPC)
    combined_regex = r"(?:section|sec\.|s\.|article|art\.)?\s*(\d+(?:-[A-Z])?)\s+(?:of\s+(?:the\s+)?)?(" + "|".join(statute_map.keys()) + r")"
    matches = re.finditer(combined_regex, query, re.IGNORECASE)
    for match in matches:
        section_num = match.group(1).upper()
        statute_raw = match.group(2).lower()
        canonical_statute = statute_map.get(statute_raw)
        canonical_key = f"{canonical_statute}:{section_num.lower()}"
        
        explicit_entities["sections"].append(section_num)
        explicit_entities["statutes"].append(statute_raw.upper())
        explicit_entities["canonical_references"].append({
            "type": "statutory_section",
            "jurisdiction": "pk",
            "statute": canonical_statute.split(":")[-1],
            "section": section_num,
            "canonical_key": canonical_key
        })

    # Citations (e.g. 2023 SCMR 123)
    citation_regex = r"\b(19\d{2}|20\d{2})\s*(SCMR|PLD|PCrLJ|YLR|CLC)\s*(\d+)\b"
    matches = re.finditer(citation_regex, query, re.IGNORECASE)
    for match in matches:
        year = match.group(1)
        journal = match.group(2).lower()
        page = match.group(3)
        canonical_key = f"pk:report:{journal}:{year}:{page}"
        
        explicit_entities["citations"].append(f"{year} {journal.upper()} {page}")
        explicit_entities["canonical_references"].append({
            "type": "case_citation",
            "jurisdiction": "pk",
            "journal": journal,
            "year": year,
            "page": page,
            "canonical_key": canonical_key
        })
        
    # Deduplicate arrays
    for k in ["statutes", "sections", "courts", "citations"]:
        explicit_entities[k] = list(set(explicit_entities[k]))
        
    # Deduplicate dicts in canonical_references based on key
    seen_keys = set()
    unique_refs = []
    for ref in explicit_entities["canonical_references"]:
        if ref["canonical_key"] not in seen_keys:
            seen_keys.add(ref["canonical_key"])
            unique_refs.append(ref)
    explicit_entities["canonical_references"] = unique_refs

        
    pre_router_info = {
        "script": script,
        "language_hint": language_hint,
        "explicit_entities": explicit_entities
    }
    
    return {"pre_router_info": pre_router_info}
