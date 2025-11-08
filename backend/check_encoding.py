import base64
import json
import os

# Path to your service account JSON file
file_path = "service-account.json"
env_file_path = ".env"

try:
    # Step 1: Read the service-account.json file
    with open(file_path, 'r', encoding='utf-8') as f:
        json_content = f.read()
    print("✅ Successfully read service-account.json with UTF-8 encoding.")

    # Step 2: Encode the JSON content to base64
    bytes_content = json_content.encode('utf-8')
    base64_string = base64.b64encode(bytes_content).decode('utf-8')
    print("✅ Successfully base64 encoded the content.")
    print(f"Generated Base64 string:\n{base64_string}")

    # Step 3: Read the .env file and extract the existing base64 string
    with open(env_file_path, 'r', encoding='utf-8') as f:
        env_content = f.read()

    env_base64_string = None
    for line in env_content.splitlines():
        if line.startswith("FIREBASE_CREDENTIALS_B64="):
            env_base64_string = line.split('=', 1)[1].strip().strip('"')
            break
    
    if env_base64_string:
        print(f"Base64 string from .env (first 50 chars): {env_base64_string[:50]}...")
        if base64_string == env_base64_string:
            print("✅ Generated Base64 string matches the one in .env.")
        else:
            print("❌ Generated Base64 string DOES NOT match the one in .env.")
            print("Please ensure the .env file is updated with the correct string.")
    else:
        print("❌ FIREBASE_CREDENTIALS_B64 not found in .env file.")

    # Step 4: Decode the base64 string from .env and try to load as JSON
    if env_base64_string:
        decoded_bytes = base64.b64decode(env_base64_string)
        decoded_json_str = decoded_bytes.decode('utf-8')
        json_data = json.loads(decoded_json_str)
        print("✅ Successfully base64 decoded and loaded JSON from .env string.")
        print(f"Decoded JSON (first 100 chars): {decoded_json_str[:100]}...")

except UnicodeDecodeError as e:
    print(f"❌ UnicodeDecodeError during decoding: {e}")
    print("This indicates the base64 string does not represent valid UTF-8 after decoding.")
except json.JSONDecodeError as e:
    print(f"❌ JSONDecodeError after decoding: {e}")
    print("This indicates the decoded string is not valid JSON.")
except FileNotFoundError:
    print(f"❌ Error: {file_path} or {env_file_path} not found.")
except Exception as e:
    print(f"An unexpected error occurred: {e}")
