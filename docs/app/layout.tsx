import type { Metadata } from "next";
import "./globals.css";
import { DocsShell } from "@/components/docs-shell";

const siteUrl = process.env.SITE_URL ?? "https://docs.pullo.co";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "PullO Docs — Private AI Network Layer Documentation",
    template: "%s — PullO Docs",
  },
  description:
    "Documentation for PullO — the private AI network layer that turns local models (Ollama, LM Studio, llama.cpp) into secure, shareable OpenAI-compatible APIs for your team. Quickstart, API reference, architecture, and troubleshooting.",
  keywords: [
    "PullO",
    "PullO docs",
    "private AI network layer",
    "OpenAI compatible API",
    "local AI",
    "Ollama",
    "llama.cpp",
    "LM Studio",
    "MCP",
    "Model Context Protocol",
    "AI infrastructure",
    "AI runtime",
    "local LLM API",
    "local inference",
    "team AI",
    "developer tools",
    "pull-based tunnel",
  ],
  authors: [{ name: "PullO", url: "https://github.com/mrinmoyChakraborty-mrinox/PullO" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "PullO Docs",
    title: "PullO Docs — Private AI Network Layer Documentation",
    description:
      "Documentation for PullO: turn local models (Ollama, LM Studio) into secure, shareable OpenAI-compatible APIs. Quickstart, API reference, architecture, FAQ and troubleshooting.",
    images: [
      {
        url: "/images/pullo-logo.png",
        width: 256,
        height: 256,
        alt: "PullO Docs — Private AI Network Layer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PullO Docs — Private AI Network Layer Documentation",
    description:
      "Documentation for PullO: turn local models into secure, shareable OpenAI-compatible APIs. Quickstart, API reference, architecture.",
    images: ["/images/pullo-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/images/pullo-logo.png", sizes: "any" },
    ],
    shortcut: ["/images/pullo-logo.png"],
    apple: ["/images/pullo-logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" style={{ background: "#0D0D14" }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <DocsShell>{children}</DocsShell>
      </body>
    </html>
  );
}
