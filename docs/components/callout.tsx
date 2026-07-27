import { type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react";

type CalloutVariant = "info" | "success" | "warning" | "caution";

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: ReactNode;
}

const config: Record<
  CalloutVariant,
  { icon: ReactNode; borderColor: string; bgColor: string; titleColor: string }
> = {
  info: {
    icon: <Info size={16} />,
    borderColor: "var(--color-iris-500)",
    bgColor: "rgba(45, 212, 200, 0.07)",
    titleColor: "var(--color-iris-500)",
  },
  success: {
    icon: <CheckCircle2 size={16} />,
    borderColor: "var(--color-success)",
    bgColor: "rgba(34, 197, 94, 0.07)",
    titleColor: "var(--color-success)",
  },
  warning: {
    icon: <AlertTriangle size={16} />,
    borderColor: "var(--color-warning)",
    bgColor: "rgba(245, 158, 11, 0.07)",
    titleColor: "var(--color-warning)",
  },
  caution: {
    icon: <AlertCircle size={16} />,
    borderColor: "var(--color-error)",
    bgColor: "rgba(239, 68, 68, 0.07)",
    titleColor: "var(--color-error)",
  },
};

export function Callout({ variant = "info", title, children }: CalloutProps) {
  const { icon, borderColor, bgColor, titleColor } = config[variant];

  return (
    <div
      role="note"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        background: bgColor,
        borderRadius: "0 var(--radius-md) var(--radius-md) 0",
        padding: "14px 18px",
        margin: "20px 0",
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
      }}
    >
      <span
        style={{
          color: titleColor,
          marginTop: "2px",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <div>
        {title && (
          <p
            style={{
              margin: "0 0 4px",
              fontWeight: 600,
              fontSize: "0.875rem",
              color: titleColor,
            }}
          >
            {title}
          </p>
        )}
        <div style={{ color: "var(--color-text-secondary)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
