"use client";

import { motion } from "framer-motion";

const nodes = [
  { id: "dev", label: "Developer", sublabel: "API Client / App", icon: "👤" },
  {
    id: "cloud",
    label: "PullO Cloud",
    sublabel: "Request Queue",
    icon: "☁",
    highlight: true,
  },
  {
    id: "ext",
    label: "Chrome Extension",
    sublabel: "Pull Worker",
    icon: "🔌",
  },
  {
    id: "ollama",
    label: "Ollama",
    sublabel: "localhost:11434",
    icon: "🦙",
  },
];

const lineVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i: number) => ({
    pathLength: 1,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.4, duration: 0.6, ease: "easeOut" as const },
  }),
};

const nodeVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.4, ease: "easeOut" as const },
  }),
};

export function ArchitectureDiagram() {
  return (
    <div
      aria-label="Architecture diagram: Developer sends request to PullO Cloud, which is pulled by the Chrome Extension and forwarded to local Ollama"
      style={{
        padding: "32px 24px",
        borderRadius: "var(--radius-xl)",
        background: "var(--color-bg-card)",
        border: "1px solid var(--color-border-default)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0",
        position: "relative",
        overflow: "hidden",
        maxWidth: 420,
        margin: "32px auto",
      }}
    >
      {/* Ambient glow */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(45,212,200,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      {nodes.map((node, i) => (
        <div key={node.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
          <motion.div
            custom={i}
            initial="hidden"
            animate="visible"
            variants={nodeVariants}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              padding: "14px 20px",
              borderRadius: "var(--radius-lg)",
              width: "100%",
              background: node.highlight
                ? "rgba(45,212,200,0.1)"
                : "var(--color-bg-elevated)",
              border: `1px solid ${
                node.highlight
                  ? "rgba(45,212,200,0.3)"
                  : "var(--color-border-default)"
              }`,
              boxShadow: node.highlight
                ? "0 0 0 1px rgba(45,212,200,0.15), 0 4px 16px rgba(45,212,200,0.1)"
                : "inset 0 1px 2px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>{node.icon}</span>
            <div>
              <p
                style={{
                  margin: 0,
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  color: node.highlight
                    ? "var(--color-iris-500)"
                    : "var(--color-text-primary)",
                }}
              >
                {node.label}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  color: "var(--color-text-secondary)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {node.sublabel}
              </p>
            </div>
          </motion.div>

          {/* Arrow connector */}
          {i < nodes.length - 1 && (
            <motion.div
              custom={i}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ opacity: 1, scaleY: 1 }}
              transition={{ delay: 0.3 + i * 0.3, duration: 0.3, ease: "easeOut" }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "4px 0",
              }}
            >
              <div
                style={{
                  width: 1,
                  height: 20,
                  background:
                    "linear-gradient(to bottom, rgba(45,212,200,0.4), rgba(45,212,200,0.2))",
                }}
              />
              <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
                <path
                  d="M6 7L0 0h12L6 7z"
                  fill="rgba(45,212,200,0.6)"
                />
              </svg>
            </motion.div>
          )}
        </div>
      ))}

      <p
        style={{
          marginTop: "16px",
          fontSize: "0.72rem",
          color: "var(--color-text-secondary)",
          textAlign: "center",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.04em",
        }}
      >
        Cloud → Pull → Local AI
      </p>
    </div>
  );
}
