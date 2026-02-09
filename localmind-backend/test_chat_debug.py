
import requests
import json
import uuid

# Use the ID from the logs or a fixed one for testing
conv_id = "1357cda1-d45d-410b-871f-f6bb0a68b1e8" 
url = f"http://127.0.0.1:8000/api/chat/{conv_id}/message"
payload = {"text": "What is the capital of France?"}
headers = {"Content-Type": "application/json"}

print(f"Sending request to {url}...")
try:
    with requests.post(url, json=payload, headers=headers, stream=True) as r:
        print(f"Status Code: {r.status_code}")
        if r.status_code != 200:
            print(f"Response: {r.text}")
        else:
            print("Headers:", r.headers)
            for chunk in r.iter_content(chunk_size=None):
                if chunk:
                    print(chunk.decode('utf-8'), end='', flush=True)
except Exception as e:
    print(f"Error: {e}")
