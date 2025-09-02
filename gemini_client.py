import os
from google import genai
from google.genai import types
import tenacity


class LexaGeminiClient:
    def __init__(self):
        # Load API key from environment - NEVER hardcode keys
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable required. Check your .env file.")

        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.5-flash"

    def translate_legal_to_xml(self, legal_text: str) -> str:
        """Evaluate legal text and XML accuracy"""
        prompt = f"""Evaluate the legal text and its XML representation for accuracy. Provide a brief, direct assessment using PLAIN TEXT ONLY.

Do NOT use any markdown formatting like **bold**, *italics*, # headers, or special characters.
Use simple text with basic punctuation only.

Analyze and report on:
- Structural accuracy of XML vs legal provisions
- Semantic meaning preservation
- Missing or incorrect elements
- Overall quality assessment

Keep response concise and direct. Use normal text formatting only.

Input to evaluate:
{legal_text}"""

        return self._generate_response(prompt)

    def translate_xml_to_legal(self, xml_text: str) -> str:
        """Convert XML to legal language"""
        prompt = f"""Convert this XML to natural legal language:

{xml_text}

Return clear, properly formatted legal text that maintains the original structure and meaning."""

        return self._generate_response(prompt)

    @tenacity.retry(
        stop=tenacity.stop_after_attempt(3),
        wait=tenacity.wait_exponential(multiplier=1, min=5, max=30),
        reraise=True,
    )
    def _generate_response(self, prompt: str) -> str:
        """EXACT way to call Gemini API - DO NOT MODIFY THIS PATTERN"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=prompt)]
                    )
                ]
            )
            return response.text
        except Exception as e:
            return f"Error calling Gemini API: {str(e)}"