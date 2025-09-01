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
        """Convert legal statute to XML"""
        prompt = f"""Convert this legal statute/provision to structured XML format:

{legal_text}

Return only valid XML with appropriate semantic tags for legal elements (sections, subsections, definitions, requirements, etc.)."""

        return self._generate_response(prompt)

    def translate_xml_to_legal(self, xml_text: str) -> str:
        """Convert XML to legal language"""
        prompt = f"""Convert this XML to natural legal language:

{xml_text}

Return clear, properly formatted legal text that maintains the original structure and meaning."""

        return self._generate_response(prompt)

    def evaluate_xml_against_legal(self, legal_text: str, xml_text: str) -> str:
        """Evaluate how well XML captures the statutory requirements in the legal text"""
        prompt = f"""Evaluate how well the following XML implementation captures the statutory requirements in the legal text.

Legal Text:
{legal_text}

XML Implementation:
{xml_text}

Provide a clear, structured report that includes:
- Summary
- Coverage
- Accuracy
- Completeness
- Structure & Semantics
- Gaps & Issues
- Recommendations

Be specific and cite exact elements/phrases when noting issues."""

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
