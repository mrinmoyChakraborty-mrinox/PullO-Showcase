'use client'

import { useState, useEffect, useCallback } from 'react'
import { track } from '@/lib/metrics'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  getDashboardMetrics,
  listModels,
  getRecentRequests,
  getUsageData,
  type Model,
  type RecentRequest,
  type UsageBucket,
  type DashboardMetrics,
} from '@/lib/api'
import { useWorkspace } from '@/lib/workspace-context'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login')
  }, [authLoading, user, router])

  const [refreshingModels, setRefreshingModels] = useState(false)
  const [refreshingRequests, setRefreshingRequests] = useState(false)
  const [reconnectingModelId, setReconnectingModelId] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copyKey = useCallback((key: string) => {
    navigator.clipboard?.writeText(key).then(() => {
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 1800)
    })
  }, [])

  const { activeWsId, myRole } = useWorkspace()
  const isOwnerOrAdmin = myRole === 'owner' || myRole === 'admin'
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  const handleRefreshModels = useCallback(() => {
    if (!activeWsId || refreshingModels) return
    setRefreshingModels(true)
    listModels(activeWsId).then(setModels).catch(() => {}).finally(() => setRefreshingModels(false))
  }, [activeWsId, refreshingModels])
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [models, setModels] = useState<Model[]>([])
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [usageData, setUsageData] = useState<UsageBucket[]>([])
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)

  const [extConnected, setExtConnected] = useState(false)
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source === 'pullo-extension' || event.data?.source === 'pullo-extension-event') {
        setExtConnected(true)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const modelCards = models.map((m) => {
    const isOnline = m.status === 'online'
    const accent = isOnline ? '#7C3AED' : '#F43F5E'
    return {
      ...m,
      apiKey: m.client_id ? `sk-${m.client_id.slice(0, 8)}••` : '',
      heroGradient: isOnline
        ? 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(79,70,229,0.08) 100%)'
        : 'linear-gradient(135deg,rgba(244,63,94,0.08) 0%,rgba(239,68,68,0.04) 100%)',
      heroAccent: accent,
      glyphStroke: isOnline ? '#C4B5FD' : '#FB7185',
      stats: {
        requests: m.stats?.requests ?? 0,
        avgLatency: m.stats?.avg_latency_ms != null ? `${m.stats.avg_latency_ms}ms` : '—',
        uptime: m.stats?.error_count != null ? `${Math.max(0, 100 - m.stats.error_count)}%` : '—',
      },
    }
  })

  useEffect(() => {
    if (!activeWsId) return
    track('dashboard.page_view', 1, { workspace_id: activeWsId })
    setDataLoading(true)
    setDataError(null)
    Promise.all([
      getDashboardMetrics(activeWsId).then(setMetrics),
      listModels(activeWsId).then(setModels),
      getRecentRequests(activeWsId).then(setRecentRequests),
      getUsageData(activeWsId).then(setUsageData),
    ]).catch((err) => {
      console.warn('failed to load workspace data', err)
      setDataError(err instanceof Error ? err.message : String(err))
    }).finally(() => setDataLoading(false))
  }, [activeWsId])

  if (authLoading || !user) return null

  if (dataError) {
    const isConnectionError = dataError.includes('fetch') || dataError.includes('NetworkError') || dataError.includes('Failed to fetch')
    return (
      <div style={{ padding: '48px 28px', textAlign: 'center', maxWidth: 500, margin: '0 auto' }}>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#FB7185', marginBottom: 4 }}>
          {isConnectionError ? 'Cannot reach the PullO backend' : 'Could not load dashboard data'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-lo)', marginBottom: 16, lineHeight: 1.5 }}>
          {isConnectionError
            ? 'Make sure the PullO backend server is running on port 8000 and refresh the page.'
            : dataError}
        </div>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 20px', borderRadius: 8, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-md)', cursor: 'pointer', fontSize: 13 }}>Retry</button>
      </div>
    )
  }

  const activeModels = modelCards.filter((m) => m.status === 'online').length

  return (
    <div style={{ position: 'relative', minHeight: '100vh', padding: '28px 28px 48px', maxWidth: 1440 }}>
      {/* Ambient background artwork */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',         opacity: 0.28, mixBlendMode: 'screen',
        backgroundImage: 'url(/images/bg-network.png)',
        backgroundSize: 'cover', backgroundPosition: 'right center', backgroundRepeat: 'no-repeat',
        filter: 'blur(8px)', WebkitFilter: 'blur(8px)',
        maskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 70% 50%, black 20%, transparent 80%)',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <div className="dash-card dash-card-lift dash-metric-card dash-fade-up dash-delay-1" style={{ padding: 20 }}>
          <div className="dash-metric-glow" style={{ background: 'var(--violet)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Requests Today</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {metrics?.requestsToday.toLocaleString() || '—'}
          </div>
          {metrics && metrics.requestsToday > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><polyline points="18 15 12 9 6 15" /></svg>
              <span style={{ fontSize: 12, color: '#34D399', fontWeight: 500 }}>{metrics.requestsChange}%</span>
              <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>from yesterday</span>
            </div>
          )}
          <svg className="dash-sparkline" viewBox="0 0 120 36" style={{ width: '100%', height: 36, marginTop: 12 }}>
            <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7C3AED" stopOpacity="0.3" /><stop offset="100%" stopColor="#7C3AED" stopOpacity="0" /></linearGradient></defs>
            <path className="dash-sparkline-fill" d="M0,28 C10,24 20,20 30,22 C40,24 50,16 60,12 C70,8 80,14 90,10 C100,6 110,4 120,2 L120,36 L0,36 Z" fill="url(#g1)" />
            <path className="dash-sparkline-path" d="M0,28 C10,24 20,20 30,22 C40,24 50,16 60,12 C70,8 80,14 90,10 C100,6 110,4 120,2" stroke="#7C3AED" />
          </svg>
        </div>

        <div className="dash-card dash-card-lift dash-metric-card dash-fade-up dash-delay-2" style={{ padding: 20, background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="dash-metric-glow" style={{ background: 'var(--cyan)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Active Models</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22D3EE" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', lineHeight: 1 }}>{activeModels}</div>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 6 }}>Running on local models</div>
          <svg className="dash-sparkline" viewBox="0 0 120 36" style={{ width: '100%', height: 36, marginTop: 12 }}>
            <defs><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#06B6D4" stopOpacity="0.3" /><stop offset="100%" stopColor="#06B6D4" stopOpacity="0" /></linearGradient></defs>
            <path className="dash-sparkline-fill" d="M0,32 L20,32 L30,20 L40,20 L60,20 L70,8 L80,8 L90,8 L120,8 L120,36 L0,36 Z" fill="url(#g2)" />
            <path className="dash-sparkline-path" d="M0,32 L20,32 L30,20 L40,20 L60,20 L70,8 L80,8 L90,8 L120,8" stroke="#06B6D4" />
          </svg>
        </div>

        <div className="dash-card dash-card-lift dash-metric-card dash-fade-up dash-delay-3" style={{ padding: 20, background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="dash-metric-glow" style={{ background: 'var(--emerald)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>API Keys</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /></svg>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-hi)', letterSpacing: '-0.03em', lineHeight: 1 }}>{metrics?.apiKeys || '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 6 }}>{metrics?.apiKeysActive || 0} active this hour</div>
          <svg className="dash-sparkline" viewBox="0 0 120 36" style={{ width: '100%', height: 36, marginTop: 12 }}>
            <defs><linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity="0.3" /><stop offset="100%" stopColor="#10B981" stopOpacity="0" /></linearGradient></defs>
            <path className="dash-sparkline-fill" d="M0,24 C15,24 25,20 40,18 C55,16 65,14 80,12 C95,10 105,8 120,6 L120,36 L0,36 Z" fill="url(#g3)" />
            <path className="dash-sparkline-path" d="M0,24 C15,24 25,20 40,18 C55,16 65,14 80,12 C95,10 105,8 120,6" stroke="#10B981" />
          </svg>
        </div>

        <div className="dash-card dash-card-lift dash-metric-card dash-fade-up dash-delay-4" style={{ padding: 20, background: 'var(--glass)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}>
          <div className="dash-metric-glow" style={{ background: 'var(--rose)' }} />
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-lo)' }}>Avg Latency</div>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(244,63,94,0.12)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            </div>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: metrics?.avgLatency ? 'var(--text-hi)' : 'var(--text-lo)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
            {metrics?.avgLatency ? `${metrics.avgLatency.toFixed(1)}s` : '—'}
          </div>
          {metrics?.avgLatency ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={metrics.latencyChange > 0 ? '#FB7185' : '#34D399'} strokeWidth="2.5">
                <polyline points={metrics.latencyChange > 0 ? '18 15 12 9 6 15' : '6 9 12 15 18 9'} />
              </svg>
              <span style={{ fontSize: 12, color: metrics.latencyChange > 0 ? '#FB7185' : '#34D399', fontWeight: 500 }}>{metrics.latencyChange}s</span>
              <span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{metrics.latencyChange > 0 ? 'spike detected' : 'from baseline'}</span>
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-lo)', marginTop: 6 }}>No requests yet</div>
          )}
          <svg className="dash-sparkline" viewBox="0 0 120 36" style={{ width: '100%', height: 36, marginTop: 12 }}>
            <defs><linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F43F5E" stopOpacity="0.3" /><stop offset="100%" stopColor="#F43F5E" stopOpacity="0" /></linearGradient></defs>
            <path className="dash-sparkline-fill" d="M0,20 C10,18 20,16 30,14 C40,12 50,18 60,16 C70,14 80,6 90,8 C100,10 110,14 120,10 L120,36 L0,36 Z" fill="url(#g4)" />
            <path className="dash-sparkline-path" d="M0,20 C10,18 20,16 30,14 C40,12 50,18 60,16 C70,14 80,6 90,8 C100,10 110,14 120,10" stroke="#F43F5E" />
          </svg>
        </div>
      </div>

      <div className="dash-fade-up dash-delay-5" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.01em' }}>{isOwnerOrAdmin ? 'Your Models' : 'Workspace models'}</h2>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 99, background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)', fontSize: 11, fontWeight: 600, color: '#A78BFA' }}>{activeModels} Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleRefreshModels}
              disabled={refreshingModels}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: 7,
                width: 30,
                height: 30,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: refreshingModels ? 'not-allowed' : 'pointer',
                color: 'var(--text-lo)',
                opacity: refreshingModels ? 0.5 : 1,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { if (!refreshingModels) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--text-hi)' } }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-lo)' }}
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: refreshingModels ? 'spin 0.6s linear infinite' : 'none' }}
              >
                <path d="M1 4v6h6" />
                <path d="M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
              </svg>
            </button>
            <Link
              href="/dashboard/models"
              style={{ fontSize: 13, color: '#A78BFA', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, transition: 'gap 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = '7px')}
              onMouseLeave={(e) => (e.currentTarget.style.gap = '4px')}
            >
              View all models
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            </Link>
          </div>
        </div>

        {modelCards.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-lo)', maxWidth: 500 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.35, marginBottom: 14 }}>
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-md)', marginBottom: 4 }}>No models connected</div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>Install the PullO Extension, register a model, and it will appear here.</div>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {modelCards.map((model) => (
            <div
              key={model.id}
              className="dash-card dash-card-lift"
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', ...(model.status === 'offline' ? { opacity: 0.7 } : {}) }}
              onClick={() => router.push(`/dashboard/models/${model.id}?workspace_id=${activeWsId}`)}
              onMouseEnter={(e) => { if (model.status === 'offline') e.currentTarget.style.opacity = '1' }}
              onMouseLeave={(e) => { if (model.status === 'offline') e.currentTarget.style.opacity = '0.7' }}
            >
              <div className="dash-model-hero" style={{ background: model.heroGradient, borderBottom: '1px solid var(--border)' }}>
                <div className="dash-model-hero-grid" />
                <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: `1px solid ${model.status === 'online' ? 'rgba(124,58,237,0.15)' : 'rgba(244,63,94,0.1)'}`, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', border: `1px solid ${model.status === 'online' ? 'rgba(124,58,237,0.1)' : 'rgba(244,63,94,0.07)'}`, pointerEvents: 'none' }} />
                <div
                  className="dash-model-glyph"
                  style={{
                    background: model.status === 'online' ? 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(79,70,229,0.2))' : 'linear-gradient(135deg,rgba(244,63,94,0.18),rgba(239,68,68,0.12))',
                    border: `1px solid ${model.status === 'online' ? 'rgba(124,58,237,0.3)' : 'rgba(244,63,94,0.25)'}`,
                    boxShadow: model.status === 'online' ? '0 0 30px rgba(124,58,237,0.25)' : undefined,
                  }}
                >
                  {model.status === 'online' ? (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={model.glyphStroke} strokeWidth="1.5">
                      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                    </svg>
                  ) : (
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={model.glyphStroke} strokeWidth="1.5">
                      <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
                    </svg>
                  )}
                </div>
              </div>

              <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-hi)', letterSpacing: '-0.01em', fontFamily: "'Geist Mono', 'Geist Mono Fallback', monospace" }}>{model.name}</div>
                  <div className={`dash-status-badge ${model.status === 'online' ? 'dash-status-online' : 'dash-status-offline'}`} style={{ marginTop: 5 }}>
                    <span className={`dash-status-dot ${model.status === 'online' ? 'dash-dot-online' : 'dash-dot-offline'}`} />
                    {model.status === 'online' ? 'Online' : 'Offline'}
                  </div>
                </div>
              </div>

              {isOwnerOrAdmin ? (
                <>
                  {model.status === 'online' ? (
                    <>
                      <div style={{ padding: '12px 16px' }}>
                        <div className="dash-api-key-chip">
                          <span>{model.apiKey}</span>
                          <button
                            onClick={() => copyKey(model.apiKey)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: copiedKey === model.apiKey ? '#34D399' : 'var(--text-lo)', padding: 2, borderRadius: 4, transition: 'color 0.15s' }}
                            onMouseEnter={(e) => { if (copiedKey !== model.apiKey) e.currentTarget.style.color = '#A78BFA' }}
                            onMouseLeave={(e) => { if (copiedKey !== model.apiKey) e.currentTarget.style.color = 'var(--text-lo)' }}
                          >
                            {copiedKey === model.apiKey ? (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>
                            ) : (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
                        <button className="dash-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                          Test Endpoint
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center', gap: 12 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="1.8">
                            <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" /><path d="M8 2v16" /><path d="M16 6v16" />
                          </svg>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-hi)', marginBottom: 4 }}>Local model disconnected</div>
                          <div style={{ fontSize: 12, color: 'var(--text-lo)', lineHeight: 1.5, maxWidth: 200 }}>Ensure the PullO Extension is connected and the model is reachable on port 11434.</div>
                        </div>
                      </div>
                      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                        <button
                          className="dash-btn-danger"
                          onClick={() => {
                            if (!activeWsId || reconnectingModelId === model.id) return
                            setReconnectingModelId(model.id)
                            listModels(activeWsId).then(setModels).catch(() => {}).finally(() => setReconnectingModelId(null))
                          }}
                          disabled={reconnectingModelId === model.id}
                          style={{ opacity: reconnectingModelId === model.id ? 0.6 : 1, cursor: reconnectingModelId === model.id ? 'not-allowed' : 'pointer' }}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: reconnectingModelId === model.id ? 'spin 0.6s linear infinite' : 'none' }}>
                            <path d="M1 4v6h6" /><path d="M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                          </svg>
                          {reconnectingModelId === model.id ? 'Reconnecting…' : 'Reconnect Model'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div style={{ padding: '12px 16px' }}>
                    <div className="dash-api-key-chip" style={{ fontFamily: "'Geist Mono', 'Geist Mono Fallback', monospace", fontSize: 12, color: 'var(--text-md)' }}>
                      {backendUrl}/v1/chat/completions
                    </div>
                  </div>
                  <div style={{ padding: '12px 16px', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
                    <button className="dash-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                      View Details
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
        )}
      </div>

      <div className="dash-fade-up dash-delay-6" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, alignItems: 'start' }}>
        <div className="dash-card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-lo)" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-hi)' }}>Recent Requests</h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <a href="#" style={{ fontSize: 12, color: '#A78BFA', fontWeight: 500, textDecoration: 'none' }}>View all →</a>
              <button
                onClick={() => {
                  if (!activeWsId || refreshingRequests) return
                  setRefreshingRequests(true)
                  getRecentRequests(activeWsId).then(setRecentRequests).catch(() => {}).finally(() => setRefreshingRequests(false))
                }}
                disabled={refreshingRequests}
                style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: refreshingRequests ? 'not-allowed' : 'pointer', color: 'var(--text-lo)', opacity: refreshingRequests ? 0.5 : 1, transition: 'all 0.15s' }}
                onMouseEnter={(e) => { if (!refreshingRequests) { e.currentTarget.style.borderColor = 'var(--border-hi)'; e.currentTarget.style.color = 'var(--text-md)' } }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-lo)' }}
                title="Refresh"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: refreshingRequests ? 'spin 0.6s linear infinite' : 'none' }}><path d="M1 4v6h6" /><path d="M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
              </button>
            </div>
          </div>
          {recentRequests.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-lo)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4, marginBottom: 12 }}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-md)', marginBottom: 4 }}>No requests yet</div>
              <div style={{ fontSize: 12 }}>Send your first API request to see activity here.</div>
            </div>
          ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-data-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', paddingLeft: 20 }}>Model</th>
                  <th style={{ textAlign: 'left' }}>Method</th>
                  <th style={{ textAlign: 'left' }}>Latency</th>
                  <th style={{ textAlign: 'left' }}>Status</th>
                  <th style={{ textAlign: 'left' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((req, i) => (
                  <tr key={i}>
                    <td style={{ paddingLeft: 20 }}><span style={{ fontFamily: "'Geist Mono', 'Geist Mono Fallback', monospace", fontSize: 12, color: 'var(--text-hi)' }}>{req.model}</span></td>
                    <td><span className={`dash-method-badge ${req.method === 'CHAT_COMPLETION' ? 'dash-method-chat' : 'dash-method-embed'}`}>{req.method}</span></td>
                    <td><span style={{ fontSize: 13, color: req.latency === '—' ? 'var(--text-lo)' : 'var(--text-md)', fontVariantNumeric: 'tabular-nums' }}>{req.latency}</span></td>
                    <td><span style={{ fontSize: 12, fontWeight: 600, color: req.statusType === 'success' ? '#34D399' : '#FB7185' }}>{req.status}</span></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-lo)' }}>{req.time}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

      </div>

      </div>
    </div>
  )
}
