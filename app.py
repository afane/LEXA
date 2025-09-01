from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from gemini_client import LexaGeminiClient
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Lexa - Legal XML Translator")

# Add CORS middleware to allow requests from GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://afane.github.io", "http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files for frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Initialize Gemini client
try:
    gemini_client = LexaGeminiClient()
except ValueError as e:
    print(f"ERROR: {e}")
    print("Make sure you have created a .env file with your GEMINI_API_KEY")
    exit(1)


class TranslationRequest(BaseModel):
    text: str
    direction: str  # "legal_to_xml" or "xml_to_legal"

class EvaluationRequest(BaseModel):
    legal_text: str
    xml_text: str


@app.get("/")
async def health_check():
    return {"status": "healthy", "message": "Lexa API is running"}


@app.post("/translate")
async def translate(request: TranslationRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        if request.direction == "legal_to_xml":
            result = gemini_client.translate_legal_to_xml(request.text)
        elif request.direction == "xml_to_legal":
            result = gemini_client.translate_xml_to_legal(request.text)
        else:
            raise HTTPException(status_code=400, detail="Invalid direction. Use 'legal_to_xml' or 'xml_to_legal'")

        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Lexa Legal XML Translator"}


@app.post("/evaluate")
async def evaluate(request: EvaluationRequest):
    if not request.legal_text.strip() or not request.xml_text.strip():
        raise HTTPException(status_code=400, detail="Both legal_text and xml_text are required")

    try:
        result = gemini_client.evaluate_xml_against_legal(request.legal_text, request.xml_text)
        return {"result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
