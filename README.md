# Meraki

[![CI](https://github.com/pulkitpareek18/meraki/actions/workflows/ci.yml/badge.svg)](https://github.com/pulkitpareek18/meraki/actions/workflows/ci.yml)
![Last Commit](https://img.shields.io/github/last-commit/pulkitpareek18/meraki)
![Stars](https://img.shields.io/github/stars/pulkitpareek18/meraki)
![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20Gemini-blue)

## Release Snapshot (March 2026)

- Status: Active
- Type: Voice-first mental health support backend
- Core integrations: Twilio, Ultravox, Gemini, MongoDB
- CI checks: dependency install + JavaScript syntax validation

## Demo Card

[![Meraki Demo Card](https://opengraph.githubassets.com/1/pulkitpareek18/meraki)](https://github.com/pulkitpareek18/meraki#meraki)

Meraki is a voice-first mental health support backend that connects incoming Twilio calls to Ultravox, stores conversation records, and performs Gemini-based risk analysis for post-call monitoring.

## What It Does

- Handles incoming phone calls via Twilio webhook (`POST /incoming`)
- Creates and connects Ultravox voice sessions for callers
- Processes call completion events from Twilio/Ultravox (`POST /ultravox/events`)
- Fetches transcripts and recordings
- Runs AI risk analysis with Gemini (text + audio workflows)
- Stores conversation history in MongoDB (with JSON fallback)
- Provides an operations dashboard and conversation detail UI
- Exposes health and metrics endpoints for monitoring

## Architecture

```text
Caller -> Twilio -> Meraki (/incoming) -> Ultravox
                                 |
                                 v
                     /ultravox/events webhook
                                 |
                                 v
                 Transcript/Recording + Gemini Analysis
                                 |
                                 v
                   MongoDB or data/conversations.json
                                 |
                                 v
                 Dashboard + API + Health/Metrics routes
```

## Tech Stack

- Node.js, Express
- Twilio SDK
- Ultravox API
- Google Gemini (`@google/generative-ai`)
- MongoDB driver

## Project Structure

```text
index.js                         # App bootstrap
src/config/                      # Env/config + prompt setup
src/routes/                      # Route registration
src/controllers/                 # Incoming call, webhook, API handlers
src/services/                    # Ultravox, risk analysis, service manager
src/database/                    # MongoDB + local file persistence
src/views/                       # Dashboard HTML and conversation pages
data/conversations.json          # Local fallback store
```

## API and UI Endpoints

Core call flow:

- `POST /incoming`
- `POST /ultravox/events`

Dashboard and pages:

- `GET /dashboard`
- `GET /conversations/:id`

Conversation APIs:

- `GET /api/conversations`
- `POST /api/conversations/:id/refresh`
- `POST /api/conversations/:id/regenerate-analysis`
- `GET /api/conversations/:id/recording`
- `GET /api/conversations/:id/fresh-data`
- `POST /api/conversations/refresh-all`
- `POST /api/conversations/import-from-ultravox`
- `POST /api/conversations/cleanup-invalid`

Operational endpoints:

- `GET /health`
- `GET /health/detailed`
- `GET /webhook/status`
- `GET /metrics`
- `POST /maintenance`
- `POST /test/webhook`

## Environment Variables

Required:

- `ULTRAVOX_API_KEY`

Common:

- `PORT` (default: `5000`)
- `BASE_URL` (public URL for webhook callbacks)
- `NODE_ENV`
- `ULTRAVOX_MODEL`
- `ULTRAVOX_VOICE_ID`
- `ULTRAVOX_TEMPERATURE`
- `FIRST_SPEAKER`
- `SYSTEM_PROMPT`
- `GEMINI_API_KEY` (or `GOOGLE_API_KEY`)
- `GEMINI_MODEL`
- `MONGODB_URI`
- `MONGODB_DB`
- `MONGODB_COLLECTION`

If `MONGODB_URI` is not set, Meraki writes to `data/conversations.json`.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment in `.env`.

3. Start server:

```bash
npm run dev
```

Production mode:

```bash
npm start
```

## Deployment Notes

- Expose the service over HTTPS.
- Point Twilio voice webhook to `https://<your-domain>/incoming` (POST).
- Configure status/callback events to `https://<your-domain>/ultravox/events`.
- Restrict dashboard access in production because it surfaces sensitive conversation data.

## Important Disclaimer

Meraki is a support and monitoring tool, not a replacement for licensed clinical care or emergency services. For immediate crisis situations, route users to local emergency and professional mental health resources.
