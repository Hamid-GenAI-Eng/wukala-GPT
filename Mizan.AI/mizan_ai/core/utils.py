import re
import json
import logging

logger = logging.getLogger(__name__)

def clean_llm_json(content: str) -> dict:
    content = content.strip()
    content = re.sub(r'<think>.*?</think>', '', content, flags=re.DOTALL).strip()
    if content.startswith("```json"):
        content = content[7:]
    elif content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
    content = content.strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        logger.error(f"JSON Parse Error: {e} | Cleaned Content: {content}")
        raise ValueError(f"Failed to parse JSON: {e}")
