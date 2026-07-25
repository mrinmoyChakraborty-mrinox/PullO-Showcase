import { type ReactNode } from "react";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import { Toc, MobileToc } from "./toc";

interface DocsShellProps {
  children: ReactNode;
}

export function DocsShell({ children }: DocsShellProps) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--color-bg-surface)" }}>
      <Topbar />

      {/* Body below topbar */}
      <div
        style={{
          display: "flex",
          paddingTop: "var(--topbar-height)",
          minHeight: "100dvh",
        }}
      >
        {/* Left sidebar — desktop only */}
        <div
          className="docs-sidebar"
          style={{ display: "flex" }}
        >
          <Sidebar />
        </div>

        {/* Main content + right TOC */}
        <div style={{ flex: 1, display: "flex", minWidth: 0 }}>
          {/* Page content */}
          <main
            id="main-content"
            tabIndex={-1}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "48px 32px 80px",
              overflow: "hidden",
            }}
          >
            {/* Mobile TOC — shown above content on narrow viewports */}
            <div className="mobile-toc">
              <MobileToc />
            </div>

            <article className="prose-docs">{children}</article>
          </main>

          {/* Right TOC rail — desktop ≥ 1280px */}
          <div
            className="docs-toc-rail"
            style={{
              width: "var(--toc-width)",
              flexShrink: 0,
              padding: "48px 24px 48px 0",
              display: "flex",
            }}
          >
            <Toc />
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          .docs-sidebar { display: none !important; }
        }
        @media (min-width: 1024px) {
          .mobile-toc { display: none !important; }
        }
        @media (max-width: 1279px) {
          .docs-toc-rail { display: none !important; }
        }
        @media (min-width: 1280px) {
          .mobile-toc { display: none !important; }
        }
      `}</style>
    </div>
  );
}
