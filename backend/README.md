# PullO Backend

Private AI network layer — turns local models into secure team APIs via a browser extension relay. No tunnels, no open ports, no DevOps.

[![Status](https://img.shields.io/badge/Status-Active-success)](https://pullo.runtimeco.qzz.io)
[![License](https://img.shields.io/badge/License-Proprietary-red)](../LICENSE.md)

---

## The Core Insight

Instead of pushing requests into a machine (requiring open ports), a browser extension **pulls** requests from a cloud queue via a persistent outbound WebSocket. This works behind any NAT, firewall, or corporate proxy.

**If it runs on your machine, PullO shares it.**

---

## Architecture (Request Lifecycle)

```
Client (OpenAI SDK)
    ↓ POST /v1/chat/completions (Bearer pk-xxx)
PullO Cloud Relay
    ├── 1. Validate API key
    ├── 2. Resolve model (workspace-scoped)
    ├── 3. Rate limit check
    ├── 4. Model online check (heartbeat)
    ├── 5. Connection active check
    ├── 6. Build payload
    └── 7. Send request over WebSocket → Extension
Browser Extension
    ├── 8. Receive via persistent WebSocket
    ├── 9. Inject browser runtime tool descriptions
    ├── 10. Call local model (Ollama / LM Studio / Custom URL)
    ├── 11. Tool-call loop (up to 10 iterations):
    │     ├── Browser Runtime tools (search, read, screenshot, etc.)
    │     ├── MCP tools (GitHub, Slack, Gmail, Linear...)
    │     └── Custom webhook tools
    └── 12. Stream response back over WebSocket
Caller receives standard OpenAI response (prompts never stored)
```

---

## Key Differentiators

| vs. ngrok / Cloudflare Tunnels | vs. LiteLLM | vs. Tailscale |
|---|---|---|
| Zero inbound ports | No DevOps needed | No daemon needed on caller |
| Pull-based (outbound WS) | Browser Runtime tools built in | Caller uses OpenAI SDK |
| Works behind any firewall | MCP Gateway included | No tailnet setup |
| Team API keys + RBAC | Privacy by design (no prompt storage) | API management included |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Python (FastAPI) |
| Database | PostgreSQL (via Supabase) |
| Cache / Queue | Redis (via Upstash) |
| Auth | Supabase Auth (JWT) |
| Monitoring | Sentry |
| Emails | Resend + SMTP |
| Image Upload | ImageKit |
| MCP Gateway | Node.js (Express + MCP SDK) |
| Hosting | Render |

---

## Quick Start

### Prerequisites

- Python 3.11+
- A Supabase project (free tier works)
- An Upstash Redis instance (free tier works)
- Node.js 18+ (for the MCP Gateway)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd backend

# Create environment file
cp .env.example .env

# Edit .env with your credentials (see Environment Variables below)

# Install dependencies
pip install -r requirements.txt

# Run database migrations (via Supabase dashboard or CLI)

# Start the server
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`. Interactive OpenAPI docs are available at `/docs` in development mode.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (backend operations) |
| `SUPABASE_ANON_KEY` | Anon key (client-side auth validation) |
| `UPSTASH_REDIS_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis auth token |
| `RESEND_API_KEY` | API key for transactional emails |
| `FRONTEND_URL` | Frontend application URL |
| `EXTENSION_ORIGIN` | Chrome extension origin (for CORS) |
| `SECRET_KEY` | Secret for signing and encryption |
| `ENVIRONMENT` | `development` or `production` |

---

## Project Structure

```
backend/
├── main.py                     # App entry point, CORS, middleware, lifespan
├── config.py                   # All environment variables validated at startup
├── logger.py                   # Structured logging (structlog)
├── requirements.txt
│
├── routers/                    # API route handlers
│   ├── auth.py                 #   Supabase auth helpers + session sync
│   ├── v1.py                   #   OpenAI-compatible /v1/chat/completions, /v1/embeddings
│   ├── extension.py            #   WebSocket + REST endpoints for the Chrome extension
│   ├── dashboard.py            #   Dashboard CRUD (models, keys, logs, team, settings)
│   ├── upload.py               #   File upload (ImageKit-backed)
│   ├── corsair.py              #   MCP integration routes
│   ├── contact.py              #   Contact form submission
│   └── public.py               #   Public-facing endpoints
│
├── services/                   # Business logic layer
│   ├── supabase_services.py    #   All database operations
│   ├── redis_services.py       #   Rate limiting, request queue, heartbeat, counters
│   ├── connection_manager.py   #   WebSocket connection state management
│   ├── mcp_gateway.py          #   MCP tool execution proxy
│   ├── hub_client.py           #   MCP Hub REST client
│   └── imagekit_service.py     #   Image upload service
│
├── corsair-service/            # Node.js MCP gateway
│   └── src/
│       ├── corsair.ts          #   MCP SDK integration
│       ├── mcp-pool.ts         #   MCP connection pool
│       └── cache.ts            #   Tool cache (1hr TTL)
│
├── migrations/                 # SQL migration files for Supabase
└── scripts/
    └── backfill_redis_counters.py
```

---

## API Surfaces

| Prefix | Purpose | Auth |
|--------|---------|------|
| `/v1/` | OpenAI-compatible API (chat, embeddings) | API key (Bearer pk-xxx) |
| `/ext/` | Extension WebSocket + device registration | JWT + device secret |
| `/dashboard/` | Frontend dashboard CRUD | JWT |
| `/auth/` | Authentication helpers | — |
| `/corsair/` | MCP operations | JWT |
| `/upload/` | File upload | JWT |
| `/contact/` | Contact form | — |
| `/health` | Health checks | — |

---

## Key Services

### Database Service
Central service for all database operations. Tables include: profiles, workspaces, workspace_members, devices, models, api_keys, request_logs, team_invites, notifications, and MCP integrations. API keys are stored as SHA-256 hashes — plaintext keys are never persisted.

### Redis Service
Handles the request queue, pending request futures, heartbeat tracking, rate limit counters (sliding window RPM + daily budget), session state, and queue depth monitoring.

### Connection Manager
Tracks active WebSocket connections per device. Routes incoming requests from the API to the correct extension instance and delivers responses back to awaiting callers. Supports both streaming and non-streaming request flows.

### MCP Gateway
Proxies tool definitions and executions to the Node.js MCP gateway. Injects MCP tool definitions (GitHub, Slack, Gmail, Linear, etc.) into chat completion requests as OpenAI-compatible function calls. Supports per-workspace MCP server configurations.

---

## Security & Privacy

- **No inbound ports** — the extension establishes an outbound WebSocket connection; no ports are opened on the host machine
- **API key hashing** — keys are stored as SHA-256 hashes; plaintext keys are shown once at creation and never persisted
- **No prompt storage** — request/response content is never written to the database; only metadata (model, timing, token count) is logged
- **JWT-based auth** — all dashboard and extension endpoints authenticate via Supabase JWT tokens
- **Device authentication** — extensions authenticate using a device secret (similar to SSH key-based auth)

---

## Background Tasks

- **Stale model reaper** — runs every 60s, marks models offline if their heartbeat has expired. Acts as a safety net for when the extension crashes without a clean WebSocket disconnect.
- **MCP gateway health check** — verifies the Node.js MCP gateway is reachable at startup and refreshes MCP server definitions.

---

## Development

### Running Locally

```bash
# Start the backend
uvicorn main:app --reload --port 8000

# Start the MCP Gateway (in a separate terminal)
cd corsair-service
npm install
npm run dev
```

### Code Style

- Python: follow PEP 8
- Use structured logging via `structlog` (no `print()` statements)
- Type hints are required for all function signatures
- Service classes should be used for business logic; routers should be thin

### Running Tests

```bash
# From the backend directory
pytest
```

### Database Migrations

Migrations are SQL files in the `migrations/` directory. Apply them via the Supabase SQL editor or the Supabase CLI:

```bash
supabase db push
```

---

## Deployment

The backend is designed to deploy on any platform that supports Python ASGI applications (Render, Railway, Fly.io, etc.).

Key environment variable groups required:
- Supabase credentials (URL, service role key, anon key)
- Upstash Redis URL and token
- Email service credentials
- ImageKit credentials
- Monitoring configuration (Sentry DSN)
- MCP Gateway service URL

---

## API Example

Once running, use any OpenAI-compatible client:

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.pullo.ai/v1",
    api_key="pk_xxxxxxxxx"
)

response = client.chat.completions.create(
    model="llama3",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

---

## Related

- [Frontend README](../frontend/README.md) — Next.js dashboard application
- [Main Project README](../README.md) — overview, features, and team

---

## License

[Proprietary](../LICENSE.md) — Copyright © 2026 Runtime.co. All rights reserved.
