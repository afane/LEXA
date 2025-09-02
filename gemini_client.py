import os
from google import genai
from google.genai import types
import tenacity
from typing import Optional


class LexaGeminiClient:
    def __init__(self):
        # Load API key from environment - NEVER hardcode keys
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable required. Check your .env file.")

        self.client = genai.Client(api_key=api_key)
        self.model_name = "gemini-2.5-flash"

    def translate_legal_to_xml(self, legal_text: str, guidance: Optional[str] = None) -> str:
        """Evaluate legal text and XML accuracy"""
        base_instructions = (
            "Evaluate XML faithfulness to the legal text. Use PLAIN TEXT only. NO markdown or ** formatting.\n\n"
            "Principles:\n"
            "- Focus on semantic fidelity.\n"
            "- Ignore purely presentational/organizational formatting differences (e.g., headings/titles, numbering, benign wrappers/attributes, whitespace) unless they introduce new text, change conditions/obligations, alter scope, or modify references/definitions.\n"
            "- Do not reward XML for being 'better' drafted; assess only faithfulness to the source.\n\n"
            "Structural Accuracy:\n"
            "- Briefly compare XML structure to the legal text's logical structure (conditions, exceptions, citations).\n\n"
            "Discrepancies (be specific):\n"
            "- Missing or extra substantive content\n"
            "- Incorrect or invented citations\n"
            "- Altered logical structure (if/then/except) or scope\n"
            "- Misstated definitions or obligations\n\n"
            "Summary:\n"
            "- If faithful: 'Accurate representation'\n"
            "- If not: state exactly what is wrong (missing text, added obligations/conditions, incorrect structure/citations).\n\n"
            "Be direct and concise. No praise or filler.\n\n"
        )

        extra = (f"Additional guidance from user:\n{guidance}\n\n" if guidance and guidance.strip() else "")

        prompt = f"""{base_instructions}{extra}Input:
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
