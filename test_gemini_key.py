
import os
import asyncio
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv('backend/.env')

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("❌ GEMINI_API_KEY not found in backend/.env")
    exit(1)

print(f"✅ Found API Key: {api_key[:4]}...{api_key[-4:]}")

async def test_key():
    genai.configure(api_key=api_key)
    
    # Try with gemini-1.5-flash which is generally available
    model_name = 'gemini-1.5-flash'
    print(f"🔄 Testing with model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        response = await model.generate_content_async("Reply with 'Working' if you receive this.")
        print(f"✅ API Response: {response.text}")
        return
    except Exception as e:
        print(f"❌ Failed with {model_name}: {str(e)}")

    # If that fails, list available models
    print("\n🔍 Listing available models for this key:")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f" - {m.name}")
    except Exception as e:
        print(f"❌ Could not list models: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_key())
