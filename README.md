# YouTube Video Summarizer

A web app that transcribes and summarizes YouTube videos using AI.

## Non-goals

This app intentionally does NOT include:

- User accounts, authentication, or session management
- Persistent storage or a database — transcripts and summaries are not saved
- Background jobs or queues — summarization happens in-request
- Multi-video batch processing — one video per request
- Caching layer — every request is fresh
- Production-grade rate limiting or quota management

Do not add any of these unless explicitly requested.

## Setup

1. Backend: `cd backend && uv sync --locked`
2. Create `backend/.env` from `.env.example` and add your Gemini API key when using Gemini-backed features
3. Start backend: `cd backend && uv run uvicorn main:app --reload`
4. Frontend: `cd frontend && npm install && npm run dev`
5. Open http://localhost:3000

The frontend uses `NEXT_PUBLIC_API_URL` when set. Otherwise it calls `http://localhost:8000`.

## .devcontainer

The dev container is configured to use the system CA bundle for Python, Requests, and gRPC.

- `SSL_CERT_FILE=/etc/ssl/certs/ca-certificates.crt`
- `REQUESTS_CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt`
- `GRPC_DEFAULT_SSL_ROOTS_FILE_PATH=/etc/ssl/certs/ca-certificates.crt`
- `UV_SYSTEM_CERTS=1`

After changing [ .devcontainer/devcontainer.json ](.devcontainer/devcontainer.json), rebuild/reopen the dev container so these variables are applied to all terminals and processes.

## Architecture

```
frontend/ (Next.js 16 + React 19 + TypeScript + Tailwind v4)  →  backend/ (FastAPI + Python 3.13 + uv)  →  Gemini API / Ollama
```

## How It Works

1. User pastes a YouTube URL in the frontend
2. Frontend checks the backend with `/api/health`
3. Backend uses Gemini API to transcribe the video (Gemini can process YouTube URLs directly via `file_data`)
4. Frontend streams transcript chunks from `/api/transcribe-stream`
5. Frontend sends the finished transcript to `/api/summarize-transcript`
6. Frontend displays the transcript, summary, and key points

## API Endpoints

These are the endpoints used by the completed frontend.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Check whether the backend is online |
| POST | `/api/transcribe-stream` | Stream a timestamped YouTube transcript as Server-Sent Events |
| POST | `/api/summarize-transcript` | Summarize an existing transcript and return key points |

### GET /api/health

**Response:**
```json
{
  "status": "ok"
}
```

### POST /api/transcribe-stream

**Request body:**
```json
{
  "youtube_url": "https://www.youtube.com/watch?v=...",
  "transcription_model": "gemini-3-flash-preview",
  "target_language": "en"
}
```

**Streamed events:**
```text
event: status
data: {"detail":"Transcription started"}

event: chunk
data: {"text":"[00:00] First transcript chunk..."}

event: done
data: {}
```

Errors are also sent as SSE events:

```text
event: error
data: {"detail":"Unable to transcribe this video."}
```

### POST /api/summarize-transcript

**Request body:**
```json
{
  "transcript": "[00:00] Full transcript text...",
  "summary_model": "gemini-3-flash-preview",
  "target_language": "en"
}
```

**Response:**
```json
{
  "summary": "Concise summary...",
  "key_points": ["Point 1", "Point 2", "..."]
}
```

## Frontend Features

The frontend must provide:

- YouTube URL input with model and target-language selectors
- Visible backend health/status indicator
- Streaming timestamped transcript display
- Summary view showing summary text and key points
- Copy and download controls for transcript and summary
- Summary regeneration
- Inline error messages; transcript text already streamed is preserved on failure

Component structure is left to the implementer.

## Design

- Two-panel workspace layout: transcript first, summary second
- Starter brand tokens in `frontend/app/globals.css`; replace them with project-specific colors during the build
- Tailwind CSS v4 with custom theme variables
