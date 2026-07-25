import React from 'react'
import { cn } from '@/lib/utils'

export type StatusBadgeVariant = 'online' | 'offline' | 'connected' | 'disconnected' | 'websocket' | 'standby'

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant | string
  label?: string
  pulse?: boolean
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = 'offline',
  label,
  pulse = true,
  className,
}) => {
  const isOnline = variant === 'online' || variant === 'connected' || variant === 'websocket'
  const isOffline = variant === 'offline' || variant === 'disconnected'

  const textLabel =
    label ??
    (variant === 'websocket'
      ? 'CONNECTED'
      : variant === 'connected'
      ? 'Connected'
      : variant === 'online'
      ? 'Online'
      : variant === 'standby'
      ? 'Standby'
      : 'Offline')

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase border transition-colors select-none',
        isOnline && 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        isOffline && 'bg-zinc-800/60 border-white/10 text-zinc-400',
        variant === 'standby' && 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        className
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full flex-shrink-0',
          isOnline && 'bg-emerald-400',
          isOnline && pulse && 'animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]',
          isOffline && 'bg-zinc-500',
          variant === 'standby' && 'bg-amber-400'
        )}
      />
      <span>{textLabel}</span>
    </div>
  )
}
