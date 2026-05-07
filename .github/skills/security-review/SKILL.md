---
name: security-review
user-invocable: true
description: "Perform a code security review for this repository. Use when asked for security review, vuln audit, threat model, hardening check, OWASP checks, auth/session checks, input validation, XSS, CSRF, SSRF, SQL injection, path traversal, secret leaks, dependency risk, or secure coding review."
---

# Security Review Skill

Run a practical, code-first security review and report concrete, actionable findings.

## Expected Output

Always return findings first, ordered by severity:
- Critical
- High
- Medium
- Low

For each finding include:
- What is wrong (one sentence)
- Why it matters (attack impact)
- Evidence (file + line references)
- Recommended fix (minimal safe change)

If no findings are discovered, explicitly say so and list residual risks or testing gaps.

## Review Workflow

1. Define review scope
- Confirm what is in scope (backend, frontend, infrastructure, secrets, dependencies).
- Identify trust boundaries: user input, external APIs, file system, model outputs.

2. Map attack surface
- Public endpoints and request handlers
- File upload/download paths
- Auth/session/token handling
- Admin-only operations
- Outbound network calls and URL fetches
- Template/HTML rendering and rich text display
- LLM prompt inputs and model outputs that are rendered or executed

3. Check common vulnerabilities
- Injection: SQL/command/template/code injection
- Broken auth/access control (IDOR/BOLA)
- Sensitive data exposure (logs, errors, API keys)
- SSRF/open redirect/untrusted URL fetch
- Path traversal and unsafe file handling
- Insecure deserialization / unsafe eval-like behavior
- XSS/CSRF/clickjacking/CORS misconfig
- Rate-limit and abuse protections on expensive endpoints
- Missing timeout/retry/circuit-breaker around external API calls

4. Dependency and secret hygiene
- Flag hardcoded secrets, tokens, API keys, credentials.
- Check risky dependency patterns (unmaintained, overly permissive versions, deprecated packages).
- Prefer lockfile-backed reproducible installs.

5. Validate mitigations
- Input validation and output encoding
- Least-privilege defaults
- Safe error handling without sensitive leakage
- Security headers and transport assumptions

## Stack-Specific Focus (This Repo)

### Backend (Python/FastAPI)
- Validate request models and strict typing at API boundaries.
- Ensure auth/authorization checks happen before data access.
- Verify async I/O endpoints use timeouts for external calls.
- Confirm exceptions do not leak internals or secrets.
- Check file/network operations for allowlist-based controls.

### Frontend (Next.js/React/TypeScript)
- Review unsafe HTML rendering (`dangerouslySetInnerHTML`).
- Verify sensitive tokens are never exposed client-side.
- Validate API error rendering does not leak internals.
- Check user-supplied content is escaped/sanitized before display.

### AI/LLM Features
- Treat model output as untrusted input.
- Check prompt injection paths that can alter system behavior.
- Verify no secrets are inserted into prompts sent to third-party models.
- Ensure generated content is not executed or rendered unsafely.

## Useful Search Patterns

Use fast search to quickly triage risk hotspots:

```bash
rg -n "(api[_-]?key|secret|token|password|Authorization|Bearer)" backend frontend
rg -n "(eval\(|exec\(|subprocess|os\.system|pickle\.loads|yaml\.load\()" backend
rg -n "(dangerouslySetInnerHTML|innerHTML|document\.write)" frontend
rg -n "(http://|requests\.|httpx\.|fetch\(|axios\(|urllib)" backend frontend
rg -n "(CORS|allow_origins|Access-Control-Allow-Origin)" backend
```

## Reporting Rules

- Be precise and evidence-based; do not speculate without code evidence.
- Prioritize exploitable paths over style issues.
- Prefer minimal, targeted remediations.
- Keep recommendations compatible with existing architecture unless change is required for security.
