"use client";

import { useEffect, useState, useRef } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function useToc() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll(".prose-docs h2, .prose-docs h3")
    ) as HTMLElement[];

    const seenIds = new Set<string>();

    const tocItems: TocItem[] = headings.map((h, index) => {
      const rawText = h.textContent ?? "";
      let id = h.id || slugify(rawText) || `heading-${index}`;
      
      // Ensure unique ID
      let uniqueId = id;
      let counter = 1;
      while (seenIds.has(uniqueId)) {
        counter++;
        uniqueId = `${id}-${counter}`;
      }
      seenIds.add(uniqueId);
      
      // Sync back to DOM
      h.id = uniqueId;

      return {
        id: uniqueId,
        text: rawText,
        level: parseInt(h.tagName.replace("H", "")),
      };
    });
    setItems(tocItems);

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, []);

  return { items, activeId };
}

export function Toc() {
  const { items, activeId } = useToc();

  if (items.length === 0) return null;

  return (
    <nav
      aria-label="On this page"
      style={{
        position: "sticky",
        top: "calc(var(--topbar-height) + 24px)",
        width: "var(--toc-width)",
        flexShrink: 0,
        alignSelf: "flex-start",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
      }}
    >
      <p
        style={{
          fontSize: "0.72rem",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--color-text-secondary)",
          marginBottom: "8px",
        }}
      >
        On this page
      </p>
      {items.map((item) => {
        const isActive = activeId === item.id;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            style={{
              display: "block",
              fontSize: "0.8rem",
              lineHeight: "1.5",
              paddingLeft: item.level === 3 ? "12px" : "8px",
              paddingTop: "3px",
              paddingBottom: "3px",
              color: isActive
                ? "var(--color-iris-500)"
                : "var(--color-text-secondary)",
              fontWeight: isActive ? 500 : 400,
              borderLeft: `2px solid ${isActive ? "var(--color-iris-500)" : "transparent"}`,
              transition: "color 120ms ease, border-color 120ms ease",
              textDecoration: "none",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "var(--color-text-primary)";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "var(--color-text-secondary)";
            }}
          >
            {item.text}
          </a>
        );
      })}
    </nav>
  );
}

// Mobile dropdown TOC
export function MobileToc() {
  const { items, activeId } = useToc();
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  const activeItem = items.find((i) => i.id === activeId) ?? items[0];

  return (
    <div style={{ position: "relative", marginBottom: "24px" }}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="On this page navigation"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border-default)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          color: "var(--color-text-secondary)",
          fontSize: "0.825rem",
        }}
      >
        <span>On this page: {activeItem?.text}</span>
        <span style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms" }}>▾</span>
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--color-bg-elevated)",
            border: "1px solid var(--color-border-default)",
            borderRadius: "var(--radius-md)",
            padding: "8px",
            zIndex: 20,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "8px 10px",
                fontSize: "0.825rem",
                color:
                  activeId === item.id
                    ? "var(--color-iris-500)"
                    : "var(--color-text-secondary)",
                paddingLeft: item.level === 3 ? "20px" : "10px",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
              }}
            >
              {item.text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
