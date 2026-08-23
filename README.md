# PullO

## Turn Your Local AI Into a Team Asset

PullO is a private AI network layer that lets teams share local models (Ollama, LM Studio, llama.cpp) as secure, OpenAI-compatible APIs — without exposing infrastructure, paying cloud inference bills, or managing complex networking.

<div align="center">
  <img src="frontend/public/pullo-logo.svg" alt="PullO" width="120"/>
</div>

### The Problem

Sharing local AI models with a team is still a networking headache. Port forwarding exposes your entire machine. Tools like ngrok expose raw URLs without API key scoping, per-model access control, or usage tracking. Teams end up stitching together SSH jump boxes, VPN configs, and reverse proxies — barely keeping it together until someone changes their IP or the tunnel drops.

### The Solution

PullO replaces the entire networking layer with a **pull-based model**. A lightweight browser extension on your machine establishes a single persistent outbound WebSocket connection to PullO's cloud relay. The extension polls for incoming requests.

When a teammate calls your model via the OpenAI-compatible API, the request is authenticated, validated, and forwarded over that WebSocket to your extension. The extension calls your local provider (Ollama, LM Studio, llama.cpp, or any OpenAI-compatible endpoint), streams the response back through the relay, and the caller receives a standard OpenAI response — without ever knowing where the model actually ran.

Your machine is never directly reachable. There are no open ports, no dynamic DNS, no VPN. The model stays local; only the API surface is shared.

### Why PullO

| | Traditional Tunneling (ngrok, Cloudflare) | PullO |
|---|---|---|
| **Connection model** | Inbound port forwarding (push) | Outbound WebSocket polling (pull) |
| **Firewall compatibility** | Blocked by corporate proxies | Works behind any NAT/proxy |
| **Machine exposure** | Entire port exposed to the internet | Zero inbound ports; machine unreachable |
| **Auth model** | Single URL, no built-in auth | Scoped API keys per workspace, per model |
| **Multi-user sharing** | Share a raw URL | Role-based team workspaces |
| **Usage tracking** | None | Per-request analytics, token counts, rate limits |
| **Provider support** | Web services only | Ollama, LM Studio, llama.cpp, OpenAI-compatible |
| **Streaming** | Depends on the tunnel | Native SSE streaming end-to-end |

### Features

- 🔒 **Privacy by Design** — Your prompts and model weights never leave your machine
- 🔌 **OpenAI-Compatible API** — Drop-in replacement. Use existing SDKs without code changes
- 👥 **Team Workspaces** — Organize members into isolated workspaces with role-based access
- 🔑 **Scoped API Keys** — Generate keys with model-level access, tool permissions, rate limits, and usage controls
- 📊 **Usage Analytics** — Track requests, tokens, active models, and team activity per workspace
- 🛠️ **Browser Runtime Tools** — Extension injects browser capabilities (search, read, screenshot) as LLM tool calls
- ⚡ **Zero Inbound Ports** — Pull-based architecture means no open ports, no dynamic DNS, no VPN configuration
- 🌐 **Works Everywhere** — Behind corporate firewalls, on VPNs, in air-gapped environments

### Quickstart

Use any OpenAI-compatible client with the PullO endpoint.

```bash
curl https://api.pullo.ai/v1/chat/completions \
  -H "Authorization: Bearer pk_xxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-r1","messages":[{"role":"user","content":"Hello!"}]}'
```

```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.pullo.ai/v1",
    api_key="pk_xxxxxxxxx"
)

response = client.chat.completions.create(
    model="deepseek-r1",
    messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
```

### Repository Structure

- `README.md` — Project overview
- `LICENSE.md` — License information
- `backend/` — Backend platform documentation
- `frontend/` — Landing page and dashboard application
- `diagrams/` — Architecture and flow diagrams
- `branding/` — Logo and brand assets
- `media/` — Press kit and promotional materials
- `pitch/` — Investor materials
- `examples/` — Code examples and integration guides

### Documentation

Live docs site: [pullo-docs.vercel.app](https://pullo-docs.vercel.app)

### Roadmap

High-level product direction and upcoming features.

### Team

Built by a developer-focused team.

### FAQ

General questions about PullO functionality and usage.