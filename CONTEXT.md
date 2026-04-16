# GLKB Dashboard — Project Context

## Goal

Build a lightweight health status dashboard for GLKB features. It should show current health status and historical incidents for each feature. Deploy frontend + backend on Vercel, database on Vercel Postgres.

## Architecture

```
GitHub Actions (notify.js in GLKB_web repo)
  ├── → sends alert email  (existing)
  └── → POST /api/ingest   (to add)
            ↓
        Vercel Serverless Function
            ↓
        Vercel Postgres
            ↓
        Dashboard frontend (Next.js on Vercel)
```

## Existing Monitoring System (in GLKB_web repo)

### Playwright Tests (`e2e/scripts/notify.js`)

- Runs hourly via GitHub Actions (`.github/workflows/playwright.yml`)
- Tests run against `https://dev.glkb.org`
- On failure, classifies errors and sends HTML alert emails to `glkb-alerts@googlegroups.com`
- Gmail filters route by subject tag to appropriate group mailing lists

#### Test files and backend endpoints
| Test file | Backend endpoint |
|---|---|
| `ai-chat.spec.js` | `/api/v1/new-llm-agent/stream` |
| `history.spec.js` | `/api/v1/new-llm-agent/stream` |
| `explore-graph.spec.js` | `/api/v1/search/entity-name-search` |
| `api-keys.spec.js` | `/api/v1/api-keys/create` |

#### Alert classification (recipient × severity)

| Trigger | Recipient group | Severity |
|---|---|---|
| ai-chat timeout | BACKEND + AGENT | L2 – CRITICAL |
| ai-chat selector/assertion failure | FRONTEND | L2 – CRITICAL |
| other backend timeout | BACKEND | L3 – ERROR |
| other frontend selector/assertion | FRONTEND | L3 – ERROR |
| auth failure (/login redirect) | OPS | L2 – CRITICAL |
| unknown failure | OPS | L4 – WARNING |

#### Email subject format
```
[TEAM][L# – SEVERITY] Description
e.g. [BACKEND][L2 – CRITICAL] AI Chat backend timeout — /api/v1/new-llm-agent/stream
```

### Server-side Log Scanner (separate, not yet implemented)
- Scans backend logs for LLM errors
- Severity: L3 – ERROR, recipient: AGENT
- Email format: table of Time / Session / Error

### Uptime Robot
- Monitors `dev.glkb.org` availability
- Severity: L1 – DOWN, recipient: BACKEND
- Handled separately, not in this repo

## Data to Store per Incident

```json
{
  "timestamp": "2026-04-10T18:00:00Z",
  "source": "playwright",
  "recipient": "backend",
  "severity": "critical",
  "test": "AI Chat returns a non-empty response",
  "file": "ai-chat.spec.js",
  "error": "Test timeout of 30000ms exceeded.",
  "type": "backend_timeout",
  "run_id": "12345"
}
```

## How `notify.js` Should POST to Dashboard

Add after sending email:

```js
await fetch('https://your-dashboard.vercel.app/api/ingest', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Secret': process.env.INGEST_SECRET,
  },
  body: JSON.stringify({ recipient, severity, failures, runId, timestamp: new Date().toISOString() }),
});
```

GitHub Actions secret to add: `INGEST_SECRET` (shared with Vercel env var).

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Backend**: Vercel Serverless Functions (API routes in Next.js)
- **Database**: Vercel Postgres
- **Deployment**: Vercel (auto-deploy on push to main)

## Setup Steps Remaining

1. Create GitHub repo `glkb-dashboard`
2. `npx create-next-app@latest glkb-dashboard` and push
3. Import repo in Vercel → auto deploy
4. Vercel dashboard → Storage → Create Database → Postgres
5. Build `/api/ingest` endpoint and `incidents` table schema
6. Build dashboard frontend
7. Add `INGEST_SECRET` to both Vercel env vars and GLKB_web GitHub secrets
8. Wire up `notify.js` to POST to the ingest endpoint
