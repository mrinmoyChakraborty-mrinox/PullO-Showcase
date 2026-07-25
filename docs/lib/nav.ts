export interface NavItem {
  title: string;
  href: string;
  description?: string;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Overview",
        href: "/",
        description: "What is PullO and how it works",
      },
      {
        title: "Quick Start",
        href: "/quickstart",
        description: "Install Ollama, connect the extension, make your first API call",
      },
      {
        title: "FAQ",
        href: "/faq",
        description: "Common questions about PullO",
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        title: "API Reference",
        href: "/api-reference",
        description: "REST API endpoints, auth, request/response schemas",
      },
      {
        title: "SDKs",
        href: "/sdks",
        badge: "Soon",
        description: "Python, JavaScript, and Go client libraries",
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        title: "Chrome Extension",
        href: "/extension",
        badge: "Soon",
        description: "Extension popup, connect/disconnect, troubleshooting",
      },
      {
        title: "CLI & Agents",
        href: "/cli-agents",
        badge: "Soon",
        description: "Claude Code, Cursor, Continue.dev, LangChain setup",
      },
      {
        title: "Teams",
        href: "/teams",
        badge: "Soon",
        description: "Invite teammates, roles, workspaces",
      },
      {
        title: "Tools",
        href: "/tools",
        badge: "Soon",
        description: "Web search, calculator, URL reader — per-model/key config",
      },
      {
        title: "MCP",
        href: "/mcp",
        badge: "Soon",
        description: "MCP server connections, custom tools, webhooks",
      },
      {
        title: "Architecture",
        href: "/architecture",
        badge: "Soon",
        description: "Pull-based tunnel diagram, request lifecycle, security model",
      },
      {
        title: "Troubleshooting",
        href: "/troubleshooting",
        badge: "Soon",
        description: "Common errors, Chrome suspension behavior",
      },
    ],
  },
  {
    title: "Changelog",
    items: [
      {
        title: "Changelog",
        href: "/changelog",
        badge: "Soon",
        description: "Release notes for extension, backend, dashboard",
      },
    ],
  },
];

export const allNavItems: NavItem[] = navSections.flatMap((s) => s.items);
