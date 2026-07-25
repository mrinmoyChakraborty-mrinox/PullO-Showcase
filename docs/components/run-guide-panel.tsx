"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2, Minimize2, Copy, Check,
  Terminal, Package, Code2, CheckCircle2,
  AlertTriangle, ChevronDown, ChevronRight, ChevronLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface RunGuideStep {
  id: string;
  title: string;
  icon?: "vscode" | "terminal" | "python" | "package" | "check" | "warning";
  description: string;
  code?: { label?: string; lang: string; content: string }[];
}

export interface TroubleshootingEntry {
  issue: string;
  error: string;
  solution: string;
}

export interface RunGuideProps {
  language?: string;
  title?: string;
  steps: RunGuideStep[];
  troubleshooting?: TroubleshootingEntry[];
}

/* ------------------------------------------------------------------ */
/*  Shared Design Scale Constants (§2.3 / Option A)                    */
/* ------------------------------------------------------------------ */

const BADGE_SIZE = { upcoming: 24, active: 26, completed: 24 } as const;
const RAIL_WIDTH = 1.5;
const STEP_GAP = 10;

/* ------------------------------------------------------------------ */
/*  Helper: Format descriptions with interactive KBD and Menus         */
/* ------------------------------------------------------------------ */

function FormattedText({ text }: { text: string }) {
  const parts = text.split(/(→|->|\(Ctrl\+`[^\)]*\)|Ctrl\+`|[A-Za-z0-9_\-]+\.py)/g);

  return (
    <span>
      {parts.map((part, idx) => {
        if (part === "→" || part === "->") {
          return (
            <ChevronRight
              key={idx}
              size={11}
              style={{
                display: "inline-block",
                verticalAlign: "middle",
                margin: "0 3px",
                color: "var(--color-cyan-400)",
                opacity: 0.85,
              }}
            />
          );
        }
        if (part.includes("Ctrl+") || part.includes("⌘")) {
          return (
            <kbd
              key={idx}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.68rem",
                padding: "1.5px 5px",
                borderRadius: "4px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#f1f5f9",
                boxShadow: "0 1px 3px rgba(0,0,0,0.4)",
                display: "inline-block",
                verticalAlign: "baseline",
                margin: "0 2px",
                fontWeight: 600,
              }}
            >
              {part.replace(/^\(/, "").replace(/\)$/, "")}
            </kbd>
          );
        }
        if (part.endsWith(".py")) {
          return (
            <code
              key={idx}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "var(--color-cyan-400)",
                background: "rgba(34, 211, 238, 0.1)",
                border: "1px solid rgba(34, 211, 238, 0.25)",
                borderRadius: "4px",
                padding: "1px 6px",
                fontWeight: 600,
              }}
            >
              {part}
            </code>
          );
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Icon Map                                                            */
/* ------------------------------------------------------------------ */

function StepIcon({ type, size = 13 }: { type?: RunGuideStep["icon"]; size?: number }) {
  const p = { size, strokeWidth: 2 };
  switch (type) {
    case "terminal": return <Terminal {...p} style={{ color: "var(--color-cyan-400)" }} />;
    case "package":  return <Package {...p} style={{ color: "var(--color-violet-500)" }} />;
    case "python":   return <Code2 {...p} style={{ color: "#38bdf8" }} />;
    case "check":    return <CheckCircle2 {...p} style={{ color: "var(--color-success)" }} />;
    case "warning":  return <AlertTriangle {...p} style={{ color: "var(--color-warning)" }} />;
    case "vscode":
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Inline Code Syntax Highlighter (§2.4)                               */
/* ------------------------------------------------------------------ */

function highlightInlineTokens(content: string) {
  const tokenRegex = /(".*?"|'.*?'|\b(?:python3?|pip3?|conda|import|print|install|show|-m|-c|--version)\b|--[a-z\-]+|-[a-z])/g;
  const parts = content.split(tokenRegex);

  return parts.map((tok, i) => {
    if (!tok) return null;
    if (/^(".*?"|'.*?')$/.test(tok)) {
      return <span key={i} style={{ color: "var(--color-cyan-400)" }}>{tok}</span>;
    }
    if (/^(python3?|pip3?|conda|import|print|install|show)$/.test(tok)) {
      return <span key={i} style={{ color: "var(--color-iris-500)", fontWeight: 600 }}>{tok}</span>;
    }
    if (/^(-[a-z]|--[a-z\-]+)$/.test(tok)) {
      return <span key={i} style={{ color: "#38bdf8" }}>{tok}</span>;
    }
    return <span key={i} style={{ color: "var(--color-text-secondary)" }}>{tok}</span>;
  });
}

function InlineCodeLine({ content, label }: { content: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = content;
      ta.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content]);

  return (
    <div style={{ marginTop: 6 }}>
      {label && (
        <span style={{
          fontSize: "0.6rem", fontWeight: 700,
          color: "var(--color-text-secondary)", textTransform: "uppercase",
          letterSpacing: "0.1em", display: "block", marginBottom: 2, opacity: 0.65,
        }}>
          {label}
        </span>
      )}
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        background: "rgba(5, 8, 22, 0.75)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "var(--radius-sm)",
        padding: "4px 6px 4px 8px",
      }}>
        <span style={{ color: "var(--color-iris-500)", opacity: 0.6, fontSize: "0.68rem", fontFamily: "var(--font-mono)", userSelect: "none" }}>$</span>
        <code style={{
          flex: 1, fontFamily: "var(--font-mono)", fontSize: "0.7rem",
          whiteSpace: "pre-wrap", wordBreak: "break-all", lineHeight: 1.45,
        }}>
          {highlightInlineTokens(content)}
        </code>
        <motion.button
          className="emboss-btn"
          onClick={handleCopy}
          aria-label="Copy snippet"
          style={{ padding: "3px 5px", cursor: "pointer", flexShrink: 0 }}
          whileTap={{ scale: 0.88 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span key="ck" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.1 }} style={{ display: "flex" }}>
                <Check size={10} style={{ color: "var(--color-success)" }} />
              </motion.span>
            ) : (
              <motion.span key="cp" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ duration: 0.1 }} style={{ display: "flex" }}>
                <Copy size={10} style={{ color: "var(--color-text-secondary)" }} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Three-State Badge Sub-Component (§2.2)                              */
/* ------------------------------------------------------------------ */

function StepBadgeNode({
  index, isActive, isCompleted, onClick,
}: {
  index: number; isActive: boolean; isCompleted: boolean; onClick?: () => void;
}) {
  const size = isActive ? BADGE_SIZE.active : isCompleted ? BADGE_SIZE.completed : BADGE_SIZE.upcoming;

  return (
    <motion.button
      onClick={onClick}
      aria-label={`Step ${index + 1}`}
      animate={{ scale: isActive ? 1.05 : 1 }}
      transition={{ duration: 0.15 }}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, cursor: onClick ? "pointer" : "default", padding: 0,
        background: isActive
          ? "rgba(109, 93, 254, 0.22)"
          : isCompleted
          ? "rgba(34, 197, 94, 0.15)"
          : "rgba(109, 93, 254, 0.06)",
        border: isActive
          ? "1.5px solid var(--color-iris-500)"
          : isCompleted
          ? "1px solid rgba(34, 197, 94, 0.4)"
          : "1px solid rgba(109, 93, 254, 0.18)",
        boxShadow: isActive ? "0 0 10px rgba(109, 93, 254, 0.35)" : "none",
        transition: "all 150ms ease",
      }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isCompleted ? (
          <motion.span
            key="check-icon"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <CheckCircle2 size={12} style={{ color: "var(--color-success)" }} />
          </motion.span>
        ) : (
          <motion.span
            key="num"
            style={{
              fontSize: "0.6rem",
              fontWeight: 700,
              color: isActive ? "var(--color-iris-500)" : "var(--color-text-secondary)",
              opacity: isActive ? 1 : 0.55,
            }}
          >
            {index + 1}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/*  Step row — expandable on click                                      */
/* ------------------------------------------------------------------ */

function GuideStep({
  step, index, total, isActive, isCompleted, isNextCompleted, onClick,
}: {
  step: RunGuideStep; index: number; total: number;
  isActive: boolean; isCompleted: boolean; isNextCompleted: boolean; onClick: () => void;
}) {
  const hasCode = step.code && step.code.length > 0;
  const isRailCompleted = isCompleted || isNextCompleted;

  return (
    <div style={{ display: "flex", gap: STEP_GAP }}>
      {/* Left rail: 3-state badge node + connector line */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: BADGE_SIZE.active }}>
        <StepBadgeNode index={index} isActive={isActive} isCompleted={isCompleted} onClick={onClick} />
        {index < total - 1 && (
          <div style={{
            width: RAIL_WIDTH, flex: 1, marginTop: 3, minHeight: 8,
            background: isRailCompleted
              ? "linear-gradient(to bottom, rgba(34, 197, 94, 0.4) 0%, rgba(34, 197, 94, 0.15) 100%)"
              : isActive
              ? "linear-gradient(to bottom, rgba(109, 93, 254, 0.4) 0%, rgba(109, 93, 254, 0.1) 100%)"
              : "rgba(109, 93, 254, 0.12)",
            transition: "background 150ms ease",
          }} />
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0, paddingBottom: index < total - 1 ? 10 : 0 }}>
        {/* Step header row — always visible, clickable */}
        <button
          onClick={onClick}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            marginBottom: isActive ? 6 : 0,
            background: "none", border: "none", padding: 0, cursor: "pointer",
            width: "100%", textAlign: "left", userSelect: "none",
          }}
        >
          <span style={{
            color: isActive ? "var(--color-iris-500)" : "var(--color-text-secondary)",
            display: "flex", alignItems: "center", transition: "color 150ms ease",
          }}>
            <StepIcon type={step.icon} size={12} />
          </span>
          <span style={{
            fontSize: "0.78rem", fontWeight: isActive ? 700 : 600,
            color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)",
            flex: 1, transition: "color 150ms ease",
          }}>
            {step.title}
          </span>
          <motion.span
            animate={{ rotate: isActive ? 180 : 0 }}
            transition={{ duration: 0.18 }}
            style={{ display: "flex", color: "var(--color-text-secondary)", opacity: 0.5 }}
          >
            <ChevronDown size={12} />
          </motion.span>
        </button>

        {/* Expandable body */}
        <AnimatePresence initial={false}>
          {isActive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              style={{ overflow: "hidden" }}
            >
              <p style={{
                fontSize: "0.73rem", color: "var(--color-text-secondary)",
                lineHeight: 1.65, margin: 0,
                marginBottom: hasCode ? 4 : 0,
              }}>
                <FormattedText text={step.description} />
              </p>
              {step.code?.map((c, i) => (
                <InlineCodeLine key={i} content={c.content} label={c.label} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Troubleshooting Section — Support Drawer (§2.5 & Option B)         */
/* ------------------------------------------------------------------ */

function TroubleshootingSection({ entries }: { entries: TroubleshootingEntry[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="troubleshooting-drawer" style={{ marginTop: 14 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", padding: "7px 10px",
          background: "none", border: "none", cursor: "pointer", textAlign: "left",
          borderBottom: open ? "1px solid rgba(245, 158, 11, 0.18)" : "none",
          userSelect: "none",
        }}
      >
        {/* Support drawer icon tile */}
        <div style={{
          width: 20, height: 20, borderRadius: "var(--radius-sm)",
          background: "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.08))",
          border: "1px solid rgba(245, 158, 11, 0.3)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
        }}>
          <AlertTriangle size={11} style={{ color: "var(--color-warning)" }} />
        </div>
        <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "var(--color-warning)", flex: 1 }}>
          Troubleshooting
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} style={{ display: "flex" }}>
          <ChevronDown size={11} style={{ color: "var(--color-warning)", opacity: 0.6 }} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
            transition={{ duration: 0.16 }} style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6 }}>
              {entries.map((entry, i) => (
                <div key={i} className="troubleshooting-entry-card">
                  <code style={{
                    fontFamily: "var(--font-mono)", fontSize: "0.66rem",
                    color: "var(--color-error)", display: "block",
                    marginBottom: 3, wordBreak: "break-word",
                  }}>
                    {entry.error}
                  </code>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                    <FormattedText text={entry.solution} />
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Expand Modal (§2.6)                                                 */
/* ------------------------------------------------------------------ */

function ExpandModal({ title, steps, troubleshooting, visitedSteps, onClose }: {
  title: string; steps: RunGuideStep[]; troubleshooting?: TroubleshootingEntry[];
  visitedSteps: Set<number>; onClose: () => void;
}) {
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(5, 8, 22, 0.85)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "5vh 5vw",
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 12 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="inset-panel"
        style={{ width: "min(80vw, 740px)", height: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        {/* Header (§2.1 / §2.6 - Branded glyph, no 3 dots) */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.2)", flexShrink: 0, position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="run-guide-header-glyph">
              <StepIcon type="vscode" size={12} />
            </div>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>
              {title}
            </span>
          </div>
          <motion.button className="emboss-btn" onClick={onClose} aria-label="Close" style={{ padding: "5px 7px", cursor: "pointer" }} whileTap={{ scale: 0.92 }}>
            <Minimize2 size={13} style={{ color: "var(--color-text-secondary)" }} />
          </motion.button>

          {/* Bottom border glow */}
          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, rgba(109,93,254,0.3) 0%, rgba(109,93,254,0.05) 50%, transparent 100%)" }} />
        </div>

        {/* Body with two-col layout: step list + step detail */}
        <div style={{ flex: 1, minHeight: 0, display: "flex", overflow: "hidden" }}>
          {/* Left: step list rail (§2.6 1:1 Parity with main rail) */}
          <div style={{
            width: 220, flexShrink: 0, borderRight: "1px solid var(--color-border-default)",
            overflowY: "auto", padding: "14px 12px", display: "flex", flexDirection: "column", gap: 4,
          }}>
            {steps.map((step, i) => {
              const isActive = activeStep === i;
              const isCompleted = visitedSteps.has(i) && !isActive;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStep(i)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", padding: "7px 10px", borderRadius: "var(--radius-md)",
                    background: isActive ? "rgba(109, 93, 254, 0.12)" : "transparent",
                    border: "none", cursor: "pointer", textAlign: "left", transition: "all 120ms ease",
                  }}
                >
                  <StepBadgeNode index={i} isActive={isActive} isCompleted={isCompleted} />
                  <span style={{ fontSize: "0.75rem", fontWeight: isActive ? 700 : 500, color: isActive ? "var(--color-text-primary)" : "var(--color-text-secondary)", lineHeight: 1.3 }}>
                    {step.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right: active step detail */}
          <div style={{ flex: 1, minWidth: 0, overflowY: "auto", padding: "20px 24px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <StepBadgeNode index={activeStep} isActive={true} isCompleted={false} />
                  <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {steps[activeStep].title}
                  </h3>
                </div>
                <p style={{ fontSize: "0.87rem", color: "var(--color-text-secondary)", lineHeight: 1.7, margin: "0 0 16px" }}>
                  <FormattedText text={steps[activeStep].description} />
                </p>
                {steps[activeStep].code?.map((c, ci) => (
                  <InlineCodeLine key={ci} content={c.content} label={c.label} />
                ))}
              </motion.div>
            </AnimatePresence>

            {troubleshooting && troubleshooting.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <TroubleshootingSection entries={troubleshooting} />
              </div>
            )}
          </div>
        </div>

        {/* Footer: prev/next navigation */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 16px", borderTop: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.15)", flexShrink: 0,
        }}>
          <button
            onClick={() => setActiveStep(s => Math.max(0, s - 1))}
            disabled={activeStep === 0}
            className="emboss-btn"
            style={{ padding: "5px 12px", cursor: activeStep === 0 ? "not-allowed" : "pointer", opacity: activeStep === 0 ? 0.35 : 1, fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}
          >
            ← Previous
          </button>
          <span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", opacity: 0.65, fontWeight: 600 }}>
            {activeStep + 1} / {steps.length}
          </span>
          <button
            onClick={() => setActiveStep(s => Math.min(steps.length - 1, s + 1))}
            disabled={activeStep === steps.length - 1}
            className="emboss-btn"
            style={{ padding: "5px 12px", cursor: activeStep === steps.length - 1 ? "not-allowed" : "pointer", opacity: activeStep === steps.length - 1 ? 0.35 : 1, fontSize: "0.75rem", fontWeight: 600, color: "var(--color-text-secondary)" }}
          >
            Next →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  RunGuidePanel — main export                                         */
/* ------------------------------------------------------------------ */

export function RunGuidePanel({
  title = "How to Run in VS Code",
  steps,
  troubleshooting,
}: RunGuideProps) {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [visitedSteps, setVisitedSteps] = useState<Set<number>>(new Set([0]));
  const [expanded, setExpanded] = useState(false);

  const toggle = (i: number) => {
    setActiveStep(prev => prev === i ? -1 : i);
    setVisitedSteps(prev => new Set(prev).add(i));
  };

  return (
    <>
      <div
        className="inset-panel"
        style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, overflow: "hidden" }}
        aria-label={title}
      >
        {/* ── Header ─────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px",
          borderBottom: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.2)", flexShrink: 0, position: "relative",
        }}>
          {/* Left: Branded Icon Glyph + Title */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="run-guide-header-glyph">
              <StepIcon type="vscode" size={12} />
            </div>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, letterSpacing: "-0.01em", color: "var(--color-text-primary)" }}>
              {title}
            </span>
          </div>

          {/* Right: Step progress pill + Maximize button */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Step progress pill (§2.1 / §3 animated number change) */}
            <span style={{
              fontSize: "0.6rem", fontWeight: 700,
              color: "var(--color-iris-500)",
              background: "rgba(109, 93, 254, 0.12)",
              border: "1.5px solid rgba(109, 93, 254, 0.4)",
              borderRadius: 999,
              padding: "1px 7px",
              letterSpacing: "0.04em",
            }}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={activeStep}
                  initial={{ opacity: 0.5, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0.5, scale: 0.94 }}
                  transition={{ duration: 0.12 }}
                  style={{ display: "inline-block" }}
                >
                  {Math.max(0, activeStep) + 1}/{steps.length}
                </motion.span>
              </AnimatePresence>
            </span>

            <motion.button
              className="emboss-btn"
              onClick={() => setExpanded(true)}
              aria-label="Expand guide to fullscreen"
              style={{ padding: "4px 6px", cursor: "pointer" }}
              whileTap={{ scale: 0.92 }}
            >
              <Maximize2 size={12} style={{ color: "var(--color-text-secondary)" }} />
            </motion.button>
          </div>

          {/* Bottom border glow (§2.1) */}
          <div style={{ position: "absolute", bottom: -1, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, rgba(109,93,254,0.3) 0%, rgba(109,93,254,0.05) 50%, transparent 100%)" }} />
        </div>

        {/* ── Scrollable step list ────────────────────────────── */}
        <div className="run-guide-scroll-body">
          {steps.map((step, i) => (
            <GuideStep
              key={step.id}
              step={step}
              index={i}
              total={steps.length}
              isActive={activeStep === i}
              isCompleted={visitedSteps.has(i) && activeStep !== i}
              isNextCompleted={visitedSteps.has(i + 1)}
              onClick={() => toggle(i)}
            />
          ))}
          {troubleshooting && troubleshooting.length > 0 && (
            <TroubleshootingSection entries={troubleshooting} />
          )}
        </div>

        {/* ── Card Footer: Next & Previous Controls ───────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 14px",
          borderTop: "1px solid var(--color-border-default)",
          background: "rgba(0,0,0,0.25)", flexShrink: 0,
        }}>
          <motion.button
            className="emboss-btn"
            onClick={() => {
              if (activeStep > 0) {
                const nextIdx = activeStep - 1;
                setActiveStep(nextIdx);
                setVisitedSteps(prev => new Set(prev).add(nextIdx));
              }
            }}
            disabled={activeStep <= 0}
            aria-label="Previous step"
            style={{
              padding: "4px 10px",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: activeStep <= 0 ? "var(--color-text-secondary)" : "var(--color-text-primary)",
              opacity: activeStep <= 0 ? 0.35 : 1,
              cursor: activeStep <= 0 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
            }}
            whileTap={activeStep > 0 ? { scale: 0.94 } : undefined}
          >
            <ChevronLeft size={13} /> Previous
          </motion.button>

          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "var(--color-text-secondary)", opacity: 0.7 }}>
            Step {activeStep >= 0 ? activeStep + 1 : 1} of {steps.length}
          </span>

          <motion.button
            className="emboss-btn"
            onClick={() => {
              const nextIdx = activeStep < 0 ? 0 : activeStep + 1;
              if (nextIdx < steps.length) {
                setActiveStep(nextIdx);
                setVisitedSteps(prev => new Set(prev).add(nextIdx));
              }
            }}
            disabled={activeStep >= steps.length - 1}
            aria-label="Next step"
            style={{
              padding: "4px 10px",
              fontSize: "0.7rem",
              fontWeight: 600,
              color: activeStep >= steps.length - 1 ? "var(--color-text-secondary)" : "var(--color-text-primary)",
              opacity: activeStep >= steps.length - 1 ? 0.35 : 1,
              cursor: activeStep >= steps.length - 1 ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 4,
              background: activeStep < steps.length - 1 ? "rgba(109, 93, 254, 0.14)" : undefined,
              borderColor: activeStep < steps.length - 1 ? "rgba(109, 93, 254, 0.35)" : undefined,
            }}
            whileTap={activeStep < steps.length - 1 ? { scale: 0.94 } : undefined}
          >
            Next <ChevronRight size={13} />
          </motion.button>
        </div>
      </div>

      {/* ── Expand modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {expanded && (
          <ExpandModal
            title={title}
            steps={steps}
            troubleshooting={troubleshooting}
            visitedSteps={visitedSteps}
            onClose={() => setExpanded(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
