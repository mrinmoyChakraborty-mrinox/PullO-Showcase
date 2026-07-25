import Image from 'next/image'
import Link from 'next/link'
import { ClientPage } from '@/components/client-page'

export default function Page() {
  return (
    <>
      {/* Server-rendered SEO content — visible to crawlers before JS loads */}
      <div className="sr-only" aria-hidden="false">
        <h1>PullO — Private AI Network Layer for Local Models</h1>
        <p>
          PullO is a private AI network layer that turns local AI models into
          secure, shareable OpenAI-compatible APIs for your team. Connect
          Ollama, LM Studio, or any OpenAI-compatible endpoint. Expose local
          LLMs as production-ready APIs without port forwarding, tunnels, or
          cloud-hosted inference. Share AI endpoints securely with API keys,
          workspaces, and role-based access control. Supports streaming, MCP
          tool integration, rate limiting, and real-time analytics. Built for
          developer teams that need private AI infrastructure behind corporate
          firewalls.
        </p>
      </div>

      {/* Interactive experience — SSR-safe, only 3D scene is client-only */}
      <ClientPage />
    </>
  )
}
