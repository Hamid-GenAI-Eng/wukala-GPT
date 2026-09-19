import asyncio
from mizan_ai.api.routes.chat import execute_chat

async def test_failure():
    print("Simulating user query: 'what is the punishment of thief?'")
    response = await execute_chat("what is the punishment of thief?", is_deep_research=False, conversation_id="test_crash")
    print("\n--- WHAT THE END USER SEES ---")
    print(response.response)

asyncio.run(test_failure())
