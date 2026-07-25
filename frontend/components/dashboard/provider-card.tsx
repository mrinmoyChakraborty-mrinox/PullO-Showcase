import React from 'react'
import { StatusBadge } from './status-badge'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, Zap, Server } from 'lucide-react'

export interface ProviderCardProps {
  name: string
  status: 'online' | 'offline' | 'connected' | 'disconnected'
  modelCount: number
  latency?: string | number | null
  selectedModel?: string
  availableModels?: string[]
  onConnect?: () => void
  onModelSelect?: (model: string) => void
  isConnected?: boolean
  isLoading?: boolean
  className?: string
}

export const ProviderCard: React.FC<ProviderCardProps> = ({
  name,
  status,
  modelCount,
  latency,
  selectedModel,
  availableModels = [],
  onConnect,
  onModelSelect,
  isConnected = false,
  isLoading = false,
  className,
}) => {
  const isOnline = status === 'online' || status === 'connected' || isConnected
  const [isOpen, setIsOpen] = React.useState(false)

  // Format latency string safely
  const formattedLatency =
    latency != null && latency !== ''
      ? typeof latency === 'number'
        ? `${latency}ms`
        : latency.toString().endsWith('ms') || latency.toString().endsWith('s')
        ? latency
        : `${latency}ms`
      : null

  return (
    <div
      className={cn(
        'group relative flex flex-col justify-between h-[280px] p-5 rounded-2xl border bg-[#0D0F1A]/80 backdrop-blur-xl transition-all duration-300',
        isOnline
          ? 'border-white/[0.12] hover:border-indigo-500/30 hover:shadow-[0_8px_30px_rgba(124,111,240,0.08)]'
          : 'border-white/[0.06] hover:border-white/[0.1] opacity-85',
        className
      )}
    >
      {/* Top Header Row (Identity Row) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center border transition-colors',
                isOnline
                  ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  : 'bg-zinc-800/40 border-white/5 text-zinc-500'
              )}
            >
              <Server className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white tracking-tight">{name}</span>
              <span
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  isOnline
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'bg-zinc-600'
                )}
                title={isOnline ? `${name} is Online` : `${name} is Offline`}
              />
            </div>
          </div>

          <StatusBadge variant={isOnline ? 'online' : 'offline'} />
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className={cn('font-medium', isOnline ? 'text-zinc-300' : 'text-zinc-500')}>
            {modelCount} {modelCount === 1 ? 'model' : 'models'}
          </span>
          {isOnline && formattedLatency ? (
            <span className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <Zap className="w-3 h-3" />
              {formattedLatency}
            </span>
          ) : (
            <span className="font-mono text-[11px] text-zinc-600">--</span>
          )}
        </div>
      </div>

      {/* Internal Header Divider & Active Model Section */}
      <div className="space-y-2 pt-3 border-t border-white/[0.06]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-widest uppercase text-zinc-400/90">
            Active Model
          </span>
          {isConnected && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 tracking-wider">
              Live
            </span>
          )}
        </div>

        {/* Custom Select / Dropdown Trigger Box */}
        <div className="relative">
          <button
            type="button"
            disabled={!isOnline || availableModels.length === 0}
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              'w-full h-10 px-3.5 rounded-xl border flex items-center justify-between font-mono text-xs transition-all duration-200 outline-none',
              isOnline
                ? 'bg-black/40 border-white/10 text-zinc-200 hover:border-white/20 hover:bg-black/60 focus:border-indigo-500/50'
                : 'bg-black/20 border-white/[0.05] text-zinc-600 cursor-not-allowed'
            )}
          >
            <span className="truncate pr-2">
              {selectedModel ? selectedModel : isOnline ? 'Select a model' : 'No model available'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-zinc-400 transition-transform duration-200 flex-shrink-0',
                isOpen && 'transform rotate-180',
                !isOnline && 'text-zinc-600'
              )}
            />
          </button>

          {/* Dropdown Menu Popup */}
          {isOpen && isOnline && availableModels.length > 0 && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 right-0 top-12 z-50 p-1.5 rounded-xl border border-white/10 bg-[#121422] shadow-2xl backdrop-blur-2xl max-h-48 overflow-y-auto space-y-0.5">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      onModelSelect?.(m)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'w-full text-left px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-between transition-colors',
                      m === selectedModel
                        ? 'bg-indigo-500/15 text-indigo-300 font-semibold'
                        : 'text-zinc-300 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <span className="truncate">{m}</span>
                    {m === selectedModel && <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Action Button Row (Pinned to bottom) */}
      <div className="pt-3">
        <button
          type="button"
          disabled={isLoading || !isOnline}
          onClick={onConnect}
          className={cn(
            'w-full h-10 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-2 shadow-sm',
            isConnected
              ? 'bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/80 shadow-[0_0_15px_rgba(124,111,240,0.15)]'
              : isOnline
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_4px_12px_rgba(124,111,240,0.25)] active:scale-[0.98]'
              : 'bg-zinc-800/40 border border-white/5 text-zinc-500 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Connecting...
            </span>
          ) : isConnected ? (
            'Connected'
          ) : isOnline ? (
            'Connect'
          ) : (
            'Offline'
          )}
        </button>
      </div>
    </div>
  )
}
