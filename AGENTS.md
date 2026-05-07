# Project Rules

## Philosophy
- Simplest solution first. Get it working, then improve.
- Don't over-engineer. One file is fine until it's painful.
- Flat is better than nested.

## Engineering Principles
- Write modular code — each function does one thing
- DRY (Don't Repeat Yourself) — if you write it twice, make it a function
- Separation of concerns — keep UI, logic, and data separate
- Fail gracefully — handle errors where they happen
- Make it testable — no hidden dependencies or global state

## Code Style
- Descriptive variable names (no single letters except i, j in loops)
- Short functions — if it scrolls, split it

## Stack
- Backend: Python 3.13, FastAPI, google-genai SDK, uv
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS v4
- AI: Gemini 3 Flash Preview for transcription and summarization; Ollama/local models when implemented

## Frontend TypeScript
- Use `.tsx` for React components and pages
- Use `.ts` for non-JSX helpers, API types, constants, and validation logic
- Add explicit types at API boundaries, component props, and shared data shapes
- Avoid advanced type machinery unless it clearly improves correctness or readability

## Backend
- Use async endpoints for I/O-bound work (external API calls, network requests, file I/O). Sync only for pure CPU/in-memory work.

## Libraries
- Before adding or upgrading a library, verify it is current and maintained
- Prefer standard library when possible
- Backend dependencies live in `backend/pyproject.toml`
- Commit `backend/uv.lock` and use `uv sync --locked` for reproducible installs
- Frontend dependencies live in `frontend/package.json` and `frontend/package-lock.json`
- No abandoned libraries (2+ years no updates)

## Testing
- Backend: use pytest via `uv run pytest`
- Frontend: run `npm run build`; add a test runner only when there is frontend logic worth testing
- Test functions with real logic: happy path, edge cases, error cases
- Prefer one behavior per test
- Name tests clearly: test_function_name_what_it_checks

## Don'ts
- Don't add features I didn't ask for
- Don't create unnecessary classes or abstractions
- Don't split into multiple files unless necessary
- Don't leave unused imports
- Don't use deprecated methods
- Don't write code without a matching test for core logic

## Before Finishing
- Confirm all imports are used
- Confirm all libraries are current
- Remove commented-out code
- Run tests — all should pass
- Test that the app runs without errors

## When Unsure
- Ask me — don't guess
- Show me what you're about to change before changing it
- If fixing a bug, explain the root cause first
