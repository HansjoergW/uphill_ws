from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json

from services.gemini import transcribe_youtube_video, summarize_transcript as gemini_summarize


# Pydantic models for request/response validation
class HealthResponse(BaseModel):
    status: str


class TranscribeRequest(BaseModel):
    youtube_url: str
    transcription_model: str
    target_language: str


class TranscribeEvent(BaseModel):
    detail: str | None = None
    text: str | None = None


class SummarizeRequest(BaseModel):
    transcript: str
    summary_model: str
    target_language: str


class Summary(BaseModel):
    summary: str
    key_points: list[str]


# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware for localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/api/health")
async def health() -> HealthResponse:
    """Check if the backend is online."""
    return HealthResponse(status="ok")


# Transcribe stream endpoint
@app.post("/api/transcribe-stream")
async def transcribe_stream(request: TranscribeRequest):
    """
    Stream a YouTube transcript as Server-Sent Events using Gemini's API.
    Emits status, chunk events, and done or error events.
    """

    async def event_generator():
        try:
            # Send status event
            yield f"event: status\ndata: {json.dumps({'detail': 'Transcription started'})}\n\n"

            # Stream chunks from Gemini
            async for chunk in transcribe_youtube_video(request.youtube_url, request.target_language):
                if chunk:
                    yield f"event: chunk\ndata: {json.dumps({'text': chunk})}\n\n"

            # Send done event
            yield f"event: done\ndata: {json.dumps({})}\n\n"

        except Exception as e:
            # Send error event
            error_detail = str(e)
            yield f"event: error\ndata: {json.dumps({'detail': error_detail})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# Summarize transcript endpoint
@app.post("/api/summarize-transcript")
async def summarize_transcript(request: SummarizeRequest) -> Summary:
    """
    Summarize a transcript using Gemini's structured outputs API.
    Returns a Summary with summary text and exactly 5 key points.
    """
    try:
        result = gemini_summarize(request.transcript, request.target_language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")
