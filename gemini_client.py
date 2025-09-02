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
        prompt = f"""Evaluate the legal text and its XML representation for accuracy. Provide a well-formatted assessment using PLAIN TEXT ONLY.

EVALUATION SUMMARY: Start with a brief overall assessment.

Then provide detailed analysis with proper spacing between sections:

Structural Accuracy:
(Analysis of XML structure vs legal provisions)

Semantic Preservation:
(How well meaning is preserved)

Missing or Incorrect Elements:
(Any issues found - this section will be highlighted in red)

Overall Assessment:
(Final evaluation)

Use simple text with basic punctuation only. Add blank lines between sections for readability.
Do NOT use markdown formatting like **bold**, *italics*, # headers, or special characters.

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