"use client";

import { type ReactNode } from "react";
import { RunGuidePanel, type RunGuideProps } from "./run-guide-panel";

interface CodeWithRunGuideProps {
  /** MDX code block rendered as children — MDX processes fenced blocks into children naturally */
  children: ReactNode;
  /** RunGuide configuration data */
  guide: RunGuideProps;
}

/**
 * Lays a code block (children) and a RunGuidePanel side-by-side in a size-locked grid.
 * Both columns are capped to the same fixed height via .code-run-guide-grid.
 * The guide panel scrolls internally; neither column can push the row taller.
 *
 * Usage in MDX:
 *   <CodeWithRunGuide guide={myGuideData}>
 *   ```python
 *   ... code ...
 *   ```
 *   </CodeWithRunGuide>
 *
 * Generic by design: pass any language + steps to reuse for cURL, JS, PowerShell, etc.
 */
export function CodeWithRunGuide({ children, guide }: CodeWithRunGuideProps) {
  return (
    <div className="code-run-guide-grid">
      <div className="code-run-guide-cell">
        {children}
      </div>
      <div className="code-run-guide-cell">
        <RunGuidePanel {...guide} />
      </div>
    </div>
  );
}
