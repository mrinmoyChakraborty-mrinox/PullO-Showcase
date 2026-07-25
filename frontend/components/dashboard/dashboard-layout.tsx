import React from 'react'
import { StatusBadge } from './status-badge'
import { ProviderCard } from './provider-card'
import { Activity, Users, Clock, Wifi } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DashboardMetricsData {
  latency?: string | number
  served?: string | number
  uptime?: string | number
  connectedModel?: string
  connectedProvider?: string
  wsConnected?: boolean
}

export interface ProviderItemState {
  name: string
  status: 'online' | 'offline' | 'connected' | 'disconnected'
  modelCount: number
  latency?: string | number | null
  selectedModel?: string
  availableModels?: string[]
  isConnected?: boolean
  isLoading?: boolean
}

export interface DashboardLayoutProps {
  metrics?: DashboardMetricsData
  providers?: ProviderItemState[]
  onConnectProvider?: (providerName: string) => void
  onSelectModel?: (providerName: string, model: string) => void
  className?: string
}

/** Reformat long uptime strings like "1245m 34s" or raw seconds to fixed-width "20h 45m" or "1d 20h" */
export function formatCompactUptime(uptimeStr?: string | number): string {
  if (uptimeStr == null || uptimeStr === '') return '0s'
  if (typeof uptimeStr === 'number') {
    const hours = Math.floor(uptimeStr / 3600)
    const mins = Math.floor((uptimeStr % 3600) / 60)
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      const remHours = hours % 24
      return `${days}d ${remHours}h`
    }
    if (hours > 0) return `${hours}h ${mins}m`
    return `${mins}m ${uptimeStr % 60}s`
  }

  const str = String(uptimeStr)
  // Check if matches "1245m 34s"
  const mMatch = str.match(/(\d+)m/)
  if (mMatch) {
    const totalMins = parseInt(mMatch[1], 10)
    const hours = Math.floor(totalMins / 60)
    const mins = totalMins % 60
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      const remHours = hours % 24
      return `${days}d ${remHours}h`
    }
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
  }
  return str
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  metrics = {
    latency: '43ms',
    served: 0,
    uptime: '1245m 34s',
    connectedModel: 'qwen/qwen3-1.7b',
    connectedProvider: 'LM Studio',
    wsConnected: true,
  },
  providers = [
    {
      name: 'Ollama',
      status: 'offline',
      modelCount: 0,
      latency: null,
      selectedModel: '',
      availableModels: [],
      isConnected: false,
    },
    {
      name: 'LM Studio',
      status: 'online',
      modelCount: 2,
      latency: '12ms',
      selectedModel: 'qwen/qwen3-1.7b',
      availableModels: ['qwen/qwen3-1.7b', 'llama-3.2-3b', 'mistral-7b'],
      isConnected: true,
    },
  ],
  onConnectProvider,
  onSelectModel,
  className,
}) => {
  const compactUptime = formatCompactUptime(metrics.uptime)

  return (
    <div
      className={cn(
        'w-full max-w-5xl mx-auto p-6 space-y-8 bg-[#0A0A0F] text-zinc-100 min-h-screen rounded-3xl border border-white/[0.06] shadow-2xl font-sans',
        className
      )}
    >
      {/* 1. Header & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-[#0F111E]/90 border border-white/[0.08] backdrop-blur-xl shadow-lg">
        {/* Model info title & subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-mono">
              {metrics.connectedModel || 'No Model Selected'}
            </h1>
          </div>
          <p className="text-xs font-medium text-zinc-400">
            {metrics.connectedProvider
              ? `Connected (${metrics.connectedProvider})`
              : 'Standby / Disconnected'}
          </p>
        </div>

        {/* Status Pill Badge with Divider separation */}
        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="hidden sm:block w-px h-8 bg-white/10" />
          <StatusBadge
            variant={metrics.wsConnected ? 'websocket' : 'disconnected'}
            label={metrics.wsConnected ? 'CONNECTED' : 'DISCONNECTED'}
          />
        </div>
      </div>

      {/* 2. Stat Cards Row (Latency / Served / Uptime) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Latency Stat Card */}
        <div className="group flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-[#101221]/70 border border-white/[0.08] hover:border-cyan-500/30 hover:bg-[#121528] transition-all duration-300 shadow-sm hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4" />
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
            {metrics.latency != null ? (typeof metrics.latency === 'number' ? `${metrics.latency}ms` : metrics.latency) : '--'}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-2">
            Latency
          </span>
        </div>

        {/* Served Stat Card */}
        <div className="group flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-[#101221]/70 border border-white/[0.08] hover:border-indigo-500/30 hover:bg-[#121528] transition-all duration-300 shadow-sm hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono">
            {metrics.served ?? 0}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-2">
            Served
          </span>
        </div>

        {/* Uptime Stat Card */}
        <div className="group flex flex-col items-center justify-center text-center p-5 rounded-2xl bg-[#101221]/70 border border-white/[0.08] hover:border-amber-500/30 hover:bg-[#121528] transition-all duration-300 shadow-sm hover:-translate-y-0.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Clock className="w-4 h-4" />
          </div>
          <span className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-mono truncate max-w-full">
            {compactUptime}
          </span>
          <span className="text-[10px] font-bold tracking-widest text-zinc-400 uppercase mt-2">
            Uptime
          </span>
        </div>
      </div>

      {/* 3. Section Label ("LOCAL PROVIDERS") */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2.5 my-6">
          <div className="w-1 h-4 bg-indigo-500 rounded-full" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400">
            Local Providers
          </h2>
        </div>

        {/* Local Providers Grid (Symmetrical Twins) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {providers.map((p) => (
            <ProviderCard
              key={p.name}
              name={p.name}
              status={p.status}
              modelCount={p.modelCount}
              latency={p.latency}
              selectedModel={p.selectedModel}
              availableModels={p.availableModels}
              isConnected={p.isConnected}
              isLoading={p.isLoading}
              onConnect={() => onConnectProvider?.(p.name)}
              onModelSelect={(model) => onSelectModel?.(p.name, model)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
