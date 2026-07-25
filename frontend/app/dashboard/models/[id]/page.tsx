'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { useWorkspace } from '@/lib/workspace-context'
import {
  getModel,
  updateModel,
  updateSystemPrompt,
  updateTools,
  deleteModel,
  parseToolConfig,
  mergeToolConfig,
  BUILTIN_MODEL_TOOLS,
  type Model,
  type ModelToolConfig,
} from '@/lib/api'
import './model.css'

function getErrMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const TEMPLATE_SYSTEM_PROMPT = `You are an expert technical assistant for {{company_name}}.  
Your primary goal is to help users interface with our local AI infrastructure.

- Always respond in {{language}}.
- Be concise and prioritize code examples.
- Use tools whenever real-time data or calculations are required.
- Maintain a professional, developer-focused tone.`

/* ── Lucide icon SVGs ── */
const Icons = {
  save: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
  ),
  fileCode: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  ),
  copy: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
  ),
  rotateCCW: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
  ),
  terminal: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
  ),
  braces: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/></svg>
  ),
  info: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  userCog: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="15" r="3"/><circle cx="9" cy="7" r="4"/><path d="M10 15H6a4 4 0 0 0-4 4v2"/><path d="M21.7 13.4 21 13.2"/><path d="M15.4 17.6 17 19"/><path d="M14.3 10.8 15 11"/></svg>
  ),
  sliders: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
  ),
  clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  ),
  cpu: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
  ),
  globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  ),
  alertTriangle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
  ),
  calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
  ),
  fingerprint: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 15.5A7.5 7.5 0 0 1 12 8c2 0 3.8.8 5.2 2"/><path d="M22 12c0 5.5-4.5 10-10 10a9.9 9.9 0 0 1-5-1.5"/><path d="M18 17.5A7.5 7.5 0 0 1 12 20a7 7 0 0 1-4.5-1.7"/><path d="M15 12a3 3 0 0 1-3 3 3 3 0 0 1-1.2-.3"/><path d="M12 2v2"/><path d="M12 22v-2"/></svg>
  ),
  check: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  alertCircle: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  ),
  network: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3"/><path d="M12 8v3"/></svg>
  ),
}

type TabId = 'overview' | 'prompt' | 'settings'

/* ── Saved/draft shape ── */
interface OverviewData {
  name: string
  description: string
  version: string
  provider: string
  status: string
  lastUpdated: string
}
interface SettingsData {
  timeout: number
  endpoint: string
  maxContextWindow: string
}
interface PageState {
  overview: OverviewData
  systemPrompt: string
  settings: SettingsData
  tools: ModelToolConfig
}

function defaultState(): PageState {
  return {
    overview: {
      name: '',
      description: '',
      version: '',
      provider: '',
      status: 'active',
      lastUpdated: '—',
    },
    systemPrompt: TEMPLATE_SYSTEM_PROMPT,
    settings: {
      timeout: 60,
      endpoint: 'http://localhost:11434',
      maxContextWindow: '128k',
    },
    tools: { web_search: false, url_fetch: false, calculator: false, current_datetime: false },
  }
}

export default function ModelDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()

  const modelId = params?.id ?? ''

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  /* ── State ── */
  const { activeWsId, setActiveWsId, myRole } = useWorkspace()
  const isEditable = myRole === 'owner' || myRole === 'admin'
  const [model, setModel] = useState<Model | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const [saved, setSaved] = useState<PageState>(defaultState())
  const [draft, setDraft] = useState<PageState>(defaultState())
  const [saving, setSaving] = useState(false)

  const [toast, setToast] = useState<{ type: 'success' | 'alert'; message: string } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((type: 'success' | 'alert', message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ type, message })
    toastTimer.current = setTimeout(() => setToast(null), 4000)
  }, [])

  /* ── Load workspace from search param, fallback to active workspace ── */
  useEffect(() => {
    const fromParam = searchParams.get('workspace_id')
    if (fromParam) {
      setActiveWsId(fromParam)
    }
  }, [])

  /* ── Fetch model ── */
  useEffect(() => {
    if (!activeWsId || !modelId || authLoading) return
    setDataLoading(true)
    setDataError(null)
    getModel(activeWsId, modelId)
      .then((data) => {
        setModel(data)
        const now = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        const st: PageState = {
          overview: {
            name: data.name ?? '',
            description: '',
            version: '',
            provider: '',
            status: data.status === 'online' ? 'active' : data.status === 'offline' ? 'offline' : 'idle',
            lastUpdated: formatDate((data as any).updated_at) || now,
          },
          systemPrompt: data.system_prompt ?? TEMPLATE_SYSTEM_PROMPT,
          settings: {
            timeout: data.timeout_secs ?? 60,
            endpoint: 'http://localhost:11434',
            maxContextWindow: '128k',
          },
          tools: parseToolConfig(data.tool_config),
        }
        setSaved(st)
        setDraft(JSON.parse(JSON.stringify(st)))
      })
      .catch((err) => setDataError(getErrMsg(err)))
      .finally(() => setDataLoading(false))
  }, [activeWsId, modelId, authLoading])

  /* ── Derived state ── */
  const hasUnsaved = JSON.stringify(saved) !== JSON.stringify(draft)
  const isOnline = model?.status === 'online'

  /* ── Token approximation ── */
  const tokenCount = Math.ceil((draft.systemPrompt || '').length / 4.2)

  /* ── Helpers ── */
  function updateOverviewField<K extends keyof OverviewData>(field: K, value: OverviewData[K]) {
    setDraft((prev) => ({ ...prev, overview: { ...prev.overview, [field]: value } }))
  }
  function updateSetting<K extends keyof SettingsData>(field: K, value: SettingsData[K]) {
    setDraft((prev) => ({ ...prev, settings: { ...prev.settings, [field]: value } }))
  }

  function insertPromptVar(varName: string) {
    const tag = `{{${varName}}}`
    setDraft((prev) => ({ ...prev, systemPrompt: prev.systemPrompt + tag }))
  }

  /* ── Discard ── */
  const handleDiscard = useCallback(() => {
    setDraft(JSON.parse(JSON.stringify(saved)))
    showToast('alert', 'Modifications discarded. Reverted to previous live parameters.')
  }, [saved, showToast])

  /* ── Save ── */
  const handleSave = useCallback(async () => {
    if (!activeWsId || !modelId) return
    setSaving(true)
    try {
      const overview = draft.overview
      const settings = draft.settings

      /* Update name + timeout_secs via updateModel */
      const patch: Record<string, unknown> = {}
      if (overview.name !== saved.overview.name) patch.name = overview.name
      if (settings.timeout !== saved.settings.timeout) patch.timeout_secs = settings.timeout
      if (Object.keys(patch).length > 0) {
        await updateModel(activeWsId, modelId, patch)
      }

      /* Update system prompt via dedicated endpoint */
      if (draft.systemPrompt !== saved.systemPrompt) {
        await updateSystemPrompt(activeWsId, modelId, draft.systemPrompt)
      }

      /* Update tool config */
      const toolsChanged = JSON.stringify(draft.tools) !== JSON.stringify(saved.tools)
      if (toolsChanged) {
        const merged = mergeToolConfig(draft.tools, model?.tool_config)
        await updateTools(activeWsId, modelId, merged)
      }

      const newSaved: PageState = JSON.parse(JSON.stringify(draft))
      newSaved.overview.lastUpdated = new Date().toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
      setSaved(newSaved)
      const savedFields: string[] = []
      if (overview.name !== saved.overview.name) savedFields.push('name')
      if (settings.timeout !== saved.settings.timeout) savedFields.push('timeout')
      if (draft.systemPrompt !== saved.systemPrompt) savedFields.push('system prompt')
      if (toolsChanged) savedFields.push('tools')
      showToast('success', `Saved: ${savedFields.join(', ') || 'no changes'}.`)
    } catch (err) {
      showToast('alert', getErrMsg(err))
    } finally {
      setSaving(false)
    }
  }, [activeWsId, modelId, draft, saved, showToast])

  if (authLoading) return null

  const statusBadgeColor =
    draft.overview.status === 'active'
      ? 'text-emerald-400'
      : draft.overview.status === 'idle'
        ? 'text-amber-400'
        : 'text-zinc-400'
  const statusBadgeBg =
    draft.overview.status === 'active'
      ? 'border-emerald-500/20 bg-emerald-500/10'
      : draft.overview.status === 'idle'
        ? 'border-amber-500/20 bg-amber-500/10'
        : 'border-zinc-800 bg-zinc-900'

  return (
    <div className="model-detail-page flex h-screen w-full overflow-hidden bg-[#050507] text-zinc-200 font-sans antialiased select-none" style={{ position: 'relative' }}>
      {/* Ambient background artwork */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      <main className="flex-1 flex flex-col h-full overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        {/* ═══ HEADER BAR ═══ */}
        <header className="h-[72px] border-b border-zinc-800 bg-[#09090b]/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-40">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span
                  className={`${hasUnsaved ? '' : 'hidden'} inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono shadow-sm`}
                >
                  <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                  UNSAVED
                </span>
              </div>
              <h2 className="text-[15px] font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                <span>{draft.overview.name || 'Model'}</span>
                {draft.overview.version && (
                  <span className="text-[11px] font-mono text-zinc-500 font-normal">
                    v{draft.overview.version}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="discard-btn"
              onClick={handleDiscard}
              className={`${hasUnsaved && isEditable ? '' : 'hidden'} px-3.5 py-1.5 rounded-lg text-[12px] font-medium border border-zinc-800 text-zinc-300 hover:text-zinc-100 bg-zinc-900/60 hover:bg-zinc-800 cursor-pointer transition-all`}
            >
              Discard
            </button>
            <button
              id="save-btn"
              onClick={handleSave}
              disabled={saving || !isEditable}
              className={`${hasUnsaved && isEditable ? '' : 'hidden'} px-4 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 shadow-lg bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/15 border border-violet-500/20 active:scale-[0.98] cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Icons.save />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </header>

        {/* ═══ NAVIGATION TABS ═══ */}
        <div className="bg-[#09090b]/40 border-b border-zinc-900 px-6 py-2.5 flex items-center justify-between shrink-0">
          <nav className="flex items-center gap-1">
            {(['overview', 'prompt', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-1.5 rounded-lg text-[12px] font-medium transition-all ${
                  activeTab === tab
                    ? 'text-zinc-100 font-semibold bg-zinc-900/80 border border-zinc-800/80'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'prompt' && 'System Prompt'}
                {tab === 'settings' && 'Settings'}
              </button>
            ))}
          </nav>
        </div>

        {/* ═══ WORKSPACE CONTAINER ═══ */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#07070a]">
          <div className="max-w-5xl mx-auto">

            {/* ── NO WORKSPACE ── */}
            {!activeWsId && !dataLoading && !dataError && (
              <div className="p-8 text-center">
                <p className="text-zinc-400 text-sm mb-2">No workspace selected.</p>
                <p className="text-zinc-500 text-[12px]">Add <code className="text-violet-400 font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-[11px]">?workspace_id=...</code> to the URL or navigate from the dashboard.</p>
              </div>
            )}

            {/* ── LOADING ── */}
            {dataLoading && (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 rounded-2xl bg-zinc-900/30 border border-zinc-800" />
              </div>
            )}

            {/* ── ERROR ── */}
            {dataError && !dataLoading && (
              <div className="p-8 text-center">
                <p className="text-zinc-400 text-sm mb-4">{dataError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-zinc-100"
                >
                  Retry
                </button>
              </div>
            )}

            {/* ── TAB 1: OVERVIEW ── */}
            {!dataLoading && !dataError && activeTab === 'overview' && (
              <div className="space-y-8">
                <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/30 p-8 shadow-xl">
                  <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-violet-600/10 blur-[100px] pointer-events-none" />
                  <div className="absolute -left-24 -bottom-24 h-96 w-96 rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 relative z-10">
                    <div className="space-y-4 max-w-2xl">
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400/80 font-medium">Model Name</div>
                          <h3 className="text-2xl md:text-3xl font-extrabold text-zinc-100 tracking-tight font-sans">
                            {draft.overview.name || 'Not available'}
                          </h3>
                        </div>
                        <div className="space-y-1.5">
                          <div className="text-[10px] font-mono uppercase tracking-wider text-violet-400/80 font-medium">Model Description</div>
                          <p className="text-[13px] md:text-[14px] text-zinc-300 leading-relaxed font-sans max-w-xl">
                            {draft.overview.description || 'Not available'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3 min-w-[240px]">
                      <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Server Type</span>
                        <span className="text-[13px] font-semibold text-zinc-200 mt-1 font-mono">
                          {model?.server_type ? model.server_type.charAt(0).toUpperCase() + model.server_type.slice(1) : 'Not available'}
                        </span>
                      </div>
                      <div className="bg-zinc-950/60 border border-zinc-800/80 p-3.5 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Context Window</span>
                        <span className="text-[13px] font-semibold text-zinc-200 mt-1 font-mono">
                          {draft.settings.maxContextWindow}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="my-6 border-t border-zinc-800/50" />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10 text-[12px]">
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <Icons.calendar />
                      <span>Last Updated: <strong className="text-zinc-300 font-semibold ml-1">{draft.overview.lastUpdated}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <Icons.fingerprint />
                      <span>Provider: <strong className="text-zinc-300 font-semibold ml-1">{draft.overview.provider || (model?.server_type ? model.server_type.charAt(0).toUpperCase() + model.server_type.slice(1) : 'Not available')}</strong></span>
                    </div>
                    <div className="flex items-center gap-2.5 text-zinc-400">
                      <Icons.info />
                      <span>Status: <strong className={`${statusBadgeColor} font-semibold uppercase tracking-wider font-mono text-[11px] ml-1`}>{draft.overview.status.charAt(0).toUpperCase() + draft.overview.status.slice(1)}</strong></span>
                    </div>
                  </div>
                  {myRole === 'admin' && (
                    <div className="mt-6 flex justify-end">
                      <button className="dash-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                        Test Endpoint
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TAB 2: SYSTEM PROMPT ── */}
            {!dataLoading && !dataError && activeTab === 'prompt' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-md font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      <Icons.terminal />
                      <span>System Persona &amp; Guardrails</span>
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">Absolute controller instructions passed down to all active user threads.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-500">TOKENS:</span>
                    <span className="bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded text-[11px] font-mono font-bold text-violet-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                      <span>{tokenCount.toLocaleString()}</span> / 32,768
                    </span>
                  </div>
                </div>

                {!isEditable && (
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[12px]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    <span>System Prompt is only editable by workspace owners and admins.</span>
                  </div>
                )}
                <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#0a0a0c] flex flex-col shadow-2xl relative">
                  <div className="bg-[#0f0f13] border-b border-zinc-800/80 px-4 flex items-center justify-between h-10">
                    <div className="flex items-center gap-1 h-full">
                      <div className="bg-[#0a0a0c] border-t border-t-violet-500 text-zinc-200 text-[12px] font-mono px-4 h-full flex items-center gap-2 border-r border-zinc-800/80">
                        <Icons.fileCode />
                        <span>system_instruction.md</span>
                        <span className="text-[9px] bg-zinc-800/60 text-zinc-500 px-1 rounded font-sans">SYS</span>
                      </div>

                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(draft.systemPrompt).then(
                            () => showToast('success', 'System prompt copied to clipboard.'),
                            () => showToast('alert', 'Clipboard error.'),
                          )
                        }}
                        title="Copy instructions"
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 rounded cursor-pointer transition-colors"
                      >
                        <Icons.copy />
                      </button>
                      <button
                        onClick={() => {
                          setDraft((prev) => ({ ...prev, systemPrompt: TEMPLATE_SYSTEM_PROMPT }))
                          showToast('alert', 'Reverted system prompt back to defaults.')
                        }}
                        title="Reset to template"
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 rounded cursor-pointer transition-colors"
                      >
                        <Icons.rotateCCW />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-1 min-h-[400px] font-mono text-[13px]">
                    <div className="w-11 bg-[#0d0d11]/40 py-4 border-r border-zinc-900 text-right pr-3 text-zinc-600 font-mono text-[11px] leading-6 shrink-0">
                      {Array.from({ length: 16 }, (_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>
                    <div className="flex-1 relative py-4">
                      <textarea
                        value={draft.systemPrompt}
                        onChange={(e) => setDraft((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                        readOnly={!isEditable}
                        className={`w-full h-full bg-transparent border-0 text-zinc-200 font-mono text-[13px] leading-6 resize-none focus:ring-0 focus:outline-none p-0 px-4 min-h-[380px] ${!isEditable ? 'cursor-not-allowed opacity-60' : ''}`}
                        placeholder="// Write prompt guardrails here..."
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl space-y-3 md:col-span-2">
                    <div className="flex items-center gap-1.5">
                      <Icons.braces />
                      <h4 className="text-[12px] font-bold text-zinc-200">Interactive Prompt Variables</h4>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans">
                      Click any context chip below to append it directly at your active text prompt.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {['company_name', 'language'].map((v) => (
                        <button
                          key={v}
                          onClick={() => insertPromptVar(v)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-violet-400 transition-all cursor-pointer"
                        >
                          <code>{`{{${v}}}`}</code>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl flex items-start gap-3 md:col-span-1">
                    <Icons.info />
                    <div className="space-y-1">
                      <h4 className="text-[12px] font-bold text-zinc-200">Guardrail Priority</h4>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                        System instructions supersede user prompts. Be absolute when implementing safety, validation formats, or logic boundaries.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: SETTINGS ── */}
            {!dataLoading && !dataError && activeTab === 'settings' && (
              <div className="space-y-10">

                {/* Model Profile Configuration */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      <Icons.userCog />
                      <span>Model Profile Configuration</span>
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">Configure model identifiers, active profiles, description summary, and provider metadata.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 bg-zinc-900/10 border border-zinc-800/80 p-8 rounded-2xl">
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-200">Model Name</label>
                      <input
                        type="text"
                        value={draft.overview.name}
                        onChange={(e) => updateOverviewField('name', e.target.value)}
                        disabled={!isEditable}
                        className={`w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] ${isEditable ? 'text-zinc-200 focus:border-violet-500' : 'text-zinc-500 cursor-not-allowed opacity-60'} font-sans`}
                        placeholder="Model Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-200">Version Tag</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={draft.overview.version}
                          disabled
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-500 font-mono cursor-not-allowed opacity-60"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-mono">read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-200">Provider / Organization</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={draft.overview.provider}
                          disabled
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-500 cursor-not-allowed opacity-60 font-sans"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-mono">read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-zinc-200">Active Deployment Status</label>
                      <div className="relative">
                        <select
                          value={draft.overview.status}
                          disabled
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-500 cursor-not-allowed opacity-60 font-sans"
                        >
                          <option value="active">Active</option>
                          <option value="idle">Idle</option>
                          <option value="offline">Offline</option>
                        </select>
                        <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-mono pointer-events-none">read-only</span>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[13px] font-semibold text-zinc-200">Model Description</label>
                      <div className="relative">
                        <textarea
                          value={draft.overview.description}
                          disabled
                          rows={3}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-500 cursor-not-allowed opacity-60 font-sans resize-none"
                          placeholder="Model Description"
                        />
                        <span className="absolute right-2 top-2 text-[9px] text-zinc-600 font-mono">read-only</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Infrastructure Parameters */}
                <div>
                  <h3 className="text-md font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                    <Icons.sliders />
                    <span>Infrastructure Parameters</span>
                  </h3>
                  <p className="text-[12px] text-zinc-400 mt-1">Tune networking, VRAM static allocation context, and server timeouts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 bg-zinc-900/10 border border-zinc-800/80 p-8 rounded-2xl">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Icons.clock />
                        <label className="text-[13px] font-semibold text-zinc-200">Model Timeout Limit</label>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/10">{draft.settings.timeout}s</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={300}
                      step={10}
                      value={draft.settings.timeout}
                      onChange={(e) => updateSetting('timeout', parseInt(e.target.value, 10))}
                      disabled={!isEditable}
                      className={`w-full h-1.5 bg-zinc-800 rounded-lg appearance-none accent-violet-500 ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
                    />
                    <p className="text-[11px] text-zinc-500">Maximum delay before the client terminates generation streams.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Icons.cpu />
                      <label className="text-[13px] font-semibold text-zinc-200">Max Context Window Allocation</label>
                    </div>
                    <div className="relative">
                      <select
                        value={draft.settings.maxContextWindow}
                        disabled
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[12px] text-zinc-500 cursor-not-allowed opacity-60"
                      >
                        <option value="8k">8,192 tokens (Low memory standby)</option>
                        <option value="32k">32,768 tokens (Recommended instruction depth)</option>
                        <option value="128k">131,072 tokens (Full Llama 3 Nexus context)</option>
                        <option value="1M">1,048,576 tokens (Extreme sequence depth)</option>
                      </select>
                      <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-mono pointer-events-none">read-only</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 font-sans">Sets GPU VRAM allocation boundaries on local hosts.</p>
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <div className="flex items-center gap-2">
                      <Icons.globe />
                      <label className="text-[13px] font-semibold text-zinc-200">Host Connection Endpoint</label>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={draft.settings.endpoint}
                        disabled
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-[12px] text-zinc-500 font-mono cursor-not-allowed opacity-60"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-zinc-600 font-mono">read-only</span>
                    </div>
                    <p className="text-[11px] text-zinc-500">Connection URI mapping back to Ollama API background daemon services.</p>
                  </div>
                </div>

                {/* Tools Configuration */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-md font-bold text-zinc-100 tracking-tight flex items-center gap-2">
                      <Icons.braces />
                      <span>Tools</span>
                    </h3>
                    <p className="text-[12px] text-zinc-400 mt-1">Enable the built-in tools that this model is allowed to expose.</p>
                  </div>

                  <div className="bg-zinc-900/10 border border-zinc-800/80 p-6 rounded-2xl space-y-4">
                    {BUILTIN_MODEL_TOOLS.map((tool) => {
                      const enabled = draft.tools[tool.id]
                      return (
                        <label
                          key={tool.id}
                          className={`flex items-start gap-3 p-3 rounded-xl bg-zinc-950/40 border border-zinc-800/60 transition-colors ${isEditable ? 'hover:border-zinc-700/60 cursor-pointer group' : 'cursor-not-allowed opacity-60'}`}
                        >
                          <div className="relative flex items-center justify-center pt-0.5">
                            <input
                              type="checkbox"
                              checked={enabled}
                              onChange={() => {
                                if (!isEditable) return
                                setDraft((prev) => ({
                                  ...prev,
                                  tools: { ...prev.tools, [tool.id]: !enabled },
                                }))
                              }}
                              className="peer sr-only"
                            />
                            <div
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                !isEditable
                                  ? 'border-zinc-700 bg-zinc-900/60'
                                  : enabled
                                    ? 'border-violet-500 bg-violet-600'
                                    : 'border-zinc-700 bg-zinc-900 group-hover:border-zinc-600'
                              }`}
                            >
                              {enabled && (
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={!isEditable ? 'opacity-60' : ''}>
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-zinc-200">{tool.label}</div>
                            <div className="text-[11px] text-zinc-500 mt-0.5">{tool.description}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Danger zone */}
                <div className="p-6 bg-red-950/10 border border-red-900/30 rounded-xl space-y-4">
                  <div className="flex items-center gap-2 text-red-400">
                    <Icons.alertTriangle />
                    <h4 className="text-[14px] font-bold">Danger Zone</h4>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-medium text-zinc-200">Delete Model</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5 max-w-xl">
                        Permanently remove this model from the workspace. Associated logs and queue
                        entries will also be removed. This action cannot be undone.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        const confirmed = window.confirm(
                          `Are you sure you want to delete "${draft.overview.name}"? This cannot be undone.`
                        )
                        if (!confirmed) return
                        deleteModel(activeWsId!, modelId!)
                          .then(() => {
                            showToast('success', 'Model deleted successfully.')
                            router.push('/dashboard/models')
                          })
                          .catch((err) => showToast('alert', getErrMsg(err)))
                      }}
                      className="border border-red-700/40 text-red-400 px-4 py-2 rounded-lg text-[12px] font-semibold shrink-0 hover:bg-red-950/30 transition"
                    >
                      Delete Model
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* ═══ FOOTER ═══ */}
        <footer className="h-9 bg-zinc-950 border-t border-zinc-800/80 px-6 flex items-center shrink-0 text-[10px] font-mono text-zinc-500 z-10">
          <div className="flex items-center gap-1.5">
            <span>&copy; 2026 PullO Infrastructure</span>
            <span>|</span>
            <span>v0.9.4-beta</span>
          </div>
        </footer>

        {/* ═══ FLOATING BUTTON ═══ */}
        <div className="fixed bottom-12 right-6 z-50">
          <button
            onClick={() => showToast('success', 'Cluster reports normal execution. Active instances: 1')}
            className="w-10 h-10 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg shadow-violet-500/20 flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-violet-400/20"
          >
            <Icons.network />
          </button>
        </div>

        {/* ═══ TOAST ═══ */}
        <div
          className={`${toast ? '' : 'hidden'} fixed bottom-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl max-w-md md-toast-visible`}
        >
          <span className={`${toast?.type === 'success' ? '' : 'hidden'} text-emerald-400`}>
            <Icons.check />
          </span>
          <span className={`${toast?.type === 'alert' ? '' : 'hidden'} text-amber-400`}>
            <Icons.alertCircle />
          </span>
          <span className="text-[12px] font-medium text-zinc-200">{toast?.message ?? ''}</span>
        </div>
      </main>
    </div>
  )
}
