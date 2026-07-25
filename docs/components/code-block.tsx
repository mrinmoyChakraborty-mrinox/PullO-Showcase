"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { Check, Copy } from "lucide-react";

const PLACEHOLDER_PATTERNS: { pattern: RegExp; className: string }[] = [
  { pattern: /Your API Key/g,             className: "code-placeholder" },
  { pattern: /YOUR_API_KEY/g,             className: "code-placeholder" },
  { pattern: /Your Model Name/g,          className: "code-placeholder" },
  { pattern: /"Your Model Name"/g,        className: "code-placeholder" },
  { pattern: /Your_Model_Name/g,         className: "code-placeholder" },
  { pattern: /YOUR_MODEL_NAME/g,         className: "code-placeholder" },
];

function cleanPlaceholders(root: Element) {
  const marks = Array.from(root.querySelectorAll("mark.code-placeholder, mark.code-prefix-blue"));
  for (const mark of marks) {
    const parent = mark.parentNode;
    if (parent) {
      while (mark.firstChild) {
        parent.insertBefore(mark.firstChild, mark);
      }
      parent.removeChild(mark);
    }
  }
  root.normalize();
}

/**
 * Walk every text node under `root` and wrap matched placeholder substrings
 * in <mark> elements so they get highlighted by CSS.
 * Preserves the original DOM structure (runs once after mount).
 */
function highlightPlaceholders(root: Element) {
  cleanPlaceholders(root);

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    textNodes.push(node);
  }

  for (const textNode of textNodes) {
    const text = textNode.nodeValue ?? "";
    const matches: { index: number; length: number; text: string; className: string }[] = [];

    for (const { pattern, className } of PLACEHOLDER_PATTERNS) {
      pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(text)) !== null) {
        matches.push({ index: m.index, length: m[0].length, text: m[0], className });
      }
    }

    if (matches.length === 0) continue;

    // Sort matches by index so we process left-to-right
    matches.sort((a, b) => a.index - b.index);

    const frag = document.createDocumentFragment();
    let currentIndex = 0;

    for (const match of matches) {
      if (match.index < currentIndex) continue; // Skip overlaps

      if (match.index > currentIndex) {
        frag.appendChild(document.createTextNode(text.slice(currentIndex, match.index)));
      }

      const mark = document.createElement("mark");
      mark.className = match.className;
      mark.textContent = match.text;
      frag.appendChild(mark);

      currentIndex = match.index + match.length;
    }

    if (currentIndex < text.length) {
      frag.appendChild(document.createTextNode(text.slice(currentIndex)));
    }

    textNode.parentNode?.replaceChild(frag, textNode);
  }
}

interface CodeBlockProps {
  html: string;
  language?: string;
  filename?: string;
  rawCode: string;
}

export function CodeBlock({ html, language, filename, rawCode }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) highlightPlaceholders(contentRef.current);
  }, [html]);

  const handleCopy = useCallback(async () => {
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = rawCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [rawCode]);

  return (
    <div className="inset-panel relative overflow-hidden my-6 group">
      {/* Header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px 10px 20px",
          borderBottom: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Traffic light dots */}
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(239,68,68,0.5)", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(245,158,11,0.5)", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(34,197,94,0.4)", display: "inline-block" }} />
          {filename && (
            <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              {filename}
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {language && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {language}
            </span>
          )}
          <motion.button className="emboss-btn" onClick={handleCopy} aria-label="Copy code" style={{ padding: "6px 8px", cursor: "pointer" }} whileTap={{ scale: 0.92 }}>
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }} style={{ display: "flex" }}>
                  <Check size={13} style={{ color: "var(--color-success)" }} />
                </motion.span>
              ) : (
                <motion.span key="copy" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }} style={{ display: "flex" }}>
                  <Copy size={13} style={{ color: "var(--color-text-secondary)" }} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
      {/* Code content */}
      <div
        ref={contentRef}
        className="code-content-wrapper"
        dangerouslySetInnerHTML={{ __html: html }}
        style={{ overflowX: "auto" }}
      />
    </div>
  );
}

// ─── MdxCodeBlock ──────────────────────────────────────────────────────────────
// Used by MDX (via rehype-pretty-code). The `data-language` attribute is set by
// rehype-pretty-code on the <pre> element and bubbles up through ...props.

export function MdxCodeBlock({ children, ...props }: React.HTMLAttributes<HTMLPreElement>) {
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Highlight placeholder tokens after mount (rehype has already tokenized the code)
  useEffect(() => {
    const pre = containerRef.current?.querySelector("pre");
    if (pre) highlightPlaceholders(pre);
  }, [children]);

  // Detect language from rehype-pretty-code's data-language attribute on <pre>
  const lang = (props as Record<string, unknown>)["data-language"] as string | undefined;

  const handleCopy = useCallback(async () => {
    const preEl = containerRef.current?.querySelector("pre");
    const rawText = preEl?.textContent ?? "";
    if (rawText) {
      try {
        await navigator.clipboard.writeText(rawText);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = rawText;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <div ref={containerRef} className="inset-panel relative overflow-hidden my-6 group">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          borderBottom: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(239,68,68,0.5)", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(245,158,11,0.5)", display: "inline-block" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(34,197,94,0.4)", display: "inline-block" }} />
          {lang && (
            <span style={{ marginLeft: 6, fontFamily: "var(--font-mono)", fontSize: "0.68rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.7 }}>
              {lang}
            </span>
          )}
        </div>
        <motion.button
          className="emboss-btn"
          onClick={handleCopy}
          aria-label="Copy code"
          style={{ padding: "5px 7px", cursor: "pointer" }}
          whileTap={{ scale: 0.92 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span key="check" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }} style={{ display: "flex" }}>
                <Check size={13} style={{ color: "var(--color-success)" }} />
              </motion.span>
            ) : (
              <motion.span key="copy" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.12 }} style={{ display: "flex" }}>
                <Copy size={13} style={{ color: "var(--color-text-secondary)" }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
      <pre {...props}>{children}</pre>
    </div>
  );
}

