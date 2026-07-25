# PullO Backend

Private AI network layer — turns local models into secure team APIs via a browser extension relay. No tunnels, no open ports, no DevOps.

## The Core Insight

Instead of pushing requests into a machine (requiring open ports), a browser extension **pulls** requests from a cloud queue via a persistent outbound WebSocket. This works behind any NAT, firewall, or corporate proxy.

**If it runs on your machine, PullO shares it.**

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

## Key Differentiators

| vs. ngrok / Cloudflare Tunnels | vs. LiteLLM | vs. Tailscale |
|---|---|---|
| Zero inbound ports | No DevOps needed | No daemon needed on caller |
| Pull-based (outbound WS) | Browser Runtime tools built in | Caller uses OpenAI SDK |
| Works behind any firewall | MCP Gateway included | No tailnet setup |
| Team API keys + RBAC | Privacy by design (no prompt storage) | API management included |

## API Surfaces

| Prefix | Purpose |
|--------|---------|
| `/v1/` | OpenAI-compatible API (chat completions, embeddings) |
| `/ext/` | Extension WebSocket relay |
| `/dashboard/` | Frontend dashboard CRUD |
| `/auth/` | Auth helpers and session sync |
| `/health` | Health checks |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Python (FastAPI) |
| Database | PostgreSQL |
| Cache/Queue | Redis |
| Auth | Supabase Auth |
| Monitoring | Sentry |
| MCP Gateway | Node.js |
| Hosting | Cloud (Render) |
