'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import {
  listWsMCP, createWsMCP, updateWsMCP, deleteWsMCP,
  listCorsairPlugins, connectCorsairPlugin, enableCorsairPlugin,
  disableCorsairPlugin, getGatewayPlugins, refreshMcpServers,
  listCustomTools, createCustomTool, deleteCustomTool,
  listKeys, parseBrowserRuntimeConfig, updateBrowserRuntimeConfig, BROWSER_RUNTIME_GROUPS,
  type MCPServer, type CorsairPlugin, type CorsairConnectResult, type CorsairPluginInfo,
  type CustomTool, type ApiKey, type BrowserRuntimeConfig, type BrowserRuntimeGroup,
} from '@/lib/api'

type Tab = 'integrations' | 'servers' | 'tools'

const PLUGIN_STYLES: Record<string, { icon: string; gradient: string; color: string }> = {
  github: { icon: '🐙', gradient: 'from-gray-700 to-gray-900', color: '#24292e' },
  slack: { icon: '💬', gradient: 'from-purple-600 to-pink-500', color: '#4A154B' },
  gmail: { icon: '📧', gradient: 'from-red-500 to-rose-600', color: '#EA4335' },
  linear: { icon: '▴', gradient: 'from-indigo-600 to-violet-600', color: '#5E6AD2' },
}

function getPluginStyle(pluginId: string, pluginName?: string) {
  const known = PLUGIN_STYLES[pluginId]
  if (known) return known
  const initial = (pluginName || pluginId).charAt(0).toUpperCase()
  return { icon: initial, gradient: 'from-violet-600 to-indigo-600', color: '#6366f1' }
}

const AUTH_TYPE_OPTIONS: { id: MCPServer['auth_type']; label: string; description: string }[] = [
  { id: 'none', label: 'None', description: 'No authentication required' },
  { id: 'bearer', label: 'Bearer Token', description: 'Authorization: Bearer <token>' },
  { id: 'basic', label: 'Basic Auth', description: 'Authorization: Basic <credentials>' },
]

function AuthTypeDropdown({
  value,
  onChange,
  size = 'md',
}: {
  value: MCPServer['auth_type']
  onChange: (val: MCPServer['auth_type']) => void
  size?: 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected = AUTH_TYPE_OPTIONS.find(o => o.id === value) || AUTH_TYPE_OPTIONS[0]

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/90 outline-none hover:bg-white/[0.06] hover:border-white/20 focus:border-violet-500/40 transition-all text-left ${
          size === 'sm' ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-sm'
        }`}
      >
        <span className="truncate">{selected.label}</span>
        <svg
          width={size === 'sm' ? '12' : '14'}
          height={size === 'sm' ? '12' : '14'}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`shrink-0 text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[210px] z-[130] rounded-xl border border-white/[0.1] bg-[#141A28] p-1.5 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          {AUTH_TYPE_OPTIONS.map((opt) => {
            const isSelected = opt.id === value
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  onChange(opt.id)
                  setOpen(false)
                }}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors mb-0.5 last:mb-0 ${
                  isSelected
                    ? 'bg-violet-600/20 text-violet-300 font-medium border border-violet-500/30'
                    : 'text-white/80 hover:bg-white/[0.06] hover:text-white border border-transparent'
                }`}
              >
                <div>
                  <div className="font-semibold text-xs text-white/90">{opt.label}</div>
                  <div className="text-[10px] text-white/40 font-normal">{opt.description}</div>
                </div>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-violet-400 shrink-0">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MCPPage() {
  const SHOW_CORSAIR_INTEGRATIONS = false
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { activeWsId } = useWorkspace()

  const [gatewayPlugins, setGatewayPlugins] = useState<CorsairPluginInfo[]>([])
  const [corsairPlugins, setCorsairPlugins] = useState<CorsairPlugin[]>([])
  const [servers, setServers] = useState<MCPServer[]>([])
  const [loading, setLoading] = useState(true)
  const [connectLoading, setConnectLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<Tab>('servers')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'available'>('all')

  const [modal, setModal] = useState<{ open: boolean; edit?: MCPServer }>({ open: false })
  const [form, setForm] = useState<{ name: string; url: string; auth_type: MCPServer['auth_type']; auth_token: string; description: string; icon: string }>({ name: '', url: '', auth_type: 'none', auth_token: '', description: '', icon: '' })
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MCPServer | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    if (!modal.open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModal({ open: false })
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [modal.open])

  const [customTools, setCustomTools] = useState<CustomTool[]>([])
  const [ctModal, setCtModal] = useState(false)
  const [ctForm, setCtForm] = useState({ name: '', description: '', webhook_url: '' })
  const [ctSaving, setCtSaving] = useState(false)
  const [ctDeleteTarget, setCtDeleteTarget] = useState<CustomTool | null>(null)

  // Browser Runtime state
  const [brKeys, setBrKeys] = useState<ApiKey[]>([])
  const [brActiveKeyId, setBrActiveKeyId] = useState<string>('')
  const [brConfig, setBrConfig] = useState<BrowserRuntimeConfig>({ enabled_groups: [] })
  const [brSaving, setBrSaving] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }, [])

  const fetchAll = useCallback(async () => {
    if (!activeWsId) {
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const [mcpRes, pluginRes, gatewayRes, ctRes, keysRes] = await Promise.all([
        listWsMCP(activeWsId).catch(() => ({ servers: [] as MCPServer[] })),
        listCorsairPlugins(activeWsId).catch(() => [] as CorsairPlugin[]),
        getGatewayPlugins(activeWsId).catch(() => ({ corsair: [] as CorsairPluginInfo[], mcp: [] })),
        listCustomTools(activeWsId).catch(() => [] as CustomTool[]),
        listKeys(activeWsId).catch(() => [] as ApiKey[]),
      ])
      setServers(mcpRes?.servers || [])
      setCorsairPlugins(pluginRes)
      setGatewayPlugins([...gatewayRes.corsair, ...gatewayRes.mcp])
      setCustomTools(ctRes)
      setBrKeys(keysRes)
      if (keysRes.length > 0) {
        const firstKey = keysRes[0]
        setBrActiveKeyId(firstKey.id)
        setBrConfig(parseBrowserRuntimeConfig(firstKey.tool_config))
      }
    } catch {}
    setLoading(false)
  }, [activeWsId])

  useEffect(() => { fetchAll() }, [fetchAll])

  const mergedPlugins = useMemo(() => {
    return gatewayPlugins.map(gp => {
      const ws = corsairPlugins.find(p => p.plugin_id === gp.plugin)
      return {
        ...gp,
        enabled: ws?.enabled || false,
        status: ws?.status || ('not_connected' as const),
        connected_at: ws?.connected_at,
      }
    })
  }, [gatewayPlugins, corsairPlugins])

  const filteredPlugins = useMemo(() => {
    let result = mergedPlugins
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        (p.name || p.plugin).toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }
    if (statusFilter === 'connected') {
      result = result.filter(p => p.status === 'connected')
    } else if (statusFilter === 'available') {
      result = result.filter(p => p.status !== 'connected')
    }
    return result
  }, [mergedPlugins, search, statusFilter])

  const connectedCount = mergedPlugins.filter(p => p.status === 'connected').length
  const availableCount = mergedPlugins.length

  const openCreate = useCallback(() => {
    setForm({ name: '', url: '', auth_type: 'none', auth_token: '', description: '', icon: '' })
    setModal({ open: true })
  }, [])

  const openEdit = useCallback((s: MCPServer) => {
    setForm({ name: s.name, url: s.url, auth_type: s.auth_type, auth_token: s.auth_token || '', description: s.description || '', icon: s.icon || '' })
    setModal({ open: true, edit: s })
  }, [])

  const handleSave = useCallback(async () => {
    if (!activeWsId || !form.name || !form.url) return
    setSaving(true)
    try {
      if (modal.edit) {
        await updateWsMCP(activeWsId, modal.edit.id, form)
        showToast('MCP server updated')
      } else {
        await createWsMCP(activeWsId, form)
        showToast('MCP server added')
      }
      setModal({ open: false })
      fetchAll()
    } catch { showToast('Failed to save MCP server') }
    setSaving(false)
  }, [activeWsId, form, modal.edit, fetchAll, showToast])

  const handleDelete = useCallback(async () => {
    if (!activeWsId || !deleteTarget) return
    try {
      await deleteWsMCP(activeWsId, deleteTarget.id)
      showToast('MCP server removed')
      setDeleteTarget(null)
      fetchAll()
    } catch { showToast('Failed to delete MCP server') }
  }, [activeWsId, deleteTarget, fetchAll, showToast])

  const pollConnection = useCallback(async (wsId: string, pluginId: string, pluginName: string) => {
    const start = Date.now()
    const timeout = 120_000
    while (Date.now() - start < timeout) {
      await new Promise(r => setTimeout(r, 2000))
      try {
        const plugins = await listCorsairPlugins(wsId)
        const p = plugins.find(x => x.plugin_id === pluginId)
        if (p?.status === 'connected') {
          showToast(`${pluginName} connected successfully`)
          fetchAll()
          return
        }
      } catch {}
    }
    showToast(`${pluginName} — OAuth timed out, please try again`)
    fetchAll()
  }, [fetchAll, showToast])

  const handleConnect = useCallback(async (pluginId: string, pluginName: string, authType: string) => {
    if (!activeWsId) return
    setConnectLoading(pluginId)
    try {
      await enableCorsairPlugin(activeWsId, pluginId, pluginName, authType)
      if (authType === 'oauth_2') {
        const result: CorsairConnectResult = await connectCorsairPlugin(activeWsId, pluginId)
        window.open(result.connect_url, '_blank', 'width=800,height=700')
        showToast(`${pluginName} — follow the OAuth flow in the new window`)
        pollConnection(activeWsId, pluginId, pluginName)
      } else {
        showToast(`${pluginName} enabled`)
        fetchAll()
      }
    } catch { showToast(`Failed to connect ${pluginName}`); setConnectLoading(null) }
    setConnectLoading(null)
  }, [activeWsId, fetchAll, showToast, pollConnection])

  const handleDisconnect = useCallback(async (pluginId: string, name: string) => {
    if (!activeWsId) return
    try {
      await disableCorsairPlugin(activeWsId, pluginId)
      showToast(`${name} disconnected`)
      fetchAll()
    } catch { showToast(`Failed to disconnect ${name}`) }
  }, [activeWsId, fetchAll, showToast])

  const activeServers = servers.filter(s => s.is_active)
  const inactiveServers = servers.filter(s => !s.is_active)

  if (authLoading || !user) return null

  return (
    <div className="px-7 py-7 pb-15 relative min-h-screen">
      {/* Ambient background artwork */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 0, opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      <div className="relative" style={{ zIndex: 1 }}>
      {toast && (
        <div className="fixed top-4 right-4 z-[200] animate-in fade-in slide-in-from-top-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-400 shadow-xl backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>
            {toast}
          </div>
        </div>
      )}

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90 tracking-tight">MCP & Tools</h1>
          <p className="mt-1.5 text-sm text-white/40 max-w-xl">
            Connect MCP servers and manage tools. Tools are injected into model inference automatically.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/[0.06]">
        {SHOW_CORSAIR_INTEGRATIONS && (
        <button
          onClick={() => setActiveTab('integrations')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'integrations'
              ? 'text-white/90'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Integrations
{SHOW_CORSAIR_INTEGRATIONS && activeTab === 'integrations' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
          )}
        </button>
      )}
        <button
          onClick={() => setActiveTab('servers')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'servers'
              ? 'text-white/90'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          MCP Servers
          {activeServers.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-violet-500/20 text-[10px] font-semibold text-violet-400">
              {activeServers.length}
            </span>
          )}
          {activeTab === 'servers' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 text-sm font-medium transition-colors relative ${
            activeTab === 'tools'
              ? 'text-white/90'
              : 'text-white/40 hover:text-white/60'
          }`}
        >
          Tools
          {customTools.length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center size-4 rounded-full bg-violet-500/20 text-[10px] font-semibold text-violet-400">
              {customTools.length}
            </span>
          )}
          {activeTab === 'tools' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ────────────── INTEGRATIONS TAB ────────────── */}
      {activeTab === 'integrations' && (
        <div>
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search integrations..."
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] pl-9 pr-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors"
              />
            </div>
            <div className="flex gap-1.5">
              {(['all', 'available', 'connected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === f
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      : 'text-white/40 hover:text-white/60 border border-transparent'
                  }`}
                >
                  {f === 'all' ? `All (${availableCount})` : f === 'connected' ? `Connected (${connectedCount})` : 'Available'}
                </button>
              ))}
            </div>
          </div>

          {/* Plugin Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="h-48 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : filteredPlugins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <div className="text-3xl mb-3 opacity-30">🔌</div>
              <p className="text-sm font-medium text-white/50">
                {search ? 'No integrations match your search' : 'No integrations available'}
              </p>
              <p className="text-xs text-white/30 mt-1">
                {search ? 'Try a different search term' : 'Check that the Corsair gateway is running'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlugins.map((plugin) => {
                const style = getPluginStyle(plugin.plugin, plugin.name)
                const connected = plugin.status === 'connected'
                const loading_ = connectLoading === plugin.plugin
                return (
                  <div
                    key={plugin.plugin}
                    className="group relative rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
                  >
                    {/* Top accent bar */}
                    <div className={`h-1 bg-gradient-to-r ${style.gradient}`} />

                    <div className="p-4">
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${style.gradient} text-lg shadow-md`}>
                          {style.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white/90 truncate">{plugin.name || plugin.plugin}</h3>
                            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wider border border-white/[0.08] text-white/40">
                              {plugin.auth_type || 'oauth_2'}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">
                            {plugin.description || `${plugin.plugin} integration`}
                          </p>
                        </div>
                      </div>

                      {/* Operations / Tools */}
                      {(plugin.operations && plugin.operations.length > 0) || (plugin.tools && plugin.tools.length > 0) ? (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {(plugin.operations || plugin.tools?.map((t: any) => t.name || t) || []).slice(0, 6).map((op: string) => (
                              <span
                                key={op}
                                className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[10px] font-mono text-white/50"
                              >
                                {op}
                              </span>
                            ))}
                            {((plugin.operations || plugin.tools?.map((t: any) => t.name || t) || []).length > 6) && (
                              <span className="text-[10px] text-white/30 flex items-center">
                                +{(plugin.operations || plugin.tools?.map((t: any) => t.name || t) || []).length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      ) : plugin.error ? (
                        <div className="mb-3">
                          <span className="text-[10px] text-red-400">{plugin.error}</span>
                        </div>
                      ) : null}

                      {/* Status + Action */}
                      <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
                        {plugin.source === 'mcp' ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="size-1.5 rounded-full bg-emerald-400" />
                              <span className="text-[11px] font-medium text-emerald-400">
                                {plugin.error ? 'Error' : `${(plugin.tools || []).length} tools`}
                              </span>
                            </div>
                            {!plugin.error && (
                              <span className="text-[10px] text-white/30">
                                {plugin.server_id?.slice(0, 8)}...
                              </span>
                            )}
                          </>
                        ) : connected ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-emerald-400" />
                            <span className="text-[11px] font-medium text-emerald-400">Connected</span>
                            {plugin.connected_at && (
                              <span className="text-[10px] text-white/30 ml-1">
                                {new Date(plugin.connected_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ) : plugin.enabled ? (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span className="text-[11px] font-medium text-amber-400">Pending</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-white/20" />
                            <span className="text-[11px] text-white/30">Not connected</span>
                          </div>
                        )}

                        <div className="flex gap-1.5">
                              {plugin.source === 'mcp' ? null : connected ? (
                                <button
                                  onClick={() => handleDisconnect(plugin.plugin, plugin.name || plugin.plugin)}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  Disconnect
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleConnect(plugin.plugin, plugin.name || plugin.plugin, plugin.auth_type || 'oauth_2')}
                                  disabled={loading_}
                                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-md hover:shadow-violet-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0"
                                >
                                  {loading_ ? 'Connecting...' : plugin.enabled ? 'Retry' : 'Connect'}
                                </button>
                              )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────── MCP SERVERS TAB ────────────── */}
      {activeTab === 'servers' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white/90">
              Generic MCP Servers
              <span className="ml-2 text-sm font-normal text-white/40">({activeServers.length})</span>
            </h2>
            <div className="flex gap-3">
              <button
                onClick={() => activeWsId && refreshMcpServers(activeWsId).then(() => showToast('MCP servers refreshed')).catch(() => showToast('Refresh failed'))}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/70 shadow-lg transition-all hover:bg-white/[0.06] hover:-translate-y-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh
              </button>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add MCP Server
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : activeServers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <div className="text-3xl mb-3 opacity-30">🔌</div>
              <p className="text-sm font-medium text-white/50">No MCP servers connected</p>
              <p className="text-xs text-white/30 mt-1">Add a custom MCP server below.</p>
              <button
                onClick={openCreate}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add Server
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeServers.map((s) => (
                <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 text-sm">
                      {s.icon || s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/90 truncate">{s.name}</div>
                      <div className="text-xs text-white/40 truncate font-mono">{s.url}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                        <span className="size-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(s) }}
                        className="size-7 flex items-center justify-center rounded-md hover:bg-white/[0.06] text-white/40 hover:text-white/70 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteTarget(s) }}
                        className="size-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                      </button>
                    </div>
                  </div>
                  {expandedId === s.id && (
                    <div className="px-4 pb-3 pt-1 border-t border-white/[0.06]">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {s.description && (
                          <div className="col-span-2">
                            <span className="text-white/40">Description:</span>
                            <span className="ml-2 text-white/70">{s.description}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-white/40">Auth:</span>
                          <span className="ml-2 text-white/70 capitalize">{s.auth_type}</span>
                        </div>
                        <div>
                          <span className="text-white/40">Created:</span>
                          <span className="ml-2 text-white/70">{new Date(s.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inactive Servers */}
          {inactiveServers.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white/50 mb-3">
                Disabled
                <span className="ml-2 text-sm font-normal text-white/30">({inactiveServers.length})</span>
              </h3>
              <div className="space-y-2 opacity-60">
                {inactiveServers.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.01] px-4 py-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-sm text-white/30">
                      {s.icon || s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white/50 truncate">{s.name}</div>
                      <div className="text-xs text-white/30 truncate font-mono">{s.url}</div>
                    </div>
                    <button
                      onClick={() => updateWsMCP(activeWsId!, s.id, { is_active: true }).then(fetchAll)}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium"
                    >
                      Enable
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────── TOOLS TAB ────────────── */}
      {activeTab === 'tools' && (
        <div>

          {/* ── Browser Runtime Section ── */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-semibold text-white/90">Browser Runtime</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30">BETA</span>
            </div>
            <p className="text-[12px] text-white/40 mb-4">
              The assistant can browse the web using its own runtime tabs — it never reads your open tabs or browsing history.
            </p>

            {/* Key selector */}
            {brKeys.length === 0 ? (
              <p className="text-xs text-white/30 italic mb-4">No API keys found — create a key to configure Browser Runtime.</p>
            ) : (
              <div className="flex items-center gap-3 mb-5">
                <span className="text-[11px] text-white/40 shrink-0">Configure for key:</span>
                <select
                  value={brActiveKeyId}
                  onChange={(e) => {
                    const key = brKeys.find(k => k.id === e.target.value)
                    if (key) {
                      setBrActiveKeyId(key.id)
                      setBrConfig(parseBrowserRuntimeConfig(key.tool_config))
                    }
                  }}
                  className="flex-1 max-w-xs rounded-lg bg-white/[0.05] border border-white/[0.10] text-white/80 text-xs px-3 py-2 outline-none focus:border-violet-500/60"
                >
                  {brKeys.map(k => (
                    <option key={k.id} value={k.id} className="bg-zinc-900">
                      {k.label || k.prefix || k.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
                {brSaving && <span className="text-[10px] text-violet-400 animate-pulse">Saving…</span>}
              </div>
            )}

            {/* Group toggles */}
            {brKeys.length > 0 && (
              <div className="space-y-2">
                {BROWSER_RUNTIME_GROUPS.map((group) => {
                  const enabled = brConfig.enabled_groups.includes(group.id)
                  return (
                    <label
                      key={group.id}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        enabled
                          ? 'border-violet-500/40 bg-violet-500/[0.06]'
                          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10]'
                      }`}
                    >
                      {/* Custom checkbox */}
                      <div className="relative flex items-center justify-center pt-0.5 shrink-0">
                        <input
                          type="checkbox"
                          checked={enabled}
                          disabled={brSaving}
                          onChange={async () => {
                            if (!activeWsId || !brActiveKeyId) return
                            const next: BrowserRuntimeConfig = enabled
                              ? { enabled_groups: brConfig.enabled_groups.filter(g => g !== group.id) }
                              : { enabled_groups: [...brConfig.enabled_groups, group.id] }
                            setBrConfig(next)   // optimistic
                            setBrSaving(true)
                            try {
                              await updateBrowserRuntimeConfig(activeWsId, brActiveKeyId, next)
                              // Update local key cache so switching keys shows fresh state
                              setBrKeys(prev => prev.map(k => k.id === brActiveKeyId
                                ? { ...k, tool_config: { ...(k.tool_config || {}), browser_runtime: next } }
                                : k
                              ))
                            } catch {
                              setBrConfig(brConfig)  // rollback
                              showToast('Failed to save Browser Runtime config')
                            } finally {
                              setBrSaving(false)
                            }
                          }}
                          className="sr-only peer"
                        />
                        <div className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all ${
                          enabled ? 'border-violet-500 bg-violet-600' : 'border-white/20'
                        }`}>
                          {enabled && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-white/90">{group.label}</span>
                          {group.warning && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide bg-amber-500/15 text-amber-400 border border-amber-500/25">MUTATING</span>
                          )}
                        </div>
                        <div className="text-[11px] text-white/40 mt-0.5">{group.description}</div>
                        {group.warning && (
                          <div className="text-[10px] text-amber-400/60 mt-1">⚠ {group.warning}</div>
                        )}
                      </div>
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] mb-8" />

          {/* Built-in Tools — static info cards */}
          <h2 className="text-base font-semibold text-white/90 mb-3">Built-in Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { name: 'Web Search', desc: 'Searches the web for current information', icon: '🔍' },
              { name: 'URL Fetch', desc: 'Fetches content from a given URL', icon: '🌐' },
              { name: 'Current Date/Time', desc: 'Injects current UTC date and time', icon: '🕐' },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 flex items-start gap-3">
                <div className="text-lg mt-0.5">{t.icon}</div>
                <div>
                  <div className="text-sm font-semibold text-white/90">{t.name}</div>
                  <div className="text-xs text-white/40 mt-0.5">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Custom Tools */}
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white/90">
              Custom Tools
              <span className="ml-2 text-sm font-normal text-white/40">({customTools.length})</span>
            </h2>
            <button
              onClick={() => { setCtForm({ name: '', description: '', webhook_url: '' }); setCtModal(true) }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
              Add Custom Tool
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-16 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
              ))}
            </div>
          ) : customTools.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] p-12 text-center">
              <div className="text-3xl mb-3 opacity-30">🛠️</div>
              <p className="text-sm font-medium text-white/50">No custom tools created</p>
              <p className="text-xs text-white/30 mt-1">Add a webhook-backed tool below.</p>
              <button
                onClick={() => { setCtForm({ name: '', description: '', webhook_url: '' }); setCtModal(true) }}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
                Add Tool
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {customTools.map((t) => (
                <div key={t.id} className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 flex items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 text-sm">
                    {t.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">{t.name}</div>
                    <div className="text-xs text-white/40 truncate">
                      {t.description || <span className="italic text-white/20">No description</span>}
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-white/30 truncate max-w-[200px] font-mono">
                    {t.webhook_url}
                  </div>
                  <button
                    onClick={() => setCtDeleteTarget(t)}
                    className="size-7 flex items-center justify-center rounded-md hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors shrink-0"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Custom Tool Create Modal */}
      {ctModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCtModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white/90 mb-1">Add Custom Tool</h3>
            <p className="text-sm text-white/40 mb-5">
              Create a webhook-backed tool. When the model calls this tool, PullO will POST the arguments to your webhook URL and return the JSON response.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Tool Name</label>
                <input
                  value={ctForm.name}
                  onChange={(e) => setCtForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Weather API"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Description</label>
                <input
                  value={ctForm.description}
                  onChange={(e) => setCtForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does this tool do?"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Webhook URL</label>
                <input
                  value={ctForm.webhook_url}
                  onChange={(e) => setCtForm(f => ({ ...f, webhook_url: e.target.value }))}
                  placeholder="https://example.com/api/tool"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setCtModal(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!activeWsId || !ctForm.name || !ctForm.webhook_url) return
                  setCtSaving(true)
                  try {
                    await createCustomTool(activeWsId, ctForm)
                    setCtModal(false)
                    fetchAll()
                  } catch {}
                  setCtSaving(false)
                }}
                disabled={ctSaving || !ctForm.name || !ctForm.webhook_url}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {ctSaving ? 'Saving...' : 'Add Tool'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Tool Delete Confirmation */}
      {ctDeleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCtDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white/90 mb-2">Remove Custom Tool</h3>
            <p className="text-sm text-white/50 mb-1">
              Are you sure you want to remove <span className="font-medium text-white/70">{ctDeleteTarget.name}</span>?
            </p>
            <p className="text-xs text-white/30 mb-5">
              API keys that use this tool will lose access to it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setCtDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!activeWsId || !ctDeleteTarget) return
                  try {
                    await deleteCustomTool(activeWsId, ctDeleteTarget.id)
                    setCtDeleteTarget(null)
                    fetchAll()
                  } catch {}
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Centered Modal Overlay */}
      {modal.open && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setModal({ open: false })}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-semibold text-white/90">
                {modal.edit ? 'Edit MCP Server' : 'Add MCP Server'}
              </h3>
              <button
                onClick={() => setModal({ open: false })}
                className="rounded-lg p-1 text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-sm text-white/40 mb-5">
              {modal.edit ? 'Update the connection details for this server.' : 'Connect to an external tool or data source via MCP.'}
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. My Database"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">URL</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm(f => ({ ...f, url: e.target.value }))}
                  placeholder="https://mcp.example.com/sse"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Auth Type</label>
                  <AuthTypeDropdown
                    value={form.auth_type}
                    onChange={(val) => setForm(f => ({ ...f, auth_type: val }))}
                    size="md"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Auth Token</label>
                  <input
                    value={form.auth_token}
                    onChange={(e) => setForm(f => ({ ...f, auth_token: e.target.value }))}
                    placeholder={form.auth_type === 'none' ? 'Not required' : 'Enter token'}
                    disabled={form.auth_type === 'none'}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors disabled:opacity-40"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What does this server provide?"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white/90 outline-none placeholder:text-white/20 focus:border-violet-500/40 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false })}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.url}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-violet-500/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {saving ? 'Saving...' : modal.edit ? 'Update' : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-white/90 mb-2">Remove MCP Server</h3>
            <p className="text-sm text-white/50 mb-1">
              Are you sure you want to remove <span className="font-medium text-white/70">{deleteTarget.name}</span>?
            </p>
            <p className="text-xs text-white/30 mb-5">
              Models in this workspace will lose access to this server until reconnected.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-gradient-to-br from-red-600 to-rose-600 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-red-500/40 hover:-translate-y-0.5 active:translate-y-0"
              >
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
