import requests

response = requests.post(
    "http://127.0.0.1:8000/api/v1/auth/token",
    data={"username": "admin", "password": "admin123"}
)
print("Auth Response:", response.status_code, response.text)

if response.status_code == 200:
    token = response.json().get("access_token")
    
    chat_response = requests.post(
        "http://127.0.0.1:8000/api/v1/chat/",
        headers={"Authorization": f"Bearer {token}"},
        json={"message": "What is the capital of Pakistan?", "is_deep_research": False}
    )
    print("Chat Response:", chat_response.status_code, chat_response.text)
