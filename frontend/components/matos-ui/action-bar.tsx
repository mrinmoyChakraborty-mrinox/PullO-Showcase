"use client"

import { forwardRef, type ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface ActionBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  subject: string
  placement?: "bottomCenter" | "bottomRight" | "bottomLeft"
  tone?: "default" | "destructive"
  size?: "sm" | "md"
  icon?: ReactNode
  confirmLabel?: string
  confirmLabelLoading?: string
  cancelLabel?: string
  actions: {
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
  }
}

const ActionBar = forwardRef<HTMLDivElement, ActionBarProps>(
  (
    {
      subject,
      placement = "bottomCenter",
      tone = "default",
      size = "md",
      icon,
      confirmLabel = "Confirm",
      confirmLabelLoading = "Deleting...",
      cancelLabel = "Cancel",
      actions,
      className,
      ...props
    },
    ref
  ) => {
    const isDestructive = tone === "destructive"

    const placementStyles: Record<string, string> = {
      bottomCenter: "left-1/2 -translate-x-1/2",
      bottomRight: "right-6",
      bottomLeft: "left-6",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "fixed bottom-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3 shadow-2xl backdrop-blur-xl transition-all",
          isDestructive
            ? "border-red-500/30 bg-red-950/40"
            : "border-zinc-800 bg-zinc-950/60",
          size === "sm" ? "gap-2 px-4 py-2.5 text-sm" : "gap-3 px-5 py-3 text-base",
          placementStyles[placement],
          className
        )}
        {...props}
      >
        {icon && (
          <span className={cn("flex shrink-0", isDestructive ? "text-red-400" : "text-muted-foreground")}>
            {icon}
          </span>
        )}

        <span className={cn("font-medium", isDestructive ? "text-red-200" : "text-foreground")}>
          {subject}
        </span>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size={size === "sm" ? "sm" : "default"}
            onClick={actions.onCancel}
            disabled={actions.isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? "destructive" : "default"}
            size={size === "sm" ? "sm" : "default"}
            onClick={actions.onConfirm}
            disabled={actions.isLoading}
          >
            {actions.isLoading ? confirmLabelLoading : confirmLabel}
          </Button>
        </div>
      </div>
    )
  }
)

ActionBar.displayName = "ActionBar"

export { ActionBar }
