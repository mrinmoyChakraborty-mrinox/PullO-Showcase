import Link from "next/link";
import { ExternalLink } from "lucide-react";

export function Topbar() {
  return (
    <header
      role="banner"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: "var(--topbar-height)",
        background: "rgba(13,13,20,0.85)",
        borderBottom: "1px solid var(--color-border-default)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "16px",
      }}
    >
      {/* Logo */}
      <Link
        href="/"
        aria-label="PullO Docs home"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          flexShrink: 0,
        }}
      >
        <img
          src="/images/pullo-logo.png"
          alt="PullO"
          width={28}
          height={28}
          style={{ borderRadius: 6 }}
        />
        <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.95rem",
              color: "var(--color-text-primary)",
            }}
          >
            PullO
          </span>
          <span
            style={{
              fontSize: "0.72rem",
              color: "var(--color-text-secondary)",
              fontWeight: 400,
            }}
          >
            Docs
          </span>
        </div>
      </Link>

      {/* Divider */}
      <div
        style={{
          width: 1,
          height: 20,
          background: "var(--color-border-default)",
          flexShrink: 0,
        }}
        aria-hidden
      />

      {/* Version badge */}
      <span
        aria-label="Version 1.0"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.72rem",
          padding: "3px 8px",
          borderRadius: "999px",
          background: "rgba(45,212,200,0.1)",
          color: "var(--color-iris-500)",
          border: "1px solid rgba(45,212,200,0.2)",
          flexShrink: 0,
        }}
      >
        v1.0
      </span>

      {/* Right actions */}
      <div
        style={{
          marginLeft: "auto",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="PullO website"
          className="topbar-link-pullo"
          style={{
            fontSize: "0.82rem",
            color: "var(--color-text-secondary)",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <img
            src="/images/pullo-logo.png"
            alt=""
            width={14}
            height={14}
            style={{ borderRadius: 3, objectFit: "contain" }}
          />
          <span>PullO</span>
          <ExternalLink size={11} />
        </Link>
      </div>

      <style>{`
        @media (max-width: 768px) {
          /* mobile menu trigger handled separately */
        }
      `}</style>
    </header>
  );
}