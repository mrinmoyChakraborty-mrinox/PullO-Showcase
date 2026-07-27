import type { MDXComponents } from "mdx/types";
import { MdxCodeBlock } from "./code-block";
import { Callout } from "./callout";
import { CodeWithRunGuide } from "./code-with-run-guide";
import { RunGuidePanel } from "./run-guide-panel";

// Auto-generate anchor IDs for headings
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function HeadingAnchor({ id }: { id: string }) {
  return (
    <a
      href={`#${id}`}
      aria-label={`Anchor for section ${id}`}
      style={{
        marginLeft: "8px",
        opacity: 0,
        color: "var(--color-iris-500)",
        textDecoration: "none",
        fontSize: "0.9em",
        transition: "opacity 120ms ease",
      }}
      className="heading-anchor"
    >
      #
    </a>
  );
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings with anchor links
    h1: ({ children, ...props }) => {
      const id = slugify(String(children));
      return (
        <h1 id={id} {...props} className="group">
          {children}
          <HeadingAnchor id={id} />
        </h1>
      );
    },
    h2: ({ children, ...props }) => {
      const id = slugify(String(children));
      return (
        <h2 id={id} {...props} className="group">
          {children}
          <HeadingAnchor id={id} />
        </h2>
      );
    },
    h3: ({ children, ...props }) => {
      const id = slugify(String(children));
      return (
        <h3 id={id} {...props} className="group">
          {children}
          <HeadingAnchor id={id} />
        </h3>
      );
    },
    h4: ({ children, ...props }) => {
      const id = slugify(String(children));
      return <h4 id={id} {...props}>{children}</h4>;
    },

    // Code blocks — route to MdxCodeBlock for skeuomorphic panel
    pre: (props) => <MdxCodeBlock {...(props as React.HTMLAttributes<HTMLPreElement>)} />,

    // Inline code
    code: ({ children, ...props }) => (
      <code {...props}>{children}</code>
    ),

    // Callout shortcodes
    Callout,

    // Code + run-guide side-by-side layout
    CodeWithRunGuide,
    RunGuidePanel,

    // Method badge shortcode
    MethodBadge: ({
      method,
      endpoint,
    }: {
      method: "GET" | "POST" | "DELETE" | "PUT";
      endpoint: string;
    }) => (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 16px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          margin: "16px 0",
          fontFamily: "var(--font-mono)",
          fontSize: "0.875rem",
        }}
      >
        <span
          className={`method-badge method-badge-${method.toLowerCase()}`}
        >
          {method}
        </span>
        <span style={{ color: "var(--color-text-primary)" }}>{endpoint}</span>
      </div>
    ),

    // Steps wrapper
    Steps: ({ children }: { children: React.ReactNode }) => (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0",
        }}
      >
        {children}
      </div>
    ),

    // Step item
    Step: ({
      title,
      number = 1,
      children,
    }: {
      title: string;
      number?: number;
      children: React.ReactNode;
    }) => (
      <div
        style={{
          display: "flex",
          gap: "16px",
          paddingBottom: "32px",
          position: "relative",
        }}
      >
        {/* Number circle + vertical line */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "rgba(45,212,200,0.15)",
              border: "1px solid rgba(45,212,200,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-iris-500)",
              flexShrink: 0,
              boxShadow: "0 0 0 3px rgba(45,212,200,0.06)",
            }}
          >
            {number}
          </div>
          <div
            aria-hidden="true"
            style={{
              width: 1,
              flex: 1,
              background:
                "linear-gradient(to bottom, rgba(45,212,200,0.25) 0%, transparent 100%)",
              marginTop: "6px",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              marginTop: "3px",
              marginBottom: "12px",
              fontSize: "1rem",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {title}
          </h3>
          <div style={{ color: "var(--color-text-secondary)", lineHeight: 1.7 }}>
            {children}
          </div>
        </div>
      </div>
    ),

    ...components,
  };
}
