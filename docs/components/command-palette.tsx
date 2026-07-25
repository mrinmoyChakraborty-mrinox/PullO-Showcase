"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { searchIndex, type SearchEntry } from "@/lib/search-index";

const fuse = new Fuse(searchIndex, {
  keys: ["title", "description"],
  threshold: 0.4,
  includeScore: true,
});

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchEntry[]>([]);
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(searchIndex.slice(0, 6));
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim() === "") {
      setResults(searchIndex.slice(0, 6));
    } else {
      const res = fuse.search(query).map((r) => r.item);
      setResults(res.slice(0, 8));
    }
    setHighlighted(0);
  }, [query]);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === "Enter" && results[highlighted]) {
        navigate(results[highlighted].href);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [results, highlighted, navigate, onClose]
  );

  return (
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
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "rgba(5,8,22,0.75)",
              backdropFilter: "blur(4px)",
            }}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Search documentation"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.97, y: -12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: "15%",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 51,
              width: "min(560px, calc(100vw - 32px))",
              background: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              boxShadow:
                "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
            }}
          >
            {/* Search input row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderBottom: "1px solid var(--color-border-default)",
              }}
            >
              <Search
                size={18}
                style={{ color: "var(--color-text-secondary)", flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                id="command-palette-input"
                type="text"
                placeholder="Search docs…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
                spellCheck={false}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--color-text-primary)",
                  fontSize: "0.95rem",
                  fontFamily: "var(--font-sans)",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    padding: 2,
                  }}
                >
                  <X size={14} />
                </button>
              )}
              <kbd
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.7rem",
                  color: "var(--color-text-secondary)",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border-default)",
                  borderRadius: "4px",
                  padding: "2px 6px",
                  flexShrink: 0,
                }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ padding: "8px", maxHeight: "340px", overflowY: "auto" }}>
              {results.length === 0 ? (
                <p
                  style={{
                    padding: "16px",
                    textAlign: "center",
                    color: "var(--color-text-secondary)",
                    fontSize: "0.875rem",
                  }}
                >
                  No results for &ldquo;{query}&rdquo;
                </p>
              ) : (
                results.map((item, i) => (
                  <button
                    key={item.href}
                    onClick={() => navigate(item.href)}
                    onMouseEnter={() => setHighlighted(i)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "var(--radius-md)",
                      background:
                        highlighted === i
                          ? "rgba(109,93,254,0.1)"
                          : "transparent",
                      border:
                        highlighted === i
                          ? "1px solid rgba(109,93,254,0.2)"
                          : "1px solid transparent",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "background 80ms ease, border-color 80ms ease",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.875rem",
                          fontWeight: 500,
                          color:
                            highlighted === i
                              ? "var(--color-text-primary)"
                              : "var(--color-text-secondary)",
                        }}
                      >
                        {item.title}
                      </p>
                      {item.description && (
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.75rem",
                            color: "var(--color-text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          {item.description}
                        </p>
                      )}
                    </div>
                    {highlighted === i && (
                      <ArrowRight
                        size={14}
                        style={{ color: "var(--color-iris-500)", flexShrink: 0 }}
                      />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div
              style={{
                borderTop: "1px solid var(--color-border-default)",
                padding: "8px 16px",
                display: "flex",
                gap: "16px",
                justifyContent: "flex-end",
              }}
            >
              {[
                ["↑↓", "navigate"],
                ["↵", "select"],
                ["ESC", "close"],
              ].map(([key, label]) => (
                <span
                  key={key}
                  style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", display: "flex", gap: "4px", alignItems: "center" }}
                >
                  <kbd
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "var(--color-bg-card)",
                      border: "1px solid var(--color-border-default)",
                      borderRadius: "3px",
                      padding: "1px 5px",
                      fontSize: "0.7rem",
                    }}
                  >
                    {key}
                  </kbd>
                  {label}
                </span>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Trigger component that manages state + keyboard shortcut
export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <button
        id="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search documentation (⌘K)"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 12px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-lg)",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
          fontSize: "0.82rem",
          transition: "border-color 150ms ease, background 150ms ease",
          minWidth: 180,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "rgba(109,93,254,0.4)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor =
            "var(--color-border-default)";
        }}
      >
        <Search size={14} />
        <span>Search docs…</span>
        <kbd
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: "0.7rem",
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "3px",
            padding: "1px 5px",
          }}
        >
          ⌘K
        </kbd>
      </button>
      <CommandPalette open={open} onClose={() => setOpen(false)} />
    </>
  );
}
