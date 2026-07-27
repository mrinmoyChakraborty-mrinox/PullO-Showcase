'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listApiKeys, createKey, revokeKey, revealKey, listModels, listWsMCP, listCorsairPlugins, listCustomTools, type ApiKey, type Model, type CreatedKeyResult, type MCPServer, type CorsairPlugin, type CustomTool } from '@/lib/api'
import { track } from '@/lib/metrics'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'

function maskKey(prefix: string | undefined): string {
  if (!prefix || prefix.length < 4) return prefix ?? '……'
  return prefix.slice(0, 2) + '•'.repeat(16) + prefix.slice(-4)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  if (!text) return false
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (e) {
    console.warn('navigator.clipboard.writeText failed, using fallback execCommand', e)
  }

  try {
    if (typeof document === 'undefined') return false
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.top = '-9999px'
    textArea.style.left = '-9999px'
    textArea.style.opacity = '0'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    return successful
  } catch (err) {
    console.error('Fallback execCommand copy failed', err)
    return false
  }
}

function SkeletonRows() {
  return (
    <div className="divide-y divide-white/[0.06]">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 px-6 py-4">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="size-7 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export default function ApiKeysPage() {
  const SHOW_CORSAIR_INTEGRATIONS = false
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const { activeWsId, setActiveWsId, workspaces, myRole } = useWorkspace()
  const canManage = myRole === 'owner' || myRole === 'admin'
  const [modalOpen, setModalOpen] = useState(false)
  const [revealedId, setRevealedId] = useState<string | null>(null)
  const [keyName, setKeyName] = useState('')
  const [keyExpiry, setKeyExpiry] = useState('never')
  const [keyBudget, setKeyBudget] = useState('')
  const [keyRpm, setKeyRpm] = useState('')
  const [keyTools, setKeyTools] = useState<Record<string, boolean>>({})
const [showCustomTools, setShowCustomTools] = useState(false)
const [customTools, setCustomTools_] = useState<CustomTool[]>([])
  const [creating, setCreating] = useState(false)
  const [createdKey, setCreatedKey] = useState<CreatedKeyResult | null>(null)
  const [keyCopied, setKeyCopied] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<string | null>(null)
  const [revoking, setRevoking] = useState(false)
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [mcps, setMcps] = useState<MCPServer[]>([])
  const [corsairPlugins, setCorsairPlugins] = useState<CorsairPlugin[]>([])
  const [selectedCorsairPlugins, setSelectedCorsairPlugins] = useState<string[]>([])
  const [selectedMcpIds, setSelectedMcpIds] = useState<string[]>([])
  const [modelSearchQuery, setModelSearchQuery] = useState('')
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false)
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([])
  const [modelValidation, setModelValidation] = useState(false)
  const modelSearchRef = useRef<HTMLDivElement>(null)
  const copyNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [copyNotice, setCopyNotice] = useState<string | null>(null)
  const [openKeyModels, setOpenKeyModels] = useState<string | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!activeWsId) return
    listModels(activeWsId).then(setModels).catch(() => {})
    listWsMCP(activeWsId).then(r => setMcps(r.servers)).catch(() => {})
    listCorsairPlugins(activeWsId).then(setCorsairPlugins).catch(() => {})
    listCustomTools(activeWsId).then(setCustomTools_).catch(() => {})
  }, [activeWsId])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modelSearchRef.current && !modelSearchRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false)
        setModelSearchQuery('')
      }
      setOpenKeyModels(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!modalOpen) return
    setSelectedModelIds([])
    setSelectedCorsairPlugins([])
    setSelectedMcpIds([])
    setModelSearchQuery('')
    setModelValidation(false)
  }, [modalOpen])

  const {
    data: keys,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['api-keys', activeWsId],
    queryFn: () => listApiKeys(activeWsId!),
    enabled: !!activeWsId,
  })

  const handleReveal = useCallback(
    (id: string) => {
      setRevealedId((prev) => (prev === id ? null : id))
      setTimeout(() => setRevealedId((cur) => (cur === id ? null : cur)), 10000)
    },
    [],
  )

  const activeWorkspace = workspaces.find((w) => w.id === activeWsId)

  return (
    <div className="px-7 py-7 pb-15 relative min-h-screen">
      {/* Background Artwork */}
      <div className="absolute inset-0 pointer-events-none mix-blend-screen" style={{
        zIndex: 0, opacity: 0.28,
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'right center',
        backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />

      {/* Copy notice toast */}
      {copyNotice && (
        <div className="fixed top-4 right-4 z-[200] animate-in fade-in slide-in-from-top-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            {copyNotice}
          </div>
        </div>
      )}

      {/* Workspace selector + Create button row */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-violet-600 to-indigo-600 text-[10px] font-bold text-white">
              {(activeWorkspace?.name ?? 'W').charAt(0).toUpperCase()}
            </div>
            <select
              value={activeWsId ?? ''}
              onChange={(e) => setActiveWsId(e.target.value || null)}
              className="bg-transparent text-sm font-semibold text-white/90 outline-none cursor-pointer"
            >
              {workspaces.map((ws) => (
                <option key={ws.id} value={ws.id} className="bg-[#0F1420]">{ws.name}</option>
              ))}
            </select>
          </div>
        </div>
        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-teal-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            Create New Key
          </button>
        )}
      </div>

      {/* Security banner */}
      <div className="mb-6 flex items-start gap-3.5 rounded-xl border border-teal-500/20 bg-teal-500/[0.07] p-4 border-l-[3px] border-l-teal-500">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-teal-500/25 bg-teal-500/12">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#14B8A6" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <div className="mb-0.5 text-sm font-bold text-white">Key Security &amp; Hashing</div>
          <p className="max-w-[760px] text-xs leading-relaxed text-white/50">
            For your security, we only show your full API keys immediately after they are created. We do not store the full plaintext keys on our infrastructure — instead, we store a cryptographically secure hash. If you lose a key, revoke it and generate a new one.
          </p>
        </div>
      </div>

      {/* Keys table card */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] backdrop-blur-2xl" style={{ background: 'var(--glass)' }}>
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white/30" strokeWidth="2">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            <h2 className="text-sm font-bold tracking-tight text-white">Your Keys</h2>
            {!isLoading && !isError && keys && (
              <span className="inline-flex items-center rounded-full border border-teal-500/25 bg-teal-500/12 px-2 py-0.5 text-[11px] font-semibold text-teal-400">
                {keys.length} {keys.length === 1 ? 'Key' : 'Keys'}
              </span>
            )}
          </div>
        </div>

        {isLoading && <SkeletonRows />}

        {isError && (
          <ErrorState
            title="Failed to load API keys"
            message={error?.message ?? 'An unexpected error occurred.'}
            onRetry={() => refetch()}
          />
        )}

        {!isLoading && !isError && keys && keys.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-5 flex size-16 items-center justify-center rounded-xl border border-teal-500/25 bg-teal-500/10">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2dd4c8" strokeWidth="1.8">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h3 className="mb-1.5 text-base font-bold tracking-tight text-white">No API keys yet</h3>
            <p className="mb-6 max-w-xs text-sm text-white/50">Create your first key to start using PullO</p>
            {canManage && (
              <button
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-teal-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Create your first key
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && keys && keys.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/25">
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Name</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Key</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Tools</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Requests</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Expires</th>
                  <th className="px-6 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase text-white/30">Status</th>
                  <th className="px-6 py-2.5 text-right text-[10px] font-semibold tracking-wider uppercase text-white/30">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {keys.map((key) => {
                  const expired = isExpired(key.expires_at)
                  const isRevealed = revealedId === key.id
                  return (
                    <tr key={key.id} className="group transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div className="truncate text-sm font-semibold text-white max-w-[180px]">{key.label || 'Untitled Key'}</div>
                        <div className="text-[11px] text-white/30 font-mono">{key.prefix ? key.prefix.slice(0, 6) + '…' : ''}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[13px] text-white/70">{isRevealed ? (key.prefix ?? '……') : maskKey(key.prefix)}</span>
                          {canManage && (
                            <button
                              onClick={() => handleReveal(key.id)}
                              className="flex size-6 items-center justify-center rounded text-white/30 transition-all hover:bg-white/[0.06] hover:text-white/80"
                              title={isRevealed ? 'Hide' : 'Reveal'}
                            >
                              {isRevealed
                                ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                              }
                            </button>
                          )}

                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          {key.allowed_tools && key.allowed_tools.length > 0 ? (
                            <>
                              {key.allowed_tools.slice(0, 3).map((tool) => (
                                <span key={tool} className="inline-flex items-center rounded-md border border-white/[0.06] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-white/50">{tool}</span>
                              ))}
                              {key.allowed_tools.length > 3 && <span className="text-[10px] text-white/30">+{key.allowed_tools.length - 3}</span>}
                            </>
                          ) : (
                            <span className="text-xs text-white/30">All</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-white/60">{key.requests != null ? key.requests.toLocaleString() : '—'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${expired ? 'text-red-400' : 'text-white/60'}`}>
                          {key.expires_at ? formatDate(key.expires_at) : 'Never'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          expired
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          <span className={`size-1.5 rounded-full ${expired ? 'bg-red-400' : 'bg-emerald-400'}`} />
                          {expired ? 'Expired' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {key.allowed_model_ids && key.allowed_model_ids.length > 0 && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenKeyModels((prev) => (prev === key.id ? null : key.id))}
                                className="flex size-7 items-center justify-center rounded-md text-white/30 transition-all hover:bg-white/[0.06] hover:text-white/80"
                                title="View assigned models"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                              </button>
                              {openKeyModels === key.id && (
                                <div className="absolute right-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-white/[0.08] bg-[#0F1420] p-2 shadow-2xl backdrop-blur-xl">
                                  <div className="mb-1 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/30">Assigned Models</div>
                                  {key.allowed_model_ids.map((mid) => {
                                    const m = models.find((mod) => mod.id === mid)
                                    return <div key={mid} className="rounded-md px-2 py-1.5 text-[12px] text-white/70 hover:bg-white/[0.04]">{m?.name ?? mid.slice(0, 8)}</div>
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                          {!key.revealed && (
                            <button
                              onClick={async () => {
                                if (!activeWsId) return
                                try {
                                  const fullKey = await revealKey(activeWsId, key.id)
                                  setCreatedKey({
                                    key: fullKey,
                                    id: key.id,
                                    label: key.label || 'Untitled Key',
                                    expires_at: key.expires_at || null,
                                    message: 'Copy this key now. It will not be shown again.',
                                  })
                                  setKeyCopied(false)
                                  queryClient.invalidateQueries({ queryKey: ['api-keys'] })
                                } catch (e: any) {
                                  const msg = e?.message || 'Failed to reveal key'
                                  setCopyNotice(msg)
                                  if (copyNoticeTimeout.current) clearTimeout(copyNoticeTimeout.current)
                                  copyNoticeTimeout.current = setTimeout(() => setCopyNotice(null), 4000)
                                }
                              }}
                              className="flex size-7 items-center justify-center rounded-md text-white/30 transition-all hover:bg-emerald-500/10 hover:text-emerald-400"
                              title="Reveal key (one-time)"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                            </button>
                          )}
                          {canManage && (
                            <button
                              onClick={() => setRevokeTarget(key.id)}
                              className="flex size-7 items-center justify-center rounded-md text-white/30 transition-all hover:bg-red-500/10 hover:text-red-400"
                              title="Revoke key"
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CREATE KEY MODAL ── */}
      {mounted && modalOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!creating) setModalOpen(false) }} />
          <div className="relative z-10 mx-4 w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0F1420] shadow-2xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-7 py-5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 shadow-lg">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
                </div>
                <div>
                  <h2 className="text-[15px] font-bold text-white">Create API Key</h2>
                  <p className="text-xs text-white/40">Configure access for your new key</p>
                </div>
              </div>
              <button className="flex size-8 items-center justify-center rounded-lg text-white/30 transition-all hover:bg-white/[0.06] hover:text-white" onClick={() => { if (!creating) setModalOpen(false) }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            <div className="px-7 py-6 space-y-5">
              {/* Key Name */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Key Name</label>
                <input
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Production Key"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-teal-500/50 focus:bg-teal-500/[0.04] focus:shadow-[0_0_0_3px_rgba(45,212,200,0.1)]"
                />
              </div>

              {/* Expiry */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Expires</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'never', label: 'Never' },
                    { value: '30', label: '30 days' },
                    { value: '90', label: '90 days' },
                    { value: '365', label: '1 year' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setKeyExpiry(opt.value)}
                      className={`rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                        keyExpiry === opt.value
                          ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                          : 'border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/70'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Access */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Model Access</label>
                <div ref={modelSearchRef} className="relative">
                  <div className="relative">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white/30" strokeWidth="2" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    {(() => {
                      const selectedModels = models.filter((m) => selectedModelIds.includes(m.id))
                      const selectedLabel = selectedModels.map((m) => m.name).join(', ')
                      const displayVal = modelDropdownOpen ? modelSearchQuery : (modelSearchQuery || selectedLabel)
                      return (
                        <input
                          value={displayVal}
                          onChange={(e) => { setModelSearchQuery(e.target.value); setModelDropdownOpen(true) }}
                          onFocus={() => { setModelDropdownOpen(true) }}
                          placeholder={selectedLabel || "Search models…"}
                          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 pl-9 pr-3.5 text-sm text-white outline-none transition-all placeholder:text-white/40 focus:border-teal-500/50 focus:bg-teal-500/[0.04]"
                        />
                      )
                    })()}
                  </div>
                  {modelValidation && selectedModelIds.length === 0 && (
                    <p className="mt-1 text-xs text-red-400">Please select at least one model.</p>
                  )}
                  {modelDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#0F1420] p-1.5 shadow-2xl backdrop-blur-xl">
                      {models.filter((m) => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase())).length === 0 ? (
                        <div className="px-3 py-5 text-center text-xs text-white/30">No models available</div>
                      ) : (
                        models
                          .filter((m) => m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()))
                          .map((m) => (
                            <label key={m.id} className="flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/70 transition-all hover:bg-white/[0.04] hover:text-white">
                              <input
                                type="checkbox"
                                checked={selectedModelIds.includes(m.id)}
                                onChange={(e) => {
                                  setSelectedModelIds((prev) =>
                                    e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id)
                                  )
                                }}
                                className="size-3.5 accent-teal-500"
                              />
                              <div className="flex items-center gap-2">
                                <div className="size-2 rounded-full bg-teal-500/50" />
                                {m.name}
                              </div>
                            </label>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tools */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/60">Enabled Tools</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'web_search', label: 'Web Search' },
                    { id: 'datetime', label: 'Date/Time' },
                    { id: 'url_fetch', label: 'URL Fetch' },
                  ].map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => setKeyTools((prev) => ({ ...prev, [tool.id]: !prev[tool.id] }))}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                        keyTools[tool.id]
                          ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                          : 'border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/70'
                      }`}
                    >
                      {tool.label}
                    </button>
                  ))}
                  <button
                    onClick={() => setShowCustomTools(prev => !prev)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                      showCustomTools
                        ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                        : 'border-dashed border-white/[0.06] text-white/30 hover:border-white/[0.12] hover:text-white/50'
                    }`}
                  >
                    {showCustomTools ? 'Hide Custom Tools' : `+ Custom Tools${customTools.length > 0 ? ` (${customTools.length})` : ''}`}
                  </button>
                </div>
                {showCustomTools && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customTools.length === 0 ? (
                      <span className="text-xs text-white/30 italic">No custom tools created yet. Go to MCP &gt; Tools to add one.</span>
                    ) : (
                      customTools.map((t) => (
                        <button
                          key={`custom:${t.id}`}
                          onClick={() => setKeyTools((prev) => ({ ...prev, [`custom:${t.id}`]: !prev[`custom:${t.id}`] }))}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                            keyTools[`custom:${t.id}`]
                              ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                              : 'border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/70'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Corsair Plugin Access */}
              {SHOW_CORSAIR_INTEGRATIONS && corsairPlugins.filter(p => p.enabled).length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">Corsair Plugin Access</label>
                  <div className="flex flex-wrap gap-2">
                    {corsairPlugins.filter(p => p.enabled).map((p) => (
                      <button
                        key={p.plugin_id}
                        onClick={() => setSelectedCorsairPlugins(prev =>
                          prev.includes(p.plugin_id) ? prev.filter(id => id !== p.plugin_id) : [...prev, p.plugin_id]
                        )}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          selectedCorsairPlugins.includes(p.plugin_id)
                            ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                            : 'border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/70'
                        }`}
                      >
                        {p.plugin_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MCP Server Access */}
              {mcps.filter(s => s.is_active).length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">Generic MCP Server Access</label>
                  <div className="flex flex-wrap gap-2">
                    {mcps.filter(s => s.is_active).map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedMcpIds(prev =>
                          prev.includes(s.id) ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        )}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                          selectedMcpIds.includes(s.id)
                            ? 'border-teal-500/40 bg-teal-500/15 text-teal-300'
                            : 'border-white/[0.06] text-white/40 hover:border-white/[0.12] hover:text-white/70'
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Budget & Rate Limits */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">Daily Budget</label>
                  <input
                    type="number"
                    value={keyBudget}
                    onChange={(e) => setKeyBudget(e.target.value)}
                    placeholder="Unlimited"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-teal-500/50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-white/60">RPM Limit</label>
                  <input
                    type="number"
                    value={keyRpm}
                    onChange={(e) => setKeyRpm(e.target.value)}
                    placeholder="No limit"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-white/25 focus:border-teal-500/50"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-white/[0.06] px-7 py-4">
              <button
                onClick={() => setModalOpen(false)}
                disabled={creating}
                className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/50 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={creating}
                onClick={async () => {
                  if (!activeWsId) return
                  if (selectedModelIds.length === 0) { setModelValidation(true); return }
                  setCreating(true)
                  try {
                    const expiresAt = keyExpiry === 'never' ? null : new Date(Date.now() + Number(keyExpiry) * 86400000).toISOString()
                    const result = await createKey(activeWsId, {
                      label: keyName || undefined,
                      expires_at: expiresAt,
                      allowed_tools: Object.entries(keyTools).filter(([, v]) => v).map(([k]) => k),
                      allowed_model_ids: selectedModelIds.length > 0 ? selectedModelIds : undefined,
                      allowed_corsair_plugins: selectedCorsairPlugins.length > 0 ? selectedCorsairPlugins : undefined,
                      allowed_mcp_server_ids: selectedMcpIds.length > 0 ? selectedMcpIds : undefined,
                      daily_budget: keyBudget ? Number(keyBudget) : undefined,
                      rpm_limit: keyRpm ? Number(keyRpm) : undefined,
                    })
                    setCreatedKey(result)
                    setKeyCopied(false)
                    track('api_key.created', 1, { workspace_id: activeWsId })
                    setKeyName('')
                    setKeyExpiry('never')
                    setKeyBudget('')
                    setKeyRpm('')
                    setKeyTools({ calculator: true })
                    setSelectedModelIds([])
                    setSelectedCorsairPlugins([])
                    setSelectedMcpIds([])
                    setModelValidation(false)
                    queryClient.invalidateQueries({ queryKey: ['api-keys'] })
                  } catch (e: any) {
                    track('api_key.create_failed', 1, { workspace_id: activeWsId })
                    console.warn('create key failed', e)
                  } finally {
                    setCreating(false)
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-teal-500 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-teal-500/40 disabled:opacity-40"
              >
                {creating ? (
                  <>
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3"/></svg>
                    Creating…
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
                    Generate Key
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── SUCCESS OVERLAY ── */}
      {mounted && createdKey && createPortal(
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setCreatedKey(null)} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-2xl border border-emerald-500/20 bg-[#0F1420] p-8 shadow-2xl backdrop-blur-2xl text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h2 className="mb-1 text-lg font-bold text-white">Key Created Successfully</h2>
            <p className="mb-1 text-sm text-white/50">This is the only time you will see this key. Copy and store it securely.</p>
            {keyCopied ? (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" className="mt-0.5 shrink-0"><polyline points="20 6 9 17 4 12"/></svg>
                <p className="text-xs leading-relaxed text-emerald-300/90">
                  <strong className="text-emerald-200">Key copied!</strong> You can now safely close this dialog. The full key will not be shown again.
                </p>
              </div>
            ) : (
              <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-left">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" className="mt-0.5 shrink-0"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
                <p className="text-xs leading-relaxed text-amber-300/90">
                  <strong className="text-amber-200">This key will only be shown once.</strong> Make sure to copy it now — you won&apos;t be able to see the full key again. If you lose it, revoke this key and create a new one.
                </p>
              </div>
            )}
            <div className="mb-5 rounded-xl border border-white/[0.08] bg-black/40 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/30">Your API Key</span>
                {!keyCopied && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!createdKey?.key) return
                      const ok = await copyTextToClipboard(createdKey.key)
                      if (ok) {
                        setKeyCopied(true)
                        setCopyNotice('API Key copied to clipboard!')
                        if (copyNoticeTimeout.current) clearTimeout(copyNoticeTimeout.current)
                        copyNoticeTimeout.current = setTimeout(() => setCopyNotice(null), 2500)
                      }
                    }}
                    className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </button>
                )}
              </div>
              <div className="break-all font-mono text-sm text-emerald-400 select-all">{createdKey.key}</div>
            </div>
            <div className="flex gap-2.5 justify-center">
              {!keyCopied && (
                <button
                  onClick={async () => {
                    if (!createdKey?.key) return
                    const ok = await copyTextToClipboard(createdKey.key)
                    if (ok) {
                      setKeyCopied(true)
                      setCopyNotice('API Key copied to clipboard!')
                      if (copyNoticeTimeout.current) clearTimeout(copyNoticeTimeout.current)
                      copyNoticeTimeout.current = setTimeout(() => setCopyNotice(null), 2500)
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  Copy Key
                </button>
              )}
              <button
                onClick={() => setCreatedKey(null)}
                className="rounded-lg border border-white/[0.06] px-5 py-2.5 text-xs font-semibold text-white/50 transition-all hover:bg-white/[0.06] hover:text-white cursor-pointer"
              >
                {keyCopied ? 'Close' : 'Done'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── REVOKE CONFIRMATION ── */}
      {mounted && revokeTarget && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { if (!revoking) setRevokeTarget(null) }} />
          <div className="relative z-10 mx-4 w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0F1420] p-7 shadow-2xl backdrop-blur-2xl text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-500/15 shadow-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h2 className="mb-1.5 text-[16px] font-bold text-white">Revoke API Key</h2>
            <p className="mb-6 text-sm text-white/50">This action cannot be undone. Any services using this key will immediately lose access.</p>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setRevokeTarget(null)}
                disabled={revoking}
                className="rounded-lg border border-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/50 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                disabled={revoking}
                onClick={async () => {
                  if (!activeWsId || !revokeTarget) return
                  setRevoking(true)
                  try {
                    await revokeKey(activeWsId, revokeTarget)
                    track('api_key.revoked', 1, { workspace_id: activeWsId })
                    setRevokeTarget(null)
                    queryClient.invalidateQueries({ queryKey: ['api-keys'] })
                  } catch (e) {
                    track('api_key.revoke_failed', 1, { workspace_id: activeWsId })
                    console.warn('revoke failed', e)
                  } finally {
                    setRevoking(false)
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition-all hover:bg-red-500 disabled:opacity-40"
              >
                {revoking ? (
                  <>
                    <svg className="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3"/></svg>
                    Revoking…
                  </>
                ) : 'Revoke Key'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
