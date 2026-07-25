'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWorkspace } from '@/lib/workspace-context'
import { getLogs, exportLogs, type LogEntry } from '@/lib/api'
import { ScrollPagination } from '@/registry/ruixenui/scroll-pagination'
import './logs.css'

function timeAgo(date: string): string {
  const now = Date.now()
  const then = new Date(date).getTime()
  const sec = Math.floor((now - then) / 1000)
  if (sec < 60) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

function badgeClass(status: number) { return 'log-badge-' + status }

export default function DashboardLogsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  /* ── Workspace ── */
  const { activeWsId, setActiveWsId, workspaces } = useWorkspace()
  const fromParam = searchParams.get('workspace_id')

  useEffect(() => {
    if (!authLoading && !user) { router.replace('/login'); return }
  }, [authLoading, user, router])

  const workspaceId = fromParam || activeWsId || workspaces[0]?.id || ''

  /* ── Logs data ── */
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [totalLogs, setTotalLogs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  /* ── Filters ── */
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('newest')
  const [dateLabel, setDateLabel] = useState('Last 7 Days')
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false)

  /* ── Custom select dropdowns ── */
  const [openSelect, setOpenSelect] = useState<string | null>(null)

  /* ── Retention banner ── */
  const [bannerVisible, setBannerVisible] = useState(true)

  const toggleSelect = useCallback((name: string) => {
    setOpenSelect((prev) => (prev === name ? null : name))
  }, [])

  const selectOption = useCallback((name: string, value: string) => {
    if (name === 'status') setStatusFilter(value)
    else if (name === 'sort') setSortFilter(value || 'newest')
    else if (name === 'rowsPerPage') {
      setRowsPerPage(Number(value))
      setCurrentPage(1)
    }
    setOpenSelect(null)
  }, [])

  /* ── Fetch logs ── */
  const fetchLogs = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError('')
    try {
      const data = await getLogs(workspaceId, {
        limit: rowsPerPage,
        offset: (currentPage - 1) * rowsPerPage,
        status_code: statusFilter ? Number(statusFilter) : undefined,
      })
      setLogs(data.logs)
      setTotalLogs(data.total)
    } catch (e: any) {
      setError(e.message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, rowsPerPage, currentPage, statusFilter])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  /* ── Date presets ── */
  const datePresets = ['Today', 'Last 7 Days', 'Last 30 Days']
  const [activeDatePreset, setActiveDatePreset] = useState('Last 7 Days')

  const setDateRange = useCallback((label: string) => {
    setDateLabel(label)
    setActiveDatePreset(label)
    setDateDropdownOpen(false)
  }, [])

  /* ── Client-side search, date & sort filter ── */
  const filteredLogs = useMemo(() => {
    let result = [...logs]

    // Date filter
    if (activeDatePreset !== 'All Time') {
      const now = Date.now()
      const ms = activeDatePreset === 'Today'
        ? 86400000
        : activeDatePreset === 'Last 7 Days'
          ? 604800000
          : activeDatePreset === 'Last 30 Days'
            ? 2592000000
            : 0
      if (ms) {
        const cutoff = now - ms
        result = result.filter((log) => new Date(log.created_at ?? '').getTime() >= cutoff)
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((log) => {
        const modelName = (log as any).model_id?.name || ''
        if (log.id.toLowerCase().includes(q)) return true
        if (modelName.toLowerCase().includes(q)) return true
        if (String(log.status_code ?? log.status ?? '').includes(q)) return true
        return false
      })
    }

    // Sort
    if (sortFilter === 'oldest') {
      result.reverse()
    }

    return result
  }, [logs, searchQuery, sortFilter, activeDatePreset])

  const totalPages = Math.max(1, Math.ceil(totalLogs / rowsPerPage))

  /* ── Drawer ── */
  const [drawerLog, setDrawerLog] = useState<LogEntry | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [copiedRawJson, setCopiedRawJson] = useState(false)

  const openDrawer = useCallback((log: LogEntry) => {
    setDrawerLog(log)
    setDrawerOpen(true)
    setCopiedRawJson(false)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setTimeout(() => setDrawerLog(null), 300)
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [closeDrawer])

  const copyRawJson = useCallback(() => {
    if (!drawerLog) return
    navigator.clipboard?.writeText(JSON.stringify(drawerLog, null, 2)).then(() => {
      setCopiedRawJson(true)
      setTimeout(() => setCopiedRawJson(false), 1600)
    })
  }, [drawerLog])

  const downloadJson = useCallback((log: LogEntry) => {
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = log.id + '.json'
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
  }, [])

  const exportCsv = useCallback(async () => {
    if (!workspaceId) return
    try {
      const blob = await exportLogs(workspaceId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'pullo-logs-export.csv'
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.warn('export failed', e)
    }
  }, [workspaceId])

  /* ── Row menus ── */
  const [openRowMenuIdx, setOpenRowMenuIdx] = useState<number | null>(null)

  const toggleRowMenu = useCallback((e: React.MouseEvent, idx: number) => {
    e.stopPropagation()
    setOpenRowMenuIdx((prev) => (prev === idx ? null : idx))
  }, [])

  useEffect(() => {
    if (openRowMenuIdx === null) return
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.row-action-cell')) setOpenRowMenuIdx(null)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openRowMenuIdx])

  /* ── Reset filters ── */
  const [resetting, setResetting] = useState(false)

  const resetFilters = useCallback(() => {
    setResetting(true)
    setSearchQuery('')
    setStatusFilter('')
    setSortFilter('newest')
    setDateLabel('Last 7 Days')
    setActiveDatePreset('Last 7 Days')
    setCurrentPage(1)
    setTimeout(() => setResetting(false), 600)
  }, [])

  /* ── Close dropdowns on outside click ── */
  useEffect(() => {
    if (openSelect === null && !dateDropdownOpen) return
    const handler = () => {
      setOpenSelect(null)
      setDateDropdownOpen(false)
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [openSelect, dateDropdownOpen])

  const selectConfigs = [
    { name: 'status', label: statusFilter ? statusFilter : 'Status: All', options: [
      { value: '', label: 'Status: All' },
      { value: '200', label: '200' }, { value: '201', label: '201' },
      { value: '400', label: '400' }, { value: '401', label: '401' },
      { value: '403', label: '403' }, { value: '404', label: '404' },
      { value: '429', label: '429' }, { value: '500', label: '500' },
    ]},
    { name: 'sort', label: sortFilter === 'oldest' ? 'Oldest first' : 'Newest first', options: [
      { value: 'newest', label: 'Newest first' },
      { value: 'oldest', label: 'Oldest first' },
    ]},
  ]

  if (authLoading || !user) return null

  return (
    <div className="logs-page" style={{ position: 'relative', minHeight: '100vh' }}>
      {/* Ambient background artwork */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      {/* Top section (no sidebar — comes from dashboard layout) */}
      <div style={{ padding: '28px 28px 0', maxWidth: 1500, position: 'relative', zIndex: 1 }}>
        {/* Retention banner */}
        {bannerVisible && (
          <div className="dash-fade-up dash-delay-1 log-banner" style={{ marginBottom: 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, background: 'rgba(124,58,237,0.14)', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-md)', lineHeight: 1.5 }}>
                Logs are retained for <strong style={{ color: 'var(--text-hi)', fontWeight: 600 }}>30 days</strong> based on your current plan.
              </p>
            </div>
            <button className="log-icon-btn" onClick={() => setBannerVisible(false)} title="Dismiss" style={{ flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}

        {/* Filter bar */}
        <div className="dash-card dash-fade-up dash-delay-2" style={{ padding: '16px 18px', marginBottom: 20, position: 'relative', zIndex: 300, overflow: 'visible', background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2" style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1) }}
                placeholder="Search request ID, model, status…"
                className="log-field-input"
                style={{ width: '100%', paddingLeft: 32, color: '#000', background: '#fff', caretColor: '#000' }}
              />
            </div>

            {/* Custom selects */}
            {selectConfigs.map((cfg) => (
              <div key={cfg.name} className={`log-custom-select${openSelect === cfg.name ? ' open' : ''}`} onClick={(e) => e.stopPropagation()}>
                <button className="log-custom-select-trigger" onClick={() => toggleSelect(cfg.name)}>
                  <span className="log-custom-select-label">{cfg.label}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {openSelect === cfg.name && (
                  <div className="log-custom-select-dropdown open">
                    {cfg.options.map((opt) => {
                      const isActive = cfg.name === 'status' ? statusFilter === opt.value
                        : sortFilter === opt.value
                      return (
                        <div
                          key={opt.value}
                          className={`log-custom-select-option${isActive ? ' active' : ''}`}
                          onClick={() => selectOption(cfg.name, opt.value)}
                        >
                          {opt.label}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Date range */}
            <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
              <button
                className="log-field-input"
                onClick={() => setDateDropdownOpen((o) => !o)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-md)" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span>{dateLabel}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {dateDropdownOpen && (
                <div className="log-date-dropdown open">
                  {datePresets.map((p) => (
                    <div key={p} className={`log-date-item${activeDatePreset === p ? ' active' : ''}`} onClick={() => setDateRange(p)}>{p}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Reset */}
            <button className="dash-btn-ghost" onClick={resetFilters}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={resetting ? 'log-reset-spinning' : ''} style={{ transformOrigin: 'center' }}><path d="M1 4v6h6"/><path d="M23 20v-6h-6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
              Reset Filters
            </button>

            {/* Export */}
            <button className="dash-btn-primary" onClick={exportCsv} style={{ padding: '10px 18px', fontSize: 13 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
          </div>
        </div>

        {/* ── Logs table card ── */}
        <div className="dash-card dash-fade-up dash-delay-3 logs-card" style={{ overflow: 'hidden', marginBottom: 20, background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>Request Log</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11, fontWeight: 600, color: '#A78BFA' }}>{filteredLogs.length} requests</span>
          </div>

          {loading ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8" className="log-reset-spinning"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-md)' }}>Loading logs…</p>
            </div>
          ) : error ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6, letterSpacing: '-0.01em' }}>Failed to load logs</h3>
              <p style={{ fontSize: 13, color: 'var(--text-md)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6 }}>{error}</p>
              <button className="dash-btn-primary" style={{ padding: '10px 18px', fontSize: 13 }} onClick={fetchLogs}>
                Retry
              </button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: '64px 20px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="1.8"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-hi)', marginBottom: 6, letterSpacing: '-0.01em' }}>No logs found</h3>
              <p style={{ fontSize: 13, color: 'var(--text-md)', marginBottom: 24, maxWidth: 340, margin: '0 auto 24px', lineHeight: 1.6 }}>No requests match your current filters.</p>
              <button className="dash-btn-ghost" onClick={resetFilters}>Clear Filters</button>
            </div>
          ) : (
            <div className="logs-table-wrap" style={{ overflowX: 'auto' }}>
              <table className="logs-table">
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', paddingLeft: 24 }}>Request ID</th>
                    <th style={{ textAlign: 'left' }}>Time</th>
                    <th style={{ textAlign: 'left' }}>Model</th>
                    <th style={{ textAlign: 'left' }}>Status</th>
                    <th style={{ textAlign: 'left' }}>Latency</th>
                    <th style={{ textAlign: 'left' }}>Tokens</th>
                    <th style={{ textAlign: 'right', paddingRight: 24 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, idx) => {
                    const modelName = (log as any).model_id?.name || log.model_name || ''
                    const status = log.status_code ?? log.status ?? 0
                    const statusVal = typeof status === 'number' ? status : parseInt(status, 10) || 0
                    return (
                      <tr key={log.id}>
                        <td style={{ paddingLeft: 24 }}><span style={{ fontFamily: "'Geist Mono','Geist Mono Fallback',monospace", fontSize: 12, color: 'var(--text-hi)' }}>{log.id.slice(0, 8)}…</span></td>
                        <td><span style={{ fontSize: 12.5, color: 'var(--text-md)' }}>{timeAgo(log.created_at)}</span></td>
                        <td><span style={{ fontSize: 12.5, color: 'var(--text-md)' }}>{modelName || '—'}</span></td>
                        <td><span className={`log-badge ${badgeClass(statusVal)}`}><span className="log-badge-dot"></span>{statusVal}</span></td>
                        <td><span style={{ fontSize: 12.5, color: 'var(--text-md)', fontVariantNumeric: 'tabular-nums' }}>{log.latency_ms ?? 0} ms</span></td>
                        <td><span style={{ fontSize: 12.5, color: 'var(--text-md)', fontVariantNumeric: 'tabular-nums' }}>{(log.token_count ?? 0).toLocaleString()}</span></td>
                        <td style={{ paddingRight: 24 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2, position: 'relative' }} className="row-action-cell">
                            <button className="log-icon-btn" title="View Details" onClick={() => openDrawer(log)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            <button className="log-icon-btn" title="Download JSON" onClick={() => downloadJson(log)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            </button>
                            <button className="log-icon-btn" title="More" onClick={(e) => toggleRowMenu(e, idx)}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/></svg>
                            </button>
                            <div className={`log-row-menu${openRowMenuIdx === idx ? ' open' : ''}`}>
                              <div className="log-row-menu-item" onClick={() => { openDrawer(log); setOpenRowMenuIdx(null) }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                View Details
                              </div>
                              <div className="log-row-menu-item" onClick={() => { downloadJson(log); setOpenRowMenuIdx(null) }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                Download JSON
                              </div>
                              <div className="log-row-menu-item" onClick={() => { navigator.clipboard?.writeText(log.id); setOpenRowMenuIdx(null) }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                                Copy Request ID
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {filteredLogs.length > 0 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>
                Showing {(currentPage - 1) * rowsPerPage + 1}–{Math.min(currentPage * rowsPerPage, totalLogs)} of {totalLogs} log{totalLogs !== 1 ? 's' : ''}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>Rows per page</span>
                  <div className={`log-custom-select${openSelect === 'rowsPerPage' ? ' open' : ''}`} style={{ minWidth: 70 }} onClick={(e) => e.stopPropagation()}>
                    <button className="log-custom-select-trigger" onClick={() => toggleSelect('rowsPerPage')} style={{ padding: '6px 10px', fontSize: 12 }}>
                      <span className="log-custom-select-label">{rowsPerPage}</span>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {openSelect === 'rowsPerPage' && (
                      <div className="log-custom-select-dropdown open" style={{ minWidth: 80 }}>
                        {[10, 25, 50, 100].map((n) => (
                          <div key={n} className={`log-custom-select-option${rowsPerPage === n ? ' active' : ''}`} onClick={() => selectOption('rowsPerPage', String(n))}>
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ minWidth: 180, display: 'flex', justifyContent: 'center' }}>
                  <ScrollPagination
                    totalPages={totalPages}
                    currentPage={currentPage}
                    onPageChange={(page) => setCurrentPage(page)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ DRAWER ═══ */}
      <div className={`log-drawer-overlay${drawerOpen ? ' open' : ''}`} onClick={closeDrawer} />
      <div className={`log-drawer${drawerOpen ? ' open' : ''}`}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,rgba(124,58,237,0.3),rgba(79,70,229,0.2))', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C4B5FD" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <h3 style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--text-hi)' }}>Request Details</h3>
              <p style={{ fontSize: 11, color: 'var(--text-lo)', fontFamily: "'Geist Mono','Geist Mono Fallback',monospace", marginTop: 1 }}>{drawerLog?.id ? drawerLog.id.slice(0, 8) + '…' : '-'}</p>
            </div>
          </div>
          <button className="log-icon-btn" onClick={closeDrawer} style={{ width: 28, height: 28 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {drawerLog && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div className="log-drawer-section">
              <div className="log-drawer-eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                Request Information
              </div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Request ID</span><span className="log-drawer-row-value" style={{ fontFamily: "'Geist Mono','Geist Mono Fallback',monospace", fontSize: 11 }}>{drawerLog.id}</span></div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Timestamp</span><span className="log-drawer-row-value">{timeAgo(drawerLog.created_at)}</span></div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Model</span><span className="log-drawer-row-value">{(drawerLog as any).model_id?.name || drawerLog.model_name || '—'}</span></div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Key ID</span><span className="log-drawer-row-value" style={{ fontFamily: "'Geist Mono','Geist Mono Fallback',monospace", fontSize: 11 }}>{drawerLog.key_id ? drawerLog.key_id.slice(0, 12) + '…' : '—'}</span></div>
            </div>

            <div className="log-drawer-section">
              <div className="log-drawer-eyebrow">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                Response
              </div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Status</span><span className="log-drawer-row-value"><span className={`log-badge ${badgeClass(Number(drawerLog.status_code ?? drawerLog.status ?? 0))}`}><span className="log-badge-dot"></span>{drawerLog.status_code ?? drawerLog.status ?? '—'}</span></span></div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Latency</span><span className="log-drawer-row-value">{drawerLog.latency_ms ?? 0} ms</span></div>
              <div className="log-drawer-row"><span className="log-drawer-row-label">Token Usage</span><span className="log-drawer-row-value">{(drawerLog.token_count ?? 0).toLocaleString()} tokens</span></div>
              {drawerLog.tools_used && (drawerLog.tools_used as string[]).length > 0 && (
                <div className="log-drawer-row"><span className="log-drawer-row-label">Tools Used</span><span className="log-drawer-row-value">{(drawerLog.tools_used as string[]).join(', ')}</span></div>
              )}
            </div>

            <div className="log-drawer-section" style={{ borderBottom: 'none' }}>
              <div className="log-drawer-eyebrow" style={{ justifyContent: 'space-between' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Raw JSON
                </span>
                <button onClick={copyRawJson} style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 6, padding: '4px 10px', fontSize: 10.5, fontWeight: 600, color: copiedRawJson ? '#34D399' : '#A78BFA', cursor: 'pointer', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  {copiedRawJson ? 'Copied' : 'Copy JSON'}
                </button>
              </div>
              <div className="log-code-block" style={{ maxHeight: 220 }}>
                {JSON.stringify(drawerLog, null, 2)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
