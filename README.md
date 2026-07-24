# Repository Notice

- This repository is a public showcase for PullO. It contains documentation, architecture diagrams, screenshots, branding assets, and other public resources. The production backend, browser extension, infrastructure, and implementation remain proprietary and are not included in this repository.

# PullO

<div align="center">

<img src="./branding/logo-dark.png" alt="PullO Logo" width="120"/>

# Connect your local AI to your team.

### Securely expose Ollama, LM Studio, and llama.cpp as OpenAI-compatible APIs without exposing your machine.

[🌐 Website](https://pullo.ai) •
[🚀 Live Demo](https://pullo.ai) •
[📖 Documentation](./docs) •
[🎥 Demo Video](#) •
[📊 Pitch Deck](#)

---

![Status](https://img.shields.io/badge/Status-Active-success)
![Version](https://img.shields.io/badge/Version-V1-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

</div>

---

# Repository Notice

> **PullO is a proprietary commercial product.**

This repository is a **public showcase** containing documentation, architecture diagrams, screenshots, branding assets, API examples, and other public resources.

The production backend, browser extension, infrastructure, deployment tooling, and implementation details remain **closed-source**.

---

# Why PullO?

Running AI locally has never been easier.

Sharing it securely with your team still is.

Today developers rely on:

- Port Forwarding
- SSH
- Cloudflare Tunnels
- ngrok
- VPNs
- Complex networking

These solutions weren't designed for collaborative AI.

They expose machines, require networking knowledge, or become difficult to manage across teams.

PullO changes that.

It transforms your local AI into a secure OpenAI-compatible endpoint that your team can use without exposing your local machine.

---

# What is PullO?

PullO is a collaboration platform built for Local AI.

It allows developers and teams to securely expose models running on:

- Ollama
- LM Studio
- llama.cpp

through familiar OpenAI-compatible APIs.

Instead of moving models to the cloud, PullO lets teams bring collaboration to local AI.

---

# Key Features

## 🤝 Team Workspaces

Organize members into isolated workspaces with shared AI infrastructure.

---

## 🧠 Local AI Integration

Works with:

- Ollama
- LM Studio
- llama.cpp

No cloud GPU required.

---

## 🔌 OpenAI-Compatible APIs

Integrate existing OpenAI SDKs without changing your application.

---

## 🔑 API Keys

Generate secure API Keys with:

- Model Access
- Tool Permissions
- Rate Limits
- Usage Controls

---

## 🖥 Browser Extension

A lightweight browser extension securely connects your local AI to PullO.

---

## 📊 Analytics

Track:

- Requests
- Tokens
- Usage
- Models
- Team Activity

---

## ⚡ Multiple Models

Manage multiple local models inside one workspace.

---

## 🔒 Secure Authentication

Workspace-based authentication with scoped API Keys.

---

## 📜 Request Logs

Inspect AI requests for debugging and monitoring.

---

## 🏢 Built for Teams

Designed from the ground up for collaborative local AI development.

---

# Supported Providers

| Provider | Status |
|-----------|--------|
| Ollama | ✅ |
| LM Studio | ✅ |
| llama.cpp | ✅ |
| OpenAI Compatible APIs | 🚧 |

---

# High Level Architecture

```
                   Team

                     │

             PullO Dashboard

                     │

              Browser Extension

                     │

              PullO Platform

                     │

          OpenAI Compatible API

                     │

      Ollama • LM Studio • llama.cpp
```

For a more detailed overview, see the documentation.

---

# Screenshots

The repository includes screenshots of:

- Landing Page
- Dashboard
- Workspace
- Models
- API Keys
- Analytics
- Browser Extension

See the **screenshots/** directory.

---

# API Example

```bash
curl https://api.pullo.ai/v1/chat/completions \
  -H "Authorization: Bearer pk_xxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
      "model":"deepseek-r1",
      "messages":[
          {
              "role":"user",
              "content":"Hello!"
          }
      ]
  }'
```

Compatible with existing OpenAI SDKs.

---

# Project Structure

```
PullO-Showcase

README.md

LICENSE.md

ROADMAP.md

SECURITY.md

docs/

screenshots/

branding/

diagrams/

media/

examples/

pitch/
```

---

# Documentation

Documentation includes:

- Vision
- Product Overview
- High-Level Architecture
- Security Model
- API Overview
- Extension Overview
- Deployment Overview
- Frequently Asked Questions

---

# Roadmap

### Current

- Team Workspaces
- Browser Extension
- Local AI Providers
- OpenAI-Compatible APIs
- API Keys
- Analytics
- Request Logs
- Workspace Management

### Planned

- Model Routing
- Shared Tool Marketplace
- Enterprise Authentication
- Desktop Client
- Team Billing
- Provider Marketplace

---

# Demo

Watch PullO in action.

🎥 Demo Video

(Coming Soon)

---

# Pitch Deck

📊 Product Presentation

(Coming Soon)

---

# Security

Security is a first-class priority.

PullO uses:

- Workspace Isolation
- API Keys
- Authentication
- Secure Browser Extension
- Permission Scoping

Please refer to **SECURITY.md**.

---

# Contributing

PullO is currently developed internally by Runtime.co.

This repository is intended for documentation and public resources only.

External code contributions are not currently accepted.

---

# License

Copyright © 2026 Runtime.co

All Rights Reserved.

This repository contains documentation and public showcase material only.

The production PullO software remains proprietary.

See **LICENSE.md**.

---

# Team

Built with ❤️ by **Runtime.co**

---

<div align="center">

### Local AI deserves better collaboration.

**PullO — Connect your local AI to your team.**

</div>