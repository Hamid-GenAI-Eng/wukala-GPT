import json
from mizan_ai.agents.state import GraphState
from mizan_ai.services.llm_service import llm_service
from langchain_core.messages import SystemMessage, HumanMessage

def query_normalizer_node(state: GraphState):
    messages = state.get("messages", [])
    if not messages:
        return {"normalized_query": {}}
        
    original_query = messages[-1].content
    if "[USER INPUT BEGIN]" in original_query:
        try:
            original_query = original_query.split("[USER INPUT BEGIN]")[1].split("[USER INPUT END]")[0].strip()
        except Exception:
            pass

    pre_router_info = state.get("pre_router_info", {})
    language_hint = pre_router_info.get("language_hint", "unknown")
    explicit_entities = pre_router_info.get("explicit_entities", {})
    
    # We only run this node for retrieval/research intents.
    # LLM Canonicalization
    prompt = f"""You are the MizanAI Legal Query Normalizer for Pakistani Law.
Your job is to normalize the user's query into a canonical English legal search query, extract inferred entities, and generate search variants.

Original Query: "{original_query}"
Language Hint from Pre-Router: "{language_hint}"
Explicit Entities from Pre-Router: {json.dumps(explicit_entities)}

INSTRUCTIONS:
1. canonical_query: If the original query is Urdu or Roman Urdu, translate and formally express it in Pakistani legal English. If it is already English, polish it.
   - ACRONYM EXPANSION: You MUST expand the following acronyms if they appear in the query:
     * PPC -> Pakistan Penal Code
     * CrPC -> Code of Criminal Procedure
     * CPC -> Civil Procedure Code
     * QSO -> Qanun-e-Shahadat Order
     * PLD -> All Pakistan Legal Decisions
     * SCMR -> Supreme Court Monthly Review
     * FIR -> First Information Report
2. inferred_entities: Extract ANY legal concepts, statutes, sections, courts that are implied or mentioned but NOT in the explicit entities list. Do NOT hallucinate.
3. search_variants: Provide up to 3 distinct search queries to maximize retrieval.
   - One exact/literal variant (if applicable). Make sure acronyms are expanded here too!
   - One semantic/conceptual variant.
   - One variant in the original language if it was Urdu/Roman Urdu.

Return ONLY valid JSON matching this schema:
{{
    "canonical_query": "string",
    "inferred_entities": {{
        "statutes": ["string"],
        "sections": ["string"],
        "courts": ["string"],
        "legal_concepts": ["string"]
    }},
    "search_variants": ["string", "string", "string"],
    "entity_confidence": "high|medium|low"
}}
"""
    try:
        from mizan_ai.core.utils import clean_llm_json
        llm = llm_service.get_fast_llm()
        
        msgs = [SystemMessage(content=prompt)]
        result = None
        for attempt in range(2):
            response = llm.invoke(msgs)
            try:
                result = clean_llm_json(response.content)
                break
            except ValueError:
                if attempt == 1:
                    raise
                msgs.append(response)
                msgs.append(HumanMessage(content="Your response was not valid JSON. Please return ONLY valid JSON matching the schema, with no <think> tags."))
        
        normalized_query = {
            "original_query": original_query,
            "language_hint": language_hint,
            "canonical_query": result.get("canonical_query", original_query),
            "explicit_entities": explicit_entities,
            "inferred_entities": result.get("inferred_entities", {}),
            "search_variants": result.get("search_variants", [original_query]),
            "entity_confidence": result.get("entity_confidence", "medium")
        }
        return {"normalized_query": normalized_query}
        
    except Exception as e:
        print(f"Query Normalizer Error: {e}")
        # Safe fallback
        return {"normalized_query": {
            "original_query": original_query,
            "language_hint": language_hint,
            "canonical_query": original_query,
            "explicit_entities": explicit_entities,
            "inferred_entities": {},
            "search_variants": [original_query],
            "entity_confidence": "low"
        }}
