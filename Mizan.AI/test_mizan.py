import requests
from jose import jwt
import time
import json
from datetime import datetime, timedelta

def get_token():
    secret_key = 'supersecretkey_mizan_ai_production_ready'
    to_encode = {'sub': 'test_user'}
    expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({'exp': expire})
    return jwt.encode(to_encode, secret_key, algorithm='HS256')

url = 'http://localhost:8000/api/v1/chat/'
headers = {'Authorization': f'Bearer {get_token()}', 'Content-Type': 'application/json'}

def run_test(msg):
    print(f'-- {msg} --')
    t0 = time.time()
    try:
        r = requests.post(url, json={'message': msg, 'is_deep_research': False}, headers=headers, timeout=10)
        print(f'Time: {time.time()-t0:.2f}s | Status: {r.status_code}')
        if r.status_code == 200:
            print(r.json().get('response', '')[:200])
    except Exception as e:
        print(e)

run_test('hi')
run_test('What is JavaScript?')
run_test('Explain PPC?')
