import asyncio
import sys
import json
from mizan_ai.api.routes.chat import execute_chat

queries = [
    "Explain PPC?",
    "What is CrPC?",
    "PPC kya hai?",
    "Section 489-F PPC kya hai?",
    "Explain Article 199.",
    "What is QSO?",
    "Tell me about Anti-Terrorism Act 1997.",
    "What is JavaScript?"
]

async def run_tests():
    for q in queries:
        res = await execute_chat(q, False, None)
        print(f"--- QUERY: {q}")
        print(f"INTENT: {res.intent}")
        has_docs = len(res.context_documents) > 0 if res.context_documents else False
        print(f"DOCS FOUND: {has_docs}")
        print(f"RESPONSE:\n{res.response[:200]}...\n")

if __name__ == "__main__":
    asyncio.run(run_tests())
