from dotenv import load_dotenv
import os
load_dotenv()
token = os.getenv("HUGGINGFACE_TOKEN_API")
print(f"Token found: {token is not None}")
if token:
    print(f"Token length: {len(token)}")
