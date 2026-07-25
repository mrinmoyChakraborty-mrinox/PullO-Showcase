# PullO Frontend

Frontend application for PullO — a platform that enables users to run local AI models on their own machines and expose them as secure, team-accessible APIs.

---

## Overview

The frontend serves as the primary interface for:

* User authentication
* Dashboard management
* Model registration
* API key management
* Team collaboration
* Usage analytics
* Extension connection flow
* Workspace settings

Built with modern web technologies for speed, scalability, and maintainability.

---

## Tech Stack

* Next.js
* React
* TypeScript
* Tailwind CSS
* Supabase Auth
* shadcn/ui
* Lucide Icons

---

## Project Structure

```text
frontend/
│
├── app/
│   ├── (auth)/
│   ├── dashboard/
│   ├── models/
│   ├── teams/
│   ├── settings/
│   ├── extension/
│   └── api/
│
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── models/
│   ├── teams/
│   └── extension/
│
├── hooks/
│
├── lib/
│   ├── api/
│   ├── auth/
│   ├── utils/
│   └── supabase/
│
├── services/
│
├── public/
│
├── styles/
│
└── types/
```

---

## Core Features

### Authentication

* Email & Password Login
* Google OAuth
* Session Management
* Protected Routes
* Account Verification

### Dashboard

* Workspace Overview
* Connected Nodes
* Active Models
* API Usage Metrics
* Request Monitoring

### Model Management

* Register Local Models
* View Model Status
* Configure Endpoints
* Manage Visibility

### API Keys

* Create API Keys
* Revoke Keys
* View Usage
* Permission Management

### Teams

* Invite Members
* Manage Roles
* Workspace Collaboration

### Extension Connection

* Connect Chrome Extension
* Extension Authentication Bridge
* Extension Token Management
* Connection Status Monitoring

---

## Authentication Flow

```text
User Login
    ↓
Supabase Auth
    ↓
Session Created
    ↓
Dashboard Access
    ↓
Extension Connect
    ↓
Extension Token Issued
    ↓
Chrome Extension Connected
```

---

## Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_APP_URL=
```

---

## Development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Start production server:

```bash
npm run start
```

---

## Design Principles

* Clean SaaS UX
* Minimal Cognitive Load
* Fast Navigation
* Mobile Responsive
* Accessibility Friendly
* Consistent Component System

---

## Current Scope (HackBharat MVP)

### Included

* Authentication
* Dashboard
* Model Registry
* Team Management
* API Key Management
* Extension Connection
* Usage Analytics

### Future Enhancements

* Real-Time Collaboration
* Billing & Subscriptions
* Marketplace
* Advanced Monitoring
* Team Workspaces
* AI Pod Management

---

## PullO Mission

Enable anyone to transform local AI models into secure, shareable APIs without managing cloud infrastructure.

**Local Intelligence → Global Access**

---

Built by Runtime.co
