# Workshop Prompts

## Setup

Before the workshop starts, make sure you've run:

```bash
git clone https://github.com/towardsai/youtube-summarizer-UpHill.git
cd youtube-summarizer-UpHill

# Backend
cd backend
uv sync --locked
cp .env.example .env        # paste your Gemini API key
cd ..

# Frontend
cd frontend
npm install
cd ..
```

---

## Step 2 — Grilling: align before code

Open a fresh Claude Code session in the repo root.

### Prompt 1 — Grill before planning

```
I want to build a YouTube summarizer app — paste a URL, get a
transcript and AI summary with key points.

Before we plan anything, ask me questions one at a time
to align on what to build. For each question, give your
recommended answer. Stop after 5 questions so we can move on.
```

---

## Step 3a — Stub backend (vertical slice)

```bash
cd backend
claude
```

### Prompt 2 — Create FastAPI stub backend

```
Read the @README.md to learn about the project.

Create backend/main.py with:
- FastAPI app with CORS for localhost:3000
- GET /api/health → {"status": "ok"}
- POST /api/transcribe-stream → for now, return a HARDCODED SSE
  stream with one "chunk" event containing fake transcript text,
  then a "done" event
- POST /api/summarize-transcript → for now, return HARDCODED JSON:
  {"summary": "test summary", "key_points": ["point 1", "point 2"]}
- Pydantic models for request validation (match the shapes in the README)
- Make all endpoints async

Just the wiring. No real AI logic yet
```

Verify manually:

```bash
uv run uvicorn main:app --reload
```

Then in another terminal:

```bash
curl http://localhost:8000/api/health

curl -N -X POST http://localhost:8000/api/transcribe-stream \
  -H "Content-Type: application/json" \
  -d '{"youtube_url":"test","transcription_model":"fake","target_language":"en"}'
```

### Optional A — Verify backend via the agent (instead of curl)

```
Run the backend server, and test the health and transcribe-stream endpoints.
confirm that they return the expected responses.
```

---

## Step 3b — Minimal frontend (vertical slice)

In a new terminal:

```bash
cd frontend
claude
```

### Prompt 3 — Frontend plan (plan only, do not implement yet)

```
Read @README for the project context and the current backend code.

I want a minimal Next.js (but with good UX) page that:
- Has a YouTube URL input + "Transcribe" button + language selector
- POSTs to http://localhost:8000/api/transcribe-stream as SSE
  and displays the transcript chunks as they arrive
- Then POSTs the full transcript to
  http://localhost:8000/api/summarize-transcript
- Displays the returned summary and key_points

Keep it minimal; one page is fine. Goal: prove the wiring works.

Plan only — outline the main steps, call out decisions/tradeoffs, mention edge cases. Stop after the plan. Do not write code until I say "approved".
```

After reviewing the plan, type **`approved`** in the same session to let it implement — OR run Optional B below instead.

### Optional B — Implement plan + verify with browser-use

```
lets implement the plan and when done, turn on the backend, then use @browseruse 
to navigate to the localhost page of the frontend and see that everything looks good
```

---

## Step 3b.5 — Explain-back

Same Claude Code session as the frontend implementation.

### Prompt 4 — Walk me through the code

```
Walk me through this file top to bottom. For each chunk:
- what does it do
- what non-obvious decisions did you make
- what would you flag for a senior React engineer to double-check

Name hooks/patterns by name. Surface anything that might surprise me.
```

After this, run both servers and try the app at `http://localhost:3000`:

```bash
# terminal 1: backend
cd backend && uv run uvicorn main:app --reload

# terminal 2: frontend
cd frontend && npm run dev
```

---

## Step 4a — Real Gemini service

### Prompt 5 — Build the Gemini service

```
Read @main.py and @README.

Create backend/services/gemini.py with:

- transcribe_youtube_video(youtube_url, target_language) — async
  generator yielding transcript chunks. Use Gemini's streaming
  API with file_data on the YouTube URL.

- summarize_transcript(transcript, target_language) — async function
  that uses Gemini's structured outputs (response_json_schema)
  with this Pydantic model:

      class Summary(BaseModel):
          summary: str
          key_points: list[str]

  Returns the parsed Summary instance.

Use google-genai SDK, and read the documentation here:
https://ai.google.dev/gemini-api/docs/video-understanding

Load API key from .env with python-dotenv
Both functions must be async.
Do nothing beyond what's described.
```

---

## Step 4b — Wire it into main.py

### Prompt 6 — Replace the stubs with real Gemini logic

```
Read @main.py and @services/gemini.py.

Update main.py to wire in real Gemini logic:

- /api/transcribe-stream: stream events from transcribe_youtube_video()
  as SSE — emit "status" first, "chunk" per yielded text segment,
  then "done". On exceptions, emit "error" with the detail.
- /api/summarize-transcript: await summarize_transcript() and
  return the Summary as JSON.

Keep both endpoints async. Match the SSE event format from the README.
```

### Optional C — Full end-to-end test with browser-use

```
ok I see, it makes sense, for now can you do an end-to-end test, using browser-use.
Make sure to turn on the backend and frontend server. Take screenshots along the way to make sure the app behaves as expected.

The Gemini key is set in the backend .env file.

Use this YouTube video to test the app:
https://www.youtube.com/watch?v=5jMjUqxXzFY&t=40s
```

---

## Step 4 — Security audit

### Prompt 7 — Run the security-review skill

```
/security-review
```

(In Codex, use `security-scan` instead.)

---

## Optional prompts for Step 4 (situational)

### Optional D — Debug pattern (only if something breaks)

```
Here's the function and the error message:
<paste the exact error + stack trace + the failing function>

Explain why this is happening and rewrite the function.
Then write a test that would have caught this bug.
```

### Optional E — Make the frontend beautiful (image gen)

```
Can you take this latest screenshot and use image gen to create a beautiful frontend UI, but that doesn't look 'mainstream'.

Create one where we show the initial "0" state, when the user has not provided a URL yet. Don't add extra buttons, keep the same ones as in the screenshot. Just make it beautiful.
```

---

## Step 5 — Add Ollama

### Prompt 8 — Create the Ollama service

```
Read @main.py and @services/gemini.py.

Create backend/services/ollama.py with:
- get_available_models() — async function. GET
  http://localhost:11434/api/tags, return list of model names.
- summarize_with_ollama(transcript, model_name, target_language) —
  async POST to Ollama's /api/generate endpoint with a prompt that
  asks for SUMMARY: and KEY_POINTS: in plain text format.
- parse_ollama_response(response_text) — parses the SUMMARY: and
  KEY_POINTS: markers and returns a Summary Pydantic instance
  (the same model defined in gemini.py).

Make all I/O functions async. Do nothing beyond what's described.
```

---

## Step 6 — Tests + rules

First, add this line to the **Testing** section of `CLAUDE.md`:

> Always write tests for new functions with non-trivial logic. Cover happy path, edge cases, and error cases.

### Prompt 9 — Write tests for the Ollama parser

```
Read @CLAUDE.md and @services/ollama.py.

Write tests for parse_ollama_response — happy path,
missing SUMMARY marker, and empty input.
```

Run them:

```bash
cd backend
uv run pytest
```

---

## Step 7 — Ship

### Prompt 10 — Commit changes

```
Commit all changes with a clear message describing what was built.
```

### Optional F — Create a PR

> **When to use:** only if you're pushing to a remote and want a PR opened.

```
Create a PR to main with a summary of all changes.
```

---

## Reusable prompt patterns (steal these for your own work)

### Grill First — align before you build, vague idea

```
I want to build [project description]. Before we plan or code,
grill me with questions one at a time. For each question, give
your recommended answer. Stop when we have enough to write a spec.
```

### Context First — the task is clear, agent just needs the lay of the land

```
Read @README and @main.py to learn about the project.
Read carefully @business_logic_1.py and @business_logic_2.py.
Your task is to edit @business_logic_2.py so that:
- change 1
- change 2
Follow the conventions in CLAUDE.md. Do not modify other files.
```

### Plan First — multiple valid approaches

```
You are a senior engineer helping me with a new change.
First, read the feature description:
<paste description + context>

Step 1 — Plan only:
- outline the main steps
- call out decisions / tradeoffs
- mention edge cases
Stop after the plan. Do not write code until I say "approved".
```

### Vertical Slice First — new feature touching multiple layers

```
Build the thinnest version of this that works end-to-end.
Stub anything we don't have yet (return fake data).
Goal: prove the wiring. We'll fill in real logic in a second pass.
```

### Mechanical Change — design is decided

```
The design and fix are decided.
Here is the current code:
<paste>
Here is the exact change:
<describe logic + conditions + expected output>
Implement this change only. Do not introduce new concepts.
```

### Debug — paste evidence, not theories

```
Here's the function and the error message:
<paste function + full stack trace>

Explain why this is happening and rewrite the function.
Then write a test that would have caught this bug.
```

### Explain-back — for code in stacks you don't read fluently

```
Walk me through this file line by line. Call out any
non-obvious decisions, explain why you made them, and
flag anything you're unsure about. If there's a more
idiomatic way to write any of it, say so.
```

### Adversarial reviewer — second opinion, independent session

```
Review this code as a senior [React / Python / etc] engineer.
Find bugs, security issues, bad patterns, dead code, and
anything that wouldn't pass code review at a serious team.
Be harsh. Cite specific lines.

<paste code + relevant spec>
```