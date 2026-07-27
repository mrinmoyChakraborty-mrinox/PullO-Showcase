"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Menu, ChevronDown } from "lucide-react";
import { navSections } from "@/lib/nav";

interface SidebarContentProps {
  onNavClick?: () => void;
}

function SidebarContent({ onNavClick }: SidebarContentProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navSections.map((s) => s.title)
  );

  const toggleSection = (title: string) => {
    setExpandedSections((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  return (
    <nav aria-label="Documentation navigation" style={{ padding: "16px 12px" }}>
      {navSections.map((section) => {
        const isExpanded = expandedSections.includes(section.title);
        return (
          <div key={section.title} style={{ marginBottom: "8px" }}>
            <button
              onClick={() => toggleSection(section.title)}
              aria-expanded={isExpanded}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginBottom: "4px",
              }}
            >
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-secondary)",
                }}
              >
                {section.title}
              </span>
              <motion.span
                animate={{ rotate: isExpanded ? 0 : -90 }}
                transition={{ duration: 0.15 }}
                style={{ color: "var(--color-text-secondary)" }}
              >
                <ChevronDown size={12} />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px", paddingBottom: "8px" }}>
                    {section.items.map((item) => {
                      const isActive =
                        item.href === "/"
                          ? pathname === "/"
                          : pathname.startsWith(item.href);

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={onNavClick}
                          aria-current={isActive ? "page" : undefined}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            padding: "7px 10px",
                            borderRadius: "var(--radius-md)",
                            fontSize: "0.85rem",
                            fontWeight: isActive ? 500 : 400,
                            color: isActive
                              ? "var(--color-iris-500)"
                              : "var(--color-text-secondary)",
                            textDecoration: "none",
                            transition: "color 120ms ease, background 120ms ease",
                            ...(isActive
                              ? {
                                  background: "rgba(45,212,200,0.1)",
                                  boxShadow:
                                    "0 0 0 1px rgba(45,212,200,0.25), 0 2px 6px rgba(45,212,200,0.12)",
                                }
                              : {}),
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLAnchorElement).style.color =
                                "var(--color-text-primary)";
                              (e.currentTarget as HTMLAnchorElement).style.background =
                                "rgba(255,255,255,0.04)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive) {
                              (e.currentTarget as HTMLAnchorElement).style.color =
                                "var(--color-text-secondary)";
                              (e.currentTarget as HTMLAnchorElement).style.background =
                                "transparent";
                            }
                          }}
                        >
                          <span>{item.title}</span>
                          {item.badge && (
                            <span
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 600,
                                letterSpacing: "0.04em",
                                padding: "2px 6px",
                                borderRadius: "999px",
                                background: "rgba(45,212,200,0.15)",
                                color: "var(--color-iris-500)",
                                border: "1px solid rgba(45,212,200,0.2)",
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  return (
    <aside
      aria-label="Docs sidebar"
      style={{
        width: "var(--sidebar-width)",
        flexShrink: 0,
        height: "calc(100vh - var(--topbar-height))",
        overflowY: "auto",
        position: "sticky",
        top: "var(--topbar-height)",
        borderRight: "1px solid var(--color-border-default)",
        background: "var(--color-bg-surface)",
      }}
    >
      <SidebarContent />
    </aside>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        id="mobile-menu-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "8px",
          background: "transparent",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
        }}
      >
        <Menu size={18} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 40,
                background: "rgba(5,8,22,0.7)",
                backdropFilter: "blur(3px)",
              }}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              key="drawer"
              role="dialog"
              aria-label="Navigation menu"
              aria-modal="true"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 41,
                width: "min(280px, 85vw)",
                background: "var(--color-bg-surface)",
                borderRight: "1px solid var(--color-border-default)",
                overflowY: "auto",
                paddingTop: "56px",
              }}
            >
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation menu"
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "transparent",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "var(--radius-md)",
                  padding: "6px",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
              <SidebarContent onNavClick={() => setOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
