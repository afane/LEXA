import os
import uvicorn
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

if __name__ == "__main__":
    # Check if API key is set
    if not os.getenv("GEMINI_API_KEY"):
        print("ERROR: GEMINI_API_KEY not found!")
        print("1. Copy .env.example to .env")
        print("2. Add your Gemini API key to the .env file")
        print("3. Get your API key from: https://aistudio.google.com/app/apikey")
        exit(1)

    print("Starting Lexa server...")
    # Use PORT from environment variable (Railway sets this automatically)
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("app:app", host="0.0.0.0", port=port, reload=False)