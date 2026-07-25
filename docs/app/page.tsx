import type { Metadata } from "next";
import Link from "next/link";
import {
  Zap,
  BookOpen,
  Code2,
  Terminal,
  Shield,
  Users,
  ArrowRight,
  Server,
} from "lucide-react";
import { ArchitectureDiagram } from "@/components/architecture-diagram";

export const metadata: Metadata = {
  title: "PullO Docs — Local AI, OpenAI-compatible API Documentation",
  description:
    "Documentation for PullO — the private AI network layer that exposes your local Ollama, LM Studio, and llama.cpp models as secure, team-accessible OpenAI-compatible APIs. No tunnels, no port forwarding.",
};

const quickLinks = [
  {
    icon: <Zap size={18} />,
    title: "Quick Start",
    description:
      "Install Ollama, connect the extension, and make your first API call in under 5 minutes.",
    href: "/quickstart",
    accentColor: "rgba(109,93,254,0.15)",
    borderColor: "rgba(109,93,254,0.25)",
  },
  {
    icon: <Code2 size={18} />,
    title: "API Reference",
    description:
      "Full REST API documentation: endpoints, authentication, request schemas, and error codes.",
    href: "/api-reference",
    accentColor: "rgba(34,211,238,0.1)",
    borderColor: "rgba(34,211,238,0.2)",
  },
  {
    icon: <BookOpen size={18} />,
    title: "FAQ",
    description:
      "Common questions about PullO, privacy, latency, supported models, and how it compares to ngrok.",
    href: "/faq",
    accentColor: "rgba(139,92,246,0.1)",
    borderColor: "rgba(139,92,246,0.2)",
  },
  {
    icon: <Terminal size={18} />,
    title: "CLI & Agents",
    description:
      "Connect Claude Code, Cursor, Continue.dev, and LangChain to your local models through PullO.",
    href: "/cli-agents",
    accentColor: "rgba(34,197,94,0.1)",
    borderColor: "rgba(34,197,94,0.2)",
    badge: "Soon",
  },
  {
    icon: <Shield size={18} />,
    title: "Architecture",
    description:
      "Deep dive into the pull-based tunnel design, request lifecycle, and security model.",
    href: "/architecture",
    accentColor: "rgba(245,158,11,0.1)",
    borderColor: "rgba(245,158,11,0.2)",
    badge: "Soon",
  },
  {
    icon: <Users size={18} />,
    title: "Teams",
    description:
      "Invite teammates, configure roles, and share model access across your workspace.",
    href: "/teams",
    accentColor: "rgba(45,212,191,0.1)",
    borderColor: "rgba(45,212,191,0.2)",
    badge: "Soon",
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section style={{ marginBottom: "64px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "4px 10px",
            borderRadius: "999px",
            background: "rgba(109,93,254,0.1)",
            border: "1px solid rgba(109,93,254,0.2)",
            marginBottom: "20px",
            fontSize: "0.75rem",
            fontWeight: 500,
            color: "var(--color-iris-500)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-iris-500)",
              animation: "pulse 2s ease-in-out infinite",
              display: "inline-block",
            }}
          />
          runtime.co / docs
        </div>

        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "16px",
            color: "var(--color-text-primary)",
          }}
        >
          PullO Docs
        </h1>

        <p
          style={{
            fontSize: "1.15rem",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
            marginBottom: "8px",
            maxWidth: 560,
          }}
        >
          Expose your local Ollama models as secure, OpenAI-compatible APIs —
          no port forwarding, no ngrok, no Cloudflare Tunnel.
        </p>

        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.875rem",
            color: "var(--color-text-secondary)",
          }}
        >
          Cloud{" "}
          <span style={{ color: "var(--color-iris-500)" }}>→</span> Pull{" "}
          <span style={{ color: "var(--color-iris-500)" }}>→</span> Local AI
        </p>

        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "28px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/quickstart"
            id="hero-cta-quickstart"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "var(--radius-lg)",
              background: "var(--color-iris-500)",
              color: "#fff",
              fontWeight: 600,
              fontSize: "0.9rem",
              textDecoration: "none",
              transition: "opacity 120ms ease, transform 120ms ease",
            }}
          >
            Get Started
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/api-reference"
            id="hero-cta-api"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "var(--radius-lg)",
              background: "transparent",
              color: "var(--color-text-secondary)",
              fontWeight: 500,
              fontSize: "0.9rem",
              textDecoration: "none",
              border: "1px solid var(--color-border-default)",
              transition: "border-color 120ms ease, color 120ms ease",
            }}
          >
            <Server size={14} />
            API Reference
          </Link>
        </div>
      </section>

      {/* Architecture diagram */}
      <section style={{ marginBottom: "56px" }}>
        <h2
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
          }}
        >
          How it works
        </h2>
        <ArchitectureDiagram />
      </section>

      {/* Card grid */}
      <section>
        <h2
          style={{
            fontSize: "0.72rem",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--color-text-secondary)",
            marginBottom: "16px",
          }}
        >
          Documentation
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "12px",
          }}
        >
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              id={`card-${item.title.toLowerCase().replace(/\s+/g, "-")}`}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                padding: "20px",
                borderRadius: "var(--radius-xl)",
                background: item.accentColor,
                border: `1px solid ${item.borderColor}`,
                boxShadow:
                  "inset 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                textDecoration: "none",
                transition: "transform 150ms ease, box-shadow 150ms ease",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    color: "var(--color-text-primary)",
                    opacity: 0.8,
                  }}
                >
                  {item.icon}
                </span>
                {item.badge && (
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: 600,
                      padding: "2px 7px",
                      borderRadius: "999px",
                      background: "rgba(109,93,254,0.15)",
                      color: "var(--color-iris-500)",
                      border: "1px solid rgba(109,93,254,0.2)",
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: "var(--color-text-primary)",
                }}
              >
                {item.title}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  color: "var(--color-text-secondary)",
                  lineHeight: 1.55,
                }}
              >
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}
