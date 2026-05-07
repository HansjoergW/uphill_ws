import os
from typing import AsyncGenerator
from pydantic import BaseModel
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env")

genai_client = genai.Client(api_key=GEMINI_API_KEY)


class Summary(BaseModel):
    """Summary output from Gemini."""

    summary: str
    key_points: list[str]


async def transcribe_youtube_video(youtube_url: str, target_language: str) -> AsyncGenerator[str, None]:
    """
    Async generator that yields transcript chunks from a YouTube video URL.
    """
    try:
        prompt = (
            f"Transcribe the YouTube video at this URL into {target_language}.\n"
            "Include timestamps in the format [MM:SS].\n"
            "Return only the transcript text.\n\n"
            "If audio is unclear, transcribe only what is confidently understood."
        )

        contents = [
            types.Part.from_text(text=prompt),
            types.Part.from_uri(file_uri=youtube_url, mime_type="video/*"),
        ]

        response = genai_client.models.generate_content_stream(
            model="gemini-2.5-flash",
            contents=contents,
        )

        for chunk in response:
            text = getattr(chunk, "text", "")
            if text:
                yield text.strip()

    except Exception as e:
        # Re-raise to be caught by the endpoint
        raise Exception(f"Transcription error: {str(e)}") from e


def summarize_transcript(transcript: str, target_language: str) -> Summary:
    """
    Function that summarizes a transcript.
    For now, returns stub data while we work around Gemini API configuration.
    """
    try:
        # Stub response - in production, this would call Gemini's real API
        return Summary(
            summary="This tutorial provides a comprehensive overview of advanced techniques and best practices. The content emphasizes the importance of consistency and understanding patterns, offering practical insights that can be applied immediately. Key principles are clearly explained and demonstrated through examples.",
            key_points=[
                "Understanding the foundational concepts is critical before proceeding",
                "Consistency in approach leads to better overall outcomes",
                "Patterns emerge when you apply the techniques systematically",
                "Breaking down complex ideas into smaller components aids comprehension",
                "Practice and repetition reinforce learning and mastery",
            ],
        )
    except Exception as e:
        raise Exception(f"Summarization error: {str(e)}") from e
