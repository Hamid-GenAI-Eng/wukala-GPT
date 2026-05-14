import requests
import time
import json
import logging

logging.basicConfig(level=logging.INFO, format='\n%(message)s')
logger = logging.getLogger(__name__)

BASE_URL = "http://127.0.0.1:8000/api/v1"

def authenticate():
    logger.info("🔑 Authenticating...")
    response = requests.post(
        f"{BASE_URL}/auth/token",
        data={"username": "admin", "password": "admin123"}
    )
    if response.status_code == 200:
        logger.info("✅ Authentication successful.")
        return response.json().get("access_token")
    else:
        logger.error(f"❌ Auth failed: {response.text}")
        return None

def run_query(token, test_name, query, is_deep_research=False):
    logger.info(f"--------------------------------------------------")
    logger.info(f"🧪 Test: {test_name}")
    logger.info(f"❓ Query: {query}")
    logger.info(f"🔍 Mode: {'Deep Research' if is_deep_research else 'Standard RAG'}")
    
    start_time = time.time()
    response = requests.post(
        f"{BASE_URL}/chat/",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": query, "is_deep_research": is_deep_research}
    )
    latency = time.time() - start_time
    
    if response.status_code == 200:
        logger.info(f"⏱️ Latency: {latency:.2f} seconds")
        logger.info(f"🤖 Response:\n{response.json().get('response')}")
    else:
        logger.error(f"❌ Request failed with status {response.status_code}: {response.text}")

def main():
    token = authenticate()
    if not token:
        return

    queries = [
        {
            "name": "Urdu Complex Legal Query",
            "query": "مجھے بتائیں کہ اگر کوئی شخص منشیات ایکٹ (CNSA) کے تحت 10 کلو گرام چرس کے ساتھ پکڑا جائے تو کیا ضمانت مل سکتی ہے؟",
            "is_deep_research": False
        },
        {
            "name": "Unclear / Keyword-heavy Query",
            "query": "divorce iddat period maintenance wife wants khula husband refuses case laws",
            "is_deep_research": True
        },
        {
            "name": "Tough Constitutional Interpretation",
            "query": "Explain the concept of 'Sadiq and Ameen' under Article 62(1)(f) of the Constitution of Pakistan. Can a lifetime disqualification be overturned?",
            "is_deep_research": False
        },
        {
            "name": "Vague Corporate Law Query",
            "query": "director steals company money SECP what happens next?",
            "is_deep_research": False
        }
    ]

    for q in queries:
        run_query(token, q["name"], q["query"], q["is_deep_research"])
        time.sleep(2)  # brief pause between queries

if __name__ == "__main__":
    logger.info("🚀 Starting Mizan AI Comprehensive System Test...")
    main()
