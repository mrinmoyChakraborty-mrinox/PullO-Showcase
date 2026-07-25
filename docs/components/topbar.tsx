import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { CommandPaletteTrigger } from "./command-palette";
import { MobileSidebar } from "./sidebar";

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
      {/* Mobile menu trigger */}
      <div style={{ display: "none" }} className="mobile-menu-btn">
        <MobileSidebar />
      </div>

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
          background: "rgba(109,93,254,0.1)",
          color: "var(--color-iris-500)",
          border: "1px solid rgba(109,93,254,0.2)",
          flexShrink: 0,
        }}
      >
        v1.0
      </span>

      {/* Search — grows to fill space */}
      <div style={{ flex: 1, maxWidth: 360 }}>
        <CommandPaletteTrigger />
      </div>

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
          href={process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://pullo.runtimeco.qzz.io/"}
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
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
